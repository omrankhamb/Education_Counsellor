import React, { useState, useEffect } from "react";
import {
  FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaShieldAlt,
  FaFileAlt, FaPrint, FaCopy, FaCheck, FaTimes, FaSearch, FaExternalLinkAlt,
  FaUserCheck, FaInfoCircle, FaFileContract, FaDownload, FaSpinner,
  FaCheckSquare, FaSquare
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
  const [category, setCategory] = useState(initialCategory);
  const [examType, setExamType] = useState(initialExam);
  const [authority, setAuthority] = useState(() => {
    const ex = (initialExam || "").toUpperCase();
    if (ex.includes("JEE")) return "JOSAA";
    if (ex.includes("NEET")) return "NEET_MCC";
    return "MHT_CET";
  });
  const [annualIncome, setAnnualIncome] = useState(450000);
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

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        background: "rgba(15, 23, 42, 0.78)",
        backdropFilter: "blur(5px)",
        zIndex: 1070
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{
          maxWidth: "1060px",
          width: "95vw",
          margin: "1.25rem auto"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content border-0 shadow-2xl overflow-hidden"
          style={{
            maxHeight: "calc(100vh - 40px)",
            display: "flex",
            flexDirection: "column",
            borderRadius: "18px"
          }}
        >
          
          {/* HEADER (Fixed height, cannot be pushed off) */}
          <div
            className="modal-header border-0 text-white px-3.5 py-3"
            style={{
              flexShrink: 0,
              background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
            }}
          >
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center text-warning"
                style={{ width: 40, height: 40, background: "rgba(255, 255, 255, 0.15)", fontSize: 20 }}
              >
                <FaShieldAlt />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h5 className="modal-title fw-bold mb-0 text-white" style={{ fontFamily: "'Poppins', sans-serif", fontSize: 16 }}>
                    Live Document & Eligibility Verification Engine
                  </h5>
                  <span
                    className="badge fw-semibold"
                    style={{ background: "rgba(16, 185, 129, 0.25)", color: "#A7F3D0", border: "1px solid rgba(16, 185, 129, 0.4)", fontSize: 10.5 }}
                  >
                    AY 2026-27
                  </span>
                </div>
                <p className="mb-0 text-white-50 small" style={{ fontSize: 11.5 }}>
                  Official Government Rules Grounding for MHT-CET, JoSAA & NEET MCC Reporting
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.22)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                width: 32,
                height: 32,
                fontSize: 14
              }}
              title="Close Dialog"
            >
              <FaTimes />
            </button>
          </div>

          {/* TABS NAVIGATION (All buttons with solid distinct backgrounds) */}
          <div
            className="border-bottom px-3.5 py-2.5 d-flex gap-2 flex-wrap align-items-center"
            style={{
              flexShrink: 0,
              background: "#F1F5F9",
              borderBottom: "1px solid #CBD5E1"
            }}
          >
            {/* Tab 1 */}
            <button
              onClick={() => setActiveTab("verify")}
              className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 transition-all shadow-sm"
              style={{
                fontSize: 12,
                background: activeTab === "verify" ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" : "#E2E8F0",
                color: activeTab === "verify" ? "#FFFFFF" : "#0F172A",
                border: activeTab === "verify" ? "1px solid #1D4ED8" : "1px solid #94A3B8",
                boxShadow: activeTab === "verify" ? "0 2px 8px rgba(37,99,235,0.3)" : "0 1px 2px rgba(0,0,0,0.06)"
              }}
            >
              <FaUserCheck size={12} color={activeTab === "verify" ? "#FFFFFF" : "#2563EB"} />
              <span>Profile & Eligibility Audit</span>
            </button>

            {/* Tab 2 */}
            <button
              onClick={() => setActiveTab("proformas")}
              className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 transition-all shadow-sm"
              style={{
                fontSize: 12,
                background: activeTab === "proformas" ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" : "#E2E8F0",
                color: activeTab === "proformas" ? "#FFFFFF" : "#0F172A",
                border: activeTab === "proformas" ? "1px solid #1D4ED8" : "1px solid #94A3B8",
                boxShadow: activeTab === "proformas" ? "0 2px 8px rgba(37,99,235,0.3)" : "0 1px 2px rgba(0,0,0,0.06)"
              }}
            >
              <FaFileContract size={12} color={activeTab === "proformas" ? "#FFFFFF" : "#4F46E5"} />
              <span>Official Proformas & Affidavits</span>
              {report?.applicable_proformas?.length > 0 && (
                <span className="badge bg-warning text-dark ms-1" style={{ fontSize: 9.5 }}>
                  {report.applicable_proformas.length}
                </span>
              )}
            </button>

            {/* Tab 3 */}
            <button
              onClick={() => setActiveTab("grounded_qa")}
              className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 transition-all shadow-sm"
              style={{
                fontSize: 12,
                background: activeTab === "grounded_qa" ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" : "#E2E8F0",
                color: activeTab === "grounded_qa" ? "#FFFFFF" : "#0F172A",
                border: activeTab === "grounded_qa" ? "1px solid #1D4ED8" : "1px solid #94A3B8",
                boxShadow: activeTab === "grounded_qa" ? "0 2px 8px rgba(37,99,235,0.3)" : "0 1px 2px rgba(0,0,0,0.06)"
              }}
            >
              <FaSearch size={12} color={activeTab === "grounded_qa" ? "#FFFFFF" : "#0284C7"} />
              <span>Live Web-Grounded Rules Q&A</span>
              <span
                className="badge ms-1"
                style={{
                  fontSize: 9,
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
              className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 transition-all shadow-sm"
              style={{
                fontSize: 12,
                background: activeTab === "fc_guidelines" ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)" : "#E2E8F0",
                color: activeTab === "fc_guidelines" ? "#FFFFFF" : "#0F172A",
                border: activeTab === "fc_guidelines" ? "1px solid #1D4ED8" : "1px solid #94A3B8",
                boxShadow: activeTab === "fc_guidelines" ? "0 2px 8px rgba(37,99,235,0.3)" : "0 1px 2px rgba(0,0,0,0.06)"
              }}
            >
              <FaShieldAlt size={12} color={activeTab === "fc_guidelines" ? "#FFFFFF" : "#16A34A"} />
              <span>FC Scrutiny Center Checklist</span>
            </button>
          </div>

          {/* MODAL BODY (Scrollable viewport, NEVER overflows window) */}
          <div
            className="modal-body p-3 p-md-3.5 bg-white"
            style={{
              flexGrow: 1,
              overflowY: "auto",
              maxHeight: "calc(100vh - 215px)"
            }}
          >
            
            {/* TAB 1: VERIFICATION AUDIT */}
            {activeTab === "verify" && (
              <div className="row g-3">
                
                {/* LEFT COLUMN: CANDIDATE PROFILE CONTROLS */}
                <div className="col-lg-5">
                  <div className="card border rounded-3 p-3 shadow-sm h-100 bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <div className="d-flex align-items-center justify-content-between mb-2.5 border-bottom pb-2">
                      <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: 13.5 }}>
                        📋 Candidate Counseling Profile
                      </h6>
                      <span className="small text-muted" style={{ fontSize: 10.5 }}>Edit to re-audit</span>
                    </div>

                    {/* Authority */}
                    <div className="mb-2">
                      <label className="form-label small fw-bold text-secondary mb-1" style={{ fontSize: 11.5 }}>
                        Counseling Authority
                      </label>
                      <select
                        value={authority}
                        onChange={(e) => setAuthority(e.target.value)}
                        className="form-select form-select-sm rounded-2 shadow-none fw-semibold"
                        style={{ fontSize: 12, borderColor: "#CBD5E1" }}
                      >
                        <option value="MHT_CET">State CET Cell Maharashtra (MHT-CET CAP)</option>
                        <option value="JOSAA">JoSAA / CSAB (IITs, NITs, IIITs, GFTIs)</option>
                        <option value="NEET_MCC">NEET MCC / DMER (Medical MBBS/BDS)</option>
                      </select>
                    </div>

                    {/* Category */}
                    <div className="mb-2">
                      <label className="form-label small fw-bold text-secondary mb-1" style={{ fontSize: 11.5 }}>
                        Category Claimed
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="form-select form-select-sm rounded-2 shadow-none fw-semibold"
                        style={{ fontSize: 12, borderColor: "#CBD5E1" }}
                      >
                        <option value="OPEN">OPEN / General</option>
                        <option value="OBC">OBC (Other Backward Classes)</option>
                        <option value="SC">SC (Scheduled Caste)</option>
                        <option value="ST">ST (Scheduled Tribe)</option>
                        <option value="VJNT">VJ / DT / NT (A/B/C/D) & SBC</option>
                        <option value="EWS">EWS (Economically Weaker Section - 10%)</option>
                        <option value="TFWS">TFWS (Tuition Fee Waiver - 100% Tuition)</option>
                      </select>
                    </div>

                    {/* Caste Validity Options (if reserved) */}
                    {["OBC", "SC", "ST", "VJNT"].includes(category) && (
                      <div className="p-2 mb-2 rounded-2 border border-warning bg-warning bg-opacity-10">
                        <span className="small fw-bold text-dark d-block mb-1" style={{ fontSize: 11 }}>
                          Caste / Tribe Validity Certificate (CVC)
                        </span>
                        <div className="form-check mb-1">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="cvc_status"
                            id="cvc_orig"
                            checked={hasCasteValidity}
                            onChange={() => {
                              setHasCasteValidity(true);
                              setHasCvcReceipt(false);
                            }}
                          />
                          <label className="form-check-label small" htmlFor="cvc_orig" style={{ fontSize: 11 }}>
                            Original Validity in hand
                          </label>
                        </div>
                        <div className="form-check mb-1">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="cvc_status"
                            id="cvc_rcpt"
                            checked={!hasCasteValidity && hasCvcReceipt}
                            onChange={() => {
                              setHasCasteValidity(false);
                              setHasCvcReceipt(true);
                            }}
                          />
                          <label className="form-check-label small text-warning-emphasis fw-bold" htmlFor="cvc_rcpt" style={{ fontSize: 11 }}>
                            Receipt only (Requires Proforma H)
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="cvc_status"
                            id="cvc_none"
                            checked={!hasCasteValidity && !hasCvcReceipt}
                            onChange={() => {
                              setHasCasteValidity(false);
                              setHasCvcReceipt(false);
                            }}
                          />
                          <label className="form-check-label small text-danger fw-bold" htmlFor="cvc_none" style={{ fontSize: 11 }}>
                            Not Applied / No Receipt (High Risk)
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Non-Creamy Layer Validity (for OBC/VJNT) */}
                    {["OBC", "VJNT"].includes(category) && (
                      <div className="p-2 mb-2 rounded-2 border border-primary bg-primary bg-opacity-10">
                        <span className="small fw-bold text-primary-emphasis d-block mb-1" style={{ fontSize: 11 }}>
                          Non-Creamy Layer (NCL) Expiry:
                        </span>
                        <input
                          type="date"
                          value={nclValidTill}
                          onChange={(e) => setNclValidTill(e.target.value)}
                          className="form-control form-control-sm rounded-2 shadow-none mb-1"
                          style={{ fontSize: 11.5 }}
                        />
                        <span className="small text-muted d-block" style={{ fontSize: 10 }}>
                          Must be valid till <strong>31-03-2027</strong>. Receipts are rejected!
                        </span>
                      </div>
                    )}

                    {/* Annual Family Income Slider */}
                    <div className="p-2.5 rounded-2 mb-2" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="small fw-bold text-secondary mb-0" style={{ fontSize: 11 }}>
                          Annual Family Income:
                        </label>
                        <span className="badge bg-primary fw-bold" style={{ fontSize: 11 }}>
                          ₹{Number(annualIncome).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <input
                        type="range"
                        className="form-range mb-0"
                        min="50000"
                        max="1500000"
                        step="50000"
                        value={annualIncome}
                        onChange={(e) => setAnnualIncome(Number(e.target.value))}
                      />
                      <div className="d-flex justify-content-between text-muted mt-1" style={{ fontSize: 9.5 }}>
                        <span>₹50K</span>
                        <span className="text-warning-emphasis fw-bold">₹8.0L Limit</span>
                        <span>₹15L+</span>
                      </div>
                    </div>

                    {/* Options (Each with its own card & background) */}
                    <div className="d-flex flex-column gap-1.5">
                      {/* Dropper */}
                      <div className="d-flex align-items-center justify-content-between p-2 rounded-2" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <div>
                          <span className="small fw-bold text-dark d-block" style={{ fontSize: 11.5 }}>Dropper / Gap Candidate</span>
                          <span className="text-muted d-block" style={{ fontSize: 10 }}>Requires ₹100 stamp paper affidavit</span>
                        </div>
                        <div className="form-check form-switch mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={isDropper}
                            onChange={(e) => setIsDropper(e.target.checked)}
                          />
                        </div>
                      </div>

                      {/* Domicile */}
                      <div className="d-flex align-items-center justify-content-between p-2 rounded-2" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <div>
                          <span className="small fw-bold text-dark d-block" style={{ fontSize: 11.5 }}>Maharashtra Domicile / Birth</span>
                          <span className="text-muted d-block" style={{ fontSize: 10 }}>State Candidature Type A proof</span>
                        </div>
                        <div className="form-check form-switch mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={hasDomicile}
                            onChange={(e) => setHasDomicile(e.target.checked)}
                          />
                        </div>
                      </div>

                      {/* TFWS */}
                      <div className="d-flex align-items-center justify-content-between p-2 rounded-2" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <div>
                          <span className="small fw-bold text-dark d-block" style={{ fontSize: 11.5 }}>Applying for TFWS Quota</span>
                          <span className="text-muted d-block" style={{ fontSize: 10 }}>100% Tuition Fee Waiver</span>
                        </div>
                        <div className="form-check form-switch mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={appliedTfws}
                            onChange={(e) => setAppliedTfws(e.target.checked)}
                          />
                        </div>
                      </div>

                      {/* Minority */}
                      <div className="d-flex align-items-center justify-content-between p-2 rounded-2" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <div>
                          <span className="small fw-bold text-dark d-block" style={{ fontSize: 11.5 }}>Minority Quota Claim</span>
                          <span className="text-muted d-block" style={{ fontSize: 10 }}>Requires Proforma O / LC Proof</span>
                        </div>
                        <div className="form-check form-switch mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={appliedMinority}
                            onChange={(e) => setAppliedMinority(e.target.checked)}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* RIGHT COLUMN: STATUS AUDIT & CHECKLIST */}
                <div className="col-lg-7 d-flex flex-column gap-2.5">
                  
                  {/* STATUS BANNER */}
                  <div
                    className="p-3 rounded-3 border d-flex align-items-start gap-2.5 shadow-sm"
                    style={{
                      background: report?.status_color === "green" ? "#F0FDF4" : report?.status_color === "amber" ? "#FFFBEB" : "#FEF2F2",
                      borderColor: report?.status_color === "green" ? "#86EFAC" : report?.status_color === "amber" ? "#FDE68A" : "#FECACA"
                    }}
                  >
                    <div className="fs-4 mt-0.5">
                      {report?.status_color === "green" && <FaCheckCircle className="text-success" />}
                      {report?.status_color === "amber" && <FaExclamationTriangle className="text-warning" />}
                      {report?.status_color === "red" && <FaTimesCircle className="text-danger" />}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                        <h6 className="fw-bold mb-0" style={{ fontSize: 13.5, color: report?.status_color === "green" ? "#166534" : report?.status_color === "amber" ? "#92400E" : "#991B1B" }}>
                          {report?.overall_status === "READY_FOR_FC" && "READY FOR FC / E-SCRUTINY"}
                          {report?.overall_status === "PROVISIONAL_NEEDS_ACTION" && "PROVISIONAL STATUS — ACTION REQUIRED"}
                          {report?.overall_status === "HIGH_RISK_REJECTION" && "HIGH RISK OF SEAT CONVERSION TO GENERAL"}
                        </h6>
                        <span
                          className="badge fw-bold"
                          style={{
                            fontSize: 9.5,
                            background: "#FFFFFF",
                            color: report?.status_color === "green" ? "#166534" : report?.status_color === "amber" ? "#92400E" : "#991B1B",
                            border: "1px solid currentColor"
                          }}
                        >
                          {report?.overall_status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="small mb-0 mt-1" style={{ fontSize: 11.5, lineHeight: 1.5, color: "#334155" }}>
                        {report?.status_message}
                      </p>
                    </div>
                  </div>

                  {/* CRITICAL WARNINGS */}
                  {report?.critical_warnings?.length > 0 && (
                    <div className="p-2.5 rounded-3 border border-warning bg-warning bg-opacity-10">
                      <div className="d-flex align-items-center gap-1.5 text-warning-emphasis fw-bold small mb-1" style={{ fontSize: 11.5 }}>
                        <FaExclamationTriangle />
                        <span>Critical Rules & Deadlines to Prevent Seat Cancellation:</span>
                      </div>
                      <ul className="mb-0 ps-3 small text-dark space-y-1" style={{ fontSize: 11 }}>
                        {report.critical_warnings.map((warn, i) => (
                          <li key={i} className="mb-0.5">{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* MANDATORY DOCUMENTS CHECKLIST */}
                  <div className="card border rounded-3 shadow-sm" style={{ borderColor: "#E2E8F0" }}>
                    <div className="card-header bg-white border-bottom py-2 px-3 d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: 12.5 }}>
                          Official Required Documents Checklist
                        </h6>
                        <span className="small text-muted" style={{ fontSize: 10.5 }}>
                          Official mandates for {report?.authority_name || "State CET Cell"}
                        </span>
                      </div>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle fw-semibold" style={{ fontSize: 11 }}>
                        {Object.values(checkedDocs).filter(Boolean).length} / {(report?.mandatory_documents?.length || 0) + (report?.conditional_documents?.length || 0)} Confirmed
                      </span>
                    </div>

                    <div className="card-body p-2" style={{ maxHeight: "210px", overflowY: "auto" }}>
                      <div className="d-flex flex-column gap-1.5">
                        {/* CORE MANDATORY DOCS */}
                        {report?.mandatory_documents?.map((doc, idx) => {
                          const isDone = !!checkedDocs[`core-${idx}`];
                          return (
                            <div
                              key={`core-${idx}`}
                              onClick={() => toggleCheck(`core-${idx}`)}
                              className="d-flex align-items-start gap-2 p-2 rounded-2 transition-all"
                              style={{
                                cursor: "pointer",
                                background: isDone ? "#F8FAFC" : "#FFFFFF",
                                border: isDone ? "1px solid #CBD5E1" : "1px solid #E2E8F0"
                              }}
                            >
                              <div className="mt-0.5 text-primary">
                                {isDone ? <FaCheckSquare className="text-success" size={14} /> : <FaSquare className="text-secondary opacity-50" size={14} />}
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center justify-content-between">
                                  <span className={`small fw-bold ${isDone ? "text-decoration-line-through text-muted" : "text-dark"}`} style={{ fontSize: 11.5 }}>
                                    {doc.name}
                                  </span>
                                  <span className="badge bg-light text-secondary border" style={{ fontSize: 9 }}>
                                    Mandatory
                                  </span>
                                </div>
                                <p className="mb-0 text-muted" style={{ fontSize: 10.5 }}>
                                  Authority: {doc.authority} • {doc.notes}
                                </p>
                              </div>
                            </div>
                          );
                        })}

                        {/* CONDITIONAL DOCS */}
                        {report?.conditional_documents?.map((doc, idx) => {
                          const isDone = !!checkedDocs[`cond-${idx}`];
                          return (
                            <div
                              key={`cond-${idx}`}
                              onClick={() => toggleCheck(`cond-${idx}`)}
                              className="d-flex align-items-start gap-2 p-2 rounded-2 transition-all"
                              style={{
                                cursor: "pointer",
                                background: isDone ? "#F8FAFC" : "#FFFBEB",
                                border: isDone ? "1px solid #CBD5E1" : "1px solid #FDE68A"
                              }}
                            >
                              <div className="mt-0.5">
                                {isDone ? <FaCheckSquare className="text-success" size={14} /> : <FaSquare className="text-warning" size={14} />}
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center justify-content-between">
                                  <span className={`small fw-bold ${isDone ? "text-decoration-line-through text-muted" : "text-warning-emphasis"}`} style={{ fontSize: 11.5 }}>
                                    {doc.name}
                                  </span>
                                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle" style={{ fontSize: 9 }}>
                                    Conditional
                                  </span>
                                </div>
                                <p className="mb-0 text-muted" style={{ fontSize: 10.5 }}>
                                  Authority: {doc.authority} • {doc.notes}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* PROFORMA REQUIRED CTA (Solid button with background) */}
                  {report?.applicable_proformas?.length > 0 && (
                    <div className="p-2.5 rounded-3 border border-primary bg-primary bg-opacity-10 d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <div className="d-flex align-items-center gap-2">
                        <FaFileContract className="text-primary fs-5" />
                        <div>
                          <div className="small fw-bold text-primary-emphasis" style={{ fontSize: 11.5 }}>
                            {report.applicable_proformas.length} Official Proforma / Affidavit Required
                          </div>
                          <span className="small text-muted" style={{ fontSize: 10.5 }}>
                            Ready to copy or print with your details pre-filled.
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("proformas")}
                        className="btn btn-sm text-white fw-bold px-3 py-1.5 rounded-pill shadow-sm"
                        style={{
                          background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                          border: "none",
                          fontSize: 11.5
                        }}
                      >
                        View & Print Proformas →
                      </button>
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* TAB 2: PROFORMAS & AFFIDAVITS GENERATOR */}
            {activeTab === "proformas" && (
              <div className="row g-3">
                
                {/* PROFORMA SELECTOR */}
                <div className="col-md-4">
                  <h6 className="fw-bold small text-secondary text-uppercase mb-2" style={{ letterSpacing: "0.5px", fontSize: 11 }}>
                    Available Formats & Proformas
                  </h6>
                  <div className="d-flex flex-column gap-2">
                    {Object.entries(proformasData).map(([key, item]) => {
                      const isApplicable = report?.applicable_proformas?.some(p => p.code === key);
                      const isSelected = selectedProformaKey === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedProformaKey(key)}
                          className="btn text-start p-2.5 rounded-3 border transition-all"
                          style={{
                            background: isSelected ? "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)" : "#F8FAFC",
                            color: isSelected ? "#FFFFFF" : "#1E293B",
                            borderColor: isSelected ? "#1E1B4B" : "#CBD5E1",
                            boxShadow: isSelected ? "0 2px 8px rgba(30,27,75,0.25)" : "none"
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span className="fw-bold small" style={{ fontSize: 11.5 }}>
                              {item.title.split("(")[0]}
                            </span>
                            {isApplicable && (
                              <span className={`badge ${isSelected ? "bg-warning text-dark" : "bg-danger text-white"}`} style={{ fontSize: 9 }}>
                                Required
                              </span>
                            )}
                          </div>
                          <p className={`small mb-0 line-clamp-2 ${isSelected ? "text-white-50" : "text-muted"}`} style={{ fontSize: 10.5 }}>
                            {item.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PREVIEW & ACTIONS */}
                <div className="col-md-8">
                  {proformasData[selectedProformaKey] ? (
                    <div className="card border rounded-3 p-3 shadow-sm h-100 d-flex flex-column" style={{ borderColor: "#E2E8F0" }}>
                      
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pb-2.5 border-bottom mb-2.5">
                        <div>
                          <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: 13 }}>
                            {proformasData[selectedProformaKey].title}
                          </h6>
                          <span className="small text-primary fw-semibold" style={{ fontSize: 11 }}>
                            Issuing: {proformasData[selectedProformaKey].stamp_required}
                          </span>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <button
                            onClick={() => handleCopy(getPersonalizedTemplate(proformasData[selectedProformaKey].template), selectedProformaKey)}
                            className="btn btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1.5 fw-bold shadow-sm"
                            style={{ background: "#E2E8F0", border: "1px solid #94A3B8", color: "#0F172A", fontSize: 11.5 }}
                          >
                            {copiedKey === selectedProformaKey ? (
                              <>
                                <FaCheck className="text-success" />
                                <span>Copied!</span>
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
                            className="btn btn-sm text-white rounded-pill px-3 py-1 d-flex align-items-center gap-1.5 fw-semibold shadow-sm"
                            style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)", border: "none", fontSize: 11.5 }}
                          >
                            <FaPrint />
                            <span>Print Format</span>
                          </button>
                        </div>
                      </div>

                      {/* Warning */}
                      {proformasData[selectedProformaKey].warning && (
                        <div className="p-2 rounded-2 border border-warning bg-warning bg-opacity-10 small mb-2 text-warning-emphasis d-flex align-items-start gap-1.5" style={{ fontSize: 11 }}>
                          <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                          <span>{proformasData[selectedProformaKey].warning}</span>
                        </div>
                      )}

                      {/* Draft Box */}
                      <div
                        className="p-2.5 rounded-2 border flex-grow-1 overflow-auto text-dark font-monospace"
                        style={{
                          background: "#F8FAFC",
                          borderColor: "#CBD5E1",
                          whiteSpace: "pre-wrap",
                          maxHeight: "320px",
                          fontSize: 11,
                          lineHeight: 1.55
                        }}
                      >
                        {getPersonalizedTemplate(proformasData[selectedProformaKey].template)}
                      </div>

                    </div>
                  ) : (
                    <div className="text-center text-muted p-5">
                      Select a proforma on the left to view and print
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 3: LIVE WEB-GROUNDED RULES Q&A */}
            {activeTab === "grounded_qa" && (
              <div className="mx-auto" style={{ maxWidth: "860px" }}>
                
                {/* Search Card */}
                <div className="card border rounded-3 p-3.5 shadow-sm mb-3" style={{ borderColor: "#E2E8F0" }}>
                  <div className="d-flex align-items-center justify-content-between mb-2.5">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white"
                        style={{ width: 32, height: 32, background: "#2563EB" }}
                      >
                        <FaSearch size={13} />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: 13 }}>
                          Live Government Grounding Assistant
                        </h6>
                        <span className="small text-muted" style={{ fontSize: 10.5 }}>
                          Authoritative gazette verification from mahacet.org, josaa.nic.in, mcc.nic.in
                        </span>
                      </div>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle fw-bold" style={{ fontSize: 10 }}>
                      ● Grounding Active
                    </span>
                  </div>

                  <form onSubmit={handleAskGrounded} className="input-group mb-2.5">
                    <input
                      type="text"
                      className="form-control rounded-start-pill px-3 shadow-none"
                      style={{ fontSize: 12 }}
                      placeholder="Ask any rule (e.g. Can I submit CVC receipt in CAP 1? Is EWS valid across states?)"
                      value={groundedQuery}
                      onChange={(e) => setGroundedQuery(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={groundedLoading || !groundedQuery.trim()}
                      className="btn text-white rounded-end-pill px-3.5 fw-bold d-flex align-items-center gap-1.5"
                      style={{ background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)", border: "none", fontSize: 12 }}
                    >
                      {groundedLoading ? <FaSpinner className="spinner-border spinner-border-sm" /> : <FaSearch size={12} />}
                      <span>Verify Rule</span>
                    </button>
                  </form>

                  <div>
                    <span className="small fw-bold text-secondary d-block mb-1" style={{ fontSize: 10.5 }}>
                      Frequently Verified Counseling Mandates:
                    </span>
                    <div className="d-flex flex-wrap gap-1">
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
                          className="btn btn-sm rounded-pill px-2.5 py-1 text-start fw-semibold shadow-xs"
                          style={{ fontSize: 11, background: "#E2E8F0", border: "1px solid #94A3B8", color: "#0F172A" }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grounded Answer Display */}
                {groundedAnswer && (
                  <div className="card border rounded-3 p-3.5 shadow-sm" style={{ borderColor: "#E2E8F0" }}>
                    <div className="d-flex align-items-center justify-content-between pb-2 border-bottom mb-2.5">
                      <span className="badge bg-primary fw-bold text-uppercase" style={{ fontSize: 9.5 }}>
                        Verified Legal Verdict
                      </span>
                      <span className="small text-muted" style={{ fontSize: 10.5 }}>
                        Query: "{groundedAnswer.query}"
                      </span>
                    </div>

                    <div
                      className="text-dark small mb-2.5"
                      style={{ whiteSpace: "pre-line", lineHeight: 1.6, fontSize: 12 }}
                    >
                      {groundedAnswer.answer}
                    </div>

                    {groundedAnswer.citations?.length > 0 && (
                      <div className="pt-2 border-top">
                        <span className="small fw-bold text-secondary d-flex align-items-center gap-1.5 mb-1.5" style={{ fontSize: 10.5 }}>
                          <FaShieldAlt className="text-primary" />
                          Authoritative Web Grounding Citations:
                        </span>
                        <div className="d-flex flex-wrap gap-1">
                          {groundedAnswer.citations.map((cite, i) => (
                            <a
                              key={i}
                              href={cite.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="badge bg-light text-primary border p-2 text-decoration-none d-inline-flex align-items-center gap-1.5"
                              style={{ fontSize: 11 }}
                            >
                              <span>{cite.title || cite.url}</span>
                              <FaExternalLinkAlt size={8} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* TAB 4: FC SCRUTINY GUIDELINES */}
            {activeTab === "fc_guidelines" && (
              <div className="mx-auto" style={{ maxWidth: "860px" }}>
                
                <div className="card border rounded-3 p-3.5 shadow-sm mb-3" style={{ borderColor: "#E2E8F0" }}>
                  <div className="d-flex align-items-center gap-2 mb-1.5">
                    <FaShieldAlt className="text-primary fs-5" />
                    <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: 13 }}>
                      Facilitation Centre (FC / ARC) & e-Scrutiny Standard Operating Procedure
                    </h6>
                  </div>
                  <p className="small text-muted mb-2.5" style={{ fontSize: 11 }}>
                    Follow these step-by-step government guidelines to guarantee your documents pass scrutiny without rejection.
                  </p>

                  <div className="row g-2.5 mb-2.5">
                    <div className="col-md-6">
                      <div className="card h-100 border border-primary bg-primary bg-opacity-10 p-2.5 rounded-2">
                        <h6 className="fw-bold text-primary-emphasis small text-uppercase mb-1.5" style={{ fontSize: 11 }}>
                          Mode A: e-Scrutiny (Online Verification)
                        </h6>
                        <ul className="small text-dark ps-3 mb-0 space-y-1" style={{ fontSize: 11 }}>
                          <li>Candidate uploads color scans from home without visiting FC physically.</li>
                          <li>Scrutiny officer reviews documents in the online portal.</li>
                          <li>If an error is found, a <strong>Grievance is Raised</strong>. Candidate gets 48 hours to re-upload.</li>
                          <li>Keep monitoring your SMS and portal login daily during scrutiny window.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="card h-100 border border-secondary bg-light p-2.5 rounded-2">
                        <h6 className="fw-bold text-dark small text-uppercase mb-1.5" style={{ fontSize: 11 }}>
                          Mode B: Physical Scrutiny (At Designated FC Center)
                        </h6>
                        <ul className="small text-dark ps-3 mb-0 space-y-1" style={{ fontSize: 11 }}>
                          <li>Candidate books a time slot and visits any approved Facilitation Centre.</li>
                          <li>Carry <strong>ALL Original Documents</strong> + 2 sets of self-attested photocopies.</li>
                          <li>Officer verifies originals and returns them immediately on the spot.</li>
                          <li>Obtain official stamped <strong>FC Verification Acknowledgment</strong>.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2 bg-light border">
                    <span className="small fw-bold text-dark text-uppercase d-block mb-1" style={{ fontSize: 10.5 }}>
                      Five Golden Rules of Document Scrutiny:
                    </span>
                    <ul className="small text-muted ps-3 mb-0" style={{ fontSize: 10.5 }}>
                      {report?.fc_checklist?.map((item, idx) => (
                        <li key={idx} className="mb-0.5">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* FOOTER (Always firmly visible on screen, never cut off) */}
          <div
            className="modal-footer px-3.5 py-2.5 border-top d-flex justify-content-between align-items-center"
            style={{
              flexShrink: 0,
              background: "#F8FAFC",
              borderTop: "1px solid #E2E8F0"
            }}
          >
            <div className="d-flex align-items-center gap-1.5 text-muted small" style={{ fontSize: 11 }}>
              <FaShieldAlt className="text-success" />
              <span>Official Rules Matrix Grounding • Compatible with State CET Cell & JoSAA</span>
            </div>
            <button
              type="button"
              className="btn btn-sm rounded-pill px-4 fw-semibold text-white shadow-sm"
              style={{
                background: "#1E293B",
                border: "none",
                fontSize: 12
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
