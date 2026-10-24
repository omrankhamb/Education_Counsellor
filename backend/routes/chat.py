from fastapi import APIRouter, Response, HTTPException
from models import ChatRequest, TTSRequest, TranslateRequest, StudentProfile
from services.gemini_service import chat_with_gemini
from services.tts_service import FEMALE_VOICE_PACK, generate_speech_audio, detect_text_language
from services.translation_service import translate_text, LANGUAGE_CATALOG
import database

router = APIRouter()

@router.post("/chat")
async def chat(request: ChatRequest):
    """AI chat endpoint with student context injection and MongoDB persistence."""
    profile = request.student_profile or StudentProfile()
    result = await chat_with_gemini(
        user_message=request.message,
        student_profile=profile,
        history=request.history or []
    )
    
    # If student is logged in, automatically save chat exchange to MongoDB
    if request.user_id and result.get("success"):
        try:
            await database.save_chat_message(
                user_id=request.user_id,
                user_name=profile.name or "Student",
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

@router.get("/chat/voices")
async def get_voice_packs():
    """Return all available natural female neural voice packs for Indian regional languages."""
    voice_list = [
        {
            "code": code,
            "id": info["id"],
            "name": info["name"],
            "lang": info["lang"],
            "native_name": info["native_name"],
            "flag": info["flag"],
            "description": info["description"]
        }
        for code, info in FEMALE_VOICE_PACK.items()
    ]
    return {
        "success": True,
        "voices": voice_list,
        "default": "en"
    }

@router.post("/chat/tts")
async def text_to_speech(req: TTSRequest):
    """
    Synthesize natural lady voice speech for the AI Agent across Indian languages.
    Supports Marathi, Hindi, English, Telugu, Tamil, Kannada, Bengali, and Gujarati.
    """
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        audio_bytes, voice_id, lang_code = await generate_speech_audio(
            text=req.text,
            requested_lang=req.language,
            requested_voice=req.voice
        )
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "X-Voice-Id": voice_id,
                "X-Language-Code": lang_code,
                "Cache-Control": "public, max-age=86400"
            }
        )
    except Exception as e:
        print(f"[TTS Error] {e}")
        raise HTTPException(status_code=500, detail=f"TTS synthesis error: {str(e)}")

@router.get("/chat/languages")
async def get_supported_languages():
    """Return supported conversion languages with regional details."""
    return {
        "success": True,
        "languages": list(LANGUAGE_CATALOG.values()),
        "default": "en"
    }

@router.post("/chat/translate")
async def translate_endpoint(req: TranslateRequest):
    """
    Translate English admission guidance / query to regional Indian languages:
    Marathi, Hindi, Telugu, Tamil, Kannada, Bengali, Gujarati, Malayalam, Punjabi.
    Preserves tables, cutoffs, bullet points, and college names.
    """
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    result = await translate_text(
        text=req.text,
        target_lang=req.target_lang,
        source_lang=req.source_lang or "en"
    )
    return result
