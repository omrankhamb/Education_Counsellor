import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGraduationCap,
  FaUserGraduate,
  FaHeadset,
  FaUniversity,
  FaStar,
  FaCheckCircle,
  FaArrowRight,
  FaSignInAlt,
  FaSearch,
  FaAward,
  FaUsers,
  FaChartBar,
  FaBullseye,
  FaCoins,
  FaFileAlt,
} from "react-icons/fa";
import { MdSchool } from "react-icons/md";
import CollegeCard from "../components/CollegeCard";
import DocumentVerificationModal from "../components/DocumentVerificationModal";

export const APP_NAME = "Education Counsellor";
const API_BASE = "/api";

export default function LandingPage({ studentProfile, currentUser, onLogout }) {
  const navigate = useNavigate();
  const [featuredColleges, setFeaturedColleges] = useState([]);
  const [activeStream, setActiveStream] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showDocModal, setShowDocModal] = useState(false);

  // Dynamic Feature 1: Hero Carousel Auto-Play in React
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // Dynamic Feature 2: Typewriter Animated Headline that types on page load / refresh
  const rotatingPhrases = [
    "Based on Your Real Score",
    "Grounded in 5-Year Cutoffs",
    "Covering 3,000+ Colleges",
    "With Zero Allotment Risk",
    "For MHT-CET, NEET & JEE"
  ];
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [typedHeadline, setTypedHeadline] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const targetPhrase = rotatingPhrases[phraseIdx];
    const typingSpeed = isDeleting ? 30 : 65;

    const timer = setTimeout(() => {
      if (!isDeleting && typedHeadline === targetPhrase) {
        setTimeout(() => setIsDeleting(true), 1800);
      } else if (isDeleting && typedHeadline === "") {
        setIsDeleting(false);
        setPhraseIdx((prev) => (prev + 1) % rotatingPhrases.length);
      } else {
        setTypedHeadline(targetPhrase.substring(0, typedHeadline.length + (isDeleting ? -1 : 1)));
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [typedHeadline, isDeleting, phraseIdx]);

  // Dynamic Feature 3: Live Number Counting Animation on every browser load / refresh
  const [statCounters, setStatCounters] = useState({ colleges: 0, live: 0, years: 0 });

  useEffect(() => {
    let currentStep = 0;
    const totalSteps = 45;
    const stepDuration = 25; // 1.1s total

    const interval = setInterval(() => {
      currentStep++;
      const ratio = currentStep / totalSteps;
      // Ease out cubic
      const eased = 1 - Math.pow(1 - ratio, 3);
      setStatCounters({
        colleges: Math.round(eased * 3000),
        live: Math.round(eased * 100),
        years: Math.round(eased * 5)
      });
      if (currentStep >= totalSteps) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  // Fetch featured colleges for the landing page showcase
  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/featured-colleges?stream=${activeStream}`,
        );
        const data = await res.json();
        if (data.success && data.colleges) {
          setFeaturedColleges(data.colleges);
        }
      } catch (err) {
        console.error("Failed to load featured colleges", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, [activeStream]);

  const handleCardAskAI = (college) => {
    if (studentProfile) {
      navigate("/chat", {
        state: {
          initialPrompt: `Tell me about ${college.college_name}: cutoffs, placements, and admission criteria.`,
        },
      });
    } else {
      navigate("/login");
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#F8F9FA" }}>
      <style>{`
        @keyframes blinkCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeInSlide 0.4s ease-out forwards;
        }
      `}</style>
      {/* 1. HEADER / NAVBAR */}
      <nav
        className="navbar navbar-expand-lg px-4 px-md-5 py-3 sticky-top shadow-sm"
        style={{
          background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
        }}
      >
        <div className="container-fluid p-0">
          <a
            className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold fs-5"
            href="/"
          >
            <FaGraduationCap size={30} color="#FFB300" />
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                letterSpacing: "0.3px",
              }}
            >
              {APP_NAME}
            </span>
          </a>

          <div className="d-flex align-items-center gap-2 ms-auto flex-wrap">
            <button
              className="btn btn-sm fw-bold px-3 py-1.5 rounded-pill shadow-sm d-flex align-items-center gap-1"
              onClick={() => navigate("/cap-simulator")}
              style={{ background: "#FFFFFF", color: "#1A237E", border: "1px solid #FFFFFF", fontSize: 12 }}
              title="Centralized Admission Process (CAP) Rounds 1-4 Simulator & Option Table"
            >
              <FaBullseye size={12} color="#D97706" />
              <span>CAP Simulator</span>
            </button>
            <button
              className="btn btn-sm fw-bold px-3 py-1.5 rounded-pill shadow-sm d-flex align-items-center gap-1.5"
              onClick={() => navigate("/scholarships")}
              style={{
                background: "#FFFFFF",
                border: "1px solid #FFFFFF",
                fontSize: 12,
                color: "#1A237E"
              }}
              title="Browse 24+ Verified Buddy4Study & Government Scholarships"
            >
              <FaCoins size={12} color="#D97706" />
              <span>Scholarships</span>
            </button>
            <button
              className="btn btn-sm fw-bold px-3 py-1.5 rounded-pill shadow-sm d-flex align-items-center gap-1.5"
              onClick={() => setShowDocModal(true)}
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
            {currentUser ? (
              <>
                {studentProfile && (
                  <button
                    className="btn btn-sm fw-bold px-3 py-1.5 rounded-pill shadow-sm d-flex align-items-center gap-1"
                    onClick={() => navigate("/dashboard")}
                    style={{ background: "#FFFFFF", color: "#1A237E", border: "1px solid #FFFFFF", fontSize: 12 }}
                  >
                    <span>Dashboard</span>
                    <FaArrowRight size={11} color="#1A237E" />
                  </button>
                )}
                <button
                  className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-sm"
                  style={{ background: "#FFFFFF", color: "#DC2626", border: "1px solid #FFFFFF", fontSize: 12 }}
                  onClick={onLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-sm fw-bold px-3 py-1.5 rounded-pill shadow-sm"
                  style={{ background: "#FFFFFF", color: "#1A237E", border: "1px solid #FFFFFF", fontSize: 12 }}
                  onClick={() => navigate("/login")}
                >
                  <FaSignInAlt className="me-1" size={12} color="#1A237E" />
                  <span>Sign In</span>
                </button>
                <button
                  className="btn btn-sm fw-bold px-3.5 py-1.5 rounded-pill shadow-sm"
                  style={{
                    background: "#FFFFFF",
                    color: "#1A237E",
                    border: "1px solid #FFFFFF",
                    fontSize: 12
                  }}
                  onClick={() => navigate("/register")}
                >
                  <span>Register Free</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2. DYNAMIC HERO SLIDER & AUTO-CAROUSEL */}
      <div
        id="heroCarousel"
        className="text-white position-relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1A237E 0%, #283593 50%, #1565C0 100%)",
        }}
      >
        <div className="py-5 text-center">
          {/* Slide 1 */}
          {currentSlide === 0 && (
            <div className="py-4 animate-fade-in">
              <div className="container" style={{ maxWidth: 840 }}>
                <span
                  className="badge px-4 py-2 rounded-pill mb-3"
                  style={{
                    background: "rgba(255,179,0,0.2)",
                    border: "1px solid #FFB300",
                    color: "#FFD54F",
                  }}
                >
                  ✨ Live AI Indian College Recommendations
                </span>
                <h1
                  className="fw-black mb-3"
                  style={{
                    fontSize: "clamp(34px, 5.5vw, 64px)",
                    lineHeight: 1.18,
                    fontFamily: "'Poppins', sans-serif",
                    minHeight: "2.35em"
                  }}
                >
                  Find Your Ideal College <br />
                  <span style={{ color: "#FFB300" }}>
                    {typedHeadline}
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      width: 4,
                      height: "0.85em",
                      backgroundColor: "#FFB300",
                      marginLeft: 6,
                      verticalAlign: "baseline",
                      animation: "blinkCursor 0.8s infinite"
                    }}
                  />
                </h1>
                <p
                  className="fs-5 text-white-50 mx-auto mb-4"
                  style={{ maxWidth: 650 }}
                >
                  Enter your marks and stream — our AI dynamically evaluates
                  5-year cutoffs, placement packages, and merit lists to find your
                  best matches.
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <button
                    className="btn btn-warning btn-lg fw-bold px-5 py-3 rounded-pill shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, #FFB300, #FF8F00)",
                      color: "#1A237E",
                      border: "none",
                    }}
                    onClick={() =>
                      navigate(studentProfile ? "/dashboard" : "/profile")
                    }
                  >
                    🚀{" "}
                    {studentProfile
                      ? "Open My Dashboard"
                      : "Get Started (Free Profile)"}
                  </button>
                  <a
                    href="#colleges-section"
                    className="btn btn-lg fw-semibold px-4 py-3 rounded-pill shadow-sm"
                    style={{ background: "rgba(255, 255, 255, 0.22)", border: "1.5px solid rgba(255, 255, 255, 0.5)", color: "#FFFFFF" }}
                  >
                    Explore Top Colleges ↓
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Slide 2 */}
          {currentSlide === 1 && (
            <div className="py-4 animate-fade-in">
              <div className="container" style={{ maxWidth: 840 }}>
                <span className="badge px-4 py-2 rounded-pill mb-3 bg-success bg-opacity-25 border border-success text-white">
                  🏛️ Premier Institutes Across Maharashtra & India
                </span>
                <h1
                  className="fw-black mb-3"
                  style={{
                    fontSize: "clamp(34px, 5.5vw, 64px)",
                    lineHeight: 1.18,
                    fontFamily: "'Poppins', sans-serif",
                    minHeight: "2.35em"
                  }}
                >
                  COEP, VJTI, AIIMS & <br />
                  <span style={{ color: "#FFB300" }}>Top Tier-1 Campuses</span>
                </h1>
                <p
                  className="fs-5 text-white-50 mx-auto mb-4"
                  style={{ maxWidth: 650 }}
                >
                  Compare average placement CTC, campus facilities, NIRF rankings,
                  and closing cutoff percentiles for general and reserved
                  categories.
                </p>
                <button
                  className="btn btn-warning btn-lg fw-bold px-5 py-3 rounded-pill shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #FFB300, #FF8F00)",
                    color: "#1A237E",
                    border: "none",
                  }}
                  onClick={() =>
                    navigate(studentProfile ? "/dashboard" : "/profile")
                  }
                >
                  Check My Eligibility Now →
                </button>
              </div>
            </div>
          )}

          {/* Slide 3 */}
          {currentSlide === 2 && (
            <div className="py-4 animate-fade-in">
              <div className="container" style={{ maxWidth: 840 }}>
                <span className="badge px-4 py-2 rounded-pill mb-3 bg-info bg-opacity-25 border border-info text-white">
                  🤖 AI Counselor with Interactive Tables
                </span>
                <h1
                  className="fw-black mb-3"
                  style={{
                    fontSize: "clamp(34px, 5.5vw, 64px)",
                    lineHeight: 1.18,
                    fontFamily: "'Poppins', sans-serif",
                    minHeight: "2.35em"
                  }}
                >
                  Instant Cutoff Tables & <br />
                  <span style={{ color: "#FFB300" }}>Admission Deadlines</span>
                </h1>
                <p
                  className="fs-5 text-white-50 mx-auto mb-4"
                  style={{ maxWidth: 650 }}
                >
                  Ask detailed questions like{" "}
                  <em>"5-year cutoff comparison for CSE"</em> and get organized
                  tables and counselor insights in seconds.
                </p>
                <button
                  className="btn btn-warning btn-lg fw-bold px-5 py-3 rounded-pill shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #FFB300, #FF8F00)",
                    color: "#1A237E",
                    border: "none",
                  }}
                  onClick={() => navigate(studentProfile ? "/chat" : "/profile")}
                >
                  Chat with AI Counselor →
                </button>
              </div>
            </div>
          )}

          {/* Dynamic Carousel Indicators */}
          <div className="d-flex align-items-center justify-content-center gap-2 mt-4 pt-2">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className="border-0 rounded-pill p-0 transition-all shadow-sm"
                style={{
                  width: currentSlide === idx ? 28 : 10,
                  height: 8,
                  backgroundColor: currentSlide === idx ? "#FFB300" : "rgba(255, 255, 255, 0.4)",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Carousel Prev/Next Arrow Buttons */}
        <button
          className="carousel-control-prev"
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev - 1 + 3) % 3)}
          style={{ width: "8%", zIndex: 5 }}
        >
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        </button>
        <button
          className="carousel-control-next"
          type="button"
          onClick={() => setCurrentSlide((prev) => (prev + 1) % 3)}
          style={{ width: "8%", zIndex: 5 }}
        >
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
        </button>
      </div>

      {/* Dynamic Quick Stats Bar with Live Counter Animation */}
      <div
        className="container"
        style={{ marginTop: -35, position: "relative", zIndex: 10 }}
      >
        <div className="card border-0 shadow-lg rounded-4 p-4 bg-white">
          <div className="row text-center g-3">
            {[
              {
                num: `${statCounters.colleges.toLocaleString()}+`,
                label: "Verified Indian Colleges",
                icon: <FaUniversity className="text-primary fs-3 mb-1" />,
              },
              {
                num: `${statCounters.live}% Live`,
                label: "Real-Time AI Evaluation",
                icon: <FaUserGraduate className="text-warning fs-3 mb-1" />,
              },
              {
                num: `${statCounters.years}-Year`,
                label: "Cutoff Trend Analytics",
                icon: <FaChartBar className="text-success fs-3 mb-1" />,
              },
              {
                num: "Free",
                label: "For Every Indian Student",
                icon: <FaAward className="text-danger fs-3 mb-1" />,
              },
            ].map((s, idx) => (
              <div key={idx} className="col-6 col-md-3">
                {s.icon}
                <div
                  className="fs-3 fw-black text-dark"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {s.num}
                </div>
                <div className="text-secondary small fw-semibold">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. CARD OF THE COLLEGES SECTION */}
      <div id="colleges-section" className="container py-5 mt-4">
        <div className="text-center mb-4">
          <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-bold mb-2">
            🏛️ Explore Top Campuses
          </span>
          <h2
            className="fw-black text-dark"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Featured Indian Colleges & Cutoffs
          </h2>
          <p className="text-secondary mx-auto" style={{ maxWidth: 600 }}>
            Browse top accredited institutions with real campus imagery, NIRF
            stats, and average placement packages.
          </p>

          {/* Stream Filter Pills */}
          <div className="d-flex justify-content-center gap-2 flex-wrap mt-3">
            {["All", "Engineering", "Medical"].map((stream) => (
              <button
                key={stream}
                className="btn btn-sm rounded-pill px-4 py-2 fw-bold shadow-sm"
                style={{
                  background: activeStream === stream ? "linear-gradient(135deg, #1A237E, #3949AB)" : "#EFF6FF",
                  color: activeStream === stream ? "#FFFFFF" : "#1D4ED8",
                  border: activeStream === stream ? "none" : "1px solid #BFDBFE"
                }}
                onClick={() => setActiveStream(stream)}
              >
                {stream}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" />
            <p className="text-secondary">Loading featured colleges...</p>
          </div>
        )}

        {/* Colleges Grid */}
        {!loading && featuredColleges.length > 0 && (
          <div className="row g-4">
            {featuredColleges.map((college, idx) => (
              <div key={idx} className="col-12 col-md-6 col-lg-4">
                <CollegeCard college={college} onAskAI={handleCardAskAI} />
              </div>
            ))}
          </div>
        )}

        {/* CTA Banner to Login */}
        <div
          className="card border-0 rounded-4 p-4 p-md-5 mt-5 text-white text-center shadow-lg"
          style={{
            background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
          }}
        >
          <h3
            className="fw-black mb-2"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Want Personalized Recommendations for Your Score?
          </h3>
          <p className="text-white-50 mx-auto mb-4" style={{ maxWidth: 600 }}>
            Enter your 12th marks or entrance exam score (JEE / NEET / MHT-CET)
            to see your safe, borderline, and aspirational college dashboard.
          </p>
          <button
            className="btn btn-warning btn-lg fw-bold px-5 py-3 rounded-pill shadow-lg mx-auto"
            style={{
              background: "linear-gradient(135deg, #FFB300, #FF8F00)",
              color: "#1A237E",
              border: "none",
            }}
            onClick={() => navigate("/profile")}
          >
            Create My Student Profile →
          </button>
        </div>
      </div>

      {/* 4. FOOTER */}
      <footer
        className="py-5"
        style={{ background: "#0D1457", color: "rgba(255,255,255,0.7)" }}
      >
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="d-flex align-items-center gap-2 text-white fw-bold fs-5 mb-2">
                <FaGraduationCap size={28} color="#FFB300" />
                <span style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {APP_NAME}
                </span>
              </div>
              <p className="small text-white-50 pe-lg-4">
                An open, AI-powered platform for Indian students across all
                educational streams. Empowering admissions with live cutoff
                predictions, merit trends, and smart counselor guidance.
              </p>
            </div>
            <div className="col-6 col-lg-3">
              <h6 className="text-white fw-bold mb-3">Quick Navigation</h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 text-white-50">
                <li>
                  <a
                    href="#"
                    className="text-white-50 text-decoration-none"
                    onClick={() => navigate("/")}
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#colleges-section"
                    className="text-white-50 text-decoration-none"
                  >
                    Explore Colleges
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white-50 text-decoration-none"
                    onClick={() => navigate("/profile")}
                  >
                    Student Login
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white-50 text-decoration-none"
                    onClick={() => navigate("/chat")}
                  >
                    AI Counselor
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-6 col-lg-4">
              <h6 className="text-white fw-bold mb-3">Streams Covered</h6>
              <div className="d-flex flex-wrap gap-1">
                {[
                  "Engineering",
                  "Medical",
                  "Commerce",
                  "Arts",
                  "Science",
                  "Law",
                  "Design",
                ].map((st) => (
                  <span
                    key={st}
                    className="badge bg-light bg-opacity-10 text-white-50 border border-secondary"
                    style={{ fontSize: 11 }}
                  >
                    {st}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <hr className="my-4 border-secondary opacity-25" />

          <div className="d-flex justify-content-between align-items-center flex-wrap small text-white-50">
            <div>© 2026 {APP_NAME}. All rights reserved.</div>
            <div>Built for students with Advanced Education AI.</div>
          </div>
        </div>
      </footer>

      {/* Live Web-Grounded Document Verification & Eligibility Modal */}
      <DocumentVerificationModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        studentProfile={studentProfile}
      />
    </div>
  );
}
