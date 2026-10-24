from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request, Query
from typing import List, Optional
import database
import os
import uuid
import shutil

router = APIRouter()

# Directory for uploaded review photos
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "review_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/reviews")
async def create_review_endpoint(
    request: Request,
    user_id: Optional[str] = Form(None),
    user_name: Optional[str] = Form(None),
    college_name: Optional[str] = Form(None),
    student_role: Optional[str] = Form(None),
    tag: Optional[str] = Form(None),
    rating: Optional[int] = Form(None),
    review_text: Optional[str] = Form(None),
    image_url: Optional[str] = Form(None),
    photos: Optional[List[UploadFile]] = File(None)
):
    """
    Submit a new college review / insider feedback.
    Supports both multipart/form-data with file uploads and application/json payloads.
    """
    content_type = request.headers.get("content-type", "")

    # Handle application/json
    if "application/json" in content_type:
        try:
            body = await request.json()
            user_id = body.get("user_id") or "guest_student"
            user_name = body.get("user_name") or "Student / Alumni"
            college_name = body.get("college_name")
            student_role = body.get("student_role") or "Verified Campus Student"
            tag = body.get("tag") or "Campus Life & Academics"
            rating = int(body.get("rating", 5))
            review_text = body.get("review_text", "")
            image_url = body.get("image_url", "")
            photos = []
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {e}")

    # Fallback defaults for form data
    if not college_name or not str(college_name).strip():
        raise HTTPException(status_code=400, detail="College name is required.")
    if not review_text or not str(review_text).strip():
        raise HTTPException(status_code=400, detail="Feedback description cannot be empty.")

    r_val = int(rating) if rating is not None else 5
    if r_val < 1 or r_val > 5:
        r_val = 5

    photo_urls = []
    if image_url and str(image_url).strip():
        photo_urls.append(str(image_url).strip())

    if photos:
        for photo in photos[:5]:  # Max 5 photos
            if photo and photo.filename:
                ext = os.path.splitext(photo.filename)[1].lower()
                if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
                    continue
                filename = f"{uuid.uuid4().hex}{ext}"
                filepath = os.path.join(UPLOAD_DIR, filename)
                with open(filepath, "wb") as f:
                    content = await photo.read()
                    f.write(content)
                photo_urls.append(f"/api/review-photos/{filename}")

    review = await database.create_review(
        user_id=user_id or "student",
        user_name=user_name or "Anonymous Student",
        college_name=college_name,
        rating=r_val,
        review_text=review_text,
        photos=photo_urls,
        student_role=student_role or "Verified Campus Student",
        tag=tag or "Campus Experience",
        image_url=image_url or ""
    )
    return {"success": True, "review": review}


@router.get("/reviews/{college_name}")
async def get_reviews(
    college_name: str,
    sort_by: str = Query("likes", description="Sort by 'likes' (highest liked first), 'recent', or 'rating'")
):
    """
    Get all student feedbacks for a college.
    Defaults to sorting by highest liked/helpful first.
    """
    reviews = await database.get_reviews_for_college(college_name, sort_by=sort_by)
    summary = await database.get_college_rating_summary(college_name)
    return {
        "success": True,
        "college_name": college_name,
        "sort_by": sort_by,
        "summary": summary,
        "reviews": reviews
    }


@router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, user_id: str):
    """Delete a review (author only)."""
    deleted = await database.delete_review(review_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Review not found or unauthorized.")
    return {"success": True, "message": "Review deleted."}


@router.post("/reviews/{review_id}/helpful")
async def mark_helpful(review_id: str):
    """Mark a review as helpful / like. Increments like count and returns updated count."""
    new_count = await database.mark_review_helpful(review_id)
    if new_count is None:
        raise HTTPException(status_code=404, detail="Review not found.")
    return {"success": True, "helpful_count": new_count}
