from pydantic import BaseModel
from typing import Optional, List

class StudentProfile(BaseModel):
    name: str
    age: int
    stream: str           # Engineering, Medical, Arts, Commerce, Science, Law, Design
    marks: float          # Percentage or score
    exam_type: str        # JEE Main, JEE Advanced, NEET, MHT-CET, 12th %, CUET, CLAT, CAT
    score_unit: Optional[str] = "percentage"  # "percentile", "rank", "marks_720", "percentage"
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
    user_id: Optional[str] = None

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    user_id: str
    profile: StudentProfile

class RecommendRequest(BaseModel):
    student_profile: StudentProfile

class CollegeSearchRequest(BaseModel):
    stream: Optional[str] = None
    state: Optional[str] = None
    max_budget: Optional[str] = None
    college_type: Optional[str] = None
    min_marks: Optional[float] = None
