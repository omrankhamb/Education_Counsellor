import asyncio
import re
from typing import Optional, Dict
from google import genai
from google.genai import types
from config import GEMINI_API_KEY, GEMINI_MODEL, FALLBACK_MODELS

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# Supported conversion languages for Indian students
LANGUAGE_CATALOG: Dict[str, dict] = {
    "mr": {
        "code": "mr",
        "name": "Marathi",
        "native_name": "मराठी",
        "flag": "🚩",
        "voice_code": "mr",
        "voice_name": "Aarohi (आरोही)"
    },
    "hi": {
        "code": "hi",
        "name": "Hindi",
        "native_name": "हिंदी",
        "flag": "🇮🇳",
        "voice_code": "hi",
        "voice_name": "Swara (स्वरा)"
    },
    "te": {
        "code": "te",
        "name": "Telugu",
        "native_name": "తెలుగు",
        "flag": "🌿",
        "voice_code": "te",
        "voice_name": "Shruti (శృతి)"
    },
    "ta": {
        "code": "ta",
        "name": "Tamil",
        "native_name": "தமிழ்",
        "flag": "🦚",
        "voice_code": "ta",
        "voice_name": "Pallavi (பல்லவி)"
    },
    "kn": {
        "code": "kn",
        "name": "Kannada",
        "native_name": "ಕನ್ನಡ",
        "flag": "🌸",
        "voice_code": "kn",
        "voice_name": "Sapna (ಸಪ್ನಾ)"
    },
    "bn": {
        "code": "bn",
        "name": "Bengali",
        "native_name": "বাংলা",
        "flag": "🌼",
        "voice_code": "bn",
        "voice_name": "Tanishaa (তানিশা)"
    },
    "gu": {
        "code": "gu",
        "name": "Gujarati",
        "native_name": "ગુજરાતી",
        "flag": "🦁",
        "voice_code": "gu",
        "voice_name": "Dhwani (ધ્વનિ)"
    },
    "ml": {
        "code": "ml",
        "name": "Malayalam",
        "native_name": "മലയാളം",
        "flag": "🌴",
        "voice_code": "en",
        "voice_name": "English / Neutral"
    },
    "pa": {
        "code": "pa",
        "name": "Punjabi",
        "native_name": "ਪੰਜਾਬੀ",
        "flag": "🌾",
        "voice_code": "hi",
        "voice_name": "Swara (हिंदी/पंजाबी)"
    },
    "en": {
        "code": "en",
        "name": "English",
        "native_name": "English",
        "flag": "🇬🇧",
        "voice_code": "en",
        "voice_name": "Neerja (English)"
    }
}

# In-memory translation cache (LRU-like dict)
_TRANSLATION_CACHE: Dict[str, str] = {}
MAX_CACHE_SIZE = 500


def clean_translation_output(raw_text: str) -> str:
    """Strips preamble like 'Here is the translation in Marathi:' or conversational wrapper."""
    text = raw_text.strip()
    # Remove common preamble patterns
    preambles = [
        r"^Here is the translation[^:\n]*:\s*",
        r"^Here's the translation[^:\n]*:\s*",
        r"^Translated text[^:\n]*:\s*",
        r"^Translation[^:\n]*:\s*",
        r"^Sure,? here is the translation[^:\n]*:\s*",
        r"^Sure,? here's the translation[^:\n]*:\s*",
    ]
    for pattern in preambles:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)
    return text.strip()


