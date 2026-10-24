from collections import Counter
import hashlib
import sys
from pathlib import Path
from collections import defaultdict
import re

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pypdf import PdfReader
from io import BytesIO
from services.mcc_cutoff_data import INDEX_URL, list_mcc_final_sources, parse_mcc_final_pdf_layout, _fragments_for_page  # noqa: E402

index = httpx.get(INDEX_URL, timeout=60)
index.raise_for_status()
source = next(item for item in list_mcc_final_sources(index.text)
              if item["admission_year"] == 2022 and item["round_no"] == 1)
response = httpx.get(source["url"], timeout=120)
response.raise_for_status()
pdf = response.content
checksum = hashlib.sha256(pdf).hexdigest()
reader = PdfReader(BytesIO(pdf))
for page_no in [2, 3, 4, 100, 500, 1000]:
    if page_no >= len(reader.pages):
        continue
    lines = (reader.pages[page_no].extract_text(extraction_mode="layout") or "").splitlines()
    matches = [line for line in lines if re.match(r"^\s*\d{1,6}\s+[\d,]+\s+", line)]
    print("LAYOUT_ROWS", page_no + 1, [(repr(line), repr(line[20:34]), repr(line[34:140]), repr(line[140:170]), repr(line[170:198])) for line in matches[:3]])
for page_no in [2, 3, 10, 100, 500, 1000, len(reader.pages) - 1]:
    if page_no < 0 or page_no >= len(reader.pages):
        continue
    fragments = _fragments_for_page(reader.pages[page_no])
    by_y = defaultdict(list)
    for text, x, y in fragments:
        by_y[y].append((x, text))
    starts = 0
    for items in by_y.values():
        serial = any(15 <= x <= 28 and re.fullmatch(r"[0-9,]+", text.replace(" ", "")) for x, text in items)
        rank = any(55 <= x <= 75 and re.fullmatch(r"[0-9,]+", text.replace(" ", "")) for x, text in items)
        starts += serial and rank
    print("PAGE_DIAG", page_no + 1, len(fragments), starts)
    if page_no in [10, 100, 500, 1000]:
        labels = [(x, y, text.strip()) for text, x, y in fragments
                  if any(word in text.casefold() for word in ("rank", "allotted", "institute", "course", "category", "quota"))]
        nums = [(x, y) for text, x, y in fragments if re.fullmatch(r"[0-9,]+", text.strip())]
        print("PAGE_FIELDS", page_no + 1, [(x, y, re.sub(r"[^A-Za-z ]", "", t).strip()[:30]) for x, y, t in labels[:10]], "number_positions", nums[:10])
rows = parse_mcc_final_pdf_layout(pdf, source, checksum)
print("source", source["round_title"], "pages bytes", len(pdf))
print("aggregate_cutoffs", len(rows), "colleges", len({r["college_code"] for r in rows}),
      "programs", len({r["program_code"] for r in rows}), "categories", sorted({r["category"] for r in rows}))
print("program_counts", dict(Counter(r["branch_name"] for r in rows).most_common(8)))
print("rank_range", min(r["closing_rank"] for r in rows), max(r["closing_rank"] for r in rows))
print("sample", [(r["college_name"], r["branch_name"], r["quota_section"], r["category"])
                for r in rows[:6]])
