import re
import asyncio
import edge_tts

FEMALE_VOICE_PACK = {
    "en": {
        "id": "en-IN-NeerjaNeural",
        "name": "Neerja",
        "lang": "English (India)",
        "native_name": "English (Indian)",
        "code": "en",
        "flag": "🇬🇧",
        "description": "Pleasant, articulate Indian English female voice"
    },
    "mr": {
        "id": "mr-IN-AarohiNeural",
        "name": "Aarohi",
        "lang": "Marathi",
        "native_name": "मराठी (आरोही)",
        "code": "mr",
        "flag": "🚩",
        "description": "Natural, authentic Marathi female voice"
    },
    "hi": {
        "id": "hi-IN-SwaraNeural",
        "name": "Swara",
        "lang": "Hindi",
        "native_name": "हिंदी (स्वरा)",
        "code": "hi",
        "flag": "🇮🇳",
        "description": "Warm, expressive Hindi female voice"
    },
    "te": {
        "id": "te-IN-ShrutiNeural",
        "name": "Shruti",
        "lang": "Telugu",
        "native_name": "తెలుగు (శృతి)",
        "code": "te",
        "flag": "🌿",
        "description": "Melodious, fluent Telugu female voice"
    },
    "ta": {
        "id": "ta-IN-PallaviNeural",
        "name": "Pallavi",
        "lang": "Tamil",
        "native_name": "தமிழ் (பல்லவி)",
        "code": "ta",
        "flag": "🦚",
        "description": "Articulate Tamil female voice"
    },
    "kn": {
        "id": "kn-IN-SapnaNeural",
        "name": "Sapna",
        "lang": "Kannada",
        "native_name": "ಕನ್ನಡ (ಸಪ್ನಾ)",
        "code": "kn",
        "flag": "🌸",
        "description": "Expressive Kannada female voice"
    },
    "bn": {
        "id": "bn-IN-TanishaaNeural",
        "name": "Tanishaa",
        "lang": "Bengali",
        "native_name": "বাংলা (তানিশা)",
        "code": "bn",
        "flag": "🌼",
        "description": "Sweet, fluent Bengali female voice"
    },
    "gu": {
        "id": "gu-IN-DhwaniNeural",
        "name": "Dhwani",
        "lang": "Gujarati",
        "native_name": "ગુજરાતી (ધ્વનિ)",
        "code": "gu",
        "flag": "🦁",
        "description": "Natural Gujarati female voice"
    }
}

MARATHI_KEYWORDS = [
    "आहे", "नाही", "कसे", "करावे", "करू", "तुम्हाला", "प्रवेश", "सल्लागार",
    "माहिती", "महाविद्यालय", "जागा", "अभियांत्रिकी", "वैद्यकीय", "शाखा",
    "मिळेल", "कोणते", "पात्रता", "फेरी", "पाहिजे", "करा", "होईल"
]


def detect_text_language(text: str) -> str:
    """Detect language of the text using script analysis and linguistic heuristics."""
    if not text:
        return "en"

    # Telugu script
    if re.search(r"[\u0C00-\u0C7F]", text):
        return "te"
    # Tamil script
    if re.search(r"[\u0B80-\u0BFF]", text):
        return "ta"
    # Kannada script
    if re.search(r"[\u0C80-\u0CFF]", text):
        return "kn"
    # Bengali script
    if re.search(r"[\u0980-\u09FF]", text):
        return "bn"
    # Gujarati script
    if re.search(r"[\u0A80-\u0AFF]", text):
        return "gu"

    # Devanagari script (Hindi vs Marathi)
    if re.search(r"[\u0900-\u097F]", text):
        lower_txt = text.lower()
        if any(w in lower_txt for w in MARATHI_KEYWORDS):
            return "mr"
        return "hi"

    return "en"


_TTS_MEMORY_CACHE: dict[str, tuple[bytes, str, str]] = {}
_MAX_CACHE_ENTRIES = 120


