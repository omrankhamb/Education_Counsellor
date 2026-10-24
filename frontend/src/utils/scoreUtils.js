export const EXAM_SCORE_CONFIG = {
  "JEE Advanced": {
    label: "JEE Advanced All India Rank (AIR)",
    shortLabel: "AIR",
    placeholder: "e.g. 4200",
    unit: "rank",
    min: 1,
    max: 250000,
    step: 1,
    badgeText: "Lower AIR rank is better",
    help: "Enter your All India Rank (AIR). E.g. 1 to 2,50,000"
  },
  "NEET": {
    label: "NEET Total Marks (Out of 720)",
    shortLabel: "Marks",
    placeholder: "e.g. 610",
    unit: "marks_720",
    min: 0,
    max: 720,
    step: 1,
    badgeText: "Out of 720 Marks",
    help: "Enter your total NEET marks out of 720 (0–720)"
  },
  "JEE Main": {
    label: "JEE Main Percentile (%ile)",
    shortLabel: "%ile",
    placeholder: "e.g. 96.75",
    unit: "percentile",
    min: 0,
    max: 100,
    step: 0.01,
    badgeText: "NTA Percentile",
    help: "Enter your NTA JEE Main percentile (0–100)"
  },
  "MHT-CET": {
    label: "MHT-CET Percentile (%ile)",
    shortLabel: "%ile",
    placeholder: "e.g. 94.20",
    unit: "percentile",
    min: 0,
    max: 100,
    step: 0.01,
    badgeText: "CET Percentile",
    help: "Enter your MHT-CET percentile (0–100)"
  },
  "State CET": {
    label: "State CET Percentile (%ile)",
    shortLabel: "%ile",
    placeholder: "e.g. 91.50",
    unit: "percentile",
    min: 0,
    max: 100,
    step: 0.01,
    badgeText: "CET Percentile",
    help: "Enter your State CET percentile (0–100)"
  },
  "CUET": {
    label: "CUET Percentile / Normalized Score",
    shortLabel: "%ile",
    placeholder: "e.g. 95.0",
    unit: "percentile",
    min: 0,
    max: 100,
    step: 0.01,
    badgeText: "Normalized Score",
    help: "Enter your CUET percentile or normalized score (0–100)"
  },
  "CLAT": {
    label: "CLAT All India Rank (AIR)",
    shortLabel: "AIR",
    placeholder: "e.g. 1850",
    unit: "rank",
    min: 1,
    max: 100000,
    step: 1,
    badgeText: "All India Rank",
    help: "Enter your CLAT All India Rank (AIR)"
  },
  "CAT (MBA)": {
    label: "CAT Percentile (%ile)",
    shortLabel: "%ile",
    placeholder: "e.g. 96.5",
    unit: "percentile",
    min: 0,
    max: 100,
    step: 0.01,
    badgeText: "Percentile",
    help: "Enter your CAT percentile (0–100)"
  },
  "12th %": {
    label: "12th Board Aggregate Percentage (%)",
    shortLabel: "%",
    placeholder: "e.g. 88.5",
    unit: "percentage",
    min: 0,
    max: 100,
    step: 0.01,
    badgeText: "Board %",
    help: "Enter your 12th standard percentage marks (0–100)"
  }
};

export function getExamScoreConfig(examType) {
  if (!examType) return EXAM_SCORE_CONFIG["12th %"];
  if (EXAM_SCORE_CONFIG[examType]) return EXAM_SCORE_CONFIG[examType];
  const lower = examType.toLowerCase();
  if (lower.includes("neet")) return EXAM_SCORE_CONFIG["NEET"];
  if (lower.includes("advanced") || lower.includes("air")) return EXAM_SCORE_CONFIG["JEE Advanced"];
  if (lower.includes("main") || lower.includes("cet") || lower.includes("cat")) return EXAM_SCORE_CONFIG["JEE Main"];
  if (lower.includes("clat")) return EXAM_SCORE_CONFIG["CLAT"];
  return EXAM_SCORE_CONFIG["12th %"];
}

export function formatScore(score, examType, unit) {
  if (score === null || score === undefined || score === "" || isNaN(score)) return "--";
  const num = parseFloat(score);
  const cfg = getExamScoreConfig(examType);
  const effectiveUnit = unit || cfg.unit;

  if (effectiveUnit === "rank") {
    return `AIR ${Math.round(num).toLocaleString()}`;
  }
  if (effectiveUnit === "marks_720") {
    return `${Math.round(num)}/720`;
  }
  if (effectiveUnit === "percentile") {
    return `${num.toFixed(1)} %ile`;
  }
  return `${num.toFixed(1)}%`;
}

export function formatAnnualFees(fees) {
  if (!fees || isNaN(fees)) return "₹1.2 Lakh/yr";
  const num = Number(fees);
  if (num < 100000) {
    return `₹${num.toLocaleString("en-IN")}/yr`;
  }
  const inLakh = num / 100000;
  const formatted = inLakh % 1 === 0 ? inLakh.toString() : inLakh.toFixed(2).replace(/\.?0+$/, "");
  return `₹${formatted} Lakh/yr`;
}
