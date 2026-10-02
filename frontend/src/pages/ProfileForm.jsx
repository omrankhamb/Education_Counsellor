import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaGraduationCap, FaUser, FaMapMarkerAlt,
  FaMoneyBillWave, FaUniversity, FaArrowLeft
} from "react-icons/fa";
import { MdSchool } from "react-icons/md";
import { APP_NAME } from "./LandingPage";

const STREAMS = ["Engineering", "Medical", "Arts", "Commerce", "Science", "Law", "Design"];
const EXAM_TYPES = {
  Engineering: ["JEE Main", "JEE Advanced", "MHT-CET", "State CET", "12th %"],
  Medical: ["NEET", "12th %"],
  Arts: ["12th %", "CUET", "DU Entrance"],
  Commerce: ["12th %", "CUET", "CAT (MBA)", "IPM"],
  Science: ["12th %", "CUET", "IISER Aptitude", "JAM"],
  Law: ["CLAT", "AILET", "LSAT", "12th %"],
  Design: ["NID Entrance", "NIFT Entrance", "UCEED", "12th %"],
};
const STATES = [
  "Any", "Maharashtra", "Delhi", "Tamil Nadu", "Karnataka", "West Bengal",
  "Telangana", "Rajasthan", "Gujarat", "Uttar Pradesh", "Kerala",
  "Madhya Pradesh", "Odisha", "Puducherry", "Andhra Pradesh", "Punjab",
];

