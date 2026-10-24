"""Fetch and store source-attributed JoSAA opening/closing rank tables."""

from __future__ import annotations

import hashlib
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from bs4 import BeautifulSoup

ARCHIVE_URL = "https://josaa.admissions.nic.in/applicant/seatmatrix/OpeningClosingRankArchieve.aspx"
CURRENT_URL = "https://josaa.admissions.nic.in/Applicant/SeatAllotmentResult/currentorcr.aspx"
INDEX_URL = "https://josaa.nic.in/or-cr/"
OFFICIAL_HOSTS = {"josaa.admissions.nic.in"}
BUTTON_NAME = "ctl00$ContentPlaceHolder1$btnSubmit"
_SPACE = re.compile(r"\s+")


def _clean(value: str) -> str:
    return _SPACE.sub(" ", value or "").strip()


def _normalized(value: str) -> str:
    return _clean(value).casefold()


def _select_name(soup: BeautifulSoup, suffix: str) -> str:
    match = next(
        (node.get("name") for node in soup.select("select[name]")
         if (node.get("name") or "").rsplit("$", 1)[-1].casefold() == suffix.casefold()),
        None,
    )
    if not match:
        raise ValueError(f"JoSAA page is missing expected filter {suffix!r}.")
    return match


def _form_values(soup: BeautifulSoup) -> dict[str, str]:
    values: dict[str, str] = {}
    for node in soup.select("input[name]"):
        if node.get("type") in {"hidden", "submit"}:
            values[node["name"]] = node.get("value", "")
    for node in soup.select("select[name]"):
        selected = node.select_one("option[selected]")
        if selected:
            values[node["name"]] = selected.get("value", "")
    return values


def _options(soup: BeautifulSoup, suffix: str) -> list[tuple[str, str]]:
    node = soup.find("select", {"name": _select_name(soup, suffix)})
    return [
        (str(option.get("value", "")), _clean(option.get_text(" ", strip=True)))
        for option in node.select("option")
        if option.get("value") not in (None, "", "0")
    ]


def _post_filter(
    client: httpx.Client,
    current: BeautifulSoup,
    selections: dict[str, str],
) -> tuple[BeautifulSoup, bytes]:
    data = _form_values(current)
    data[BUTTON_NAME] = "Submit"
    for suffix, value in selections.items():
        data[_select_name(current, suffix)] = value
    response = client.post(
        str(client.base_url),
        data=data,
        headers={"Referer": str(client.base_url)},
        timeout=60,
    )
    response.raise_for_status()
    return BeautifulSoup(response.text, "html.parser"), response.content


def _parse_rank(value: str) -> tuple[int, str]:
    # Some historical JoSAA HTML renders whole ranks with a trailing .0.
    match = re.fullmatch(r"\s*(\d+)(?:\.0+)?\s*([Pp]?)\s*", value or "")
    if not match:
        raise ValueError(f"Unrecognized JoSAA rank value: {value!r}")
    return int(match.group(1)), match.group(2).upper()


