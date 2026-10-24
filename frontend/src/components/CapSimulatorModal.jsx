import React, { useState, useEffect } from "react";
import {
  FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaCalendarAlt,
  FaLightbulb, FaSortAmountDown, FaArrowRight, FaTimes, FaShieldAlt,
  FaSpinner, FaListOl, FaUniversity, FaGraduationCap
} from "react-icons/fa";
import { formatScore } from "../utils/scoreUtils";

export default function CapSimulatorModal({ isOpen, onClose, studentProfile, shortlistedColleges = [], allColleges = [] }) {
  if (!isOpen) return null;

  const [choices, setChoices] = useState(() => {
    if (shortlistedColleges.length > 0) return shortlistedColleges.slice(0, 8);
    return allColleges.slice(0, 6);
  });

  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [activeTab, setActiveTab] = useState("simulation"); // "simulation" | "optimal" | "schedule"

  const runSimulation = async (choicesToSimulate) => {
    setLoading(true);
    try {
      const res = await fetch("/api/simulate-cap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_profile: {
            name: studentProfile.name,
            marks: studentProfile.marks,
            exam_type: studentProfile.exam_type,
            score_unit: studentProfile.score_unit
          },
          choices: choicesToSimulate.map(c => ({
            college_name: c.college_name,
            branch: c.branch || ((studentProfile.stream || "").toLowerCase() === "medical" ? "MBBS (Bachelor of Medicine & Surgery)" : "General Degree Program"),
            annual_fees: c.annual_fees || 120000,
            cutoff_marks: c.cutoff_marks
          }))
        })
      });
      const data = await res.json();
      if (data.success) {
        setSimulationResult(data);
      }
    } catch (err) {
      console.error("CAP simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (choices.length > 0) {
      runSimulation(choices);
    }
  }, []);

  const handleRemoveChoice = (index) => {
    const updated = choices.filter((_, i) => i !== index);
    setChoices(updated);
    if (updated.length > 0) runSimulation(updated);
  };

  const handleAddChoice = (college) => {
    if (choices.some(c => c.college_name === college.college_name)) return;
    if (choices.length >= 12) {
      alert("You can simulate up to 12 choices at a time.");
      return;
    }
    const updated = [...choices, college];
    setChoices(updated);
    runSimulation(updated);
  };

  const getProbColor = (p) => {
    if (p >= 75) return "#10B981"; // green
    if (p >= 40) return "#F59E0B"; // amber
    return "#EF4444"; // red
  };

  const schedule = simulationResult?.counseling_schedule || {};

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
      >
        <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden" style={{ maxHeight: "90vh" }}>
          
          {/* Header */}
          <div
            className="modal-header text-white px-4 py-3"
            style={{ background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)" }}
          >
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle p-2 bg-white bg-opacity-20 d-flex align-items-center justify-content-center">
                <FaGraduationCap size={22} className="text-warning" />
              </div>
              <div>
                <h5 className="modal-title fw-bold m-0" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  🎯 CAP Round Mock Seat Allotment Simulator & Optimizer
                </h5>
                <span className="small text-white-50">
                  {studentProfile.name} • {studentProfile.exam_type}: {formatScore(studentProfile.marks, studentProfile.exam_type, studentProfile.score_unit)}
                </span>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>

          {/* Subheader Navigation Tabs */}
          <div className="bg-light border-bottom px-4 py-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="btn-group btn-group-sm rounded-pill p-1 bg-white border">
              <button
                className={`btn rounded-pill px-3 fw-semibold ${activeTab === "simulation" ? "btn-primary shadow-sm" : "btn-light"}`}
                onClick={() => setActiveTab("simulation")}
              >
                📊 Compare Scores to Cutoffs
              </button>
              <button
                className={`btn rounded-pill px-3 fw-semibold ${activeTab === "optimal" ? "btn-primary shadow-sm" : "btn-light"}`}
                onClick={() => setActiveTab("optimal")}
              >
                ⭐ Option Form Order
              </button>
              <button
                className={`btn rounded-pill px-3 fw-semibold ${activeTab === "schedule" ? "btn-primary shadow-sm" : "btn-light"}`}
                onClick={() => setActiveTab("schedule")}
              >
                📅 Official Dates & Rules
              </button>
            </div>

            {simulationResult && (
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-white text-dark border px-2 py-1 small">
                  At/above: <strong>{simulationResult.distribution.at_or_above_cutoff}</strong>
                </span>
                <span className="badge bg-white text-dark border px-2 py-1 small">
                  Near: <strong>{simulationResult.distribution.near_cutoff}</strong>
                </span>
                <span className="badge bg-white text-dark border px-2 py-1 small">
                  Below: <strong>{simulationResult.distribution.below_cutoff}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4 bg-light overflow-auto">
            
            {/* Strategy Health Callout Banner */}
            {simulationResult && (
              <div
                className="p-3 rounded-3 mb-4 d-flex align-items-start gap-3 border"
                style={{
                  background: simulationResult.strategy_health.includes("Risky") ? "#FFF1F2" : "#F0FDF4",
                  borderColor: simulationResult.strategy_health.includes("Risky") ? "#FECDD3" : "#BBF7D0"
                }}
              >
                <div className="mt-1">
                  {simulationResult.strategy_health.includes("Risky") ? (
                    <FaExclamationTriangle size={20} className="text-danger" />
                  ) : (
                    <FaShieldAlt size={20} className="text-success" />
                  )}
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="fw-bold text-dark">Cutoff comparison:</span>
                    <span
                      className={`badge rounded-pill ${
                        simulationResult.strategy_health.includes("Risky")
                          ? "bg-danger"
                          : "bg-success"
                      }`}
                    >
                      {simulationResult.strategy_health}
                    </span>
                  </div>
                  <p className="m-0 text-secondary small" style={{ lineHeight: 1.5 }}>
                    {simulationResult.health_advice}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 1: ROUND-BY-ROUND SIMULATION TABLE */}
            {activeTab === "simulation" && (
              <div>
                {loading ? (
                  <div className="text-center py-5">
                    <FaSpinner className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }} />
                    <div className="text-secondary fw-semibold">Comparing your score with each supplied cutoff...</div>
                  </div>
                ) : simulationResult?.choices_evaluated?.length === 0 ? (
                  <div className="text-center py-5 bg-white rounded-3 border">
                    <p className="text-muted m-0">No colleges selected for simulation. Select colleges from the dashboard to simulate.</p>
                  </div>
                ) : (
                  <div className="table-responsive bg-white rounded-3 shadow-sm border mb-3">
                    <table className="table table-hover align-middle mb-0 text-center" style={{ fontSize: 13 }}>
                      <thead style={{ background: "#1E1B4B", color: "#FFFFFF" }}>
                        <tr>
                          <th style={{ width: "5%" }}>#</th>
                          <th style={{ width: "28%", textAlign: "left" }}>College & Program</th>
                          <th style={{ width: "12%" }}>Cutoff Benchmark</th>
                          <th style={{ width: "30%" }}>Score vs cutoff</th>
                          <th style={{ width: "20%" }}>Result basis</th>
                          <th style={{ width: "5%" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simulationResult?.choices_evaluated.map((c, i) => (
                          <tr key={i}>
                            <td className="fw-bold text-muted">{c.preference_order}</td>
                            <td className="text-start">
                              <div className="fw-bold text-dark">{c.college_name}</div>
                              <div className="text-secondary small">{c.branch}</div>
                              <span className={`badge rounded-pill mt-1 ${
                                c.tier === "at_or_above_cutoff" ? "bg-success" : c.tier === "near_cutoff" ? "bg-warning text-dark" : "bg-danger"
                              }`} style={{ fontSize: 10 }}>
                                {c.tier.replaceAll("_", " ").toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div className="fw-bold text-dark">
                                {formatScore(c.cutoff_marks, studentProfile.exam_type, c.score_unit)}
                              </div>
                              <div className="small text-muted">
                                Difference: {c.score_delta >= 0 ? `+${c.score_delta}` : c.score_delta}
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border px-2 py-1 text-wrap" style={{ fontSize: 11 }}>
                                {c.cutoff_comparison}
                              </span>
                            </td>
                            <td>
                              <span className="small text-muted">
                                {c.official_cutoff_data ? "Official cutoff" : "Source not verified"}
                              </span>
                            </td>

                            <td>
                              <button
                                className="btn btn-sm rounded-circle p-1 text-danger shadow-none"
                                style={{ background: "#FEF2F2", width: 28, height: 28, border: "1px solid #FECACA" }}
                                onClick={() => handleRemoveChoice(i)}
                                title="Remove choice"
                              >
                                <FaTimes size={11} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add Quick College Selector */}
                <div className="bg-white p-3 rounded-3 border">
                  <span className="fw-bold text-dark me-2 small">Quick Add from Recommendations:</span>
                  <div className="d-flex gap-2 flex-wrap mt-2">
                    {allColleges.slice(0, 8).map((col, i) => (
                      <button
                        key={i}
                        className="btn btn-sm rounded-pill py-1 px-3 text-truncate fw-semibold shadow-sm"
                        style={{ maxWidth: 220, fontSize: 11, background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#334155" }}
                        onClick={() => handleAddChoice(col)}
                      >
                        + {col.college_name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: OPTIMAL OPTION FORM RE-ORDERING */}
            {activeTab === "optimal" && (
              <div>
                <div className="p-3 bg-white rounded-3 border mb-3">
                  <h6 className="fw-bold text-primary d-flex align-items-center gap-2">
                    <FaSortAmountDown /> Mathematically Optimized Option Form Strategy
                  </h6>
                  <p className="text-secondary small m-0">
                    <strong>Preference order:</strong> Keep choices in the order you actually prefer them. This panel compares scores with supplied cutoffs and does not estimate admission chances or reorder your preferences.
                  </p>
                </div>

                <div className="list-group shadow-sm border rounded-3 overflow-hidden">
                  {simulationResult?.optimized_option_form.map((c, i) => (
                    <div
                      key={i}
                      className="list-group-item d-flex align-items-center justify-content-between p-3"
                      style={{
                        borderLeft: `5px solid ${c.tier === "below_cutoff" ? "#EF4444" : c.tier === "near_cutoff" ? "#F59E0B" : "#10B981"}`
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
                          style={{
                            width: 34,
                            height: 34,
                            background: c.tier === "below_cutoff" ? "#EF4444" : c.tier === "near_cutoff" ? "#F59E0B" : "#10B981"
                          }}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{c.college_name}</div>
                          <div className="small text-secondary">{c.branch}</div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-3">
                        <span className={`badge rounded-pill px-3 py-1 ${
                          c.tier === "below_cutoff" ? "bg-danger" : c.tier === "near_cutoff" ? "bg-warning text-dark" : "bg-success"
                        }`}>
                          {c.cutoff_comparison}
                        </span>
                        <div className="text-end text-muted small d-none d-md-block">
                          Cutoff: {formatScore(c.cutoff_marks, studentProfile.exam_type, c.score_unit)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: OFFICIAL COUNSELING DATES & RULES */}
            {activeTab === "schedule" && (
              <div className="bg-white p-4 rounded-3 border">
                <div className="border-bottom pb-3 mb-3">
                  <h5 className="fw-bold text-dark mb-1">{schedule.authority || "Central Admissions Committee"}</h5>
                  <span className="badge bg-primary me-2">{schedule.exam}</span>
                  <span className="badge bg-secondary">Academic Cycle: {schedule.academic_year}</span>
                </div>

                <h6 className="fw-bold text-dark mb-3">📅 Official Round Dates & Stages:</h6>
                <div className="row g-3 mb-4">
                  {schedule.rounds?.map((r, i) => (
                    <div className="col-md-6" key={i}>
                      <div className="p-3 rounded-3 bg-light border h-100">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold text-primary">{r.round_name}</span>
                          <span className="badge bg-white text-dark border">{r.dates}</span>
                        </div>
                        <div className="fw-semibold small text-dark">{r.stage}</div>
                        <div className="text-secondary small mt-1">{r.description}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <h6 className="fw-bold text-dark mb-2">📜 Crucial Admission Rules to Avoid Disqualification:</h6>
                <ul className="text-secondary small ps-3 mb-0" style={{ lineHeight: 1.6 }}>
                  {schedule.important_rules?.map((rule, idx) => (
                    <li key={idx} className="mb-2"><strong>{rule}</strong></li>
                  ))}
                </ul>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-between">
            <span className="small text-muted">
              💡 Simulator uses official historical conversion decays across centralized admission rounds.
            </span>
            <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={onClose}>
              Close Simulator
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
