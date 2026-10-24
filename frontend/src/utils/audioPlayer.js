// Audio player utility for Neural Lady Voice synthesis & Speech-to-Text

let currentAudio = null;
let currentAbortController = null;
let currentSessionId = 0;
const audioCache = new Map();

// Map app language code to SpeechRecognition locale
export const SPEECH_REC_LOCALES = {
  en: "en-IN",
  mr: "mr-IN",
  hi: "hi-IN",
  te: "te-IN",
  ta: "ta-IN",
  kn: "kn-IN",
  bn: "bn-IN",
  gu: "gu-IN",
  auto: "en-IN"
};

export const FEMALE_VOICE_LIST = [
  { code: "auto", name: "✨ Auto Detect", native_name: "Auto (Language Adaptive)", flag: "✨" },
  { code: "mr", name: "Aarohi (आरोही)", native_name: "मराठी (Aarohi)", flag: "🚩", id: "mr-IN-AarohiNeural" },
  { code: "hi", name: "Swara (स्वरा)", native_name: "हिंदी (Swara)", flag: "🇮🇳", id: "hi-IN-SwaraNeural" },
  { code: "en", name: "Neerja", native_name: "English (Neerja)", flag: "🇬🇧", id: "en-IN-NeerjaNeural" },
  { code: "te", name: "Shruti (శృతి)", native_name: "తెలుగు (Shruti)", flag: "🌿", id: "te-IN-ShrutiNeural" },
  { code: "ta", name: "Pallavi (பல்லவி)", native_name: "தமிழ் (Pallavi)", flag: "🦚", id: "ta-IN-PallaviNeural" },
  { code: "kn", name: "Sapna (ಸಪ್ನಾ)", native_name: "ಕನ್ನಡ (Sapna)", flag: "🌸", id: "kn-IN-SapnaNeural" },
  { code: "bn", name: "Tanishaa (তানিশা)", native_name: "বাংলা (Tanishaa)", flag: "🌼", id: "bn-IN-TanishaaNeural" },
  { code: "gu", name: "Dhwani (ધ્વનિ)", native_name: "ગુજરાતી (Dhwani)", flag: "🦁", id: "gu-IN-DhwaniNeural" },
];

/**
 * Clean markdown and extract a concise key summary (max ~280 chars)
 * for fast network transmission & sub-second audio synthesis
 */
