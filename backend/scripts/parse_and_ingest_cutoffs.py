import re
import os
import json
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "hybrid_college_recommender"

def parse_cutoffs_from_file(filepath, round_name, year):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    lines = [l.strip() for l in text.splitlines() if l.strip()]

    records = []
    current_college_code = None
    current_college_name = None

    i = 0
    while i < len(lines):
        line = lines[i]

        # Check for college header: e.g. '1002 - Government College of Engineering, Amravati'
        col_match = re.match(r'^(\d{4,5})\s*-\s*(.+)$', line)
        if col_match and not re.match(r'^\d{9,10}', line):
            current_college_code = col_match.group(1).zfill(5)
            current_college_name = col_match.group(2).strip()
            i += 1
            continue

        # Check for course header: e.g. '100219110 - Civil Engineering'
        course_match = re.match(r'^(\d{9,10})\s*-\s*(.+)$', line)
        if course_match:
            course_code = course_match.group(1)
            course_name = course_match.group(2).strip()
            if not current_college_code:
                current_college_code = course_code[:4].zfill(5)

            # Collect all lines for this course until next course or next college
            course_lines = []
            i += 1
            while i < len(lines):
                next_line = lines[i]
                if re.match(r'^\d{9,10}\s*-', next_line) or (re.match(r'^\d{4,5}\s*-', next_line) and not re.match(r'^\d{9,10}', next_line)):
                    break
                course_lines.append(next_line)
                i += 1

            course_text = '\n'.join(course_lines)
            
            # Find status
            status_match = re.search(r'Status:\s*([^\n\r]+)', course_text)
            status = status_match.group(1).strip() if status_match else ''

            # Split by section headers
            section_headers = [
                'State Level',
                'Home University Seats Allotted to Home University Candidates',
                'Other Than Home University Seats Allotted to Other Than Home University Candidates',
                'Home University Seats Allotted to Other Than Home University Candidates',
                'Other Than Home University Seats Allotted to Home University Candidates',
                'Minority Seats Allotted to Maharashtra State Candidature Candidates'
            ]
            
            sec_positions = []
            for sh in section_headers:
                for m in re.finditer(re.escape(sh), course_text):
                    sec_positions.append((m.start(), sh))
            sec_positions.sort(key=lambda x: x[0])

            sections = []
            if not sec_positions:
                sections.append(('General', course_text))
            else:
                for idx, (pos, sh) in enumerate(sec_positions):
                    start = pos + len(sh)
                    end = sec_positions[idx + 1][0] if idx + 1 < len(sec_positions) else len(course_text)
                    sections.append((sh, course_text[start:end]))

            course_cutoffs = []
            for sec_name, sec_body in sections:
                pairs = re.findall(r'(\d+)\s*\n*\s*\(([0-9.]+)\)', sec_body)
                first_pair = re.search(r'\d+\s*\n*\s*\([0-9.]+\)', sec_body)
                if first_pair:
                    cat_part = sec_body[:first_pair.start()]
                else:
                    cat_part = sec_body

                # Clean cat_part and reconstruct broken tokens
                cat_cleaned = re.sub(r'([A-Z]+)\s+([SHO])\b', r'\1\2', cat_part)
                raw_tokens = cat_cleaned.split()
                cat_tokens = []
                for t in raw_tokens:
                    t_clean = re.sub(r'[^A-Z0-9]', '', t)
                    if t_clean in ['STAGE', 'STATUS', 'I', 'II', 'VII', 'CUT', 'OFF', 'DIR', 'D', 'STATE', 'CELL', 'LEVEL']:
                        continue
                    if len(t_clean) >= 2 and not t_clean.isdigit():
                        cat_tokens.append(t_clean)

                for k in range(min(len(cat_tokens), len(pairs))):
                    cat = cat_tokens[k]
                    rank = int(pairs[k][0])
                    percentile = float(pairs[k][1])
                    course_cutoffs.append({
                        'section': sec_name,
                        'category': cat,
                        'merit_rank': rank,
                        'percentile': percentile
                    })

            records.append({
                'college_code': current_college_code,
                'college_name': current_college_name,
                'course_code': course_code,
                'course_name': course_name,
                'status': status,
                'year': year,
                'round': round_name,
                'cutoffs': course_cutoffs
            })
            continue

        i += 1

    return records


async def ingest():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    batches = [
        ('backend/scripts/raw_cutoff_batch1.txt', 'CAP Round 1', '2022-23'),
        ('backend/scripts/raw_cutoff_batch2.txt', 'CAP Round 2', '2022-23'),
        ('backend/scripts/raw_cutoff_batch3.txt', 'CAP Round 3', '2022-23'),
    ]

    total_inserted = 0
    total_cutoffs = 0

    # Ensure collection index
    await db.mahacet_cutoffs.create_index([
        ("college_code", 1),
        ("course_code", 1),
        ("year", 1),
        ("round", 1)
    ])
    await db.mahacet_cutoffs.create_index([("course_name", 1)])
    await db.mahacet_cutoffs.create_index([("year", 1)])
    await db.mahacet_cutoffs.create_index([("round", 1)])

    for filepath, round_name, year in batches:
        if not os.path.exists(filepath):
            print(f"Skipping {filepath} (not found)")
            continue
        
        records = parse_cutoffs_from_file(filepath, round_name, year)
        print(f"Parsed {len(records)} course records from {filepath} ({round_name}, {year})")

        for r in records:
            # Upsert into mahacet_cutoffs
            await db.mahacet_cutoffs.update_one(
                {
                    "college_code": r["college_code"],
                    "course_code": r["course_code"],
                    "year": r["year"],
                    "round": r["round"]
                },
                {"$set": r},
                upsert=True
            )
            total_inserted += 1
            total_cutoffs += len(r["cutoffs"])

            # Also update mahacet_colleges & cutoffs_master general cutoff benchmark if GOPEN/GOPENS is present
            gopen_cutoffs = [c["percentile"] for c in r["cutoffs"] if c["category"] in ["GOPENS", "GOPENH", "GOPENO", "GOPEN"]]
            if gopen_cutoffs:
                min_gopen = min(gopen_cutoffs)
                max_gopen = max(gopen_cutoffs)
                # update mahacet_colleges cutoff_general
                await db.mahacet_colleges.update_one(
                    {"institute_code": r["college_code"]},
                    {"$set": {
                        f"cutoff_history.{year}.{round_name}.{r['course_code']}": {
                            "course_name": r["course_name"],
                            "gopen_percentile": max_gopen,
                            "total_categories": len(r["cutoffs"])
                        }
                    }}
                )

    print(f"SUCCESS: Ingested {total_inserted} course records containing {total_cutoffs} category cutoffs into 'mahacet_cutoffs'!")
    count = await db.mahacet_cutoffs.count_documents({})
    print(f"Total documents in 'mahacet_cutoffs': {count}")

if __name__ == "__main__":
    asyncio.run(ingest())
