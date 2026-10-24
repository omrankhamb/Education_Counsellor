"""Aggregate NEET UG college/rank cutoffs from public MCC final allotment PDFs."""

from __future__ import annotations

import hashlib
import re
import time
from collections import defaultdict
from datetime import datetime, timezone
from io import BytesIO
from typing import Any
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
from pypdf import PdfReader

INDEX_URL = "https://mcc.nic.in/archive-ug/"
CURRENT_INDEX_URL = "https://mcc.nic.in/current-events-ug/"
OFFICIAL_FILE_HOSTS = {"cdnbbsr.s3waas.gov.in"}
_SPACE = re.compile(r"\s+")
_YEAR = re.compile(r"\b(202[2-6])\b")
_UNSUPPORTED_MCC_MATRIX_SOURCES = {
    "mcc-neet-ug-2024-3-final-result-round-3-ug-counselling-2024-93e44b6f":
        "Three-round status-matrix layout requires a dedicated round-specific parser.",
    "mcc-neet-ug-2025-3-final-allotment-result-for-round-3-of-ug-counselling-2025-1de56662":
        "Multi-round status-matrix layout is not supported by the single-round cutoff parser.",
    "mcc-neet-ug-2026-2-final-result-ug-round-2-counselling-2026-dated-12-09-2026-542406ae":
        "Multi-round status-matrix layout is not supported by the single-round cutoff parser.",
    "mcc-neet-ug-2026-3-final-allotment-result-for-ug-round-3-counselling-5ef1159b":
        "Multi-round status-matrix layout is not supported by the single-round cutoff parser.",
}


def _clean(value: str) -> str:
    return _SPACE.sub(" ", value or "").strip()


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", _clean(value).casefold()).strip("-")[:80]


def _normalized(value: str) -> str:
    return _clean(value).casefold()


def list_mcc_final_sources(html: str, official_index_url: str = INDEX_URL) -> list[dict[str, Any]]:
    """Find only official final allotment result links; skip notices and matrices."""
    soup = BeautifulSoup(html, "html.parser")
    sources = []
    for anchor in soup.select("a[href]"):
        title = _clean(anchor.get_text(" ", strip=True))
        title_lower = title.casefold()
        if "notice" in title_lower or not ("final result" in title_lower or "final allotment" in title_lower):
            continue
        url = anchor["href"].strip()
        if urlparse(url).hostname not in OFFICIAL_FILE_HOSTS:
            continue
        row = anchor.find_parent("tr")
        context = _clean(row.get_text(" ", strip=True) if row else title)
        year_match = _YEAR.search(context) or _YEAR.search(title)
        if not year_match:
            continue
        year = int(year_match.group(1))
        if year < 2022 or year > 2026:
            continue
        lower = title_lower
        if "special stray" in lower:
            round_no, round_label = 5, "MCC Special Stray"
            explicit = re.search(r"round\s*(ii|iii|iv|v|\d+)", lower)
            if explicit:
                suffix = explicit.group(1).upper()
                round_label += f" Round {suffix}"
        elif "stray vacancy" in lower or "stray vacacy" in lower:
            round_no, round_label = 4, "MCC Stray Vacancy"
        elif "mop up" in lower or "mop-up" in lower:
            round_no, round_label = 3, "MCC Mop-up"
            if "2nd" in lower or "second" in lower:
                round_no, round_label = 5, "MCC Second Mop-up"
        else:
            round_match = re.search(r"round\s*[- ]?(i{1,3}|iv|v|\d+)", lower)
            if not round_match:
                continue
            token = round_match.group(1).upper()
            roman = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5}
            round_no = int(token) if token.isdigit() else roman.get(token, 0)
            if not round_no:
                continue
            round_label = f"MCC Round {round_no}"
        sources.append({
            "source_id": f"mcc-neet-ug-{year}-{round_no}-{_slug(title)}-{hashlib.sha256(url.encode()).hexdigest()[:8]}",
            "authority": "Medical Counselling Committee (MCC)",
            "exam_family": "NEET UG",
            "admission_year": year,
            "academic_year": f"{year}-{str(year + 1)[-2:]}",
            "round": round_label,
            "round_title": title,
            "round_no": round_no,
            "url": url,
            "official_index_url": official_index_url,
            "source_format": "official-pdf-aggregate-only",
        })
    return sorted(sources, key=lambda item: (item["admission_year"], item["round_no"], item["source_id"]))


