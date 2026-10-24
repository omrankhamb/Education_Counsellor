"""Rebuild the official cutoff accuracy snapshot from MongoDB."""

from __future__ import annotations

import sys
from pathlib import Path

from pymongo import MongoClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from config import MONGODB_DB_NAME, MONGODB_URL
from services.official_cutoff_data import (
    build_project_domain_coverage,
    calculate_cutoff_accuracy,
    persist_cutoff_accuracy_report,
)


REPORT_ID = "official-cutoff-backtest-2022-2026"
FIRST_YEAR = 2022
LAST_YEAR = 2026


def main() -> None:
    client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    db = client[MONGODB_DB_NAME]
    rows = list(
        db["official_cutoffs"].find(
            {"admission_year": {"$gte": FIRST_YEAR, "$lte": LAST_YEAR}},
            {"_id": 0},
        )
    )
    report = calculate_cutoff_accuracy(rows)
    report["report_id"] = REPORT_ID
    report["project_domain_coverage"] = build_project_domain_coverage(rows)

    latest_sources: dict[str, dict] = {}
    for run in db["cutoff_ingestion_runs"].find({}, {"_id": 0}).sort("finished_at", -1):
        source_id = run.get("source_id")
        if source_id:
            latest_sources.setdefault(source_id, run)
    report["official_source_coverage"] = [
        {
            key: source.get(key)
            for key in (
                "source_id",
                "authority",
                "source_url",
                "source_index_url",
                "admission_year",
                "academic_year",
                "round",
                "round_no",
                "source_format",
                "rows_parsed",
                "status",
                "error",
                "finished_at",
            )
            if key in source
        }
        for source in sorted(
            latest_sources.values(),
            key=lambda item: (item.get("admission_year", 0), item.get("source_id", "")),
        )
    ]
    report["source_coverage_summary"] = {
        "sources_with_successful_latest_run": sum(
            source.get("status") == "success" for source in latest_sources.values()
        ),
        "sources_with_failed_latest_run": sum(
            source.get("status") == "failed" for source in latest_sources.values()
        ),
        "latest_source_runs": len(latest_sources),
    }
    db["cutoff_accuracy_reports"].update_one(
        {"report_id": REPORT_ID}, {"$set": report}, upsert=True
    )
    path = persist_cutoff_accuracy_report(report)
    print(f"report_id={REPORT_ID}")
    print(f"official_rows_evaluated={report['official_rows_evaluated']}")
    print(f"exam_type_coverage={', '.join(report['exam_type_coverage'])}")
    print(f"domain_coverage={', '.join(report['domain_coverage'])}")
    print(f"latest_source_runs={len(latest_sources)}")
    print(f"loaded_sources={report['source_coverage_summary']['sources_with_successful_latest_run']}")
    print(f"failed_sources={report['source_coverage_summary']['sources_with_failed_latest_run']}")
    print(f"report_file={path}")
    client.close()


if __name__ == "__main__":
    main()
