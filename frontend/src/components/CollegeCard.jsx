import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt, FaStar, FaUserGraduate, FaTrophy,
  FaCalendarAlt, FaCheckCircle, FaExclamationTriangle,
  FaTimesCircle, FaInfoCircle, FaHeart, FaRegHeart, FaBalanceScale,
  FaUniversity, FaBuilding, FaGraduationCap, FaComments
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
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!college) return null;

  const feesInLakh = college.annual_fees
    ? (college.annual_fees / 100000).toFixed(1)
    : "1.2";

  const examType = college.exam_type || "12th %";
  const scoreUnit = college.score_unit;
  const cutoffDisplay = formatScore(college.cutoff_marks, examType, scoreUnit);
  const studentScoreDisplay = formatScore(college.student_marks, examType, scoreUnit);
  const scoreLabel = scoreUnit === "rank" ? "Your Rank" : "Your Score";

  const isGovernment = Boolean(
    /govt|government|national|state|aided|unitary/i.test(college.college_type || "") ||
    /coep|vjti|vnit|iit|nit|iiit|gce|gcoe|afmc|kem|gmc|aiims/i.test(college.college_name || "")
  );

  const handleOpenDetails = () => {
    navigate("/college-details", { state: { college } });
  };

  const handleOpenFeedbacks = (e) => {
    e.stopPropagation();
    navigate("/college-details", { state: { college, focusSection: "feedbacks" } });
  };

  const status = college.eligibility?.status;
  const leftBorderColor = status === "eligible" ? "#10B981" : "#1A237E";

  return (
    <div
      ref={cardRef}
      className="card h-100 position-relative"
      style={{
        borderRadius: 18,
        overflow: "hidden",
        background: "#ffffff",
        border: "1px solid rgba(26, 35, 126, 0.12)",
        borderLeft: `4px solid ${leftBorderColor}`,
        boxShadow: "rgba(0, 0, 0, 0.06) 0px 4px 16px",
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.48s ease, transform 0.48s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease, border-color 0.25s ease",
        willChange: "opacity, transform",
      }}
      onMouseOver={(e) => {
        if (isVisible) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 14px 28px rgba(26, 35, 126, 0.16), rgba(0, 0, 0, 0.06) 0px 4px 16px";
          e.currentTarget.style.borderTopColor = "rgba(26, 35, 126, 0.38)";
          e.currentTarget.style.borderRightColor = "rgba(26, 35, 126, 0.38)";
          e.currentTarget.style.borderBottomColor = "rgba(26, 35, 126, 0.38)";
          e.currentTarget.style.borderLeft = `4px solid ${leftBorderColor}`;
        }
      }}
      onMouseOut={(e) => {
        if (isVisible) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "rgba(0, 0, 0, 0.06) 0px 4px 16px";
          e.currentTarget.style.border = "1px solid rgba(26, 35, 126, 0.12)";
          e.currentTarget.style.borderLeft = `4px solid ${leftBorderColor}`;
        }
      }}
    >
      {/* College Image Banner */}
      <div
        className="position-relative"
        style={{ height: isCompact ? 160 : 198, overflow: "hidden", cursor: "pointer" }}
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
          <span className={`badge ${isGovernment ? "bg-success" : "bg-warning text-dark"} shadow-sm d-inline-flex align-items-center gap-1`} style={{ fontSize: 11 }}>
            {isGovernment ? <><FaUniversity size={10} /> Govt</> : <><FaBuilding size={10} /> Private</>}
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

        {/* Academic Offerings / Specializations */}
        <div className="mb-2">
          {(() => {
            const isMed = (college.stream || "").toLowerCase() === "medical" ||
                          (college.exam_type || "").toLowerCase().includes("neet") ||
                          /aiims|gmc|medical|hospital|afmc|kem|bjmc|grant/i.test(college.college_name || "");
            const progTag = isMed ? "Medical Programs" : "Branches";

            return college.branch_count && college.branch_count > 1 ? (
              <div>
                <div className="d-flex align-items-center gap-1 mb-1">
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-semibold px-2 py-1 d-inline-flex align-items-center gap-1" style={{ fontSize: 11 }}>
                    <FaGraduationCap size={12} /> {college.branch_count} {progTag} Available
                  </span>
                </div>
                <p className="text-secondary small mb-0 text-truncate" title={college.branch_summary || college.branch} style={{ fontSize: 11.5 }}>
                  <strong className="text-dark">{progTag}:</strong> {college.branch_summary || college.branch}
                </p>
              </div>
            ) : (
              <p className="text-secondary small mb-0 text-truncate" title={college.branch || "General Degree Programs"} style={{ fontSize: 12 }}>
                <strong className="text-dark">{isMed ? "Medical Program:" : "Programs:"}</strong> {college.branch || (isMed ? "MBBS / Clinical Medicine" : "Accredited Degree Programs")}
              </p>
            );
          })()}
          {college.official_cutoff_data && (
            <div className="text-success mt-1 fw-semibold" style={{ fontSize: 10.5 }}>
              <FaInfoCircle className="me-1" />Official CAP Round Gazette Record
            </div>
          )}
        </div>

        {/* 3 Stats Boxes: Cutoff | Score | Rating */}
        <div className="row g-2 text-center mb-3">
          <div className="col-4">
            <div className="p-1 rounded border" style={{ background: "#EEF2FF" }}>
              <div className="fw-bold text-primary small text-truncate" title={cutoffDisplay}>{cutoffDisplay}</div>
              <div className="text-secondary" style={{ fontSize: 10 }}>
                {college.branch_count && college.branch_count > 1 ? "Min Cutoff" : "Cutoff"}
              </div>
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





        {/* Quick Compare Checkbox Bar */}
        {onToggleCompare && (
          <div
            className="d-flex align-items-center justify-content-between px-2 py-1 rounded mb-2 border mt-auto"
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

        {/* Action Buttons: More Info + Student Reviews + Ask Counselor */}
        <div className="d-flex mt-auto" style={{ gap: 8 }}>
          <button
            className="btn btn-sm fw-bold shadow-sm flex-fill d-flex align-items-center justify-content-center gap-1"
            style={{ borderRadius: 12, padding: "8px 6px", fontSize: 11.5, background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8" }}
            onClick={handleOpenDetails}
            title="View college info, domain cutoffs & details"
          >
            <FaInfoCircle size={12} />
            <span>More Info</span>
          </button>

          <button
            className="btn btn-sm fw-bold shadow-sm flex-fill d-flex align-items-center justify-content-center gap-1 text-dark"
            style={{ borderRadius: 12, padding: "8px 6px", fontSize: 11.5, background: "#F1F5F9", border: "1px solid #CBD5E1" }}
            onClick={handleOpenFeedbacks}
            title="View student reviews, comments & campus photos"
          >
            <FaComments size={12} className="text-warning" />
            <span>Reviews</span>
          </button>

          <button
            className="btn btn-sm fw-bold shadow-sm flex-fill d-flex align-items-center justify-content-center gap-1"
            style={{
              background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: 12,
              padding: "8px 6px",
              fontSize: 11.5
            }}
            onClick={() => onAskAI && onAskAI(college)}
          >
            <FaUserGraduate size={11} className="text-warning" />
            <span>Ask AI</span>
          </button>
        </div>
      </div>
    </div>
  );
}
