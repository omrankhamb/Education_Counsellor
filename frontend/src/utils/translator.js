// Language Converter Utility for Indian Regional Languages

const translationCache = new Map();

export const CONVERT_LANGUAGES = [
  { code: "mr", name: "Marathi", native_name: "मराठी", flag: "🚩", voiceCode: "mr" },
  { code: "hi", name: "Hindi", native_name: "हिंदी", flag: "🇮🇳", voiceCode: "hi" },
  { code: "te", name: "Telugu", native_name: "తెలుగు", flag: "🌿", voiceCode: "te" },
  { code: "ta", name: "Tamil", native_name: "தமிழ்", flag: "🦚", voiceCode: "ta" },
  { code: "kn", name: "Kannada", native_name: "ಕನ್ನಡ", flag: "🌸", voiceCode: "kn" },
  { code: "bn", name: "Bengali", native_name: "বাংলা", flag: "🌼", voiceCode: "bn" },
  { code: "gu", name: "Gujarati", native_name: "ગુજરાતી", flag: "🦁", voiceCode: "gu" },
  { code: "ml", name: "Malayalam", native_name: "മലയാളം", flag: "🌴", voiceCode: "en" },
  { code: "pa", name: "Punjabi", native_name: "ਪੰਜਾਬੀ", flag: "🌾", voiceCode: "hi" },
];

/**
 * Translate text from English to regional Indian language
 */
export async function translateContent(text, targetLang, sourceLang = "en") {
  if (!text || !text.trim()) {
    return { success: false, translatedText: "", error: "Empty text" };
  }

  if (targetLang === sourceLang || targetLang === "en") {
    return {
      success: true,
      translatedText: text,
      targetLang: "en",
      nativeName: "English",
      flag: "🇬🇧"
    };
  }

  const cacheKey = `${sourceLang}_${targetLang}_${text.trim()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const res = await fetch("/api/chat/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        target_lang: targetLang,
        source_lang: sourceLang
      })
    });

    if (!res.ok) {
      throw new Error(`Translation server error ${res.status}`);
    }

    const data = await res.json();
    if (data.success && data.translated_text) {
      const result = {
        success: true,
        translatedText: data.translated_text,
        targetLang: data.target_lang,
        nativeName: data.native_name,
        flag: data.flag,
        voiceCode: data.voice_code || data.target_lang
      };
      translationCache.set(cacheKey, result);
      return result;
    }

    return {
      success: false,
      translatedText: text,
      error: data.error || "Translation failed"
    };
  } catch (err) {
    console.warn("[Translation Error]", err);
    return {
      success: false,
      translatedText: text,
      error: err.message
    };
  }
}
