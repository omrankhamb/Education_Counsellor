from fastapi import APIRouter
from typing import Optional
from pydantic import BaseModel
from models import RecommendRequest
from services.recommender import (
    get_live_college_recommendations,
    get_career_opportunities,
    get_featured_colleges
)
from services.college_details_service import get_detailed_college_info

router = APIRouter()

class CollegeDetailRequest(BaseModel):
    college_name: str
    stream: Optional[str] = "Engineering"
    student_marks: Optional[float] = 90.0
    exam_type: Optional[str] = "MHT-CET"
    score_unit: Optional[str] = "percentile"

@router.post("/recommend")
async def get_recommendations(request: RecommendRequest):
    """Get LIVE AI-powered college recommendations based on student profile."""
    colleges = await get_live_college_recommendations(request.student_profile)
    careers = get_career_opportunities(request.student_profile.stream)
    return {
        "success": True,
        "colleges": colleges,
        "career_opportunities": careers,
        "total": len(colleges),
        "source": "AI (Live)"
    }

@router.get("/featured-colleges")
async def featured_colleges(stream: Optional[str] = "All", exam_type: Optional[str] = None):
    """Get featured colleges for landing page without login requirement, filtered by exam_type if specified."""
    colleges = get_featured_colleges(stream, exam_type or "")
    return {
        "success": True,
        "colleges": colleges,
        "total": len(colleges)
    }

@router.post("/college-details")
async def college_details(req: CollegeDetailRequest):
    """Get comprehensive domain/branch cutoffs, performance metrics, and marked key points for a college."""
    details = get_detailed_college_info(
        req.college_name, req.stream, req.student_marks, req.exam_type, req.score_unit
    )
    return {
        "success": True,
        "college": details
    }
