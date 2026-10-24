import asyncio
import re
from google import genai
from google.genai import types
from config import GEMINI_API_KEY, GEMINI_MODEL, FALLBACK_MODELS, SYSTEM_PROMPT, MAX_HISTORY_LENGTH
from models import StudentProfile, ChatMessage
from typing import List

from services.recommender import format_score_text

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


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
    
    # 1. RAG Semantic Vector Retrieval from ChromaDB All-India Collection
    retrieved_context = ""
    retrieved_sources = []
    if not is_greeting(user_message):
        try:
            from services.vector_store import search_colleges_semantic
            query_enriched = f"{student_profile.stream} {user_message}"
            matches = search_colleges_semantic(query_enriched, n_results=3)
            if matches:
                context_docs = [m["document"] for m in matches]
                for m in matches:
                    src = m.get("metadata", {}).get("source_document")
                    if src and src not in retrieved_sources:
                        retrieved_sources.append(src)
                retrieved_context = (
                    "\n\n[GROUNDED RETRIEVAL FROM ALL-INDIA VECTOR DATABASE & OFFICIAL GAZETTES]:\n"
                    + "\n---\n".join(context_docs)
                    + "\n[MANDATORY INSTRUCTION: You MUST ground your factual answers strictly in the retrieved data above. Always cite the verified source document. Do NOT make up cutoffs or numbers.]\n"
                )
        except Exception as e:
            print(f"[RAG] Vector search notice: {e}")

    # Detect whether this is an ongoing dialogue or the very first message
    user_msgs_in_history = [m for m in history if m.role == "user"]
    is_ongoing_chat = len(user_msgs_in_history) > 0

    # Adaptive prompt instruction based on query type
    if is_greeting(user_message) and not is_ongoing_chat:
        directive = (
            f"[Directive: First greeting of conversation. Greet {student_profile.name} warmly and conversationally in 2 short sentences. "
            f"Acknowledge their target stream ({student_profile.stream}) and score, and ask how you can help them today. DO NOT produce tables.]"
        )
    elif is_greeting(user_message) and is_ongoing_chat:
        directive = (
            "[Directive: Ongoing chat pleasantry. Reply naturally in 1 short conversational sentence without re-introducing yourself or repeating the student's name.]"
        )
    elif any(kw in user_message.lower() for kw in ["table", "compare", "cutoff list", "cutoffs", "list of colleges", "best colleges"]):
        directive = (
            f"[Directive: Ongoing dialogue — STRICT: DO NOT start with 'Hello {student_profile.name}!' or any greeting pleasantries. "
            f"Provide a clean, compact markdown comparison table (4-6 colleges max) with a short 2-line practical verdict for their score.]"
        )
    else:
        directive = (
            f"[Directive: Ongoing dialogue — STRICT: DO NOT start with 'Hello {student_profile.name}!' or repeat the student's name. "
            f"Dive straight into the answer to the student's question directly, insightfully, and concisely in 1 to 2 crisp paragraphs or bullet points.]"
        )

    full_message = f"{student_context}{retrieved_context}\nStudent Query: {user_message}\n{directive}"

    gemini_history = []
    recent_history = history[-MAX_HISTORY_LENGTH:]
    for msg in recent_history:
        role = "user" if msg.role == "user" else "model"
        gemini_history.append(
            types.Content(role=role, parts=[types.Part(text=msg.content)])
        )

    models_to_try = [GEMINI_MODEL] + [m for m in FALLBACK_MODELS if m != GEMINI_MODEL] if client else []
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

            # Non-blocking run with 18.0-second timeout safeguard
            response = await asyncio.wait_for(
                loop.run_in_executor(None, lambda: chat.send_message(full_message)),
                timeout=18.0
            )

            ai_text = extract_text(response)
            if ai_text:
                # Remove redundant leading name greetings on ongoing responses
                if is_ongoing_chat or not is_greeting(user_message):
                    ai_text = re.sub(
                        r"^(Hello|Hi|Hey|Greetings|Dear)\s+[\w\s]{2,30}[!,\.-]\s*",
                        "",
                        ai_text.strip(),
                        flags=re.IGNORECASE
                    )

                follow_ups = build_follow_up_questions(student_profile.stream)
                return {
                    "success": True,
                    "response": ai_text.strip(),
                    "follow_up_questions": follow_ups,
                    "sources": retrieved_sources
                }
        except Exception as e:
            print(f"Chat model {model_name} failed: {e}")
            continue

    # Fallback response if external API is slow
    fallback_tip = f"Regarding {student_profile.stream} admissions, your profile has strong potential across top institutions. How can I guide you further regarding cutoffs, branches, or entrance counseling?"
    return {
        "success": True,
        "response": fallback_tip,
        "follow_up_questions": build_follow_up_questions(student_profile.stream),
        "sources": retrieved_sources
    }

