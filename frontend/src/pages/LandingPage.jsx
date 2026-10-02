import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGraduationCap, FaUserGraduate, FaHeadset, FaUniversity, FaStar,
  FaCheckCircle, FaArrowRight, FaSignInAlt, FaSearch,
  FaAward, FaUsers, FaChartBar
} from "react-icons/fa";
import { MdSchool } from "react-icons/md";
import CollegeCard from "../components/CollegeCard";

export const APP_NAME = "Education Counsellor";
const API_BASE = "/api";

export default function LandingPage({ studentProfile }) {
  const navigate = useNavigate();
  const [featuredColleges, setFeaturedColleges] = useState([]);
  const [activeStream, setActiveStream] = useState("All");
  const [loading, setLoading] = useState(true);

  // Fetch featured colleges for the landing page showcase
  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/featured-colleges?stream=${activeStream}`);
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
      navigate("/chat", { state: { initialPrompt: `Tell me about ${college.college_name}: cutoffs, placements, and admission criteria.` } });
    } else {
      navigate("/profile");
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#F8F9FA" }}>
      {/* 1. HEADER / NAVBAR */}
      <nav
        className="navbar navbar-expand-lg px-4 px-md-5 py-3 sticky-top shadow-sm"
        style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)" }}
      >
        <div className="container-fluid p-0">
          <a className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold fs-5" href="/">
            <FaGraduationCap size={30} color="#FFB300" />
            <span style={{ fontFamily: "'Poppins', sans-serif", letterSpacing: "0.3px" }}>{APP_NAME}</span>
          </a>

          <div className="d-flex align-items-center gap-3 ms-auto">
            {studentProfile ? (
              <button
                className="btn btn-warning fw-bold px-4 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2"
                onClick={() => navigate("/dashboard")}
              >
                <span>Go to Dashboard</span>
                <FaArrowRight size={12} />
              </button>
            ) : (
              <button
                className="btn btn-warning fw-bold px-4 py-2 rounded-pill shadow-sm d-flex align-items-center gap-2"
                style={{ background: "linear-gradient(135deg, #FFB300 0%, #FF8F00 100%)", color: "#1A237E", border: "none" }}
                onClick={() => navigate("/profile")}
              >
                <FaSignInAlt size={14} />
                <span>Student Login / Profile</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SLIDER / CAROUSEL */}
      <div
        id="heroCarousel"
        className="carousel slide text-white"
        data-bs-ride="carousel"
        style={{ background: "linear-gradient(135deg, #1A237E 0%, #283593 50%, #1565C0 100%)" }}
      >
        <div className="carousel-indicators">
          <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active" aria-current="true"></button>
          <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1"></button>
          <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="2"></button>
        </div>

        <div className="carousel-inner py-5 text-center">
          {/* Slide 1 */}
          <div className="carousel-item active py-4">
            <div className="container" style={{ maxWidth: 840 }}>
              <span className="badge px-4 py-2 rounded-pill mb-3" style={{ background: "rgba(255,179,0,0.2)", border: "1px solid #FFB300", color: "#FFD54F" }}>
                ✨ Live AI Indian College Recommendations
              </span>
              <h1 className="fw-black mb-3" style={{ fontSize: "clamp(34px, 5.5vw, 64px)", lineHeight: 1.15, fontFamily: "'Poppins', sans-serif" }}>
                Find Your Ideal College <br />
                <span style={{ color: "#FFB300" }}>Based on Your Real Score</span>
              </h1>
              <p className="fs-5 text-white-50 mx-auto mb-4" style={{ maxWidth: 650 }}>
                Enter your marks and stream — our AI dynamically evaluates 5-year cutoffs, placement packages, and merit lists to find your best matches.
              </p>
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <button
                  className="btn btn-warning btn-lg fw-bold px-5 py-3 rounded-pill shadow-lg"
                  style={{ background: "linear-gradient(135deg, #FFB300, #FF8F00)", color: "#1A237E", border: "none" }}
                  onClick={() => navigate(studentProfile ? "/dashboard" : "/profile")}
                >
                  🚀 {studentProfile ? "Open My Dashboard" : "Get Started (Free Profile)"}
                </button>
                <a href="#colleges-section" className="btn btn-outline-light btn-lg fw-semibold px-4 py-3 rounded-pill">
                  Explore Top Colleges ↓
                </a>
              </div>
            </div>
          </div>

          {/* Slide 2 */}
          <div className="carousel-item py-4">
            <div className="container" style={{ maxWidth: 840 }}>
              <span className="badge px-4 py-2 rounded-pill mb-3 bg-success bg-opacity-25 border border-success text-white">
                🏛️ Premier Institutes Across Maharashtra & India
              </span>
              <h1 className="fw-black mb-3" style={{ fontSize: "clamp(34px, 5.5vw, 64px)", lineHeight: 1.15, fontFamily: "'Poppins', sans-serif" }}>
                COEP, VJTI, AIIMS & <br />
                <span style={{ color: "#FFB300" }}>Top Tier-1 Campuses</span>
              </h1>
              <p className="fs-5 text-white-50 mx-auto mb-4" style={{ maxWidth: 650 }}>
                Compare average placement CTC, campus facilities, NIRF rankings, and closing cutoff percentiles for general and reserved categories.
              </p>
              <button
                className="btn btn-warning btn-lg fw-bold px-5 py-3 rounded-pill shadow-lg"
                style={{ background: "linear-gradient(135deg, #FFB300, #FF8F00)", color: "#1A237E", border: "none" }}
                onClick={() => navigate(studentProfile ? "/dashboard" : "/profile")}
              >
                Check My Eligibility Now →
              </button>
            </div>
          </div>

          {/* Slide 3 */}
          <div className="carousel-item py-4">
            <div className="container" style={{ maxWidth: 840 }}>
              <span className="badge px-4 py-2 rounded-pill mb-3 bg-info bg-opacity-25 border border-info text-white">
                🤖 AI Counselor with Interactive Tables
              </span>
              <h1 className="fw-black mb-3" style={{ fontSize: "clamp(34px, 5.5vw, 64px)", lineHeight: 1.15, fontFamily: "'Poppins', sans-serif" }}>
                Instant Cutoff Tables & <br />
                <span style={{ color: "#FFB300" }}>Admission Deadlines</span>
              </h1>
              <p className="fs-5 text-white-50 mx-auto mb-4" style={{ maxWidth: 650 }}>
                Ask detailed questions like <em>"5-year cutoff comparison for CSE"</em> and get organized tables and counselor insights in seconds.
              </p>
              <button
                className="btn btn-warning btn-lg fw-bold px-5 py-3 rounded-pill shadow-lg"
                style={{ background: "linear-gradient(135deg, #FFB300, #FF8F00)", color: "#1A237E", border: "none" }}
                onClick={() => navigate(studentProfile ? "/chat" : "/profile")}
              >
                Chat with AI Counselor →
              </button>
            </div>
          </div>
        </div>

        {/* Carousel controls */}
        <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true"></span>
        </button>
      </div>

      {/* Quick Stats Bar */}
      <div className="container" style={{ marginTop: -35, position: "relative", zIndex: 10 }}>
        <div className="card border-0 shadow-lg rounded-4 p-4 bg-white">
          <div className="row text-center g-3">
            {[
              { num: "500+", label: "Verified Indian Colleges", icon: <FaUniversity className="text-primary fs-3 mb-1" /> },
              { num: "100% Live", label: "Real-Time AI Evaluation", icon: <FaUserGraduate className="text-warning fs-3 mb-1" /> },
              { num: "5-Year", label: "Cutoff Trend Analytics", icon: <FaChartBar className="text-success fs-3 mb-1" /> },
              { num: "Free", label: "For Every Indian Student", icon: <FaAward className="text-danger fs-3 mb-1" /> },
            ].map((s, idx) => (
              <div key={idx} className="col-6 col-md-3">
                {s.icon}
                <div className="fs-3 fw-black text-dark" style={{ fontFamily: "'Poppins', sans-serif" }}>{s.num}</div>
                <div className="text-secondary small fw-semibold">{s.label}</div>
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
          <h2 className="fw-black text-dark" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Featured Indian Colleges & Cutoffs
          </h2>
          <p className="text-secondary mx-auto" style={{ maxWidth: 600 }}>
            Browse top accredited institutions with real campus imagery, NIRF stats, and average placement packages.
          </p>

          {/* Stream Filter Pills */}
          <div className="d-flex justify-content-center gap-2 flex-wrap mt-3">
            {["All", "Engineering", "Medical"].map((stream) => (
              <button
                key={stream}
                className={`btn btn-sm rounded-pill px-4 py-2 fw-bold shadow-sm ${activeStream === stream ? "btn-primary" : "btn-outline-primary bg-white"}`}
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
                <CollegeCard
                  college={college}
                  onAskAI={handleCardAskAI}
                />
              </div>
            ))}
          </div>
        )}

        {/* CTA Banner to Login */}
        <div
          className="card border-0 rounded-4 p-4 p-md-5 mt-5 text-white text-center shadow-lg"
          style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)" }}
        >
          <h3 className="fw-black mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Want Personalized Recommendations for Your Score?
          </h3>
          <p className="text-white-50 mx-auto mb-4" style={{ maxWidth: 600 }}>
            Enter your 12th marks or entrance exam score (JEE / NEET / MHT-CET) to see your safe, borderline, and aspirational college dashboard.
          </p>
          <button
            className="btn btn-warning btn-lg fw-bold px-5 py-3 rounded-pill shadow-lg mx-auto"
            style={{ background: "linear-gradient(135deg, #FFB300, #FF8F00)", color: "#1A237E", border: "none" }}
            onClick={() => navigate("/profile")}
          >
            Create My Student Profile →
          </button>
        </div>
      </div>

      {/* 4. FOOTER */}
      <footer className="py-5" style={{ background: "#0D1457", color: "rgba(255,255,255,0.7)" }}>
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="d-flex align-items-center gap-2 text-white fw-bold fs-5 mb-2">
                <FaGraduationCap size={28} color="#FFB300" />
                <span style={{ fontFamily: "'Poppins', sans-serif" }}>{APP_NAME}</span>
              </div>
              <p className="small text-white-50 pe-lg-4">
                An open, AI-powered platform for Indian students across all educational streams.
                Empowering admissions with live cutoff predictions, merit trends, and smart counselor guidance.
              </p>
            </div>
            <div className="col-6 col-lg-3">
              <h6 className="text-white fw-bold mb-3">Quick Navigation</h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 text-white-50">
                <li><a href="#" className="text-white-50 text-decoration-none" onClick={() => navigate("/")}>Home</a></li>
                <li><a href="#colleges-section" className="text-white-50 text-decoration-none">Explore Colleges</a></li>
                <li><a href="#" className="text-white-50 text-decoration-none" onClick={() => navigate("/profile")}>Student Login</a></li>
                <li><a href="#" className="text-white-50 text-decoration-none" onClick={() => navigate("/chat")}>AI Counselor</a></li>
              </ul>
            </div>
            <div className="col-6 col-lg-4">
              <h6 className="text-white fw-bold mb-3">Streams Covered</h6>
              <div className="d-flex flex-wrap gap-1">
                {["Engineering", "Medical", "Commerce", "Arts", "Science", "Law", "Design"].map((st) => (
                  <span key={st} className="badge bg-light bg-opacity-10 text-white-50 border border-secondary" style={{ fontSize: 11 }}>
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
    </div>
  );
}
