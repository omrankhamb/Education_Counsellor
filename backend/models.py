from pydantic import BaseModel
from typing import Optional, List

class StudentProfile(BaseModel):
    name: Optional[str] = "Student"
    age: Optional[int] = 18
    stream: Optional[str] = "Engineering"
    marks: Optional[float] = 85.0
    exam_type: Optional[str] = "MHT-CET"
    score_unit: Optional[str] = "percentage"
    preferred_state: Optional[str] = "Any"
    budget: Optional[str] = "Any"
    college_type: Optional[str] = "Any"
    category: Optional[str] = "General"
    user_id: Optional[str] = None

    class Config:
        extra = "allow"

class ChatMessage(BaseModel):
    role: str   # "user" or "model"
    content: str

class ChatRequest(BaseModel):
    message: str
    student_profile: Optional[StudentProfile] = None
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

class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = None
    voice: Optional[str] = None

class TranslateRequest(BaseModel):
    text: str
    target_lang: str
    source_lang: Optional[str] = "en"

class CapChoiceItem(BaseModel):
    college_code: str
    branch: Optional[str] = None
    selected_branch: Optional[str] = None

class CapRebalanceRequest(BaseModel):
    student_score: float = 95.0
    exam_type: Optional[str] = "MHT-CET"
    category: Optional[str] = "OPEN"
    cap_round: Optional[str] = "CAP Round 1"
    current_choices: Optional[List[CapChoiceItem]] = []
    strategy_type: Optional[str] = "golden_ratio"
    prompt: Optional[str] = ""
    user_id: Optional[str] = None
    preferred_branch: Optional[str] = None
    preferred_branches: Optional[List[str]] = []

