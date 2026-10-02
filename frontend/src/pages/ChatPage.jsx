import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaGraduationCap, FaUserGraduate, FaHeadset, FaTrash, FaPaperPlane,
  FaArrowLeft, FaUser, FaUniversity, FaBriefcase,
  FaMapMarkerAlt, FaStar, FaLightbulb, FaSyncAlt
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "../hooks/useChat";
import { APP_NAME } from "./LandingPage";

const markdownComponents = {
  table: ({ node, ...props }) => (
    <div className="table-responsive my-3 shadow-sm border rounded-3 overflow-hidden bg-white">
      <table className="table table-hover table-striped mb-0 text-center align-middle" {...props} />
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
  code: ({ node, inline, ...props }) => (
    inline ? (
      <code className="px-2 py-1 bg-light border rounded text-dark small" {...props} />
    ) : (
      <pre className="p-3 bg-dark text-white rounded my-2 small overflow-auto" {...props} />
    )
  ),
};

export default function ChatPage({ studentProfile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { messages, loading, followUps, sendMessage, clearChat } = useChat(studentProfile);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const initialSentRef = useRef(false);

  // If navigated from a specific college card, automatically ask the question!
  useEffect(() => {
    if (location.state?.initialPrompt && !initialSentRef.current) {
      initialSentRef.current = true;
      sendMessage(location.state.initialPrompt);
    }
  }, [location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    if (!inputText.trim() || loading) return;
    sendMessage(inputText);
    setInputText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuestion = (q) => {
    sendMessage(q);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif", overflow: "hidden", background: "#F5F7FA" }}>
      {/* Top Navbar */}
      <nav
        className="navbar px-3 px-md-4 py-2 flex-shrink-0 shadow-sm"
        style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)" }}
      >
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-outline-light btn-sm fw-semibold rounded-pill px-3 py-1 d-flex align-items-center gap-1"
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
            {studentProfile.name} | {studentProfile.stream} ({studentProfile.marks}%)
          </span>
          <button className="btn btn-sm btn-outline-light rounded-pill px-3" onClick={() => navigate("/profile")}>
            <FaSyncAlt className="me-1" size={10} /> Edit
          </button>
        </div>
      </nav>

      {/* Main Chat Workspace */}
      <div className="container-fluid flex-grow-1 d-flex p-0 overflow-hidden">
        {/* Left Sidebar: Quick Questions & Context */}
        <div
          className="d-none d-lg-flex flex-column border-end bg-white"
          style={{ width: 320, flexShrink: 0, padding: 20 }}
        >
          <div className="p-3 rounded-4 mb-3" style={{ background: "#EEF2FF", border: "1px solid #C7D2FE" }}>
            <h6 className="fw-bold mb-1 text-primary" style={{ fontFamily: "'Poppins', sans-serif" }}>
              👤 Student Profile
            </h6>
            <div className="small text-secondary mb-1">
              <strong>Name:</strong> {studentProfile.name} ({studentProfile.age} yrs)
            </div>
            <div className="small text-secondary mb-1">
              <strong>Stream:</strong> {studentProfile.stream} ({studentProfile.exam_type})
            </div>
            <div className="small text-secondary mb-1">
              <strong>Score:</strong> <span className="badge bg-primary">{studentProfile.marks}%</span>
            </div>
            <div className="small text-secondary">
              <strong>State Pref:</strong> {studentProfile.preferred_state || "Any"}
            </div>
          </div>

          <h6 className="fw-bold text-dark small text-uppercase mb-2">
            💡 Popular Counseling Queries
          </h6>
          <div className="d-flex flex-column gap-2 mb-4">
            {[
              "Give the 5-year cutoff comparison of top 3 colleges in a table",
              "Which branch in my stream has the highest placements?",
              "What scholarships can I apply for with my score?",
              "Compare Government vs Private colleges for my marks",
              "What entrance exam percentiles do I need for tier-1?",
            ].map((q, i) => (
              <button
                key={i}
                className="btn btn-light btn-sm text-start p-2 rounded-3 border small text-truncate text-secondary"
                style={{ fontSize: 12 }}
                title={q}
                onClick={() => handleQuickQuestion(q)}
              >
                👉 {q}
              </button>
            ))}
          </div>

          <div className="mt-auto p-3 rounded-4 bg-light border text-center">
            <FaLightbulb size={24} className="text-warning mb-2" />
            <div className="fw-bold small text-dark">Data Updated Live</div>
            <div className="text-secondary" style={{ fontSize: 11 }}>
              Powered by Advanced Education AI with real-time Indian admission trends.
            </div>
          </div>
        </div>

        {/* Right Chat Column */}
        <div className="flex-grow-1 d-flex flex-column overflow-hidden bg-light">
          {/* Chat Header Bar */}
          <div className="d-flex align-items-center justify-content-between px-4 py-2 bg-white border-bottom shadow-sm flex-shrink-0">
            <div className="d-flex align-items-center gap-2">
              <div className="p-1 rounded-circle bg-primary bg-opacity-10 text-primary">
                <FaHeadset size={20} />
              </div>
              <div>
                <span className="fw-bold text-dark" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  AI Education Counselor
                </span>
                <span className="badge bg-success ms-2" style={{ fontSize: 10 }}>ACTIVE</span>
              </div>
            </div>

            <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={clearChat}>
              <FaTrash className="me-1" size={11} /> Clear Chat
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow-1 overflow-auto p-3 p-md-4">
            {messages.map((msg, i) => (
              <div key={i} className={`d-flex mb-3 ${msg.role === "user" ? "justify-content-end" : "justify-content-start"}`}>
                <div style={{ maxWidth: msg.role === "user" ? "75%" : "95%", width: msg.role === "user" ? "auto" : "100%" }}>
                  <div className="small fw-bold mb-1 px-1" style={{ color: msg.role === "user" ? "#3949AB" : "#FF8F00" }}>
                    {msg.role === "user"
                      ? <><FaUser size={11} className="me-1" />{studentProfile.name}</>
                      : <><FaUserGraduate size={12} className="me-1" />AI Counselor</>}
                  </div>
                  <div
                    className="p-3 shadow-sm"
                    style={{
                      borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: msg.role === "user"
                        ? "linear-gradient(135deg,#1A237E,#3949AB)"
                        : "#ffffff",
                      color: msg.role === "user" ? "#ffffff" : "#2C3E50",
                      fontSize: 14,
                      lineHeight: 1.7,
                      border: msg.role === "user" ? "none" : "1px solid #E2E8F0",
                    }}
                  >
                    {msg.role === "model" ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="d-flex justify-content-start mb-3">
                <div className="p-3 bg-white rounded-3 shadow-sm border d-flex gap-2 align-items-center" style={{ borderRadius: "18px 18px 18px 4px" }}>
                  <div className="spinner-grow spinner-grow-sm text-primary" />
                  <div className="spinner-grow spinner-grow-sm text-primary" style={{ animationDelay: "0.15s" }} />
                  <div className="spinner-grow spinner-grow-sm text-primary" style={{ animationDelay: "0.3s" }} />
                  <span className="text-secondary ms-1 small fw-semibold">AI Counselor is analyzing admission data...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Follow-up question chips */}
          <div className="d-flex align-items-center gap-2 flex-wrap px-4 py-2 bg-white border-top flex-shrink-0">
            <span className="small text-secondary fw-semibold">💡 Suggestions:</span>
            {followUps.map((q, i) => (
              <button
                key={i}
                className="btn btn-sm btn-outline-primary fw-semibold shadow-sm"
                style={{ borderRadius: 9999, fontSize: 12 }}
                onClick={() => handleQuickQuestion(q)}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="d-flex gap-2 p-3 bg-white border-top flex-shrink-0">
            <textarea
              className="form-control"
              placeholder="Ask about 5-year cutoffs, placement packages, branch comparison, colleges in Pune/Mumbai... (Enter to send)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ borderRadius: 14, resize: "none", fontSize: 14 }}
            />
            <button
              className="btn fw-bold px-4 shadow-sm"
              disabled={loading || !inputText.trim()}
              onClick={handleSend}
              style={{
                background: loading || !inputText.trim()
                  ? "#E0E7FF"
                  : "linear-gradient(135deg,#FFB300,#FF8F00)",
                color: loading || !inputText.trim() ? "#546E7A" : "#1A237E",
                borderRadius: 14,
                border: "none",
                whiteSpace: "nowrap",
              }}
            >
              <FaPaperPlane className="me-1" /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
