from io import BytesIO
import re
import sys
from pathlib import Path

import httpx
from pypdf import PdfReader

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from services.mcc_cutoff_data import INDEX_URL, list_mcc_final_sources

index = httpx.get(INDEX_URL, timeout=60)
index.raise_for_status()
source = next(item for item in list_mcc_final_sources(index.text)
              if item["admission_year"] == 2022 and item["round_no"] == 1)
response = httpx.get(source["url"], timeout=120)
response.raise_for_status()
reader = PdfReader(BytesIO(response.content))
safe_words = {"rank", "allotted", "quota", "institute", "course", "category", "candidate", "open", "seat", "india", "female", "male", "ews", "obc", "sc", "st", "mbbs", "bds", "nursing", "round", "neet"}
for page_no in [2, 3, 10, 100, 500, 1000, len(reader.pages) - 1]:
    if page_no < 0 or page_no >= len(reader.pages):
        continue
    page = reader.pages[page_no]
    print("PAGE", page_no + 1, "rotation", page.rotation, "box", tuple(float(x) for x in page.mediabox))
    for line in (page.extract_text(extraction_mode="layout") or "").splitlines()[:8]:
        safe = re.sub(r"\d+", "<n>", line)
        safe = re.sub(r"[A-Za-z][A-Za-z'./-]*", lambda m: m.group(0) if m.group(0).casefold() in safe_words else "<text>", safe)
        print("  ", safe[:180])
