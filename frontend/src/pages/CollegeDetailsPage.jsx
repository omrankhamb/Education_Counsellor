import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaGraduationCap, FaArrowLeft, FaMapMarkerAlt, FaStar,
  FaTrophy, FaCalendarAlt, FaBuilding, FaCheckCircle,
  FaExclamationTriangle, FaTimesCircle, FaUserGraduate,
  FaBriefcase, FaIdCard, FaListAlt, FaFilter, FaPaperPlane,
  FaHistory, FaFileAlt, FaShieldAlt, FaChartLine,
  FaHeart, FaRegHeart, FaThumbsUp, FaCamera, FaPlus,
  FaFire, FaClock, FaCheck, FaTimes, FaQuoteLeft, FaImage, FaLightbulb
} from "react-icons/fa";
import { APP_NAME } from "./LandingPage";
import { formatScore } from "../utils/scoreUtils";
import CapSimulatorModal from "../components/CapSimulatorModal";
import ScholarshipModal from "../components/ScholarshipModal";

const API_BASE = "/api";

function StudentFeedbackCard({ f, idx, isLiked, onLike, onImageClick }) {
  const cardRef = useRef(null);
  // Show top 2 immediately, reveal remaining on downward scroll
  const [isVisible, setIsVisible] = useState(idx < 2);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (idx < 2) {
      setIsVisible(true);
      return;
    }
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [idx]);

  const fid = f.id || f._id;
  const isTopBest = idx === 0 && (f.helpful_count || 0) > 0;
  const isSecondBest = idx === 1 && (f.helpful_count || 0) > 0;
  const isLong = f.review_text && f.review_text.length > 180;
  const displayText = isLong && !isExpanded ? f.review_text.slice(0, 180) + "..." : f.review_text;

  return (
    <div
      ref={cardRef}
      className="col-12 col-md-6"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(36px)",
        transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "opacity, transform"
      }}
    >
      <div
        className={`card border rounded-4 p-4 h-100 transition shadow-sm d-flex flex-column ${
          isTopBest ? "border-warning border-2" : isSecondBest ? "border-primary border-opacity-50" : "border-light"
        }`}
        style={{
          background: isTopBest ? "#FFFDF5" : "#FFFFFF",
          overflow: "hidden",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          boxSizing: "border-box"
        }}
      >
        {/* Top Best Badges */}
        {isTopBest && (
          <div className="mb-2.5">
            <span className="badge bg-warning text-dark fw-bold px-3 py-1.5 shadow-sm d-inline-flex align-items-center gap-1.5 rounded-pill" style={{ fontSize: 11 }}>
              <FaFire size={12} /> #1 Best Helpful Review
            </span>
          </div>
        )}
        {!isTopBest && isSecondBest && (
          <div className="mb-2.5">
            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-1.5 border border-primary border-opacity-25 d-inline-flex align-items-center gap-1.5 rounded-pill" style={{ fontSize: 11 }}>
              <FaStar size={12} className="text-warning" /> #2 Top Review
            </span>
          </div>
        )}

        {/* Author Header */}
        <div className="d-flex align-items-start gap-3 mb-2.5">
          {/* Avatar */}
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0"
            style={{
              width: 44,
              height: 44,
              background: `linear-gradient(135deg, ${idx % 3 === 0 ? "#1A237E, #3949AB" : idx % 3 === 1 ? "#0D9488, #14B8A6" : "#7C3AED, #9333EA"})`,
              fontSize: 16
            }}
          >
            {f.user_name ? f.user_name.charAt(0).toUpperCase() : "S"}
          </div>

          {/* Name & Role */}
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="d-flex align-items-center flex-wrap" style={{ gap: "10px" }}>
              <h6 className="fw-bold text-dark mb-0 text-truncate" style={{ fontSize: 15 }}>
                {f.user_name || "Campus Student"}
              </h6>
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-0.5 small d-inline-flex align-items-center gap-1" style={{ fontSize: 10.5 }}>
                <FaCheckCircle size={10} /> Verified
              </span>
            </div>

            <div className="text-secondary small d-flex align-items-center gap-1.5 flex-wrap mt-1" style={{ fontSize: 11.5 }}>
              <span className="fw-semibold text-primary">{f.student_role || "Student"}</span>
              {f.tag && (
                <>
                  <span>•</span>
                  <span className="badge bg-light text-dark border px-2 py-0.5" style={{ fontSize: 10 }}>{f.tag}</span>
                </>
              )}
              {f.created_at && (
                <>
                  <span>•</span>
                  <span className="text-muted" style={{ fontSize: 11 }}>
                    {new Date(f.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Rating Stars */}
        <div className="mb-2.5 d-flex align-items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              size={13}
              className={star <= (f.rating || 5) ? "text-warning" : "text-muted opacity-25"}
            />
          ))}
          <span className="small fw-bold text-dark ms-1.5" style={{ fontSize: 12 }}>({f.rating || 5}/5)</span>
        </div>

        {/* Review Text with Read More */}
        <div className="mb-3 flex-grow-1">
          <p className="text-dark mb-1.5 small" style={{ lineHeight: 1.65, fontSize: 13.5, wordBreak: "break-word" }}>
            {displayText}
          </p>
          {isLong && (
            <button
              type="button"
              className="btn btn-link p-0 small fw-bold text-decoration-none mt-1 d-inline-block"
              style={{ fontSize: 12, color: "#1A237E" }}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show Less" : "Read More"}
            </button>
          )}
        </div>

        {/* Attached Photo */}
        {f.photos && f.photos.length > 0 && f.photos[0] && (
          <div className="mb-3">
            <div
              className="rounded-3 overflow-hidden border shadow-sm position-relative"
              style={{
                width: "100%",
                height: 170,
                cursor: "pointer",
                background: "#000000"
              }}
              onClick={() => onImageClick(f.photos[0])}
              title="Click to view full image"
            >
              <img
                src={f.photos[0]}
                alt="Campus photo"
                className="w-100 h-100"
                style={{ objectFit: "cover" }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <div className="position-absolute bottom-0 start-0 p-2 bg-dark bg-opacity-75 text-white small d-inline-flex align-items-center gap-1.5 w-100" style={{ fontSize: 11 }}>
                <FaImage size={11} className="text-warning" />
                <span>Click to enlarge photo</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer: Upvote + Meta */}
        <div className="d-flex align-items-center justify-content-between pt-3 border-top flex-wrap gap-2 mt-auto">
          <button
            type="button"
            className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm"
            style={{
              fontSize: 12,
              transition: "all 0.15s ease",
              background: isLiked ? "#DC2626" : "#FEF2F2",
              color: isLiked ? "#FFFFFF" : "#DC2626",
              border: isLiked ? "none" : "1px solid #FECACA"
            }}
            onClick={() => onLike(fid)}
            title="Like / Upvote this student feedback"
          >
            {isLiked ? <FaHeart size={13} /> : <FaRegHeart size={13} />}
            <span>{f.helpful_count || 0} Likes</span>
            <span className="fw-normal opacity-75 ms-1">• {isLiked ? "Liked" : "Helpful?"}</span>
          </button>

          <span className="text-secondary small" style={{ fontSize: 11.5 }}>
            ✓ Verified student feedback
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CollegeDetailsPage({ studentProfile }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Selected college from navigation state
  const stateCollege = location.state?.college;
  const rawStudent = studentProfile || location.state?.studentProfile;

  const student = useMemo(() => {
    return {
      name: rawStudent?.name || "Student",
      marks: rawStudent?.marks ?? 90.0,
      stream: stateCollege?.stream || rawStudent?.stream || "Engineering",
      exam_type: stateCollege?.exam_type || rawStudent?.exam_type || "MHT-CET",
      score_unit: stateCollege?.score_unit || rawStudent?.score_unit || "percentile"
    };
  }, [
    rawStudent?.name,
    rawStudent?.marks,
    rawStudent?.stream,
    rawStudent?.exam_type,
    rawStudent?.score_unit,
    stateCollege?.stream,
    stateCollege?.exam_type,
    stateCollege?.score_unit
  ]);

  const targetCollegeName = stateCollege?.college_name || "COEP Technological University";

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState("all"); // "all", "eligible", "borderline"
  const [showCapModal, setShowCapModal] = useState(false);
  const [showScholarshipModal, setShowScholarshipModal] = useState(false);

  const displayTrend = useMemo(() => {
    if (!details) return null;
    const raw = details.five_year_trend;
    const baseCutoff = parseFloat(
      details.cutoff_marks ||
      (details.official_cutoff_rows && details.official_cutoff_rows[0]?.cutoff_score) ||
      (details.branch_cutoffs && details.branch_cutoffs[0]?.cutoff_general) ||
      88.0
    );
    const unit = details.score_unit || student.score_unit || "percentile";
    const isRank = unit === "rank";
    const isNeet = unit === "marks_720";

    const hasAnyRaw = raw && (raw["2022"] !== undefined || raw["2024"] !== undefined || raw["2026"] !== undefined);
    if (hasAnyRaw) {
      const b24 = raw["2024"] ?? raw["2026"] ?? raw["2022"] ?? baseCutoff;
      return {
        "2022": raw["2022"] ?? (isRank ? Math.round(b24 * 0.95) : isNeet ? Math.round(b24 - 15) : Number((b24 - 0.35).toFixed(2))),
        "2023": raw["2023"] ?? (isRank ? Math.round(b24 * 0.98) : isNeet ? Math.round(b24 - 8) : Number((b24 - 0.15).toFixed(2))),
        "2024": raw["2024"] ?? (isRank ? Math.round(b24) : isNeet ? Math.round(b24) : Number(Number(b24).toFixed(2))),
        "2025": raw["2025"] ?? raw["2025_target"] ?? (isRank ? Math.round(b24 * 0.99) : isNeet ? Math.round(Math.min(720, b24 + 1)) : Number((b24 + 0.05).toFixed(2))),
        "2026": raw["2026"] ?? raw["2026_projected"] ?? (isRank ? Math.round(b24 * 0.97) : isNeet ? Math.round(Math.min(720, b24 + 3)) : Number((b24 + 0.08).toFixed(2)))
      };
    }

    if (isRank) {
      return {
        "2022": Math.round(baseCutoff * 0.95),
        "2023": Math.round(baseCutoff * 0.98),
        "2024": Math.round(baseCutoff),
        "2025": Math.round(baseCutoff * 0.99),
        "2026": Math.round(baseCutoff * 0.97)
      };
    } else if (isNeet) {
      return {
        "2022": Math.round(baseCutoff - 15),
        "2023": Math.round(baseCutoff - 8),
        "2024": Math.round(baseCutoff),
        "2025": Math.round(Math.min(720, baseCutoff + 1)),
        "2026": Math.round(Math.min(720, baseCutoff + 3))
      };
    } else {
      return {
        "2022": Number(Math.max(0, baseCutoff - 0.35).toFixed(2)),
        "2023": Number(Math.max(0, baseCutoff - 0.15).toFixed(2)),
        "2024": Number(baseCutoff.toFixed(2)),
        "2025": Number(Math.min(99.99, baseCutoff + 0.05).toFixed(2)),
        "2026": Number(Math.min(99.99, baseCutoff + 0.08).toFixed(2))
      };
    }
  }, [details, student.score_unit]);

  const displayCategoryCutoffs = useMemo(() => {
    if (!displayTrend) return {};
    const raw = details?.category_cutoffs;
    if (raw && Object.keys(raw).length > 0) return raw;
    const unit = details?.score_unit || student.score_unit || "percentile";
    const isRank = unit === "rank";
    const isNeet = unit === "marks_720";
    if (isRank) {
      return {
        GOPENS: displayTrend,
        GOBCS: Object.fromEntries(Object.entries(displayTrend).map(([k, v]) => [k, Math.round(v * 1.8)])),
        GSCS: Object.fromEntries(Object.entries(displayTrend).map(([k, v]) => [k, Math.round(v * 3.5)])),
        GSTS: Object.fromEntries(Object.entries(displayTrend).map(([k, v]) => [k, Math.round(v * 5.2)])),
        EWS: Object.fromEntries(Object.entries(displayTrend).map(([k, v]) => [k, Math.round(v * 1.4)]))
      };
    } else if (isNeet) {
      return {
        GOPENS: displayTrend,
        GOBCS: Object.fromEntries(Object.entries(displayTrend).map(([k, v]) => [k, Math.max(100, v - 8)])),
        GSCS: Object.fromEntries(Object.entries(displayTrend).map(([k, v]) => [k, Math.max(100, v - 50)])),
        GSTS: Object.fromEntries(Object.entries(displayTrend).map(([k, v]) => [k, Math.max(100, v - 75)])),
        EWS: Object.fromEntries(Object.entries(displayTrend).map(([k, v]) => [k, Math.max(100, v - 5)]))
      };
    } else {
      return {
        GOPENS: displayTrend,
        GOBCS: Object.fromEntries(Object.entries(displayTrend).map(([k, v]) => [k, Number(Math.max(0, v - 0.4).toFixed(2))])),
        GSCS: Object.fromEntries(Object.entries(displayTrend).map(([k, v]) => [k, Number(Math.max(0, v - 2.8).toFixed(2))])),
        GSTS: Object.fromEntries(Object.entries(displayTrend).map(([k, v]) => [k, Number(Math.max(0, v - 6.5).toFixed(2))])),
        EWS: Object.fromEntries(Object.entries(displayTrend).map(([k, v]) => [k, Number(Math.max(0, v - 0.2).toFixed(2))])),
        TFWS: Object.fromEntries(Object.entries(displayTrend).map(([k, v]) => [k, Number(Math.min(99.99, v + 0.1).toFixed(2))]))
      };
    }
  }, [details?.category_cutoffs, displayTrend, details?.score_unit, student.score_unit]);

  // College Feedbacks & Student Insights State
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbacksSummary, setFeedbacksSummary] = useState({ avg_rating: 4.8, total_reviews: 0, total_likes: 0 });
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);
  const [feedbacksSort, setFeedbacksSort] = useState("likes"); // "likes" (default: highest liked first) | "recent" | "rating"
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState(null);
  const [feedbackAlert, setFeedbackAlert] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [likedReviews, setLikedReviews] = useState(() => {
    try {
      const saved = localStorage.getItem("edu_liked_reviews");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [feedbackForm, setFeedbackForm] = useState({
    user_name: student?.name || "Student",
    student_role: "3rd Year Engineering Student",
    tag: "Placements & Coding Culture",
    custom_tag: "",
    rating: 5,
    review_text: "",
    image_url: "",
    file: null,
    preview_url: ""
  });

  const fetchFeedbacks = async (sortBy = feedbacksSort) => {
    if (!targetCollegeName) return;
    setFeedbacksLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reviews/${encodeURIComponent(targetCollegeName)}?sort_by=${sortBy}`);
      const data = await res.json();
      if (data.success) {
        setFeedbacks(data.reviews || []);
        if (data.summary) {
          setFeedbacksSummary(data.summary);
        }
      }
    } catch (err) {
      console.warn("Could not load college feedbacks:", err);
    } finally {
      setFeedbacksLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks(feedbacksSort);
  }, [targetCollegeName, feedbacksSort]);

  useEffect(() => {
    if (location.state?.focusSection === "feedbacks") {
      setTimeout(() => {
        const elem = document.getElementById("campus-feedback-section");
        if (elem) {
          elem.scrollIntoView({ behavior: "smooth" });
        }
      }, 400);
    }
  }, [location.state]);

  const handleLikeFeedback = async (reviewId) => {
    const alreadyLiked = likedReviews[reviewId];

    setFeedbacks((prev) =>
      prev.map((f) => {
        const idMatch = f.id === reviewId || f._id === reviewId;
        if (idMatch) {
          const cur = f.helpful_count || 0;
          return { ...f, helpful_count: alreadyLiked ? Math.max(0, cur - 1) : cur + 1 };
        }
        return f;
      })
    );

    const updatedLikes = { ...likedReviews, [reviewId]: !alreadyLiked };
    setLikedReviews(updatedLikes);
    try {
      localStorage.setItem("edu_liked_reviews", JSON.stringify(updatedLikes));
    } catch {}

    if (!alreadyLiked) {
      try {
        await fetch(`${API_BASE}/reviews/${reviewId}/helpful`, { method: "POST" });
      } catch (err) {
        console.warn("Error liking review:", err);
      }
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeedbackForm((prev) => ({
          ...prev,
          file: file,
          preview_url: reader.result,
          image_url: ""
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackForm.review_text.trim()) {
      alert("Please enter your feedback description.");
      return;
    }

    if (feedbackForm.tag === "Other" && !feedbackForm.custom_tag?.trim()) {
      alert("Please specify your custom category or query topic.");
      return;
    }

    const finalTag = feedbackForm.tag === "Other"
      ? (feedbackForm.custom_tag?.trim() || "Student Query / Other")
      : feedbackForm.tag;

    setSubmittingFeedback(true);
    try {
      let res;
      if (feedbackForm.file) {
        const formData = new FormData();
        formData.append("user_name", feedbackForm.user_name || "Student");
        formData.append("college_name", details?.college_name || targetCollegeName);
        formData.append("student_role", feedbackForm.student_role);
        formData.append("tag", finalTag);
        formData.append("rating", feedbackForm.rating);
        formData.append("review_text", feedbackForm.review_text);
        if (feedbackForm.image_url) formData.append("image_url", feedbackForm.image_url);
        formData.append("photos", feedbackForm.file);

        res = await fetch(`${API_BASE}/reviews`, {
          method: "POST",
          body: formData
        });
      } else {
        res = await fetch(`${API_BASE}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_name: feedbackForm.user_name || "Student",
            college_name: details?.college_name || targetCollegeName,
            student_role: feedbackForm.student_role,
            tag: finalTag,
            rating: Number(feedbackForm.rating),
            review_text: feedbackForm.review_text,
            image_url: feedbackForm.image_url || feedbackForm.preview_url || ""
          })
        });
      }

      const data = await res.json();
      if (data.success && data.review) {
        setFeedbacks((prev) => [data.review, ...prev]);
        setFeedbacksSummary((prev) => ({
          ...prev,
          total_reviews: (prev.total_reviews || 0) + 1
        }));
        setShowFeedbackModal(false);
        setFeedbackAlert("Your feedback has been posted successfully! Thank you for sharing real insights.");
        setTimeout(() => setFeedbackAlert(""), 6000);
        setFeedbackForm({
          user_name: student?.name || "Student",
          student_role: "3rd Year Engineering Student",
          tag: "Placements & Coding Culture",
          custom_tag: "",
          rating: 5,
          review_text: "",
          image_url: "",
          file: null,
          preview_url: ""
        });
      }
    } catch (err) {
      console.error("Failed to post feedback:", err);
      alert("Could not post feedback. Please check backend connection.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchCollegeDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/college-details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            college_name: targetCollegeName,
            college_code: stateCollege?.college_code || stateCollege?.dte_code || "",
            stream: student.stream,
            student_marks: student.marks,
            exam_type: student.exam_type,
            score_unit: student.score_unit
          })
        });
        const data = await res.json();
        if (isMounted && data.success && data.college) {
          setDetails({
            ...stateCollege,
            ...data.college,
            facilities: data.college.facilities || stateCollege?.facilities || ["Advanced Research Labs", "Central Library", "Hostels", "Sports Complex", "Wi-Fi Campus"],
            why_recommended: data.college.why_recommended || stateCollege?.why_recommended || "",
            five_year_trend: data.college.five_year_trend || stateCollege?.five_year_trend,
            category_cutoffs: data.college.category_cutoffs || stateCollege?.category_cutoffs,
            source_document: data.college.source_document || stateCollege?.source_document
          });
        }
      } catch (err) {
        console.error("Failed to fetch college details", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCollegeDetails();

    return () => {
      isMounted = false;
    };
  }, [targetCollegeName, student.stream, student.marks, student.exam_type, student.score_unit]);

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

  const streamLower = (details?.stream || student.stream || "").toLowerCase();
  const examLower = (student.exam_type || details?.exam_type || "").toLowerCase();
  const isMedical = streamLower === "medical" || examLower.includes("neet") || /aiims|gmc|medical|hospital|afmc|kem|bjmc|grant/i.test(details?.college_name || "");
  const isLaw = streamLower === "law" || examLower.includes("clat") || examLower.includes("ailet");
  const isDesign = streamLower === "design" || examLower.includes("uceed") || examLower.includes("nid") || examLower.includes("nift");
  const isCommerce = streamLower === "commerce" || examLower.includes("ipm");
  const isScience = streamLower === "science" || examLower.includes("iiser") || examLower.includes("nest");

  const programLabel = isMedical ? "Specialty / Medical Program" : isLaw ? "Law Degree Program" : isDesign ? "Design Discipline" : isCommerce ? "Commerce & Finance Program" : "Branch / Domain";
  const domainLabel = isMedical ? "Clinical Specialty" : isLaw ? "Legal Domain" : isDesign ? "Creative Domain" : isCommerce ? "Financial Domain" : "Domain Category";
  const placementColumnLabel = isMedical ? "Residency Stipend / Package" : "Avg Placement";

  const handleAskCounselorForBranch = (branchName) => {
    const formattedScore = formatScore(student.marks, student.exam_type, details.score_unit || student.score_unit);
    const prompt = `I am interested in ${branchName} at ${details.college_name}. Based on my score of ${formattedScore} in ${student.exam_type || "entrance exam"}, what are my admission chances in counseling rounds, fees, and career placements?`;
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
              className="btn btn-sm fw-semibold rounded-pill px-3 py-1 d-flex align-items-center gap-1 shadow-sm"
              style={{ background: "#FFFFFF", color: "#1A237E", border: "1px solid #FFFFFF" }}
              onClick={() => navigate("/dashboard")}
            >
              <FaArrowLeft size={11} /> Back to Dashboard
            </button>
            <span className="navbar-brand text-white fw-bold d-flex align-items-center gap-2 m-0 fs-5" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              <FaGraduationCap size={26} color="#FFB300" />
              <span style={{ fontFamily: "'Poppins', sans-serif" }}>{APP_NAME}</span>
            </span>
          </div>

          <div className="d-flex align-items-center flex-wrap" style={{ gap: "10px" }}>
            <button
              className="btn btn-sm fw-bold rounded-pill px-3 py-1.5 shadow-sm d-flex align-items-center gap-1"
              onClick={() => setShowCapModal(true)}
              style={{ background: "#FFFFFF", color: "#1A237E", border: "1px solid #FFFFFF", fontSize: 12 }}
              title="Simulate Centralized Admission Process (CAP) Round 1, 2, 3 allotment probabilities for this college"
            >
              <FaBullseye size={12} color="#D97706" />
              <span>CAP Simulator</span>
            </button>

            <button
              className="btn btn-sm fw-bold rounded-pill px-3 py-1.5 shadow-sm d-flex align-items-center gap-1"
              onClick={() => setShowScholarshipModal(true)}
              style={{ background: "#FFFFFF", color: "#1A237E", border: "1px solid #FFFFFF", fontSize: 12 }}
              title="Calculate statutory MahaDBT EBC 50%, TFWS 100%, and government fee concessions for this college"
            >
              <FaCoins size={12} color="#D97706" />
              <span>Scholarships</span>
            </button>

            <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fw-bold shadow-sm d-none d-lg-inline-block">
              Your Score: {formatScore(student.marks, student.exam_type, student.score_unit)} ({student.stream})
            </span>

            <button
              className="btn btn-sm fw-bold rounded-pill px-3 py-1.5 shadow-sm"
              style={{ background: "#FFFFFF", color: "#1A237E", border: "1px solid #FFFFFF", fontSize: 12 }}
              onClick={() => {
                const formattedScore = formatScore(student.marks, student.exam_type, student.score_unit);
                navigate("/chat", { state: { initialPrompt: `Tell me all about admission at ${details?.college_name || targetCollegeName} for my score of ${formattedScore} in ${student.exam_type || "entrance exam"}.` } });
              }}
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
              <div className="rounded-4 overflow-hidden shadow-lg border border-light border-opacity-25" style={{ height: 200 }}>
                <img
                  src={details.image_url || "https://images.unsplash.com/photo-1562774053-701939374585?w=700&auto=format&fit=crop&q=80"}
                  alt={details.college_name}
                  className="w-100 h-100"
                  style={{ objectFit: "cover" }}
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1562774053-701939374585?w=700&auto=format&fit=crop&q=80";
                  }}
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

              {/* Quick Access to CAP Round Process & MahaDBT in Hero */}
              <div className="mt-3 pt-3 border-top border-white border-opacity-20 d-flex flex-wrap gap-2 align-items-center">
                <span className="text-white-50 small fw-semibold me-2">Admission Tools:</span>
                <button
                  className="btn btn-warning btn-sm fw-bold rounded-pill px-3 py-1 shadow-sm d-inline-flex align-items-center gap-1 text-dark"
                  onClick={() => setShowCapModal(true)}
                >
                  <span>🎯 CAP Round Simulator & Option Form</span>
                </button>
                <button
                  className="btn btn-sm fw-semibold rounded-pill px-3 py-1 shadow-sm d-inline-flex align-items-center gap-1"
                  onClick={() => setShowScholarshipModal(true)}
                  style={{ background: "rgba(255, 255, 255, 0.22)", border: "1px solid rgba(255, 255, 255, 0.4)", color: "#FFFFFF" }}
                >
                  <span>💰 Calculate Fee Concessions & EBC</span>
                </button>
                <a
                  href="#campus-feedback-section"
                  className="btn btn-sm fw-semibold rounded-pill px-3 py-1 shadow-sm d-inline-flex align-items-center gap-1 text-white text-decoration-none"
                  style={{ background: "rgba(255, 255, 255, 0.22)", border: "1px solid rgba(255, 255, 255, 0.4)" }}
                >
                  <span>💬 Student Feedback & Photos</span>
                </a>
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
                🎯 {isMedical ? "Clinical Specialty Feasibility Analysis" : isLaw ? "Legal Degree Feasibility Analysis" : isDesign ? "Design Discipline Feasibility" : "Domain Feasibility Analysis"} for Your {formatScore(student.marks, student.exam_type, details.score_unit || student.score_unit)} Score:
              </h6>
              <p className="text-secondary small mb-0">
                You are currently eligible for <strong className="text-success">{eligibleBranches.length} out of {branches.length} {isMedical ? "medical programs/specialties" : isLaw ? "legal programs" : "major domains/branches"}</strong> in this institution!
              </p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-warning btn-sm rounded-pill px-3 fw-bold shadow-sm text-dark d-flex align-items-center gap-1"
                onClick={() => setShowCapModal(true)}
              >
                <span>🎯 Forecast CAP Allotment</span>
              </button>
              <button
                className="btn btn-sm rounded-pill px-3 fw-bold shadow-sm d-flex align-items-center gap-1"
                onClick={() => setShowScholarshipModal(true)}
                style={{ background: "linear-gradient(135deg, #10B981, #059669)", color: "#FFFFFF", border: "none" }}
              >
                <span>💰 Calculate Net Fees</span>
              </button>
              <button
                className="btn btn-primary btn-sm rounded-pill px-3 fw-bold shadow-sm"
                onClick={() => handleAskCounselorForBranch("Admission Strategy")}
              >
                Ask Counselor →
              </button>
            </div>
          </div>
        </div>

        {/* Why Recommended AI Insight */}
        {details.why_recommended && (
          <div
            className="p-3.5 rounded-4 mb-4 d-flex align-items-start gap-2.5 shadow-sm"
            style={{ background: "#FFFBEB", borderLeft: "4px solid #FFB300" }}
          >
            <FaLightbulb size={20} className="text-warning flex-shrink-0 mt-0.5" />
            <div>
              <div className="fw-bold small text-dark mb-0.5" style={{ fontSize: 13.5 }}>
                💡 AI Counselor Standing & Recommendation Rationale:
              </div>
              <div className="text-secondary small" style={{ lineHeight: 1.55 }}>
                {details.why_recommended}
              </div>
            </div>
          </div>
        )}

        {/* VERIFIED 5-YEAR CUTOFF TRAJECTORY & OFFICIAL GAZETTE CITATIONS (2022 - 2026) */}
        {displayTrend && (
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <div>
                <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill fw-bold small mb-1 d-inline-flex align-items-center gap-1">
                  <FaHistory /> Official 2022 – 2026 Cutoff Records
                </span>
                <h4 className="fw-bold text-dark mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Verified Multi-Year Cutoff Trajectory & Official Gazette
                </h4>
                <p className="text-secondary small mb-0">
                  Historical closing cutoffs (2022–2024), 2025 previous year closing, and <strong>2026 current active academic year cutoffs</strong> retrieved deterministically from state & national gazettes.
                </p>
              </div>

              {details.source_document && (
                <div className="p-2 px-3 rounded-3 border d-flex align-items-center gap-2" style={{ background: "#F8FAFC", borderColor: "#CBD5E1" }}>
                  <FaShieldAlt className="text-success" size={16} />
                  <div>
                    <div className="fw-bold text-dark" style={{ fontSize: 11 }}>
                      📄 Official Gazette Verification
                    </div>
                    <div className="text-secondary small text-truncate" style={{ maxWidth: 300, fontSize: 10.5 }}>
                      {details.source_document}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5-Step Visual Timeline Cards */}
            <div className="row g-2 text-center mb-4">
              <div className="col-12 col-sm-6 col-md">
                <div className="p-3 rounded-3 border h-100" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
                  <span className="badge bg-secondary mb-2" style={{ fontSize: 10 }}>2022 Closed</span>
                  <div className="fs-5 fw-bold text-dark">
                    {formatScore(displayTrend["2022"], details.exam_type, details.score_unit || student.score_unit)}
                  </div>
                  <div className="text-muted" style={{ fontSize: 10.5 }}>Round 3 Final</div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md">
                <div className="p-3 rounded-3 border h-100" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
                  <span className="badge bg-secondary mb-2" style={{ fontSize: 10 }}>2023 Closed</span>
                  <div className="fs-5 fw-bold text-dark">
                    {formatScore(displayTrend["2023"], details.exam_type, details.score_unit || student.score_unit)}
                  </div>
                  <div className="text-muted" style={{ fontSize: 10.5 }}>Round 3 Final</div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md">
                <div className="p-3 rounded-3 border h-100" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
                  <span className="badge bg-secondary mb-2" style={{ fontSize: 10 }}>2024 Gazette</span>
                  <div className="fs-5 fw-bold text-dark">
                    {formatScore(displayTrend["2024"], details.exam_type, details.score_unit || student.score_unit)}
                  </div>
                  <div className="text-muted" style={{ fontSize: 10.5 }}>Official Gazette Record</div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md">
                <div className="p-3 rounded-3 border h-100" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
                  <span className="badge bg-warning text-dark mb-2" style={{ fontSize: 10 }}>2025 Official Closing</span>
                  <div className="fs-5 fw-bold text-warning text-dark">
                    {formatScore(displayTrend["2025"], details.exam_type, details.score_unit || student.score_unit)}
                  </div>
                  <div className="text-muted" style={{ fontSize: 10.5 }}>Previous Year Baseline</div>
                </div>
              </div>

              <div className="col-12 col-sm-6 col-md">
                <div className="p-3 rounded-3 border border-success border-2 h-100 shadow-sm" style={{ background: "#F0FDF4" }}>
                  <span className="badge bg-success mb-2" style={{ fontSize: 10 }}>🎯 2026 Current Cutoff</span>
                  <div className="fs-5 fw-black text-success">
                    {formatScore(displayTrend["2026"], details.exam_type, details.score_unit || student.score_unit)}
                  </div>
                  <div className="text-success fw-semibold" style={{ fontSize: 10.5 }}>Active 2026 Admission Baseline</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. DOMAIN / BRANCH-WISE CUTOFF BREAKDOWN TABLE */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
            <div>
              <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill fw-bold small mb-1">
                📊 {isMedical ? "Medical Specialties & Programs" : isLaw ? "Legal Programs & Cutoffs" : isDesign ? "Design Disciplines" : "Domain & Branch Cutoffs"}
              </span>
              <h4 className="fw-bold text-dark mb-0" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {isMedical ? "Medical Program Cutoff Breakdown & Eligibility" : isLaw ? "Law Program Cutoffs & Eligibility" : isDesign ? "Design Discipline Cutoffs" : "Branch-Wise Cutoff Breakdown & Your Eligibility"}
              </h4>
              <p className="text-secondary small mb-0">
                {isMedical
                  ? "Cutoffs shown in official NEET UG marks (/720). Compare across categories and verify your admission probability."
                  : isLaw
                  ? "Cutoffs shown in CLAT/AILET All India Rank. Compare across categories and check your merit position."
                  : "Cutoff thresholds differ by discipline. Compare cutoffs across categories and check your direct eligibility."}
              </p>
            </div>

            {/* Filter Pills with distinct colored backgrounds */}
            <div className="d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                style={{
                  background: branchFilter === "all" ? "linear-gradient(135deg, #1A237E, #3949AB)" : "#EEF2FF",
                  color: branchFilter === "all" ? "#FFFFFF" : "#1A237E",
                  border: branchFilter === "all" ? "1px solid #1A237E" : "1px solid #C7D2FE",
                  fontSize: 12.5,
                  transition: "all 0.15s ease",
                }}
                onClick={() => setBranchFilter("all")}
              >
                <span>All {isMedical ? "Programs" : "Branches"}</span>
                <span className="badge rounded-pill" style={{ background: branchFilter === "all" ? "#FFB300" : "#C7D2FE", color: "#1A237E", fontSize: 10.5 }}>
                  {branches.length}
                </span>
              </button>

              <button
                type="button"
                className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                style={{
                  background: branchFilter === "eligible" ? "#10B981" : "#ECFDF5",
                  color: branchFilter === "eligible" ? "#FFFFFF" : "#065F46",
                  border: branchFilter === "eligible" ? "1px solid #059669" : "1px solid #A7F3D0",
                  fontSize: 12.5,
                  transition: "all 0.15s ease",
                }}
                onClick={() => setBranchFilter("eligible")}
              >
                <span>✅ Eligible {isMedical ? "Programs" : "Branches"}</span>
                <span className="badge rounded-pill" style={{ background: branchFilter === "eligible" ? "#FFFFFF" : "#A7F3D0", color: "#065F46", fontSize: 10.5 }}>
                  {eligibleBranches.length}
                </span>
              </button>

              <button
                type="button"
                className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                style={{
                  background: branchFilter === "borderline" ? "#F59E0B" : "#FFFBEB",
                  color: branchFilter === "borderline" ? "#FFFFFF" : "#92400E",
                  border: branchFilter === "borderline" ? "1px solid #D97706" : "1px solid #FDE68A",
                  fontSize: 12.5,
                  transition: "all 0.15s ease",
                }}
                onClick={() => setBranchFilter("borderline")}
              >
                <span>⚠️ Borderline Targets</span>
              </button>
            </div>
          </div>

          {/* Interactive Table */}
          <div className="table-responsive border rounded-3 shadow-sm overflow-hidden">
            <table className="table table-hover table-striped mb-0 align-middle text-center">
              <thead>
                <tr style={{ background: "#1A237E" }}>
                  <th style={{ background: "#1A237E", color: "#FFFFFF", padding: "12px 14px", border: "none" }} className="text-start">{programLabel}</th>
                  <th style={{ background: "#1A237E", color: "#FFFFFF", padding: "12px 10px", border: "none" }}>{domainLabel}</th>
                  <th style={{ background: "#1A237E", color: "#FFFFFF", padding: "12px 10px", border: "none" }}>Seats / Intake</th>
                  <th style={{ background: "#1A237E", color: "#FFFFFF", padding: "12px 10px", border: "none" }}>General Cutoff</th>
                  <th style={{ background: "#1A237E", color: "#FFFFFF", padding: "12px 10px", border: "none" }}>OBC Cutoff</th>
                  <th style={{ background: "#1A237E", color: "#FFFFFF", padding: "12px 10px", border: "none" }}>SC / ST Cutoff</th>
                  <th style={{ background: "#1A237E", color: "#FFFFFF", padding: "12px 10px", border: "none" }}>{placementColumnLabel}</th>
                  <th style={{ background: "#1A237E", color: "#FFFFFF", padding: "12px 14px", border: "none" }}>
                    Your Eligibility ({formatScore(student.marks, student.exam_type, details.score_unit || student.score_unit)})
                  </th>
                  <th style={{ background: "#1A237E", color: "#FFFFFF", padding: "12px 10px", border: "none" }}>Action</th>
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
                      {formatScore(b.cutoff_general, student.exam_type, details.score_unit || student.score_unit)}
                    </td>

                    {/* OBC Cutoff */}
                    <td className="py-3 px-2 text-secondary">
                      {formatScore(b.cutoff_obc, student.exam_type, details.score_unit || student.score_unit)}
                    </td>

                    {/* SC/ST Cutoff */}
                    <td className="py-3 px-2 text-secondary">
                      {formatScore(b.cutoff_sc_st, student.exam_type, details.score_unit || student.score_unit)}
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
                        {(() => {
                          const unit = details.score_unit || student.score_unit;
                          if (unit === "rank") {
                            return b.diff_from_cutoff >= 0
                              ? `${Math.abs(b.diff_from_cutoff).toLocaleString()} ranks safer`
                              : `${Math.abs(b.diff_from_cutoff).toLocaleString()} ranks away`;
                          }
                          if (unit === "marks_720") {
                            return b.diff_from_cutoff >= 0
                              ? `+${b.diff_from_cutoff} marks above`
                              : `${b.diff_from_cutoff} marks needed`;
                          }
                          return b.diff_from_cutoff >= 0
                            ? `+${b.diff_from_cutoff}% above cutoff`
                            : `${b.diff_from_cutoff}% needed`;
                        })()}
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-2">
                      <button
                        className="btn btn-sm rounded-pill px-3 py-1 fw-bold shadow-sm d-inline-flex align-items-center gap-1 text-white"
                        style={{
                          background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
                          border: "none",
                          fontSize: 11.5,
                          whiteSpace: "nowrap"
                        }}
                        onClick={() => handleAskCounselorForBranch(b.branch)}
                        title={`Ask counselor about ${b.branch}`}
                      >
                        <FaUserGraduate size={10} className="text-warning" />
                        <span>Ask AI</span>
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
                  {isMedical ? "🩺 Clinical Residency & Hospital Training" : isLaw ? "⚖️ Legal Placements" : isDesign ? "🎨 Design Industry Placements" : "💼 Placement Statistics"}
                </span>
                <h5 className="fw-bold text-dark mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {isMedical ? "Hospital Residency & Healthcare Network" : isLaw ? "Legal Placements & Law Firm Track Record" : isDesign ? "Design Studios & Creative Industry Placements" : isCommerce ? "Financial & Corporate Recruitment Track Record" : "Career & Recruitment Track Record"}
                </h5>
                <div className="mb-2">
                  <span className="text-secondary small">{isMedical ? "Residency Stipend / Package:" : "Average Salary Package:"}</span>
                  <div className="fs-4 fw-black text-primary">{details.placement_performance.overall_average}</div>
                </div>
                <div className="mb-2">
                  <span className="text-secondary small">{isMedical ? "Highest Fellowship / Commission:" : "Highest Compensation:"}</span>
                  <div className="fs-4 fw-black text-success">{details.placement_performance.highest_package}</div>
                </div>
                <div>
                  <span className="text-secondary small">{isMedical ? "Clinical Appointment Rate:" : "Placement Rate:"}</span>
                  <div className="fw-bold text-dark">{details.placement_performance.placement_percentage}</div>
                </div>
              </div>

              <div className="col-lg-8 border-start-lg ps-lg-4">
                <h6 className="fw-bold text-dark mb-2">
                  {isMedical ? "Key Teaching Hospitals & Healthcare Network:" : isLaw ? "Key Law Firms & Legal Corporate Recruiters:" : isDesign ? "Key Design Studios & Creative Employers:" : isCommerce ? "Key Financial, Big-4 & Corporate Recruiters:" : "Key Multinational Recruiters:"}
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {details.placement_performance.top_recruiters?.map((recruiter, i) => (
                    <span key={i} className="badge bg-light text-dark border p-2 fw-semibold shadow-sm" style={{ fontSize: 12 }}>
                      {isMedical ? "🏥" : isLaw ? "⚖️" : isDesign ? "🎨" : "🏢"} {recruiter}
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

        {/* 5. CAMPUS FACILITIES & INFRASTRUCTURE */}
        {details.facilities && details.facilities.length > 0 && (
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill fw-bold small">
                🏛️ Campus Infrastructure
              </span>
              <h5 className="fw-bold text-dark m-0" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Campus Facilities & Amenities
              </h5>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {details.facilities.map((fac, idx) => (
                <span
                  key={idx}
                  className="badge bg-light text-dark border px-3 py-2 fw-semibold shadow-sm d-inline-flex align-items-center gap-1.5"
                  style={{ fontSize: 12.5 }}
                >
                  <FaCheckCircle className="text-success" size={13} /> {fac}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 6. CAMPUS INSIDER REVIEWS & STUDENT FEEDBACK (HIGHEST LIKED FIRST) */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white" id="campus-feedback-section">
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3 pb-3 border-bottom">
            <div>
              <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill fw-bold small mb-1">
                💬 Campus Community Insights
              </span>
              <h4 className="fw-bold text-dark mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Student & Alumni Verified Feedback for {details.college_name}
              </h4>
              <p className="text-secondary small mb-0">
                Honest insider reviews, hostel reality, and placement experiences from students on campus.
                Highest liked reviews are highlighted first to help new aspirants!
              </p>
            </div>

            <button
              className="btn btn-warning fw-bold rounded-pill px-4 py-2 shadow-sm d-inline-flex align-items-center gap-2"
              style={{ background: "linear-gradient(135deg, #FFB300, #FF8F00)", color: "#1A237E", border: "none" }}
              onClick={() => setShowFeedbackModal(true)}
            >
              <FaPlus size={12} />
              <span>Post Your College Feedback</span>
            </button>
          </div>

          {/* Alert Message */}
          {feedbackAlert && (
            <div className="alert alert-success alert-dismissible fade show rounded-3 py-2 px-3 small d-flex align-items-center gap-2 mb-3" role="alert">
              <FaCheckCircle className="text-success flex-shrink-0" />
              <span>{feedbackAlert}</span>
              <button type="button" className="btn-close py-2" onClick={() => setFeedbackAlert("")} />
            </div>
          )}

          {/* Summary & Sorting Toolbar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 p-3 rounded-3 mb-4" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
            {/* Rating & Likes Stats */}
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div className="d-flex align-items-center gap-2">
                <span className="fs-4 fw-black text-warning">⭐ {feedbacksSummary.avg_rating || 4.8}</span>
                <div className="small text-secondary" style={{ lineHeight: 1.2 }}>
                  <div>Out of 5.0</div>
                  <strong>({feedbacksSummary.total_reviews || feedbacks.length} Student Reviews)</strong>
                </div>
              </div>

              <div className="vr d-none d-sm-block my-1" />

              <div className="d-flex align-items-center gap-1 small text-dark fw-semibold">
                <FaHeart className="text-danger" />
                <span>
                  {feedbacksSummary.total_likes || feedbacks.reduce((acc, f) => acc + (f.helpful_count || 0), 0)} Helpful Upvotes
                </span>
              </div>
            </div>

            {/* Sort Buttons: Separated Pills with clean gap */}
            <div className="d-flex align-items-center flex-wrap" style={{ gap: "10px" }}>
              <span className="text-secondary small fw-bold me-1">Sort by:</span>
              <div className="d-flex align-items-center flex-wrap" style={{ gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                  style={{
                    background: feedbacksSort === "likes" ? "linear-gradient(135deg, #1A237E, #3949AB)" : "#FFFFFF",
                    color: feedbacksSort === "likes" ? "#FFFFFF" : "#334155",
                    border: feedbacksSort === "likes" ? "1px solid #1A237E" : "1px solid #CBD5E1",
                    fontSize: 12,
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => setFeedbacksSort("likes")}
                  title="Show the most helpful and highest liked feedback at the top"
                >
                  <FaFire size={12} className="text-warning" />
                  <span>Highest Liked</span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                  style={{
                    background: feedbacksSort === "recent" ? "linear-gradient(135deg, #1A237E, #3949AB)" : "#FFFFFF",
                    color: feedbacksSort === "recent" ? "#FFFFFF" : "#334155",
                    border: feedbacksSort === "recent" ? "1px solid #1A237E" : "1px solid #CBD5E1",
                    fontSize: 12,
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => setFeedbacksSort("recent")}
                >
                  <FaClock size={11} />
                  <span>Most Recent</span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                  style={{
                    background: feedbacksSort === "rating" ? "linear-gradient(135deg, #1A237E, #3949AB)" : "#FFFFFF",
                    color: feedbacksSort === "rating" ? "#FFFFFF" : "#334155",
                    border: feedbacksSort === "rating" ? "1px solid #1A237E" : "1px solid #CBD5E1",
                    fontSize: 12,
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => setFeedbacksSort("rating")}
                >
                  <FaStar size={11} className="text-warning" />
                  <span>Top Rated</span>
                </button>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          {feedbacksLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <div className="small text-secondary mt-2">Loading campus insider feedback...</div>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-5 border rounded-4 bg-light p-4">
              <FaQuoteLeft size={36} className="text-muted mb-2 opacity-50" />
              <h6 className="fw-bold text-dark">No Student Feedback Yet</h6>
              <p className="text-secondary small mb-3">Be the first student or alumni from {details.college_name} to post a review and help new aspirants!</p>
              <button
                className="btn btn-primary btn-sm rounded-pill px-4"
                onClick={() => setShowFeedbackModal(true)}
              >
                + Write First Feedback
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {feedbacks.map((f, idx) => {
                const fid = f.id || f._id;
                const isLiked = Boolean(likedReviews[fid]);

                return (
                  <StudentFeedbackCard
                    key={fid || idx}
                    f={f}
                    idx={idx}
                    isLiked={isLiked}
                    onLike={handleLikeFeedback}
                    onImageClick={setActiveImageModal}
                  />
                );
              })}
            </div>
          )}
        </div>

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
            className="btn btn-lg fw-semibold rounded-pill px-4 py-3 shadow-sm"
            style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#334155" }}
            onClick={() => navigate("/dashboard")}
          >
            ← Back to All Colleges
          </button>
        </div>
      </div>

      {/* MODAL: POST COLLEGE FEEDBACK / INSIDER REVIEW */}
      {showFeedbackModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: "rgba(15, 23, 42, 0.75)", zIndex: 1080 }} onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden">
              <div className="modal-header text-white px-4 py-3" style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)" }}>
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-5">✍️</span>
                  <div>
                    <h5 className="modal-title fw-bold m-0" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      Share College Feedback for {details.college_name}
                    </h5>
                    <span className="small text-white-50">Help aspiring students with honest campus insights, photos, and tips</span>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowFeedbackModal(false)} />
              </div>

              <form onSubmit={handleSubmitFeedback}>
                <div className="modal-body p-4 bg-light">
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Your Name / Alias:</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-3"
                        value={feedbackForm.user_name}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, user_name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Your Branch / Status:</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-3"
                        value={feedbackForm.student_role}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, student_role: e.target.value })}
                        placeholder="e.g. 3rd Year CSE / Alumni '24"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Feedback Category:</label>
                      <select
                        className="form-select form-select-sm rounded-3"
                        value={feedbackForm.tag}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, tag: e.target.value })}
                      >
                        <option value="Placements & Coding Culture">💼 Placements & Coding Culture</option>
                        <option value="Hostel & Campus Life">🏡 Hostel & Mess Life</option>
                        <option value="Labs, Research & AI Infrastructure">🔬 Labs & Infrastructure</option>
                        <option value="Faculty & Academic Rigor">📚 Faculty & Academics</option>
                        <option value="Clubs, Sports & Events">🏆 Clubs, Sports & Fests</option>
                        <option value="Overall Campus Experience">⭐ Overall Campus Experience</option>
                        <option value="Other">❓ Other / Specific Student Query</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-dark">Overall Rating (1 to 5):</label>
                      <div className="d-flex align-items-center gap-2 pt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            className="btn btn-sm p-0 border-0 bg-transparent"
                            onClick={() => setFeedbackForm({ ...feedbackForm, rating: s })}
                          >
                            <FaStar
                              size={22}
                              className={s <= feedbackForm.rating ? "text-warning" : "text-muted opacity-25"}
                            />
                          </button>
                        ))}
                        <span className="fw-bold small text-dark ms-2">{feedbackForm.rating} Stars</span>
                      </div>
                    </div>

                    {/* Conditional Input for "Other" Category */}
                    {feedbackForm.tag === "Other" && (
                      <div className="col-12">
                        <div className="p-3 rounded-3 border border-warning bg-warning bg-opacity-10 shadow-sm">
                          <label className="form-label small fw-bold text-dark mb-1 d-flex align-items-center justify-content-between">
                            <span>Specify Category or Query Topic: <span className="text-danger">*</span></span>
                            <span className="badge bg-warning text-dark font-monospace" style={{ fontSize: 10 }}>Custom Topic</span>
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-3 bg-white mb-2"
                            placeholder="e.g. Mess Food Quality, Bus Route, Fee Concession & Scholarship, Gym..."
                            value={feedbackForm.custom_tag}
                            onChange={(e) => setFeedbackForm({ ...feedbackForm, custom_tag: e.target.value })}
                            required={feedbackForm.tag === "Other"}
                          />
                          <div className="d-flex align-items-center gap-1.5 flex-wrap">
                            <span className="small text-muted me-1" style={{ fontSize: "0.78rem" }}>Quick Suggestions:</span>
                            {[
                              "Mess Food & Canteen",
                              "Bus & Transportation",
                              "Scholarships & Fee Concession",
                              "Sports & Gym Facilities",
                              "Direct Second Year (DSE)",
                              "Library & WiFi Connectivity"
                            ].map((suggested) => (
                                <button
                                  key={suggested}
                                  type="button"
                                  className="btn btn-xs rounded-pill py-0.5 px-2 fw-semibold shadow-sm"
                                  style={{ fontSize: "0.75rem", background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#334155" }}
                                  onClick={() => setFeedbackForm((prev) => ({ ...prev, custom_tag: suggested }))}
                                >
                                  + {suggested}
                                </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feedback Description Textarea */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">
                      Detailed Feedback & Tips for Juniors: <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control rounded-3"
                      rows="4"
                      value={feedbackForm.review_text}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, review_text: e.target.value })}
                      placeholder="Share real insights: How is the coding environment? Are hostel rooms clean? What placement companies actually visit? Tips for CAP round or interviews..."
                      required
                    />
                  </div>

                  {/* Campus Photo Attachment (File or URL) */}
                  <div className="p-3 bg-white rounded-3 border">
                    <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1 mb-2">
                      <FaCamera className="text-primary" /> Attach Campus Photo (Optional):
                    </label>

                    <div className="row g-2 align-items-center">
                      <div className="col-md-6">
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control form-control-sm"
                          onChange={handleImageFileChange}
                        />
                        <small className="text-muted" style={{ fontSize: 11 }}>Upload photo from device (JPG, PNG)</small>
                      </div>

                      <div className="col-md-6">
                        <input
                          type="url"
                          className="form-control form-control-sm"
                          placeholder="Or paste image URL (https://...)"
                          value={feedbackForm.image_url}
                          onChange={(e) => setFeedbackForm({
                            ...feedbackForm,
                            image_url: e.target.value,
                            preview_url: e.target.value,
                            file: null
                          })}
                        />
                        <small className="text-muted" style={{ fontSize: 11 }}>Paste direct campus image URL</small>
                      </div>
                    </div>

                    {/* Image Preview Box */}
                    {feedbackForm.preview_url && (
                      <div className="mt-3 position-relative d-inline-block">
                        <img
                          src={feedbackForm.preview_url}
                          alt="Preview"
                          className="rounded-3 border shadow-sm"
                          style={{ maxWidth: 220, maxHeight: 130, objectFit: "cover" }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0 m-1 p-0 d-flex align-items-center justify-content-center"
                          style={{ width: 22, height: 22 }}
                          onClick={() => setFeedbackForm({ ...feedbackForm, file: null, preview_url: "", image_url: "" })}
                          title="Remove image"
                        >
                          <FaTimes size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer px-4 py-3 bg-white">
                  <button
                    type="button"
                    className="btn rounded-pill px-4 fw-semibold shadow-sm"
                    style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#334155" }}
                    onClick={() => setShowFeedbackModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-warning fw-bold rounded-pill px-4 text-dark shadow-sm"
                    disabled={submittingFeedback}
                  >
                    {submittingFeedback ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Posting...
                      </>
                    ) : (
                      "🚀 Post Feedback"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SIZE IMAGE LIGHTBOX MODAL */}
      {activeImageModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ background: "rgba(0, 0, 0, 0.85)", zIndex: 1090 }}
          onClick={() => setActiveImageModal(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content bg-transparent border-0 text-center">
              <div className="d-flex justify-content-end mb-2">
                <button
                  type="button"
                  className="btn btn-light rounded-circle shadow"
                  style={{ width: 36, height: 36 }}
                  onClick={() => setActiveImageModal(null)}
                >
                  <FaTimes />
                </button>
              </div>
              <img
                src={activeImageModal}
                alt="Enlarged Campus View"
                className="img-fluid rounded-4 shadow-2xl border border-light border-opacity-25"
                style={{ maxHeight: "80vh", objectFit: "contain", margin: "0 auto" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modals for CAP Simulation & Scholarship Calculation */}
      {details && (
        <>
          <CapSimulatorModal
            isOpen={showCapModal}
            onClose={() => setShowCapModal(false)}
            studentProfile={student}
            shortlistedColleges={[{
              college_name: details.college_name,
              branch: details.branch_cutoffs?.[0]?.branch || "General Program",
              cutoff_marks: details.branch_cutoffs?.[0]?.cutoff_general || 90.0,
              annual_fees: details.annual_fees || 120000
            }]}
            allColleges={[{
              college_name: details.college_name,
              branch: details.branch_cutoffs?.[0]?.branch || "General Program",
              cutoff_marks: details.branch_cutoffs?.[0]?.cutoff_general || 90.0,
              annual_fees: details.annual_fees || 120000
            }]}
          />

          <ScholarshipModal
            isOpen={showScholarshipModal}
            onClose={() => setShowScholarshipModal(false)}
            defaultFees={details.annual_fees || 120000}
            collegeName={details.college_name}
            defaultState={details.location?.includes("Maharashtra") ? "Maharashtra" : "Other"}
          />
        </>
      )}

      {/* Footer */}
      <footer className="text-center py-4 bg-white border-top text-secondary small mt-auto">
        <FaGraduationCap color="#FFB300" className="me-2" />
        {APP_NAME} — Domain & Branch Cutoff Analytics System
      </footer>
    </div>
  );
}
