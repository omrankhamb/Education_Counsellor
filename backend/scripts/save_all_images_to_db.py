import os
import sys
import asyncio
import re
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import database
from services.college_image_service import (
    VERIFIED_CAMPUS_URLS,
    COLLEGE_KEY_PATTERNS,
    STREAM_FALLBACKS,
    get_distinct_stream_photo,
    sanitize_filename,
    IMAGE_DIR
)


async def main():
    print("=" * 60)
    print("SAVING ALL COLLEGE IMAGES TO MONGODB DATABASE")
    print("=" * 60)

    db = database.get_db()
    cutoffs_coll = database.get_cutoffs_master_collection()
    images_coll = db["college_images"]

    # 1. Reset collection and create indexes on college_images collection
    try:
        await images_coll.drop()
    except Exception:
        pass
    await images_coll.create_index("key")
    await images_coll.create_index("college_name", unique=True)
    print("[OK] Created MongoDB indexes on 'college_images' collection.")

    # 2. Get all distinct colleges from cutoffs_master
    distinct_colleges = await cutoffs_coll.distinct("college_name")
    print(f"[OK] Found {len(distinct_colleges)} unique colleges across 3,000 cutoff records in MongoDB.")

    # 3. Build image mappings and save to DB
    updated_colleges = 0
    updated_cutoff_docs = 0

    for cname in distinct_colleges:
        if not cname:
            continue
        cname_clean = cname.strip()
        cname_lower = cname_clean.lower()

        # Match key
        matched_key = None
        for pattern, key in COLLEGE_KEY_PATTERNS:
            if re.search(pattern, cname_lower):
                matched_key = key
                break

        if not matched_key:
            matched_key = sanitize_filename(cname_clean)

        # Check if local image exists on disk
        local_filename = f"{matched_key}.jpg"
        local_path = os.path.join(IMAGE_DIR, local_filename)

        if os.path.exists(local_path) and os.path.getsize(local_path) > 5000:
            final_image_url = f"/api/college-images/{local_filename}"
            source = "Downloaded Local Cache"
        elif matched_key in VERIFIED_CAMPUS_URLS:
            final_image_url = VERIFIED_CAMPUS_URLS[matched_key]
            source = "Verified Wikimedia / Official CDN"
        else:
            # Stream-based distinct diverse photography (no duplicate images across cards)
            if any(k in cname_lower for k in ["medical", "aiims", "gmc", "hospital", "bjmc", "kem"]):
                final_image_url = get_distinct_stream_photo(cname_clean, "Medical")
            elif any(k in cname_lower for k in ["law", "nlu", "glc", "ils"]):
                final_image_url = get_distinct_stream_photo(cname_clean, "Law")
            elif any(k in cname_lower for k in ["commerce", "bmcc", "srcc", "podar"]):
                final_image_url = get_distinct_stream_photo(cname_clean, "Commerce")
            elif any(k in cname_lower for k in ["design", "nid", "nift"]):
                final_image_url = get_distinct_stream_photo(cname_clean, "Design")
            elif any(k in cname_lower for k in ["science", "iiser", "iisc", "fergusson"]):
                final_image_url = get_distinct_stream_photo(cname_clean, "Science")
            else:
                final_image_url = get_distinct_stream_photo(cname_clean, "Engineering")
            source = "Diverse Campus Photography"

        # Save to college_images collection
        img_doc = {
            "college_name": cname_clean,
            "key": matched_key,
            "image_url": final_image_url,
            "source": source,
            "updated_at": datetime.now().isoformat()
        }

        await images_coll.update_one(
            {"college_name": cname_clean},
            {"$set": img_doc},
            upsert=True
        )
        updated_colleges += 1

        # Update all matching cutoffs_master records in MongoDB
        res = await cutoffs_coll.update_many(
            {"college_name": cname_clean},
            {"$set": {"image_url": final_image_url}}
        )
        updated_cutoff_docs += res.modified_count

    # Also insert all verified entries from VERIFIED_CAMPUS_URLS into college_images
    for key, url in VERIFIED_CAMPUS_URLS.items():
        local_filename = f"{key}.jpg"
        local_path = os.path.join(IMAGE_DIR, local_filename)
        img_url = f"/api/college-images/{local_filename}" if (os.path.exists(local_path) and os.path.getsize(local_path) > 5000) else url
        c_title = key.replace("_", " ").title()
        await images_coll.update_one(
            {"college_name": c_title},
            {"$set": {
                "key": key,
                "college_name": c_title,
                "image_url": img_url,
                "source": "Verified Master Registry",
                "updated_at": datetime.now().isoformat()
            }},
            upsert=True
        )

    print(f"\nSUCCESSFULLY STORED IN MONGODB:")
    print(f"[OK] Saved {updated_colleges} colleges in MongoDB 'college_images' collection.")
    print(f"[OK] Updated {updated_cutoff_docs} cutoff records in MongoDB 'cutoffs_master' with exact 'image_url'.")

    # Verification query
    sample = await cutoffs_coll.find_one({"college_name": {"$regex": "COEP|VJTI|Walchand|IIT Bombay", "$options": "i"}})
    if sample:
        print(f"\nVerification Sample from MongoDB:")
        print(f"College: {sample.get('college_name')}")
        print(f"Saved Image URL: {sample.get('image_url')}")

    total_images_in_db = await images_coll.count_documents({})
    print(f"\nTotal image documents in 'college_images' collection: {total_images_in_db}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
