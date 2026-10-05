import asyncio
import re
from google import genai
from google.genai import types
from config import GEMINI_API_KEY, GEMINI_MODEL, FALLBACK_MODELS, SYSTEM_PROMPT, MAX_HISTORY_LENGTH
from models import StudentProfile, ChatMessage
from typing import List

from services.recommender import format_score_text

client = genai.Client(api_key=GEMINI_API_KEY)


def build_student_context(profile: StudentProfile) -> str:
    formatted_score = format_score_text(profile.marks, profile.exam_type, getattr(profile, "score_unit", ""))
    return (
        f"[Student Profile Context: Name: {profile.name}, Stream: {profile.stream}, "
        f"Score: {formatted_score} ({profile.exam_type}), Preferred State: {profile.preferred_state}, "
        f"Budget: {profile.budget}, College Type: {profile.college_type}]"
    )


def is_greeting(text: str) -> bool:
    """Check if the user input is a greeting or brief pleasantry."""
    clean = re.sub(r"[^\w\s]", "", text.strip().lower())
    greetings = {
        "hi", "hii", "hiii", "hello", "helloo", "hey", "heyy",
        "hii counseler", "hi counselor", "hello counselor", "hey counselor",
        "good morning", "good evening", "good afternoon", "namaste", "namaskar",
        "how are you", "who are you", "thanks", "thank you", "ok", "okay"
    }
    if clean in greetings:
        return True
    words = clean.split()
    if len(words) <= 3 and words[0] in {"hi", "hii", "hello", "hey", "namaste"}:
        return True
    return False


def build_follow_up_questions(stream: str) -> List[str]:
    base_questions = {
        "Design": [
            "What are top NID & NIFT campuses for my score?",
            "How should I prepare for DAT Mains & Studio Test?",
            "What are UX & Product Design salary packages?",
        ],
        "Law": [
            "Which top NLUs can I get with my CLAT score?",
            "Corporate Law vs Litigation — placement reality?",
            "Cutoffs for NALSAR, NLSIU, and WBNUJS?",
        ],
        "Engineering": [
            "Which engineering branch has the highest placement?",
            "Can I get COEP or VJTI with my percentage?",
            "What entrance exams should I focus on?",
        ],
        "Science": [
            "What are top research careers after B.Sc in India?",
            "Can I get into IISc or IISER with my score?",
            "B.Sc Computer Science vs Data Science career prospects?",
        ],
        "Medical": [
            "What NEET cutoff is required for government MBBS?",
            "What are good alternatives if I don't get MBBS?",
            "Tell me about top medical colleges in my state.",
        ],
        "Commerce": [
            "B.Com vs BBA — which is better for career?",
            "What career steps should I take for CA or MBA?",
            "Top colleges for commerce in Maharashtra and Delhi?",
        ],
        "Arts": [
            "How do I prepare for UPSC Civil Services after 12th?",
            "Top humanities & journalism colleges in India?",
            "What high-paying careers exist in Arts?",
        ],
    }
    generic = [
        "Which college is the safest option for my marks?",
        "What scholarships can I apply for right now?",
        "Compare top government vs private colleges.",
    ]
    return base_questions.get(stream, generic)[:3]


def extract_text(response) -> str:
    try:
        if response.text:
            return response.text
    except Exception:
        pass

    try:
        if hasattr(response, "candidates") and response.candidates:
            for candidate in response.candidates:
                if hasattr(candidate, "content") and hasattr(candidate.content, "parts"):
                    for part in candidate.content.parts:
                        if hasattr(part, "text") and part.text:
                            return part.text
    except Exception:
        pass

    return ""


async def chat_with_gemini(
    user_message: str,
    student_profile: StudentProfile,
    history: List[ChatMessage]
) -> dict:
    """
    Send chat message to Gemini with adaptive length control and conversational sizing.
    """
    student_context = build_student_context(student_profile)
    
    # Adaptive prompt instruction based on query type
    if is_greeting(user_message):
        directive = (
            "[Directive: The student is greeting you. Respond warmly, politely, and conversationally in 2 to 3 natural sentences. "
            "Acknowledge their stream and score, and ask how you can help them today. DO NOT produce any tables, lists, or long cutoffs.]"
        )
    elif any(kw in user_message.lower() for kw in ["table", "compare", "cutoff list", "cutoffs", "list of colleges", "best colleges"]):
        directive = (
            "[Directive: Provide a clean, compact markdown comparison table (4-6 colleges max) with a short 2-line practical verdict for their score.]"
        )
    else:
        directive = (
            "[Directive: Answer the student's question directly, naturally, and concisely in 1 to 2 crisp paragraphs or bullet points. "
            "Do NOT include unsolicited tables or long multi-page essays unless specifically requested.]"
        )

    full_message = f"{student_context}\nStudent Query: {user_message}\n{directive}"

    gemini_history = []
    recent_history = history[-MAX_HISTORY_LENGTH:]
    for msg in recent_history:
        role = "user" if msg.role == "user" else "model"
        gemini_history.append(
            types.Content(role=role, parts=[types.Part(text=msg.content)])
        )

    models_to_try = [GEMINI_MODEL] + [m for m in FALLBACK_MODELS if m != GEMINI_MODEL]
    loop = asyncio.get_event_loop()

    for model_name in models_to_try:
        try:
            chat = client.chats.create(
                model=model_name,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.6,
                    max_output_tokens=600,
                ),
                history=gemini_history,
            )

            # Non-blocking run with 6.5-second timeout
            response = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: chat.send_message(full_message)),
                timeout=6.5
            )

            ai_text = extract_text(response)
            if ai_text:
                follow_ups = build_follow_up_questions(student_profile.stream)
                return {
                    "success": True,
                    "response": ai_text,
                    "follow_up_questions": follow_ups,
                }
        except Exception as e:
            print(f"Chat model {model_name} failed: {e}")
            continue

    # Fallback response if external API is slow
    fallback_tip = f"Hello {student_profile.name}! Based on your {student_profile.stream} score, you have strong admission prospects. How can I guide you today regarding cutoffs, branches, or entrance counselling?"
    return {
        "success": True,
        "response": fallback_tip,
        "follow_up_questions": build_follow_up_questions(student_profile.stream)
    }
