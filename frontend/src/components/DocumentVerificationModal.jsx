import React, { useState, useEffect } from "react";
import {
  FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaShieldAlt,
  FaFileAlt, FaPrint, FaCopy, FaCheck, FaTimes, FaSearch, FaExternalLinkAlt,
  FaUserCheck, FaInfoCircle, FaFileContract, FaDownload, FaSpinner,
  FaCheckSquare, FaSquare, FaUndo, FaArrowRight, FaUniversity,
  FaCalendarAlt, FaIdCard, FaCoins, FaGraduationCap
} from "react-icons/fa";

export default function DocumentVerificationModal({
  isOpen,
  onClose,
  studentProfile = {}
}) {
  if (!isOpen) return null;

  // Active Tab: 'verify' | 'proformas' | 'grounded_qa' | 'fc_guidelines'
  const [activeTab, setActiveTab] = useState("verify");

  // Form State
  const initialCategory = studentProfile?.category || "OPEN";
  const initialExam = studentProfile?.exam_type || "MHT-CET";
  const initialAuthority = () => {
    const ex = (initialExam || "").toUpperCase();
    if (ex.includes("JEE")) return "JOSAA";
    if (ex.includes("NEET")) return "NEET_MCC";
    return "MHT_CET";
  };

  const [category, setCategory] = useState(initialCategory);
  const [examType, setExamType] = useState(initialExam);
  const [authority, setAuthority] = useState(initialAuthority);
  const [annualIncome, setAnnualIncome] = useState(studentProfile?.family_income || 450000);
  const [isDropper, setIsDropper] = useState(false);
  const [hasCasteValidity, setHasCasteValidity] = useState(true);
  const [hasCvcReceipt, setHasCvcReceipt] = useState(false);
  const [nclValidTill, setNclValidTill] = useState("2027-03-31");
  const [hasDomicile, setHasDomicile] = useState(true);
  const [appliedTfws, setAppliedTfws] = useState(false);
  const [appliedMinority, setAppliedMinority] = useState(false);

  // Verification Result State
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [checkedDocs, setCheckedDocs] = useState({});

  // Proforma State
  const [selectedProformaKey, setSelectedProformaKey] = useState("PROFORMA_H");
  const [copiedKey, setCopiedKey] = useState(null);
  const [proformasData, setProformasData] = useState({});

  // Grounded Q&A State
  const [groundedQuery, setGroundedQuery] = useState("");
  const [groundedLoading, setGroundedLoading] = useState(false);
  const [groundedAnswer, setGroundedAnswer] = useState(null);

  // Reset to initial profile values
  const handleResetProfile = () => {
    setCategory(initialCategory);
    setExamType(initialExam);
    setAuthority(initialAuthority());
    setAnnualIncome(studentProfile?.family_income || 450000);
    setIsDropper(false);
    setHasCasteValidity(true);
    setHasCvcReceipt(false);
    setNclValidTill("2027-03-31");
    setHasDomicile(true);
    setAppliedTfws(false);
    setAppliedMinority(false);
  };

  // Pre-fill student name and details in proforma template
  const getPersonalizedTemplate = (rawTemplate) => {
    if (!rawTemplate) return "";
    const name = studentProfile?.name || "Student Name";
    const appNo = studentProfile?.user_id || "CAP2610" + Math.floor(10000 + Math.random() * 90000);
    return rawTemplate
      .replace(/Mr\.\/Ms\.\s+_{10,}/g, `Mr./Ms. ${name}`)
      .replace(/Application ID:\s+_{5,}/g, `Application ID: ${appNo}`)
      .replace(/Candidate Name:\s+_{5,}/g, `Candidate Name: ${name}`);
  };

  // Run Verification
  const runVerification = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          exam_type: examType,
          counseling_authority: authority,
          annual_income: Number(annualIncome),
          is_dropper: isDropper,
          has_caste_validity: hasCasteValidity,
          has_cvc_receipt: hasCvcReceipt,
          ncl_valid_till: nclValidTill,
          has_domicile: hasDomicile,
          has_income_cert: true,
          applied_tfws: appliedTfws,
          applied_minority: appliedMinority,
          state: studentProfile?.preferred_state || "Maharashtra"
        })
      });
      const data = await res.json();
      if (data && data.overall_status) {
        setReport(data);
      }
    } catch (err) {
      console.error("Verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Proformas
  useEffect(() => {
    const fetchProformas = async () => {
      try {
        const res = await fetch("/api/documents/proformas");
        const data = await res.json();
        if (data.success) {
          setProformasData(data.proformas);
        }
      } catch (e) {
        console.error("Failed to load proformas", e);
      }
    };
    fetchProformas();
  }, []);

  // Trigger verification on parameter change
  useEffect(() => {
    runVerification();
  }, [category, authority, annualIncome, isDropper, hasCasteValidity, hasCvcReceipt, nclValidTill, hasDomicile, appliedTfws, appliedMinority]);

  // Handle Grounded Query
  const handleAskGrounded = async (e, customQ) => {
    if (e) e.preventDefault();
    const queryToAsk = customQ || groundedQuery;
    if (!queryToAsk.trim()) return;

    setGroundedLoading(true);
    try {
      const res = await fetch("/api/documents/ask-grounded", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryToAsk,
          candidate_context: {
            category,
            exam_type: examType,
            income: annualIncome,
            is_dropper: isDropper
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setGroundedAnswer(data);
      }
    } catch (err) {
      console.error("Grounded Q&A error:", err);
    } finally {
      setGroundedLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handlePrint = () => {
    const currentProforma = proformasData[selectedProformaKey];
    if (!currentProforma) return;
    const content = getPersonalizedTemplate(currentProforma.template);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${currentProforma.title}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; color: #111; }
            h2 { text-align: center; margin-bottom: 5px; font-size: 18pt; text-transform: uppercase; }
            h4 { text-align: center; margin-top: 0; color: #444; font-weight: normal; margin-bottom: 25px; }
            pre { white-space: pre-wrap; font-family: 'Times New Roman', serif; font-size: 11pt; }
            .footer { margin-top: 30px; font-size: 9pt; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h2>${currentProforma.title}</h2>
          <h4>Official Undertaking Format - AY 2026-27</h4>
          <pre>${content}</pre>
          <div class="footer">Generated via Official Admissions Document Engine • Compatible with State CET Cell & JoSAA FC Verification</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const toggleCheck = (idx) => {
    setCheckedDocs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Select all or deselect all docs
  const handleToggleAllDocs = () => {
    const totalCore = report?.mandatory_documents?.length || 0;
    const totalCond = report?.conditional_documents?.length || 0;
    const currentCheckedCount = Object.values(checkedDocs).filter(Boolean).length;
    const allCount = totalCore + totalCond;

    if (currentCheckedCount >= allCount && allCount > 0) {
      setCheckedDocs({});
    } else {
      const allObj = {};
      for (let i = 0; i < totalCore; i++) allObj[`core-${i}`] = true;
      for (let i = 0; i < totalCond; i++) allObj[`cond-${i}`] = true;
      setCheckedDocs(allObj);
    }
  };

  // Jump to specific proforma in Tab 2
  const jumpToProforma = (proformaCode) => {
    setSelectedProformaKey(proformaCode);
    setActiveTab("proformas");
  };

  const totalRequiredDocs = (report?.mandatory_documents?.length || 0) + (report?.conditional_documents?.length || 0);
  const confirmedDocsCount = Object.values(checkedDocs).filter(Boolean).length;
  const progressPercent = totalRequiredDocs > 0 ? Math.round((confirmedDocsCount / totalRequiredDocs) * 100) : 0;

  // NCL check date
  const isNclValid = nclValidTill ? new Date(nclValidTill) >= new Date("2027-03-31") : false;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(6px)",
        zIndex: 1070
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{
          maxWidth: "1180px",
          width: "95vw",
          margin: "1rem auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content border-0 shadow-2xl overflow-hidden"
          style={{
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: "20px",
            background: "#FFFFFF"
          }}
        >
          
          {/* ================= MODAL HEADER ================= */}
          <div
            className="modal-header border-0 text-white px-4 py-3 d-flex align-items-center justify-content-between"
            style={{
              flexShrink: 0,
              background: "linear-gradient(135deg, #1E1B4B 0%, #282566 50%, #3730A3 100%)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.18)"
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center text-warning shadow-sm"
                style={{ width: 44, height: 44, background: "rgba(255, 255, 255, 0.12)", fontSize: 22 }}
              >
                <FaShieldAlt />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h5 className="modal-title fw-bold mb-0 text-white" style={{ fontFamily: "'Poppins', sans-serif", fontSize: 17, letterSpacing: "-0.2px" }}>
                    Official Admission Document & Scrutiny Verification Engine
                  </h5>
                  <span
                    className="badge rounded-pill fw-semibold px-2.5 py-1"
                    style={{ background: "rgba(16, 185, 129, 0.25)", color: "#A7F3D0", border: "1px solid rgba(16, 185, 129, 0.4)", fontSize: 11 }}
                  >
                    AY 2026-27 Gazetted Rules
                  </span>
                </div>
                <p className="mb-0 text-white-50 small mt-0.5" style={{ fontSize: 12 }}>
                  Direct Rule Grounding for <strong>MHT-CET CAP (State CET Cell)</strong>, <strong>JoSAA / CSAB</strong> & <strong>NEET MCC</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.18)",
                border: "1px solid rgba(255, 255, 255, 0.35)",
                width: 34,
                height: 34,
                fontSize: 15
              }}
              title="Close Dialog"
            >
              <FaTimes />
            </button>
          </div>

          {/* ================= TABS NAVIGATION BAR ================= */}
          <div
            className="border-bottom px-4 py-2.5 d-flex gap-2.5 flex-wrap align-items-center justify-content-between"
            style={{
              flexShrink: 0,
              background: "#F8FAFC",
              borderBottom: "1px solid #E2E8F0"
            }}
          >
            <div className="d-flex gap-2 flex-wrap align-items-center">
              {/* Tab 1 */}
              <button
                onClick={() => setActiveTab("verify")}
                className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-2 transition-all shadow-xs"
                style={{
                  fontSize: 12.5,
                  background: activeTab === "verify" ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" : "#FFFFFF",
                  color: activeTab === "verify" ? "#FFFFFF" : "#334155",
                  border: activeTab === "verify" ? "1px solid #1D4ED8" : "1px solid #CBD5E1",
                  boxShadow: activeTab === "verify" ? "0 2px 6px rgba(37,99,235,0.28)" : "0 1px 2px rgba(0,0,0,0.04)"
                }}
              >
                <FaUserCheck size={13} color={activeTab === "verify" ? "#FFFFFF" : "#2563EB"} />
                <span>Profile & Eligibility Audit</span>
                {report && (
                  <span
                    className="badge rounded-pill ms-1"
                    style={{
                      fontSize: 10,
                      background: report.status_color === "green" ? "#10B981" : report.status_color === "amber" ? "#F59E0B" : "#EF4444",
                      color: "#FFFFFF"
                    }}
                  >
                    {report.overall_status === "READY_FOR_FC" ? "Eligible" : report.overall_status === "PROVISIONAL_NEEDS_ACTION" ? "Action Needed" : "High Risk"}
                  </span>
                )}
              </button>

              {/* Tab 2 */}
              <button
                onClick={() => setActiveTab("proformas")}
                className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-2 transition-all shadow-xs"
                style={{
                  fontSize: 12.5,
                  background: activeTab === "proformas" ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" : "#FFFFFF",
                  color: activeTab === "proformas" ? "#FFFFFF" : "#334155",
                  border: activeTab === "proformas" ? "1px solid #1D4ED8" : "1px solid #CBD5E1",
                  boxShadow: activeTab === "proformas" ? "0 2px 6px rgba(37,99,235,0.28)" : "0 1px 2px rgba(0,0,0,0.04)"
                }}
              >
                <FaFileContract size={13} color={activeTab === "proformas" ? "#FFFFFF" : "#4F46E5"} />
                <span>Official Proformas & Affidavits</span>
                {report?.applicable_proformas?.length > 0 && (
                  <span
                    className="badge rounded-pill ms-1"
                    style={{ fontSize: 10, background: "#EF4444", color: "#FFFFFF" }}
                  >
                    {report.applicable_proformas.length} Required
                  </span>
                )}
              </button>

              {/* Tab 3 */}
              <button
                onClick={() => setActiveTab("grounded_qa")}
                className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-2 transition-all shadow-xs"
                style={{
                  fontSize: 12.5,
                  background: activeTab === "grounded_qa" ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" : "#FFFFFF",
                  color: activeTab === "grounded_qa" ? "#FFFFFF" : "#334155",
                  border: activeTab === "grounded_qa" ? "1px solid #1D4ED8" : "1px solid #CBD5E1",
                  boxShadow: activeTab === "grounded_qa" ? "0 2px 6px rgba(37,99,235,0.28)" : "0 1px 2px rgba(0,0,0,0.04)"
                }}
              >
                <FaSearch size={13} color={activeTab === "grounded_qa" ? "#FFFFFF" : "#0284C7"} />
                <span>Rules Q&A Assistant</span>
                <span
                  className="badge rounded-pill ms-1"
                  style={{
                    fontSize: 9.5,
                    background: activeTab === "grounded_qa" ? "rgba(255,255,255,0.25)" : "#0284C7",
                    color: "#FFFFFF"
                  }}
                >
                  Live .gov.in
                </span>
              </button>

              {/* Tab 4 */}
              <button
                onClick={() => setActiveTab("fc_guidelines")}
                className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-2 transition-all shadow-xs"
                style={{
                  fontSize: 12.5,
                  background: activeTab === "fc_guidelines" ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" : "#FFFFFF",
                  color: activeTab === "fc_guidelines" ? "#FFFFFF" : "#334155",
                  border: activeTab === "fc_guidelines" ? "1px solid #1D4ED8" : "1px solid #CBD5E1",
                  boxShadow: activeTab === "fc_guidelines" ? "0 2px 6px rgba(37,99,235,0.28)" : "0 1px 2px rgba(0,0,0,0.04)"
                }}
              >
                <FaShieldAlt size={13} color={activeTab === "fc_guidelines" ? "#FFFFFF" : "#16A34A"} />
                <span>FC Scrutiny Center Checklist</span>
              </button>
            </div>

            {/* Quick Live Audit Banner */}
            <div className="d-none d-lg-flex align-items-center gap-1.5 text-muted small" style={{ fontSize: 11 }}>
              <span className="spinner-grow spinner-grow-sm text-success" style={{ width: 8, height: 8 }} role="status"></span>
              <span>Live Rule Sync Active</span>
            </div>
          </div>

          {/* ================= MODAL BODY ================= */}
          <div
            className="modal-body p-3 p-md-4"
            style={{
              flexGrow: 1,
              overflowY: "auto",
              maxHeight: "calc(90vh - 130px)",
              background: "#F8FAFC"
            }}
          >
            
            {/* ================= TAB 1: VERIFICATION AUDIT ================= */}
            {activeTab === "verify" && (
              <div className="row g-4">
                
                {/* ---------------- LEFT COLUMN: PROFILE & INPUT CONTROLS ---------------- */}
                <div className="col-12 col-lg-5">
                  <div className="d-flex flex-column gap-3">
                    
                    {/* Header info bar */}
                    <div className="d-flex align-items-center justify-content-between px-1">
                      <div>
                        <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2" style={{ fontSize: 14 }}>
                          <span className="badge rounded-circle bg-primary text-white p-1" style={{ width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>1</span>
                          Counseling Profile & Quota Claims
                        </h6>
                        <span className="text-muted small" style={{ fontSize: 11.5 }}>Configure your details to test real-time government rules</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetProfile}
                        className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1"
                        style={{ fontSize: 11 }}
                        title="Reset to your saved student profile values"
                      >
                        <FaUndo size={10} /> Reset
                      </button>
                    </div>

                    {/* CARD A: AUTHORITY & CATEGORY */}
                    <div className="card border-0 shadow-sm rounded-3 p-3 bg-white" style={{ border: "1px solid #E2E8F0" }}>
                      
                      {/* Counseling Authority */}
                      <div className="mb-3">
                        <label className="form-label small fw-bold text-secondary mb-1 d-flex align-items-center gap-1.5" style={{ fontSize: 12 }}>
                          <FaUniversity className="text-primary" size={13} /> Counseling Authority:
                        </label>
                        <select
                          value={authority}
                          onChange={(e) => setAuthority(e.target.value)}
                          className="form-select form-select-sm rounded-2 shadow-none fw-semibold"
                          style={{ fontSize: 12.5, borderColor: "#CBD5E1", padding: "7px 10px" }}
                        >
                          <option value="MHT_CET">State CET Cell Maharashtra (MHT-CET CAP)</option>
                          <option value="JOSAA">JoSAA / CSAB (IITs, NITs, IIITs, GFTIs)</option>
                          <option value="NEET_MCC">NEET MCC / DMER (MBBS, BDS, AYUSH)</option>
                        </select>
                      </div>

                      {/* Category Claimed */}
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <label className="form-label small fw-bold text-secondary mb-0 d-flex align-items-center gap-1.5" style={{ fontSize: 12 }}>
                            <FaIdCard className="text-primary" size={13} /> Admission Category Claimed:
                          </label>
                          <span className="badge bg-light text-primary border" style={{ fontSize: 10 }}>
                            {category}
                          </span>
                        </div>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="form-select form-select-sm rounded-2 shadow-none fw-semibold"
                          style={{ fontSize: 12.5, borderColor: "#CBD5E1", padding: "7px 10px" }}
                        >
                          <option value="OPEN">OPEN / General (Unreserved)</option>
                          <option value="OBC">OBC (Other Backward Classes - 19%)</option>
                          <option value="SC">SC (Scheduled Caste - 13%)</option>
                          <option value="ST">ST (Scheduled Tribe - 7%)</option>
                          <option value="VJNT">VJ / DT / NT (A/B/C/D) & SBC (11%)</option>
                          <option value="EWS">EWS (Economically Weaker Section - 10%)</option>
                          <option value="TFWS">TFWS (Tuition Fee Waiver - 100% Tuition)</option>
                        </select>
                      </div>

                    </div>

                    {/* CARD B: DYNAMIC CATEGORY CERTIFICATE VALIDITY */}
                    {["OBC", "SC", "ST", "VJNT"].includes(category) && (
                      <div
                        className="card border-0 shadow-sm rounded-3 p-3 bg-white"
                        style={{ borderLeft: "4px solid #F59E0B", border: "1px solid #E2E8F0", borderLeftWidth: 4 }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="small fw-bold text-dark d-flex align-items-center gap-1.5" style={{ fontSize: 12 }}>
                            <FaShieldAlt className="text-warning" size={13} /> Caste / Tribe Validity Certificate (CVC):
                          </span>
                          <span className="badge bg-warning bg-opacity-20 text-dark" style={{ fontSize: 10 }}>
                            Reserved Quota Rule
                          </span>
                        </div>

                        {/* Radio options styled as clickable cards */}
                        <div className="d-flex flex-column gap-1.5 mb-3">
                          <div
                            onClick={() => { setHasCasteValidity(true); setHasCvcReceipt(false); }}
                            className="p-2 rounded-2 d-flex align-items-center gap-2 transition-all"
                            style={{
                              cursor: "pointer",
                              background: hasCasteValidity ? "#ECFDF5" : "#F8FAFC",
                              border: hasCasteValidity ? "1px solid #10B981" : "1px solid #E2E8F0"
                            }}
                          >
                            <input
                              type="radio"
                              name="cvc_status"
                              checked={hasCasteValidity}
                              onChange={() => {}}
                              className="form-check-input mt-0"
                            />
                            <div className="flex-grow-1">
                              <span className="small fw-bold d-block text-success" style={{ fontSize: 11.5 }}>
                                Original Validity Certificate in Hand
                              </span>
                              <span className="text-muted d-block" style={{ fontSize: 10.5 }}>
                                Safe & Verified. Full category reservation guaranteed at FC.
                              </span>
                            </div>
                          </div>

                          <div
                            onClick={() => { setHasCasteValidity(false); setHasCvcReceipt(true); }}
                            className="p-2 rounded-2 d-flex align-items-center gap-2 transition-all"
                            style={{
                              cursor: "pointer",
                              background: !hasCasteValidity && hasCvcReceipt ? "#FFFBEB" : "#F8FAFC",
                              border: !hasCasteValidity && hasCvcReceipt ? "1px solid #F59E0B" : "1px solid #E2E8F0"
                            }}
                          >
                            <input
                              type="radio"
                              name="cvc_status"
                              checked={!hasCasteValidity && hasCvcReceipt}
                              onChange={() => {}}
                              className="form-check-input mt-0"
                            />
                            <div className="flex-grow-1">
                              <span className="small fw-bold d-block text-warning-emphasis" style={{ fontSize: 11.5 }}>
                                CVC Application Receipt Only (Provisional)
                              </span>
                              <span className="text-muted d-block" style={{ fontSize: 10.5 }}>
                                Requires Proforma H Undertaking. Must submit original before CAP 3!
                              </span>
                            </div>
                          </div>

                          <div
                            onClick={() => { setHasCasteValidity(false); setHasCvcReceipt(false); }}
                            className="p-2 rounded-2 d-flex align-items-center gap-2 transition-all"
                            style={{
                              cursor: "pointer",
                              background: !hasCasteValidity && !hasCvcReceipt ? "#FEF2F2" : "#F8FAFC",
                              border: !hasCasteValidity && !hasCvcReceipt ? "1px solid #EF4444" : "1px solid #E2E8F0"
                            }}
                          >
                            <input
                              type="radio"
                              name="cvc_status"
                              checked={!hasCasteValidity && !hasCvcReceipt}
                              onChange={() => {}}
                              className="form-check-input mt-0"
                            />
                            <div className="flex-grow-1">
                              <span className="small fw-bold d-block text-danger" style={{ fontSize: 11.5 }}>
                                Not Applied / No Receipt in Hand (High Risk)
                              </span>
                              <span className="text-danger-emphasis d-block" style={{ fontSize: 10.5 }}>
                                Category seat will be CANCELLED and converted to General/OPEN!
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* NCL Validity Expiry Check (for OBC and VJNT) */}
                        {["OBC", "VJNT"].includes(category) && (
                          <div className="p-2.5 rounded-2 bg-light border" style={{ borderColor: "#CBD5E1" }}>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <label className="small fw-bold text-dark d-flex align-items-center gap-1.5 mb-0" style={{ fontSize: 11.5 }}>
                                <FaCalendarAlt className="text-primary" /> Non-Creamy Layer (NCL) Expiry:
                              </label>
                              <span
                                className="badge rounded-pill fw-bold"
                                style={{
                                  fontSize: 10,
                                  background: isNclValid ? "#D1FAE5" : "#FEE2E2",
                                  color: isNclValid ? "#065F46" : "#991B1B",
                                  border: isNclValid ? "1px solid #6EE7B7" : "1px solid #F87171"
                                }}
                              >
                                {isNclValid ? "✓ Valid for AY 2026-27" : "✕ Expired / Invalid"}
                              </span>
                            </div>
                            <input
                              type="date"
                              value={nclValidTill}
                              onChange={(e) => setNclValidTill(e.target.value)}
                              className="form-control form-control-sm rounded-2 shadow-none mb-1 fw-semibold"
                              style={{ fontSize: 12 }}
                            />
                            <p className="mb-0 text-muted" style={{ fontSize: 10.5 }}>
                              Government rule: NCL must be valid up to <strong>31st March 2027</strong>. Receipts are NOT accepted at FC center!
                            </p>
                          </div>
                        )}

                      </div>
                    )}

                    {/* CARD C: FINANCIAL & SPECIAL QUOTA CLAIMS */}
                    <div className="card border-0 shadow-sm rounded-3 p-3 bg-white" style={{ border: "1px solid #E2E8F0" }}>
                      
                      {/* Annual Family Income Slider */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <label className="small fw-bold text-secondary mb-0 d-flex align-items-center gap-1.5" style={{ fontSize: 12 }}>
                            <FaCoins className="text-warning" size={13} /> Annual Family Income:
                          </label>
                          <span
                            className="badge fw-bold px-2.5 py-1"
                            style={{
                              fontSize: 12,
                              background: Number(annualIncome) <= 800000 ? "#D1FAE5" : "#FEF3C7",
                              color: Number(annualIncome) <= 800000 ? "#065F46" : "#92400E",
                              border: Number(annualIncome) <= 800000 ? "1px solid #6EE7B7" : "1px solid #FCD34D"
                            }}
                          >
                            ₹{Number(annualIncome).toLocaleString("en-IN")} / year
                          </span>
                        </div>

                        <input
                          type="range"
                          className="form-range mb-1"
                          min="50000"
                          max="1500000"
                          step="50000"
                          value={annualIncome}
                          onChange={(e) => setAnnualIncome(Number(e.target.value))}
                        />

                        <div className="d-flex justify-content-between text-muted small" style={{ fontSize: 10.5 }}>
                          <span>₹50K</span>
                          <span className="badge bg-warning bg-opacity-20 text-dark fw-bold">
                            ₹8.0L Ceiling (EBC / TFWS Cap)
                          </span>
                          <span>₹15L+</span>
                        </div>

                        {/* Interactive subsidy eligibility badge */}
                        <div className="mt-2 pt-2 border-top d-flex gap-1.5 flex-wrap">
                          {Number(annualIncome) <= 800000 ? (
                            <>
                              <span className="badge rounded-pill fw-semibold" style={{ background: "#D1FAE5", color: "#065F46", fontSize: 10.5 }}>
                                ✓ 50% EBC Tuition Concession Eligible
                              </span>
                              <span className="badge rounded-pill fw-semibold" style={{ background: "#EEF2FF", color: "#3730A3", fontSize: 10.5 }}>
                                ✓ TFWS Scheme Eligible
                              </span>
                            </>
                          ) : (
                            <span className="badge rounded-pill fw-semibold" style={{ background: "#FEF2F2", color: "#991B1B", fontSize: 10.5 }}>
                              ✕ Income exceeds ₹8.0L threshold for EBC & TFWS
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 4 Special Candidature Switches in a neat 2x2 grid */}
                      <div className="pt-2 border-top">
                        <span className="small fw-bold text-secondary d-block mb-2" style={{ fontSize: 11.5 }}>
                          Special Candidature & Concessions:
                        </span>

                        <div className="row g-2">
                          
                          {/* Domicile */}
                          <div className="col-6">
                            <div
                              onClick={() => setHasDomicile(!hasDomicile)}
                              className="p-2 rounded-2 h-100 transition-all d-flex align-items-center justify-content-between"
                              style={{
                                cursor: "pointer",
                                background: hasDomicile ? "#EFF6FF" : "#F8FAFC",
                                border: hasDomicile ? "1px solid #93C5FD" : "1px solid #E2E8F0"
                              }}
                            >
                              <div>
                                <span className="small fw-bold d-block text-dark" style={{ fontSize: 11 }}>Maharashtra Domicile</span>
                                <span className="text-muted d-block" style={{ fontSize: 9.5 }}>State Candidature Type A</span>
                              </div>
                              <input
                                type="checkbox"
                                className="form-check-input mt-0 ms-1"
                                checked={hasDomicile}
                                onChange={() => {}}
                              />
                            </div>
                          </div>

                          {/* Dropper */}
                          <div className="col-6">
                            <div
                              onClick={() => setIsDropper(!isDropper)}
                              className="p-2 rounded-2 h-100 transition-all d-flex align-items-center justify-content-between"
                              style={{
                                cursor: "pointer",
                                background: isDropper ? "#FFFBEB" : "#F8FAFC",
                                border: isDropper ? "1px solid #FCD34D" : "1px solid #E2E8F0"
                              }}
                            >
                              <div>
                                <span className="small fw-bold d-block text-dark" style={{ fontSize: 11 }}>Dropper / Gap Year</span>
                                <span className="text-muted d-block" style={{ fontSize: 9.5 }}>Requires Gap Affidavit</span>
                              </div>
                              <input
                                type="checkbox"
                                className="form-check-input mt-0 ms-1"
                                checked={isDropper}
                                onChange={() => {}}
                              />
                            </div>
                          </div>

                          {/* TFWS */}
                          <div className="col-6">
                            <div
                              onClick={() => setAppliedTfws(!appliedTfws)}
                              className="p-2 rounded-2 h-100 transition-all d-flex align-items-center justify-content-between"
                              style={{
                                cursor: "pointer",
                                background: appliedTfws ? "#ECFDF5" : "#F8FAFC",
                                border: appliedTfws ? "1px solid #6EE7B7" : "1px solid #E2E8F0"
                              }}
                            >
                              <div>
                                <span className="small fw-bold d-block text-dark" style={{ fontSize: 11 }}>TFWS Quota Claim</span>
                                <span className="text-muted d-block" style={{ fontSize: 9.5 }}>100% Tuition Fee Waiver</span>
                              </div>
                              <input
                                type="checkbox"
                                className="form-check-input mt-0 ms-1"
                                checked={appliedTfws}
                                onChange={() => {}}
                              />
                            </div>
                          </div>

                          {/* Minority */}
                          <div className="col-6">
                            <div
                              onClick={() => setAppliedMinority(!appliedMinority)}
                              className="p-2 rounded-2 h-100 transition-all d-flex align-items-center justify-content-between"
                              style={{
                                cursor: "pointer",
                                background: appliedMinority ? "#F5F3FF" : "#F8FAFC",
                                border: appliedMinority ? "1px solid #C4B5FD" : "1px solid #E2E8F0"
                              }}
                            >
                              <div>
                                <span className="small fw-bold d-block text-dark" style={{ fontSize: 11 }}>Minority Quota</span>
                                <span className="text-muted d-block" style={{ fontSize: 9.5 }}>Linguistic / Religious</span>
                              </div>
                              <input
                                type="checkbox"
                                className="form-check-input mt-0 ms-1"
                                checked={appliedMinority}
                                onChange={() => {}}
                              />
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>

                  </div>
                </div>

                {/* ---------------- RIGHT COLUMN: AUDIT VERDICT & ROADMAP ---------------- */}
                <div className="col-12 col-lg-7">
                  <div className="d-flex flex-column gap-3">
                    
                    {/* Header info bar */}
                    <div className="d-flex align-items-center justify-content-between px-1">
                      <div>
                        <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2" style={{ fontSize: 14 }}>
                          <span className="badge rounded-circle bg-success text-white p-1" style={{ width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>2</span>
                          Official Verification Outcome & Checklist
                        </h6>
                        <span className="text-muted small" style={{ fontSize: 11.5 }}>
                          Live evaluation based on your selected parameters
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          onClick={handleToggleAllDocs}
                          className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1 fw-semibold"
                          style={{ fontSize: 11 }}
                        >
                          {confirmedDocsCount >= totalRequiredDocs && totalRequiredDocs > 0 ? "Deselect All" : "Confirm All"}
                        </button>
                      </div>
                    </div>

                    {/* STATUS HERO BANNER */}
                    <div
                      className="card border-0 shadow-sm rounded-3 p-3.5"
                      style={{
                        background: report?.status_color === "green"
                          ? "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)"
                          : report?.status_color === "amber"
                          ? "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)"
                          : "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
                        border: report?.status_color === "green"
                          ? "1px solid #6EE7B7"
                          : report?.status_color === "amber"
                          ? "1px solid #FCD34D"
                          : "1px solid #FCA5A5"
                      }}
                    >
                      <div className="d-flex align-items-start gap-3">
                        <div className="fs-3 mt-0.5 flex-shrink-0">
                          {report?.status_color === "green" && <FaCheckCircle className="text-success" />}
                          {report?.status_color === "amber" && <FaExclamationTriangle className="text-warning" />}
                          {report?.status_color === "red" && <FaTimesCircle className="text-danger" />}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                            <h6
                              className="fw-bold mb-0 text-uppercase"
                              style={{
                                fontSize: 14,
                                color: report?.status_color === "green" ? "#065F46" : report?.status_color === "amber" ? "#92400E" : "#991B1B"
                              }}
                            >
                              {report?.overall_status === "READY_FOR_FC" && "READY FOR FC / E-SCRUTINY VERIFICATION"}
                              {report?.overall_status === "PROVISIONAL_NEEDS_ACTION" && "PROVISIONAL STATUS — OFFICIAL ACTION REQUIRED"}
                              {report?.overall_status === "HIGH_RISK_REJECTION" && "HIGH RISK OF SEAT CANCELLATION / GENERAL CONVERSION"}
                            </h6>
                            <span
                              className="badge rounded-pill fw-bold shadow-xs px-2.5 py-1"
                              style={{
                                fontSize: 10.5,
                                background: "#FFFFFF",
                                color: report?.status_color === "green" ? "#065F46" : report?.status_color === "amber" ? "#92400E" : "#991B1B",
                                border: "1px solid currentColor"
                              }}
                            >
                              {report?.overall_status?.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="small mb-0" style={{ fontSize: 12, lineHeight: 1.55, color: "#1E293B" }}>
                            {report?.status_message}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CRITICAL WARNINGS ALERT */}
                    {report?.critical_warnings?.length > 0 && (
                      <div
                        className="card border-0 shadow-sm rounded-3 p-3 bg-white"
                        style={{ borderLeft: "4px solid #EF4444", border: "1px solid #FECACA", borderLeftWidth: 4 }}
                      >
                        <div className="d-flex align-items-center gap-2 text-danger fw-bold small mb-2" style={{ fontSize: 12.5 }}>
                          <FaExclamationTriangle />
                          <span>Critical Rules & Strict Deadlines to Prevent Seat Cancellation:</span>
                        </div>
                        <ul className="mb-0 ps-3 small text-dark space-y-1.5" style={{ fontSize: 11.5, lineHeight: 1.55 }}>
                          {report.critical_warnings.map((warn, i) => (
                            <li key={i} className="mb-1 text-danger-emphasis">
                              {warn}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* REQUIRED DOCUMENTS CHECKLIST */}
                    <div className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
                      
                      {/* Card Header with Progress Bar */}
                      <div className="p-3 border-bottom bg-white">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div>
                            <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: 13.5 }}>
                              Mandatory Verification Documents Checklist
                            </h6>
                            <span className="small text-muted" style={{ fontSize: 11 }}>
                              Mandated by {report?.authority_name || "State Common Entrance Test Cell"} for your selected profile
                            </span>
                          </div>
                          <span
                            className="badge rounded-pill fw-bold px-2.5 py-1"
                            style={{
                              fontSize: 11,
                              background: progressPercent === 100 ? "#D1FAE5" : "#EFF6FF",
                              color: progressPercent === 100 ? "#065F46" : "#1D4ED8",
                              border: progressPercent === 100 ? "1px solid #6EE7B7" : "1px solid #BFDBFE"
                            }}
                          >
                            {confirmedDocsCount} of {totalRequiredDocs} Confirmed ({progressPercent}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="progress" style={{ height: 6, borderRadius: 3 }}>
                          <div
                            className={`progress-bar ${progressPercent === 100 ? "bg-success" : "bg-primary"}`}
                            role="progressbar"
                            style={{ width: `${progressPercent}%`, transition: "width 0.3s ease" }}
                          ></div>
                        </div>
                      </div>

                      {/* Documents List - Clean cards without nested scrollbox */}
                      <div className="p-3 d-flex flex-column gap-2">
                        
                        {/* 1. CORE DOCUMENTS */}
                        {report?.mandatory_documents?.map((doc, idx) => {
                          const isDone = !!checkedDocs[`core-${idx}`];
                          return (
                            <div
                              key={`core-${idx}`}
                              onClick={() => toggleCheck(`core-${idx}`)}
                              className="d-flex align-items-start gap-2.5 p-2.5 rounded-2 transition-all"
                              style={{
                                cursor: "pointer",
                                background: isDone ? "#F8FAFC" : "#FFFFFF",
                                border: isDone ? "1px solid #CBD5E1" : "1px solid #E2E8F0"
                              }}
                            >
                              <div className="mt-0.5">
                                {isDone ? (
                                  <FaCheckSquare className="text-success" size={16} />
                                ) : (
                                  <FaSquare className="text-secondary opacity-40" size={16} />
                                )}
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                                  <span className={`small fw-bold ${isDone ? "text-decoration-line-through text-muted" : "text-dark"}`} style={{ fontSize: 12 }}>
                                    {doc.name}
                                  </span>
                                  <span className="badge rounded-pill bg-light text-secondary border" style={{ fontSize: 9.5 }}>
                                    Mandatory for All
                                  </span>
                                </div>
                                <p className="mb-0 text-muted mt-0.5" style={{ fontSize: 11 }}>
                                  <strong>Authority:</strong> {doc.authority} • {doc.notes}
                                </p>
                              </div>
                            </div>
                          );
                        })}

                        {/* 2. CONDITIONAL / QUOTA DOCUMENTS */}
                        {report?.conditional_documents?.map((doc, idx) => {
                          const isDone = !!checkedDocs[`cond-${idx}`];
                          return (
                            <div
                              key={`cond-${idx}`}
                              onClick={() => toggleCheck(`cond-${idx}`)}
                              className="d-flex align-items-start gap-2.5 p-2.5 rounded-2 transition-all"
                              style={{
                                cursor: "pointer",
                                background: isDone ? "#F8FAFC" : "#FFFBEB",
                                border: isDone ? "1px solid #CBD5E1" : "1px solid #FCD34D"
                              }}
                            >
                              <div className="mt-0.5">
                                {isDone ? (
                                  <FaCheckSquare className="text-success" size={16} />
                                ) : (
                                  <FaSquare className="text-warning" size={16} />
                                )}
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                                  <span className={`small fw-bold ${isDone ? "text-decoration-line-through text-muted" : "text-warning-emphasis"}`} style={{ fontSize: 12 }}>
                                    {doc.name}
                                  </span>
                                  <span
                                    className="badge rounded-pill fw-semibold"
                                    style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D", fontSize: 9.5 }}
                                  >
                                    {category} Quota Mandate
                                  </span>
                                </div>
                                <p className="mb-0 text-muted mt-0.5" style={{ fontSize: 11 }}>
                                  <strong>Authority:</strong> {doc.authority} • {doc.notes}
                                </p>
                              </div>
                            </div>
                          );
                        })}

                      </div>
                    </div>

                    {/* PROFORMA REQUIRED DIRECT CTA */}
                    {report?.applicable_proformas?.length > 0 && (
                      <div
                        className="card border-0 shadow-sm rounded-3 p-3 bg-white"
                        style={{
                          background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)",
                          border: "1px solid #C7D2FE"
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                          <div className="d-flex align-items-center gap-2.5">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-white"
                              style={{ width: 38, height: 38, background: "#4F46E5" }}
                            >
                              <FaFileContract size={18} />
                            </div>
                            <div>
                              <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: 13 }}>
                                {report.applicable_proformas.length} Official Government Undertaking Format Required
                              </h6>
                              <p className="mb-0 text-muted small" style={{ fontSize: 11.5 }}>
                                {report.applicable_proformas.map(p => p.title.split("(")[0]).join(", ")} — Pre-filled with your details.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => jumpToProforma(report.applicable_proformas[0].code)}
                            className="btn btn-sm text-white fw-bold px-3 py-1.5 rounded-pill shadow-sm d-flex align-items-center gap-1.5"
                            style={{
                              background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                              border: "none",
                              fontSize: 12
                            }}
                          >
                            <span>Open & Print Proforma</span>
                            <FaArrowRight size={11} />
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            )}

            {/* ================= TAB 2: PROFORMAS & AFFIDAVITS GENERATOR ================= */}
            {activeTab === "proformas" && (
              <div className="row g-4">
                
                {/* PROFORMA SELECTOR */}
                <div className="col-12 col-md-4">
                  <div className="card border-0 shadow-sm rounded-3 p-3 bg-white" style={{ border: "1px solid #E2E8F0" }}>
                    <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                      <h6 className="fw-bold small text-secondary text-uppercase mb-0" style={{ letterSpacing: "0.5px", fontSize: 11.5 }}>
                        Official Formats & Templates
                      </h6>
                      <span className="badge bg-light text-dark border" style={{ fontSize: 10 }}>
                        {Object.keys(proformasData).length} Available
                      </span>
                    </div>

                    <div className="d-flex flex-column gap-2">
                      {Object.entries(proformasData).map(([key, item]) => {
                        const isApplicable = report?.applicable_proformas?.some(p => p.code === key);
                        const isSelected = selectedProformaKey === key;
                        return (
                          <div
                            key={key}
                            onClick={() => setSelectedProformaKey(key)}
                            className="p-2.5 rounded-3 transition-all"
                            style={{
                              cursor: "pointer",
                              background: isSelected ? "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)" : "#F8FAFC",
                              color: isSelected ? "#FFFFFF" : "#1E293B",
                              border: isSelected ? "1px solid #1E1B4B" : "1px solid #E2E8F0",
                              boxShadow: isSelected ? "0 4px 12px rgba(30,27,75,0.2)" : "none"
                            }}
                          >
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span className="fw-bold small" style={{ fontSize: 12 }}>
                                {item.title.split("(")[0]}
                              </span>
                              {isApplicable && (
                                <span className={`badge ${isSelected ? "bg-warning text-dark" : "bg-danger text-white"}`} style={{ fontSize: 9.5 }}>
                                  Required for You
                                </span>
                              )}
                            </div>
                            <p className={`small mb-0 line-clamp-2 ${isSelected ? "text-white-50" : "text-muted"}`} style={{ fontSize: 11 }}>
                              {item.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* PREVIEW & ACTIONS */}
                <div className="col-12 col-md-8">
                  {proformasData[selectedProformaKey] ? (
                    <div className="card border-0 shadow-sm rounded-3 p-3.5 bg-white h-100 d-flex flex-column" style={{ border: "1px solid #E2E8F0" }}>
                      
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pb-3 border-bottom mb-3">
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: 14 }}>
                              {proformasData[selectedProformaKey].title}
                            </h6>
                            {report?.applicable_proformas?.some(p => p.code === selectedProformaKey) && (
                              <span className="badge bg-danger text-white" style={{ fontSize: 10 }}>
                                Required for FC Verification
                              </span>
                            )}
                          </div>
                          <span className="small text-primary fw-semibold" style={{ fontSize: 11.5 }}>
                            Stamp & Authority: {proformasData[selectedProformaKey].stamp_required}
                          </span>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <button
                            onClick={() => handleCopy(getPersonalizedTemplate(proformasData[selectedProformaKey].template), selectedProformaKey)}
                            className="btn btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 fw-bold shadow-xs"
                            style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#1E293B", fontSize: 12 }}
                          >
                            {copiedKey === selectedProformaKey ? (
                              <>
                                <FaCheck className="text-success" />
                                <span>Copied to Clipboard!</span>
                              </>
                            ) : (
                              <>
                                <FaCopy />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handlePrint}
                            className="btn btn-sm text-white rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 fw-bold shadow-sm"
                            style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)", border: "none", fontSize: 12 }}
                          >
                            <FaPrint />
                            <span>Print Formal Document</span>
                          </button>
                        </div>
                      </div>

                      {/* Warning Notice */}
                      {proformasData[selectedProformaKey].warning && (
                        <div
                          className="p-2.5 rounded-2 small mb-3 text-warning-emphasis d-flex align-items-start gap-2"
                          style={{ background: "#FFFBEB", border: "1px solid #FCD34D", fontSize: 11.5 }}
                        >
                          <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-warning" />
                          <span>{proformasData[selectedProformaKey].warning}</span>
                        </div>
                      )}

                      {/* Draft Box */}
                      <div
                        className="p-3 rounded-2 border flex-grow-1 overflow-auto text-dark font-monospace"
                        style={{
                          background: "#F8FAFC",
                          borderColor: "#CBD5E1",
                          whiteSpace: "pre-wrap",
                          maxHeight: "360px",
                          fontSize: 11.5,
                          lineHeight: 1.6
                        }}
                      >
                        {getPersonalizedTemplate(proformasData[selectedProformaKey].template)}
                      </div>

                    </div>
                  ) : (
                    <div className="card border-0 shadow-sm rounded-3 p-5 bg-white text-center text-muted" style={{ border: "1px solid #E2E8F0" }}>
                      Select a proforma on the left to preview, customize, and print
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ================= TAB 3: LIVE WEB-GROUNDED RULES Q&A ================= */}
            {activeTab === "grounded_qa" && (
              <div className="mx-auto" style={{ maxWidth: "900px" }}>
                
                {/* Search Card */}
                <div className="card border-0 shadow-sm rounded-3 p-4 mb-3 bg-white" style={{ border: "1px solid #E2E8F0" }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2.5">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm"
                        style={{ width: 36, height: 36, background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" }}
                      >
                        <FaSearch size={14} />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: 14 }}>
                          Live Government Rules Grounding Engine
                        </h6>
                        <span className="small text-muted" style={{ fontSize: 11.5 }}>
                          Gazette-level verification from mahacet.org, josaa.nic.in, mcc.nic.in
                        </span>
                      </div>
                    </div>
                    <span
                      className="badge rounded-pill fw-bold px-2.5 py-1"
                      style={{ background: "#D1FAE5", color: "#065F46", border: "1px solid #6EE7B7", fontSize: 10.5 }}
                    >
                      ● Google Search Grounding Active
                    </span>
                  </div>

                  <form onSubmit={handleAskGrounded} className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control rounded-start-pill px-3.5 shadow-none"
                      style={{ fontSize: 13, borderColor: "#CBD5E1", padding: "10px 16px" }}
                      placeholder="Ask any rule (e.g. Can I submit CVC receipt in CAP 1? Is central EWS accepted?)"
                      value={groundedQuery}
                      onChange={(e) => setGroundedQuery(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={groundedLoading || !groundedQuery.trim()}
                      className="btn text-white rounded-end-pill px-4 fw-bold d-flex align-items-center gap-2"
                      style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)", border: "none", fontSize: 13 }}
                    >
                      {groundedLoading ? <FaSpinner className="spinner-border spinner-border-sm" /> : <FaSearch size={13} />}
                      <span>Verify Rule</span>
                    </button>
                  </form>

                  <div>
                    <span className="small fw-bold text-secondary d-block mb-1.5" style={{ fontSize: 11 }}>
                      Frequently Verified Counseling Mandates:
                    </span>
                    <div className="d-flex flex-wrap gap-1.5">
                      {[
                        "Can I submit Caste Validity Receipt in CAP Round 1?",
                        "What is the exact NCL validity requirement for 2026-27?",
                        "Do droppers require a ₹100 stamp paper GAP affidavit?",
                        "Is Central EWS accepted in Maharashtra State CET seats?",
                        "Can I use School Leaving Certificate as Domicile proof?"
                      ].map((q, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => {
                            setGroundedQuery(q);
                            handleAskGrounded(e, q);
                          }}
                          className="btn btn-sm rounded-pill px-3 py-1 text-start fw-medium transition-all shadow-2xs"
                          style={{
                            fontSize: 11.5,
                            background: "#F1F5F9",
                            border: "1px solid #CBD5E1",
                            color: "#1E293B"
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grounded Answer Display */}
                {groundedAnswer && (
                  <div className="card border-0 shadow-sm rounded-3 p-4 bg-white" style={{ border: "1px solid #E2E8F0" }}>
                    <div className="d-flex align-items-center justify-content-between pb-2.5 border-bottom mb-3">
                      <span className="badge bg-primary fw-bold text-uppercase px-2.5 py-1" style={{ fontSize: 10 }}>
                        Verified Legal Verdict
                      </span>
                      <span className="small text-muted" style={{ fontSize: 11.5 }}>
                        Query: "{groundedAnswer.query}"
                      </span>
                    </div>

                    <div
                      className="text-dark small mb-3"
                      style={{ whiteSpace: "pre-line", lineHeight: 1.65, fontSize: 12.5 }}
                    >
                      {groundedAnswer.answer}
                    </div>

                    {groundedAnswer.citations?.length > 0 && (
                      <div className="pt-2.5 border-top">
                        <span className="small fw-bold text-secondary d-flex align-items-center gap-1.5 mb-2" style={{ fontSize: 11 }}>
                          <FaShieldAlt className="text-primary" />
                          Authoritative Web Grounding Citations:
                        </span>
                        <div className="d-flex flex-wrap gap-1.5">
                          {groundedAnswer.citations.map((cite, i) => (
                            <a
                              key={i}
                              href={cite.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="badge rounded-pill bg-light text-primary border p-2 text-decoration-none d-inline-flex align-items-center gap-1.5"
                              style={{ fontSize: 11.5 }}
                            >
                              <span>{cite.title || cite.url}</span>
                              <FaExternalLinkAlt size={9} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* ================= TAB 4: FC SCRUTINY GUIDELINES ================= */}
            {activeTab === "fc_guidelines" && (
              <div className="mx-auto" style={{ maxWidth: "900px" }}>
                
                <div className="card border-0 shadow-sm rounded-3 p-4 mb-3 bg-white" style={{ border: "1px solid #E2E8F0" }}>
                  <div className="d-flex align-items-center gap-2.5 mb-2">
                    <FaShieldAlt className="text-primary fs-4" />
                    <div>
                      <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: 14 }}>
                        Facilitation Centre (FC / ARC) & e-Scrutiny Standard Operating Procedure
                      </h6>
                      <span className="small text-muted" style={{ fontSize: 11.5 }}>
                        Follow these official government protocols to guarantee 100% first-pass verification
                      </span>
                    </div>
                  </div>

                  <div className="row g-3 my-2">
                    <div className="col-12 col-md-6">
                      <div className="card h-100 border-0 p-3 rounded-3" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                        <h6 className="fw-bold text-primary small text-uppercase mb-2" style={{ fontSize: 12 }}>
                          Mode A: e-Scrutiny (Online Verification)
                        </h6>
                        <ul className="small text-dark ps-3 mb-0 space-y-1.5" style={{ fontSize: 11.5, lineHeight: 1.55 }}>
                          <li>Candidate uploads color scans from home without visiting FC physically.</li>
                          <li>Scrutiny officer reviews uploaded PDF documents in the government portal.</li>
                          <li>If an error or illegible scan is found, a <strong>Grievance is Raised</strong>. You get 48 hours to re-upload.</li>
                          <li>Monitor your SMS notifications and portal login daily during the verification window.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="card h-100 border-0 p-3 rounded-3" style={{ background: "#F8FAFC", border: "1px solid #CBD5E1" }}>
                        <h6 className="fw-bold text-dark small text-uppercase mb-2" style={{ fontSize: 12 }}>
                          Mode B: Physical Scrutiny (At Designated FC Center)
                        </h6>
                        <ul className="small text-dark ps-3 mb-0 space-y-1.5" style={{ fontSize: 11.5, lineHeight: 1.55 }}>
                          <li>Candidate books a time slot and visits any approved Facilitation Centre.</li>
                          <li>Carry <strong>ALL Original Documents</strong> + 2 sets of self-attested photocopies.</li>
                          <li>Officer verifies physical originals and returns them immediately on the spot.</li>
                          <li>Obtain official stamped <strong>FC Verification Acknowledgment</strong> receipt.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-3 bg-light border mt-2" style={{ borderColor: "#CBD5E1" }}>
                    <span className="small fw-bold text-dark text-uppercase d-block mb-1.5" style={{ fontSize: 11 }}>
                      Five Golden Rules of Document Scrutiny:
                    </span>
                    <ul className="small text-muted ps-3 mb-0 space-y-1" style={{ fontSize: 11.5, lineHeight: 1.55 }}>
                      {report?.fc_checklist?.map((item, idx) => (
                        <li key={idx} className="mb-1 text-dark">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* ================= MODAL FOOTER ================= */}
          <div
            className="modal-footer px-4 py-2.5 border-top d-flex justify-content-between align-items-center"
            style={{
              flexShrink: 0,
              background: "#F8FAFC",
              borderTop: "1px solid #E2E8F0"
            }}
          >
            <div className="d-flex align-items-center gap-2 text-muted small" style={{ fontSize: 11.5 }}>
              <FaShieldAlt className="text-success" />
              <span>Official Rules Matrix Grounding • Compatible with State CET Cell Maharashtra, JoSAA & NEET MCC</span>
            </div>
            <button
              type="button"
              className="btn btn-sm rounded-pill px-4 fw-bold text-white shadow-sm"
              style={{
                background: "#1E293B",
                border: "none",
                fontSize: 12.5,
                padding: "6px 20px"
              }}
              onClick={onClose}
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
