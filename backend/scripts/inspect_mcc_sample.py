from io import BytesIO
import re

import httpx
from pypdf import PdfReader

url = "https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2023/05/2023053188-1.pdf"
response = httpx.get(url, timeout=60)
response.raise_for_status()
reader = PdfReader(BytesIO(response.content))
text = reader.pages[0].extract_text() or ""
print("bytes", len(response.content), "pages", len(reader.pages))
for line in text.splitlines():
    if any(word in line.casefold() for word in ("rank", "quota", "course", "institute", "category", "allotted")):
        # Show headings only, never candidate-row values.
        clean = " ".join(line.split())
        if len(clean) < 180 and not any(ch.isdigit() for ch in clean):
            print("HEADING", clean)
for page_no in range(1, min(5, len(reader.pages))):
    page_text = reader.pages[page_no].extract_text() or ""
    shown = 0
    for line in page_text.splitlines():
        if not re.search(r"\d", line):
            continue
        cells = [cell.strip() for cell in re.split(r"\s{2,}", line) if cell.strip()]
        shape = ["N" if re.fullmatch(r"\d+", cell) else "M" if re.search(r"\d", cell) else "T" for cell in cells]
        print("ROW_SHAPE", page_no + 1, len(cells), shape)
        shown += 1
        if shown >= 6:
            break
if len(reader.pages) > 2:
    words = {"neet", "rank", "allotted", "quota", "institute", "course", "category", "gender", "seat", "result", "round", "serial", "no", "no.", "open", "female", "male", "general", "obc", "sc", "st", "ews", "all", "india", "choice", "candidate", "name", "roll", "number"}
    for line_no, line in enumerate((reader.pages[2].extract_text() or "").splitlines()[:40]):
        sanitized = re.sub(r"\d+", "<num>", line)
        sanitized = re.sub(r"[A-Za-z][A-Za-z'./-]*", lambda m: m.group(0) if m.group(0).casefold() in words else "<text>", sanitized)
        if sanitized.strip():
            print("PAGE3", line_no, sanitized[:120])
    layout = reader.pages[2].extract_text(extraction_mode="layout") or ""
    layout_lines = layout.splitlines()
    for word in ("Rank", "Allotted", "Institute", "Course", "Category"):
        positions = [match.start() for match in re.finditer(word, layout_lines[1], re.I)]
        print("COLUMN", word, positions)
    for line_no, line in enumerate(layout_lines[2:10], start=2):
        print("POSITIONS", line_no, [(match.start(), match.end(), "NUM" if re.fullmatch(r"[0-9,]+", match.group()) else "TEXT") for match in re.finditer(r"\S+", line)])
    for line_no, line in enumerate(layout_lines[:30]):
        sanitized = re.sub(r"\d+", "<num>", line)
        sanitized = re.sub(r"[A-Za-z][A-Za-z'./-]*", lambda m: m.group(0) if m.group(0).casefold() in words else "<text>", sanitized)
        if sanitized.strip():
            print("LAYOUT3", line_no, sanitized[:180])
    positioned = []
    reader.pages[2].extract_text(visitor_text=lambda text, cm, tm, font, size: positioned.append((text, round(tm[4], 1), round(tm[5], 1))))
    groups = {}
    for text, x, y in positioned:
        if text.strip():
            groups.setdefault(y, []).append((x, text.strip()))
    for y in sorted(groups, reverse=True)[:16]:
        cells = sorted(groups[y])
        shape = [(x, "NUM" if re.fullmatch(r"[0-9,]+", text) else "TEXT") for x, text in cells]
        print("YROW", y, shape)
    for text, x, y in positioned:
        if any(word in text.casefold() for word in ("rank", "allotted", "institute", "course", "category", "quota")):
            print("HEADER", x, y, " ".join(text.split())[:70])