export default function ProfileForm({ onSubmit, existingProfile }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", age: "", stream: "Engineering", marks: "", exam_type: "MHT-CET",
    preferred_state: "Maharashtra", budget: "Any", college_type: "Any",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existingProfile) {
      setForm(existingProfile);
    } else {
      const saved = localStorage.getItem("edu_student_profile");
      if (saved) {
        try {
          setForm(JSON.parse(saved));
        } catch {}
      }
    }
  }, [existingProfile]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.age || form.age < 14 || form.age > 35) e.age = "Enter valid age (14–35)";
    if (!form.stream) e.stream = "Select your stream";
    if (!form.marks || form.marks < 0 || form.marks > 100) e.marks = "Enter valid marks/percentile (0–100)";
    if (!form.exam_type) e.exam_type = "Select exam type";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const profile = {
      ...form,
      age: parseInt(form.age),
      marks: parseFloat(form.marks)
    };
    localStorage.setItem("edu_student_profile", JSON.stringify(profile));
    onSubmit(profile);
    // NAVIGATE TO DASHBOARD (NOT CHAT DIRECTLY)
    navigate("/dashboard");
  };

  const examOptions = form.stream ? (EXAM_TYPES[form.stream] || ["12th %"]) : [];

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: "#F5F7FA", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <nav className="navbar px-4 px-md-5 py-3 shadow-sm" style={{ background: "linear-gradient(135deg, #1A237E, #3949AB)" }}>
        <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
          <span className="navbar-brand d-flex align-items-center gap-2 text-white fw-bold fs-5 m-0" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
            <FaGraduationCap size={28} color="#FFB300" />
            <span style={{ fontFamily: "'Poppins', sans-serif" }}>{APP_NAME}</span>
          </span>

          <button
            className="btn btn-outline-light btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1"
            onClick={() => navigate("/")}
          >
            <FaArrowLeft size={11} /> Back to Home
          </button>
        </div>
      </nav>

      {/* Form Card Container */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-3 p-md-5">
        <div className="card border-0 shadow-lg w-100" style={{ maxWidth: 660, borderRadius: 24, overflow: "hidden" }}>
          {/* Top Decorative Header */}
          <div className="p-4 text-white" style={{ background: "linear-gradient(135deg, #1A237E 0%, #283593 100%)" }}>
            <span className="badge bg-warning text-dark mb-2 px-3 py-1 fw-bold">Step 1 of 2</span>
            <h4 className="fw-black mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Student Admission Profile
            </h4>
            <p className="text-white-50 small mb-0">
              Provide your academic score to unlock your custom college recommendation dashboard.
            </p>
          </div>

          <form className="card-body p-4 p-md-5" onSubmit={handleSubmit}>
            {/* Name & Age */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-8">
                <label className="form-label fw-bold text-primary small text-uppercase">
                  <FaUser className="me-1 text-warning" /> Full Name
                </label>
                <input
                  className={`form-control form-control-lg ${errors.name ? "is-invalid" : ""}`}
                  placeholder="e.g. Omprasad"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ borderRadius: 12, fontSize: 15 }}
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>
              <div className="col-12 col-sm-4">
                <label className="form-label fw-bold text-primary small text-uppercase">Age</label>
                <input
                  className={`form-control form-control-lg ${errors.age ? "is-invalid" : ""}`}
                  type="number"
                  placeholder="e.g. 18"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  style={{ borderRadius: 12, fontSize: 15 }}
                />
                {errors.age && <div className="invalid-feedback">{errors.age}</div>}
              </div>
            </div>

            <hr className="my-3 opacity-25" />

            {/* Stream */}
            <div className="mb-3">
              <label className="form-label fw-bold text-primary small text-uppercase">
                <MdSchool className="me-1" /> Educational Stream
              </label>
              <div className="d-flex flex-wrap gap-2">
                {STREAMS.map((st) => (
                  <button
                    type="button"
                    key={st}
                    className={`btn btn-sm fw-semibold ${form.stream === st ? "btn-primary shadow-sm" : "btn-outline-primary bg-light"}`}
                    style={{ borderRadius: 9999, padding: "6px 16px" }}
                    onClick={() => setForm({ ...form, stream: st, exam_type: EXAM_TYPES[st]?.[0] || "12th %" })}
                  >
                    {st}
                  </button>
                ))}
              </div>
              {errors.stream && <div className="text-danger small mt-1">{errors.stream}</div>}
            </div>

            {/* Exam Type & Score in Row */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label className="form-label fw-bold text-primary small text-uppercase">📝 Exam Appeared / Basis</label>
                <select
                  className={`form-select form-select-lg ${errors.exam_type ? "is-invalid" : ""}`}
                  value={form.exam_type}
                  onChange={(e) => setForm({ ...form, exam_type: e.target.value })}
                  style={{ borderRadius: 12, fontSize: 15 }}
                >
                  {examOptions.map((ex) => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
                {errors.exam_type && <div className="invalid-feedback">{errors.exam_type}</div>}
              </div>

              <div className="col-12 col-sm-6">
                <label className="form-label fw-bold text-primary small text-uppercase">📊 Your Score / Percentile (%)</label>
                <input
                  className={`form-control form-control-lg ${errors.marks ? "is-invalid" : ""}`}
                  type="number"
                  step="0.01"
                  placeholder="e.g. 92.5 or 76.66"
                  value={form.marks}
                  onChange={(e) => setForm({ ...form, marks: e.target.value })}
                  style={{ borderRadius: 12, fontSize: 15 }}
                />
                {errors.marks && <div className="invalid-feedback">{errors.marks}</div>}
              </div>
            </div>

            <hr className="my-3 opacity-25" />

            {/* State & College Type */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-sm-6">
                <label className="form-label fw-bold text-primary small text-uppercase">
                  <FaMapMarkerAlt className="me-1 text-danger" /> Target Location / State
                </label>
                <select
                  className="form-select form-select-lg"
                  value={form.preferred_state}
                  onChange={(e) => setForm({ ...form, preferred_state: e.target.value })}
                  style={{ borderRadius: 12, fontSize: 15 }}
                >
                  {STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-sm-6">
                <label className="form-label fw-bold text-primary small text-uppercase">
                  <FaUniversity className="me-1 text-success" /> College Type
                </label>
                <select
                  className="form-select form-select-lg"
                  value={form.college_type}
                  onChange={(e) => setForm({ ...form, college_type: e.target.value })}
                  style={{ borderRadius: 12, fontSize: 15 }}
                >
                  <option value="Any">Both Government & Private</option>
                  <option value="Government">Government / Autonomous Only</option>
                  <option value="Private">Private Universities Only</option>
                </select>
              </div>
            </div>

            {/* Budget */}
            <div className="mb-4">
              <label className="form-label fw-bold text-primary small text-uppercase">
                <FaMoneyBillWave className="me-1 text-success" /> Annual Fee Budget
              </label>
              <div className="d-flex flex-wrap gap-2">
                {["Any", "<1L", "<3L", "3-8L", "8L+"].map((b) => (
                  <button
                    type="button"
                    key={b}
                    className={`btn btn-sm fw-semibold ${form.budget === b ? "btn-warning shadow-sm" : "btn-outline-warning text-dark bg-light"}`}
                    style={{ borderRadius: 10, padding: "6px 14px" }}
                    onClick={() => setForm({ ...form, budget: b })}
                  >
                    {b === "Any" ? "Any Budget" : b + "/yr"}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-lg w-100 fw-bold py-3 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
                color: "#ffffff",
                borderRadius: 14,
                fontSize: 16
              }}
            >
              🚀 View My College Recommendation Dashboard →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
