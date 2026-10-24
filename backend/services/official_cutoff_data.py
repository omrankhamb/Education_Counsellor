"""Official admission cutoff ingestion and historical cutoff backtesting.

Records in this module retain the originating portal, source URL, academic year,
round, quota, category, and source-file checksum. It deliberately does not create
or infer cutoff values for missing records.
"""

from __future__ import annotations

import hashlib
import io
import re
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Iterable

import httpx
from pypdf import PdfReader


def _build_mahacet_sources() -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []
    for year, base_url, last_round in (
        (2022, "https://fe2024.mahacet.org/2022", 3),
        (2023, "https://fe2024.mahacet.org/2023", 3),
        (2024, "https://fe2026.mahacet.org/2024", 3),
        (2025, "https://fe2026.mahacet.org/2025", 4),
        (2026, "https://cappublicdocs2026.blob.core.windows.net/documents", 4),
    ):
        for round_no in range(1, last_round + 1):
            for quota in ("MH", "AI"):
                if year < 2026:
                    suffix = "CutOff.pdf" if quota == "MH" else "AI_CutOff.pdf"
                    filename = f"{year}ENGG_CAP{round_no}_{suffix}"
                else:
                    suffix = "MH_CutOff_V1.pdf" if round_no == 1 and quota == "MH" else f"{quota}_CutOff.pdf"
                    filename = f"2026ENGG_CAP{round_no}_{suffix}"
                sources.append({
                    "source_id": f"mahacet-fe-{year}-cap{round_no}-{quota.lower()}",
                    "authority": "Government of Maharashtra, State Common Entrance Test Cell",
                    "exam_family": "MHT-CET / JEE Main Maharashtra CAP",
                    "admission_year": year,
                    "academic_year": f"{year}-{str(year + 1)[-2:]}",
                    "round": f"CAP Round {round_no}",
                    "round_no": round_no,
                    "quota_file": quota,
                    "url": f"{base_url}/{filename}",
                    "parser": "mh" if quota == "MH" else "ai",
                    "official_index_url": (
                        "https://fe2024.mahacet.org/StaticPages/HomePage"
                        if year <= 2024 else "https://fe2026.mahacet.org/StaticPages/HomePage"
                    ),
                })
    return sources


MAHACET_SOURCES = _build_mahacet_sources()

# Other domains have official portals, but no common public cutoff export that can
# safely be ingested by the Maharashtra parser. The registry prevents these from
# being misrepresented as loaded/verified data.
DOMAIN_SOURCE_STATUS = {
    "JEE Main / JEE Advanced": {
        "authority": "JoSAA",
        "url": "https://josaa.nic.in/or-cr/",
        "status": "official-source-adapter-implemented; ingestion-in-progress",
        "note": "JoSAA publishes round, program, seat-type, gender, quota, and rank tables through an interactive portal.",
    },
    "NEET UG": {
        "authority": "Medical Counselling Committee",
        "url": "https://mcc.nic.in/current-events-ug/",
        "status": "official-source-identified; result-adapter-not-yet-available",
        "note": "MCC publishes allotment files; state-quota cutoffs are published separately by each state authority.",
    },
    "CLAT / AILET": {
        "authority": "Consortium of NLUs / National Law University Delhi",
        "url": "https://consortiumofnlus.ac.in/",
        "status": "official-source-identified; adapter-not-yet-available",
        "note": "Counselling rounds and participating institutes are published by the respective authorities.",
    },
    "CUET UG": {
        "authority": "National Testing Agency and participating universities",
        "url": "https://cuet.nta.nic.in/",
        "status": "decentralized; official-university-adapters-required",
        "note": "There is no single national college cutoff table; each university allocates seats separately.",
    },
    "NID / NIFT / UCEED": {
        "authority": "NID / NIFT / IIT Bombay",
        "url": "https://admissions.nid.edu/",
        "status": "official-source-identified; adapter-not-yet-available",
        "note": "Rank and seat-allocation data are published by separate exam authorities and may not expose public closing ranks.",
    },
    "12th Board / direct merit": {
        "authority": "Individual universities and state admission authorities",
        "url": "",
        "status": "decentralized; official-institution-adapters-required",
        "note": "There is no nationwide official cutoff feed for direct-merit admissions.",
    },
}

PROJECT_DOMAINS = (
    "Engineering", "Medical", "Law", "Design", "Commerce", "Science", "Arts",
)