def clean_text_for_speech(markdown_text: str, max_chars: int = 320) -> str:
    """
    Remove markdown tables, links, code blocks, excessive symbols and formatting.
    Keeps speech punchy, concise (max 320 chars), and instantaneous to synthesize.
    """
    if not markdown_text:
        return ""

    text = markdown_text

    # 1. Remove code blocks
    text = re.sub(r"```[\s\S]*?```", " Code snippet omitted. ", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)

    # 2. Remove markdown tables (| header | -> clean text)
    lines = text.split("\n")
    clean_lines = []
    in_table = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("|") and stripped.endswith("|"):
            in_table = True
            cells = [c.strip() for c in stripped.split("|") if c.strip() and not re.match(r"^:?-+:?$", c.strip())]
            if cells and not any("---" in c for c in cells):
                clean_lines.append(", ".join(cells) + ".")
            continue
        else:
            in_table = False
            clean_lines.append(line)

    text = "\n".join(clean_lines)

    # 3. Replace markdown links [text](url) -> text
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)

    # 4. Remove headings (#, ##, ###)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)

    # 5. Remove bold / italic (*, **, _, __)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    text = re.sub(r"__([^_]+)__", r"\1", text)
    text = re.sub(r"_([^_]+)_", r"\1", text)

    # 6. Remove bullet markers (-, *, 1., 2.)
    text = re.sub(r"^\s*[-*•]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*\d+\.\s+", "", text, flags=re.MULTILINE)

    # 7. Clean excessive emojis, footnotes and citations
    text = re.sub(r"\[\d+\]", "", text)
    text = re.sub(r"[\U00010000-\U0010ffff]", "", text)

    # 8. Collapse whitespace
    text = re.sub(r"\n\s*\n+", "\n", text)
    text = re.sub(r"[ \t]+", " ", text).strip()

    # 9. Cap length to max_chars to keep speech fast and responsive
    if len(text) > max_chars:
        trimmed = text[:max_chars]
        last_punct = max(trimmed.rfind("."), trimmed.rfind("!"), trimmed.rfind("?"), trimmed.rfind("।"), trimmed.rfind("\n"))
        if last_punct > max_chars // 2:
            text = trimmed[:last_punct + 1].strip()
        else:
            text = trimmed.strip() + "..."

    return text


async def generate_speech_audio(
    text: str,
    requested_lang: str = None,
    requested_voice: str = None
) -> tuple[bytes, str, str]:
    """
    Generate natural female neural voice audio using Microsoft Edge Neural TTS.
    Returns: (audio_bytes, voice_id, lang_code) with server-side in-memory caching.
    """
    # 1. Clean speech text to short conversational length (~320 chars for fast synthesis)
    clean_text = clean_text_for_speech(text, max_chars=320)
    if not clean_text:
        clean_text = "I am ready to assist you with your college admission counseling."

    # 2. Determine voice
    if requested_voice and any(v["id"] == requested_voice for v in FEMALE_VOICE_PACK.values()):
        voice_id = requested_voice
        lang_code = next(k for k, v in FEMALE_VOICE_PACK.items() if v["id"] == requested_voice)
    elif requested_lang and requested_lang in FEMALE_VOICE_PACK:
        lang_code = requested_lang
        voice_id = FEMALE_VOICE_PACK[lang_code]["id"]
    else:
        # Auto detect based on message text content
        lang_code = detect_text_language(clean_text)
        voice_id = FEMALE_VOICE_PACK.get(lang_code, FEMALE_VOICE_PACK["en"])["id"]

    # 3. Check memory cache for instant sub-millisecond response
    cache_key = f"{voice_id}_{clean_text}"
    if cache_key in _TTS_MEMORY_CACHE:
        return _TTS_MEMORY_CACHE[cache_key]

    # 4. Stream from edge_tts into audio bytes with slightly brisker rate (+10%) for responsiveness
    communicate = edge_tts.Communicate(clean_text, voice_id, rate="+10%")
    audio_buffer = bytearray()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_buffer.extend(chunk["data"])

    result = (bytes(audio_buffer), voice_id, lang_code)

    # Cache result (keep cache size bounded)
    if len(_TTS_MEMORY_CACHE) >= _MAX_CACHE_ENTRIES:
        _TTS_MEMORY_CACHE.pop(next(iter(_TTS_MEMORY_CACHE)))
    _TTS_MEMORY_CACHE[cache_key] = result

    return result
