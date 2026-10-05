import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt, FaStar, FaUserGraduate, FaTrophy,
  FaCalendarAlt, FaCheckCircle, FaExclamationTriangle,
  FaTimesCircle, FaInfoCircle, FaHeart, FaRegHeart, FaBalanceScale
} from "react-icons/fa";
import { formatScore } from "../utils/scoreUtils";

export function EligibilityBadge({ status }) {
  if (status === "eligible")
    return <span className="badge bg-success shadow-sm px-2 py-1"><FaCheckCircle className="me-1" />Eligible</span>;
  if (status === "borderline")
    return <span className="badge bg-warning text-dark shadow-sm px-2 py-1"><FaExclamationTriangle className="me-1" />Borderline</span>;
  if (status === "Featured")
    return <span className="badge bg-primary shadow-sm px-2 py-1"><FaStar className="me-1" />Featured</span>;
  return <span className="badge bg-danger shadow-sm px-2 py-1"><FaTimesCircle className="me-1" />Aspirational</span>;
}

export default function CollegeCard({
  college,
  onAskAI,
  isCompact = false,
  isShortlisted = false,
  onToggleShortlist = null,
  isSelectedForCompare = false,
  onToggleCompare = null
}) {
  const navigate = useNavigate();

  if (!college) return null;

  const feesInLakh = college.annual_fees
    ? (college.annual_fees / 100000).toFixed(1)
    : "1.2";

  const examType = college.exam_type || "12th %";
  const scoreUnit = college.score_unit;
  const cutoffDisplay = formatScore(college.cutoff_marks, examType, scoreUnit);
  const studentScoreDisplay = formatScore(college.student_marks, examType, scoreUnit);
  const scoreLabel = scoreUnit === "rank" ? "Your Rank" : "Your Score";

  const handleOpenDetails = () => {
    navigate("/college-details", { state: { college } });
  };

  return (
    <div
      className="card border-0 shadow-sm h-100 position-relative"
      style={{
        borderRadius: 18,
        overflow: "hidden",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        background: "#ffffff"
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 28px rgba(26,35,126,0.14)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)";
      }}
    >
      {/* College Image Banner */}
      <div
        className="position-relative"
        style={{ height: isCompact ? 140 : 175, overflow: "hidden", cursor: "pointer" }}
        onClick={handleOpenDetails}
        title="Click to view domain cutoffs & details"
      >
        <img
          src={college.image_url || "https://images.unsplash.com/photo-1562774053-701939374585?w=700&auto=format&fit=crop&q=80"}
          alt={college.college_name}
          className="w-100 h-100"
          style={{ objectFit: "cover" }}
          loading="lazy"
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1562774053-701939374585?w=700&auto=format&fit=crop&q=80";
          }}
        />
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(26,35,126,0.7) 100%)" }}
        />

        {/* Badges on Image */}
        <div className="position-absolute top-0 start-0 p-2 d-flex gap-1 flex-wrap">
          <span className="badge bg-light text-dark fw-bold shadow-sm" style={{ fontSize: 11 }}>
            {college.stream}
          </span>
          <span className={`badge ${college.college_type === "Government" ? "bg-success" : "bg-warning text-dark"} shadow-sm`} style={{ fontSize: 11 }}>
            {college.college_type === "Government" ? "🏛️ Govt" : "🏢 Private"}
          </span>
        </div>

        <div className="position-absolute top-0 end-0 p-2 d-flex align-items-center gap-1">
          <EligibilityBadge status={college.eligibility?.status || "eligible"} />
          {onToggleShortlist && (
            <button
              type="button"
              className="btn btn-sm p-1 rounded-circle d-flex align-items-center justify-content-center shadow-sm"
              style={{
                width: 28,
                height: 28,
                background: isShortlisted ? "#EF4444" : "rgba(255,255,255,0.9)",
                color: isShortlisted ? "#FFFFFF" : "#475569",
                border: "none",
              }}
              title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleShortlist(college);
              }}
            >
              {isShortlisted ? <FaHeart size={13} /> : <FaRegHeart size={13} />}
            </button>
          )}
        </div>

        {/* Location over Image */}
        <div className="position-absolute bottom-0 start-0 p-2 text-white d-flex align-items-center gap-1 small">
          <FaMapMarkerAlt className="text-warning" size={12} />
          <span className="fw-semibold text-truncate" style={{ maxWidth: 260 }}>{college.location}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body p-3 d-flex flex-column">
        {/* College Name - Clickable to open full details */}
        <h6
          className="fw-bold mb-1"
          style={{
            color: "#1A237E",
            fontSize: 15,
            fontFamily: "'Poppins', sans-serif",
            minHeight: 38,
            cursor: "pointer"
          }}
          onClick={handleOpenDetails}
          title="Click to view branch cutoffs"
        >
          {college.college_name}
        </h6>

        {/* Branch / Course */}
        <p className="text-secondary small mb-2 text-truncate" title={college.branch}>
          <strong>Branch:</strong> {college.branch || "General Program"}
        </p>

        {/* 3 Stats Boxes: Cutoff | Score | Rating */}
        <div className="row g-2 text-center mb-3">
          <div className="col-4">
            <div className="p-1 rounded border" style={{ background: "#EEF2FF" }}>
              <div className="fw-bold text-primary small text-truncate" title={cutoffDisplay}>{cutoffDisplay}</div>
              <div className="text-secondary" style={{ fontSize: 10 }}>Cutoff</div>
            </div>
          </div>
          <div className="col-4">
            <div className="p-1 rounded border" style={{ background: "#F0FFF4" }}>
              <div className="fw-bold text-success small text-truncate" title={studentScoreDisplay}>{studentScoreDisplay}</div>
              <div className="text-secondary" style={{ fontSize: 10 }}>{scoreLabel}</div>
            </div>
          </div>
          <div className="col-4">
            <div className="p-1 rounded border" style={{ background: "#FFFBEB" }}>
              <div className="fw-bold text-warning small">
                <FaStar size={10} className="me-1" />{college.rating || 4.5}
              </div>
              <div className="text-secondary" style={{ fontSize: 10 }}>Rating</div>
            </div>
          </div>
        </div>

        {/* Rich Metrics: Placement & Fees */}
        <div className="p-2 rounded mb-2" style={{ background: "#F8F9FA", fontSize: 12 }}>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-secondary">
              <FaTrophy className="me-1 text-warning" size={11} />
              {college.nirf_rank || "Top Ranked"}
            </span>
            <span className="fw-bold text-dark">
              ₹{feesInLakh} Lakh/yr
            </span>
          </div>
          <div className="d-flex justify-content-between text-secondary" style={{ fontSize: 11 }}>
            <span>Avg: <strong>{college.placement_avg || "₹8-12 LPA"}</strong></span>
            {college.established && (
              <span><FaCalendarAlt size={10} className="me-1" />Est. {college.established}</span>
            )}
          </div>
        </div>

        {/* Facilities Tags */}
        {college.facilities && college.facilities.length > 0 && (
          <div className="d-flex flex-wrap gap-1 mb-2">
            {college.facilities.slice(0, 3).map((f, i) => (
              <span key={i} className="badge bg-light text-secondary border fw-normal" style={{ fontSize: 10 }}>
                ✓ {f}
              </span>
            ))}
          </div>
        )}

        {/* Why Recommended AI Insight */}
        {college.why_recommended && (
          <div
            className="small p-2 rounded mb-3 mt-auto"
            style={{ background: "#FFF8E1", borderLeft: "3px solid #FFB300", fontSize: 11.5, color: "#6D4C41" }}
          >
            💡 <strong>Why:</strong> {college.why_recommended}
          </div>
        )}

        {/* Quick Compare Checkbox Bar */}
        {onToggleCompare && (
          <div
            className="d-flex align-items-center justify-content-between px-2 py-1 rounded mb-2 border"
            style={{
              fontSize: 11.5,
              cursor: "pointer",
              background: isSelectedForCompare ? "#EEF2FF" : "#F8FAFC",
              borderColor: isSelectedForCompare ? "#6366F1" : "#E2E8F0",
              transition: "all 0.15s ease",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(college);
            }}
          >
            <span className="fw-semibold text-secondary d-flex align-items-center gap-1" style={{ fontSize: 11 }}>
              <FaBalanceScale className={isSelectedForCompare ? "text-primary" : "text-muted"} />
              {isSelectedForCompare ? "Selected to Compare" : "Compare"}
            </span>
            <input
              type="checkbox"
              className="form-check-input m-0"
              checked={!!isSelectedForCompare}
              onChange={() => {}}
              style={{ cursor: "pointer", width: 14, height: 14 }}
            />
          </div>
        )}

        {/* Action Buttons: More Info (Requested by user) + Ask Counselor */}
        <div className="d-flex gap-2 mt-auto">
          <button
            className="btn btn-sm btn-outline-primary fw-bold shadow-sm flex-fill d-flex align-items-center justify-content-center gap-1"
            style={{ borderRadius: 10, padding: "8px 10px", fontSize: 12 }}
            onClick={handleOpenDetails}
          >
            <FaInfoCircle size={13} />
            <span>More Info</span>
          </button>

          <button
            className="btn btn-sm fw-bold shadow-sm flex-fill d-flex align-items-center justify-content-center gap-1"
            style={{
              background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
              color: "#ffffff",
              borderRadius: 10,
              padding: "8px 10px",
              fontSize: 12
            }}
            onClick={() => onAskAI && onAskAI(college)}
          >
            <FaUserGraduate size={12} className="text-warning" />
            <span>Ask Counselor</span>
          </button>
        </div>
      </div>
    </div>
  );
}
