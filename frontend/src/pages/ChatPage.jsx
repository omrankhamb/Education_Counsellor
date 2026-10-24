import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaGraduationCap, FaUserGraduate, FaHeadset, FaTrash, FaPaperPlane,
  FaArrowLeft, FaUser, FaUniversity, FaBriefcase,
  FaMapMarkerAlt, FaStar, FaLightbulb, FaSyncAlt,
  FaVolumeUp, FaVolumeMute, FaMicrophone, FaStop,
  FaLanguage, FaCopy, FaCheck, FaTimes, FaExchangeAlt, FaShieldAlt,
  FaRegCopy, FaThumbsUp, FaThumbsDown, FaRegThumbsUp, FaRegThumbsDown
} from "react-icons/fa";
import { MdVerified, MdSend, MdTranslate } from "react-icons/md";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "../hooks/useChat";
import { APP_NAME } from "./LandingPage";
import DocumentVerificationModal from "../components/DocumentVerificationModal";
import { formatScore } from "../utils/scoreUtils";
import {
  playLadyVoice, stopLadyVoice, isLadyVoicePlaying,
  startSpeechToText, stopSpeechToText, isSpeechRecognitionSupported,
  FEMALE_VOICE_LIST
} from "../utils/audioPlayer";
import { translateContent, CONVERT_LANGUAGES } from "../utils/translator";

