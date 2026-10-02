import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGraduationCap, FaUserGraduate, FaHeadset, FaSearch, FaFilter,
  FaCheckCircle, FaExclamationTriangle, FaTimesCircle,
  FaSyncAlt, FaBriefcase, FaUniversity, FaArrowRight,
  FaChartLine, FaSlidersH
} from "react-icons/fa";
import CollegeCard from "../components/CollegeCard";
import { APP_NAME } from "./LandingPage";

const API_BASE = "/api";

export default function Dashboard({ studentProfile, onSelectCollegeForChat }) {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedEligibility, setSelectedEligibility] = useState("All");
  const [sortBy, setSortBy] = useState("recommended");

  useEffect(() => {
    let isMounted = true;
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(false);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout safeguard

      try {
        const res = await fetch(`${API_BASE}/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_profile: studentProfile }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (data.success && data.colleges?.length > 0 && isMounted) {
          setColleges(data.colleges);
          setCareers(data.career_opportunities || []);
          setLoading(false);
          return;
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn("Live recommendation notice:", err);
      }

      // Fast fallback to ensure the student ALWAYS sees colleges immediately
      try {
        const fallbackRes = await fetch(`${API_BASE}/featured-colleges?stream=${studentProfile.stream || "All"}`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success && fallbackData.colleges?.length > 0 && isMounted) {
          const adapted = fallbackData.colleges.map((c) => {
            const diff = studentProfile.marks - c.cutoff_marks;
            const status = diff >= 2 ? "eligible" : diff >= -6 ? "borderline" : "not_eligible";
            return {
              ...c,
              student_marks: studentProfile.marks,
              eligibility: {
                status,
                label: status === "eligible" ? "✅ Eligible" : status === "borderline" ? "⚠️ Borderline" : "❌ Aspirational",
                color: status === "eligible" ? "success" : status === "borderline" ? "warning" : "danger"
              }
            };
          });
          setColleges(adapted);
          setLoading(false);
          return;
        }
      } catch (fErr) {
        console.error("Fallback error", fErr);
      }

      if (isMounted) {
        setError(true);
        setLoading(false);
      }
    };

    fetchRecommendations();
    return () => { isMounted = false; };
  }, [studentProfile]);

  const handleAskAI = (college) => {
    const initialPrompt = `Tell me all about ${college.college_name}: what are the recent 5-year cutoffs, placement packages, branch choices, and admission process for my ${studentProfile.marks}% score?`;
    if (onSelectCollegeForChat) {
      onSelectCollegeForChat(initialPrompt);
    }
    navigate("/chat", { state: { initialPrompt, selectedCollege: college.college_name } });
  };

  // Filter and sort logic
  const filteredColleges = colleges.filter((c) => {
    const matchesSearch =
      c.college_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.branch && c.branch.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType =
      selectedType === "All" ||
      c.college_type.toLowerCase() === selectedType.toLowerCase();

    const matchesEligibility =
      selectedEligibility === "All" ||
      c.eligibility?.status.toLowerCase() === selectedEligibility.toLowerCase();

    return matchesSearch && matchesType && matchesEligibility;
  });

  const sortedColleges = [...filteredColleges].sort((a, b) => {
    if (sortBy === "cutoffDesc") return b.cutoff_marks - a.cutoff_marks;
    if (sortBy === "cutoffAsc") return a.cutoff_marks - b.cutoff_marks;
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "fees") return a.annual_fees - b.annual_fees;
    return 0; // default recommendation order
  });

  const eligibleCount = colleges.filter((c) => c.eligibility?.status === "eligible").length;
  const borderlineCount = colleges.filter((c) => c.eligibility?.status === "borderline").length;
  const aspirationalCount = colleges.filter((c) => c.eligibility?.status === "not_eligible").length;

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: "#F5F7FA", fontFamily: "'Inter', sans-serif" }}>
      {/* Top Navbar */}
      <nav
        className="navbar navbar-expand-lg px-4 py-3 sticky-top shadow-sm"
        style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)" }}
      >
        <div className="container-fluid">
          <span className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold fs-5" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
            <FaGraduationCap size={28} color="#FFB300" />
            <span style={{ fontFamily: "'Poppins', sans-serif" }}>{APP_NAME}</span>
          </span>

          <div className="d-flex align-items-center gap-3 ms-auto">
            {/* Student Profile Pill */}
            <div className="d-none d-md-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
              <span className="badge bg-warning text-dark fw-bold">{studentProfile.stream}</span>
              <span className="text-white small fw-semibold">{studentProfile.name}</span>
              <span className="text-white-50">|</span>
              <span className="text-warning fw-bold small">{studentProfile.marks}%</span>
            </div>

            {/* Direct Link to AI Counselor */}
            <button
              className="btn btn-warning fw-bold px-3 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2"
              onClick={() => navigate("/chat")}
              style={{ background: "linear-gradient(135deg, #FFB300, #FF8F00)", border: "none", color: "#1A237E" }}
            >
              <FaHeadset size={16} />
              <span>Talk to Counselor</span>
            </button>

            {/* Edit / New Search */}
            <button
              className="btn btn-outline-light btn-sm fw-semibold rounded-pill px-3 py-2"
              onClick={() => navigate("/profile")}
            >
              <FaSyncAlt className="me-1" size={11} /> Edit Profile
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Welcome Banner */}
      <div
        className="py-4 px-4 text-white"
        style={{ background: "linear-gradient(135deg, #1A237E 0%, #283593 100%)" }}
      >
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <span className="badge bg-warning text-dark mb-2 px-3 py-1 fw-bold">🎓 Personalized Student Dashboard</span>
              <h2 className="fw-black mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Welcome, {studentProfile.name}!
              </h2>
              <p className="text-white-50 mb-0" style={{ fontSize: 14 }}>
                Here are the top colleges recommended for your <strong>{studentProfile.marks}%</strong> score in <strong>{studentProfile.stream}</strong> ({studentProfile.exam_type}).
              </p>
            </div>
            <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <button
                className="btn btn-light fw-bold px-4 py-2 shadow-sm rounded-pill text-primary d-inline-flex align-items-center gap-2"
                onClick={() => navigate("/chat")}
              >
                <span>Ask AI Admission Advice</span>
                <FaArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="row g-3 mt-3">
            <div className="col-6 col-md-3">
              <div className="p-3 rounded-4 shadow-sm" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <div className="text-white-50 small">Recommended</div>
                <div className="fs-3 fw-black text-warning">{colleges.length} Colleges</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 rounded-4 shadow-sm" style={{ background: "rgba(46,125,50,0.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(76,175,80,0.3)" }}>
                <div className="text-white-50 small">Safe / Eligible</div>
                <div className="fs-3 fw-black text-success">{eligibleCount} Colleges</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 rounded-4 shadow-sm" style={{ background: "rgba(239,108,0,0.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,152,0,0.3)" }}>
                <div className="text-white-50 small">Borderline Target</div>
                <div className="fs-3 fw-black text-warning">{borderlineCount} Colleges</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 rounded-4 shadow-sm" style={{ background: "rgba(198,40,40,0.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(244,67,54,0.3)" }}>
                <div className="text-white-50 small">Aspirational</div>
                <div className="fs-3 fw-black text-danger">{aspirationalCount} Colleges</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container py-4 flex-grow-1">
        {/* Search, Filter & Sort Toolbar */}
        <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
          <div className="row g-3 align-items-center">
            {/* Search Input */}
            <div className="col-12 col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-secondary">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search college name, city, or branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontSize: 14 }}
                />
              </div>
            </div>

            {/* Filter by Type */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm bg-light fw-semibold"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Government">Government</option>
                <option value="Private">Private</option>
              </select>
            </div>

            {/* Filter by Eligibility */}
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm bg-light fw-semibold"
                value={selectedEligibility}
                onChange={(e) => setSelectedEligibility(e.target.value)}
              >
                <option value="All">All Eligibility</option>
                <option value="eligible">✅ Eligible (High Chance)</option>
                <option value="borderline">⚠️ Borderline</option>
                <option value="not_eligible">❌ Aspirational</option>
              </select>
            </div>

            {/* Sort by */}
            <div className="col-12 col-md-3">
              <select
                className="form-select form-select-sm bg-light fw-semibold"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recommended">Sort: Best Match</option>
                <option value="cutoffDesc">Cutoff: High to Low</option>
                <option value="cutoffAsc">Cutoff: Low to High</option>
                <option value="rating">Top Rated (⭐)</option>
                <option value="fees">Fees: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" style={{ width: 44, height: 44 }} />
            <h5 className="fw-bold text-dark">
              <FaUserGraduate className="me-2 text-primary" /> Evaluating Top Colleges for Your Profile...
            </h5>
            <p className="text-secondary small">Analyzing recent cutoff percentiles, merit trends, and fee structures</p>
          </div>
        )}

        {/* Error / Empty State */}
        {!loading && sortedColleges.length === 0 && (
          <div className="text-center py-5 card border-0 shadow-sm rounded-4 p-5 bg-white">
            <FaUniversity size={54} className="text-secondary opacity-50 mb-3" />
            <h5 className="fw-bold text-dark">No colleges matched your filters</h5>
            <p className="text-secondary small mb-3">Try clearing search filters or ask the AI Counselor directly in chat.</p>
            <button
              className="btn btn-primary btn-sm rounded-pill px-4 mx-auto"
              onClick={() => { setSearchQuery(""); setSelectedType("All"); setSelectedEligibility("All"); }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* College Cards Grid */}
        {!loading && sortedColleges.length > 0 && (
          <div className="row g-4">
            {sortedColleges.map((college, idx) => (
              <div key={idx} className="col-12 col-md-6 col-lg-4">
                <CollegeCard college={college} onAskAI={handleAskAI} />
              </div>
            ))}
          </div>
        )}

        {/* Career Opportunities Banner */}
        {careers.length > 0 && (
          <div className="card border-0 shadow-sm rounded-4 mt-5 p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div>
                <h5 className="fw-bold mb-1" style={{ color: "#1A237E", fontFamily: "'Poppins', sans-serif" }}>
                  <FaBriefcase className="me-2 text-warning" />
                  Top Career Trajectories in {studentProfile.stream}
                </h5>
                <p className="text-secondary small mb-0">High-growth employment sectors for graduates in this stream</p>
              </div>
              <button
                className="btn btn-outline-primary btn-sm rounded-pill fw-semibold px-3"
                onClick={() => navigate("/chat", { state: { initialPrompt: `What are the average salary packages and career growth for ${studentProfile.stream} graduates in India?` } })}
              >
                Explore Salaries with AI →
              </button>
            </div>
            <div className="row g-2">
              {careers.map((career, i) => (
                <div key={i} className="col-12 col-sm-6 col-md-4">
                  <div className="p-3 rounded-3 border bg-light d-flex align-items-center gap-2">
                    <span className="text-primary fw-bold">🎯</span>
                    <span className="fw-semibold text-dark small">{career}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating AI Counselor Chat Button */}
      <div className="position-fixed bottom-0 end-0 p-4" style={{ zIndex: 1050 }}>
        <button
          className="btn btn-lg fw-bold rounded-pill shadow-lg d-flex align-items-center gap-2 px-4 py-3"
          style={{
            background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
            color: "#ffffff",
            border: "2px solid #FFB300",
            boxShadow: "0 8px 32px rgba(26,35,126,0.35)"
          }}
          onClick={() => navigate("/chat")}
        >
          <FaHeadset size={20} className="text-warning" />
          <span>Talk to Counselor</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 bg-white border-top text-secondary small mt-auto">
        <FaGraduationCap color="#FFB300" className="me-2" />
        {APP_NAME} — Live AI-Powered Indian College Recommendation System
      </footer>
    </div>
  );
}
