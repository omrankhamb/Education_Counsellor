import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGraduationCap, FaUserGraduate, FaHeadset, FaUniversity, FaMapMarkerAlt,
  FaStar, FaSearch, FaTrash, FaPaperPlane, FaBriefcase,
  FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaSyncAlt, FaUser
} from "react-icons/fa";
import { MdSchool } from "react-icons/md";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "../hooks/useChat";
import { APP_NAME } from "./LandingPage";

const API_BASE = "/api";

function EligibilityBadge({ status }) {
  if (status === "eligible")
    return <span className="badge bg-success shadow-sm"><FaCheckCircle className="me-1" />Eligible</span>;
  if (status === "borderline")
    return <span className="badge bg-warning text-dark shadow-sm"><FaExclamationTriangle className="me-1" />Borderline</span>;
  return <span className="badge bg-danger shadow-sm"><FaTimesCircle className="me-1" />Aspirational</span>;
}

function CollegeCard({ college, onAskAI }) {
  const fees = (college.annual_fees / 100000).toFixed(1);
  return (
    <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16, overflow: "hidden" }}>
      <div style={{ height: 4, background: "linear-gradient(90deg,#1A237E,#FFB300)" }} />
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start mb-1">
          <h6 className="fw-bold mb-0" style={{ color: "#1A237E", fontSize: 15, fontFamily: "'Poppins',sans-serif" }}>
            {college.college_name}
          </h6>
          <EligibilityBadge status={college.eligibility.status} />
        </div>

        <p className="text-secondary mb-2 small">
          <FaMapMarkerAlt className="me-1 text-danger" size={12} />
          {college.location}
        </p>

        <div className="d-flex flex-wrap gap-1 mb-2">
          <span className="badge" style={{ background: "#EEF0FF", color: "#3949AB" }}>{college.stream}</span>
          {college.branch && <span className="badge bg-light text-dark border">{college.branch}</span>}
          <span className={`badge ${college.college_type === "Government" ? "bg-success" : "bg-warning text-dark"}`}>
            {college.college_type === "Government" ? "🏛️ Govt" : "🏢 Private"}
          </span>
        </div>

        <div className="row g-2 text-center mb-2">
          <div className="col-4">
            <div className="p-2 rounded border" style={{ background: "#F0F3FF" }}>
              <div className="fw-bold text-primary small">{college.cutoff_marks}%</div>
              <div className="text-secondary" style={{ fontSize: 10 }}>Cutoff</div>
            </div>
          </div>
          <div className="col-4">
            <div className="p-2 rounded border" style={{ background: "#F0FFF4" }}>
              <div className="fw-bold text-success small">{college.student_marks}%</div>
              <div className="text-secondary" style={{ fontSize: 10 }}>Your Score</div>
            </div>
          </div>
          <div className="col-4">
            <div className="p-2 rounded border" style={{ background: "#FFF8E1" }}>
              <div className="fw-bold text-warning small">
                <FaStar size={10} className="me-1" />{college.rating}
              </div>
              <div className="text-secondary" style={{ fontSize: 10 }}>Rating</div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <small className="text-secondary">Estimated Fees: <strong className="text-dark">₹{fees} Lakh/yr</strong></small>
        </div>

        {college.why_recommended && (
          <div className="small p-2 rounded mb-2" style={{ background: "#F8F9FA", borderLeft: "3px solid #3949AB", fontSize: 12 }}>
            💡 <strong>Why:</strong> {college.why_recommended}
          </div>
        )}

        <button
          className="btn btn-sm w-100 fw-semibold shadow-sm"
          style={{ background: "linear-gradient(135deg,#1A237E,#3949AB)", color: "#fff", borderRadius: 10 }}
          onClick={() => onAskAI(`Tell me more about ${college.college_name}: what was the 5-year cutoff trend, placement average, and admission process for my profile?`)}
        >
          <FaUserGraduate className="me-1" /> Consult Counselor About College
        </button>
      </div>
    </div>
  );
}

// Markdown custom components for clean table, callout, and header display
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

