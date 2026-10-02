from fastapi import APIRouter
from models import ChatRequest
from services.gemini_service import chat_with_gemini

router = APIRouter()

@router.post("/chat")
async def chat(request: ChatRequest):
    """AI chat endpoint with student context injection."""
    result = await chat_with_gemini(
        user_message=request.message,
        student_profile=request.student_profile,
        history=request.history
    )
    return result
