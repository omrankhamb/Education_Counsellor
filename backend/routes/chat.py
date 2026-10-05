from fastapi import APIRouter
from models import ChatRequest
from services.gemini_service import chat_with_gemini
import database

router = APIRouter()

@router.post("/chat")
async def chat(request: ChatRequest):
    """AI chat endpoint with student context injection and MongoDB persistence."""
    result = await chat_with_gemini(
        user_message=request.message,
        student_profile=request.student_profile,
        history=request.history
    )
    
    # If student is logged in, automatically save chat exchange to MongoDB
    if request.user_id and result.get("success"):
        try:
            await database.save_chat_message(
                user_id=request.user_id,
                user_name=request.student_profile.name,
                user_message=request.message,
                counselor_response=result.get("response", "")
            )
        except Exception as e:
            # Non-blocking log if DB save fails
            print(f"[Warning] Failed to persist chat to MongoDB: {e}")
            
    return result

@router.get("/chat/history/{user_id}")
async def get_history(user_id: str):
    """Retrieve chat history from MongoDB for a logged-in student."""
    history = await database.get_chat_history(user_id)
    return {"success": True, "history": history}

@router.delete("/chat/history/{user_id}")
async def clear_history(user_id: str):
    """Clear chat history in MongoDB for a student."""
    cleared = await database.clear_chat_history(user_id)
    return {"success": cleared, "message": "Chat history cleared successfully."}