async def translate_text(
    text: str,
    target_lang: str,
    source_lang: str = "en"
) -> dict:
    """
    Translate English admission guidance / student queries to regional Indian languages.
    Preserves tables, bold markdown, headings, numbers, cutoffs, and college names.
    """
    clean_text = text.strip()
    if not clean_text:
        return {
            "success": False,
            "error": "Empty text provided",
            "translated_text": ""
        }

    lang_info = LANGUAGE_CATALOG.get(target_lang.lower())
    if not lang_info:
        # Default to Hindi if unknown code
        lang_info = LANGUAGE_CATALOG["hi"]
        target_lang = "hi"

    # If target is same as source, return original
    if target_lang.lower() == source_lang.lower() or target_lang == "en":
        return {
            "success": True,
            "original_text": clean_text,
            "translated_text": clean_text,
            "target_lang": target_lang,
            "target_lang_name": lang_info["name"],
            "native_name": lang_info["native_name"],
            "flag": lang_info["flag"],
            "voice_code": lang_info["voice_code"],
            "from_cache": True
        }

    # Check in-memory cache
    cache_key = f"{source_lang}_{target_lang}_{clean_text[:150]}_{hash(clean_text)}"
    if cache_key in _TRANSLATION_CACHE:
        return {
            "success": True,
            "original_text": clean_text,
            "translated_text": _TRANSLATION_CACHE[cache_key],
            "target_lang": target_lang,
            "target_lang_name": lang_info["name"],
            "native_name": lang_info["native_name"],
            "flag": lang_info["flag"],
            "voice_code": lang_info["voice_code"],
            "from_cache": True
        }

    target_name = lang_info["name"]
    native_name = lang_info["native_name"]

    prompt = (
        f"You are a dedicated educational counselor and translator for Indian students.\n"
        f"Task: Accurately translate the following English educational guidance into {target_name} ({native_name}).\n\n"
        f"CRITICAL TRANSLATION GUIDELINES:\n"
        f"1. Preserve the full Markdown formatting: preserve table pipes `|`, headings `#`, bullets `•`, bold `**text**`, and quotes `>`.\n"
        f"2. Keep educational terminology, college names, and exam names intact (e.g., COEP Pune, VJTI Mumbai, IIT Bombay, MHT-CET, JEE Main, JoSAA, CAP Round 1, AIR, Percentile).\n"
        f"3. Keep all numbers, percentages, fees (₹), and cutoffs unchanged.\n"
        f"4. The tone must be natural, respectful, empathetic, and encouraging for a high school or college student.\n"
        f"5. IMPORTANT: Output ONLY the translated content. Do NOT add notes like 'Here is the translation in {target_name}:'.\n\n"
        f"Original English Content:\n{clean_text}"
    )

    models_to_try = [GEMINI_MODEL] + [m for m in FALLBACK_MODELS if m != GEMINI_MODEL]
    loop = asyncio.get_event_loop()

    for model_name in models_to_try:
        try:
            response = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=0.3,
                            max_output_tokens=1000,
                        )
                    )
                ),
                timeout=7.0
            )

            raw_result = ""
            if hasattr(response, "text") and response.text:
                raw_result = response.text
            elif hasattr(response, "candidates") and response.candidates:
                for candidate in response.candidates:
                    if hasattr(candidate, "content") and hasattr(candidate.content, "parts"):
                        for part in candidate.content.parts:
                            if hasattr(part, "text") and part.text:
                                raw_result += part.text

            if raw_result:
                translated = clean_translation_output(raw_result)
                
                # Store in cache
                if len(_TRANSLATION_CACHE) > MAX_CACHE_SIZE:
                    _TRANSLATION_CACHE.clear()
                _TRANSLATION_CACHE[cache_key] = translated

                return {
                    "success": True,
                    "original_text": clean_text,
                    "translated_text": translated,
                    "target_lang": target_lang,
                    "target_lang_name": target_name,
                    "native_name": native_name,
                    "flag": lang_info["flag"],
                    "voice_code": lang_info["voice_code"],
                    "from_cache": False
                }
        except Exception as e:
            print(f"[Translation] Model {model_name} notice: {e}")
            continue

    # Fallback if AI models are temporarily unreachable: return clean original with notice
    return {
        "success": False,
        "error": "Translation service timed out. Please try again.",
        "original_text": clean_text,
        "translated_text": clean_text,
        "target_lang": target_lang,
        "target_lang_name": target_name,
        "native_name": native_name,
        "flag": lang_info["flag"],
        "voice_code": lang_info["voice_code"],
        "from_cache": False
    }