def _fragments_for_page(page: Any) -> list[tuple[str, float, float]]:
    fragments: list[tuple[str, float, float]] = []
    page.extract_text(visitor_text=lambda text, cm, tm, font, size: fragments.append(
        (text, round(float(tm[4]), 1), round(float(tm[5]), 1))
    ))
    return [(text, x, y) for text, x, y in fragments if _clean(text)]


def parse_mcc_final_pdf(pdf_bytes: bytes, source: dict[str, Any], checksum: str) -> list[dict[str, Any]]:
    """Return one aggregate cutoff per institute/course/quota/category.

    Candidate names, roll numbers, serial numbers, and individual allotments are
    used only in memory by the PDF reader and are never persisted.
    """
    reader = PdfReader(BytesIO(pdf_bytes))
    maxima: dict[tuple[str, str, str, str], dict[str, Any]] = {}
    now = datetime.now(timezone.utc).isoformat()
    rows_seen = 0
    for page in reader.pages:
        fragments = _fragments_for_page(page)
        by_y: dict[float, list[tuple[float, str]]] = defaultdict(list)
        for text, x, y in fragments:
            by_y[y].append((x, _clean(text)))
        row_starts = []
        for y, items in by_y.items():
            has_serial = any(15 <= x <= 28 and re.fullmatch(r"[0-9,]+", text.replace(" ", "")) for x, text in items)
            rank_items = [text.replace(",", "").replace(" ", "") for x, text in items
                          if 55 <= x <= 75 and re.fullmatch(r"[0-9,]+", text.replace(" ", ""))]
            if has_serial and rank_items:
                try:
                    rank = int(rank_items[0])
                except ValueError:
                    continue
                if rank > 0:
                    row_starts.append((y, rank))
        row_starts.sort(reverse=True)
        used_y: set[float] = set()
        for rank_y, rank in row_starts:
            if rank_y in used_y:
                continue
            used_y.add(rank_y)
            # MCC lays out one allotment on a two-line block. The rank baseline
            # is around y=539 and wrapped institute/quota text is around y=531.
            cells: dict[str, list[tuple[float, str]]] = defaultdict(list)
            for y, items in by_y.items():
                if rank_y - 9 <= y <= rank_y + 1:
                    for x, text in items:
                        if 82 <= x < 150:
                            cells["quota"].append((y, text))
                        elif 150 <= x < 570:
                            cells["college"].append((y, text))
                        elif 570 <= x < 697:
                            cells["program"].append((y, text))
                        elif 697 <= x < 740:
                            cells["allotted_category"].append((y, text))
            def cell(name: str) -> str:
                ordered = sorted(set(cells[name]), key=lambda item: (-item[0], item[1]))
                return _clean(" ".join(text for _, text in ordered))
            quota = cell("quota")
            college = cell("college")
            program = cell("program")
            category = cell("allotted_category")
            # Strip office metadata and repeated table labels that can appear in
            # wrapped cells at a page boundary.
            college = re.sub(r"\b(?:Allotted Institute|Course|Category|Quota)\b", "", college, flags=re.I)
            program = re.sub(r"\b(?:Course|Category|Quota)\b", "", program, flags=re.I)
            quota = re.sub(r"\bQuota\b", "", quota, flags=re.I)
            college, program, quota, category = map(_clean, (college, program, quota, category))
            if not college or not program or not category:
                continue
            # Keep only medical programmes present in MCC’s UG allotment table.
            if not re.search(r"\b(MBBS|BDS|B\.?Sc\.?\s*Nursing)\b", program, re.I):
                continue
            rows_seen += 1
            key = (_normalized(college), _normalized(program), _normalized(quota), _normalized(category))
            aggregate = maxima.get(key)
            if aggregate is None:
                maxima[key] = {
                    "college_name": college,
                    "branch_name": program,
                    "quota_section": quota or "MCC All India Quota",
                    "category": category,
                    "opening_rank": rank,
                    "closing_rank": rank,
                    "allotted_candidates_observed": 1,
                }
            else:
                aggregate["opening_rank"] = min(aggregate["opening_rank"], rank)
                aggregate["closing_rank"] = max(aggregate["closing_rank"], rank)
                aggregate["allotted_candidates_observed"] += 1

    records = []
    for key, aggregate in maxima.items():
        college = aggregate["college_name"]
        program = aggregate["branch_name"]
        quota = aggregate["quota_section"]
        category = aggregate["category"]
        college_code = "mcc-" + hashlib.sha256(_clean(college).casefold().encode()).hexdigest()[:12]
        program_code = _slug(program)
        identity = "|".join((source["source_id"], *key))
        closing_rank = int(aggregate["closing_rank"])
        records.append({
            "source_record_id": hashlib.sha256(identity.encode("utf-8")).hexdigest(),
            "source_id": source["source_id"],
            "authority": source["authority"],
            "source_url": source["url"],
            "source_index_url": source["official_index_url"],
            "source_sha256": checksum,
            "source_format": source["source_format"],
            "is_official_observed": True,
            "exam_type": "NEET",
            "stream": "Medical",
            "domain": "Medical",
            "college_code": college_code,
            "college_name": college,
            "program_code": program_code,
            "branch_name": program,
            "quota_section": quota,
            "category": category,
            "opening_rank": int(aggregate["opening_rank"]),
            "closing_rank": closing_rank,
            "merit_rank": closing_rank,
            "cutoff_score": float(closing_rank),
            "score_unit": "rank",
            "allotted_candidates_observed": int(aggregate["allotted_candidates_observed"]),
            "admission_year": source["admission_year"],
            "academic_year": source["academic_year"],
            "round": source["round"],
            "round_no": source["round_no"],
            "cutoff_observed_at": now,
        })
    if not records:
        raise ValueError(f"No medical rank cutoffs could be aggregated from {source['round_title']!r}; no rows saved.")
    return records