const markdownComponents = {
  table: ({ node, ...props }) => (
    <div className="table-responsive my-3 shadow-sm border rounded-3 overflow-hidden bg-white">
      <table className="table table-hover table-sm mb-0 text-center align-middle" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)", color: "#ffffff" }} {...props} />
  ),
  th: ({ node, ...props }) => (
    <th className="py-2 px-3 fw-bold small text-white border-0 text-nowrap" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="py-2 px-3 small border-bottom" style={{ color: "#2C3E50" }} {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <div
      className="my-3 p-3 rounded-3"
      style={{
        borderLeft: "4px solid #FFB300",
        background: "#FFFBF0",
        color: "#5D4037",
        fontSize: "13.5px",
        boxShadow: "0 2px 8px rgba(255,179,0,0.08)"
      }}
      {...props}
    />
  ),
  h1: ({ node, ...props }) => <h5 className="fw-bold mt-3 mb-2" style={{ color: "#1A237E", fontFamily: "'Poppins',sans-serif" }} {...props} />,
  h2: ({ node, ...props }) => <h5 className="fw-bold mt-3 mb-2" style={{ color: "#1A237E", fontFamily: "'Poppins',sans-serif" }} {...props} />,
  h3: ({ node, ...props }) => <h6 className="fw-bold mt-3 mb-2 pb-1 border-bottom d-inline-block text-primary" style={{ fontFamily: "'Poppins',sans-serif" }} {...props} />,
  h4: ({ node, ...props }) => <h6 className="fw-bold mt-2 mb-1" style={{ color: "#3949AB" }} {...props} />,
  ul: ({ node, ...props }) => <ul className="ps-3 mb-2" style={{ lineHeight: "1.75" }} {...props} />,
  ol: ({ node, ...props }) => <ol className="ps-3 mb-2" style={{ lineHeight: "1.75" }} {...props} />,
  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
  strong: ({ node, ...props }) => <strong style={{ color: "#1A237E", fontWeight: 700 }} {...props} />,
  p: ({ node, ...props }) => <p className="mb-2" style={{ lineHeight: "1.7" }} {...props} />,
  code: ({ node, inline, children, ...props }) => {
    const text = String(children).replace(/\n$/, "");
    if (inline || !text.includes("\n")) {
      return (
        <code className="px-2 py-0.5 rounded text-primary bg-light border small font-monospace" {...props}>
          {children}
        </code>
      );
    }
    return (
      <div className="p-2 bg-light text-dark rounded-2 my-2 small border overflow-auto">
        <code className="font-monospace text-secondary">{children}</code>
      </div>
    );
  },
  a: ({ node, ...props }) => (
    <a
      className="text-primary fw-semibold text-decoration-underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
};

export default function ChatPage({ studentProfile, currentUser, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Safely resolve active student profile with fallback
  const activeProfile = studentProfile || (() => {
    try {
      const stored = localStorage.getItem("edu_student_profile");
      if (stored) return JSON.parse(stored);
    } catch {}
    try {
      const u = localStorage.getItem("edu_user");
      if (u) {
        const parsed = JSON.parse(u);
        return {
          name: parsed.name || "Student",
          stream: "Science / Engineering",
          marks: 85,
          exam_type: "MHT-CET",
          preferred_state: "Any"
        };
      }
    } catch {}
    return {
      name: currentUser?.name || "Student",
      stream: "Science / Engineering",
      marks: 85,
      exam_type: "MHT-CET",
      preferred_state: "Any"
    };
  })();

  const { messages, loading, followUps, sendMessage, regenerateMessage, clearChat } = useChat(activeProfile);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const initialSentRef = useRef(false);

  // Message Bottom Action Bar States: Copy, Feedback (like/dislike)
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [feedbackState, setFeedbackState] = useState({});

  const handleCopyMessage = async (idx, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.warn("Could not copy message:", err);
    }
  };

  const handleToggleFeedback = (idx, type) => {
    setFeedbackState((prev) => ({
      ...prev,
      [idx]: prev[idx] === type ? null : type
    }));
  };

  const handleRegenerateResponse = (idx) => {
    if (speakingMsgIndex !== null) {
      stopLadyVoice();
      setSpeakingMsgIndex(null);
    }
    regenerateMessage(idx);
  };

  // Female Voice Pack & Speech-to-Text States
  const [selectedVoiceLang, setSelectedVoiceLang] = useState(() => {
    return localStorage.getItem("edu_voice_lang") || "auto";
  });
  // Auto-Voice strictly starts OFF until the student explicitly clicks the button
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const lastSpokenIndexRef = useRef(-1);

  // Cleanup audio & mic on mount and unmount; guarantee voice starts OFF
  useEffect(() => {
    stopLadyVoice();
    stopSpeechToText();
    try {
      localStorage.removeItem("edu_auto_speak");
    } catch {}
    return () => {
      stopLadyVoice();
      stopSpeechToText();
    };
  }, []);

  // Save voice preferences
  useEffect(() => {
    try {
      localStorage.setItem("edu_voice_lang", selectedVoiceLang);
    } catch {}
  }, [selectedVoiceLang]);

  // Handle Play / Stop voice response
  const handleToggleSpeak = async (idx, content, langOverride = null) => {
    if (speakingMsgIndex === idx) {
      stopLadyVoice();
      setSpeakingMsgIndex(null);
      setIsSynthesizing(false);
      return;
    }

    stopLadyVoice();
    setSpeakingMsgIndex(idx);
    setIsSynthesizing(true);

    const targetVoiceLang = langOverride || selectedVoiceLang;
    const success = await playLadyVoice(content, {
      language: targetVoiceLang,
      onStart: () => {
        setIsSynthesizing(false);
      },
      onEnd: () => {
        setSpeakingMsgIndex(null);
        setIsSynthesizing(false);
      },
      onError: () => {
        setSpeakingMsgIndex(null);
        setIsSynthesizing(false);
      }
    });

    if (!success) {
      setSpeakingMsgIndex(null);
      setIsSynthesizing(false);
    }
  };

  // Language Converter States
  const [translations, setTranslations] = useState({});
  const [translatingIndex, setTranslatingIndex] = useState(null);
  const [showConverterModal, setShowConverterModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  // Standalone Converter Tool state
  const [converterInput, setConverterInput] = useState("");
  const [converterTargetLang, setConverterTargetLang] = useState("mr");
  const [converterOutput, setConverterOutput] = useState(null);
  const [converterLoading, setConverterLoading] = useState(false);
  const [converterCopied, setConverterCopied] = useState(false);

  // Translate specific message in chat
  const handleTranslateMessage = async (msgIndex, text, targetLang) => {
    if (!text) return;
    setTranslatingIndex(msgIndex);
    const res = await translateContent(text, targetLang, "en");
    if (res.success) {
      setTranslations((prev) => ({
        ...prev,
        [msgIndex]: {
          translatedText: res.translatedText,
          targetLang: res.targetLang,
          nativeName: res.nativeName,
          flag: res.flag,
          voiceCode: res.voiceCode,
          isShowingTranslated: true
        }
      }));
    }
    setTranslatingIndex(null);
  };

  // Toggle between original English and translated view
  const handleToggleTranslationView = (msgIndex) => {
    setTranslations((prev) => {
      const cur = prev[msgIndex];
      if (!cur) return prev;
      return {
        ...prev,
        [msgIndex]: {
          ...cur,
          isShowingTranslated: !cur.isShowingTranslated
        }
      };
    });
  };

  // Standalone Converter runner
  const handleRunStandaloneConverter = async () => {
    if (!converterInput.trim()) return;
    setConverterLoading(true);
    setConverterOutput(null);
    setConverterCopied(false);
    const res = await translateContent(converterInput.trim(), converterTargetLang, "en");
    if (res.success) {
      setConverterOutput(res);
    } else {
      setConverterOutput({
        translatedText: res.translatedText || "Could not translate. Please check connection and try again.",
        targetLang: converterTargetLang,
        nativeName: "Translation",
        flag: "⚠️"
      });
    }
    setConverterLoading(false);
  };

  const handleCopyConverted = (text) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setConverterCopied(true);
      setTimeout(() => setConverterCopied(false), 2000);
    } catch {}
  };

  // Auto-speak new AI response if enabled
  useEffect(() => {
    if (!autoSpeak || messages.length === 0 || loading) return;
    const lastIdx = messages.length - 1;
    const lastMsg = messages[lastIdx];
    if (lastMsg && lastMsg.role === "model" && lastIdx > lastSpokenIndexRef.current) {
      lastSpokenIndexRef.current = lastIdx;
      handleToggleSpeak(lastIdx, lastMsg.content);
    }
  }, [messages, autoSpeak, loading]);

  // Speech-to-Text Microphone Handler
  const handleToggleMic = () => {
    if (isListening) {
      stopSpeechToText();
      setIsListening(false);
      setInterimText("");
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert("Speech recognition is supported in Google Chrome and Microsoft Edge browsers. Please allow microphone access.");
      return;
    }

    setIsListening(true);
    setInterimText("");
    const targetLang = selectedVoiceLang === "auto" ? "en" : selectedVoiceLang;
    
    startSpeechToText({
      lang: targetLang,
      onResult: ({ final, interim }) => {
        if (interim) {
          setInterimText(interim);
        }
        if (final) {
          setInputText((prev) => (prev ? prev + " " + final : final));
          setInterimText("");
        }
      },
      onError: (err) => {
        console.warn("[Mic Error]", err);
        setIsListening(false);
        setInterimText("");
      },
      onEnd: () => {
        setIsListening(false);
        setInterimText("");
      }
    });
  };

  // If navigated from another page or college card with initialPrompt
  useEffect(() => {
    if (location.state?.initialPrompt && !initialSentRef.current) {
      initialSentRef.current = true;
      sendMessage(location.state.initialPrompt);
    }
  }, [location.state]);

  // Auto-scroll to bottom on new messages or loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Send message handler
  const handleSend = () => {
    if (!inputText.trim() || loading) return;
    sendMessage(inputText.trim());
    setInputText("");
    if (isListening) {
      stopSpeechToText();
      setIsListening(false);
      setInterimText("");
    }
  };

  // Keyboard shortcut: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Quick question chip click
  const handleQuickQuestion = (q) => {
    sendMessage(q);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif", overflow: "hidden", background: "#F8FAFC" }}>
      {/* Top Navbar */}
      <nav
        className="navbar px-3 px-md-4 py-2 flex-shrink-0 shadow-sm"
        style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)" }}
      >
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-sm fw-semibold rounded-pill px-3 py-1 d-flex align-items-center gap-1 shadow-sm"
            style={{ background: "#FFFFFF", color: "#1A237E", border: "1px solid #FFFFFF" }}
            onClick={() => navigate("/dashboard")}
          >
            <FaArrowLeft size={11} /> Dashboard
          </button>

          <span className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold m-0" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
            <FaGraduationCap size={24} color="#FFB300" />
            <span style={{ fontFamily: "'Poppins', sans-serif" }}>{APP_NAME}</span>
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge px-3 py-2 rounded-pill shadow-sm" style={{ background: "rgba(255,179,0,0.2)", border: "1px solid #FFB300", color: "#FFD54F" }}>
            {activeProfile.name} | {activeProfile.stream} ({formatScore(activeProfile.marks, activeProfile.exam_type, activeProfile.score_unit)})
          </span>
          <button
            className="btn btn-sm rounded-pill px-3 py-1 fw-bold shadow-sm"
            style={{ background: "#FFFFFF", color: "#1A237E", border: "1px solid #FFFFFF", fontSize: 12 }}
            onClick={() => navigate("/profile")}
          >
            <FaSyncAlt className="me-1" size={10} color="#4F46E5" /> Edit
          </button>
          {onLogout && (
            <button
              className="btn btn-sm rounded-pill px-3 py-1 fw-bold shadow-sm"
              style={{ background: "#FFFFFF", color: "#DC2626", border: "1px solid #FFFFFF", fontSize: 12 }}
              onClick={onLogout}
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* Main Chat Workspace */}
      <div className="container-fluid flex-grow-1 d-flex p-0 overflow-hidden">
        {/* Left Sidebar: Quick Questions & Context */}
        <div
          className="d-none d-lg-flex flex-column border-end bg-white"
          style={{ width: 330, flexShrink: 0, padding: "20px 18px", borderColor: "#E2E8F0" }}
        >
          {/* Student Profile Card */}
          <div className="p-3 rounded-4 mb-3 border" style={{ background: "linear-gradient(145deg, #F0F4FF 0%, #E8EEFF 100%)", borderColor: "#C7D2FE" }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="badge bg-primary px-2 py-1" style={{ fontSize: 10 }}>ACTIVE PROFILE</span>
              <span className="badge bg-light text-primary border" style={{ fontSize: 10 }}>Verified Student</span>
            </div>
            <h6 className="fw-bold mb-1 text-primary" style={{ fontFamily: "'Poppins', sans-serif" }}>
              👤 {activeProfile.name}
            </h6>
            <div className="small text-secondary mb-1">
              <strong>Stream:</strong> {activeProfile.stream}
            </div>
            <div className="small text-secondary mb-1">
              <strong>Exam & Score:</strong>{" "}
              <span className="badge bg-primary text-white">
                {activeProfile.exam_type}: {formatScore(activeProfile.marks, activeProfile.exam_type, activeProfile.score_unit)}
              </span>
            </div>
            <div className="small text-secondary">
              <strong>State Pref:</strong> {activeProfile.preferred_state || "Any"}
            </div>
          </div>

          {/* Quick Questions Header */}
          <div className="d-flex align-items-center gap-1 mb-2">
            <span className="small fw-bold text-uppercase text-secondary" style={{ letterSpacing: "0.5px", fontSize: 11 }}>
              💡 Popular Counseling Topics
            </span>
          </div>

          <div className="d-flex flex-column gap-2 mb-3 overflow-auto" style={{ maxHeight: "calc(100vh - 360px)" }}>
            {[
              "Which college is the safest option for my marks?",
              "What are the 5-year cutoff trends for top colleges in my stream?",
              "Which branch or specialization has the highest placement?",
              "What scholarships can I apply for with my score?",
              "Compare Government vs Private colleges for my profile",
              "What is the expected admission process and documents required?",
            ].map((q, i) => (
              <button
                key={i}
                className="btn btn-light btn-sm text-start p-2 rounded-3 border small text-secondary shadow-none hover-shadow"
                style={{
                  fontSize: 12,
                  lineHeight: 1.4,
                  background: "#FAFAFA",
                  borderColor: "#E5E7EB",
                  transition: "all 0.15s ease",
                }}
                onClick={() => handleQuickQuestion(q)}
              >
                👉 {q}
              </button>
            ))}
          </div>

          {/* Footer Card */}
          <div className="mt-auto p-3 rounded-4 bg-light border text-center">
            <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
              <span className="badge rounded-circle p-1 bg-primary me-1"></span>
              <span className="fw-bold small text-dark" style={{ fontSize: 12 }}>Official CET Cell Data</span>
            </div>
            <div className="text-secondary" style={{ fontSize: 11 }}>
              Guidance grounded in 2024–2025 Maharashtra state cutoff gazettes.
            </div>
          </div>
        </div>

        {/* Right Chat Column */}
        <div className="flex-grow-1 d-flex flex-column overflow-hidden" style={{ background: "#F8FAFC" }}>
          {/* Chat Header Bar */}
          <div className="d-flex align-items-center justify-content-between px-3 px-md-4 py-2 bg-white border-bottom shadow-sm flex-shrink-0 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm"
                style={{ width: 34, height: 34, background: "linear-gradient(135deg, #1A237E, #3949AB)" }}
              >
                <FaHeadset size={16} color="#FFB300" />
              </div>
              <div>
                <span className="fw-bold text-dark me-2" style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15 }}>
                  AI Education Counselor
                </span>
                <span className="badge bg-success" style={{ fontSize: 9 }}>ONLINE</span>
              </div>
            </div>

            {/* Voice Pack & Playback Controls */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Voice Language Selector */}
              <div className="d-flex align-items-center gap-1 bg-light border rounded-pill px-2 py-1 shadow-sm">
                <span className="small text-muted fw-semibold ps-1 d-none d-sm-inline" style={{ fontSize: 11 }}>
                  👩 Lady Voice:
                </span>
                <select
                  className="form-select form-select-sm border-0 bg-transparent fw-semibold text-primary py-0 ps-1 pe-4 shadow-none"
                  style={{ fontSize: 12, cursor: "pointer", width: "auto" }}
                  value={selectedVoiceLang}
                  onChange={(e) => {
                    setSelectedVoiceLang(e.target.value);
                    stopLadyVoice();
                    setSpeakingMsgIndex(null);
                  }}
                  title="Select Neural Female Voice Pack"
                >
                  {FEMALE_VOICE_LIST.map((v) => (
                    <option key={v.code} value={v.code}>
                      {v.flag} {v.native_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto-Voice Speak Toggle */}
              <button
                className="btn btn-sm rounded-pill px-2.5 py-1 d-flex align-items-center gap-1.5 fw-semibold shadow-sm"
                style={{
                  fontSize: 11,
                  background: autoSpeak ? "linear-gradient(135deg, #2563EB, #1D4ED8)" : "#F1F5F9",
                  color: autoSpeak ? "#FFFFFF" : "#334155",
                  border: autoSpeak ? "none" : "1px solid #CBD5E1"
                }}
                onClick={() => {
                  const nextState = !autoSpeak;
                  setAutoSpeak(nextState);
                  if (!nextState) {
                    stopLadyVoice();
                    setSpeakingMsgIndex(null);
                  } else {
                    lastSpokenIndexRef.current = messages.length - 1;
                  }
                }}
                title={autoSpeak ? "Auto-Voice is ON (Click to turn OFF)" : "Auto-Voice is OFF (Click to turn ON)"}
              >
                {autoSpeak ? <FaVolumeUp size={12} /> : <FaVolumeMute size={12} />}
                <span>Auto-Voice: {autoSpeak ? "ON" : "OFF"}</span>
              </button>

              {/* Language Converter Tool Button */}
              <button
                className="btn btn-sm rounded-pill px-2.5 py-1 d-flex align-items-center gap-1.5 fw-semibold shadow-sm"
                onClick={() => setShowConverterModal(true)}
                style={{
                  fontSize: 11,
                  background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  boxShadow: "0 2px 6px rgba(99,102,241,0.3)"
                }}
                title="Open English to Regional Language Converter"
              >
                <FaLanguage size={14} />
                <span>🌐 Language Converter</span>
              </button>

              {/* Live Document & Rules Verification Tool */}
              <button
                className="btn btn-sm text-white rounded-pill px-2.5 py-1 d-flex align-items-center gap-1.5 fw-bold shadow-sm"
                onClick={() => setShowDocModal(true)}
                style={{
                  fontSize: 11,
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  border: "none",
                  boxShadow: "0 2px 6px rgba(16,185,129,0.35)"
                }}
                title="Verify Official Admission Documents, CVC Validity, and Proformas"
              >
                <FaShieldAlt size={12} />
                <span>📄 Verify Documents</span>
              </button>

              <button
                className="btn btn-sm rounded-pill px-2.5 py-1 d-flex align-items-center gap-1 fw-semibold shadow-sm"
                onClick={clearChat}
                style={{
                  fontSize: 11,
                  background: "#FEF2F2",
                  color: "#DC2626",
                  border: "1px solid #FECACA"
                }}
                title="Clear current conversation"
              >
                <FaTrash size={11} /> <span className="d-none d-sm-inline">Clear</span>
              </button>
            </div>
          </div>

          {/* Messages Area - Centered for comfortable readability */}
          <div className="flex-grow-1 overflow-auto p-3 p-md-4">
            <div className="mx-auto" style={{ maxWidth: 860 }}>
              {messages.map((msg, i) => (
                <div key={i} className="mb-4">
                  {msg.role === "user" ? (
                    /* User Question Bubble */
                    <div className="d-flex justify-content-end align-items-end gap-2">
                      <div
                        className="p-3 text-white shadow-sm"
                        style={{
                          maxWidth: "75%",
                          background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
                          borderRadius: "18px 18px 4px 18px",
                          fontSize: 14.5,
                          lineHeight: 1.6,
                        }}
                      >
                        {msg.content}
                      </div>
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm text-dark mb-1"
                        style={{ width: 32, height: 32, background: "#FFD54F" }}
                      >
                        <FaUser size={13} color="#1A237E" />
                      </div>
                    </div>
                  ) : (
                    /* AI Counselor Response Card */
                    <div className="d-flex justify-content-start align-items-start gap-3">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm mt-1"
                        style={{ width: 34, height: 34, background: "linear-gradient(135deg, #1A237E, #3949AB)" }}
                      >
                        <FaGraduationCap size={16} color="#FFB300" />
                      </div>
                      <div style={{ maxWidth: "88%", minWidth: "260px" }}>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="fw-bold small text-dark" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            AI Counselor
                          </span>
                          <span className="badge bg-light text-primary border" style={{ fontSize: 10 }}>
                            Verified Guide
                          </span>
                        </div>

                        {/* Translation Toggle Notice Bar (if translated) */}
                        {translations[i] && (
                          <div
                            className="d-flex align-items-center justify-content-between mb-2 p-1 px-2.5 rounded-3 border"
                            style={{ background: "#EEF2FF", borderColor: "#C7D2FE", fontSize: 11 }}
                          >
                            <span className="d-flex align-items-center gap-1.5 text-primary fw-semibold">
                              <span>{translations[i].flag}</span>
                              <span>
                                {translations[i].isShowingTranslated
                                  ? `Converted to ${translations[i].nativeName} (${translations[i].targetLang.toUpperCase()})`
                                  : "Showing Original English"}
                              </span>
                            </span>
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-primary fw-bold text-decoration-none"
                              onClick={() => handleToggleTranslationView(i)}
                              style={{ fontSize: 11 }}
                            >
                              {translations[i].isShowingTranslated ? "🇬🇧 Show Original (English)" : `🔄 Show Translated (${translations[i].nativeName})`}
                            </button>
                          </div>
                        )}

                        <div
                          className="p-3 bg-white border shadow-sm rounded-4 text-dark"
                          style={{
                            fontSize: 14.5,
                            lineHeight: 1.7,
                            borderColor: speakingMsgIndex === i ? "#6366F1" : "#E2E8F0",
                            boxShadow: speakingMsgIndex === i ? "0 0 0 2px rgba(99, 102, 241, 0.2)" : undefined,
                            borderRadius: "18px 18px 18px 4px",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {translations[i] && translations[i].isShowingTranslated
                              ? translations[i].translatedText
                              : msg.content}
                          </ReactMarkdown>

                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-top d-flex align-items-center gap-1 flex-wrap" style={{ fontSize: 11, color: "#475569" }}>
                              <span className="badge bg-light text-primary border px-2 py-1">
                                📄 Gazette Grounded:
                              </span>
                              {msg.sources.map((s, idx) => (
                                <span key={idx} className="fw-semibold text-dark">{s}</span>
                              ))}
                            </div>
                          )}

                          {/* Bottom Action Bar: Copy, Voice, Thumbs Up, Thumbs Down, Regenerate, Convert */}
                          {(() => {
                            const tr = translations[i];
                            const activeContent = tr && tr.isShowingTranslated ? tr.translatedText : msg.content;
                            const activeVoiceLang = tr && tr.isShowingTranslated ? tr.voiceCode : selectedVoiceLang;
                            const isLiked = feedbackState[i] === "liked";
                            const isDisliked = feedbackState[i] === "disliked";
                            const isSpeaking = speakingMsgIndex === i;
                            const isCopied = copiedIndex === i;

                            return (
                              <div
                                className="mt-2.5 pt-2 border-top d-flex align-items-center justify-content-between flex-wrap gap-2"
                                style={{ borderColor: "#F1F5F9" }}
                              >
                                {/* Left Action Icons (matching requested UI) */}
                                <div className="d-flex align-items-center gap-1">
                                  {/* 1. Copy Button */}
                                  <button
                                    type="button"
                                    className={`btn btn-sm d-inline-flex align-items-center gap-1 px-2 py-1 rounded-2 border-0 shadow-none ${
                                      isCopied ? "text-success bg-success-subtle fw-semibold" : "text-secondary"
                                    }`}
                                    style={{
                                      fontSize: 12,
                                      background: isCopied ? "#E8F5E9" : "#F8FAFC",
                                      transition: "all 0.15s ease"
                                    }}
                                    onClick={() => handleCopyMessage(i, activeContent)}
                                    title={isCopied ? "Copied!" : "Copy response"}
                                  >
                                    {isCopied ? <FaCheck size={11} color="#2E7D32" /> : <FaRegCopy size={12} />}
                                    {isCopied && <span style={{ fontSize: 11 }}>Copied</span>}
                                  </button>

                                  {/* 2. Listen / Stop Audio */}
                                  <button
                                    type="button"
                                    className={`btn btn-sm d-inline-flex align-items-center gap-1 px-2 py-1 rounded-2 border-0 shadow-none ${
                                      isSpeaking ? "text-white fw-semibold" : "text-secondary"
                                    }`}
                                    style={{
                                      fontSize: 12,
                                      background: isSpeaking ? "#DC2626" : "#F8FAFC",
                                      transition: "all 0.15s ease"
                                    }}
                                    onClick={() => handleToggleSpeak(i, activeContent, activeVoiceLang)}
                                    title={isSpeaking ? "Stop voice narration" : "Listen in natural female voice"}
                                  >
                                    {isSpeaking ? (
                                      isSynthesizing ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm" style={{ width: 10, height: 10 }} />
                                          <span style={{ fontSize: 11 }}>Synthesizing...</span>
                                        </>
                                      ) : (
                                        <>
                                          <FaStop size={10} />
                                          <span style={{ fontSize: 11 }}>Stop</span>
                                        </>
                                      )
                                    ) : (
                                      <FaVolumeUp size={12} />
                                    )}
                                  </button>

                                  {/* 3. Thumbs Up (Helpful) */}
                                  <button
                                    type="button"
                                    className={`btn btn-sm d-inline-flex align-items-center px-2 py-1 rounded-2 border-0 shadow-none ${
                                      isLiked ? "text-primary fw-semibold" : "text-secondary"
                                    }`}
                                    style={{
                                      fontSize: 12,
                                      background: isLiked ? "#E0E7FF" : "#F8FAFC",
                                      transition: "all 0.15s ease"
                                    }}
                                    onClick={() => handleToggleFeedback(i, "liked")}
                                    title="Good response"
                                  >
                                    {isLiked ? <FaThumbsUp size={12} color="#1A237E" /> : <FaRegThumbsUp size={12} />}
                                  </button>

                                  {/* 4. Thumbs Down (Unhelpful) */}
                                  <button
                                    type="button"
                                    className={`btn btn-sm d-inline-flex align-items-center px-2 py-1 rounded-2 border-0 shadow-none ${
                                      isDisliked ? "text-danger fw-semibold" : "text-secondary"
                                    }`}
                                    style={{
                                      fontSize: 12,
                                      background: isDisliked ? "#FEE2E2" : "#F8FAFC",
                                      transition: "all 0.15s ease"
                                    }}
                                    onClick={() => handleToggleFeedback(i, "disliked")}
                                    title="Bad response"
                                  >
                                    {isDisliked ? <FaThumbsDown size={12} color="#DC2626" /> : <FaRegThumbsDown size={12} />}
                                  </button>

                                  {/* 5. Regenerate Button */}
                                  <button
                                    type="button"
                                    className="btn btn-sm d-inline-flex align-items-center px-2 py-1 rounded-2 border-0 shadow-none text-secondary"
                                    style={{
                                      fontSize: 12,
                                      background: "#F8FAFC",
                                      transition: "all 0.15s ease"
                                    }}
                                    onClick={() => handleRegenerateResponse(i)}
                                    title="Regenerate answer"
                                    disabled={loading}
                                  >
                                    <FaSyncAlt size={11} className={loading ? "fa-spin" : ""} />
                                  </button>
                                </div>

                                {/* Right: Language Convert Dropdown */}
                                <div className="dropdown">
                                  <button
                                    className="btn btn-sm btn-light border rounded-pill px-2.5 py-0.5 d-flex align-items-center gap-1 fw-semibold text-secondary shadow-none dropdown-toggle"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    style={{ fontSize: 11, background: "#F8FAFC", borderColor: "#E2E8F0" }}
                                    disabled={translatingIndex === i}
                                    title="Convert English to Marathi, Hindi, Telugu, etc."
                                  >
                                    {translatingIndex === i ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm" style={{ width: 10, height: 10 }} />
                                        <span>Converting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <MdTranslate size={12} color="#4F46E5" />
                                        <span>
                                          {translations[i]
                                            ? `${translations[i].flag} ${translations[i].nativeName}`
                                            : "🌐 Convert"}
                                        </span>
                                      </>
                                    )}
                                  </button>
                                  <ul className="dropdown-menu dropdown-menu-end shadow-sm border p-1" style={{ fontSize: 12, minWidth: 175, zIndex: 1050 }}>
                                    <li className="dropdown-header text-uppercase text-muted py-1" style={{ fontSize: 10, letterSpacing: "0.5px" }}>
                                      Convert from English:
                                    </li>
                                    {CONVERT_LANGUAGES.map((lang) => (
                                      <li key={lang.code}>
                                        <button
                                          className="dropdown-item rounded-2 py-1 d-flex align-items-center justify-content-between"
                                          onClick={() => handleTranslateMessage(i, msg.content, lang.code)}
                                        >
                                          <span>{lang.flag} {lang.native_name}</span>
                                          <span className="badge bg-light text-secondary border ms-2" style={{ fontSize: 9 }}>{lang.name}</span>
                                        </button>
                                      </li>
                                    ))}
                                    {translations[i] && (
                                      <>
                                        <li><hr className="dropdown-divider my-1" /></li>
                                        <li>
                                          <button
                                            className="dropdown-item rounded-2 py-1 text-primary fw-semibold"
                                            onClick={() => handleToggleTranslationView(i)}
                                          >
                                            {translations[i].isShowingTranslated ? "🇬🇧 Show Original English" : `🔄 Show ${translations[i].nativeName}`}
                                          </button>
                                        </li>
                                      </>
                                    )}
                                  </ul>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="d-flex justify-content-start align-items-start gap-3 mb-4">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 shadow-sm mt-1"
                    style={{ width: 34, height: 34, background: "linear-gradient(135deg, #1A237E, #3949AB)" }}
                  >
                    <FaGraduationCap size={16} color="#FFB300" />
                  </div>
                  <div className="p-3 bg-white rounded-4 shadow-sm border d-flex gap-2 align-items-center" style={{ borderColor: "#E2E8F0" }}>
                    <div className="spinner-grow spinner-grow-sm text-primary" />
                    <div className="spinner-grow spinner-grow-sm text-primary" style={{ animationDelay: "0.15s" }} />
                    <div className="spinner-grow spinner-grow-sm text-primary" style={{ animationDelay: "0.3s" }} />
                    <span className="text-secondary ms-1 small fw-semibold">Counselor is reviewing your inquiry...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 px-md-4 py-2 bg-white border-top flex-shrink-0">
            <div className="mx-auto d-flex align-items-center gap-2 flex-wrap" style={{ maxWidth: 860 }}>
              <span className="small text-muted fw-semibold d-flex align-items-center gap-1" style={{ fontSize: 11 }}>
                <span className="text-warning">✨</span> Quick:
              </span>
              {followUps.map((q, i) => (
                <button
                  key={i}
                  className="btn btn-sm fw-semibold rounded-pill px-3 py-1 shadow-none"
                  style={{ fontSize: 12, background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8" }}
                  onClick={() => handleQuickQuestion(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Floating Modern Input Box */}
          <div className="p-3 p-md-3 bg-white border-top flex-shrink-0 shadow-sm">
            <div className="mx-auto" style={{ maxWidth: 860 }}>
              {/* Live Interim Speech Feedback Banner */}
              {isListening && (
                <div
                  className="mb-2 p-2 px-3 rounded-pill d-flex align-items-center justify-content-between text-danger shadow-sm border border-danger-subtle"
                  style={{ background: "#FEF2F2", fontSize: 12 }}
                >
                  <div className="d-flex align-items-center gap-2 text-truncate">
                    <span className="spinner-grow spinner-grow-sm text-danger flex-shrink-0" style={{ width: 10, height: 10 }} />
                    <span className="fw-bold">Listening...</span>
                    <span className="text-secondary text-truncate">
                      {interimText ? `"${interimText}"` : "Speak now in Marathi, Hindi, English, Telugu, etc..."}
                    </span>
                  </div>
                  <button
                    className="btn btn-sm btn-link text-danger p-0 ms-2 fw-semibold text-decoration-none"
                    onClick={handleToggleMic}
                    style={{ fontSize: 11 }}
                  >
                    Done
                  </button>
                </div>
              )}

              <div
                className="d-flex align-items-center gap-2 p-1 px-3 bg-white border rounded-pill shadow-sm"
                style={{
                  borderColor: isListening ? "#EF4444" : "#CBD5E1",
                  boxShadow: isListening ? "0 0 0 2px rgba(239, 68, 68, 0.2)" : undefined,
                  transition: "all 0.2s ease"
                }}
              >
                {/* Microphone Button */}
                <button
                  type="button"
                  className={`btn d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 shadow-none border-0 ${
                    isListening ? "btn-danger text-white" : "btn-light text-secondary"
                  }`}
                  onClick={handleToggleMic}
                  style={{
                    width: 36,
                    height: 36,
                    background: isListening ? "#DC2626" : "#F1F5F9",
                    transition: "all 0.2s ease"
                  }}
                  title={isListening ? "Stop listening" : "Speak with microphone (Voice Input)"}
                >
                  {isListening ? <FaStop size={13} /> : <FaMicrophone size={15} color="#475569" />}
                </button>

                <textarea
                  className="form-control border-0 shadow-none py-2"
                  placeholder={
                    isListening
                      ? "Listening to your voice..."
                      : "Ask about colleges, cutoffs, placements, CAP rounds, or click mic to speak..."
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  style={{
                    fontSize: 14,
                    resize: "none",
                    background: "transparent",
                    maxHeight: 100,
                  }}
                />

                <button
                  className="btn d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 shadow-sm"
                  disabled={loading || (!inputText.trim() && !isListening)}
                  onClick={handleSend}
                  style={{
                    width: 38,
                    height: 38,
                    background: loading || (!inputText.trim() && !isListening) ? "#E2E8F0" : "linear-gradient(135deg, #1A237E, #3949AB)",
                    color: loading || (!inputText.trim() && !isListening) ? "#94A3B8" : "#FFFFFF",
                    border: "none",
                    cursor: loading || (!inputText.trim() && !isListening) ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                  }}
                  title="Send message"
                >
                  <MdSend size={18} />
                </button>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-1 px-2 text-muted" style={{ fontSize: 10 }}>
                <span>
                  Press <strong>Enter</strong> to send • <strong>Shift + Enter</strong> for a new line
                </span>
                <span className="d-flex align-items-center gap-1">
                  🎙️ Voice Input • 👩 Neural Lady Voice • 🌐 Language Converter
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Standalone Language Converter Modal */}
      {showConverterModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 1060
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConverterModal(false);
          }}
        >
          <div
            className="bg-white rounded-4 shadow-lg border overflow-hidden d-flex flex-column"
            style={{
              maxWidth: 720,
              width: "100%",
              maxHeight: "90vh",
              animation: "fadeIn 0.2s ease"
            }}
          >
            {/* Modal Header */}
            <div
              className="p-3 px-4 d-flex align-items-center justify-content-between text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)" }}
            >
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white"
                  style={{ width: 34, height: 34, background: "rgba(255, 255, 255, 0.15)" }}
                >
                  <FaLanguage size={18} color="#FFD54F" />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    English to Regional Language Converter
                  </h6>
                  <span className="small text-white-50" style={{ fontSize: 11 }}>
                    Convert admission rules, cutoffs, or queries to Marathi, Hindi, Telugu, and more
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-link text-white p-1 text-decoration-none shadow-none"
                onClick={() => setShowConverterModal(false)}
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 p-md-4 overflow-auto flex-grow-1">
              {/* Quick Preset Topics */}
              <div className="mb-3">
                <span className="small fw-semibold text-muted d-block mb-1.5" style={{ fontSize: 11 }}>
                  💡 Quick templates (click to populate):
                </span>
                <div className="d-flex gap-1.5 flex-wrap">
                  {[
                    "What is the CAP round seat allotment process and how to freeze seats?",
                    "Which top engineering colleges in Maharashtra offer 95 percentile cutoffs?",
                    "What documents and eligibility are required for state scholarship?",
                    "Compare Government vs Private colleges for placements and fees.",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="btn btn-light btn-sm border text-secondary rounded-pill py-1 px-2.5 shadow-none"
                      style={{ fontSize: 11, background: "#F8FAFC" }}
                      onClick={() => setConverterInput(preset)}
                    >
                      {preset.slice(0, 48)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Source English Input */}
              <div className="mb-3">
                <label className="form-label fw-bold small text-dark d-flex justify-content-between">
                  <span>🇬🇧 English Text / Admission Query:</span>
                  {converterInput && (
                    <span
                      className="text-primary text-decoration-underline"
                      style={{ cursor: "pointer", fontSize: 11 }}
                      onClick={() => setConverterInput("")}
                    >
                      Clear
                    </span>
                  )}
                </label>
                <textarea
                  className="form-control rounded-3 border shadow-sm"
                  rows={3}
                  placeholder="Type or paste any English text, question, or guidance you want to convert..."
                  value={converterInput}
                  onChange={(e) => setConverterInput(e.target.value)}
                  style={{ fontSize: 13.5, resize: "vertical" }}
                />
              </div>

              {/* Conversion Control Bar */}
              <div className="p-2.5 bg-light rounded-3 border mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-semibold text-dark small" style={{ fontSize: 12 }}>
                    Convert into:
                  </span>
                  <select
                    className="form-select form-select-sm fw-semibold text-primary shadow-sm"
                    style={{ width: "auto", fontSize: 12.5 }}
                    value={converterTargetLang}
                    onChange={(e) => setConverterTargetLang(e.target.value)}
                  >
                    {CONVERT_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.native_name} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm px-3 py-1.5 fw-bold rounded-pill shadow-sm d-flex align-items-center gap-1.5"
                  onClick={handleRunStandaloneConverter}
                  disabled={converterLoading || !converterInput.trim()}
                  style={{
                    background: "linear-gradient(135deg, #1A237E, #3949AB)",
                    border: "none",
                    fontSize: 12
                  }}
                >
                  {converterLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} />
                      <span>Converting...</span>
                    </>
                  ) : (
                    <>
                      <FaExchangeAlt size={11} />
                      <span>Convert Language</span>
                    </>
                  )}
                </button>
              </div>

              {/* Converted Output Display */}
              {converterOutput && (
                <div
                  className="p-3 rounded-4 border shadow-sm"
                  style={{ background: "#FAFCFF", borderColor: "#C7D2FE" }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom">
                    <span className="fw-bold small text-primary d-flex align-items-center gap-1">
                      <span>{converterOutput.flag}</span>
                      <span>Converted ({converterOutput.nativeName}):</span>
                    </span>

                    <div className="d-flex align-items-center gap-1.5">
                      {/* Copy button */}
                      <button
                        type="button"
                        className="btn btn-sm rounded-pill px-2.5 py-0.5 d-flex align-items-center gap-1 fw-semibold shadow-sm"
                        style={{ fontSize: 11, background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#334155" }}
                        onClick={() => handleCopyConverted(converterOutput.translatedText)}
                        title="Copy converted text"
                      >
                        {converterCopied ? <FaCheck size={10} color="#16A34A" /> : <FaCopy size={10} />}
                        <span>{converterCopied ? "Copied!" : "Copy"}</span>
                      </button>

                      {/* Listen in Lady Voice button */}
                      <button
                        type="button"
                        className="btn btn-sm rounded-pill px-2.5 py-0.5 d-flex align-items-center gap-1 fw-semibold shadow-sm"
                        style={{ fontSize: 11, background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8" }}
                        onClick={() => {
                          playLadyVoice(converterOutput.translatedText, {
                            language: converterOutput.voiceCode || converterOutput.targetLang
                          });
                        }}
                        title="Listen to converted text in neural lady voice"
                      >
                        <FaVolumeUp size={11} />
                        <span>Listen Voice</span>
                      </button>
                    </div>
                  </div>

                  <div
                    className="p-2.5 bg-white rounded-3 border text-dark"
                    style={{
                      fontSize: 14,
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                      fontFamily: "'Inter', sans-serif"
                    }}
                  >
                    {converterOutput.translatedText}
                  </div>

                  {/* Quick Action: Insert into chat */}
                  <div className="mt-2.5 text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-success rounded-pill px-3 py-1 fw-semibold shadow-sm"
                      style={{ fontSize: 11.5 }}
                      onClick={() => {
                        setInputText(converterOutput.translatedText);
                        setShowConverterModal(false);
                      }}
                    >
                      💬 Use in AI Counselor Chat
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-2.5 px-4 bg-light border-top d-flex justify-content-between align-items-center flex-shrink-0">
              <span className="small text-muted" style={{ fontSize: 11 }}>
                Powered by Indian Regional Language NLP • Supports Markdown tables & Cutoffs
              </span>
              <button
                type="button"
                className="btn btn-sm btn-secondary rounded-pill px-3 py-1"
                style={{ fontSize: 11 }}
                onClick={() => setShowConverterModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Web-Grounded Document Verification & Eligibility Modal */}
      <DocumentVerificationModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        studentProfile={activeProfile}
      />
    </div>
  );
}
