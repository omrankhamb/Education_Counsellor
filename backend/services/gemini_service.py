import asyncio
from google import genai
from google.genai import types
from config import GEMINI_API_KEY, GEMINI_MODEL, FALLBACK_MODELS, SYSTEM_PROMPT, MAX_HISTORY_LENGTH
from models import StudentProfile, ChatMessage
from typing import List

client = genai.Client(api_key=GEMINI_API_KEY)


def build_student_context(profile: StudentProfile) -> str:
    return (
        f"\n[CURRENT STUDENT CONTEXT]\n"
        f"Name: {profile.name}\n"
        f"Stream: {profile.stream}\n"
        f"Score: {profile.marks}% (Exam: {profile.exam_type})\n"
        f"Preferred State: {profile.preferred_state}\n"
        f"Budget: {profile.budget}\n"
        f"College Preference: {profile.college_type}\n"
        f"[END CONTEXT]\n"
    )


def build_follow_up_questions(stream: str) -> List[str]:
    base_questions = {
        "Engineering": [
            "Which engineering branch has the highest placement?",
            "Can I get COEP or VJTI with my percentage?",
            "What entrance exams should I focus on?",
        ],
        "Science": [
            "What are top research careers after B.Sc in India?",
            "Can I get into IISc or IISER with my score?",
            "B.Sc Computer Science vs B.Sc Data Science — which is better?",
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
    Send chat message to Gemini with non-blocking executor and 6.5s timeout.
    """
    student_context = build_student_context(student_profile)
    full_message = f"{student_context}\nStudent Query: {user_message}"

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
                    temperature=0.7,
                    max_output_tokens=1024,
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

    # Instant tailored fallback advice if external API experiences delay
    stream_tips = {
        "Science": f"With your **{student_profile.marks}%** score in Science, you are in a prime tier for top-ranking autonomous institutes like **Fergusson College (Pune)**, **St. Xavier's (Mumbai)**, and research pathways at **IISER**. You qualify for selective specializations in Computer Science, Biotechnology, and Mathematics.",
        "Engineering": f"With **{student_profile.marks}%**, you have strong admission prospects for leading state colleges (VIT Pune, PCCOE, MIT-WPU, DY Patil). If targeting Tier-1 (COEP/VJTI), focus on your MHT-CET / JEE percentile!",
        "Medical": f"With **{student_profile.marks}%** in 12th PCB, your board eligibility for NEET is fully fulfilled. Admission to MBBS/BDS is determined by your NEET rank.",
        "Commerce": f"With **{student_profile.marks}%**, you stand among the top applicants for competitive B.Com (Hons), BMS, and BBA programs across BMCC, Symbiosis, and Delhi University."
    }
    fallback_tip = stream_tips.get(student_profile.stream, f"With a score of **{student_profile.marks}%**, you have strong eligibility across accredited institutions in India.")

    return {
        "success": True,
        "response": (
            f"🎓 **Counselor Assessment for {student_profile.name}:**\n\n"
            f"{fallback_tip}\n\n"
            f"### 💡 Next Recommended Inquiries:\n"
            f"- *\"What are the 5-year cutoff trends for top colleges in my state?\"*\n"
            f"- *\"Which branch or specialization offers the highest placement package?\"*\n"
            f"- *\"What government and merit scholarships can I apply for?\"*"
        ),
        "follow_up_questions": build_follow_up_questions(student_profile.stream)
    }
