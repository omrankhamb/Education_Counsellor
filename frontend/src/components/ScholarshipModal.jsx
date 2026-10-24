import React, { useState, useEffect, useMemo } from "react";
import {
  FaMoneyBillWave, FaUniversity, FaCheckCircle, FaTimesCircle, FaExternalLinkAlt,
  FaFemale, FaHome, FaInfoCircle, FaHandHoldingUsd, FaPiggyBank, FaTimes,
  FaGraduationCap, FaSearch, FaFilter, FaFileAlt, FaChevronDown, FaChevronUp,
  FaAward, FaBuilding, FaExclamationTriangle, FaCoins, FaUserGraduate
} from "react-icons/fa";

export default function ScholarshipModal({
  isOpen,
  onClose,
  defaultFees = 140000,
  collegeName = "",
  defaultState = "Maharashtra",
  studentProfile = {}
}) {
  if (!isOpen) return null;

  // Active view tab: 'scholarships' (Buddy4Study & Govt by domain) vs 'calculator' (Statutory Fee Subsidy)
  const [activeTab, setActiveTab] = useState("scholarships");

  // Core filter criteria
  const [stream, setStream] = useState(studentProfile?.stream || "All");
  const [fees, setFees] = useState(defaultFees || 140000);
  const [category, setCategory] = useState("OPEN");
  const [income, setIncome] = useState(500000);
  const [tenthMarks, setTenthMarks] = useState(80);
  const [twelfthMarks, setTwelfthMarks] = useState(
    studentProfile?.marks ? Math.min(100, Math.round(studentProfile.marks)) : 85
  );
  const [gender, setGender] = useState("Male");
  const [state, setState] = useState(defaultState || "Maharashtra");
  const [isHosteler, setIsHosteler] = useState(true);

  // Search & Secondary Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState("All"); // 'All', 'Buddy4Study', 'Government'
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState({});

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch updated scholarships and fee calculation from backend
  const fetchScholarshipData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calculate-scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annual_fees: Number(fees),
          category,
          family_income: Number(income),
          gender,
          state,
          is_hosteler: isHosteler,
          stream,
          tenth_marks: Number(tenthMarks),
          twelfth_marks: Number(twelfthMarks),
          provider_type: providerFilter
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
      }
    } catch (err) {
      console.error("Scholarship calculation error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScholarshipData();
  }, [fees, category, income, gender, state, isHosteler, stream, tenthMarks, twelfthMarks, providerFilter]);

  const toggleDocExpand = (id) => {
    setExpandedDocs((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const summary = result?.financial_summary;
  const rawScholarships = result?.all_scholarships || [];

  // Filter scholarships by client-side search query and "only eligible" toggle
  const filteredScholarships = useMemo(() => {
    return rawScholarships.filter((sch) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        sch.scheme_name.toLowerCase().includes(q) ||
        sch.provider.toLowerCase().includes(q) ||
        sch.other_criteria.toLowerCase().includes(q) ||
        sch.domain.some((d) => d.toLowerCase().includes(q));

      const matchesEligible = onlyEligible ? sch.is_eligible : true;

      return matchesSearch && matchesEligible;
    });
  }, [rawScholarships, searchQuery, onlyEligible]);

  const eligibleCount = rawScholarships.filter((s) => s.is_eligible).length;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ background: "rgba(15, 23, 42, 0.75)", zIndex: 1070 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 1140 }}
      >
        <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden" style={{ maxHeight: "92vh" }}>
          
          {/* ================= MODAL HEADER (Signature Indigo Theme) ================= */}
          <div
            className="modal-header text-white px-4 py-3"
            style={{ background: "linear-gradient(135deg, #1A237E 0%, #283593 50%, #3949AB 100%)" }}
          >
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle p-2 bg-white bg-opacity-20 d-flex align-items-center justify-content-center">
                <FaGraduationCap size={24} color="#FFB300" />
              </div>
              <div>
                <h5 className="modal-title fw-bold m-0 d-flex align-items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  <span>🎓 Scholarships &amp; Fee Waiver Hub</span>
                  <span className="badge px-2.5 py-0.5 rounded-pill" style={{ background: "#FFB300", color: "#1A237E", fontSize: 11 }}>
                    Buddy4Study + Govt Schemes
                  </span>
                </h5>
                <span className="small text-white-50">
                  {collegeName
                    ? `Evaluating scholarships & concessions for: ${collegeName}`
                    : "Find private corporate CSR & government scholarships by domain, family income, 10th & 12th marks"}
                </span>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>

          {/* ================= MODAL BODY ================= */}
          <div className="modal-body p-3 p-md-4 bg-light overflow-auto">
            
            {/* ================= ELIGIBILITY & CRITERIA FILTER BAR ================= */}
            <div className="p-3 bg-white rounded-3 border shadow-sm mb-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                  <FaFilter className="text-success" size={14} />
                  <span>Your Academic & Financial Profile:</span>
                </h6>
                <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2.5 py-1 small fw-semibold">
                  Auto-Matches Criteria
                </span>
              </div>

              <div className="row g-2.5">
                
                {/* 1. Target Domain / Stream */}
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label small fw-bold text-secondary mb-1">Domain / Stream:</label>
                  <select
                    className="form-select form-select-sm"
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    style={{ fontSize: 12.5 }}
                  >
                    <option value="All">All Domains (Engineering, Medical, etc.)</option>
                    <option value="Engineering">🛠️ Engineering / Technology</option>
                    <option value="Medical">🩺 Medical / MBBS / BDS / Nursing</option>
                    <option value="Commerce">💼 Commerce & Management (BBA/B.Com)</option>
                    <option value="Sciences">🔬 Pure & Applied Sciences (B.Sc)</option>
                    <option value="Design">🎨 Design & Architecture (B.Des/B.Arch)</option>
                    <option value="Law">⚖️ Law (Integrated 5-Year LLB)</option>
                    <option value="Arts">📚 Arts & Humanities (BA)</option>
                  </select>
                </div>

                {/* 2. Caste / Category */}
                <div className="col-12 col-sm-6 col-md-3">
                  <label className="form-label small fw-bold text-secondary mb-1">Caste / Category:</label>
                  <select
                    className="form-select form-select-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ fontSize: 12.5 }}
                  >
                    <option value="OPEN">OPEN / General</option>
                    <option value="EWS">EWS (Economically Weaker Section)</option>
                    <option value="OBC">OBC (Other Backward Class with NCL)</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                    <option value="VJNT">VJ / NT / SBC</option>
                    <option value="TFWS">TFWS (Admitted via 5% Waiver Quota)</option>
                  </select>
                </div>

                {/* 3. 10th Marks (%) */}
                <div className="col-6 col-md-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-bold text-secondary mb-0">Class 10th Score:</label>
                    <span className="badge bg-light text-dark border small fw-bold">{tenthMarks}%</span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="40"
                    max="100"
                    step="1"
                    value={tenthMarks}
                    onChange={(e) => setTenthMarks(Number(e.target.value))}
                  />
                </div>

                {/* 4. 12th Marks (%) */}
                <div className="col-6 col-md-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-bold text-secondary mb-0">Class 12th Score:</label>
                    <span className="badge bg-light text-dark border small fw-bold">{twelfthMarks}%</span>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="40"
                    max="100"
                    step="1"
                    value={twelfthMarks}
                    onChange={(e) => setTwelfthMarks(Number(e.target.value))}
                  />
                </div>

                {/* 5. Annual Family Income */}
                <div className="col-12 col-md-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-bold text-secondary mb-0">
                      Family Income: <span className="text-primary fw-bold">₹{(income / 100000).toFixed(1)} Lakhs / yr</span>
                    </label>
                  </div>
                  <input
                    type="range"
                    className="form-range"
                    min="50000"
                    max="1500000"
                    step="25000"
                    value={income}
                    onChange={(e) => setIncome(Number(e.target.value))}
                  />
                  <div className="d-flex justify-content-between text-muted" style={{ fontSize: 10 }}>
                    <span>&lt; ₹1.0L</span>
                    <span>₹2.5L (EWS)</span>
                    <span>₹6.0L (CSR)</span>
                    <span>₹8.0L (EBC)</span>
                    <span>₹15.0L</span>
                  </div>
                </div>

                {/* 6. Gender */}
                <div className="col-6 col-md-2">
                  <label className="form-label small fw-bold text-secondary mb-1">Gender:</label>
                  <select
                    className="form-select form-select-sm"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{ fontSize: 12.5 }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female (Girls CSR Eligible)</option>
                  </select>
                </div>

                {/* 7. Residence */}
                <div className="col-6 col-md-3">
                  <label className="form-label small fw-bold text-secondary mb-1">Residence:</label>
                  <select
                    className="form-select form-select-sm"
                    value={isHosteler ? "Hostel" : "DayScholar"}
                    onChange={(e) => setIsHosteler(e.target.value === "Hostel")}
                    style={{ fontSize: 12.5 }}
                  >
                    <option value="Hostel">Hostel / PG (Panjabrao Cash Eligible)</option>
                    <option value="DayScholar">Day Scholar</option>
                  </select>
                </div>

                {/* 8. Annual College Tuition Fees */}
                <div className="col-12 col-md-3">
                  <label className="form-label small fw-bold text-secondary mb-1">College Tuition (₹):</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={fees}
                    onChange={(e) => setFees(Number(e.target.value))}
                    step="5000"
                    style={{ fontSize: 12.5 }}
                  />
                </div>

              </div>
            </div>

            {/* ================= DUAL NAVIGATION TABS ================= */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <div className="btn-group p-1 bg-white rounded-pill border shadow-sm">
                <button
                  type="button"
                  className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold transition-all"
                  onClick={() => setActiveTab("scholarships")}
                  style={{
                    fontSize: 13,
                    background: activeTab === "scholarships" ? "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)" : "transparent",
                    color: activeTab === "scholarships" ? "#ffffff" : "#475569",
                    border: "none",
                    boxShadow: activeTab === "scholarships" ? "0 2px 8px rgba(26, 35, 126, 0.25)" : "none"
                  }}
                >
                  <FaAward className="me-1.5" />
                  Buddy4Study &amp; Domain Scholarships
                  <span className="badge rounded-pill ms-2 px-2 py-0.5" style={{ fontSize: 10, background: activeTab === "scholarships" ? "#FFB300" : "#EEF2F6", color: "#1A237E" }}>
                    {filteredScholarships.length} Available
                  </span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold transition-all"
                  onClick={() => setActiveTab("calculator")}
                  style={{
                    fontSize: 13,
                    background: activeTab === "calculator" ? "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)" : "transparent",
                    color: activeTab === "calculator" ? "#ffffff" : "#475569",
                    border: "none",
                    boxShadow: activeTab === "calculator" ? "0 2px 8px rgba(26, 35, 126, 0.25)" : "none"
                  }}
                >
                  <FaMoneyBillWave className="me-1.5" />
                  Statutory Fee Waiver Calculator
                  {summary && (summary.tuition_waiver_applied || 0) > 0 && (
                    <span className="badge rounded-pill ms-2 px-2 py-0.5" style={{ fontSize: 10, background: "#FFD54F", color: "#1A237E" }}>
                      -₹{(summary.tuition_waiver_applied || 0).toLocaleString("en-IN")}
                    </span>
                  )}
                </button>
              </div>

              {/* Status summary pill */}
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-white text-dark border px-3 py-2 shadow-sm rounded-pill small">
                  🎯 You qualify for <strong style={{ color: "#1A237E" }}>{eligibleCount}</strong> out of {rawScholarships.length} scholarships
                </span>
              </div>
            </div>

            {/* ================= TAB 1: BUDDY4STUDY & DOMAIN SCHOLARSHIPS ================= */}
            {activeTab === "scholarships" && (
              <div>
                
                {/* Search & Provider Filter Toolbar */}
                <div className="row g-2 align-items-center mb-3">
                  <div className="col-12 col-md-5">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white border-end-0 text-muted">
                        <FaSearch size={12} />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Search scholarship name, provider (Reliance, Tata, Kotak, HDFC, Infosys)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ fontSize: 12.5 }}
                      />
                      {searchQuery && (
                        <button
                          className="btn btn-sm border-start-0"
                          style={{ background: "#F1F5F9", color: "#64748B", border: "1px solid #CBD5E1" }}
                          onClick={() => setSearchQuery("")}
                        >
                          <FaTimes size={10} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 col-md-4">
                    <div className="d-flex align-items-center gap-1.5">
                      <span className="small text-muted fw-semibold text-nowrap" style={{ fontSize: 12 }}>Provider:</span>
                      <select
                        className="form-select form-select-sm"
                        value={providerFilter}
                        onChange={(e) => setProviderFilter(e.target.value)}
                        style={{ fontSize: 12 }}
                      >
                        <option value="All">All Providers (Private CSR & Govt)</option>
                        <option value="Buddy4Study">🤝 Buddy4Study Verified (Corporate CSR)</option>
                        <option value="Government">🏛️ Government (Central NSP & MahaDBT)</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 col-md-3 text-sm-end">
                    <div className="form-check form-switch d-inline-flex align-items-center gap-2 m-0">
                      <input
                        className="form-check-input m-0"
                        type="checkbox"
                        id="onlyEligibleSwitch"
                        checked={onlyEligible}
                        onChange={(e) => setOnlyEligible(e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                      <label
                        className="form-check-label small fw-bold text-secondary"
                        htmlFor="onlyEligibleSwitch"
                        style={{ cursor: "pointer", fontSize: 12 }}
                      >
                        Show Only Eligible for Me
                      </label>
                    </div>
                  </div>
                </div>

                {/* Scholarships Cards Grid */}
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-success" role="status" />
                    <div className="text-muted small mt-2">Evaluating online scholarships for your profile...</div>
                  </div>
                ) : filteredScholarships.length === 0 ? (
                  <div className="p-4 bg-white rounded-3 border text-center shadow-sm">
                    <FaInfoCircle size={32} className="text-muted mb-2" />
                    <h6 className="fw-bold text-dark">No scholarships match your active filters</h6>
                    <p className="text-muted small mb-3">
                      Try adjusting the stream, family income slider, or clearing the search keyword.
                    </p>
                    <button
                      className="btn btn-sm rounded-pill px-3 fw-semibold shadow-sm"
                      style={{ background: "#DCFCE7", border: "1px solid #86EFAC", color: "#166534" }}
                      onClick={() => {
                        setStream("All");
                        setSearchQuery("");
                        setProviderFilter("All");
                        setOnlyEligible(false);
                      }}
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="row g-3">
                    {filteredScholarships.map((sch) => {
                      const isEligible = sch.is_eligible;
                      const status = sch.criteria_status || {};
                      const isDocsOpen = !!expandedDocs[sch.id];

                      return (
                        <div className="col-12" key={sch.id}>
                          <div
                            className={`p-3 p-md-3.5 bg-white rounded-3 border shadow-sm transition-all position-relative overflow-hidden ${
                              isEligible ? "border-success border-opacity-50" : "border-light-subtle"
                            }`}
                            style={{
                              borderLeft: isEligible ? "4px solid #10B981" : "4px solid #CBD5E1"
                            }}
                          >
                            {/* Card Top Header */}
                            <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-2">
                              <div>
                                <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                  {sch.source === "Buddy4Study" ? (
                                    <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary-subtle px-2.5 py-1 fw-bold" style={{ fontSize: 11 }}>
                                      🤝 Buddy4Study Verified
                                    </span>
                                  ) : (
                                    <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success-subtle px-2.5 py-1 fw-bold" style={{ fontSize: 11 }}>
                                      🏛️ Government Scheme
                                    </span>
                                  )}

                                  {/* Domain Pills */}
                                  {sch.domain.map((d, i) => (
                                    <span key={i} className="badge bg-light text-secondary border" style={{ fontSize: 10.5 }}>
                                      {d}
                                    </span>
                                  ))}

                                  {sch.application_cycle && (
                                    <span className="badge bg-secondary-subtle text-secondary small" style={{ fontSize: 10 }}>
                                      📅 {sch.application_cycle}
                                    </span>
                                  )}
                                </div>

                                <h6 className="fw-bold text-dark m-0 d-flex align-items-center gap-2" style={{ fontSize: 16 }}>
                                  {sch.scheme_name}
                                </h6>
                                <span className="text-muted small fw-medium">
                                  Offered by: <strong>{sch.provider}</strong>
                                </span>
                              </div>

                              {/* Award Amount Badge */}
                              <div className="text-sm-end">
                                <div className="badge bg-success text-white px-3 py-1.5 rounded-pill shadow-sm" style={{ fontSize: 13 }}>
                                  💰 {sch.award_amount}
                                </div>
                                <div className="mt-1">
                                  {isEligible ? (
                                    <span className="text-success small fw-bold d-inline-flex align-items-center gap-1">
                                      <FaCheckCircle size={12} /> Eligible for Your Profile
                                    </span>
                                  ) : (
                                    <span className="text-warning small fw-bold d-inline-flex align-items-center gap-1">
                                      <FaExclamationTriangle size={12} /> Criteria Unmet
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Eligibility Requirements Grid (4 Key Parameters) */}
                            <div className="row g-2 p-2.5 rounded-3 bg-light border mb-2.5">
                              {/* Requirement 1: Family Income */}
                              <div className="col-6 col-md-3">
                                <div className="small text-muted" style={{ fontSize: 11 }}>Max Family Income:</div>
                                <div className="fw-bold small d-flex align-items-center gap-1 text-dark">
                                  {status.income_met ? (
                                    <FaCheckCircle className="text-success flex-shrink-0" size={11} />
                                  ) : (
                                    <FaTimesCircle className="text-danger flex-shrink-0" size={11} />
                                  )}
                                  <span>{sch.yearly_income_limit_text}</span>
                                </div>
                              </div>

                              {/* Requirement 2: Min 10th Marks */}
                              <div className="col-6 col-md-3">
                                <div className="small text-muted" style={{ fontSize: 11 }}>Min 10th Marks:</div>
                                <div className="fw-bold small d-flex align-items-center gap-1 text-dark">
                                  {status.tenth_met ? (
                                    <FaCheckCircle className="text-success flex-shrink-0" size={11} />
                                  ) : (
                                    <FaTimesCircle className="text-danger flex-shrink-0" size={11} />
                                  )}
                                  <span>{sch.min_10th_marks > 0 ? `${sch.min_10th_marks}%` : "Pass / Any"}</span>
                                </div>
                              </div>

                              {/* Requirement 3: Min 12th Marks */}
                              <div className="col-6 col-md-3">
                                <div className="small text-muted" style={{ fontSize: 11 }}>Min 12th Marks:</div>
                                <div className="fw-bold small d-flex align-items-center gap-1 text-dark">
                                  {status.twelfth_met ? (
                                    <FaCheckCircle className="text-success flex-shrink-0" size={11} />
                                  ) : (
                                    <FaTimesCircle className="text-danger flex-shrink-0" size={11} />
                                  )}
                                  <span>{sch.min_12th_marks > 0 ? `${sch.min_12th_marks}%` : "Pass / Merit"}</span>
                                </div>
                              </div>

                              {/* Requirement 4: Gender / Target Group */}
                              <div className="col-6 col-md-3">
                                <div className="small text-muted" style={{ fontSize: 11 }}>Gender / Category:</div>
                                <div className="fw-bold small d-flex align-items-center gap-1 text-dark">
                                  {status.gender_met && status.category_met ? (
                                    <FaCheckCircle className="text-success flex-shrink-0" size={11} />
                                  ) : (
                                    <FaTimesCircle className="text-danger flex-shrink-0" size={11} />
                                  )}
                                  <span>{sch.gender}</span>
                                </div>
                              </div>
                            </div>

                            {/* Unmet Criteria Alert Banner (if any) */}
                            {!isEligible && status.unmet_reasons && status.unmet_reasons.length > 0 && (
                              <div className="alert alert-warning py-1.5 px-2.5 small mb-2.5 rounded-2 d-flex align-items-center gap-2" style={{ fontSize: 12 }}>
                                <FaExclamationTriangle className="text-warning flex-shrink-0" size={12} />
                                <div>
                                  <strong>Why not eligible:</strong> {status.unmet_reasons.join(" • ")}
                                </div>
                              </div>
                            )}

                            {/* Description & Specific Conditions */}
                            <p className="small text-secondary m-0 mb-2.5" style={{ lineHeight: 1.5, fontSize: 12.5 }}>
                              {sch.other_criteria}
                            </p>

                            {/* Documents Required Checklist (Collapsible) */}
                            {sch.documents_required && sch.documents_required.length > 0 && (
                              <div className="mb-2.5">
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm text-decoration-none p-0 small fw-bold text-primary d-inline-flex align-items-center gap-1"
                                  onClick={() => toggleDocExpand(sch.id)}
                                  style={{ fontSize: 12 }}
                                >
                                  <FaFileAlt size={11} />
                                  <span>{isDocsOpen ? "Hide Required Documents" : `View Required Documents (${sch.documents_required.length})`}</span>
                                  {isDocsOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                                </button>

                                {isDocsOpen && (
                                  <div className="mt-2 p-2.5 bg-light rounded-2 border">
                                    <div className="small fw-bold text-dark mb-1">Required Documents Checklist:</div>
                                    <ul className="small text-secondary m-0 ps-3" style={{ fontSize: 12 }}>
                                      {sch.documents_required.map((doc, docIdx) => (
                                        <li key={docIdx}>{doc}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Card Footer Actions */}
                            <div className="d-flex align-items-center justify-content-between pt-2 border-top flex-wrap gap-2">
                              <span className="small text-muted" style={{ fontSize: 11.5 }}>
                                Portal: <strong>{sch.portal_name}</strong>
                              </span>

                              <a
                                href={sch.portal_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm"
                                style={{
                                  fontSize: 12,
                                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                  color: "#FFFFFF",
                                  border: "none"
                                }}
                              >
                                <span>Apply on {sch.portal_name}</span>
                                <FaExternalLinkAlt size={10} />
                              </a>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* ================= TAB 2: STATUTORY FEE WAIVER CALCULATOR ================= */}
            {activeTab === "calculator" && (
              <div>
                {/* FINANCIAL SUMMARY HIGHLIGHT CARDS */}
                {summary && (
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <div className="p-3 rounded-3 bg-white border text-center h-100 shadow-sm">
                        <div className="text-muted small fw-semibold">Original Annual Fee</div>
                        <div className="h4 fw-bold text-dark my-1">₹{(summary.original_annual_fees || 0).toLocaleString("en-IN")}</div>
                        <span className="badge bg-secondary" style={{ fontSize: 10 }}>College Standard Rate</span>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="p-3 rounded-3 bg-success bg-opacity-10 border border-success text-center h-100 shadow-sm">
                        <div className="text-success small fw-bold">Statutory Fee Subsidy</div>
                        <div className="h4 fw-bold text-success my-1">-₹{(summary.tuition_waiver_applied || 0).toLocaleString("en-IN")}</div>
                        <span className="badge bg-success" style={{ fontSize: 10 }}>
                          {summary.discount_percentage || 0}% Fee Waiver
                        </span>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="p-3 rounded-3 border text-center h-100 shadow-sm" style={{ background: "rgba(26, 35, 126, 0.06)", borderColor: "rgba(26, 35, 126, 0.2)" }}>
                        <div className="small fw-bold" style={{ color: "#1A237E" }}>Your Net Payable Tuition</div>
                        <div className="h4 fw-bold my-1" style={{ color: "#1A237E" }}>₹{(summary.net_payable_tuition || 0).toLocaleString("en-IN")}</div>
                        <span className="badge text-white" style={{ background: "#1A237E", fontSize: 10 }}>Direct Net Payable</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Extra Living Allowance Banner */}
                {summary && (summary.hostel_allowance || 0) > 0 && (
                  <div className="p-3 rounded-3 bg-warning bg-opacity-10 border border-warning mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <FaHome className="text-warning" size={20} />
                      <div>
                        <span className="fw-bold text-dark small">Hostel Maintenance Allowance Approved:</span>
                        <div className="text-secondary small">Direct deposit of ₹{(summary.hostel_allowance || 0).toLocaleString("en-IN")} / year into your bank account.</div>
                      </div>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-warning text-dark fw-bold px-3 py-2">
                        4-Year Cumulative Savings: ₹{(summary.four_year_total_savings || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}

                {/* ELIGIBLE GOVERNMENT SCHEMES BREAKDOWN */}
                <h6 className="fw-bold text-dark mb-3">📜 Verified Statutory Government Schemes (MahaDBT &amp; NSP):</h6>
                <div className="row g-3">
                  {(result?.eligible_schemes || []).map((s, idx) => (
                    <div className="col-12" key={idx}>
                      <div className="p-3 bg-white rounded-3 border shadow-sm h-100">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <h6 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                              <FaCheckCircle className="text-success" size={14} />
                              {s.scheme_name}
                            </h6>
                            <span className="text-muted small">{s.authority}</span>
                          </div>
                          <span className="badge bg-success rounded-pill px-3 py-1">
                            Save ₹{(s.annual_saving || 0).toLocaleString("en-IN")}/yr
                          </span>
                        </div>
                        <p className="small text-secondary m-0 mb-2" style={{ lineHeight: 1.5 }}>
                          {s.description}
                        </p>
                        <a
                          href={s.portal || "https://scholarships.gov.in"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm rounded-pill py-1 px-3 fw-semibold shadow-sm"
                          style={{ fontSize: 11, background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8" }}
                        >
                          <FaExternalLinkAlt className="me-1" size={10} /> Apply on {(s.portal || "scholarships.gov.in").replace("https://", "").split(" ")[0]}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ================= MODAL FOOTER ================= */}
          <div className="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <span className="small text-muted d-flex align-items-center gap-1.5">
              <span>💡 Sources: <strong>Buddy4Study Verified Corporate CSR</strong> &amp; <strong>MahaDBT / NSP Portals</strong></span>
            </span>
            <div className="d-flex align-items-center gap-2">
              <a
                href="https://www.buddy4study.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm rounded-pill px-3 fw-semibold shadow-sm"
                style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#334155" }}
              >
                Open Buddy4Study <FaExternalLinkAlt size={10} className="ms-1" />
              </a>
              <button
                type="button"
                className="btn text-white rounded-pill px-4 btn-sm fw-bold"
                onClick={onClose}
                style={{ background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)", border: "none" }}
              >
                Close Hub
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