export function prepareTextForSpeech(rawText, maxChars = 280) {
  if (!rawText) return "";
  let text = String(rawText);

  // Strip code blocks
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`([^`]+)`/g, "$1");

  // Strip markdown tables
  text = text.split("\n")
    .filter(line => !line.trim().startsWith("|"))
    .join("\n");

  // Strip links [label](url) -> label
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");

  // Strip headers, bold, italics, bullets
  text = text.replace(/^#{1,6}\s*/gm, "");
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/_([^_]+)_/g, "$1");
  text = text.replace(/^\s*[-*•]\s+/gm, "");
  text = text.replace(/^\s*\d+\.\s+/gm, "");

  // Strip citation markers and excessive emoji
  text = text.replace(/\[\d+\]/g, "");
  text = text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "");

  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Smart sentence-boundary truncation
  if (text.length > maxChars) {
    const trimmed = text.slice(0, maxChars);
    const lastPunct = Math.max(
      trimmed.lastIndexOf("."),
      trimmed.lastIndexOf("!"),
      trimmed.lastIndexOf("?"),
      trimmed.lastIndexOf("।")
    );
    if (lastPunct > maxChars * 0.45) {
      text = trimmed.slice(0, lastPunct + 1).trim();
    } else {
      text = trimmed.trim() + "...";
    }
  }

  return text;
}

/**
 * Play voice using browser Web Speech API (instantaneous, 0ms latency)
 */
function speakWithBrowserSpeech(text, langCode, { onStart, onEnd, onError, sessionId }) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return false;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.05;

    const langMap = {
      en: "en-IN",
      hi: "hi-IN",
      mr: "mr-IN",
      te: "te-IN",
      ta: "ta-IN",
      kn: "kn-IN",
      bn: "bn-IN",
      gu: "gu-IN",
      auto: "en-IN"
    };
    utterance.lang = langMap[langCode] || "en-IN";

    // Try to pick a natural female voice
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const femaleVoice = voices.find(v => {
        const vLang = v.lang.toLowerCase();
        const vName = v.name.toLowerCase();
        const matchesLang = vLang.includes(langCode) || vLang.includes(utterance.lang.toLowerCase());
        const isFemale = vName.includes("female") || vName.includes("neerja") || vName.includes("swara") || vName.includes("heera") || vName.includes("zira") || vName.includes("priya");
        return matchesLang && isFemale;
      }) || voices.find(v => v.lang.toLowerCase().includes(langCode));

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
    }

    utterance.onstart = () => {
      if (sessionId === currentSessionId && onStart) onStart();
    };

    utterance.onend = () => {
      if (sessionId === currentSessionId && onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn("[WebSpeech Error]", e);
      if (sessionId === currentSessionId && onError) onError(e);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn("[WebSpeech exception]", err);
    return false;
  }
}

/**
 * Play AI Lady voice response via backend neural TTS with instant stop and fast synthesis
 */
export async function playLadyVoice(rawText, { language = "auto", voice = null, onStart, onEnd, onError } = {}) {
  // 1. Immediately terminate any previous audio playback & invalidate previous session
  stopLadyVoice();
  const thisSessionId = ++currentSessionId;

  const speechText = prepareTextForSpeech(rawText, 280);
  if (!speechText) {
    if (onError) onError(new Error("No text to speak"));
    return false;
  }

  // 2. Check in-memory audio cache first for instant sub-millisecond playback
  const cacheKey = `${language}_${voice || "def"}_${speechText}`;
  let audioUrl = audioCache.get(cacheKey);

  // 3. If not cached, fetch neural audio from backend with AbortController
  if (!audioUrl) {
    const controller = new AbortController();
    currentAbortController = controller;

    // Timeout: If backend takes more than 4 seconds, abort and fallback to browser Web Speech
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 4000);

    try {
      const payload = { text: speechText };
      if (language && language !== "auto") payload.language = language;
      if (voice) payload.voice = voice;

      const res = await fetch("/api/chat/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Check if user clicked STOP while fetch was in flight
      if (thisSessionId !== currentSessionId) {
        return false;
      }

      if (!res.ok) {
        throw new Error(`TTS server responded with ${res.status}`);
      }

      const blob = await res.blob();
      if (thisSessionId !== currentSessionId) {
        return false;
      }

      audioUrl = URL.createObjectURL(blob);
      audioCache.set(cacheKey, audioUrl);
    } catch (err) {
      clearTimeout(timeoutId);

      // If user stopped voice intentionally, exit cleanly
      if (thisSessionId !== currentSessionId || err.name === "AbortError") {
        return false;
      }

      console.warn("[TTS fetch failed/timed out, falling back to Web Speech]", err.message);

      // Instant Fallback to browser Web Speech API
      const fallbackSuccess = speakWithBrowserSpeech(speechText, language, {
        onStart,
        onEnd,
        onError,
        sessionId: thisSessionId
      });

      return fallbackSuccess;
    } finally {
      if (currentAbortController === controller) {
        currentAbortController = null;
      }
    }
  }

  // 4. Verification: Did user stop while audio was being downloaded?
  if (thisSessionId !== currentSessionId) {
    return false;
  }

  // 5. Create Audio element and play
  try {
    const audio = new Audio(audioUrl);
    currentAudio = audio;

    audio.onplay = () => {
      if (thisSessionId === currentSessionId && onStart) {
        onStart();
      }
    };

    audio.onended = () => {
      if (thisSessionId === currentSessionId) {
        currentAudio = null;
        if (onEnd) onEnd();
      }
    };

    audio.onerror = (e) => {
      if (thisSessionId === currentSessionId) {
        console.warn("[TTS Audio Element Error]", e);
        currentAudio = null;
        if (onError) onError(e);
      }
    };

    await audio.play();
    return true;
  } catch (playErr) {
    if (thisSessionId !== currentSessionId || playErr.name === "AbortError") {
      // Intentionally cancelled by user click
      return false;
    }
    console.warn("[audio.play() error, trying Web Speech]", playErr);
    currentAudio = null;

    return speakWithBrowserSpeech(speechText, language, {
      onStart,
      onEnd,
      onError,
      sessionId: thisSessionId
    });
  }
}

/**
 * 100% Reliable, Instant Stop for Voice Audio & Web Speech
 */
export function stopLadyVoice() {
  // Invalidate any active session immediately so pending callbacks/fetches abort
  currentSessionId++;

  // 1. Abort any active HTTP synthesis request
  if (currentAbortController) {
    try {
      currentAbortController.abort();
    } catch {}
    currentAbortController = null;
  }

  // 2. Pause and completely destroy HTML5 audio element
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.onplay = null;
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.removeAttribute("src");
      currentAudio.load();
    } catch (e) {
      console.warn("[stopLadyVoice pause error]", e);
    }
    currentAudio = null;
  }

  // 3. Immediately cancel browser speech synthesis if active
  if (typeof window !== "undefined" && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.pause();
    } catch {}
  }
}

/**
 * Check if voice is actively speaking
 */
export function isLadyVoicePlaying() {
  const isAudioPlaying = Boolean(currentAudio && !currentAudio.paused && !currentAudio.ended);
  const isWebSpeechSpeaking = typeof window !== "undefined" && Boolean(window.speechSynthesis?.speaking);
  return isAudioPlaying || isWebSpeechSpeaking;
}

/**
 * Speech-to-Text Recognition Controller
 */
let activeRecognition = null;

export function isSpeechRecognitionSupported() {
  return typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startSpeechToText({ lang = "en", onResult, onError, onEnd }) {
  if (!isSpeechRecognitionSupported()) {
    if (onError) onError(new Error("Speech recognition is not supported in this browser. Please use Google Chrome or Edge."));
    return null;
  }

  stopSpeechToText();

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRec();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = SPEECH_REC_LOCALES[lang] || SPEECH_REC_LOCALES["en"];

  recognition.onresult = (event) => {
    let finalTranscript = "";
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    if (onResult) {
      onResult({
        final: finalTranscript.trim(),
        interim: interimTranscript.trim()
      });
    }
  };

  recognition.onerror = (event) => {
    console.warn("[SpeechRecognition Error]", event.error);
    if (onError) onError(event);
  };

  recognition.onend = () => {
    activeRecognition = null;
    if (onEnd) onEnd();
  };

  try {
    recognition.start();
    activeRecognition = recognition;
    return recognition;
  } catch (err) {
    console.warn("[SpeechRecognition Start Failed]", err);
    if (onError) onError(err);
    return null;
  }
}

export function stopSpeechToText() {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch {}
    activeRecognition = null;
  }
}