def parse_josaa_html(
    html: bytes,
    year: int,
    round_no: int,
    source_url: str,
    checksum: str,
    institute_codes: dict[str, str],
    program_codes: dict[str, str],
    source_id: str,
) -> list[dict[str, Any]]:
    """Parse all rank rows; the portal does not expose candidate-level data here."""
    soup = BeautifulSoup(html, "html.parser")
    grid = soup.select_one("table[id$='GridView1']")
    if not grid:
        message = soup.find(id=re.compile(r"lblmsg$", re.I))
        raise ValueError(f"JoSAA returned no rank table: {_clean(message.get_text()) if message else 'table absent'}")
    now = datetime.now(timezone.utc).isoformat()
    records: list[dict[str, Any]] = []
    for tr in grid.select("tr"):
        cells = tr.find_all("td", recursive=False)
        if len(cells) < 7:
            continue
        college_name = _clean(cells[0].get_text(" ", strip=True))
        branch_span = tr.select_one("span[id$='_lblBranch']")
        quota_span = tr.select_one("span[id$='_lblQuota']")
        category_span = tr.select_one("span[id$='_lblCategory']")
        gender_span = tr.select_one("span[id$='_lblGender']")
        opening_span = tr.select_one("span[id$='_lblOpenRank']")
        closing_span = tr.select_one("span[id$='_lblCloseRank']")
        if not all((branch_span, quota_span, category_span, gender_span, opening_span, closing_span)):
            continue
        branch = _clean(branch_span.get_text(" ", strip=True))
        quota = _clean(quota_span.get_text(" ", strip=True))
        category = _clean(category_span.get_text(" ", strip=True))
        gender = _clean(gender_span.get_text(" ", strip=True))
        opening_rank, opening_suffix = _parse_rank(_clean(opening_span.get_text(" ", strip=True)))
        closing_rank, closing_suffix = _parse_rank(_clean(closing_span.get_text(" ", strip=True)))
        institute_code = institute_codes.get(_normalized(college_name), "")
        program_code = program_codes.get(_normalized(branch), "")
        # JoSAA institute codes use 1xxx for IITs, 2xxx for NITs, 3xxx for IIITs,
        # and 4xxx for other government-funded institutes.
        code_prefix = institute_code[:1]
        is_iit = code_prefix == "1" or college_name.casefold().startswith("indian institute of science")
        if code_prefix not in {"1", "2", "3", "4"} and not is_iit:
            raise ValueError(f"JoSAA institute code could not be classified: {college_name!r} ({institute_code!r})")
        exam_type = "JEE Advanced" if is_iit else "JEE Main"
        score_unit = "preparatory_rank" if closing_suffix else "rank"
        identity = "|".join((source_id, institute_code or college_name, program_code or branch,
                             quota, category, gender, str(opening_rank), str(closing_rank)))
        records.append({
            "source_record_id": hashlib.sha256(identity.encode("utf-8")).hexdigest(),
            "source_id": source_id,
            "authority": "Joint Seat Allocation Authority (JoSAA)",
            "source_url": source_url,
            "source_index_url": INDEX_URL,
            "source_sha256": checksum,
            "source_format": "official-html",
            "is_official_observed": True,
            "exam_type": exam_type,
            "stream": "Engineering",
            "domain": "Engineering",
            "college_code": institute_code or college_name,
            "college_name": college_name,
            "institute_type": {"1": "IIT", "2": "NIT", "3": "IIIT", "4": "GFTI"}.get(code_prefix, "Other JoSAA institute"),
            "program_code": program_code or branch,
            "branch_name": branch,
            "quota_section": quota,
            "quota": quota,
            "seat_type": category,
            "category": category,
            "gender": gender,
            "opening_rank": opening_rank,
            "opening_rank_suffix": opening_suffix,
            "closing_rank": closing_rank,
            "closing_rank_suffix": closing_suffix,
            "merit_rank": closing_rank,
            "cutoff_score": float(closing_rank),
            "score_unit": score_unit,
            "rank_basis": "CRL" if category.casefold() == "open" else "category_rank",
            "admission_year": year,
            "academic_year": f"{year}-{str(year + 1)[-2:]}",
            "round": f"JoSAA Round {round_no}",
            "round_no": round_no,
            "cutoff_observed_at": now,
        })
    if not records:
        raise ValueError("JoSAA rank table was present, but no valid rows were parsed.")
    return records


def _selected_year(client: httpx.Client, year: int, use_current: bool) -> tuple[BeautifulSoup, list[tuple[str, str]]]:
    source_url = CURRENT_URL if use_current else ARCHIVE_URL
    response = client.get(source_url, timeout=60)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    if use_current:
        rounds = _options(soup, "ddlroundno")
        return soup, rounds
    available = dict(_options(soup, "ddlYear"))
    if str(year) not in available:
        raise ValueError(f"JoSAA archive does not list year {year}.")
    soup, _ = _post_filter(client, soup, {"ddlYear": str(year)})
    return soup, _options(soup, "ddlroundno")


def fetch_round(
    client: httpx.Client,
    year: int,
    round_no: int,
    use_current: bool,
    base_page: BeautifulSoup,
    available_rounds: list[tuple[str, str]],
) -> tuple[bytes, str, dict[str, str], dict[str, str], str]:
    source_url = CURRENT_URL if use_current else ARCHIVE_URL
    if str(round_no) not in {value for value, _ in available_rounds}:
        raise ValueError(f"JoSAA {year} does not list round {round_no}.")
    year_selection = {} if use_current else {"ddlYear": str(year)}
    page, _ = _post_filter(client, base_page, {**year_selection, "ddlroundno": str(round_no)})
    page, _ = _post_filter(client, page, {"ddlInstype": "ALL"})
    institute_codes = {
        _normalized(name): code for code, name in _options(page, "ddlInstitute") if code != "ALL"
    }
    page, _ = _post_filter(client, page, {"ddlInstitute": "ALL"})
    program_codes = {
        _normalized(name): code for code, name in _options(page, "ddlBranch") if code != "ALL"
    }
    page, _ = _post_filter(client, page, {"ddlBranch": "ALL"})
    page, html = _post_filter(client, page, {"ddlSeatType": "ALL"})
    if not _options(page, "ddlSeatType"):
        # The current JoSAA route capitalizes this control differently; the
        # suffix lookup is case-insensitive, so this guards a damaged response.
        raise ValueError("JoSAA seat-type control disappeared before result submission.")
    checksum = hashlib.sha256(html).hexdigest()
    return html, checksum, institute_codes, program_codes, source_url


