from pydantic import BaseModel
from typing import Optional, List

class StudentProfile(BaseModel):
    name: str
    age: int
    stream: str           # Engineering, Medical, Arts, Commerce, Science, Law, Design
    marks: float          # Percentage or score
    exam_type: str        # JEE, NEET, 12th %, CET, CAT, CLAT, CUET
    preferred_state: Optional[str] = "Any"
    budget: Optional[str] = "Any"  # Any, <5L, 5-15L, 15L+
    college_type: Optional[str] = "Any"  # Govt, Private, Any

class ChatMessage(BaseModel):
    role: str   # "user" or "model"
    content: str

class ChatRequest(BaseModel):
    message: str
    student_profile: StudentProfile
    history: Optional[List[ChatMessage]] = []

class RecommendRequest(BaseModel):
    student_profile: StudentProfile

class CollegeSearchRequest(BaseModel):
    stream: Optional[str] = None
    state: Optional[str] = None
    max_budget: Optional[str] = None
    college_type: Optional[str] = None
    min_marks: Optional[float] = None
