import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  FaGraduationCap, FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash,
  FaArrowLeft, FaCheckCircle, FaExclamationCircle
} from "react-icons/fa";
import { APP_NAME } from "./LandingPage";

const API_BASE = "/api";

export default function AuthPage({ onAuthSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  // If redirected with mode='signup', open sign up tab
  const [isLogin, setIsLogin] = useState(
    location.pathname === "/register" || location.search.includes("mode=signup") ? false : true
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: true,
    acceptTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.email || !form.email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!form.password || form.password.length < 4) {
      setErrorMsg("Password must be at least 4 characters.");
      return;
    }

    if (!isLogin) {
      if (!form.name.trim()) {
        setErrorMsg("Please enter your full name.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
      if (!form.acceptTerms) {
        setErrorMsg("Please accept the terms and conditions.");
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
      const payload = isLogin
        ? { email: form.email.trim(), password: form.password }
        : { name: form.name.trim(), email: form.email.trim(), password: form.password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication request failed.");
      }

      setSuccessMsg(isLogin ? "Login successful! Redirecting..." : "Account created successfully! Let's set up your profile...");

      // Store authenticated user in localStorage
      localStorage.setItem("edu_user", JSON.stringify(data.user));

      if (onAuthSuccess) {
        onAuthSuccess(data.user);
      }

      setTimeout(() => {
        // If user already has a completed profile in MongoDB, take them to dashboard
        if (data.user?.profile) {
          localStorage.setItem("edu_student_profile", JSON.stringify(data.user.profile));
          navigate("/dashboard");
        } else {
          // Otherwise take them to complete their stream & marks profile
          navigate("/profile");
        }
      }, 700);

    } catch (err) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo account fill for rapid testing
  const handleQuickDemo = (role) => {
    if (role === "demo_student") {
      setForm({
        ...form,
        name: "Omprasad Student",
        email: "student@education.com",
        password: "password123",
        confirmPassword: "password123",
      });
    }
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column position-relative"
      style={{
        background: "#F5F7FA",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Top Navbar Matching Dashboard */}
      <nav
        className="navbar navbar-expand-lg px-3 px-md-4 py-2 sticky-top shadow-sm"
        style={{
          background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
          zIndex: 1030
        }}
      >
        <div className="container-fluid px-0 d-flex align-items-center justify-content-between">
          <Link
            to="/"
            className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold mb-0 text-decoration-none"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <FaGraduationCap size={28} color="#FFB300" />
            <span className="fs-5 text-white">{APP_NAME}</span>
          </Link>

          <button
            className="btn btn-sm fw-semibold px-3 py-1.5 rounded-pill shadow-sm d-flex align-items-center gap-1.5"
            style={{ background: "#FFFFFF", color: "#1A237E", border: "1px solid #FFFFFF", fontSize: 12.5 }}
            onClick={() => navigate("/")}
          >
            <FaArrowLeft size={11} />
            <span>Back to Home</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-3 p-md-5">
        <div
          className="card border-0 w-100 overflow-hidden"
          style={{
            maxWidth: 960,
            borderRadius: 24,
            background: "#ffffff",
            border: "1px solid #E2E8F0",
            boxShadow: "0 20px 45px -12px rgba(26, 35, 126, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="row g-0">
            {/* LEFT COLUMN: Modern Vector Graphic Illustration */}
            <div
              className="col-12 col-lg-6 d-flex flex-column align-items-center justify-content-center p-4 p-md-5"
              style={{
                background: "linear-gradient(145deg, #F8FAFC 0%, #EEF2F6 100%)",
                borderRight: "1px solid #E2E8F0",
              }}
            >
              {/* Custom SVG Illustration representing Girl with Key and Smartphone Security / Login */}
              <div className="w-100 text-center mb-4" style={{ maxWidth: 360 }}>
                <svg
                  viewBox="0 0 500 420"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: "100%", height: "auto", maxHeight: 310 }}
                >
                  <circle cx="250" cy="210" r="160" fill="#E0E7FF" fillOpacity="0.4" />
                  <ellipse cx="250" cy="380" rx="190" ry="18" fill="#CBD5E1" fillOpacity="0.5" />
                  
                  {/* Smartphone Device */}
                  <rect x="80" y="70" width="130" height="270" rx="24" fill="#2C344E" />
                  <rect x="86" y="80" width="118" height="250" rx="18" fill="#1E2438" />
                  <circle cx="145" cy="90" r="4" fill="#64748B" />
                  <rect x="130" y="318" width="30" height="4" rx="2" fill="#64748B" />
                  
                  {/* Device Screen UI */}
                  <path d="M96 140 Q 145 100 194 150" stroke="#4F46E5" strokeWidth="2" strokeDasharray="3 3" />
                  <path d="M96 180 Q 145 220 194 170" stroke="#06B6D4" strokeWidth="2" strokeDasharray="3 3" />
                  
                  {/* Lock Oval Center Badge */}
                  <rect x="70" y="185" width="150" height="44" rx="22" fill="#FFFFFF" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.15))" />
                  <circle cx="145" cy="207" r="15" fill="#3B82F6" />
                  {/* Keyhole */}
                  <circle cx="145" cy="204" r="4" fill="#FFFFFF" />
                  <polygon points="143,205 147,205 148,213 142,213" fill="#FFFFFF" />
                  
                  {/* Plant/Flowers near base */}
                  <path d="M125 380 Q 130 330 145 300" stroke="#1E293B" strokeWidth="3" fill="none" />
                  <circle cx="145" cy="298" r="5" fill="#60A5FA" />
                  <circle cx="138" cy="325" r="4" fill="#93C5FD" />
                  <circle cx="148" cy="345" r="4" fill="#BFDBFE" />
                  <path d="M150 380 Q 170 330 160 270" stroke="#1E293B" strokeWidth="3" fill="none" />
                  <circle cx="160" cy="268" r="6" fill="#3B82F6" />
                  <circle cx="165" cy="295" r="4" fill="#60A5FA" />
                  <circle cx="155" cy="335" r="4" fill="#93C5FD" />

                  {/* Girl Character */}
                  {/* Hair Back */}
                  <path d="M295 125 C 270 120, 260 170, 275 220 C 285 240, 315 220, 310 180 Z" fill="#1E293B" />
                  
                  {/* Head & Neck */}
                  <circle cx="310" cy="140" r="22" fill="#FED7AA" />
                  <rect x="306" y="158" width="8" height="15" fill="#FED7AA" />
                  
                  {/* Hair Front */}
                  <path d="M295 130 C 300 115, 335 115, 330 140 C 320 135, 310 135, 300 145 Z" fill="#1E293B" />
                  
                  {/* T-Shirt (Blue) */}
                  <path d="M290 170 L 330 170 L 338 215 L 282 215 Z" fill="#3B82F6" />
                  {/* Arms */}
                  <path d="M285 175 L 272 230 L 282 232 L 292 185 Z" fill="#FED7AA" />
                  <path d="M333 175 L 348 230 L 338 233 L 328 185 Z" fill="#FED7AA" />
                  
                  {/* Dungarees / Dress (Dark Navy) */}
                  <path d="M294 185 L 326 185 L 335 250 L 285 250 Z" fill="#1E2438" />
                  {/* Straps */}
                  <rect x="298" y="170" width="5" height="20" fill="#1E2438" />
                  <rect x="317" y="170" width="5" height="20" fill="#1E2438" />
                  
                  {/* Legs */}
                  <rect x="294" y="250" width="12" height="115" rx="5" fill="#FED7AA" />
                  <rect x="314" y="250" width="12" height="115" rx="5" fill="#FED7AA" />
                  {/* Shoes */}
                  <ellipse cx="300" cy="368" rx="10" ry="6" fill="#1E2438" />
                  <ellipse cx="322" cy="368" rx="10" ry="6" fill="#1E2438" />
                  
                  {/* Giant Blue Key in Hand */}
                  <g transform="rotate(-30 270 240)">
                    <circle cx="260" cy="245" r="16" stroke="#2563EB" strokeWidth="6" fill="none" />
                    <rect x="273" y="242" width="55" height="6" rx="3" fill="#2563EB" />
                    <rect x="310" y="248" width="6" height="10" rx="2" fill="#2563EB" />
                    <rect x="320" y="248" width="6" height="7" rx="2" fill="#2563EB" />
                  </g>
                </svg>
              </div>

              <div className="text-center px-2">
                <h5 className="fw-bold mb-1" style={{ color: "#1A237E", fontFamily: "'Poppins', sans-serif" }}>
                  Your Academic Gateway
                </h5>
                <p className="text-secondary small mb-3">
                  Log in to securely track your admission feasibility, live cutoff trends, and personalized counselor guidance.
                </p>
                <div className="d-flex align-items-center justify-content-center gap-2 text-primary small fw-semibold">
                  <FaGraduationCap size={15} color="#FFB300" />
                  <span>Verified 2025–2026 Academic Guidance Portal</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Form Controls Matching User Image */}
            <div className="col-12 col-lg-6 p-4 p-md-5 d-flex flex-column justify-content-center">
              {/* Tab Selector */}
              <div className="d-flex border-bottom pb-2 mb-4 justify-content-between align-items-center">
                <div className="d-flex gap-3">
                  <button
                    type="button"
                    className="btn p-0 fw-bold border-0"
                    style={{
                      fontSize: 18,
                      fontFamily: "'Poppins', sans-serif",
                      borderBottom: isLogin ? "3px solid #1A237E" : "3px solid transparent",
                      color: isLogin ? "#1A237E" : "#94A3B8",
                      borderRadius: 0,
                      paddingBottom: "6px"
                    }}
                    onClick={() => { setIsLogin(true); setErrorMsg(""); setSuccessMsg(""); }}
                  >
                    SIGN IN
                  </button>

                  <button
                    type="button"
                    className="btn p-0 fw-bold border-0"
                    style={{
                      fontSize: 18,
                      fontFamily: "'Poppins', sans-serif",
                      borderBottom: !isLogin ? "3px solid #1A237E" : "3px solid transparent",
                      color: !isLogin ? "#1A237E" : "#94A3B8",
                      borderRadius: 0,
                      paddingBottom: "6px"
                    }}
                    onClick={() => { setIsLogin(false); setErrorMsg(""); setSuccessMsg(""); }}
                  >
                    SIGN UP
                  </button>
                </div>

                <span className="badge rounded-pill px-3 py-1.5 fw-semibold" style={{ background: "#EEF2F6", color: "#1A237E", border: "1px solid #E2E8F0" }}>
                  {isLogin ? "Returning Student" : "New Registration"}
                </span>
              </div>

              {/* Error / Success Alerts */}
              {errorMsg && (
                <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3 rounded-3">
                  <FaExclamationCircle className="flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-3 rounded-3">
                  <FaCheckCircle className="flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Full Name (Sign Up only) */}
                {!isLogin && (
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-semibold mb-1">
                      Full Name
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 text-muted">
                        <FaUser size={14} />
                      </span>
                      <input
                        type="text"
                        name="name"
                        className="form-control border-start-0 py-2"
                        placeholder="e.g. Omprasad"
                        value={form.name}
                        onChange={handleChange}
                        required={!isLogin}
                        style={{ fontSize: 14 }}
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold mb-1">
                    Email address
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <FaEnvelope size={14} />
                    </span>
                    <input
                      type="email"
                      name="email"
                      className="form-control border-start-0 py-2"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                      style={{ fontSize: 14 }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label text-secondary small fw-semibold mb-0">
                      Password
                    </label>
                    {isLogin && (
                      <span
                        className="small fw-semibold"
                        style={{ cursor: "pointer", fontSize: 12, color: "#1A237E" }}
                        onClick={() => alert("To reset password in local mode, contact system administrator or re-register with a new email.")}
                      >
                        Forgot password?
                      </span>
                    )}
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <FaLock size={14} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="form-control border-start-0 border-end-0 py-2"
                      placeholder="Enter password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      style={{ fontSize: 14 }}
                    />
                    <button
                      type="button"
                      className="input-group-text bg-white border-start-0 text-muted"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (Sign Up only) */}
                {!isLogin && (
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-semibold mb-1">
                      Confirm Password
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 text-muted">
                        <FaLock size={14} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        className="form-control border-start-0 py-2"
                        placeholder="Re-enter password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        required={!isLogin}
                        style={{ fontSize: 14 }}
                      />
                    </div>
                  </div>
                )}

                {/* Remember Me & Terms Checkbox */}
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberCheck"
                      name={isLogin ? "rememberMe" : "acceptTerms"}
                      checked={isLogin ? form.rememberMe : form.acceptTerms}
                      onChange={handleChange}
                    />
                    <label className="form-check-label small text-secondary" htmlFor="rememberCheck" style={{ fontSize: 13 }}>
                      {isLogin ? (
                        <>Remember me <span className="text-decoration-underline ms-2 fw-semibold" style={{ cursor: "pointer", color: "#1A237E" }}>Terms and conditions</span></>
                      ) : (
                        <>I agree to the <span className="text-decoration-underline fw-semibold" style={{ cursor: "pointer", color: "#1A237E" }}>Terms and conditions</span></>
                      )}
                    </label>
                  </div>
                </div>

                {/* Primary Action Button Matching Dashboard Theme */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn w-100 fw-bold py-2 shadow-sm mb-3 text-uppercase text-white"
                  style={{
                    background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
                    border: "none",
                    borderRadius: 8,
                    letterSpacing: "0.5px",
                    fontSize: 14,
                    height: 44,
                  }}
                >
                  {loading ? (
                    <div className="spinner-border spinner-border-sm text-light" role="status" />
                  ) : isLogin ? (
                    "SIGN IN"
                  ) : (
                    "SIGN UP"
                  )}
                </button>

                {/* OR Divider */}
                <div className="position-relative text-center my-3">
                  <hr className="text-muted opacity-25 m-0" />
                  <span
                    className="position-absolute top-50 start-50 translate-middle bg-white px-3 small text-muted fw-bold"
                    style={{ fontSize: 11 }}
                  >
                    OR
                  </span>
                </div>

                {/* Quick Auto-Fill Demo Button for Fast Testing */}
                <button
                  type="button"
                  className="btn w-100 py-2 small fw-semibold mb-3 rounded-2 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => handleQuickDemo("demo_student")}
                  style={{
                    fontSize: 13,
                    background: "#F8FAFC",
                    border: "1px solid #C7D2FE",
                    color: "#1A237E"
                  }}
                >
                  ⚡ Auto-Fill Demo Student Credentials
                </button>

                {/* Bottom Switch Toggle */}
                <div className="text-center small text-secondary mt-2">
                  {isLogin ? (
                    <>
                      Don't have an account?{" "}
                      <span
                        className="fw-bold text-decoration-underline"
                        style={{ cursor: "pointer", color: "#1A237E" }}
                        onClick={() => { setIsLogin(false); setErrorMsg(""); setSuccessMsg(""); }}
                      >
                        Sign Up now
                      </span>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <span
                        className="fw-bold text-decoration-underline"
                        style={{ cursor: "pointer", color: "#1A237E" }}
                        onClick={() => { setIsLogin(true); setErrorMsg(""); setSuccessMsg(""); }}
                      >
                        Sign In
                      </span>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
