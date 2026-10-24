"""Ingest aggregate NEET UG cutoffs from official MCC final allotment PDFs."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from config import MONGODB_DB_NAME, MONGODB_URL  # noqa: E402
from services.mcc_cutoff_data import sync_mcc_neet_official_sources  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--years", nargs="+", type=int, default=[2022, 2023, 2024, 2025, 2026])
    parser.add_argument("--limit-sources", type=int, help="Limit the number of final-result PDFs for a safe parser check.")
    parser.add_argument("--skip-successful", action="store_true", help="Resume without re-fetching successful source imports.")
    args = parser.parse_args()
    result = sync_mcc_neet_official_sources(
        MONGODB_URL,
        MONGODB_DB_NAME,
        years=args.years,
        limit_sources=args.limit_sources,
        skip_successful=args.skip_successful,
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result.get("successful_sources") else 1


if __name__ == "__main__":
    raise SystemExit(main())