export default function MainApp({ studentProfile }) {
  const navigate = useNavigate();
  const { messages, loading: chatLoading, followUps, sendMessage, clearChat } = useChat(studentProfile);
  const [colleges, setColleges] = useState([]);
  const [careers, setCareers] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [recsError, setRecsError] = useState(false);
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState("colleges");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchRecs = async () => {
      setRecsLoading(true);
      setRecsError(false);
      try {
        const res = await fetch(`${API_BASE}/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_profile: studentProfile }),
        });
        const data = await res.json();
        if (data.success && data.colleges?.length > 0) {
          setColleges(data.colleges);
          setCareers(data.career_opportunities || []);
        } else {
          setRecsError(true);
        }
      } catch {
        setRecsError(true);
      } finally {
        setRecsLoading(false);
      }
    };
    fetchRecs();
  }, [studentProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const handleSend = () => {
    if (!inputText.trim() || chatLoading) return;
    sendMessage(inputText);
    setInputText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAskAI = (q) => {
    sendMessage(q);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Inter',sans-serif", overflow: "hidden" }}>
      {/* Header */}
      <nav className="navbar px-3 px-md-4 py-2 flex-shrink-0" style={{ background: "linear-gradient(135deg,#1A237E,#3949AB)" }}>
        <span className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold">
          <FaGraduationCap size={24} color="#FFB300" />
          <span style={{ fontFamily: "'Poppins',sans-serif" }}>{APP_NAME}</span>
        </span>
        <div className="d-flex align-items-center gap-2">
          <span className="badge px-3 py-2 shadow-sm" style={{ background: "rgba(255,179,0,0.2)", border: "1px solid #FFB300", color: "#FFD54F", borderRadius: 9999 }}>
            {studentProfile.name} | {studentProfile.stream} | {studentProfile.marks}%
          </span>
          <button
            className="btn btn-sm fw-semibold shadow-sm"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 9999 }}
            onClick={() => navigate("/profile")}
          >
            <FaSyncAlt className="me-1" /> New Search
          </button>
        </div>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT — Colleges / Careers */}
        <div style={{ width: 420, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid #E0E7FF", overflow: "hidden" }}>
          {/* Tabs */}
          <ul className="nav nav-tabs border-0 bg-white flex-shrink-0 shadow-sm">
            <li className="nav-item flex-fill">
              <button
                className={`nav-link w-100 fw-semibold py-3 ${activeTab === "colleges" ? "active" : "text-secondary"}`}
                onClick={() => setActiveTab("colleges")}
                style={{ borderRadius: 0, borderBottom: activeTab === "colleges" ? "3px solid #1A237E" : "3px solid transparent" }}
              >
                <FaUniversity className="me-1 text-primary" /> Colleges ({colleges.length})
              </button>
            </li>
            <li className="nav-item flex-fill">
              <button
                className={`nav-link w-100 fw-semibold py-3 ${activeTab === "careers" ? "active" : "text-secondary"}`}
                onClick={() => setActiveTab("careers")}
                style={{ borderRadius: 0, borderBottom: activeTab === "careers" ? "3px solid #1A237E" : "3px solid transparent" }}
              >
                <FaBriefcase className="me-1 text-warning" /> Careers
              </button>
            </li>
          </ul>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", background: "#F8F9FF" }}>
            {activeTab === "colleges" && (
              recsLoading ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-secondary">
                  <div className="spinner-border text-primary mb-3" />
                  <p className="mb-1 fw-semibold">🤖 AI is generating live recommendations...</p>
                  <small>Analyzing cutoffs, fees & ratings for your score</small>
                </div>
              ) : recsError ? (
                <div className="alert alert-warning text-center m-2 shadow-sm">
                  <FaExclamationTriangle className="me-2" />
                  Could not load recommendations. Ask the AI Counselor in the chat!
                </div>
              ) : colleges.length === 0 ? (
                <div className="text-center py-5 text-secondary">
                  <FaSearch size={40} className="mb-3 text-primary opacity-50" />
                  <p className="fw-semibold">No colleges found</p>
                  <small>Try asking the AI Counselor directly!</small>
                </div>
              ) : (
                colleges.map((college, i) => (
                  <CollegeCard key={i} college={college} onAskAI={handleAskAI} />
                ))
              )
            )}

            {activeTab === "careers" && (
              <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
                <div className="card-body p-3">
                  <h6 className="fw-bold mb-3" style={{ color: "#1A237E", fontFamily: "'Poppins',sans-serif" }}>
                    <FaBriefcase className="me-2 text-warning" />
                    High-Growth Careers in {studentProfile.stream}
                  </h6>
                  {careers.map((career, i) => (
                    <div key={i} className="d-flex align-items-center gap-2 py-2 border-bottom">
                      <span className="text-primary fw-bold">🎯</span>
                      <span style={{ fontSize: 13.5, color: "#2C3E50" }}>{career}</span>
                    </div>
                  ))}
                  {careers.length === 0 && (
                    <p className="text-secondary small">Ask the AI about career opportunities in your stream!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — AI Chat */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Chat Header */}
          <div className="d-flex align-items-center justify-content-between px-4 py-2 bg-white border-bottom flex-shrink-0 shadow-sm">
            <div className="d-flex align-items-center gap-2">
              <div className="p-1 rounded-circle bg-primary bg-opacity-10 text-primary">
                <FaHeadset size={18} />
              </div>
              <span className="fw-bold text-dark" style={{ fontFamily: "'Poppins',sans-serif", fontSize: 15 }}>
                AI Education Counselor
              </span>
              <span className="badge bg-success shadow-sm" style={{ fontSize: 10 }}>LIVE</span>
            </div>
            <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 8, fontSize: 12 }} onClick={clearChat}>
              <FaTrash className="me-1" size={11} /> Clear Chat
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: "#F8F9FF" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`d-flex mb-3 ${msg.role === "user" ? "justify-content-end" : "justify-content-start"}`}>
                <div style={{ maxWidth: msg.role === "user" ? "75%" : "95%", width: msg.role === "user" ? "auto" : "100%" }}>
                  <div className="small fw-bold mb-1 px-1" style={{ color: msg.role === "user" ? "#3949AB" : "#FF8F00" }}>
                    {msg.role === "user"
                      ? <><FaUser size={11} className="me-1" />{studentProfile.name}</>
                      : <><FaUserGraduate size={11} className="me-1" />AI Counselor</>}
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

            {chatLoading && (
              <div className="d-flex justify-content-start mb-3">
                <div className="p-3 bg-white rounded-3 shadow-sm border d-flex gap-2 align-items-center" style={{ borderRadius: "18px 18px 18px 4px" }}>
                  <div className="spinner-grow spinner-grow-sm text-primary" />
                  <div className="spinner-grow spinner-grow-sm text-primary" style={{ animationDelay: "0.15s" }} />
                  <div className="spinner-grow spinner-grow-sm text-primary" style={{ animationDelay: "0.3s" }} />
                  <span className="text-secondary ms-1 small fw-semibold">AI Counselor is preparing your analysis...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Follow-up chips */}
          <div className="d-flex align-items-center gap-2 flex-wrap px-4 py-2 bg-white border-top flex-shrink-0">
            <span className="small text-secondary fw-semibold">💡 Suggestions:</span>
            {followUps.map((q, i) => (
              <button
                key={i}
                className="btn btn-sm btn-outline-primary fw-semibold shadow-sm"
                style={{ borderRadius: 9999, fontSize: 12 }}
                onClick={() => handleAskAI(q)}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="d-flex gap-2 p-3 bg-white border-top flex-shrink-0">
            <textarea
              className="form-control"
              placeholder="Ask about 5-year cutoffs, placement packages, branch selection... (Press Enter to send)"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ borderRadius: 14, resize: "none", fontSize: 14 }}
            />
            <button
              className="btn fw-bold px-4 shadow-sm"
              disabled={chatLoading || !inputText.trim()}
              onClick={handleSend}
              style={{
                background: chatLoading || !inputText.trim()
                  ? "#E0E7FF"
                  : "linear-gradient(135deg,#FFB300,#FF8F00)",
                color: chatLoading || !inputText.trim() ? "#546E7A" : "#1A237E",
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

      <style>{`
        .nav-link { background: none; border: none; cursor: pointer; }
        .nav-link.active { color: #1A237E !important; background: #F0F3FF; }
        table th { background-color: #1A237E !important; color: #ffffff !important; }
      `}</style>
    </div>
  );
}