def parse_mcc_final_pdf_layout(pdf_bytes: bytes, source: dict[str, Any], checksum: str) -> list[dict[str, Any]]:
    """Parse the official MCC table's fixed-width layout, aggregating AIRs only."""
    known_issue = _UNSUPPORTED_MCC_MATRIX_SOURCES.get(source.get("source_id", ""))
    if known_issue:
        raise ValueError(f"Unsupported MCC status-matrix layout: {known_issue} No rows saved.")
    reader = PdfReader(BytesIO(pdf_bytes))
    maxima: dict[tuple[str, str, str, str], dict[str, Any]] = {}
    rows_seen = 0
    row_start = re.compile(r"^\s*(\d{1,6})\s+([\d,]+)\s+.*$")

    def aggregate_row(lines: list[str], rank: int) -> None:
        nonlocal rows_seen
        if not lines:
            return
        # MCC's layout export keeps the quota in the short column immediately
        # after NEET rank. Extract it from that field; searching the entire row
        # can accidentally absorb the institute, programme, and category.
        first_line = lines[0]
        start = row_start.match(first_line)
        quota_region = first_line[start.end(2):48] if start else first_line[18:38]
        quota_match = re.search(
            r"(Open\s+Seat|All\s+India|Delhi|Deemed/Pai\w*|Non-|B\.?Sc\.?|NRI|AIQ)",
            quota_region,
            re.I,
        )
        quota = _clean(quota_match.group(1)) if quota_match else _clean(first_line[20:34])
        quota_normalized = quota.casefold().rstrip(".")
        quota = {
            "open seat": "Open Seat",
            "all india": "All India",
            "delhi": "Delhi",
            "deemed/pai": "Deemed/Pai",
            "b.sc": "B.Sc",
            "bsc": "B.Sc",
            "aiq": "All India",
        }.get(quota_normalized, quota)
        college_text = _clean(" ".join(line[34:140].strip() for line in lines if len(line) > 34))
        program_text = _clean(" ".join(line[140:170].strip() for line in lines if len(line) > 140))
        category_text = _clean(" ".join(line[165:215].strip() for line in lines if len(line) > 165))
        college_parts = [_clean(part) for part in college_text.split(",") if _clean(part)]
        college = college_parts[0] if college_parts else ""
        if (college.casefold() in {"aiims", "medical college", "government medical college", "govt. medical college"}
                and len(college_parts) > 1):
            college = f"AIIMS, {college_parts[1]}"
            if college_parts[0].casefold() != "aiims":
                college = f"{college_parts[0]}, {college_parts[1]}"
        program_match = re.search(r"\b(MBBS|BDS|B\.?Sc\.?\s*Nursing)\b", program_text, re.I)
        program = "B.Sc. Nursing" if program_match and "nursing" in program_match.group(1).casefold() else (
            program_match.group(1).upper() if program_match else ""
        )
        category_matches = re.findall(
            r"\b(OPEN|OBC(?:-NCL)?|EWS|SC|ST|UR|GEN(?:ERAL)?|GN|PWD)\b",
            category_text,
            re.I,
        )
        category = category_matches[0].upper() if category_matches else ""
        candidate_category = category_matches[1].upper() if len(category_matches) > 1 else ""
        if not college or not program or not category:
            return
        rows_seen += 1
        key = (
            _normalized(college), _normalized(program), _normalized(quota),
            _normalized(category), _normalized(candidate_category),
        )
        row = maxima.get(key)
        if row is None:
            maxima[key] = {
                "college_name": college,
                "branch_name": program,
                "quota_section": quota or "MCC All India Quota",
                "category": category,
                "candidate_category": candidate_category,
                "opening_rank": rank,
                "closing_rank": rank,
                "allotted_candidates_observed": 1,
            }
        else:
            row["opening_rank"] = min(row["opening_rank"], rank)
            row["closing_rank"] = max(row["closing_rank"], rank)
            row["allotted_candidates_observed"] += 1

    for page in reader.pages:
        lines = (page.extract_text(extraction_mode="layout") or "").splitlines()
        current_lines: list[str] = []
        current_rank: int | None = None
        for line in lines:
            match = row_start.match(line)
            if match:
                if current_rank is not None:
                    aggregate_row(current_lines, current_rank)
                try:
                    current_rank = int(match.group(2).replace(",", ""))
                except ValueError:
                    current_rank = None
                    current_lines = []
                    continue
                current_lines = [line]
            elif current_rank is not None:
                current_lines.append(line)
        if current_rank is not None:
            aggregate_row(current_lines, current_rank)

    if not maxima:
        raise ValueError(f"No medical rank cutoffs could be aggregated from {source['round_title']!r}; no rows saved.")
    records = []
    now = datetime.now(timezone.utc).isoformat()
    for key, aggregate in maxima.items():
        college = aggregate["college_name"]
        program = aggregate["branch_name"]
        quota = aggregate["quota_section"]
        category = aggregate["category"]
        candidate_category = aggregate.get("candidate_category", "")
        college_code = "mcc-" + hashlib.sha256(_clean(college).casefold().encode()).hexdigest()[:12]
        program_code = _slug(program)
        identity = "|".join((source["source_id"], *key))
        closing_rank = int(aggregate["closing_rank"])
        records.append({
            "source_record_id": hashlib.sha256(identity.encode("utf-8")).hexdigest(),
            "source_id": source["source_id"],
            "authority": source["authority"],
            "source_url": source["url"],
            "source_index_url": source["official_index_url"],
            "source_sha256": checksum,
            "source_format": source["source_format"],
            "is_official_observed": True,
            "exam_type": "NEET",
            "stream": "Medical",
            "domain": "Medical",
            "college_code": college_code,
            "college_name": college,
            "program_code": program_code,
            "branch_name": program,
            "quota_section": quota,
            "category": category,
            "candidate_category": candidate_category,
            "opening_rank": int(aggregate["opening_rank"]),
            "closing_rank": closing_rank,
            "merit_rank": closing_rank,
            "cutoff_score": float(closing_rank),
            "score_unit": "rank",
            "allotted_candidates_observed": int(aggregate["allotted_candidates_observed"]),
            "admission_year": source["admission_year"],
            "academic_year": source["academic_year"],
            "round": source["round"],
            "round_no": source["round_no"],
            "cutoff_observed_at": now,
        })
    minimum_rows = max(100, len(reader.pages) // 10)
    if len(reader.pages) > 50 and len(records) < minimum_rows:
        raise ValueError(
            f"Unsupported MCC PDF table layout: {len(reader.pages)} pages produced "
            f"only {len(records)} aggregate cutoffs (expected at least {minimum_rows}); no rows saved."
        )
    return records


def sync_mcc_neet_official_sources(
    mongo_url: str,
    database_name: str,
    years: list[int] | None = None,
    limit_sources: int | None = None,
    skip_successful: bool = False,
) -> dict[str, Any]:
    """Fetch MCC PDFs, retain only aggregated college-level NEET AIR cutoffs."""
    from pymongo import MongoClient, UpdateOne
    from services.official_cutoff_data import calculate_cutoff_accuracy, build_project_domain_coverage

    client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    db = client[database_name]
    cutoffs = db["official_cutoffs"]
    runs = db["cutoff_ingestion_runs"]
    cutoffs.create_index("source_record_id", unique=True)
    runs.create_index([("source_id", 1), ("source_sha256", 1)], unique=True)
    headers = {"User-Agent": "EducationCounsellorOfficialDataSync/1.0"}
    sources = []
    for index_url in (INDEX_URL, CURRENT_INDEX_URL):
        index_response = httpx.get(index_url, timeout=60, headers=headers)
        index_response.raise_for_status()
        sources.extend(list_mcc_final_sources(index_response.text, index_url))
    sources = list({source["source_id"]: source for source in sources}.values())
    selected_years = set(years or [2022, 2023, 2024, 2025, 2026])
    sources = [source for source in sources if source["admission_year"] in selected_years]
    if skip_successful:
        completed_ids = {
            run["source_id"] for run in runs.find({"status": "success"}, {"source_id": 1, "_id": 0})
        }
        skipped = [source for source in sources if source["source_id"] in completed_ids]
        for source in skipped:
            print(f"{source['source_id']}: already loaded; skipped", flush=True)
        sources = [source for source in sources if source["source_id"] not in completed_ids]
    if limit_sources is not None:
        sources = sources[:limit_sources]
    summaries = []
    with httpx.Client(timeout=httpx.Timeout(180, connect=30), follow_redirects=True,
                      headers={"User-Agent": "EducationCounsellorOfficialDataSync/1.0"}) as session:
        for source in sources:
            started_at = datetime.now(timezone.utc).isoformat()
            try:
                response = session.get(source["url"])
                response.raise_for_status()
                pdf_bytes = response.content
                if not pdf_bytes.startswith(b"%PDF-"):
                    raise ValueError("MCC source URL did not return a PDF.")
                checksum = hashlib.sha256(pdf_bytes).hexdigest()
                records = parse_mcc_final_pdf_layout(pdf_bytes, source, checksum)
                # Drop the source bytes as soon as the aggregate rows are ready.
                source_size = len(pdf_bytes)
                del pdf_bytes
                for record in records:
                    record["imported_at"] = started_at
                result = cutoffs.bulk_write([
                    UpdateOne({"source_record_id": record["source_record_id"]}, {"$set": record}, upsert=True)
                    for record in records
                ], ordered=False)
                run_doc = {
                    "source_id": source["source_id"],
                    "authority": source["authority"],
                    "source_url": source["url"],
                    "source_index_url": source["official_index_url"],
                    "source_sha256": checksum,
                    "source_format": source["source_format"],
                    "admission_year": source["admission_year"],
                    "academic_year": source["academic_year"],
                    "round": source["round"],
                    "round_no": source["round_no"],
                    "round_title": source["round_title"],
                    "source_file_bytes": source_size,
                    "rows_parsed": len(records),
                    "rows_upserted": result.upserted_count,
                    "rows_modified": result.modified_count,
                    "status": "success",
                    "started_at": started_at,
                    "finished_at": datetime.now(timezone.utc).isoformat(),
                    "privacy_note": "Candidate-level rows were aggregated in memory; no candidate name, roll number, or individual record was stored.",
                }
                runs.update_one({"source_id": source["source_id"], "source_sha256": checksum}, {"$set": run_doc}, upsert=True)
                summaries.append(run_doc)
                print(f"{source['source_id']}: {len(records):,} aggregate cutoffs", flush=True)
            except Exception as exc:
                failure = {
                    "source_id": source["source_id"],
                    "authority": source["authority"],
                    "source_url": source["url"],
                    "admission_year": source["admission_year"],
                    "round": source["round"],
                    "round_no": source["round_no"],
                    "status": "failed",
                    "error": str(exc),
                    "started_at": started_at,
                    "finished_at": datetime.now(timezone.utc).isoformat(),
                }
                runs.update_one({"source_id": source["source_id"], "status": "failed"}, {"$set": failure}, upsert=True)
                summaries.append(failure)
                print(f"{source['source_id']}: failed: {exc}", flush=True)
            time.sleep(0.15)

    scoped_rows = list(cutoffs.find({"admission_year": {"$gte": 2022, "$lte": 2026}}, {"_id": 0}))
    report = calculate_cutoff_accuracy(scoped_rows)
    report["report_id"] = "official-cutoff-backtest-2022-2026"
    report["project_domain_coverage"] = build_project_domain_coverage(scoped_rows)
    report["sources_selected_this_run"] = len(sources)
    report["sources_successful_this_run"] = sum(item.get("status") == "success" for item in summaries)
    report["sources_failed_this_run"] = [
        {"source_id": item.get("source_id"), "error": item.get("error")}
        for item in summaries if item.get("status") != "success"
    ]
    latest_sources: dict[str, dict[str, Any]] = {}
    for item in runs.find({}, {"_id": 0}).sort("finished_at", -1):
        latest_sources.setdefault(item["source_id"], item)
    report["official_source_coverage"] = [
        {
            key: source.get(key) for key in (
                "source_id", "authority", "source_url", "source_index_url", "admission_year",
                "academic_year", "round", "round_no", "source_format", "rows_parsed", "status", "error",
            )
        }
        for source in sorted(
            latest_sources.values(),
            key=lambda row: (row.get("admission_year", 0), row.get("source_id", "")),
        )
    ]
    db["cutoff_accuracy_reports"].update_one({"report_id": report["report_id"]}, {"$set": report}, upsert=True)
    client.close()
    return {"selected_sources": len(sources), "successful_sources": report["sources_successful_this_run"],
            "failed_sources": report["sources_failed_this_run"], "official_rows_evaluated": report["official_rows_evaluated"]}
