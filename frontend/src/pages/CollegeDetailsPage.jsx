import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaGraduationCap, FaArrowLeft, FaMapMarkerAlt, FaStar,
  FaTrophy, FaCalendarAlt, FaBuilding, FaCheckCircle,
  FaExclamationTriangle, FaTimesCircle, FaUserGraduate,
  FaBriefcase, FaIdCard, FaListAlt, FaFilter, FaPaperPlane
} from "react-icons/fa";
import { APP_NAME } from "./LandingPage";

const API_BASE = "/api";

export default function CollegeDetailsPage({ studentProfile }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Selected college from navigation state
  const stateCollege = location.state?.college;
  const student = studentProfile || location.state?.studentProfile || { marks: 90.0, stream: "Engineering", name: "Student" };

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState("all"); // "all", "eligible", "borderline"

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchCollegeDetails = async () => {
      setLoading(true);
      const collegeName = stateCollege?.college_name || "COEP Technological University";
      const stream = stateCollege?.stream || student.stream || "Engineering";
      const marks = student.marks || 90.0;

      try {
        const res = await fetch(`${API_BASE}/college-details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            college_name: collegeName,
            stream: stream,
            student_marks: marks
          })
        });
        const data = await res.json();
        if (data.success && data.college) {
          setDetails(data.college);
        }
      } catch (err) {
        console.error("Failed to fetch college details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollegeDetails();
  }, [stateCollege, student]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary mb-3" style={{ width: 44, height: 44 }} />
        <h5 className="fw-bold text-dark">Loading Domain & Branch Cutoff Data...</h5>
        <p className="text-secondary small">Compiling performance metrics and eligibility</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light p-4 text-center">
        <h4 className="fw-bold text-dark mb-2">College Details Not Found</h4>
        <p className="text-secondary mb-3">Please return to the dashboard and choose a college.</p>
        <button className="btn btn-primary rounded-pill px-4" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const branches = details.branch_cutoffs || [];
  const eligibleBranches = branches.filter(b => b.eligibility?.status === "eligible");
  const filteredBranches = branches.filter(b => {
    if (branchFilter === "eligible") return b.eligibility?.status === "eligible";
    if (branchFilter === "borderline") return b.eligibility?.status === "borderline";
    return true;
  });

  const handleAskCounselorForBranch = (branchName) => {
    const prompt = `I am interested in ${branchName} at ${details.college_name}. Based on my ${student.marks}% score, what are my admission chances in CAP rounds, fees, and career placements?`;
    navigate("/chat", { state: { initialPrompt: prompt, selectedCollege: details.college_name } });
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: "#F5F7FA", fontFamily: "'Inter', sans-serif" }}>
      {/* Top Navbar */}
      <nav
        className="navbar px-3 px-md-4 py-2 sticky-top shadow-sm"
        style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)" }}
      >
        <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-outline-light btn-sm fw-semibold rounded-pill px-3 py-1 d-flex align-items-center gap-1"
              onClick={() => navigate("/dashboard")}
            >
              <FaArrowLeft size={11} /> Back to Dashboard
            </button>
            <span className="navbar-brand text-white fw-bold d-flex align-items-center gap-2 m-0 fs-5" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              <FaGraduationCap size={26} color="#FFB300" />
              <span style={{ fontFamily: "'Poppins', sans-serif" }}>{APP_NAME}</span>
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold shadow-sm">
              Your Score: {student.marks}% ({student.stream})
            </span>
            <button
              className="btn btn-sm btn-light fw-bold rounded-pill px-3"
              onClick={() => navigate("/chat", { state: { initialPrompt: `Tell me all about admission at ${details.college_name} for my ${student.marks}% score.` } })}
            >
              <FaUserGraduate className="me-1 text-primary" /> Ask Counselor
            </button>
          </div>
        </div>
      </nav>

      {/* Hero College Header */}
      <div className="position-relative text-white" style={{ background: "linear-gradient(135deg, #1A237E 0%, #283593 100%)" }}>
        <div className="container py-4 py-md-5">
          <div className="row align-items-center g-4">
            {/* College Image */}
            <div className="col-12 col-md-4 col-lg-3">
              <div className="rounded-4 overflow-hidden shadow-lg border border-light border-opacity-25" style={{ height: 190 }}>
                <img
                  src={details.image_url}
                  alt={details.college_name}
                  className="w-100 h-100"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>

            {/* Info details */}
            <div className="col-12 col-md-8 col-lg-9">
              <div className="d-flex flex-wrap gap-2 mb-2">
                <span className="badge bg-warning text-dark fw-bold">{details.stream}</span>
                <span className="badge bg-success">{details.college_type}</span>
                {details.dte_code && (
                  <span className="badge bg-light text-dark fw-bold">
                    <FaIdCard className="me-1 text-primary" /> DTE Code: {details.dte_code}
                  </span>
                )}
                {details.established && (
                  <span className="badge bg-light text-dark">
                    <FaCalendarAlt className="me-1" /> Est. {details.established}
                  </span>
                )}
              </div>

              <h2 className="fw-black mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {details.college_name}
              </h2>

              <p className="text-white-50 mb-3 d-flex align-items-center gap-1 small">
                <FaMapMarkerAlt className="text-warning" />
                <span>{details.location}</span>
                <span className="mx-2">•</span>
                <span>{details.accreditation}</span>
              </p>

              {/* Quick Metrics Bar */}
              <div className="d-flex flex-wrap gap-3">
                <div className="px-3 py-2 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-25">
                  <div className="text-white-50" style={{ fontSize: 11 }}>NIRF / State Ranking</div>
                  <div className="fw-bold text-warning small">{details.nirf_rank}</div>
                </div>

                <div className="px-3 py-2 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-25">
                  <div className="text-white-50" style={{ fontSize: 11 }}>Highest Placement</div>
                  <div className="fw-bold text-success small">{details.placement_performance?.highest_package || "₹40+ LPA"}</div>
                </div>

                <div className="px-3 py-2 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-25">
                  <div className="text-white-50" style={{ fontSize: 11 }}>Annual Fees</div>
                  <div className="fw-bold text-white small">₹{(details.annual_fees / 100000).toFixed(1)} Lakh/yr</div>
                </div>

                <div className="px-3 py-2 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-25">
                  <div className="text-white-50" style={{ fontSize: 11 }}>Rating</div>
                  <div className="fw-bold text-warning small">
                    <FaStar size={11} className="me-1" />{details.rating} / 5.0
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="container py-4 flex-grow-1">

        {/* Dynamic Branch Eligibility Alert */}
        <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white border-start border-4 border-success">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h6 className="fw-bold mb-1 text-dark" style={{ fontFamily: "'Poppins', sans-serif" }}>
                🎯 Domain Feasibility Analysis for Your {student.marks}% Score:
              </h6>
              <p className="text-secondary small mb-0">
                You are currently eligible for <strong className="text-success">{eligibleBranches.length} out of {branches.length} major domains/branches</strong> in this institution!
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm"
              onClick={() => handleAskCounselorForBranch("Admission Strategy")}
            >
              Ask Counselor Which Branch to Choose →
            </button>
          </div>
        </div>

        {/* 1. DOMAIN / BRANCH-WISE CUTOFF BREAKDOWN TABLE (THE KEY USER REQUIREMENT) */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
            <div>
              <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill fw-bold small mb-1">
                📊 Domain & Branch Cutoffs
              </span>
              <h4 className="fw-bold text-dark mb-0" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Branch-Wise Cutoff Breakdown & Your Eligibility
              </h4>
              <p className="text-secondary small mb-0">
                Cutoff percentiles differ by domain. Compare cutoffs across categories and check your direct eligibility.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="d-flex gap-2">
              <button
                className={`btn btn-sm rounded-pill px-3 fw-bold ${branchFilter === "all" ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setBranchFilter("all")}
              >
                All Branches ({branches.length})
              </button>
              <button
                className={`btn btn-sm rounded-pill px-3 fw-bold ${branchFilter === "eligible" ? "btn-success" : "btn-outline-success"}`}
                onClick={() => setBranchFilter("eligible")}
              >
                ✅ Eligible Branches ({eligibleBranches.length})
              </button>
              <button
                className={`btn btn-sm rounded-pill px-3 fw-bold ${branchFilter === "borderline" ? "btn-warning text-dark" : "btn-outline-warning"}`}
                onClick={() => setBranchFilter("borderline")}
              >
                ⚠️ Borderline Targets
              </button>
            </div>
          </div>

          {/* Interactive Table */}
          <div className="table-responsive border rounded-3 shadow-sm overflow-hidden">
            <table className="table table-hover table-striped mb-0 align-middle text-center">
              <thead style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)", color: "#ffffff" }}>
                <tr>
                  <th className="py-3 px-3 text-start text-white border-0">Branch / Domain</th>
                  <th className="py-3 px-2 text-white border-0">Domain Category</th>
                  <th className="py-3 px-2 text-white border-0">Intake</th>
                  <th className="py-3 px-2 text-white border-0">General Cutoff</th>
                  <th className="py-3 px-2 text-white border-0">OBC Cutoff</th>
                  <th className="py-3 px-2 text-white border-0">SC / ST Cutoff</th>
                  <th className="py-3 px-2 text-white border-0">Avg Placement</th>
                  <th className="py-3 px-3 text-white border-0">Your Eligibility ({student.marks}%)</th>
                  <th className="py-3 px-2 text-white border-0">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((b, idx) => (
                  <tr key={idx} className={b.eligibility?.status === "eligible" ? "table-success bg-opacity-25" : ""}>
                    {/* Branch Name */}
                    <td className="text-start py-3 px-3 fw-bold text-dark" style={{ minWidth: 200 }}>
                      {b.branch}
                    </td>

                    {/* Domain Category */}
                    <td className="py-3 px-2">
                      <span className="badge bg-light text-secondary border fw-normal">
                        {b.domain || "Core"}
                      </span>
                    </td>

                    {/* Intake */}
                    <td className="py-3 px-2 fw-semibold text-secondary">
                      {b.intake || 60} seats
                    </td>

                    {/* General Cutoff */}
                    <td className="py-3 px-2 fw-bold text-primary">
                      {b.cutoff_general}%
                    </td>

                    {/* OBC Cutoff */}
                    <td className="py-3 px-2 text-secondary">
                      {b.cutoff_obc}%
                    </td>

                    {/* SC/ST Cutoff */}
                    <td className="py-3 px-2 text-secondary">
                      {b.cutoff_sc_st}%
                    </td>

                    {/* Branch Placement Average */}
                    <td className="py-3 px-2 fw-bold text-success">
                      {b.placement_avg || "₹8-10 LPA"}
                    </td>

                    {/* Dynamic Student Eligibility Badge */}
                    <td className="py-3 px-3">
                      <span className={`badge bg-${b.eligibility?.color} shadow-sm px-2 py-1`}>
                        {b.eligibility?.label}
                      </span>
                      <div className="text-secondary" style={{ fontSize: 10 }}>
                        {b.diff_from_cutoff >= 0 ? `+${b.diff_from_cutoff}% above cutoff` : `${b.diff_from_cutoff}% needed`}
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-2">
                      <button
                        className="btn btn-outline-primary btn-sm rounded-pill px-2 py-1"
                        style={{ fontSize: 11 }}
                        onClick={() => handleAskCounselorForBranch(b.branch)}
                        title={`Ask counselor about ${b.branch}`}
                      >
                        Ask AI
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. IMPORTANT POINTS & PERFORMANCE WITH DIRECT VISUAL MARKINGS (USER REQUIREMENT) */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
          <div className="mb-3">
            <span className="badge bg-warning text-dark px-3 py-1 rounded-pill fw-bold small mb-1">
              ⭐ Direct Intelligence & Key Insights
            </span>
            <h4 className="fw-bold text-dark mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Key Performance & Important Points About {details.college_name}
            </h4>
            <p className="text-secondary small">
              Crucial institutional factors, placement performance, and admission rules marked for direct evaluation.
            </p>
          </div>

          <div className="row g-3">
            {details.important_points?.map((point, idx) => (
              <div key={idx} className="col-12 col-md-6">
                <div
                  className="p-3 rounded-4 border h-100 shadow-sm"
                  style={{
                    background: "#FAFAFA",
                    borderLeft: `5px solid ${point.color === "warning" ? "#FFB300" : point.color === "success" ? "#2E7D32" : point.color === "danger" ? "#D32F2F" : "#1A237E"}`
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className={`badge bg-${point.color} shadow-sm`}>
                      {point.badge}
                    </span>
                    <span className="text-secondary small">Point #{idx + 1}</span>
                  </div>
                  <h6 className="fw-bold text-dark mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {point.title}
                  </h6>
                  <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. PLACEMENT METRICS & TOP RECRUITERS */}
        {details.placement_performance && (
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <div className="row align-items-center g-4">
              <div className="col-lg-4">
                <span className="badge bg-success bg-opacity-10 text-success px-3 py-1 rounded-pill fw-bold small mb-1">
                  💼 Placement Statistics
                </span>
                <h5 className="fw-bold text-dark mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Career & Recruitment Track Record
                </h5>
                <div className="mb-2">
                  <span className="text-secondary small">Average Salary Package:</span>
                  <div className="fs-4 fw-black text-primary">{details.placement_performance.overall_average}</div>
                </div>
                <div className="mb-2">
                  <span className="text-secondary small">Highest Compensation:</span>
                  <div className="fs-4 fw-black text-success">{details.placement_performance.highest_package}</div>
                </div>
                <div>
                  <span className="text-secondary small">Placement Rate:</span>
                  <div className="fw-bold text-dark">{details.placement_performance.placement_percentage}</div>
                </div>
              </div>

              <div className="col-lg-8 border-start-lg ps-lg-4">
                <h6 className="fw-bold text-dark mb-2">Key Multinational Recruiters:</h6>
                <div className="d-flex flex-wrap gap-2">
                  {details.placement_performance.top_recruiters?.map((recruiter, i) => (
                    <span key={i} className="badge bg-light text-dark border p-2 fw-semibold shadow-sm" style={{ fontSize: 12 }}>
                      🏢 {recruiter}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. ADMISSION STEPS & CENTRALIZED PROCESS */}
        {details.admission_process && (
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <span className="badge bg-info bg-opacity-10 text-info px-3 py-1 rounded-pill fw-bold small mb-1">
              📋 Admission Roadmap
            </span>
            <h5 className="fw-bold text-dark mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
              How to Secure Admission at {details.college_name}
            </h5>
            <p className="text-secondary small mb-3">
              <strong>Entrance Exams:</strong> {details.admission_process.exams_accepted} • <strong>Authority:</strong> {details.admission_process.counseling_authority}
            </p>

            <div className="row g-2">
              {details.admission_process.steps?.map((step, idx) => (
                <div key={idx} className="col-12 col-md-6">
                  <div className="p-3 rounded-3 border bg-light d-flex align-items-start gap-2 h-100">
                    <span className="badge bg-primary rounded-circle" style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {idx + 1}
                    </span>
                    <span className="small text-dark fw-medium" style={{ lineHeight: 1.5 }}>
                      {step}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Navigation CTA */}
        <div className="text-center py-3">
          <button
            className="btn btn-warning btn-lg fw-bold rounded-pill px-5 py-3 shadow-lg me-3"
            style={{ background: "linear-gradient(135deg, #FFB300, #FF8F00)", color: "#1A237E", border: "none" }}
            onClick={() => handleAskCounselorForBranch("Strategic Admission Planning")}
          >
            <FaUserGraduate className="me-2" /> Consult AI Counselor About This College
          </button>
          <button
            className="btn btn-outline-secondary btn-lg fw-semibold rounded-pill px-4 py-3"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to All Colleges
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 bg-white border-top text-secondary small mt-auto">
        <FaGraduationCap color="#FFB300" className="me-2" />
        {APP_NAME} — Domain & Branch Cutoff Analytics System
      </footer>
    </div>
  );
}