def pdf_text(pdf_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


_COLLEGE = re.compile(r"^(\d{4,5})\s*-\s*(.+)$")
_COURSE = re.compile(r"^(\d{9,10})\s*-\s*(.+)$")
_PAIR = re.compile(r"(\d+)\s*\n*\s*\(([0-9.]+)\)")
_CATEGORY_STOP = {"STAGE", "STATUS", "I", "II", "III", "IV", "VII", "STATE", "LEVEL", "DIR", "CUT", "OFF"}
_SECTION_NAMES = (
    "State Level",
    "Home University Seats Allotted to Home University Candidates",
    "Other Than Home University Seats Allotted to Other Than Home University Candidates",
    "Home University Seats Allotted to Other Than Home University Candidates",
    "Other Than Home University Seats Allotted to Home University Candidates",
    "Minority Seats Allotted to Maharashtra State Candidature Candidates",
)


def _parse_category_section(section_text: str, source_section: str) -> list[dict[str, Any]]:
    pairs = _PAIR.findall(section_text)
    first_pair = _PAIR.search(section_text)
    category_text = section_text[: first_pair.start()] if first_pair else section_text
    category_text = re.sub(r"([A-Z]+)\s+([SHO])\b", r"\1\2", category_text)
    category_tokens = []
    for token in category_text.split():
        cleaned = re.sub(r"[^A-Z0-9]", "", token)
        if cleaned and not cleaned.isdigit() and cleaned not in _CATEGORY_STOP and len(cleaned) >= 2:
            category_tokens.append(cleaned)
    result = []
    for index, (rank, percentile) in enumerate(pairs[: len(category_tokens)]):
        result.append({
            "quota_section": source_section,
            "category": category_tokens[index],
            "merit_rank": int(rank),
            "cutoff_score": float(percentile),
            "score_unit": "percentile",
        })
    return result


def parse_mahacet_mh_text(text: str, source: dict[str, Any], checksum: str) -> list[dict[str, Any]]:
    """Parse Maharashtra/Home-University CAP PDF tables into exact category rows."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    records: list[dict[str, Any]] = []
    current_code = current_name = ""
    i = 0
    while i < len(lines):
        college_match = _COLLEGE.match(lines[i])
        if college_match and not _COURSE.match(lines[i]):
            current_code = college_match.group(1).zfill(5)
            current_name = college_match.group(2).strip()
            i += 1
            continue

        course_match = _COURSE.match(lines[i])
        if not course_match:
            i += 1
            continue

        course_code, course_name = course_match.groups()
        i += 1
        body_lines = []
        while i < len(lines) and not _COURSE.match(lines[i]) and not _COLLEGE.match(lines[i]):
            body_lines.append(lines[i])
            i += 1
        body = "\n".join(body_lines)
        status_match = re.search(r"Status:\s*([^\n\r]+)", body)
        status = status_match.group(1).strip() if status_match else ""
        positions = []
        for section_name in _SECTION_NAMES:
            positions.extend((match.start(), section_name) for match in re.finditer(re.escape(section_name), body))
        positions.sort(key=lambda item: item[0])
        if not positions:
            positions = [(0, "Unlabelled official section")]
        cutoffs = []
        for j, (start, section_name) in enumerate(positions):
            offset = len(section_name) if section_name != "Unlabelled official section" else 0
            end = positions[j + 1][0] if j + 1 < len(positions) else len(body)
            cutoffs.extend(_parse_category_section(body[start + offset : end], section_name))

        for cutoff in cutoffs:
            cutoff.update({
                "source_record_id": hashlib.sha256(
                    f"{source['source_id']}|{current_code}|{course_code}|{cutoff['quota_section']}|{cutoff['category']}".encode()
                ).hexdigest(),
                "source_id": source["source_id"],
                "authority": source["authority"],
                "source_url": source["url"],
                "source_index_url": source["official_index_url"],
                "source_sha256": checksum,
                "source_format": "official-pdf",
                "is_official_observed": True,
                "exam_type": "MHT-CET",
                "stream": "Engineering",
                "domain": "Engineering",
                "college_code": current_code,
                "college_name": current_name,
                "program_code": course_code,
                "branch_name": course_name,
                "college_status": status,
                "admission_year": source["admission_year"],
                "academic_year": source["academic_year"],
                "round": source["round"],
                "round_no": source["round_no"],
                "cutoff_observed_at": datetime.now(timezone.utc).isoformat(),
            })
            records.append(cutoff)
    return records


_AI_ROW = re.compile(
    r"(?P<college_code>\d{5})\s*-\s*(?P<college_name>.*?)\s*"
    r"(?P<program_code>\d{10})(?P<merit_rank>\d+)\s*"
    r"\((?P<score>[0-9]+(?:\.[0-9]+)?)\)\s*(?P<serial>\d+)\s*"
    r"(?P<seat_type>AI|MH|MI)(?P<institute_type>AI|MH|MI)\s*to\s*"
    r"(?P<seat_to>AI|MH|MI)(?P<exam>JEE(?:\(Main\)(?:-\d{4})?)?|MHT-CET|NEET(?:[ -]\d{4})?)"
    r"(?P<branch>.*?)(?=(?:\d{5}\s*-)|Page\s+\d+\s+of\s+\d+|"
    r"Cut Off Indicates|$)",
    re.IGNORECASE | re.DOTALL,
)

# 2022-23 All-India PDFs concatenate the institute name, 7-digit choice code,
# merit rank, score and serial number in the extracted PDF text. Keep the
# institute heading in the match so rows are tied to the correct college.
_AI_ROW_LEGACY = re.compile(
    r"(?P<college_code>\d{4,5})\s*-\s*"
    r"(?P<college_name>[A-Za-z'\"(][\s\S]*?)"
    r"(?P<program_code>\d{7})(?P<merit_rank>\d+)\s*"
    r"\((?P<score>[0-9]+(?:\.[0-9]+)?)\)\s*(?P<serial>\d+)\s*"
    r"(?P<seat_type>AI|MH|MI)(?P<institute_type>AI|MH|MI)\s+to\s+"
    r"(?P<seat_to>AI|MH|MI)(?P<exam>JEE(?:\(Main\)(?:-\d{4})?)?|"
    r"MHT-CET|NEET(?:[ -]\d{4})?)\s*(?P<branch>.*?)"
    r"(?=^\d{4,5}\s*-\s*[A-Za-z'\"(]|Page\s+\d+\s+of\s+\d+|"
    r"Cut Off Indicates|$)",
    re.IGNORECASE | re.MULTILINE | re.DOTALL,
)


def _normalize_ai_exam(value: str) -> str:
    normalized = re.sub(r"\s+", "", value).upper()
    if normalized.startswith("MHT-CET"):
        return "MHT-CET"
    if normalized.startswith("JEE"):
        return "JEE Main"
    if normalized.startswith("NEET"):
        return "NEET"
    return value.strip()


def parse_mahacet_ai_text(text: str, source: dict[str, Any], checksum: str) -> list[dict[str, Any]]:
    """Parse All-India CAP rows, retaining the distinct rank and score fields.

    A course name can wrap across PDF text lines, so continuation lines are
    appended until the next allotment row or institute heading.
    """
    records = []
    matches = list(_AI_ROW.finditer(text)) + list(_AI_ROW_LEGACY.finditer(text))
    for match in sorted(matches, key=lambda item: item.start()):
        row = match.groupdict()
        exam = _normalize_ai_exam(row["exam"])
        branch = re.sub(r"\s+", " ", row.get("branch") or "").strip()
        branch = re.sub(r"(?:Cut Off List for All India Seats.*|and Technology \(.*|Candidature Candidates.*)$", "", branch, flags=re.IGNORECASE).strip()
        if exam not in {"JEE Main", "MHT-CET", "NEET"}:
            continue
        source_college_code = row["college_code"]
        college_code = source_college_code.zfill(5)
        college_name = re.sub(r"\s+", " ", row["college_name"]).strip()
        # In the official choice code, the first five digits identify the
        # institute. Reject matches where the PDF text has split/corrupted it.
        if not row["program_code"].startswith(source_college_code) or not branch:
            continue
        record_id = f"{source['source_id']}|{college_code}|{row['program_code']}|{row['seat_type']}|{row['seat_to']}|{exam}"
        records.append({
            "source_record_id": hashlib.sha256(record_id.encode()).hexdigest(),
            "source_id": source["source_id"],
            "authority": source["authority"],
            "source_url": source["url"],
            "source_index_url": source["official_index_url"],
            "source_sha256": checksum,
            "source_format": "official-pdf",
            "is_official_observed": True,
            "exam_type": exam,
            "stream": "Engineering",
            "domain": "Engineering",
            "college_code": college_code,
            "college_name": college_name,
            "program_code": row["program_code"],
            "branch_name": branch,
            "institute_type": row["institute_type"],
            "seat_type": row["seat_type"],
            "seat_to": row["seat_to"],
            "category": row["seat_to"],
            "serial_no": int(row["serial"]),
            "merit_rank": int(row["merit_rank"]),
            "cutoff_score": float(row["score"]),
            "score_unit": "official_exam_score" if exam == "NEET" else "percentile",
            "quota_section": "All India CAP seats",
            "admission_year": source["admission_year"],
            "academic_year": source["academic_year"],
            "round": source["round"],
            "round_no": source["round_no"],
            "cutoff_observed_at": datetime.now(timezone.utc).isoformat(),
        })
    return records


def parse_mahacet_pdf(pdf_bytes: bytes, source: dict[str, Any]) -> tuple[list[dict[str, Any]], str]:
    checksum = hashlib.sha256(pdf_bytes).hexdigest()
    text = pdf_text(pdf_bytes)
    parser = parse_mahacet_mh_text if source["parser"] == "mh" else parse_mahacet_ai_text
    return parser(text, source, checksum), checksum


def _round_movement_metrics(records: Iterable[dict[str, Any]]) -> dict[str, Any]:
    # These are the percentile relaxations currently hard-coded by the CAP
    # simulator. CAP IV is reported descriptively: it is not the simulator's
    # separate institutional/spot round.
    round_targets = {2: 0.65, 3: 1.45}
    by_dimension: dict[tuple, dict[int, dict[str, float]]] = defaultdict(dict)
    for row in records:
        if row.get("score_unit") != "percentile":
            continue
        dimension = (
            row.get("admission_year"), row.get("exam_type"), row.get("college_code"),
            row.get("program_code"), row.get("quota_section"), row.get("category"),
            row.get("seat_type", ""), row.get("gender", ""),
        )
        by_dimension[dimension][int(row.get("round_no", 0))] = {
            "cutoff_score": float(row["cutoff_score"]),
            "merit_rank": float(row["merit_rank"]) if row.get("merit_rank") is not None else None,
        }

    movements: dict[tuple[str, str, int], list[float]] = defaultdict(list)
    rank_movements: dict[tuple[str, str, int], list[float]] = defaultdict(list)
    errors: dict[tuple[str, str, int], list[float]] = defaultdict(list)
    for dimension, rounds in by_dimension.items():
        if 1 not in rounds:
            continue
        admission_year, exam_type = dimension[:2]
        for round_no in (2, 3, 4):
            if round_no in rounds:
                observed_relaxation = rounds[1]["cutoff_score"] - rounds[round_no]["cutoff_score"]
                key = (str(admission_year), str(exam_type), round_no)
                movements[key].append(observed_relaxation)
                if rounds[1]["merit_rank"] is not None and rounds[round_no]["merit_rank"] is not None:
                    rank_movements[key].append(rounds[round_no]["merit_rank"] - rounds[1]["merit_rank"])
                if round_no in round_targets:
                    errors[key].append(abs(observed_relaxation - round_targets[round_no]))

    result = {}
    for key, observed in sorted(movements.items()):
        year, exam_type, round_no = key
        mae_values = errors.get(key, [])
        rank_values = rank_movements.get(key, [])
        result.setdefault(exam_type, {}).setdefault(year, {})[f"CAP Round {round_no}"] = {
            "matched_cutoff_series": len(observed),
            "observed_mean_cutoff_relaxation_percentile_points": round(sum(observed) / len(observed), 4),
            "observed_median_cutoff_relaxation_percentile_points": round(sorted(observed)[len(observed) // 2], 4),
            "series_with_relaxation": sum(value > 0 for value in observed),
            "series_total": len(observed),
            "observed_mean_closing_rank_movement": round(sum(rank_values) / len(rank_values), 2) if rank_values else None,
            "simulator_expected_relaxation_percentile_points": round_targets.get(round_no),
            "simulator_relaxation_mean_absolute_error_percentile_points": round(sum(mae_values) / len(mae_values), 4) if mae_values else None,
            "simulator_relaxation_within_0_5_points_pct": round(100 * sum(value <= 0.5 for value in mae_values) / len(mae_values), 2) if mae_values else None,
        }
    return result


def _year_over_year_metrics(records: Iterable[dict[str, Any]]) -> dict[str, Any]:
    groups: dict[tuple, dict[int, dict[str, float | None]]] = defaultdict(dict)
    score_units: dict[tuple[str, str], set[str]] = defaultdict(set)
    for row in records:
        if row.get("admission_year") is None:
            continue
        score_units[(str(row.get("exam_type", "unknown")), str(row.get("stream", "unknown")))].add(
            str(row.get("score_unit", "unknown"))
        )
        dimension = (
            row.get("exam_type"), row.get("stream"), row.get("college_code"),
            row.get("program_code"), row.get("quota_section"), row.get("category"),
            row.get("candidate_category", ""), row.get("round_no"), row.get("round", ""),
            row.get("seat_type", ""), row.get("gender", ""),
        )
        groups[dimension][int(row["admission_year"])] = {
            "cutoff_score": float(row["cutoff_score"]) if row.get("cutoff_score") is not None else None,
            "merit_rank": float(row["merit_rank"]) if row.get("merit_rank") is not None else None,
        }

    result: dict[str, dict[str, dict[str, list[float]]]] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(list))
    )
    for dimension, years in groups.items():
        exam_type, stream = str(dimension[0]), str(dimension[1])
        observed_years = sorted(years)
        for previous_year, target_year in zip(observed_years, observed_years[1:]):
            if previous_year not in years or target_year not in years:
                continue
            previous, actual = years[previous_year], years[target_year]
            target = result[f"{exam_type}|{stream}"][f"{previous_year}_to_{target_year}"]
            if previous["cutoff_score"] is not None and actual["cutoff_score"] is not None:
                error = abs(actual["cutoff_score"] - previous["cutoff_score"])
                target["score_errors"].append(error)
                target["relative_score_errors"].append(error / max(abs(actual["cutoff_score"]), 1.0))
            if previous["merit_rank"] is not None and actual["merit_rank"] is not None:
                target["rank_errors"].append(abs(actual["merit_rank"] - previous["merit_rank"]))

        # Backtest the exact percentile/rank trend formula implemented by the
        # project: it extrapolates 2025 and 2026 directly from a 2024 baseline.
        if 2024 not in years:
            continue
        baseline = years[2024]
        for target_year, score_offset, rank_factor in ((2025, 0.05, 0.99), (2026, 0.08, 0.97)):
            if target_year not in years:
                continue
            actual = years[target_year]
            target = result[f"{exam_type}|{stream}"][f"trend_formula_2024_to_{target_year}"]
            if baseline["cutoff_score"] is not None and actual["cutoff_score"] is not None:
                prediction = round(min(99.99, baseline["cutoff_score"] + score_offset), 2)
                error = abs(actual["cutoff_score"] - prediction)
                target["score_errors"].append(error)
                target["relative_score_errors"].append(error / max(abs(actual["cutoff_score"]), 1.0))
            if baseline["merit_rank"] is not None and actual["merit_rank"] is not None:
                prediction = max(1, int(baseline["merit_rank"] * rank_factor))
                target["rank_errors"].append(abs(actual["merit_rank"] - prediction))

    metrics = {}
    for key, year_pairs in sorted(result.items()):
        exam_type, stream = key.split("|", 1)
        metrics.setdefault(exam_type, {})[stream] = {}
        units = score_units.get((exam_type, stream), {"unknown"})
        unit_label = next(iter(units)) if len(units) == 1 else ",".join(sorted(units))
        threshold_name = "percentile_points" if unit_label == "percentile" else "score_units"
        for year_pair, values in sorted(year_pairs.items()):
            score_errors = values["score_errors"]
            rank_errors = values["rank_errors"]
            score_sorted = sorted(score_errors)
            metric = {
                "matched_program_category_rounds": len(score_errors),
                "cutoff_score_unit": unit_label,
                "cutoff_score_mean_absolute_error": round(sum(score_errors) / len(score_errors), 4) if score_errors else None,
                "cutoff_score_median_absolute_error": round(score_sorted[len(score_sorted) // 2], 4) if score_sorted else None,
                "closing_rank_mean_absolute_error": round(sum(rank_errors) / len(rank_errors), 2) if rank_errors else None,
                "closing_rank_matched_series": len(rank_errors),
                "forecast_baseline": (
                    "Previous-year official cutoff carried forward unchanged"
                    if "_to_" in year_pair and not year_pair.startswith("trend_formula")
                    else "Project's 2024-anchored compute_5yr_trend formula"
                ),
            }
            if unit_label == "rank":
                relative_errors = values["relative_score_errors"]
                metric.update({
                    "cutoff_rank_mean_absolute_percentage_error_pct": round(100 * sum(relative_errors) / len(relative_errors), 4) if relative_errors else None,
                    "within_100_ranks_pct": round(100 * sum(value <= 100 for value in score_errors) / len(score_errors), 2) if score_errors else None,
                    "within_1000_ranks_pct": round(100 * sum(value <= 1000 for value in score_errors) / len(score_errors), 2) if score_errors else None,
                })
            else:
                metric.update({
                    f"within_0_5_{threshold_name}_pct": round(100 * sum(value <= 0.5 for value in score_errors) / len(score_errors), 2) if score_errors else None,
                    f"within_1_0_{threshold_name}_pct": round(100 * sum(value <= 1.0 for value in score_errors) / len(score_errors), 2) if score_errors else None,
                })
            metrics[exam_type][stream][year_pair] = metric
    return metrics


def calculate_cutoff_accuracy(records: Iterable[dict[str, Any]]) -> dict[str, Any]:
    rows = list(records)
    by_exam_domain: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_exam_domain[(str(row.get("exam_type", "unknown")), str(row.get("stream", "unknown")))].append(row)
    exam_domain_results = {}
    year_metrics_by_unit = {}
    for (exam_type, stream), scoped_rows in sorted(by_exam_domain.items()):
        by_unit: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for row in scoped_rows:
            by_unit[str(row.get("score_unit", "unknown"))].append(row)
        unit_results = {}
        year_metrics_by_unit.setdefault(exam_type, {}).setdefault(stream, {})
        for unit, unit_rows in sorted(by_unit.items()):
            year_metrics = _year_over_year_metrics(unit_rows)
            unit_year_metrics = year_metrics.get(exam_type, {}).get(stream, {"status": "insufficient-overlap"})
            unit_results[unit] = {
                "official_rows": len(unit_rows),
                "colleges": len({row.get("college_code") for row in unit_rows if row.get("college_code")}),
                "programs": len({(row.get("college_code"), row.get("program_code")) for row in unit_rows}),
                "admission_years": sorted({row.get("admission_year") for row in unit_rows if row.get("admission_year")}),
                "cap_round_movement": _round_movement_metrics(unit_rows).get(exam_type, {}),
                "year_over_year_backtest": unit_year_metrics,
            }
            year_metrics_by_unit[exam_type][stream][unit] = unit_year_metrics
        result = {
            "official_rows": len(scoped_rows),
            "colleges": len({row.get("college_code") for row in scoped_rows if row.get("college_code")}),
            "programs": len({(row.get("college_code"), row.get("program_code")) for row in scoped_rows}),
            "admission_years": sorted({row.get("admission_year") for row in scoped_rows if row.get("admission_year")}),
        }
        if len(unit_results) == 1:
            result.update(next(iter(unit_results.values())))
        else:
            # JoSAA stores JEE Main/Advanced cutoffs as ranks, while state CAP
            # can publish Main score percentiles. Never combine those units.
            result["by_score_unit"] = unit_results
            result["cutoff_score_units"] = sorted(unit_results)
        exam_domain_results.setdefault(exam_type, {})[stream] = result

    year_metrics_legacy = {}
    for exam_type, domains in year_metrics_by_unit.items():
        year_metrics_legacy[exam_type] = {}
        for stream, units in domains.items():
            year_metrics_legacy[exam_type][stream] = (
                next(iter(units.values())) if len(units) == 1 else {"by_score_unit": units}
            )
    return {
        "metric_definition": "Cutoff forecast error on matched official records; includes an exact backtest of the project's 2024-anchored trend formula. This is not a calibrated admission-probability accuracy score.",
        "official_rows_evaluated": len(rows),
        "exam_type_coverage": sorted({row.get("exam_type", "unknown") for row in rows}),
        "admission_year_coverage": sorted({row.get("admission_year") for row in rows if row.get("admission_year")}),
        "domain_coverage": sorted({row.get("stream", "unknown") for row in rows}),
        "accuracy_by_exam_and_domain": exam_domain_results,
        "cap_round_movement_backtest": _round_movement_metrics(rows),
        "year_over_year_cutoff_backtest": year_metrics_legacy,
        "admission_probability_calibration": {
            "status": "not-computable-from-cutoff-only-data",
            "reason": "Calibration requires candidate-level predicted probabilities and subsequent actual allotment outcomes.",
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


async def fetch_official_pdf(source: dict[str, Any], cache_dir: str) -> bytes:
    from pathlib import Path

    cache_root = Path(cache_dir)
    cache_path = cache_root / f"{source['source_id']}.pdf"
    official_filename_cache = cache_root / Path(httpx.URL(source["url"]).path).name
    for candidate in (cache_path, official_filename_cache):
        if candidate.exists() and candidate.stat().st_size:
            payload = candidate.read_bytes()
            if payload.startswith(b"%PDF-"):
                if candidate != cache_path:
                    cache_path.parent.mkdir(parents=True, exist_ok=True)
                    cache_path.write_bytes(payload)
                return payload
    allowed_hosts = {"fe2024.mahacet.org", "fe2026.mahacet.org", "cappublicdocs2026.blob.core.windows.net"}
    if httpx.URL(source["url"]).host not in allowed_hosts:
        raise ValueError(f"Refusing non-official source host: {source['url']}")
    async with httpx.AsyncClient(timeout=httpx.Timeout(120, connect=20), follow_redirects=True) as client:
        response = await client.get(source["url"], headers={"User-Agent": "EducationCounsellorOfficialDataSync/1.0"})
        response.raise_for_status()
        payload = response.content
    if not payload.startswith(b"%PDF-"):
        raise ValueError(f"Official source did not return a PDF: {source['url']}")
    if len(payload) > 100 * 1024 * 1024:
        raise ValueError(f"Refusing unusually large official file ({len(payload)} bytes).")
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_bytes(payload)
    return payload


async def sync_mahacet_official_sources(
    mongo_url: str,
    database_name: str,
    cache_dir: str,
    source_ids: set[str] | None = None,
) -> dict[str, Any]:
    """Download/parse official Maharashtra CAP PDFs and upsert provenance-rich rows."""
    from pymongo import MongoClient, UpdateOne

    selected = [source for source in MAHACET_SOURCES if source_ids is None or source["source_id"] in source_ids]
    if not selected:
        raise ValueError("No official Maharashtra CAP source matched the requested source id(s).")

    client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    db = client[database_name]
    cutoffs = db["official_cutoffs"]
    runs = db["cutoff_ingestion_runs"]
    cutoffs.create_index("source_record_id", unique=True)
    cutoffs.create_index([
        ("exam_type", 1), ("admission_year", -1), ("round_no", -1),
        ("college_code", 1), ("program_code", 1), ("category", 1),
    ])
    runs.create_index([("source_id", 1), ("source_sha256", 1)], unique=True)

    summaries = []
    for source in selected:
        run_started = datetime.now(timezone.utc).isoformat()
        try:
            pdf_bytes = await fetch_official_pdf(source, cache_dir)
            records, checksum = parse_mahacet_pdf(pdf_bytes, source)
            if not records:
                raise ValueError("Parser produced zero rows; refusing to store an empty import.")
            for row in records:
                row["imported_at"] = run_started
            operations = [
                UpdateOne({"source_record_id": row["source_record_id"]}, {"$set": row}, upsert=True)
                for row in records
            ]
            result = cutoffs.bulk_write(operations, ordered=False)
            run_doc = {
                "source_id": source["source_id"],
                "authority": source["authority"],
                "source_url": source["url"],
                "source_index_url": source["official_index_url"],
                "source_sha256": checksum,
                "source_format": "official-pdf",
                "admission_year": source["admission_year"],
                "academic_year": source["academic_year"],
                "round": source["round"],
                "source_file_bytes": len(pdf_bytes),
                "rows_parsed": len(records),
                "rows_upserted": result.upserted_count,
                "rows_modified": result.modified_count,
                "status": "success",
                "started_at": run_started,
                "finished_at": datetime.now(timezone.utc).isoformat(),
            }
            runs.update_one(
                {"source_id": source["source_id"], "source_sha256": checksum},
                {"$set": run_doc},
                upsert=True,
            )
            summaries.append(run_doc)
        except Exception as exc:
            runs.update_one({"source_id": source["source_id"], "status": "failed"}, {"$set": {
                "source_id": source["source_id"],
                "source_url": source["url"],
                "admission_year": source["admission_year"],
                "round": source["round"],
                "status": "failed",
                "error": str(exc),
                "started_at": run_started,
                "finished_at": datetime.now(timezone.utc).isoformat(),
            }}, upsert=True)
            summaries.append({"source_id": source["source_id"], "status": "failed", "error": str(exc)})
    imported_rows = list(cutoffs.find(
        {"admission_year": {"$in": [2022, 2023, 2024, 2025, 2026]}},
        {"_id": 0},
    ))
    accuracy_report = calculate_cutoff_accuracy(imported_rows)
    accuracy_report["report_id"] = "official-cutoff-backtest-2022-2026"
    accuracy_report["sources_selected"] = len(selected)
    accuracy_report["sources_successful_this_run"] = sum(s.get("status") == "success" for s in summaries)
    accuracy_report["sources_failed_this_run"] = [
        {"source_id": row.get("source_id"), "error": row.get("error")}
        for row in summaries if row.get("status") != "success"
    ]
    accuracy_report["project_domain_coverage"] = build_project_domain_coverage(imported_rows)
    accuracy_report["official_source_coverage"] = [
        {
            "source_id": source["source_id"],
            "academic_year": source["academic_year"],
            "round": source["round"],
            "quota_file": source["quota_file"],
            "url": source["url"],
            "status": "loaded" if any(
                run.get("source_id") == source["source_id"] and run.get("status") == "success"
                for run in summaries
            ) or runs.count_documents({"source_id": source["source_id"], "status": "success"}) else "unavailable",
        }
        for source in MAHACET_SOURCES
    ]
    db["cutoff_accuracy_reports"].update_one(
        {"report_id": accuracy_report["report_id"]},
        {"$set": accuracy_report},
        upsert=True,
    )
    client.close()
    return {
        "selected_sources": len(selected),
        "successful_sources": sum(s.get("status") == "success" for s in summaries),
        "sources": summaries,
        "accuracy_report": accuracy_report,
    }


def build_project_domain_coverage(records: Iterable[dict[str, Any]]) -> dict[str, Any]:
    rows = list(records)
    observed: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        observed[str(row.get("stream", "unknown"))].append(row)
    domain_sources = {
        "Engineering": {
            "status": "official-data-ingested; Maharashtra-CAP-and-JoSAA-national-rank-scope",
            "official_sources": [
                "Maharashtra State CET Cell CAP PDFs (2022-23 to 2026-27)",
                "JoSAA opening/closing-rank portal (2022-2026; IIT and NIT+ systems)",
            ],
            "official_source_urls": [
                "https://fe2024.mahacet.org/StaticPages/HomePage",
                "https://fe2026.mahacet.org/StaticPages/HomePage",
                "https://josaa.nic.in/or-cr/",
            ],
            "not_yet_ingested": ["State and institution counselling systems outside Maharashtra CAP and JoSAA"],
            "not_yet_ingested_urls": [],
        },
        "Medical": {
            "status": "official-data-ingested; MCC-NEET-UG-national-scope",
            "official_sources": ["Medical Counselling Committee UG results", "State medical counselling authorities"],
            "official_source_urls": ["https://mcc.nic.in/archive-ug/", "https://mcc.nic.in/current-events-ug/"],
            "not_yet_ingested": ["State medical counselling systems outside MCC UG"],
            "not_yet_ingested_urls": [],
        },
        "Law": {
            "status": "official-source-identified; data-not-ingested",
            "official_sources": ["Consortium of NLUs / NLU Delhi"],
            "official_source_urls": ["https://consortiumofnlus.ac.in/", "https://nationallawuniversitydelhi.in/"],
        },
        "Design": {
            "status": "official-source-identified; data-not-ingested",
            "official_sources": ["NID / NIFT / UCEED authorities"],
            "official_source_urls": ["https://admissions.nid.edu/", "https://www.nift.ac.in/", "https://www.uceed.iitb.ac.in/"],
        },
        "Commerce": {
            "status": "decentralized; university-adapters-required",
            "official_sources": ["NTA CUET plus participating-university allocation portals"],
            "official_source_urls": ["https://cuet.nta.nic.in/"],
        },
        "Science": {
            "status": "decentralized; institution-adapters-required",
            "official_sources": ["IISER / NEST / JAM / participating-university authorities"],
            "official_source_urls": ["https://www.iiseradmission.in/", "https://www.nestexam.in/"],
        },
        "Arts": {
            "status": "decentralized; university-adapters-required",
            "official_sources": ["NTA CUET plus participating-university allocation portals"],
            "official_source_urls": ["https://cuet.nta.nic.in/"],
        },
    }
    for domain, entry in domain_sources.items():
        scoped = observed.get(domain, [])
        entry["loaded_rows"] = len(scoped)
        entry["loaded_exam_types"] = sorted({row.get("exam_type") for row in scoped})
        entry["loaded_admission_years"] = sorted({row.get("admission_year") for row in scoped if row.get("admission_year")})
    return domain_sources

