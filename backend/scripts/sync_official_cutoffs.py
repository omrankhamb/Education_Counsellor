"""Download official Maharashtra CAP cutoff gazettes, ingest and backtest them."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from config import MONGODB_DB_NAME, MONGODB_URL  # noqa: E402
from services.official_cutoff_data import sync_mahacet_official_sources  # noqa: E402


async def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source-id",
        action="append",
        dest="source_ids",
        help="Limit sync to a source_id; repeat for multiple PDFs. Defaults to all configured official CAP files.",
    )
    args = parser.parse_args()
    cache_dir = BACKEND_DIR / "data" / "official_sources"
    report_path = cache_dir / "accuracy_report.json"
    result = await sync_mahacet_official_sources(
        MONGODB_URL,
        MONGODB_DB_NAME,
        str(cache_dir),
        set(args.source_ids) if args.source_ids else None,
    )
    report = result.get("accuracy_report") or {}
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    print(json.dumps({
        "database": MONGODB_DB_NAME,
        "selected_sources": result.get("selected_sources"),
        "successful_sources": result.get("successful_sources"),
        "failed_sources": report.get("sources_failed_this_run", []),
        "official_rows_evaluated": report.get("official_rows_evaluated", 0),
        "exam_type_coverage": report.get("exam_type_coverage", []),
        "domain_coverage": report.get("project_domain_coverage", {}),
        "accuracy_by_exam_and_domain": report.get("accuracy_by_exam_and_domain", {}),
        "report_path": str(report_path),
    }, indent=2, ensure_ascii=False))
    return 0 if result.get("successful_sources") else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
