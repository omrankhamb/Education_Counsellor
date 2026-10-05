import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaGraduationCap, FaUserGraduate, FaHeadset, FaTrash, FaPaperPlane,
  FaArrowLeft, FaUser, FaUniversity, FaBriefcase,
  FaMapMarkerAlt, FaStar, FaLightbulb, FaSyncAlt
} from "react-icons/fa";
import { MdVerified, MdSend } from "react-icons/md";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "../hooks/useChat";
import { APP_NAME } from "./LandingPage";
import { formatScore } from "../utils/scoreUtils";

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
  const { messages, loading, followUps, sendMessage, clearChat } = useChat(studentProfile);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const initialSentRef = useRef(false);

  // If navigated from a specific college card, automatically ask the question
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
    sendMessage(inputText.trim());
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
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif", overflow: "hidden", background: "#F8FAFC" }}>
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
            {studentProfile.name} | {studentProfile.stream} ({formatScore(studentProfile.marks, studentProfile.exam_type, studentProfile.score_unit)})
          </span>
          <button className="btn btn-sm btn-outline-light rounded-pill px-3" onClick={() => navigate("/profile")}>
            <FaSyncAlt className="me-1" size={10} /> Edit
          </button>
          {onLogout && (
            <button className="btn btn-sm btn-outline-light rounded-pill px-3" onClick={onLogout}>
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
              <span className="badge bg-success" style={{ fontSize: 10 }}>MongoDB Synced</span>
            </div>
            <h6 className="fw-bold mb-1 text-primary" style={{ fontFamily: "'Poppins', sans-serif" }}>
              👤 {studentProfile.name}
            </h6>
            <div className="small text-secondary mb-1">
              <strong>Stream:</strong> {studentProfile.stream}
            </div>
            <div className="small text-secondary mb-1">
              <strong>Exam & Score:</strong>{" "}
              <span className="badge bg-primary text-white">
                {studentProfile.exam_type}: {formatScore(studentProfile.marks, studentProfile.exam_type, studentProfile.score_unit)}
              </span>
            </div>
            <div className="small text-secondary">
              <strong>State Pref:</strong> {studentProfile.preferred_state || "Any"}
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
              <span className="badge rounded-circle p-1 bg-success me-1"></span>
              <span className="fw-bold small text-dark" style={{ fontSize: 12 }}>MongoDB Live Storage</span>
            </div>
            <div className="text-secondary" style={{ fontSize: 11 }}>
              All queries & counselor guidance are saved in real-time to your local database.
            </div>
          </div>
        </div>

        {/* Right Chat Column */}
        <div className="flex-grow-1 d-flex flex-column overflow-hidden" style={{ background: "#F8FAFC" }}>
          {/* Chat Header Bar */}
          <div className="d-flex align-items-center justify-content-between px-4 py-2 bg-white border-bottom shadow-sm flex-shrink-0">
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

            <button
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-1"
              onClick={clearChat}
              style={{ fontSize: 12 }}
            >
              <FaTrash size={11} /> Clear Chat
            </button>
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
                        <div
                          className="p-3 bg-white border shadow-sm rounded-4 text-dark"
                          style={{
                            fontSize: 14.5,
                            lineHeight: 1.7,
                            borderColor: "#E2E8F0",
                            borderRadius: "18px 18px 18px 4px",
                          }}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {msg.content}
                          </ReactMarkdown>
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
                  className="btn btn-sm btn-outline-primary fw-semibold rounded-pill px-3 py-1 shadow-none"
                  style={{ fontSize: 12, background: "#F0F4FF", borderColor: "#D0DCFF" }}
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
              <div
                className="d-flex align-items-center gap-2 p-1 px-3 bg-white border rounded-pill shadow-sm"
                style={{ borderColor: "#CBD5E1" }}
              >
                <textarea
                  className="form-control border-0 shadow-none py-2"
                  placeholder="Ask a question about colleges, cutoffs, placements, or admission rounds..."
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
                  disabled={loading || !inputText.trim()}
                  onClick={handleSend}
                  style={{
                    width: 38,
                    height: 38,
                    background: loading || !inputText.trim() ? "#E2E8F0" : "linear-gradient(135deg, #1A237E, #3949AB)",
                    color: loading || !inputText.trim() ? "#94A3B8" : "#FFFFFF",
                    border: "none",
                    cursor: loading || !inputText.trim() ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <MdSend size={18} />
                </button>
              </div>
              <div className="text-center mt-1 text-muted" style={{ fontSize: 10 }}>
                Press <strong>Enter</strong> to send • <strong>Shift + Enter</strong> for a new line • Live verified Indian admission counseling
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
