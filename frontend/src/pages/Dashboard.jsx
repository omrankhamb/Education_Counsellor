import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGraduationCap, FaUserGraduate, FaHeadset, FaSearch, FaFilter,
  FaCheckCircle, FaExclamationTriangle, FaTimesCircle,
  FaSyncAlt, FaBriefcase, FaUniversity, FaArrowRight,
  FaChartLine, FaHeart, FaRegHeart, FaBalanceScale,
  FaCalendarCheck, FaCalendarAlt, FaFilePdf, FaFileAlt, FaPrint, FaTimes, FaTrash,
  FaStar, FaChevronRight, FaChevronDown, FaUndo,
  FaCoins, FaBullseye, FaLightbulb, FaBuilding, FaSignOutAlt, FaListAlt
} from "react-icons/fa";
import CollegeCard from "../components/CollegeCard";
import CapSimulatorModal from "../components/CapSimulatorModal";
import ScholarshipModal from "../components/ScholarshipModal";
import DocumentVerificationModal from "../components/DocumentVerificationModal";
import { APP_NAME } from "./LandingPage";
import { formatScore, formatAnnualFees } from "../utils/scoreUtils";

const API_BASE = "/api";

export default function Dashboard({ studentProfile, onSelectCollegeForChat, currentUser, onLogout }) {
  const navigate = useNavigate();

  // Profile Fallback Defaults to prevent null errors
  const profile = {
    name: "Student",
    age: 18,
    stream: "Engineering",
    marks: 85,
    exam_type: "MHT-CET",
    score_unit: "percentile",
    preferred_state: "Maharashtra",
    budget: "Any",
    college_type: "Any",
    ...(studentProfile || {})
  };
  if (!profile.age) profile.age = 18;

  const [colleges, setColleges] = useState([]);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState(() => {
    return profile.preferred_state && profile.preferred_state !== "Any"
      ? profile.preferred_state
      : "All";
  });
  const [selectedType, setSelectedType] = useState("All");
  const [selectedEligibility, setSelectedEligibility] = useState("All");
  const [sortBy, setSortBy] = useState("recommended");
  const [filterShortlistOnly, setFilterShortlistOnly] = useState(false);

  // Keep state filter synced when student profile changes
  useEffect(() => {
    if (profile.preferred_state && profile.preferred_state !== "Any") {
      setSelectedState(profile.preferred_state);
    }
  }, [profile.preferred_state]);

  // Shortlist State (Persisted in localStorage)
  const [shortlisted, setShortlisted] = useState(() => {
    try {
      const saved = localStorage.getItem(`edu_shortlist_${profile.name}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // College Comparison State (Max 4 colleges)
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCapSimulatorModal, setShowCapSimulatorModal] = useState(false);
  const [showScholarshipModal, setShowScholarshipModal] = useState(false);
  const [showDeadlinesModal, setShowDeadlinesModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedCollegeForScholarship, setSelectedCollegeForScholarship] = useState(null);

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
        if (prev.length >= 4) {
          alert("You can compare up to 4 colleges at a time. Please deselect one first.");
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
    const adaptCollegeItem = (c) => {
      const unit = profile.score_unit || "percentile";
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
          label: status === "eligible" ? "Eligible" : status === "borderline" ? "Borderline" : "Aspirational",
          color: status === "eligible" ? "success" : status === "borderline" ? "warning" : "danger"
        }
      };
    };

    // Group multiple branch records by institution so one card represents one college
    const groupUniqueInstitutions = (list) => {
      if (!Array.isArray(list)) return [];
      const map = new Map();
      list.forEach((c) => {
        const key = (c.college_name || "").trim().toLowerCase();
        if (!key) return;
        if (!map.has(key)) {
          const rawBranches = Array.isArray(c.branches) ? [...c.branches] : (c.branch ? [{ branch: c.branch, cutoff_marks: c.cutoff_marks }] : []);
          map.set(key, {
            ...c,
            branches: rawBranches,
            branch_count: c.branch_count || (rawBranches.length > 0 ? rawBranches.length : 1),
            branch_summary: c.branch_summary || c.branch || "General Program"
          });
        } else {
          const existing = map.get(key);
          const existingBranches = existing.branches || [];
          const newBranchName = c.branch;
          if (newBranchName && !existingBranches.some((b) => (b.branch || b) === newBranchName)) {
            existingBranches.push({ branch: newBranchName, cutoff_marks: c.cutoff_marks });
            existing.branches = existingBranches;
            existing.branch_count = existingBranches.length;
            const names = existingBranches.map((b) => b.branch || b);
            existing.branch_summary = names.slice(0, 3).join(", ") + (names.length > 3 ? ` (+${names.length - 3} more)` : "");
            const isMed = (c.stream || profile.stream || "").toLowerCase() === "medical";
            existing.branch = `${existingBranches.length} ${isMed ? "Medical Programs" : "Specialized Branches"} Available`;
          }
        }
      });
      return Array.from(map.values());
    };

    const fetchRecommendations = async () => {
      setError(false);

      // STEP 1: Immediately fetch curated 20+ colleges for this exact exam & state (<30ms)
      try {
        const stateParam = profile.preferred_state && profile.preferred_state !== "Any" ? `&state=${encodeURIComponent(profile.preferred_state)}` : "";
        const fastRes = await fetch(
          `${API_BASE}/featured-colleges?stream=${encodeURIComponent(profile.stream || "Engineering")}&exam_type=${encodeURIComponent(profile.exam_type || "")}${stateParam}`
        );
        const fastData = await fastRes.json();
        if (fastData.success && fastData.colleges?.length > 0 && isMounted) {
          const adapted = fastData.colleges.map(adaptCollegeItem);
          const sanitized = sanitizeCollegesForProfile(adapted, profile);
          const unique = groupUniqueInstitutions(sanitized);
          setColleges(unique);
          setLoading(false);
        }
      } catch (fErr) {
        console.warn("Fast college load notice:", fErr);
      }

      // STEP 2: Background AI refinement
      try {
        const res = await fetch(`${API_BASE}/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student_profile: profile }),
        });
        const data = await res.json();
        if (data.success && data.colleges?.length > 0 && isMounted) {
          const sanitized = sanitizeCollegesForProfile(data.colleges, profile);
          const unique = groupUniqueInstitutions(sanitized);
          setColleges(unique);
          if (data.career_opportunities?.length > 0) {
            setCareers(data.career_opportunities);
          }
          setLoading(false);
        }
      } catch (err) {
        console.warn("Live recommendation notice:", err);
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

  // Compute available states dynamically from current college pool & profile
  const availableStates = useMemo(() => {
    const statesSet = new Set();
    if (profile.preferred_state && profile.preferred_state !== "Any") {
      statesSet.add(profile.preferred_state.trim());
    }
    colleges.forEach((c) => {
      if (c.state && typeof c.state === "string") {
        statesSet.add(c.state.trim());
      } else if (c.location && typeof c.location === "string") {
        const parts = c.location.split(",").map((p) => p.trim()).filter(Boolean);
        if (parts.length > 0) {
          statesSet.add(parts[parts.length - 1]);
        }
      }
    });
    return ["All", ...Array.from(statesSet).filter(Boolean).sort()];
  }, [colleges, profile.preferred_state]);

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

    const matchesState =
      selectedState === "All" ||
      (c.state && c.state.toLowerCase() === selectedState.toLowerCase()) ||
      (c.location && c.location.toLowerCase().includes(selectedState.toLowerCase()));

    const matchesShortlist = filterShortlistOnly
      ? shortlisted.some((s) => s.college_name === c.college_name)
      : true;

    return matchesSearch && matchesType && matchesEligibility && matchesShortlist && matchesState;
  });

  const sortedColleges = [...filteredColleges].sort((a, b) => {
    // When viewing "All" states, prioritize the student's preferred state at the top!
    if (selectedState === "All" && profile.preferred_state && profile.preferred_state !== "Any") {
      const aIsPref = (a.state || "").toLowerCase() === profile.preferred_state.toLowerCase();
      const bIsPref = (b.state || "").toLowerCase() === profile.preferred_state.toLowerCase();
      if (aIsPref && !bIsPref) return -1;
      if (!aIsPref && bIsPref) return 1;
    }
    if (sortBy === "cutoffDesc") return b.cutoff_marks - a.cutoff_marks;
    if (sortBy === "cutoffAsc") return a.cutoff_marks - b.cutoff_marks;
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "fees") return a.annual_fees - b.annual_fees;
    return 0; // default recommendation order
  });

  const eligibleCount = colleges.filter((c) => c.eligibility?.status === "eligible").length;
  const borderlineCount = colleges.filter((c) => c.eligibility?.status === "borderline").length;
  const aspirationalCount = colleges.filter((c) => c.eligibility?.status === "not_eligible").length;

  const hasActiveFilters = searchQuery !== "" || selectedState !== (profile.preferred_state && profile.preferred_state !== "Any" ? profile.preferred_state : "All") || selectedType !== "All" || selectedEligibility !== "All" || filterShortlistOnly;

  const resetAllFilters = () => {
    setSearchQuery("");
    setSelectedState(profile.preferred_state && profile.preferred_state !== "Any" ? profile.preferred_state : "All");
    setSelectedType("All");
    setSelectedEligibility("All");
    setSortBy("recommended");
    setFilterShortlistOnly(false);
  };

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
      
      {/* ================= HEADER / NAVBAR (Signature Indigo Theme: linear-gradient(135deg, #1A237E, #3949AB)) ================= */}
      <nav
        className="navbar navbar-expand-lg px-3 px-md-4 py-2 sticky-top shadow-sm"
        style={{
          background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
          zIndex: 1030
        }}
      >
        <div className="container-fluid px-0 d-flex align-items-center justify-content-between">
          
          {/* Brand Logo & Title */}
          <div
            className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold mb-0 me-3"
            style={{ cursor: "pointer", fontFamily: "'Poppins', sans-serif" }}
            onClick={() => navigate("/")}
          >
            <FaGraduationCap size={28} color="#FFB300" />
            <span className="fs-5 text-white">{APP_NAME}</span>
          </div>

          {/* Right Navigation & Action Items */}
          <div className="d-flex align-items-center gap-2 gap-md-2.5">
            
            {/* Quick Action: CAP Simulator */}
            <button
              className="btn btn-sm fw-bold px-3 py-1.5 rounded-pill shadow-sm d-none d-sm-flex align-items-center gap-1.5"
              onClick={() => navigate("/cap-simulator")}
              style={{
                background: "#FFFFFF",
                border: "1px solid #FFFFFF",
                fontSize: 12,
                color: "#1A237E"
              }}
              title="Simulate Centralized Admission Process (CAP) Rounds 1-4 Allotment & Preference Table"
            >
              <FaBullseye size={12} color="#D97706" />
              <span>CAP Simulator</span>
            </button>

            {/* Quick Action: Scholarships */}
            <button
              className="btn btn-sm fw-bold px-3 py-1.5 rounded-pill shadow-sm d-flex align-items-center gap-1.5"
              onClick={() => navigate("/scholarships")}
              style={{
                background: "#FFFFFF",
                border: "1px solid #FFFFFF",
                fontSize: 12,
                color: "#1A237E"
              }}
              title="Open 24+ Verified Buddy4Study & Government Scholarships"
            >
              <FaCoins size={12} color="#D97706" />
              <span>Scholarships</span>
            </button>

            {/* Quick Action: Live Document & FC Rules Verifier */}
            <button
              className="btn btn-sm fw-bold px-3 py-1.5 rounded-pill shadow-sm d-flex align-items-center gap-1.5"
              onClick={() => setShowDocumentModal(true)}
              style={{
                background: "#FFFFFF",
                border: "1px solid #FFFFFF",
                fontSize: 12,
                color: "#1A237E"
              }}
              title="Verify Official Government Admission Documents & Proformas"
            >
              <FaFileAlt size={12} color="#059669" />
              <span>Document Checker</span>
            </button>

            {/* Quick Action: Deadlines */}
            <button
              className="btn btn-sm fw-bold px-3 py-1.5 rounded-pill shadow-sm d-none d-lg-flex align-items-center gap-1.5"
              onClick={() => setShowDeadlinesModal(true)}
              style={{
                background: "#FFFFFF",
                border: "1px solid #FFFFFF",
                fontSize: 12,
                color: "#1A237E"
              }}
              title="View Admission Timeline & Deadlines"
            >
              <FaCalendarAlt size={12} color="#D97706" />
              <span>Deadlines</span>
            </button>

            {/* Quick Action: PDF Report */}
            <button
              className="btn btn-sm fw-bold px-3 py-1.5 rounded-pill shadow-sm d-none d-xl-flex align-items-center gap-1.5"
              onClick={() => setShowReportModal(true)}
              style={{
                background: "#FFFFFF",
                border: "1px solid #FFFFFF",
                fontSize: 12,
                color: "#1A237E"
              }}
              title="Export personalized admission PDF report"
            >
              <FaFilePdf size={12} color="#DC2626" />
              <span>Report</span>
            </button>

            {/* Student Score Capsule */}
            <div
              className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill shadow-sm"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: 11 }}>
                {profile.stream}
              </span>
              <span className="text-white small fw-medium d-none d-sm-inline" style={{ fontSize: 12 }}>
                {profile.name.split(" ")[0]}
              </span>
              <span className="text-white-50 d-none d-sm-inline">|</span>
              <span className="text-warning fw-bold small" style={{ fontSize: 12 }}>
                {formatScore(profile.marks, profile.exam_type, profile.score_unit)}
              </span>
            </div>

            {/* Primary CTA: Talk to AI Counselor */}
            <button
              className="btn btn-sm fw-bold px-3 py-1.5 rounded-pill shadow-sm d-flex align-items-center gap-1.5"
              onClick={() => navigate("/chat")}
              style={{
                background: "#FFFFFF",
                border: "1px solid #FFFFFF",
                fontSize: 12.5,
                color: "#1A237E"
              }}
            >
              <FaHeadset size={14} color="#D97706" />
              <span className="d-none d-sm-inline">Talk to Counselor</span>
              <span className="d-sm-none">Counselor</span>
            </button>

            {/* Edit Profile */}
            <button
              className="btn btn-sm rounded-pill px-2.5 py-1 fw-bold d-flex align-items-center shadow-sm"
              onClick={() => navigate("/profile")}
              style={{
                background: "#FFFFFF",
                border: "1px solid #FFFFFF",
                fontSize: 11.5,
                color: "#1A237E"
              }}
              title="Edit Profile"
            >
              <FaSyncAlt size={11} className="me-1" color="#4F46E5" />
              <span className="d-none d-md-inline">Edit</span>
            </button>

            {/* Logout */}
            {onLogout && (
              <button
                className="btn btn-sm rounded-pill px-2.5 py-1 fw-bold d-flex align-items-center shadow-sm"
                onClick={onLogout}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #FFFFFF",
                  fontSize: 11.5,
                  color: "#DC2626"
                }}
                title="Logout"
              >
                <FaSignOutAlt size={11} className="me-1" color="#DC2626" />
                <span className="d-none d-md-inline">Exit</span>
              </button>
            )}

          </div>
        </div>
      </nav>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="container-xl px-3 px-md-4 py-4 flex-grow-1" style={{ maxWidth: 1360 }}>
        
        {/* ================= SLEEK HERO GREETING & METRIC STRIP ================= */}
        <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4 bg-white">
          <div className="row align-items-center g-3">
            
            {/* Student Welcome Summary */}
            <div className="col-12 col-lg-5">
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-primary bg-opacity-10 text-primary fw-semibold px-2.5 py-1 rounded-pill" style={{ fontSize: 11 }}>
                  Verified Recommendations
                </span>
                <span className="text-muted small">• Exam: <strong>{profile.exam_type}</strong></span>
              </div>
              <h3 className="fw-black mb-1" style={{ color: "#1A237E", fontFamily: "'Poppins', sans-serif" }}>
                <FaUserGraduate className="me-2 text-primary" size={24} />
                Welcome, {profile.name}!
              </h3>
              <p className="text-secondary small mb-0">
                Targeting <strong>{profile.stream}</strong> in <strong>{profile.preferred_state || "All India"}</strong> with your verified score of <strong className="text-primary">{formatScore(profile.marks, profile.exam_type, profile.score_unit)}</strong>.
              </p>
            </div>

            {/* Interactive Stats Filters Strip (Using React Icons) */}
            <div className="col-12 col-lg-7">
              <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                
                {/* Total Matches Pill */}
                <button
                  type="button"
                  className={`btn btn-sm rounded-4 px-3 py-2 text-start border transition-all ${
                    selectedEligibility === "All" && !filterShortlistOnly
                      ? "btn-primary shadow-sm text-white"
                      : "btn-light text-secondary"
                  }`}
                  onClick={() => {
                    setSelectedEligibility("All");
                    setFilterShortlistOnly(false);
                  }}
                  style={{ minWidth: 95 }}
                >
                  <div className="d-flex align-items-center gap-1 text-uppercase fw-semibold" style={{ fontSize: 10, letterSpacing: "0.5px" }}>
                    <FaListAlt size={10} />
                    <span>All Matches</span>
                  </div>
                  <div className="fw-bold fs-6">{colleges.length}</div>
                </button>

                {/* Score at or above supplied cutoff */}
                <button
                  type="button"
                  className={`btn btn-sm rounded-4 px-3 py-2 text-start border transition-all ${
                    selectedEligibility === "eligible" && !filterShortlistOnly
                      ? "btn-success shadow-sm text-white"
                      : "bg-success bg-opacity-10 border-success border-opacity-25 text-success"
                  }`}
                  onClick={() => {
                    setSelectedEligibility(selectedEligibility === "eligible" ? "All" : "eligible");
                    setFilterShortlistOnly(false);
                  }}
                  style={{ minWidth: 105 }}
                  title="Your score meets the app's above-cutoff comparison band; this is not an admission probability"
                >
                  <div className="d-flex align-items-center gap-1 text-uppercase fw-semibold" style={{ fontSize: 10, letterSpacing: "0.5px" }}>
                    <FaCheckCircle size={10} />
                    <span>Above cutoff</span>
                  </div>
                  <div className="fw-bold fs-6">{eligibleCount}</div>
                </button>

                {/* Score near supplied cutoff */}
                <button
                  type="button"
                  className={`btn btn-sm rounded-4 px-3 py-2 text-start border transition-all ${
                    selectedEligibility === "borderline" && !filterShortlistOnly
                      ? "btn-warning shadow-sm text-dark"
                      : "bg-warning bg-opacity-10 border-warning border-opacity-25 text-dark"
                  }`}
                  onClick={() => {
                    setSelectedEligibility(selectedEligibility === "borderline" ? "All" : "borderline");
                    setFilterShortlistOnly(false);
                  }}
                  style={{ minWidth: 110 }}
                  title="Colleges within the project's cutoff comparison band; this is not an admission probability"
                >
                  <div className="d-flex align-items-center gap-1 text-uppercase fw-semibold" style={{ fontSize: 10, letterSpacing: "0.5px" }}>
                    <FaExclamationTriangle size={10} />
                    <span>Near cutoff</span>
                  </div>
                  <div className="fw-bold fs-6">{borderlineCount}</div>
                </button>

                {/* Score below supplied cutoff */}
                <button
                  type="button"
                  className={`btn btn-sm rounded-4 px-3 py-2 text-start border transition-all ${
                    selectedEligibility === "not_eligible" && !filterShortlistOnly
                      ? "btn-danger shadow-sm text-white"
                      : "bg-danger bg-opacity-10 border-danger border-opacity-25 text-danger"
                  }`}
                  onClick={() => {
                    setSelectedEligibility(selectedEligibility === "not_eligible" ? "All" : "not_eligible");
                    setFilterShortlistOnly(false);
                  }}
                  style={{ minWidth: 100 }}
                  title="Your score is below the app's cutoff comparison band; this is not an admission probability"
                >
                  <div className="d-flex align-items-center gap-1 text-uppercase fw-semibold" style={{ fontSize: 10, letterSpacing: "0.5px" }}>
                    <FaTimesCircle size={10} />
                    <span>Below cutoff</span>
                  </div>
                  <div className="fw-bold fs-6">{aspirationalCount}</div>
                </button>

                {/* Shortlisted Pill */}
                <button
                  type="button"
                  className={`btn btn-sm rounded-4 px-3 py-2 text-start border transition-all ${
                    filterShortlistOnly
                      ? "btn-danger shadow-sm text-white"
                      : "bg-danger bg-opacity-10 border-danger border-opacity-25 text-danger"
                  }`}
                  onClick={() => setFilterShortlistOnly(!filterShortlistOnly)}
                  style={{ minWidth: 95 }}
                >
                  <div className="d-flex align-items-center gap-1 text-uppercase fw-semibold" style={{ fontSize: 10, letterSpacing: "0.5px" }}>
                    <FaHeart size={10} />
                    <span>Shortlist</span>
                  </div>
                  <div className="fw-bold fs-6">{shortlisted.length}</div>
                </button>

              </div>
            </div>

          </div>
        </div>

        {/* ================= THREE FEATURE QUICK-CARDS (Signature Indigo & Gold Accents) ================= */}
        <div className="row g-3 mb-4">
          
          {/* Card 1: CAP Simulator */}
          <div className="col-12 col-md-4">
            <div
              className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 position-relative overflow-hidden"
              style={{
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                borderLeft: "4px solid #FFB300"
              }}
              onClick={() => navigate("/cap-simulator")}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 179, 0, 0.18)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span
                  className="rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5 fw-bold"
                  style={{
                    background: "#FEF3C7",
                    color: "#92400E",
                    border: "1px solid #FCD34D",
                    fontSize: 11
                  }}
                >
                  <FaBullseye size={12} color="#D97706" /> Round 1–3 Simulation
                </span>
                <span className="text-primary fw-bold small d-inline-flex align-items-center gap-1">
                  Launch <FaArrowRight size={10} />
                </span>
              </div>
              <h6 className="fw-bold mb-1" style={{ color: "#1A237E", fontFamily: "'Poppins', sans-serif" }}>
                CAP Admission Simulator
              </h6>
              <p className="text-muted small mb-0" style={{ fontSize: 12 }}>
                Simulate centralized round seat allotment, test cutoff variances, and generate an optimal option filling list.
              </p>
            </div>
          </div>

          {/* Card 2: Scholarship & Fee Waivers */}
          <div className="col-12 col-md-4">
            <div
              className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 position-relative overflow-hidden"
              style={{
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                borderLeft: "4px solid #10B981"
              }}
              onClick={() => {
                navigate("/scholarships");
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(16, 185, 129, 0.18)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span
                  className="rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5 fw-bold"
                  style={{
                    background: "#D1FAE5",
                    color: "#065F46",
                    border: "1px solid #6EE7B7",
                    fontSize: 11
                  }}
                >
                  <FaCoins size={12} color="#059669" /> MahaDBT & TFWS
                </span>
                <span className="text-success fw-bold small d-inline-flex align-items-center gap-1">
                  Calculate <FaArrowRight size={10} />
                </span>
              </div>
              <h6 className="fw-bold mb-1" style={{ color: "#1A237E", fontFamily: "'Poppins', sans-serif" }}>
                Scholarships & Fee Concessions
              </h6>
              <p className="text-muted small mb-0" style={{ fontSize: 12 }}>
                Calculate 50% to 100% tuition fee waivers for EBC, TFWS, SC/ST, and minority government schemes.
              </p>
            </div>
          </div>

          {/* Card 3: Admission Deadlines & PDF Report */}
          <div className="col-12 col-md-4">
            <div
              className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 position-relative overflow-hidden"
              style={{
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                borderLeft: "4px solid #3949AB"
              }}
              onClick={() => setShowReportModal(true)}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(57, 73, 171, 0.18)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span
                  className="rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1.5 fw-bold"
                  style={{
                    background: "#EEF2FF",
                    color: "#3730A3",
                    border: "1px solid #C7D2FE",
                    fontSize: 11
                  }}
                >
                  <FaFilePdf size={12} color="#DC2626" /> Verified PDF Roadmap
                </span>
                <span className="text-primary fw-bold small d-inline-flex align-items-center gap-1">
                  Export PDF <FaArrowRight size={10} />
                </span>
              </div>
              <h6 className="fw-bold mb-1" style={{ color: "#1A237E", fontFamily: "'Poppins', sans-serif" }}>
                Personalized Admission Report
              </h6>
              <p className="text-muted small mb-0" style={{ fontSize: 12 }}>
                Download or print your verified college roadmap with cutoffs, tuition fees, and admission milestones.
              </p>
            </div>
          </div>

        </div>

        {/* ================= UNIFIED SEARCH & FILTER TOOLBAR ================= */}
        <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
          <div className="row g-2 align-items-center">
            
            {/* Search Input */}
            <div className="col-12 col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted ps-3">
                  <FaSearch size={13} />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0 py-2"
                  placeholder="Search college, city, or branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontSize: 13 }}
                />
                {searchQuery && (
                  <button
                    className="btn btn-light border border-start-0 text-muted"
                    onClick={() => setSearchQuery("")}
                    type="button"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Filter by State */}
            <div className="col-6 col-md-2">
              <select
                className="form-select bg-light border-0 py-2 fw-medium"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                style={{ fontSize: 13 }}
                title="Filter by State"
              >
                <option value="All">All States {availableStates.length > 1 ? `(${availableStates.length - 1})` : ""}</option>
                {availableStates.filter((s) => s !== "All").map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Type */}
            <div className="col-6 col-md-2">
              <select
                className="form-select bg-light border-0 py-2 fw-medium"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                style={{ fontSize: 13 }}
                title="Filter by College Type"
              >
                <option value="All">All Types</option>
                <option value="Government">Government Only</option>
                <option value="Private">Private Only</option>
              </select>
            </div>

            {/* Filter by Eligibility */}
            <div className="col-6 col-md-2">
              <select
                className="form-select bg-light border-0 py-2 fw-medium"
                value={selectedEligibility}
                onChange={(e) => {
                  setSelectedEligibility(e.target.value);
                  setFilterShortlistOnly(false);
                }}
                style={{ fontSize: 13 }}
                title="Filter by score comparison with the supplied cutoff"
              >
                <option value="All">All cutoff comparisons</option>
                <option value="eligible">Above cutoff</option>
                <option value="borderline">Near cutoff</option>
                <option value="not_eligible">Below cutoff</option>
              </select>
            </div>

            {/* Sort by */}
            <div className="col-6 col-md-2">
              <select
                className="form-select bg-light border-0 py-2 fw-medium"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ fontSize: 13 }}
                title="Sort Colleges"
              >
                <option value="recommended">Sort: Best Match</option>
                <option value="rating">Top Rated (NIRF/Score)</option>
                <option value="fees">Fees: Low to High</option>
                <option value="cutoffDesc">Cutoff: High to Low</option>
                <option value="cutoffAsc">Cutoff: Low to High</option>
              </select>
            </div>

          </div>

          {/* Active Filter Tags & Reset */}
          {hasActiveFilters && (
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-3 mt-2 border-top">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="text-muted small fw-semibold">Active filters:</span>
                {searchQuery && (
                  <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 small">
                    Query: "{searchQuery}"
                  </span>
                )}
                {selectedState !== "All" && (
                  <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 small">
                    State: {selectedState}
                  </span>
                )}
                {selectedType !== "All" && (
                  <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 small">
                    Type: {selectedType}
                  </span>
                )}
                {selectedEligibility !== "All" && (
                  <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 small">
                    Cutoff comparison: {selectedEligibility}
                  </span>
                )}
                {filterShortlistOnly && (
                  <span className="badge bg-danger text-white rounded-pill px-2.5 py-1 small d-inline-flex align-items-center gap-1">
                    <FaHeart size={10} /> Shortlisted ({shortlisted.length})
                  </span>
                )}
              </div>
              <button
                className="btn btn-sm btn-link text-danger p-0 text-decoration-none fw-semibold d-flex align-items-center gap-1"
                onClick={resetAllFilters}
                style={{ fontSize: 12.5 }}
              >
                <FaUndo size={11} /> Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Shortlist Alert Banner */}
        {filterShortlistOnly && (
          <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-25 py-2.5 px-3 rounded-4 d-flex align-items-center justify-content-between mb-4 shadow-xs">
            <div className="d-flex align-items-center gap-2 text-danger small">
              <FaHeart />
              <span>
                Showing only your <strong>{shortlisted.length}</strong> shortlisted colleges.
              </span>
            </div>
            <button
              className="btn btn-sm btn-danger rounded-pill fw-bold py-1 px-3 shadow-sm"
              style={{ fontSize: 12 }}
              onClick={() => setFilterShortlistOnly(false)}
            >
              Show All Colleges
            </button>
          </div>
        )}

        {/* ================= COLLEGE RECOMMENDATION CARDS (Clean 3-column layout) ================= */}
        
        {/* Loading State */}
        {loading && (
          <div className="text-center py-5 card border-0 shadow-sm rounded-4 bg-white p-5">
            <div className="spinner-border text-primary mb-3" style={{ width: 44, height: 44 }} />
            <h5 className="fw-bold mb-1" style={{ color: "#1A237E", fontFamily: "'Poppins', sans-serif" }}>
              Evaluating Best Colleges for Your Profile...
            </h5>
            <p className="text-secondary small mb-0">Analyzing cutoff percentiles, seat matrix trends, and fee structures</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedColleges.length === 0 && (
          <div className="text-center py-5 card border-0 shadow-sm rounded-4 p-5 bg-white">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light mb-3 mx-auto"
              style={{ width: 72, height: 72 }}
            >
              <FaUniversity size={32} className="text-secondary opacity-50" />
            </div>
            <h5 className="fw-bold mb-1" style={{ color: "#1A237E", fontFamily: "'Poppins', sans-serif" }}>
              No colleges match your current filters
            </h5>
            <p className="text-secondary small mb-4" style={{ maxWidth: 440, margin: "0 auto" }}>
              Try broadening your state, college type, or cutoff comparison filters to see more options.
            </p>
            <div>
              <button
                className="btn btn-primary rounded-pill px-4 py-2 fw-semibold shadow-sm"
                onClick={resetAllFilters}
                style={{ fontSize: 13, background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)", border: "none" }}
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}

        {/* Colleges Grid */}
        {!loading && sortedColleges.length > 0 && (
          <div className="row g-4">
            {sortedColleges.map((college, idx) => {
              const isShortlisted = shortlisted.some((s) => s.college_name === college.college_name);
              const isSelectedForCompare = selectedForCompare.some((c) => c.college_name === college.college_name);
              return (
                <div key={idx} className="col-12 col-md-6 col-lg-4">
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

        {/* ================= CAREER TRAJECTORIES BANNER ================= */}
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
                className="btn btn-primary btn-sm rounded-pill fw-semibold px-3 py-1.5 shadow-sm"
                style={{ fontSize: 12.5 }}
                onClick={() => navigate("/chat", { state: { initialPrompt: `What are the average salary packages and career growth for ${profile.stream} graduates in India?` } })}
              >
                Explore Salaries with AI →
              </button>
            </div>
            <div className="row g-2">
              {careers.map((career, i) => (
                <div key={i} className="col-12 col-sm-6 col-lg-3">
                  <div className="p-3 rounded-3 border bg-light d-flex align-items-center gap-2">
                    <FaCheckCircle className="text-primary flex-shrink-0" size={13} />
                    <span className="fw-semibold text-dark small">{career}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ================= FLOATING COMPARISON DOCK (Signature Indigo & Gold Accents) ================= */}
      {selectedForCompare.length > 0 && (
        <div
          className="position-fixed bottom-0 start-50 translate-middle-x mb-4 shadow-lg rounded-pill p-2 px-3 d-flex align-items-center gap-3"
          style={{
            background: "linear-gradient(135deg, #1A237E 0%, #283593 100%)",
            border: "1.5px solid #FFB300",
            zIndex: 1040,
            maxWidth: "92vw",
            color: "#FFFFFF",
            boxShadow: "0 12px 36px rgba(26, 35, 126, 0.4)"
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <FaBalanceScale className="text-warning" size={16} />
            <span className="fw-bold small" style={{ fontSize: 13 }}>
              Compare ({selectedForCompare.length}/4)
            </span>
          </div>

          <div className="vr bg-white opacity-25" style={{ height: 20 }} />

          {/* Selected College Chips */}
          <div className="d-none d-md-flex align-items-center gap-1.5 overflow-hidden" style={{ maxWidth: 420 }}>
            {selectedForCompare.map((c, i) => (
              <span
                key={i}
                className="badge bg-white bg-opacity-15 text-white fw-normal rounded-pill px-2.5 py-1 small text-truncate d-flex align-items-center gap-1"
                style={{ maxWidth: 140, fontSize: 11 }}
              >
                <span className="text-truncate">{c.college_name.split(" ")[0]}</span>
                <FaTimes
                  size={10}
                  className="cursor-pointer text-white-50"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleCompare(c)}
                />
              </span>
            ))}
          </div>

          <div className="d-flex align-items-center gap-2 ms-auto">
            <button
              className="btn btn-sm btn-link text-white-50 text-decoration-none p-0 fw-semibold"
              style={{ fontSize: 12 }}
              onClick={() => setSelectedForCompare([])}
            >
              Clear
            </button>
            <button
              className="btn btn-sm fw-bold rounded-pill px-3 py-1.5 shadow-sm d-flex align-items-center gap-1 text-dark"
              style={{
                background: "linear-gradient(135deg, #FFD54F 0%, #FFB300 100%)",
                border: "none",
                fontSize: 12.5,
                color: "#1A237E"
              }}
              disabled={selectedForCompare.length < 2}
              onClick={() => setShowCompareModal(true)}
            >
              <span>Compare Side-by-Side</span>
              <FaChevronRight size={10} />
            </button>
          </div>
        </div>
      )}

      {/* ================= FLOATING AI COUNSELOR CHAT BUTTON ================= */}
      <div className="position-fixed bottom-0 end-0 p-3 p-md-4" style={{ zIndex: 1030 }}>
        <button
          className="btn btn-lg fw-bold rounded-pill shadow-lg d-flex align-items-center gap-2 px-3.5 py-2.5 text-white"
          style={{
            background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
            border: "2px solid #FFB300",
            boxShadow: "0 8px 30px rgba(26,35,126,0.35)",
            fontSize: 14
          }}
          onClick={() => navigate("/chat")}
          title="Open AI Counselor Chat"
        >
          <FaHeadset size={18} color="#FFB300" />
          <span className="d-none d-sm-inline">Talk to Counselor</span>
        </button>
      </div>

      {/* ================= DEADLINES MODAL ================= */}
      {showDeadlinesModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.6)", zIndex: 1060 }}
          onClick={() => setShowDeadlinesModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header text-white" style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)" }}>
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  <FaCalendarAlt className="text-warning" /> Admission Schedule & Deadlines ({profile.stream})
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowDeadlinesModal(false)}
                />
              </div>

              <div className="modal-body p-4 bg-white">
                <p className="text-muted small mb-3">
                  Key counseling milestones for <strong>{profile.stream}</strong> admissions based on official authority schedules:
                </p>
                <div className="d-flex flex-column gap-3">
                  {getStreamDeadlines().map((item, idx) => (
                    <div key={idx} className="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                      <div>
                        <div className="fw-bold text-dark" style={{ fontSize: 13.5 }}>{item.title}</div>
                        <div className="text-muted small d-flex align-items-center gap-1 mt-0.5">
                          <FaCalendarAlt size={11} className="text-primary" /> {item.date}
                        </div>
                      </div>
                      <span className={`badge bg-${item.color} px-2.5 py-1.5`} style={{ fontSize: 11 }}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-3 bg-warning bg-opacity-10 border border-warning text-dark small d-flex align-items-start gap-2" style={{ fontSize: 11.5 }}>
                  <FaLightbulb className="text-warning flex-shrink-0 mt-0.5" size={13} />
                  <div>
                    <strong>Important:</strong> Keep all mandatory certificates (Scorecard, Domicile, Caste/Validity/NCL, Income Certificate) ready before verification begins.
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light border-top">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-4"
                  onClick={() => setShowDeadlinesModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <thead style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)", color: "#fff" }}>
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
                        <td className="fw-bold text-start bg-light">Cutoff comparison</td>
                        {selectedForCompare.map((c, i) => (
                          <td key={i}>
                            <span className={`badge bg-${c.eligibility?.status === "eligible" ? "success" : c.eligibility?.status === "borderline" ? "warning text-dark" : "danger"}`}>
                              {c.eligibility?.status === "eligible" ? "Above cutoff" : c.eligibility?.status === "borderline" ? "Near cutoff" : "Below cutoff"}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="fw-bold text-start bg-light">Annual Tuition Fees</td>
                        {selectedForCompare.map((c, i) => (
                          <td key={i} className="fw-bold text-dark">
                            {formatAnnualFees(c.annual_fees)}
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
                            <FaStar size={11} className="text-warning me-1" />
                            {c.rating || 4.5} | {c.nirf_rank || "Top Tier"}
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
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  <FaFilePdf className="text-warning" /> Admission Recommendation Summary Report
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
                    <h4 className="fw-black text-primary mb-1 d-flex align-items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      <FaGraduationCap color="#FFB300" size={24} />
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
                <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-1.5">
                  <FaGraduationCap className="text-primary" /> Top Recommended Matches:
                </h6>
                <div className="table-responsive border rounded-3 mb-3">
                  <table className="table table-sm table-striped mb-0 text-center" style={{ fontSize: 12.5 }}>
                    <thead className="table-primary">
                      <tr>
                        <th className="text-start">College</th>
                        <th>Location</th>
                        <th>Type</th>
                        <th>Cutoff</th>
                        <th>Cutoff comparison</th>
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
                              {c.eligibility?.status === "eligible" ? "Above cutoff" : c.eligibility?.status === "borderline" ? "Near cutoff" : "Below cutoff"}
                            </span>
                          </td>
                          <td>{formatAnnualFees(c.annual_fees)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 rounded-3 bg-light border text-muted small d-flex align-items-start gap-2" style={{ fontSize: 11 }}>
                  <FaLightbulb size={13} className="text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <em>Note: Cutoff trends are compiled from previous official counseling data. Actual CAP rounds may vary slightly based on applicant volume and seat matrix.</em>
                  </div>
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
                  style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)", border: "none" }}
                  onClick={() => window.print()}
                >
                  <FaPrint className="me-1" /> Print / Save as PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CAP ROUND SIMULATOR MODAL ================= */}
      <CapSimulatorModal
        isOpen={showCapSimulatorModal}
        onClose={() => setShowCapSimulatorModal(false)}
        studentProfile={profile}
        shortlistedColleges={shortlisted}
        allColleges={colleges}
      />

      {/* ================= SCHOLARSHIP & FEE WAIVER CALCULATOR MODAL ================= */}
      <ScholarshipModal
        isOpen={showScholarshipModal}
        onClose={() => setShowScholarshipModal(false)}
        defaultFees={selectedCollegeForScholarship?.annual_fees || 140000}
        collegeName={selectedCollegeForScholarship?.college_name || ""}
        defaultState={profile.preferred_state || "Maharashtra"}
        studentProfile={profile}
      />

      {/* ================= LIVE DOCUMENT & FC RULES VERIFICATION MODAL ================= */}
      <DocumentVerificationModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        studentProfile={profile}
      />

      {/* ================= FOOTER ================= */}
      <footer className="text-center py-4 bg-white border-top text-secondary small mt-auto">
        <div className="container d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <FaGraduationCap color="#FFB300" size={18} />
            <span className="fw-semibold text-dark">{APP_NAME}</span>
            <span className="text-muted">• AI-Powered Admission Guidance Platform</span>
          </div>
          <div className="text-muted" style={{ fontSize: 11.5 }}>
            Verified counseling data & cutoff analytics for Maharashtra & All-India admissions
          </div>
        </div>
      </footer>

    </div>
  );
}
