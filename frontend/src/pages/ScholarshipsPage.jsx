import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaGraduationCap, FaSearch, FaCheckCircle, FaTimesCircle,
  FaExclamationTriangle, FaExternalLinkAlt, FaAward,
  FaMoneyBillWave, FaFileAlt, FaChevronDown, FaChevronUp, FaArrowLeft,
  FaShareAlt, FaCheck, FaUniversity, FaInfoCircle,
  FaUndo, FaSlidersH, FaTimes, FaFilter, FaHome
} from "react-icons/fa";
import { APP_NAME } from "./LandingPage";

/* ─────────────────────────────────────────────────────────
   THEME CONSTANTS (matches Dashboard indigo palette)
───────────────────────────────────────────────────────── */
const C = {
  primary:  "#1A237E",
  medium:   "#3949AB",
  gold:     "#FFB300",
  goldLight:"#FFF8E1",
  bg:       "#F0F2F8",
  white:    "#ffffff",
  success:  "#10B981",
  successBg:"#ECFDF5",
  warn:     "#F59E0B",
  warnBg:   "#FFFBEB",
  border:   "#E2E8F0",
  textMuted:"#64748B",
};

/* ─────────────────────────────────────────────────────────
   SCROLL-REVEAL HOOK
   Each observed element fires once when ≥15% is visible.
───────────────────────────────────────────────────────── */
function useScrollReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // fire once
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/* Animated wrapper — slides up + fades in on scroll */
function RevealCard({ children, delay = 0 }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateY(0px)" : "translateY(28px)",
        transition: `opacity 0.48s ease ${delay}ms, transform 0.48s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   MINI COMPONENTS
───────────────────────────────────────────────────────── */
function EligibilityPill({ met, label }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11.5,
        fontWeight: 600,
        background: met ? "#DCFCE7" : "#FEF3C7",
        color: met ? "#166534" : "#92400E",
        border: `1px solid ${met ? "#BBF7D0" : "#FDE68A"}`,
        whiteSpace: "nowrap",
      }}
    >
      {met ? "✓" : "⚠"} {label}
    </span>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 12,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        border: `1px solid ${C.border}`,
        minWidth: 150,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: accent + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.primary, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SCHOLARSHIP CARD
───────────────────────────────────────────────────────── */
function ScholarshipCard({ sch, expandedDocs, onToggleDocs, copiedId, onShare }) {
  const isEligible = Boolean(sch.is_eligible);
  const status     = sch.criteria_status || {};
  const domains    = Array.isArray(sch.domain) ? sch.domain : [];
  const documents  = Array.isArray(sch.documents_required) ? sch.documents_required : [];
  const unmet      = Array.isArray(status.unmet_reasons) ? status.unmet_reasons : [];
  const isDocsOpen = !!expandedDocs[sch.id];

  const borderColor = isEligible ? C.success : "#CBD5E1";
  const topStrip    = isEligible
    ? { background: "#ECFDF5", color: "#065F46", text: "✅ Eligible for You" }
    : { background: "#FEF3C7", color: "#92400E", text: "⚠ Criteria Not Fully Met" };

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 16,
        border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: isEligible
          ? "0 2px 12px rgba(16,185,129,0.08)"
          : "0 1px 6px rgba(0,0,0,0.05)",
        overflow: "hidden",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* ── Eligibility Strip ── */}
      <div
        style={{
          background: topStrip.background,
          color: topStrip.color,
          fontSize: 11.5,
          fontWeight: 700,
          padding: "5px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <span>{topStrip.text}</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <EligibilityPill met={status.income_met}   label={`Income ≤ ${sch.yearly_income_limit_text || "Any"}`} />
          <EligibilityPill met={status.tenth_met}    label={`10th ${sch.min_10th_marks > 0 ? sch.min_10th_marks + "%" : "Pass"}`} />
          <EligibilityPill met={status.twelfth_met}  label={`12th ${sch.min_12th_marks > 0 ? sch.min_12th_marks + "%" : "Pass"}`} />
          <EligibilityPill met={status.gender_met && status.category_met} label={sch.gender || "All"} />
        </div>
      </div>

      {/* ── Card Body ── */}
      <div style={{ padding: "16px 20px" }}>

        {/* Row 1: Source badge + award amount */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {sch.source === "Buddy4Study" ? (
              <span style={{ background: "rgba(26,35,126,0.08)", color: C.primary, border: `1px solid rgba(26,35,126,0.2)`, borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "3px 10px" }}>
                🤝 Buddy4Study
              </span>
            ) : (
              <span style={{ background: "#E0F2FE", color: "#0C4A6E", border: "1px solid #BAE6FD", borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "3px 10px" }}>
                🏛️ Government
              </span>
            )}
            {domains.map((d, i) => (
              <span key={i} style={{ background: "#F1F5F9", color: "#475569", borderRadius: 20, fontSize: 10.5, fontWeight: 600, padding: "2px 8px", border: "1px solid #E2E8F0" }}>
                {d}
              </span>
            ))}
            {sch.application_cycle && (
              <span style={{ background: "#F8FAFC", color: C.textMuted, borderRadius: 20, fontSize: 10, fontWeight: 600, padding: "2px 8px", border: "1px solid #E2E8F0" }}>
                📅 {sch.application_cycle}
              </span>
            )}
          </div>

          {/* Award Amount — prominent */}
          <div style={{
            background: `linear-gradient(135deg, #FFF8E1, #FFECB3)`,
            border: "1px solid #FDE68A",
            borderRadius: 12,
            padding: "8px 16px",
            textAlign: "center",
            minWidth: 110,
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 10, color: "#92400E", fontWeight: 600, marginBottom: 1 }}>Award Value</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#B45309", lineHeight: 1.2 }}>
              {sch.award_amount || "Varies"}
            </div>
          </div>
        </div>

        {/* Scholarship Name */}
        <h5 style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 700,
          color: C.primary,
          fontSize: 16,
          margin: "0 0 3px 0",
          lineHeight: 1.4,
        }}>
          {sch.scheme_name}
        </h5>

        {/* Provider line */}
        <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 10 }}>
          By <strong style={{ color: "#334155" }}>{sch.provider}</strong>
          {sch.provider_type && <span style={{ marginLeft: 6, color: "#94A3B8" }}>• {sch.provider_type}</span>}
        </div>

        {/* Unmet Reasons (only when not eligible) */}
        {!isEligible && unmet.length > 0 && (
          <div style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
            color: "#92400E",
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
            marginBottom: 10,
          }}>
            <FaExclamationTriangle size={12} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <span><strong>Adjust:</strong> {unmet.join(" • ")}</span>
          </div>
        )}

        {/* Description */}
        <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.65, margin: "0 0 12px 0" }}>
          {sch.other_criteria}
        </p>

        {/* Documents Accordion */}
        {documents.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => onToggleDocs(sch.id)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: C.medium,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <FaFileAlt size={11} />
              {isDocsOpen ? "Hide Documents" : `Required Documents (${documents.length})`}
              {isDocsOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
            </button>

            {isDocsOpen && (
              <div style={{
                marginTop: 8,
                background: "#F8FAFC",
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "10px 14px",
              }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#334155", marginBottom: 6 }}>Required Documents:</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
                  {documents.map((doc, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569" }}>
                      <FaCheckCircle size={11} color={C.success} style={{ flexShrink: 0 }} />
                      {doc}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 12,
          borderTop: `1px solid ${C.border}`,
          flexWrap: "wrap",
          gap: 8,
        }}>
          <span style={{ fontSize: 12, color: C.textMuted }}>
            Apply on: <strong style={{ color: "#334155" }}>{sch.portal_name || "Official Portal"}</strong>
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => onShare(sch)}
              style={{
                background: "#F8FAFC",
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                padding: "5px 14px",
                fontSize: 12,
                fontWeight: 600,
                color: "#475569",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {copiedId === sch.id ? <FaCheck size={11} color={C.success} /> : <FaShareAlt size={11} />}
              {copiedId === sch.id ? "Copied!" : "Share"}
            </button>
            <a
              href={sch.portal_url || "https://www.buddy4study.com"}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.medium})`,
                color: C.white,
                borderRadius: 20,
                padding: "5px 16px",
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 8px rgba(26,35,126,0.22)",
              }}
            >
              Apply Now <FaExternalLinkAlt size={10} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SIDEBAR FILTER
───────────────────────────────────────────────────────── */
function SidebarFilter({
  stream, setStream,
  tenthMarks, setTenthMarks,
  twelfthMarks, setTwelfthMarks,
  income, setIncome,
  category, setCategory,
  gender, setGender,
  isHosteler, setIsHosteler,
  fees, setFees,
  financialSummary,
  onReset,
  mobileOpen, setMobileOpen,
}) {
  const content = (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingBottom: 12, marginBottom: 14, borderBottom: `2px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Poppins', sans-serif", fontWeight: 700, color: C.primary, fontSize: 14 }}>
          <FaSlidersH size={14} color={C.primary} />
          Your Profile
        </div>
        <button
          type="button"
          onClick={onReset}
          style={{ background: "none", border: "none", color: C.medium, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
        >
          <FaUndo size={10} /> Reset
        </button>
      </div>

      {/* Domain */}
      <FilterGroup label="📚 Stream / Domain">
        <select className="form-select form-select-sm" value={stream} onChange={e => setStream(e.target.value)} style={{ fontSize: 13 }}>
          <option value="All">All Domains</option>
          <option value="Engineering">🛠️ Engineering</option>
          <option value="Medical">🩺 Medical / MBBS</option>
          <option value="Commerce">💼 Commerce / MBA</option>
          <option value="Sciences">🔬 Pure Sciences</option>
          <option value="Design">🎨 Design / Architecture</option>
          <option value="Law">⚖️ Law / LLB</option>
          <option value="Arts">📖 Arts / Humanities</option>
        </select>
      </FilterGroup>

      {/* 10th Marks */}
      <FilterGroup label={<span>📋 Class 10th Marks <SliderBadge val={tenthMarks + "%"} /></span>}>
        <input type="range" className="form-range" min="40" max="100" step="1" value={tenthMarks}
          onChange={e => setTenthMarks(Number(e.target.value))} style={{ accentColor: C.primary }} />
      </FilterGroup>

      {/* 12th Marks */}
      <FilterGroup label={<span>📋 Class 12th Marks <SliderBadge val={twelfthMarks + "%"} /></span>}>
        <input type="range" className="form-range" min="40" max="100" step="1" value={twelfthMarks}
          onChange={e => setTwelfthMarks(Number(e.target.value))} style={{ accentColor: C.primary }} />
      </FilterGroup>

      {/* Family Income */}
      <FilterGroup label={<span>💰 Family Income <SliderBadge val={`₹${(income / 100000).toFixed(1)}L`} /></span>}>
        <input type="range" className="form-range" min="50000" max="1500000" step="25000" value={income}
          onChange={e => setIncome(Number(e.target.value))} style={{ accentColor: C.primary }} />
        <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
          {[250000, 600000, 800000].map(amt => (
            <button
              key={amt}
              type="button"
              onClick={() => setIncome(amt)}
              style={{
                flex: 1,
                padding: "3px 0",
                fontSize: 10.5,
                fontWeight: 600,
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: income === amt ? C.primary : "#F8FAFC",
                color: income === amt ? C.white : "#475569",
                cursor: "pointer",
              }}
            >
              ≤₹{(amt / 100000).toFixed(1)}L
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Divider */}
      <div style={{ borderTop: `1px dashed ${C.border}`, margin: "12px 0" }} />

      {/* Category */}
      <FilterGroup label="🪪 Caste / Category">
        <select className="form-select form-select-sm" value={category} onChange={e => setCategory(e.target.value)} style={{ fontSize: 13 }}>
          <option value="OPEN">OPEN / General</option>
          <option value="EWS">EWS</option>
          <option value="OBC">OBC</option>
          <option value="SC">SC</option>
          <option value="ST">ST</option>
          <option value="VJNT">VJ / NT / SBC</option>
          <option value="TFWS">TFWS (5% Quota)</option>
        </select>
      </FilterGroup>

      {/* Gender */}
      <FilterGroup label="👤 Gender">
        <div style={{ display: "flex", gap: 6 }}>
          {["Male", "Female"].map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              style={{
                flex: 1,
                padding: "5px 0",
                fontSize: 12.5,
                fontWeight: 600,
                borderRadius: 8,
                border: `1px solid ${gender === g ? C.primary : C.border}`,
                background: gender === g ? C.primary : "#F8FAFC",
                color: gender === g ? C.white : "#475569",
                cursor: "pointer",
              }}
            >
              {g === "Male" ? "♂ Male" : "♀ Female"}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Hostel */}
      <FilterGroup label="🏠 Residence">
        <div style={{ display: "flex", gap: 6 }}>
          {[{ val: true, label: "Hostel" }, { val: false, label: "Day Scholar" }].map(opt => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setIsHosteler(opt.val)}
              style={{
                flex: 1,
                padding: "5px 0",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 8,
                border: `1px solid ${isHosteler === opt.val ? C.primary : C.border}`,
                background: isHosteler === opt.val ? C.primary : "#F8FAFC",
                color: isHosteler === opt.val ? C.white : "#475569",
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Tuition Fee */}
      <FilterGroup label="🎓 Annual Tuition (₹)">
        <input
          type="number"
          className="form-control form-control-sm"
          value={fees}
          onChange={e => setFees(Number(e.target.value))}
          step="5000"
          style={{ fontSize: 13 }}
        />
      </FilterGroup>

      {/* Fee Waiver Box */}
      {financialSummary && (financialSummary.tuition_waiver_applied || 0) > 0 && (
        <div style={{
          marginTop: 14,
          background: "#ECFDF5",
          border: "1px solid #BBF7D0",
          borderLeft: `3px solid ${C.success}`,
          borderRadius: 10,
          padding: "10px 12px",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#065F46", marginBottom: 3 }}>
            ✅ Statutory Fee Subsidy Active
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>
            Save ₹{(financialSummary.tuition_waiver_applied || 0).toLocaleString("en-IN")} / yr
          </div>
          <div style={{ fontSize: 11.5, color: "#047857", marginTop: 2 }}>
            Net payable: ₹{(financialSummary.net_payable_tuition || 0).toLocaleString("en-IN")} · {financialSummary.discount_percentage || 0}% waiver
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="d-none d-lg-block" style={{ position: "sticky", top: 76, zIndex: 10 }}>
        <div style={{
          background: C.white,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          padding: "18px 18px",
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
        }}>
          {content}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1050,
            background: "rgba(0,0,0,0.45)",
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            style={{
              position: "absolute", left: 0, top: 0, bottom: 0, width: "85%", maxWidth: 340,
              background: C.white,
              padding: "20px 18px",
              overflowY: "auto",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontWeight: 700, color: C.primary, fontSize: 15 }}>Filter Scholarships</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted }}
              >
                <FaTimes size={18} />
              </button>
            </div>
            {content}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "10px",
                background: `linear-gradient(135deg, ${C.primary}, ${C.medium})`,
                color: C.white,
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SliderBadge({ val }) {
  return (
    <span style={{
      marginLeft: 6,
      background: "#EEF2FF",
      color: C.primary,
      border: `1px solid #C7D2FE`,
      borderRadius: 10,
      fontSize: 11,
      fontWeight: 700,
      padding: "1px 7px",
    }}>{val}</span>
  );
}

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
export default function ScholarshipsPage({ studentProfile, currentUser, onLogout }) {
  const navigate = useNavigate();

  const profile = useMemo(() => {
    const raw = typeof studentProfile === "object" && studentProfile !== null ? studentProfile : {};
    return {
      name: raw.name || "Student",
      stream: raw.stream || "All",
      marks: Number(raw.marks) || 85,
      preferred_state: raw.preferred_state || "Maharashtra",
      ...raw
    };
  }, [studentProfile]);

  // Filter state
  const [stream,       setStream]       = useState(profile.stream || "All");
  const [tenthMarks,   setTenthMarks]   = useState(80);
  const [twelfthMarks, setTwelfthMarks] = useState(() => { const m = Number(profile.marks); return !isNaN(m) && m > 0 ? Math.min(100, Math.round(m)) : 85; });
  const [income,       setIncome]       = useState(500000);
  const [category,     setCategory]     = useState("OPEN");
  const [gender,       setGender]       = useState("Male");
  const [isHosteler,   setIsHosteler]   = useState(true);
  const [fees,         setFees]         = useState(140000);
  const [state,        setState]        = useState(profile.preferred_state || "Maharashtra");

  // Search / sort / UI state
  const [searchQuery,    setSearchQuery]    = useState("");
  const [providerSource, setProviderSource] = useState("All");
  const [onlyEligible,   setOnlyEligible]   = useState(false);
  const [sortBy,         setSortBy]         = useState("recommended");
  const [expandedDocs,   setExpandedDocs]   = useState({});
  const [copiedId,       setCopiedId]       = useState(null);
  const [mobileFilter,   setMobileFilter]   = useState(false);

  // API data
  const [scholarshipsData, setScholarshipsData] = useState([]);
  const [statutorySchemes, setStatutorySchemes] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading,          setLoading]          = useState(true);

  const fetchScholarships = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calculate-scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annual_fees:   Number(fees)   || 140000,
          category:      category       || "OPEN",
          family_income: Number(income) || 600000,
          gender:        gender         || "Male",
          state:         state          || "Maharashtra",
          is_hosteler:   Boolean(isHosteler),
          stream:        stream         || "All",
          tenth_marks:   Number(tenthMarks)   || 80,
          twelfth_marks: Number(twelfthMarks) || 85,
          provider_type: providerSource || "All"
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setScholarshipsData(Array.isArray(data.all_scholarships) ? data.all_scholarships : []);
        setStatutorySchemes(Array.isArray(data.eligible_schemes) ? data.eligible_schemes : []);
        setFinancialSummary(data.financial_summary || null);
      }
    } catch (err) {
      console.error("Failed to fetch scholarships:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScholarships(); },
    [fees, category, income, gender, state, isHosteler, stream, tenthMarks, twelfthMarks, providerSource]); // eslint-disable-line

  const toggleDocExpand = id => setExpandedDocs(prev => ({ ...prev, [id]: !prev[id] }));

  const handleShare = sch => {
    const text = `${sch.scheme_name || "Scholarship"} — ${sch.award_amount || ""}\nBy: ${sch.provider || ""}\nEligibility: Income ≤ ${sch.yearly_income_limit_text || "Limit"}, Min 12th: ${sch.min_12th_marks || 0}%\nApply: ${sch.portal_url || "https://www.buddy4study.com"}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(sch.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const resetFilters = () => {
    setStream("All"); setTenthMarks(80); setTwelfthMarks(85);
    setIncome(500000); setCategory("OPEN"); setGender("Male");
    setIsHosteler(true); setSearchQuery(""); setProviderSource("All");
    setOnlyEligible(false); setSortBy("recommended");
  };

  // Client-side filter + sort
  const filteredScholarships = useMemo(() => {
    let list = (Array.isArray(scholarshipsData) ? scholarshipsData : []).filter(sch => {
      const q = (searchQuery || "").toLowerCase().trim();
      const matchesSearch = q === "" ||
        (sch.scheme_name || "").toLowerCase().includes(q) ||
        (sch.provider    || "").toLowerCase().includes(q) ||
        (Array.isArray(sch.domain) ? sch.domain : []).some(d => (d || "").toLowerCase().includes(q));
      const matchesEligible = onlyEligible ? Boolean(sch.is_eligible) : true;
      return matchesSearch && matchesEligible;
    });

    if (sortBy === "awardDesc") {
      list.sort((a, b) => (b.annual_saving || 0) - (a.annual_saving || 0));
    } else if (sortBy === "incomeAsc") {
      list.sort((a, b) => (a.yearly_income_limit || 0) - (b.yearly_income_limit || 0));
    } else if (sortBy === "marksAsc") {
      list.sort((a, b) => (a.min_12th_marks || 0) - (b.min_12th_marks || 0));
    } else {
      list.sort((a, b) => {
        if (a.is_eligible && !b.is_eligible) return -1;
        if (!a.is_eligible && b.is_eligible) return 1;
        return (b.annual_saving || 0) - (a.annual_saving || 0);
      });
    }
    return list;
  }, [scholarshipsData, searchQuery, onlyEligible, sortBy]);

  const eligible   = filteredScholarships.filter(s => s.is_eligible);
  const ineligible = filteredScholarships.filter(s => !s.is_eligible);
  const totalEligible = (Array.isArray(scholarshipsData) ? scholarshipsData : []).filter(s => s.is_eligible).length;

  /* ── Sidebar props ── */
  const sidebarProps = {
    stream, setStream, tenthMarks, setTenthMarks, twelfthMarks, setTwelfthMarks,
    income, setIncome, category, setCategory, gender, setGender,
    isHosteler, setIsHosteler, fees, setFees, financialSummary, onReset: resetFilters,
    mobileOpen: mobileFilter, setMobileOpen: setMobileFilter,
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column" }}>

      {/* ══════════════ NAVBAR ══════════════ */}
      <nav style={{
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.medium} 100%)`,
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 1030,
        boxShadow: "0 2px 10px rgba(26,35,126,0.25)",
      }}>
        <Link
          to="/"
          style={{
            display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
            fontFamily: "'Poppins', sans-serif", fontWeight: 700, color: C.white, fontSize: 18,
          }}
        >
          <FaGraduationCap size={26} color={C.gold} />
          {APP_NAME}
        </Link>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => navigate(studentProfile ? "/dashboard" : "/")}
            style={{
              background: "#FFFFFF",
              border: "1px solid #FFFFFF",
              borderRadius: 20,
              color: "#1A237E",
              fontSize: 12.5,
              fontWeight: 700,
              padding: "6px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 4px rgba(0,0,0,0.08)"
            }}
          >
            <FaArrowLeft size={11} color="#1A237E" />
            {studentProfile ? "Dashboard" : "Home"}
          </button>
          <button
            onClick={() => navigate("/chat")}
            style={{
              background: "#FFFFFF",
              border: "1px solid #FFFFFF",
              borderRadius: 20,
              color: "#1A237E",
              fontSize: 12.5,
              fontWeight: 700,
              padding: "6px 16px",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.08)"
            }}
          >
            💬 Talk to Counselor
          </button>
        </div>
      </nav>

      {/* ══════════════ HERO BANNER ══════════════ */}
      <div style={{
        background: `linear-gradient(135deg, ${C.primary} 0%, #283593 50%, ${C.medium} 100%)`,
        color: C.white,
        padding: "28px 32px 24px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Breadcrumb tag */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,179,0,0.18)", border: `1px solid ${C.gold}`,
            borderRadius: 20, padding: "3px 12px", marginBottom: 12,
            color: "#FFD54F", fontSize: 12, fontWeight: 600,
          }}>
            <FaAward size={12} color="#FFD54F" /> 2025–2026 Scholarships Portal
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{
                fontFamily: "'Poppins', sans-serif", fontWeight: 800,
                fontSize: "clamp(22px, 3vw, 34px)", margin: "0 0 8px 0", lineHeight: 1.25,
              }}>
                Scholarships & Fee Waiver Hub
              </h1>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13.5, margin: "0 0 16px 0", maxWidth: 640, lineHeight: 1.65 }}>
                Verified funding from <strong style={{ color: C.white }}>Buddy4Study (Corporate CSR)</strong>, Reliance, Tata, Kotak,
                Infosys, Siemens and <strong style={{ color: C.white }}>MahaDBT &amp; National Scholarship Portal</strong> — matched to your profile.
              </p>
              {/* Stat pills */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { icon: "🎓", text: "24+ Verified Schemes" },
                  { icon: "💰", text: "Up to ₹2,00,000 / Course" },
                  { icon: "🤝", text: "Direct Buddy4Study Links" },
                  { icon: "⚡", text: "Real-Time Criteria Match" },
                ].map((p, i) => (
                  <span key={i} style={{
                    background: i === 1 ? C.gold : "rgba(255,255,255,0.12)",
                    color: i === 1 ? C.primary : C.white,
                    border: `1px solid ${i === 1 ? C.gold : "rgba(255,255,255,0.2)"}`,
                    borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600,
                  }}>
                    {p.icon} {p.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Eligibility card */}
            <div style={{
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 14, padding: "16px 22px",
              minWidth: 200, textAlign: "center",
              backdropFilter: "blur(8px)",
            }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4, fontWeight: 600 }}>Your Matches</div>
              <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1, color: C.white }}>
                {loading ? "—" : totalEligible}
              </div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                of {scholarshipsData.length || 24} total schemes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ BODY: SIDEBAR + CONTENT ══════════════ */}
      <div style={{ flex: 1, maxWidth: 1200, margin: "0 auto", width: "100%", padding: "24px 20px" }}>
        <div className="row g-4">

          {/* ─── LEFT: SIDEBAR ─── */}
          <div className="col-12 col-lg-3">
            <SidebarFilter {...sidebarProps} />
          </div>

          {/* ─── RIGHT: CONTENT ─── */}
          <div className="col-12 col-lg-9">

            {/* Mobile filter toggle */}
            <div className="d-lg-none mb-3">
              <button
                type="button"
                onClick={() => setMobileFilter(true)}
                style={{
                  width: "100%", padding: "10px", borderRadius: 10,
                  background: C.primary, color: C.white, border: "none",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <FaFilter size={13} /> Filter Scholarships ({totalEligible} eligible for you)
              </button>
            </div>

            {/* ── Summary Stats Bar ── */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <StatCard icon={<FaCheckCircle size={18} color={C.success} />} label="Eligible for You" value={loading ? "…" : totalEligible} accent={C.success} />
              <StatCard icon={<FaAward size={18} color={C.gold} />} label="Total Schemes" value={loading ? "…" : scholarshipsData.length || 24} accent={C.gold} />
              {financialSummary && (financialSummary.tuition_waiver_applied || 0) > 0 && (
                <StatCard icon={<FaMoneyBillWave size={18} color="#8B5CF6" />} label="Fee Waiver / yr" value={`₹${(financialSummary.tuition_waiver_applied || 0).toLocaleString("en-IN")}`} accent="#8B5CF6" />
              )}
            </div>

            {/* ── Search + Sort Toolbar ── */}
            <div style={{
              background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
              padding: "14px 16px", marginBottom: 18,
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                {/* Search */}
                <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: 9, padding: "6px 12px" }}>
                  <FaSearch size={13} color={C.textMuted} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search Reliance, Tata, Kotak, HDFC..."
                    style={{ border: "none", background: "none", outline: "none", width: "100%", fontSize: 13, color: "#374151" }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 0 }}>
                      <FaTimes size={12} />
                    </button>
                  )}
                </div>

                {/* Provider select */}
                <select
                  className="form-select form-select-sm"
                  value={providerSource}
                  onChange={e => setProviderSource(e.target.value)}
                  style={{ fontSize: 12.5, maxWidth: 200 }}
                >
                  <option value="All">All Providers</option>
                  <option value="Buddy4Study">🤝 Buddy4Study CSR</option>
                  <option value="Government">🏛️ Government Schemes</option>
                </select>

                {/* Sort */}
                <select
                  className="form-select form-select-sm"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  style={{ fontSize: 12.5, maxWidth: 160 }}
                >
                  <option value="recommended">Best Match</option>
                  <option value="awardDesc">Highest Award</option>
                  <option value="incomeAsc">Lowest Income Cap</option>
                  <option value="marksAsc">Lowest Min Marks</option>
                </select>

                {/* Eligible toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                  <input
                    type="checkbox"
                    id="eligibleToggle"
                    checked={onlyEligible}
                    onChange={e => setOnlyEligible(e.target.checked)}
                    style={{ accentColor: C.primary, width: 14, height: 14, cursor: "pointer" }}
                  />
                  <label htmlFor="eligibleToggle" style={{ fontSize: 12.5, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
                    Eligible Only
                  </label>
                </div>
              </div>

              {/* Active filter badges */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, alignItems: "center" }}>
                <span style={{ fontSize: 11.5, color: C.textMuted, fontWeight: 600 }}>Active:</span>
                {[
                  `Stream: ${stream}`,
                  `10th ≥ ${tenthMarks}%`,
                  `12th ≥ ${twelfthMarks}%`,
                  `Income ≤ ₹${(income / 100000).toFixed(1)}L`,
                  `${category}`,
                  gender,
                ].map((tag, i) => (
                  <span key={i} style={{
                    background: "#EEF2FF", color: C.primary, borderRadius: 20,
                    fontSize: 11, fontWeight: 600, padding: "2px 9px",
                    border: `1px solid #C7D2FE`,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* ── SCHOLARSHIP CARDS ── */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div className="spinner-border text-primary" role="status" />
                <div style={{ color: C.textMuted, fontSize: 13, marginTop: 12 }}>
                  Loading scholarships from Buddy4Study &amp; government portals…
                </div>
              </div>

            ) : filteredScholarships.length === 0 ? (
              <div style={{
                background: C.white, borderRadius: 16, border: `1px solid ${C.border}`,
                padding: "48px 32px", textAlign: "center",
              }}>
                <FaInfoCircle size={40} color="#CBD5E1" style={{ marginBottom: 14 }} />
                <h5 style={{ color: "#334155", fontWeight: 700 }}>No scholarships match your criteria</h5>
                <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 16 }}>
                  Try expanding your stream, adjusting income or marks sliders, or clearing your search.
                </p>
                <button
                  onClick={resetFilters}
                  style={{
                    background: `linear-gradient(135deg, ${C.primary}, ${C.medium})`,
                    color: C.white, border: "none", borderRadius: 20,
                    padding: "8px 24px", fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Reset All Filters
                </button>
              </div>

            ) : (
              <div>
                {/* ── ELIGIBLE SECTION ── */}
                {eligible.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
                      paddingBottom: 10, borderBottom: `2px solid #BBF7D0`,
                    }}>
                      <span style={{ fontSize: 18 }}>🟢</span>
                      <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15.5, color: "#166534" }}>
                        {eligible.length} Scholarship{eligible.length !== 1 ? "s" : ""} You Qualify For
                      </span>
                      <span style={{
                        background: "#DCFCE7", color: "#166534",
                        borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "2px 10px",
                      }}>
                        Eligible ✓
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {eligible.map((sch, idx) => (
                        <RevealCard key={sch.id || sch.scheme_name} delay={Math.min((idx % 4) * 60, 200)}>
                          <ScholarshipCard
                            sch={sch}
                            expandedDocs={expandedDocs}
                            onToggleDocs={toggleDocExpand}
                            copiedId={copiedId}
                            onShare={handleShare}
                          />
                        </RevealCard>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── OTHER SCHOLARSHIPS SECTION ── */}
                {!onlyEligible && ineligible.length > 0 && (
                  <div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
                      paddingBottom: 10, borderBottom: `2px solid ${C.border}`,
                    }}>
                      <span style={{ fontSize: 18 }}>📋</span>
                      <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15.5, color: "#475569" }}>
                        {ineligible.length} Other Schemes
                      </span>
                      <span style={{
                        background: "#FEF3C7", color: "#92400E",
                        borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "2px 10px",
                      }}>
                        Adjust filters to qualify →
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {ineligible.map((sch, idx) => (
                        <RevealCard key={sch.id || sch.scheme_name} delay={Math.min((idx % 4) * 60, 200)}>
                          <ScholarshipCard
                            sch={sch}
                            expandedDocs={expandedDocs}
                            onToggleDocs={toggleDocExpand}
                            copiedId={copiedId}
                            onShare={handleShare}
                          />
                        </RevealCard>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STATUTORY FEE WAIVER SECTION (collapsible at bottom) ── */}
            {statutorySchemes.length > 0 && (
              <StatutorySection schemes={statutorySchemes} summary={financialSummary} />
            )}

          </div>
        </div>
      </div>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{
        background: C.white,
        borderTop: `1px solid ${C.border}`,
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10,
        fontSize: 12.5,
        color: C.textMuted,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FaGraduationCap color={C.gold} size={18} />
          <strong style={{ color: C.primary }}>{APP_NAME}</strong>
          <span>• AI-Powered Scholarships &amp; Guidance Hub</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { href: "https://www.buddy4study.com", label: "Buddy4Study" },
            { href: "https://scholarships.gov.in", label: "NSP Portal" },
            { href: "https://mahadbt.maharashtra.gov.in", label: "MahaDBT" },
          ].map(l => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: C.textMuted, textDecoration: "none", fontWeight: 600 }}
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STATUTORY FEE WAIVER SECTION
───────────────────────────────────────────────────────── */
function StatutorySection({ schemes, summary }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      marginTop: 32,
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
    }}>
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          padding: "14px 20px",
          background: "linear-gradient(135deg, #1A237E08, #3949AB08)",
          border: "none",
          borderBottom: open ? `1px solid ${C.border}` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🏛️</span>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, color: C.primary, fontSize: 14.5 }}>
            Statutory Fee Waiver Calculator (MahaDBT &amp; NSP)
          </span>
          <span style={{
            background: "#EEF2FF", color: C.primary, borderRadius: 20,
            fontSize: 11, fontWeight: 700, padding: "2px 9px", border: "1px solid #C7D2FE",
          }}>
            {schemes.length} schemes
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {summary && (summary.tuition_waiver_applied || 0) > 0 && (
            <span style={{ background: "#DCFCE7", color: "#166534", borderRadius: 20, fontSize: 11.5, fontWeight: 700, padding: "3px 10px" }}>
              Save ₹{(summary.tuition_waiver_applied || 0).toLocaleString("en-IN")}/yr
            </span>
          )}
          {open ? <FaChevronUp size={13} color={C.textMuted} /> : <FaChevronDown size={13} color={C.textMuted} />}
        </div>
      </button>

      {open && (
        <div style={{ padding: "20px" }}>
          {/* Summary row */}
          {summary && (
            <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { label: "Standard Fee", val: `₹${(summary.original_annual_fees || 0).toLocaleString("en-IN")}`, bg: "#F8FAFC", color: "#374151" },
                { label: "Fee Waiver", val: `-₹${(summary.tuition_waiver_applied || 0).toLocaleString("en-IN")}`, bg: "#ECFDF5", color: "#166534" },
                { label: "Net Payable", val: `₹${(summary.net_payable_tuition || 0).toLocaleString("en-IN")}`, bg: "#EEF2FF", color: C.primary },
              ].map((s, i) => (
                <div key={i} style={{
                  flex: 1, minWidth: 120, background: s.bg,
                  border: `1px solid ${C.border}`, borderRadius: 12,
                  padding: "12px 16px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 11.5, color: C.textMuted, marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>
          )}

          {/* Scheme cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {schemes.map((s, idx) => (
              <div key={idx} style={{
                background: "#F8FAFC", border: `1px solid ${C.border}`,
                borderLeft: `4px solid ${C.success}`, borderRadius: 12, padding: "14px 16px",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10,
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <FaCheckCircle size={14} color={C.success} />
                    <span style={{ fontWeight: 700, color: "#1E293B", fontSize: 14 }}>{s.scheme_name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>{s.authority}</div>
                  <p style={{ fontSize: 12.5, color: "#475569", margin: 0, lineHeight: 1.6 }}>{s.description}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    background: "#DCFCE7", color: "#166534", borderRadius: 10,
                    padding: "6px 14px", fontWeight: 700, fontSize: 13, marginBottom: 8,
                  }}>
                    Save ₹{(s.annual_saving || 0).toLocaleString("en-IN")}/yr
                  </div>
                  <a
                    href={s.portal || "https://scholarships.gov.in"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      color: C.primary, fontSize: 12, fontWeight: 700,
                      border: `1.5px solid ${C.primary}`, borderRadius: 20,
                      padding: "4px 12px", textDecoration: "none",
                    }}
                  >
                    Apply <FaExternalLinkAlt size={10} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