def sync_josaa_official_sources(
    mongo_url: str,
    database_name: str,
    cache_dir: str,
    years: list[int] | None = None,
    rounds_by_year: dict[int, list[int]] | None = None,
    skip_successful: bool = False,
) -> dict[str, Any]:
    """Fetch complete all-institute JoSAA rank tables and upsert to MongoDB."""
    from pymongo import MongoClient, UpdateOne
    from services.official_cutoff_data import calculate_cutoff_accuracy, build_project_domain_coverage

    selected_years = sorted(set(years or [2022, 2023, 2024, 2025, 2026]))
    if any(year < 2022 or year > 2026 for year in selected_years):
        raise ValueError("JoSAA import years must be between 2022 and 2026.")
    cache_root = Path(cache_dir)
    cache_root.mkdir(parents=True, exist_ok=True)
    client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    db = client[database_name]
    cutoffs = db["official_cutoffs"]
    runs = db["cutoff_ingestion_runs"]
    cutoffs.create_index("source_record_id", unique=True)
    cutoffs.create_index([("exam_type", 1), ("admission_year", -1), ("round_no", -1),
                          ("college_code", 1), ("program_code", 1), ("category", 1)])
    runs.create_index([("source_id", 1), ("source_sha256", 1)], unique=True)
    summaries: list[dict[str, Any]] = []

    for year in selected_years:
        current = year == 2026
        with httpx.Client(
            base_url=CURRENT_URL if current else ARCHIVE_URL,
            timeout=60,
            follow_redirects=True,
            headers={"User-Agent": "EducationCounsellorOfficialDataSync/1.0"},
        ) as session:
            base_page, available_rounds = _selected_year(session, year, current)
            selected_rounds = (
                rounds_by_year.get(year, []) if rounds_by_year and year in rounds_by_year
                else [int(value) for value, _ in available_rounds]
            )
            available_values = {int(value) for value, _ in available_rounds}
            if skip_successful:
                skipped_rounds = [round_no for round_no in selected_rounds if runs.find_one({
                    "source_id": f"josaa-orcr-{year}-round-{round_no}", "status": "success"
                })]
                for round_no in skipped_rounds:
                    summaries.append({"source_id": f"josaa-orcr-{year}-round-{round_no}", "status": "skipped"})
                selected_rounds = [round_no for round_no in selected_rounds if round_no not in skipped_rounds]
                for round_no in skipped_rounds:
                    print(f"josaa-orcr-{year}-round-{round_no}: already loaded; skipped", flush=True)
            if not selected_rounds:
                continue

            def fetch_job(round_no: int) -> tuple[int, str, bytes, str, dict[str, str], dict[str, str], str, list[dict[str, Any]], str]:
                source_id = f"josaa-orcr-{year}-round-{round_no}"
                # Each round uses its own cookie jar and sequential server-side
                # filters. A few round queries can run concurrently without
                # issuing a high-volume request burst to the public portal.
                with httpx.Client(
                    base_url=CURRENT_URL if current else ARCHIVE_URL,
                    cookies=dict(session.cookies),
                    timeout=60,
                    follow_redirects=True,
                    headers={"User-Agent": "EducationCounsellorOfficialDataSync/1.0"},
                ) as source_client:
                    html, checksum, institute_codes, program_codes, source_url = fetch_round(
                        source_client, year, round_no, current,
                        BeautifulSoup(str(base_page), "html.parser"), available_rounds,
                    )
                    records = parse_josaa_html(
                        html, year, round_no, source_url, checksum,
                        institute_codes, program_codes, source_id,
                    )
                    cache_path = cache_root / f"{source_id}.html"
                    cache_path.write_bytes(html)
                    return (round_no, source_id, html, checksum, institute_codes, program_codes,
                            source_url, records, datetime.now(timezone.utc).isoformat())

            worker_count = min(3, max(1, len(selected_rounds)))
            with ThreadPoolExecutor(max_workers=worker_count) as pool:
                jobs = {pool.submit(fetch_job, round_no): round_no for round_no in selected_rounds}
                for future in as_completed(jobs):
                    round_no = jobs[future]
                    source_id = f"josaa-orcr-{year}-round-{round_no}"
                    started_at = datetime.now(timezone.utc).isoformat()
                    try:
                        (round_no, source_id, html, checksum, _, _, source_url, records, fetched_at) = future.result()
                        for row in records:
                            row["imported_at"] = fetched_at
                        result = cutoffs.bulk_write([
                            UpdateOne({"source_record_id": row["source_record_id"]}, {"$set": row}, upsert=True)
                            for row in records
                        ], ordered=False)
                        run_doc = {
                            "source_id": source_id,
                            "authority": "Joint Seat Allocation Authority (JoSAA)",
                            "source_url": source_url,
                            "source_index_url": INDEX_URL,
                            "source_sha256": checksum,
                            "source_format": "official-html",
                            "admission_year": year,
                            "academic_year": f"{year}-{str(year + 1)[-2:]}",
                            "round": f"JoSAA Round {round_no}",
                            "round_no": round_no,
                            "source_file_bytes": len(html),
                            "rows_parsed": len(records),
                            "rows_upserted": result.upserted_count,
                            "rows_modified": result.modified_count,
                            "status": "success",
                            "started_at": started_at,
                            "finished_at": datetime.now(timezone.utc).isoformat(),
                        }
                        runs.update_one(
                            {"source_id": source_id, "source_sha256": checksum},
                            {"$set": run_doc}, upsert=True,
                        )
                        summaries.append(run_doc)
                        print(f"{source_id}: {len(records):,} rows", flush=True)
                    except Exception as exc:
                        failure = {
                            "source_id": source_id,
                            "authority": "Joint Seat Allocation Authority (JoSAA)",
                            "source_url": CURRENT_URL if current else ARCHIVE_URL,
                            "admission_year": year,
                            "round": f"JoSAA Round {round_no}",
                            "status": "failed",
                            "error": str(exc),
                            "started_at": started_at,
                            "finished_at": datetime.now(timezone.utc).isoformat(),
                        }
                        runs.update_one({"source_id": source_id, "status": "failed"}, {"$set": failure}, upsert=True)
                        summaries.append(failure)
                        print(f"{source_id}: failed: {exc}", flush=True)
                    if round_no not in available_values:
                        raise ValueError(f"Requested JoSAA round {round_no} is absent for {year}.")

    scoped_rows = list(cutoffs.find(
        {"admission_year": {"$gte": 2022, "$lte": 2026}},
        {"_id": 0},
    ))
    report = calculate_cutoff_accuracy(scoped_rows)
    report["report_id"] = "official-cutoff-backtest-2022-2026"
    report["project_domain_coverage"] = build_project_domain_coverage(scoped_rows)
    report["sources_selected_this_run"] = len(summaries)
    report["sources_successful_this_run"] = sum(item.get("status") == "success" for item in summaries)
    report["sources_failed_this_run"] = [
        {"source_id": item.get("source_id"), "error": item.get("error")}
        for item in summaries if item.get("status") != "success"
    ]
    latest_sources: dict[str, dict[str, Any]] = {}
    for item in runs.find({"status": "success"}, {"_id": 0}).sort("finished_at", -1):
        latest_sources.setdefault(item["source_id"], item)
    report["official_source_coverage"] = [
        {
            key: source.get(key) for key in (
                "source_id", "authority", "source_url", "source_index_url", "admission_year",
                "academic_year", "round", "round_no", "source_format", "rows_parsed", "status",
            )
        }
        for source in sorted(latest_sources.values(), key=lambda row: (row.get("admission_year", 0), row.get("source_id", "")))
    ]
    db["cutoff_accuracy_reports"].update_one(
        {"report_id": report["report_id"]}, {"$set": report}, upsert=True
    )
    client.close()
    return {
        "selected_sources": len(summaries),
        "successful_sources": sum(item.get("status") == "success" for item in summaries),
        "failed_sources": [item for item in summaries if item.get("status") != "success"],
        "official_rows_evaluated": report["official_rows_evaluated"],
        "accuracy_by_exam_and_domain": report["accuracy_by_exam_and_domain"],
        "report_id": report["report_id"],
    }
