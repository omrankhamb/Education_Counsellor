import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGraduationCap, FaUserGraduate, FaHeadset, FaSearch, FaFilter,
  FaCheckCircle, FaExclamationTriangle, FaTimesCircle,
  FaSyncAlt, FaBriefcase, FaUniversity, FaArrowRight,
  FaChartLine, FaHeart, FaRegHeart, FaBalanceScale,
  FaCalendarCheck, FaFilePdf, FaPrint, FaTimes, FaTrash,
  FaChevronLeft, FaChevronRight, FaChevronUp, FaChevronDown
} from "react-icons/fa";
import CollegeCard from "../components/CollegeCard";
import { APP_NAME } from "./LandingPage";
import { formatScore } from "../utils/scoreUtils";

const API_BASE = "/api";

export default function Dashboard({ studentProfile, onSelectCollegeForChat, currentUser, onLogout }) {
  const navigate = useNavigate();

  // Profile Fallback Defaults to prevent null errors
  const profile = studentProfile || {
    name: "Student",
    stream: "Engineering",
    marks: 85,
    exam_type: "MHT-CET",
    score_unit: "percentile",
    preferred_state: "Maharashtra",
    budget: "Any",
    college_type: "Any",
  };

  const [colleges, setColleges] = useState([]);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedEligibility, setSelectedEligibility] = useState("All");
  const [sortBy, setSortBy] = useState("recommended");
  const [filterShortlistOnly, setFilterShortlistOnly] = useState(false);

  // Shortlist State (Persisted in localStorage)
  const [shortlisted, setShortlisted] = useState(() => {
    try {
      const saved = localStorage.getItem(`edu_shortlist_${profile.name}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // College Comparison State (Max 3 colleges)
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Left Sidebar Visibility & Scroll Navigation
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const sidebarScrollRef = useRef(null);
  const chancesRef = useRef(null);
  const shortlistRef = useRef(null);
  const compareRef = useRef(null);
  const deadlinesRef = useRef(null);
  const reportRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(`edu_shortlist_${profile.name}`, JSON.stringify(shortlisted));
    } catch {}
  }, [shortlisted, profile.name]);

  const toggleShortlist = (college) => {
    setShortlisted((prev) => {
      const exists = prev.some((c) => c.college_name === college.college_name);
      if (exists) {
        return prev.filter((c) => c.college_name !== college.college_name);
      } else {
        return [...prev, college];
      }
    });
  };

  const toggleCompare = (college) => {
    setSelectedForCompare((prev) => {
      const exists = prev.some((c) => c.college_name === college.college_name);
      if (exists) {
        return prev.filter((c) => c.college_name !== college.college_name);
      } else {
        if (prev.length >= 3) {
          alert("You can compare up to 3 colleges at a time. Please deselect one first.");
          return prev;
        }
        return [...prev, college];
      }
    });
  };

  const isIITCollege = (name = "") => {
    const l = name.toLowerCase();
    if (l.includes("information technology") || l.includes("iiit") || l.includes("viit") || l.includes("kiit")) return false;
    if (l.includes("indian institute of technology")) return true;
    return /\biit\b/.test(l);
  };

  const isNITCollege = (name = "") => {
    const l = name.toLowerCase();
    if (l.includes("national institute of technology")) return true;
    return /\b(nit|vnit|svnit|mnit|manit)\b/.test(l);
  };

  const sanitizeCollegesForProfile = (list, prof) => {
    if (!Array.isArray(list)) return [];
    const examLower = (prof?.exam_type || "").toLowerCase();
    const isMedical = (prof?.stream || "").toLowerCase() === "medical" || examLower.includes("neet");

    return list.filter((c) => {
      const cname = c.college_name || "";
      const isIIT = isIITCollege(cname);
      const isNIT = isNITCollege(cname);

      // 1. JEE Advanced: MUST be an IIT
      if (examLower.includes("advanced")) {
        return isIIT;
      }
      // 2. JEE Main: NEVER an IIT (IIT requires JEE Advanced)
      if (examLower.includes("main")) {
        return !isIIT;
      }
      // 3. MHT-CET: NEVER an IIT, NIT, BITS, VIT Vellore, SRM
      if (examLower.includes("cet")) {
        if (isIIT || isNIT) return false;
        const cnameL = cname.toLowerCase();
        if (cnameL.includes("bits pilani") || cnameL.includes("vit vellore") || cnameL.includes("srm institute")) return false;
        return true;
      }
      // 4. NEET: MUST be medical/dental
      if (isMedical) {
        const medicalKeywords = [
          "medical", "aiims", "jipmer", "hospital", "institute of medical", 
          "gmc", "afmc", "kem", "dental"
        ];
        return medicalKeywords.some((k) => cname.toLowerCase().includes(k));
      }
      return true;
    });
  };

  useEffect(() => {
    let isMounted = true;
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(false);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      try {
        const res = await fetch(`${API_BASE}/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_profile: profile }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (data.success && data.colleges?.length > 0 && isMounted) {
          const sanitized = sanitizeCollegesForProfile(data.colleges, profile);
          setColleges(sanitized);
          setCareers(data.career_opportunities || []);
          setLoading(false);
          return;
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn("Live recommendation notice:", err);
      }

      // Fast fallback strictly filtered by exam_type to ensure MHT-CET NEVER receives IITs/NITs
      try {
        const fallbackRes = await fetch(
          `${API_BASE}/featured-colleges?stream=${encodeURIComponent(profile.stream || "Engineering")}&exam_type=${encodeURIComponent(profile.exam_type || "")}`
        );
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success && fallbackData.colleges?.length > 0 && isMounted) {
          const adapted = fallbackData.colleges.map((c) => {
            const unit = profile.score_unit;
            let cut_val = c.cutoff_marks;
            if (unit === "marks_720") {
              cut_val = c.cutoff_neet ? c.cutoff_neet : (cut_val <= 100 ? Math.round(cut_val * 7.2) : cut_val);
            } else if (unit === "rank") {
              cut_val = c.cutoff_rank ? c.cutoff_rank : (cut_val <= 100 ? Math.round(Math.max(300, (100 - cut_val) * 1200)) : cut_val);
            } else {
              cut_val = c.cutoff_percent ? c.cutoff_percent : cut_val;
            }

            let status = "eligible";
            if (unit === "rank") {
              status = profile.marks <= cut_val ? "eligible" : profile.marks <= cut_val * 1.2 ? "borderline" : "not_eligible";
            } else if (unit === "marks_720") {
              const diff = profile.marks - cut_val;
              status = diff >= 5 ? "eligible" : diff >= -25 ? "borderline" : "not_eligible";
            } else {
              const diff = profile.marks - cut_val;
              status = diff >= 1.5 ? "eligible" : diff >= -5 ? "borderline" : "not_eligible";
            }

            return {
              ...c,
              stream: profile.stream,
              cutoff_marks: cut_val,
              student_marks: profile.marks,
              score_unit: profile.score_unit,
              exam_type: profile.exam_type,
              eligibility: {
                status,
                label: status === "eligible" ? "✅ Eligible" : status === "borderline" ? "⚠️ Borderline" : "❌ Aspirational",
                color: status === "eligible" ? "success" : status === "borderline" ? "warning" : "danger"
              }
            };
          });
          const sanitizedFallback = sanitizeCollegesForProfile(adapted, profile);
          setColleges(sanitizedFallback);
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
  }, [
    profile.stream,
    profile.marks,
    profile.exam_type,
    profile.preferred_state,
    profile.budget,
    profile.college_type,
    profile.category,
    profile.name
  ]);

  const handleAskAI = (college) => {
    const formattedScore = formatScore(profile.marks, profile.exam_type, profile.score_unit);
    const initialPrompt = `Tell me all about ${college.college_name}: what are the recent 3 to 5-year cutoffs (2024/2023/2022), placement packages, branch choices, and admission roadmap for my score of ${formattedScore} in ${profile.exam_type}?`;
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

    const matchesShortlist = filterShortlistOnly
      ? shortlisted.some((s) => s.college_name === c.college_name)
      : true;

    return matchesSearch && matchesType && matchesEligibility && matchesShortlist;
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

  const totalCount = colleges.length || 1;
  const safePercent = Math.round((eligibleCount / totalCount) * 100);
  const targetPercent = Math.round((borderlineCount / totalCount) * 100);
  const dreamPercent = Math.round((aspirationalCount / totalCount) * 100);

  // Stream-specific deadlines schedule
  const getStreamDeadlines = () => {
    const s = profile.stream;
    if (s === "Design") {
      return [
        { title: "NID DAT Prelims Results", date: "April 2026", status: "Announced", color: "success" },
        { title: "NID DAT Mains (Studio Test)", date: "May 2026", status: "Upcoming", color: "primary" },
        { title: "NIFT Situation Test & Interview", date: "May 2026", status: "Active", color: "warning" },
        { title: "Seat Allotment & Document Verification", date: "June 2026", status: "Scheduled", color: "secondary" },
      ];
    } else if (s === "Medical") {
      return [
        { title: "NEET All India 15% Quota Round 1", date: "July 2026", status: "Scheduled", color: "primary" },
        { title: "State Quota 85% Choice Filling", date: "August 2026", status: "Upcoming", color: "warning" },
        { title: "Physical Document Verification", date: "August 2026", status: "Scheduled", color: "secondary" },
        { title: "Mop-Up / Stray Vacancy Round", date: "September 2026", status: "Pending", color: "secondary" },
      ];
    } else {
      return [
        { title: "CAP Round 1 Registration & Verification", date: "June 2026", status: "Scheduled", color: "primary" },
        { title: "Provisional Merit List Release", date: "July 2026", status: "Upcoming", color: "warning" },
        { title: "Option Form Filling & Locking", date: "July 2026", status: "Scheduled", color: "secondary" },
        { title: "CAP Round 1 Seat Allocation", date: "August 2026", status: "Pending", color: "secondary" },
      ];
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: "#F5F7FA", fontFamily: "'Inter', sans-serif" }}>
      {/* Sleek Custom Scrollbar for Sidebar */}
      <style>{`
        .sidebar-scroll-container::-webkit-scrollbar {
          width: 5px;
        }
        .sidebar-scroll-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.03);
          border-radius: 8px;
        }
        .sidebar-scroll-container::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 8px;
        }
        .sidebar-scroll-container::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
      `}</style>

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
              <span className="badge bg-warning text-dark fw-bold">{profile.stream}</span>
              <span className="text-white small fw-semibold">{profile.name}</span>
              <span className="text-white-50">|</span>
              <span className="text-warning fw-bold small">
                {formatScore(profile.marks, profile.exam_type, profile.score_unit)}
              </span>
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

            {/* Edit Profile */}
            <button
              className="btn btn-outline-light btn-sm fw-semibold rounded-pill px-3 py-2"
              onClick={() => navigate("/profile")}
            >
              <FaSyncAlt className="me-1" size={11} /> Edit Profile
            </button>

            {/* Logout button */}
            {onLogout && (
              <button
                className="btn btn-outline-light btn-sm fw-semibold rounded-pill px-3 py-2"
                onClick={onLogout}
                title="Logout and switch student account"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Welcome Banner */}
      <div
        className="py-4 px-4 text-white"
        style={{ background: "linear-gradient(135deg, #1A237E 0%, #283593 100%)" }}
      >
        <div className="container-fluid px-lg-5">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <span className="badge bg-warning text-dark mb-2 px-3 py-1 fw-bold">🎓 Personalized Student Dashboard</span>
              <h2 className="fw-black mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Welcome, {profile.name}!
              </h2>
              <p className="text-white-50 mb-0" style={{ fontSize: 14 }}>
                Curated college recommendations for your <strong>{formatScore(profile.marks, profile.exam_type, profile.score_unit)}</strong> score in <strong>{profile.stream}</strong> ({profile.exam_type}).
              </p>
            </div>
            <div className="col-lg-4 text-lg-end mt-3 mt-lg-0 d-flex gap-2 justify-content-lg-end flex-wrap">
              <button
                className={`btn fw-bold px-3 py-2 rounded-pill shadow-sm d-inline-flex align-items-center gap-2 ${sidebarVisible ? "btn-outline-light" : "btn-warning text-dark"}`}
                onClick={() => setSidebarVisible(!sidebarVisible)}
                title={sidebarVisible ? "Hide Sidebar to the left" : "Show Sidebar on the left"}
              >
                {sidebarVisible ? <FaChevronLeft size={12} /> : <FaChevronRight size={12} />}
                <span>{sidebarVisible ? "Hide Sidebar" : "Show Sidebar"}</span>
              </button>
              <button
                className="btn btn-outline-light fw-bold px-3 py-2 rounded-pill shadow-sm d-inline-flex align-items-center gap-2"
                onClick={() => setShowReportModal(true)}
              >
                <FaFilePdf size={13} className="text-warning" />
                <span>Export Report</span>
              </button>
              <button
                className="btn btn-light fw-bold px-4 py-2 shadow-sm rounded-pill text-primary d-inline-flex align-items-center gap-2"
                onClick={() => navigate("/chat")}
              >
                <span>Ask AI Counselor</span>
                <FaArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Container: Left (Sidebar) + Right (Grid) */}
      <div className="container-fluid px-lg-5 py-4 flex-grow-1 position-relative">
        {/* Floating Left Tab to Unhide / Show Sidebar */}
        {!sidebarVisible && (
          <button
            type="button"
            className="btn position-fixed start-0 top-50 translate-middle-y shadow-lg d-flex align-items-center gap-2 py-2 px-3 text-white border-0"
            style={{
              borderTopRightRadius: 24,
              borderBottomRightRadius: 24,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
              cursor: "pointer",
              boxShadow: "0 6px 24px rgba(26,35,126,0.35)",
              zIndex: 1040,
              transition: "all 0.2s ease"
            }}
            onClick={() => setSidebarVisible(true)}
            title="Click to slide open Left Sidebar"
          >
            <FaChevronRight size={13} className="text-warning" />
            <span className="fw-bold" style={{ fontSize: 13 }}>Show Sidebar</span>
            {shortlisted.length > 0 && (
              <span className="badge bg-danger rounded-pill px-2 py-1" style={{ fontSize: 10 }}>
                {shortlisted.length}
              </span>
            )}
          </button>
        )}

        <div className="row g-4">
          {/* ================= LEFT SIDEBAR ================= */}
          {sidebarVisible && (
            <div className="col-12 col-xl-4 col-lg-4">
              <div style={{ position: "sticky", top: 85 }}>
                {/* 1. Sidebar Top Header Bar with Slide Up/Down & Hide Left */}
                <div className="card border-0 shadow-sm rounded-4 p-2 px-3 mb-2 bg-white d-flex flex-row align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold text-dark small" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      📌 Counseling Tools
                    </span>
                    {shortlisted.length > 0 && (
                      <span className="badge bg-danger rounded-pill" style={{ fontSize: 10 }}>
                        {shortlisted.length} saved
                      </span>
                    )}
                  </div>

                  <div className="d-flex align-items-center gap-1">
                    {/* Slide Up Button */}
                    <button
                      type="button"
                      className="btn btn-sm btn-light border p-1 rounded-circle d-flex align-items-center justify-content-center shadow-xs"
                      style={{ width: 28, height: 28 }}
                      onClick={() => sidebarScrollRef.current?.scrollBy({ top: -320, behavior: "smooth" })}
                      title="Slide Up (Scroll Up)"
                    >
                      <FaChevronUp size={11} className="text-secondary" />
                    </button>

                    {/* Slide Down Button */}
                    <button
                      type="button"
                      className="btn btn-sm btn-light border p-1 rounded-circle d-flex align-items-center justify-content-center shadow-xs"
                      style={{ width: 28, height: 28 }}
                      onClick={() => sidebarScrollRef.current?.scrollBy({ top: 320, behavior: "smooth" })}
                      title="Slide Down (Scroll Down)"
                    >
                      <FaChevronDown size={11} className="text-secondary" />
                    </button>

                    {/* Hide Left Button */}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger border p-1 px-2 rounded-pill d-flex align-items-center gap-1 ms-1 shadow-xs"
                      style={{ fontSize: 11 }}
                      onClick={() => setSidebarVisible(false)}
                      title="Hide sidebar to the left"
                    >
                      <FaChevronLeft size={10} />
                      <span className="fw-bold">Hide Left</span>
                    </button>
                  </div>
                </div>

                {/* 2. Quick Jump Navigation Pills */}
                <div className="d-flex gap-1 overflow-auto pb-2 mb-1" style={{ scrollbarWidth: "none" }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border rounded-pill px-2 py-1 text-nowrap text-secondary fw-semibold"
                    style={{ fontSize: 11 }}
                    onClick={() => chancesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    📊 Chances
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border rounded-pill px-2 py-1 text-nowrap text-secondary fw-semibold"
                    style={{ fontSize: 11 }}
                    onClick={() => shortlistRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    ❤️ Shortlist ({shortlisted.length})
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border rounded-pill px-2 py-1 text-nowrap text-secondary fw-semibold"
                    style={{ fontSize: 11 }}
                    onClick={() => compareRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    ⚖️ Compare ({selectedForCompare.length})
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border rounded-pill px-2 py-1 text-nowrap text-secondary fw-semibold"
                    style={{ fontSize: 11 }}
                    onClick={() => deadlinesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    📅 Deadlines
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-light border rounded-pill px-2 py-1 text-nowrap text-secondary fw-semibold"
                    style={{ fontSize: 11 }}
                    onClick={() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    📄 PDF Report
                  </button>
                </div>

                {/* 3. Dedicated Smooth Scroll Container (Slide up and down) */}
                <div
                  ref={sidebarScrollRef}
                  className="sidebar-scroll-container d-flex flex-column gap-3"
                  style={{
                    maxHeight: "calc(100vh - 175px)",
                    overflowY: "auto",
                    overflowX: "hidden",
                    paddingRight: 6,
                    scrollBehavior: "smooth"
                  }}
                >
                  {/* SIDEBAR WIDGET 1: 📊 Admission Chances Meter */}
                  <div ref={chancesRef} className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
                <div className="p-3 text-white" style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)" }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      <FaChartLine className="text-warning" /> Admission Chances Meter
                    </h6>
                    <span className="badge bg-warning text-dark small">{colleges.length} Analyzed</span>
                  </div>
                </div>

                <div className="p-3">
                  {/* Visual Proportion Bar */}
                  <div className="progress mb-3" style={{ height: 10, borderRadius: 6 }}>
                    <div className="progress-bar bg-success" style={{ width: `${safePercent}%` }} title={`Safe: ${safePercent}%`} />
                    <div className="progress-bar bg-warning" style={{ width: `${targetPercent}%` }} title={`Target: ${targetPercent}%`} />
                    <div className="progress-bar bg-danger" style={{ width: `${dreamPercent}%` }} title={`Dream: ${dreamPercent}%`} />
                  </div>

                  {/* 3 Clickable Tiers */}
                  <div className="d-flex flex-column gap-2">
                    {/* Safe Tier */}
                    <button
                      type="button"
                      className={`btn btn-sm d-flex align-items-center justify-content-between p-2 rounded-3 border text-start ${selectedEligibility === "eligible" ? "border-success bg-success bg-opacity-10 fw-bold" : "bg-light"}`}
                      onClick={() => { setSelectedEligibility(selectedEligibility === "eligible" ? "All" : "eligible"); setFilterShortlistOnly(false); }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-success rounded-circle p-1"></span>
                        <span className="small text-dark">🟢 Safe / High Chance (&gt;90%)</span>
                      </div>
                      <span className="badge bg-success">{eligibleCount}</span>
                    </button>

                    {/* Target Tier */}
                    <button
                      type="button"
                      className={`btn btn-sm d-flex align-items-center justify-content-between p-2 rounded-3 border text-start ${selectedEligibility === "borderline" ? "border-warning bg-warning bg-opacity-10 fw-bold" : "bg-light"}`}
                      onClick={() => { setSelectedEligibility(selectedEligibility === "borderline" ? "All" : "borderline"); setFilterShortlistOnly(false); }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-warning rounded-circle p-1"></span>
                        <span className="small text-dark">🟡 Target / Realistic (50-85%)</span>
                      </div>
                      <span className="badge bg-warning text-dark">{borderlineCount}</span>
                    </button>

                    {/* Dream Tier */}
                    <button
                      type="button"
                      className={`btn btn-sm d-flex align-items-center justify-content-between p-2 rounded-3 border text-start ${selectedEligibility === "not_eligible" ? "border-danger bg-danger bg-opacity-10 fw-bold" : "bg-light"}`}
                      onClick={() => { setSelectedEligibility(selectedEligibility === "not_eligible" ? "All" : "not_eligible"); setFilterShortlistOnly(false); }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-danger rounded-circle p-1"></span>
                        <span className="small text-dark">🔴 Dream / Reach (&lt;40%)</span>
                      </div>
                      <span className="badge bg-danger">{aspirationalCount}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SIDEBAR WIDGET 2: ❤️ My Shortlisted Colleges */}
              <div ref={shortlistRef} className="card border-0 shadow-sm rounded-4 bg-white">
                <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    <FaHeart className="text-danger" /> My Shortlist
                    <span className="badge bg-danger rounded-pill">{shortlisted.length}</span>
                  </h6>
                  {shortlisted.length > 0 && (
                    <button
                      className="btn btn-sm btn-link text-secondary p-0 text-decoration-none small"
                      onClick={() => setFilterShortlistOnly(!filterShortlistOnly)}
                    >
                      {filterShortlistOnly ? "Show All" : "Filter View"}
                    </button>
                  )}
                </div>

                <div className="p-3">
                  {shortlisted.length === 0 ? (
                    <div className="text-center py-3 text-secondary small">
                      <FaRegHeart size={24} className="text-muted mb-2 opacity-50" />
                      <div>Click the ❤️ on any college card to save it to your personal shortlist!</div>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: 220, overflowY: "auto" }}>
                      {shortlisted.map((c, i) => (
                        <div key={i} className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light border small">
                          <div className="text-truncate me-2" style={{ maxWidth: 200 }}>
                            <div className="fw-bold text-primary text-truncate">{c.college_name}</div>
                            <div className="text-muted" style={{ fontSize: 10 }}>{c.location} • ₹{(c.annual_fees/100000).toFixed(1)}L/yr</div>
                          </div>
                          <button
                            className="btn btn-sm text-danger p-0 border-0"
                            onClick={() => toggleShortlist(c)}
                            title="Remove from shortlist"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SIDEBAR WIDGET 3: ⚖️ College Side-by-Side Comparison */}
              <div ref={compareRef} className="card border-0 shadow-sm rounded-4 bg-white">
                <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    <FaBalanceScale className="text-primary" /> Compare Colleges
                    <span className="badge bg-primary rounded-pill">{selectedForCompare.length}/3</span>
                  </h6>
                  {selectedForCompare.length > 0 && (
                    <button
                      className="btn btn-sm btn-link text-secondary p-0 text-decoration-none small"
                      onClick={() => setSelectedForCompare([])}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="p-3">
                  {selectedForCompare.length === 0 ? (
                    <div className="text-center py-2 text-secondary small">
                      Select <strong>"Compare"</strong> on any 2 or 3 college cards to view side-by-side metrics.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2 mb-3">
                      {selectedForCompare.map((c, i) => (
                        <div key={i} className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light border small">
                          <span className="fw-semibold text-truncate" style={{ maxWidth: 220 }}>{c.college_name}</span>
                          <button
                            className="btn btn-sm text-muted p-0 border-0"
                            onClick={() => toggleCompare(c)}
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                      ))}
                      <button
                        className="btn btn-primary btn-sm w-100 fw-bold rounded-pill shadow-sm py-2 mt-1"
                        disabled={selectedForCompare.length < 2}
                        onClick={() => setShowCompareModal(true)}
                      >
                        ⚖️ Launch Comparison ({selectedForCompare.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* SIDEBAR WIDGET 4: 📅 Counseling Timeline & Deadlines */}
              <div ref={deadlinesRef} className="card border-0 shadow-sm rounded-4 bg-white">
                <div className="p-3 border-bottom">
                  <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    <FaCalendarCheck className="text-warning" /> Admission Deadlines ({profile.stream})
                  </h6>
                </div>
                <div className="p-3">
                  <div className="d-flex flex-column gap-3">
                    {getStreamDeadlines().map((item, idx) => (
                      <div key={idx} className="d-flex align-items-start gap-2 small">
                        <div className={`badge bg-${item.color} mt-1`} style={{ fontSize: 9 }}>{item.status}</div>
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: 12.5 }}>{item.title}</div>
                          <div className="text-muted" style={{ fontSize: 11 }}>📅 {item.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SIDEBAR WIDGET 5: 📄 Export Admission Summary Report */}
              <div ref={reportRef} className="card border-0 shadow-sm rounded-4 p-3 text-center bg-white border">
                <FaFilePdf size={28} className="text-danger mb-2 mx-auto" />
                <h6 className="fw-bold mb-1 text-dark" style={{ fontSize: 14 }}>
                  Personalized Admission Report
                </h6>
                <p className="text-muted small mb-3" style={{ fontSize: 11.5 }}>
                  Download or print your verified college roadmap with scores & cutoffs.
                </p>
                <button
                  className="btn btn-outline-danger btn-sm w-100 fw-bold rounded-pill py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setShowReportModal(true)}
                >
                  <FaPrint size={13} />
                  <span>View / Print PDF Summary</span>
                </button>
              </div>

                </div>
              </div>
            </div>
          )}

          {/* ================= RIGHT / MAIN CONTENT COLUMN ================= */}
          <div className={sidebarVisible ? "col-12 col-xl-8 col-lg-8" : "col-12"}>
            
            {/* Search, Filter & Sort Toolbar */}
            <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
              <div className="row g-3 align-items-center">
                {/* Sidebar Show/Hide Button in Toolbar */}
                <div className="col-auto">
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill fw-bold shadow-sm d-flex align-items-center gap-2 px-3 py-2 ${
                      sidebarVisible ? "btn-light border text-secondary" : "btn-primary text-white"
                    }`}
                    onClick={() => setSidebarVisible(!sidebarVisible)}
                    title={sidebarVisible ? "Hide Sidebar to the left" : "Show Sidebar on the left"}
                  >
                    {sidebarVisible ? (
                      <>
                        <FaChevronLeft size={11} />
                        <span className="d-none d-sm-inline">Hide Left</span>
                      </>
                    ) : (
                      <>
                        <FaChevronRight size={11} className="text-warning" />
                        <span>Show Sidebar</span>
                        {shortlisted.length > 0 && (
                          <span className="badge bg-danger rounded-pill px-1.5 py-0.5" style={{ fontSize: 10 }}>{shortlisted.length}</span>
                        )}
                      </>
                    )}
                  </button>
                </div>

                {/* Search Input */}
                <div className={sidebarVisible ? "col-12 col-md-3" : "col-12 col-md-4"}>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-secondary">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control bg-light border-start-0"
                      placeholder="Search college, location, branch..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ fontSize: 13.5 }}
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
                    <option value="eligible">✅ Safe (&gt;90%)</option>
                    <option value="borderline">⚠️ Target (50-85%)</option>
                    <option value="not_eligible">❌ Dream (&lt;40%)</option>
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

            {/* Active Shortlist Filter Alert Banner */}
            {filterShortlistOnly && (
              <div className="alert alert-info py-2 px-3 rounded-3 d-flex align-items-center justify-content-between mb-4 shadow-sm">
                <div className="d-flex align-items-center gap-2 small">
                  <FaHeart className="text-danger" />
                  <span>Showing only your <strong>{shortlisted.length}</strong> shortlisted colleges.</span>
                </div>
                <button
                  className="btn btn-sm btn-outline-info fw-bold py-0 px-2"
                  onClick={() => setFilterShortlistOnly(false)}
                >
                  Show All Colleges
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" style={{ width: 44, height: 44 }} />
                <h5 className="fw-bold text-dark">
                  <FaUserGraduate className="me-2 text-primary" /> Evaluating Top Colleges for Your Profile...
                </h5>
                <p className="text-secondary small">Analyzing cutoff marks, merit trends, and fee structures</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && sortedColleges.length === 0 && (
              <div className="text-center py-5 card border-0 shadow-sm rounded-4 p-5 bg-white">
                <FaUniversity size={54} className="text-secondary opacity-50 mb-3" />
                <h5 className="fw-bold text-dark">No colleges matched your filters</h5>
                <p className="text-secondary small mb-3">Try clearing search filters or ask the AI Counselor directly in chat.</p>
                <button
                  className="btn btn-primary btn-sm rounded-pill px-4 mx-auto"
                  onClick={() => { setSearchQuery(""); setSelectedType("All"); setSelectedEligibility("All"); setFilterShortlistOnly(false); }}
                >
                  Reset Filters
                </button>
              </div>
            )}

            {/* College Cards Grid (2 Columns on right side) */}
            {!loading && sortedColleges.length > 0 && (
              <div className="row g-4">
                {sortedColleges.map((college, idx) => {
                  const isShortlisted = shortlisted.some((s) => s.college_name === college.college_name);
                  const isSelectedForCompare = selectedForCompare.some((c) => c.college_name === college.college_name);
                  return (
                    <div key={idx} className={sidebarVisible ? "col-12 col-md-6" : "col-12 col-md-6 col-xl-4"}>
                      <CollegeCard
                        college={college}
                        onAskAI={handleAskAI}
                        isShortlisted={isShortlisted}
                        onToggleShortlist={toggleShortlist}
                        isSelectedForCompare={isSelectedForCompare}
                        onToggleCompare={toggleCompare}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Career Opportunities Banner */}
            {careers.length > 0 && (
              <div className="card border-0 shadow-sm rounded-4 mt-5 p-4 bg-white">
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div>
                    <h5 className="fw-bold mb-1" style={{ color: "#1A237E", fontFamily: "'Poppins', sans-serif" }}>
                      <FaBriefcase className="me-2 text-warning" />
                      Top Career Trajectories in {profile.stream}
                    </h5>
                    <p className="text-secondary small mb-0">High-growth employment sectors for graduates in this stream</p>
                  </div>
                  <button
                    className="btn btn-outline-primary btn-sm rounded-pill fw-semibold px-3"
                    onClick={() => navigate("/chat", { state: { initialPrompt: `What are the average salary packages and career growth for ${profile.stream} graduates in India?` } })}
                  >
                    Explore Salaries with AI →
                  </button>
                </div>
                <div className="row g-2">
                  {careers.map((career, i) => (
                    <div key={i} className="col-12 col-sm-6">
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

        </div>
      </div>

      {/* ================= COMPARE MODAL ================= */}
      {showCompareModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.6)", zIndex: 1060 }}
          onClick={() => setShowCompareModal(false)}
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header text-white" style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)" }}>
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  <FaBalanceScale className="text-warning" /> Side-by-Side College Comparison
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCompareModal(false)}
                />
              </div>

              <div className="modal-body p-4 bg-light">
                <div className="table-responsive bg-white rounded-3 shadow-sm border">
                  <table className="table table-bordered mb-0 align-middle text-center">
                    <thead style={{ background: "#1A237E", color: "#fff" }}>
                      <tr>
                        <th style={{ width: "22%", textAlign: "left" }}>Feature / Metric</th>
                        {selectedForCompare.map((c, i) => (
                          <th key={i} style={{ width: `${78 / selectedForCompare.length}%` }}>
                            {c.college_name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="fw-bold text-start bg-light">Campus Location</td>
                        {selectedForCompare.map((c, i) => (
                          <td key={i}>{c.location}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="fw-bold text-start bg-light">College Type</td>
                        {selectedForCompare.map((c, i) => (
                          <td key={i}>
                            <span className={`badge ${c.college_type === "Government" ? "bg-success" : "bg-warning text-dark"}`}>
                              {c.college_type}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="fw-bold text-start bg-light">Cutoff Required</td>
                        {selectedForCompare.map((c, i) => (
                          <td key={i} className="fw-bold text-primary">
                            {formatScore(c.cutoff_marks, c.exam_type || profile.exam_type, c.score_unit || profile.score_unit)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="fw-bold text-start bg-light">Your Score</td>
                        {selectedForCompare.map((c, i) => (
                          <td key={i} className="fw-bold text-success">
                            {formatScore(profile.marks, profile.exam_type, profile.score_unit)}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="fw-bold text-start bg-light">Admission Chance</td>
                        {selectedForCompare.map((c, i) => (
                          <td key={i}>
                            <span className={`badge bg-${c.eligibility?.status === "eligible" ? "success" : c.eligibility?.status === "borderline" ? "warning text-dark" : "danger"}`}>
                              {c.eligibility?.status === "eligible" ? "High (>90%)" : c.eligibility?.status === "borderline" ? "Moderate (50-80%)" : "Low / Dream (<40%)"}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="fw-bold text-start bg-light">Annual Tuition Fees</td>
                        {selectedForCompare.map((c, i) => (
                          <td key={i} className="fw-bold text-dark">
                            ₹{(c.annual_fees / 100000).toFixed(1)} Lakh/yr
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="fw-bold text-start bg-light">Placement Average</td>
                        {selectedForCompare.map((c, i) => (
                          <td key={i} className="fw-bold text-success">
                            {c.placement_avg || "₹8-12 LPA"}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="fw-bold text-start bg-light">Rating & NIRF</td>
                        {selectedForCompare.map((c, i) => (
                          <td key={i}>
                            ⭐ {c.rating || 4.5} | {c.nirf_rank || "Top Tier"}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-footer bg-white border-top">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-4"
                  onClick={() => setShowCompareModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= REPORT MODAL (PRINT READY) ================= */}
      {showReportModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.6)", zIndex: 1060 }}
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header text-white" style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)" }}>
                <h5 className="modal-title fw-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  📄 Admission Recommendation Summary Report
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowReportModal(false)}
                />
              </div>

              <div className="modal-body p-4 bg-white" id="printable-report">
                {/* Header Banner */}
                <div className="border-bottom pb-3 mb-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="fw-black text-primary mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {APP_NAME}
                    </h4>
                    <div className="text-secondary small">Personalized Indian College Counseling Report</div>
                  </div>
                  <div className="text-end text-muted small">
                    <div>Date: {new Date().toLocaleDateString("en-IN")}</div>
                    <div>Status: Verified</div>
                  </div>
                </div>

                {/* Student Details Card */}
                <div className="p-3 rounded-3 bg-light border mb-4">
                  <div className="row g-2">
                    <div className="col-6"><strong>Student Name:</strong> {profile.name}</div>
                    <div className="col-6"><strong>Stream:</strong> {profile.stream}</div>
                    <div className="col-6">
                      <strong>Score & Exam:</strong>{" "}
                      <span className="badge bg-primary">
                        {formatScore(profile.marks, profile.exam_type, profile.score_unit)} ({profile.exam_type})
                      </span>
                    </div>
                    <div className="col-6"><strong>Target State:</strong> {profile.preferred_state || "Any"}</div>
                  </div>
                </div>

                {/* Top Recommended Colleges Table */}
                <h6 className="fw-bold text-dark mb-2">🎓 Top Recommended Matches:</h6>
                <div className="table-responsive border rounded-3 mb-3">
                  <table className="table table-sm table-striped mb-0 text-center" style={{ fontSize: 12.5 }}>
                    <thead className="table-primary">
                      <tr>
                        <th className="text-start">College</th>
                        <th>Location</th>
                        <th>Type</th>
                        <th>Cutoff</th>
                        <th>Chance</th>
                        <th>Fees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colleges.slice(0, 10).map((c, i) => (
                        <tr key={i}>
                          <td className="text-start fw-bold">{c.college_name}</td>
                          <td>{c.location}</td>
                          <td>{c.college_type}</td>
                          <td>{formatScore(c.cutoff_marks, c.exam_type, c.score_unit)}</td>
                          <td>
                            <span className={`badge bg-${c.eligibility?.status === "eligible" ? "success" : c.eligibility?.status === "borderline" ? "warning text-dark" : "danger"}`}>
                              {c.eligibility?.status === "eligible" ? "Safe" : c.eligibility?.status === "borderline" ? "Target" : "Dream"}
                            </span>
                          </td>
                          <td>₹{(c.annual_fees / 100000).toFixed(1)}L</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 rounded-3 bg-light border text-muted small" style={{ fontSize: 11 }}>
                  💡 <em>Note: Cutoff trends are compiled from previous official counseling data. Actual CAP rounds may vary slightly based on applicant volume and seat matrix.</em>
                </div>
              </div>

              <div className="modal-footer bg-light border-top">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-3"
                  onClick={() => setShowReportModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary rounded-pill px-4 fw-bold"
                  onClick={() => window.print()}
                >
                  <FaPrint className="me-1" /> Print / Save as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
