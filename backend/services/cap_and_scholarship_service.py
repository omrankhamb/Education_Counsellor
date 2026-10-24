"""
CAP Round Mock Seat Allotment Simulator & Scholarship Engine
Compares candidate scores with supplied cutoff thresholds; it does not estimate admission probabilities.
and exact calculations for government fee concessions (MahaDBT, EBC, TFWS, SC/ST Freeship, Pragati, PMSSS).
"""

from typing import List, Dict, Any, Optional
from datetime import datetime

# =============================================================================
# OFFICIAL COUNSELING SCHEDULES & BENCHMARK DATES (2025–2026 ACADEMIC CYCLE)
# =============================================================================

COUNSELING_SCHEDULES = {
    "MHT-CET": {
        "authority": "State Common Entrance Test Cell, Maharashtra (cetcell.mahacet.org)",
        "exam": "MHT-CET (Engineering / Pharmacy / Agriculture)",
        "academic_year": "2025–2026",
        "rounds": [
            {
                "round_name": "CAP Round 1",
                "dates": "July 18 – July 25",
                "stage": "Allotment & Seat Acceptance",
                "description": "Highest cutoff threshold. Auto-freeze applies if 1st choice is allotted."
            },
            {
                "round_name": "CAP Round 2",
                "dates": "July 30 – August 6",
                "stage": "Betterment & New Vacancies",
                "description": "Cutoff relaxes by ~0.8% to 1.8%ile as top rankers vacate or upgrade."
            },
            {
                "round_name": "CAP Round 3",
                "dates": "August 10 – August 17",
                "stage": "Final Centralized Allocation",
                "description": "Last centralized CAP round. Category conversions occur for vacant seats."
            },
            {
                "round_name": "Institutional / Spot Round",
                "dates": "August 20 – August 30",
                "stage": "Against-CAP Direct Merit Admission",
                "description": "Conducted on-campus for remaining unclaimed seats on pure merit."
            }
        ],
        "important_rules": [
            "Rule of First Preference: If Choice #1 is allotted in Round 1, it is AUTO-FROZEN. Candidate cannot participate in Round 2.",
            "Betterment (Float): If Choice #2 or lower is allotted, candidate can pay seat acceptance fee and try for higher choices in Round 2.",
            "TFWS Supernumerary Seats: 5% extra seats with 100% Tuition Fee Waiver for candidates with income < 8 LPA."
        ]
    },
    "JEE Main": {
        "authority": "JoSAA / CSAB (josaa.admissions.nic.in)",
        "exam": "JEE Main (NITs, IIITs, GFTIs)",
        "academic_year": "2025–2026",
        "rounds": [
            {"round_name": "JoSAA Round 1", "dates": "June 20 – June 25", "stage": "Opening & Closing Benchmarks", "description": "Toughest closing ranks across All India Quota."},
            {"round_name": "JoSAA Round 2", "dates": "June 28 – July 3", "stage": "Round 2 Seat Allotment", "description": "Cutoff relaxes by 300 to 1,200 ranks."},
            {"round_name": "JoSAA Round 3", "dates": "July 5 – July 9", "stage": "Round 3 Seat Allotment", "description": "Steady state movement across core branches."},
            {"round_name": "JoSAA Round 4", "dates": "July 11 – July 15", "stage": "Round 4 Seat Allotment", "description": "Dual reporting and withdrawal deadline."},
            {"round_name": "JoSAA Round 5", "dates": "July 17 – July 22", "stage": "Final JoSAA Allocation", "description": "Final round for IIT allocations."},
            {"round_name": "CSAB Special Round 1 & 2", "dates": "July 26 – August 6", "stage": "Spot Vacancy Rounds for NITs/IIITs", "description": "Significant rank jumps for vacant seats."}
        ],
        "important_rules": [
            "JoSAA allocates across 114+ institutes via single centralized choice filling.",
            "Withdrawal from JoSAA must be done before Round 5 to claim seat acceptance fee refund.",
            "CSAB Special Rounds fill 5,000+ vacant seats in NITs/IIITs after JoSAA concludes."
        ]
    },
    "JEE Advanced": {
        "authority": "JoSAA (All 23 IITs)",
        "exam": "JEE Advanced",
        "academic_year": "2025–2026",
        "rounds": [
            {"round_name": "Round 1", "dates": "June 20 – June 25", "stage": "First Allocation", "description": "Top AIR 1 to 68 closes IIT Bombay CSE."},
            {"round_name": "Round 2", "dates": "June 28 – July 3", "stage": "Second Allocation", "description": "Minimal rank movement (<15 ranks) in top IIT branches."},
            {"round_name": "Round 3 & 4", "dates": "July 5 – July 15", "stage": "Mid Counseling", "description": "Rank movements in Gen 2 and Gen 3 IITs."},
            {"round_name": "Round 5 (Final)", "dates": "July 17 – July 22", "stage": "Closing All India Ranks", "description": "Absolute final seat freeze for all 23 IITs."}
        ],
        "important_rules": [
            "IITs strictly do NOT participate in CSAB Special Rounds.",
            "Preparatory rank lists are published for SC/ST candidates if quota seats remain unfilled."
        ]
    },
    "NEET": {
        "authority": "Medical Counseling Committee (MCC) & DMER (mcc.nic.in)",
        "exam": "NEET UG (MBBS / BDS / AYUSH)",
        "academic_year": "2025–2026",
        "rounds": [
            {"round_name": "AIQ Round 1", "dates": "July 20 – July 30", "stage": "15% All India Quota", "description": "Top government medical colleges and AIIMS."},
            {"round_name": "AIQ Round 2", "dates": "August 10 – August 20", "stage": "State & AIQ Round 2", "description": "Seat upgrades and state merit integration."},
            {"round_name": "Round 3 (Mop-Up)", "dates": "September 2 – September 12", "stage": "Mop-Up Allocation", "description": "Re-allotment of lapsed seats."},
            {"round_name": "Stray Vacancy Round", "dates": "September 20 – September 28", "stage": "Final Medical Seats", "description": "Strict non-transferable allocation on merit."}
        ],
        "important_rules": [
            "Compulsory Social Service Rural Bond of 1 Year applies to government medical colleges in Maharashtra.",
            "Once candidate joins in AIQ Round 2, they cannot resign or participate in state rounds."
        ]
    }
}

# Default fallback schedule if specific exam is not explicitly listed
DEFAULT_SCHEDULE = {
    "authority": "Centralized National Admissions Counseling",
    "exam": "National Merit Entrance Exam",
    "academic_year": "2025–2026",
    "rounds": [
        {"round_name": "Round 1", "dates": "July 15 – July 24", "stage": "Merit Allotment", "description": "Initial seat allocations based on rank."},
        {"round_name": "Round 2", "dates": "August 1 – August 8", "stage": "Betterment Round", "description": "Seat upgrades and vacancy allocations."},
        {"round_name": "Round 3", "dates": "August 14 – August 22", "stage": "Final Allocation", "description": "Final counseling round."},
        {"round_name": "Spot Admission", "dates": "August 26 – August 31", "stage": "Direct Campus Merit", "description": "Merit seats against cancellations."}
    ],
    "important_rules": [
        "Adhere strictly to official verification deadlines.",
        "Keep category and income certificates updated prior to option form submission."
    ]
}


# =============================================================================
# CAP ROUND ALLOTMENT MATHEMATICAL SIMULATION ENGINE
# =============================================================================

def simulate_cap_allotment(student_profile: Dict[str, Any], choices: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compare a student's score with the cutoffs supplied for their selected colleges.
    No admission probabilities are returned because the project has no candidate-level
    outcomes with which to calibrate them.
    """
    exam_type = student_profile.get("exam_type", "MHT-CET")
    marks = float(student_profile.get("marks", 85.0))
    score_unit = student_profile.get("score_unit", "percentile")
    is_rank = score_unit == "rank"
    is_neet = score_unit == "marks_720"

    schedule_data = COUNSELING_SCHEDULES.get(exam_type, DEFAULT_SCHEDULE)
    if not any(k in exam_type for k in COUNSELING_SCHEDULES):
        for k in COUNSELING_SCHEDULES:
            if k.lower() in exam_type.lower():
                schedule_data = COUNSELING_SCHEDULES[k]
                break

    simulated_choices = []
    dream_count = 0
    target_count = 0
    safe_count = 0

    for idx, c in enumerate(choices):
        cutoff = float(c.get("cutoff_marks", 85.0))
        college_name = c.get("college_name", f"Choice {idx+1}")
        branch = c.get("branch", "General Specialization")
        annual_fees = c.get("annual_fees", 120000)

        # 1. Calculate Score Delta / Margin
        if is_rank:
            # For rank, lower is better. Positive delta means student has BETTER (lower) rank.
            delta = cutoff - marks
            # Thresholds for Rank:
            # Round 1 cutoff: cutoff
            # Round 2 cutoff relaxes (increases in rank) by ~12%
            # Round 3 cutoff relaxes by ~22%
            # Spot relaxes by ~35%
            r1_cut = cutoff
            r2_cut = cutoff * 1.12
            r3_cut = cutoff * 1.22
            spot_cut = cutoff * 1.35

            if marks <= r1_cut:
                prob_r1 = min(98, max(85, int(88 + ((r1_cut - marks) / max(1, r1_cut)) * 20)))
                prob_r2 = 99
                prob_r3 = 99
                prob_spot = 100
                tier = "Safe"
                recommended_allotment = "Round 1 (High Probability)"
            elif marks <= r2_cut:
                prob_r1 = max(25, int(50 - ((marks - r1_cut) / max(1, r1_cut)) * 50))
                prob_r2 = min(92, max(70, int(75 + ((r2_cut - marks) / max(1, r2_cut)) * 25)))
                prob_r3 = 95
                prob_spot = 98
                tier = "Target"
                recommended_allotment = "Round 2 (Betterment Allotment)"
            elif marks <= r3_cut:
                prob_r1 = 10
                prob_r2 = 40
                prob_r3 = min(85, max(55, int(60 + ((r3_cut - marks) / max(1, r3_cut)) * 30)))
                prob_spot = 90
                tier = "Target"
                recommended_allotment = "Round 3 (Final CAP Allotment)"
            elif marks <= spot_cut:
                prob_r1 = 2
                prob_r2 = 12
                prob_r3 = 35
                prob_spot = min(75, max(45, int(50 + ((spot_cut - marks) / max(1, spot_cut)) * 30)))
                tier = "Dream"
                recommended_allotment = "Spot / Institutional Round"
            else:
                prob_r1 = 1
                prob_r2 = 5
                prob_r3 = 15
                prob_spot = 30
                tier = "Dream"
                recommended_allotment = "Aspirational (Reach Seat)"

        elif is_neet:
            # For NEET, marks out of 720. Higher is better.
            delta = marks - cutoff
            # Round 1: cutoff
            # Round 2: relaxes by ~6 to 10 marks
            # Round 3: relaxes by ~12 to 20 marks
            # Spot: relaxes by ~25 marks
            r1_cut = cutoff
            r2_cut = max(100, cutoff - 8)
            r3_cut = max(100, cutoff - 16)
            spot_cut = max(100, cutoff - 26)

            if marks >= r1_cut:
                prob_r1 = min(98, max(82, int(85 + (marks - r1_cut) * 2)))
                prob_r2 = 99
                prob_r3 = 99
                prob_spot = 100
                tier = "Safe"
                recommended_allotment = "Round 1 (Confirmed Allotment)"
            elif marks >= r2_cut:
                prob_r1 = max(20, int(50 - (r1_cut - marks) * 4))
                prob_r2 = min(92, max(68, int(72 + (marks - r2_cut) * 3)))
                prob_r3 = 95
                prob_spot = 98
                tier = "Target"
                recommended_allotment = "Round 2 (High Likelihood)"
            elif marks >= r3_cut:
                prob_r1 = 8
                prob_r2 = 35
                prob_r3 = min(85, max(50, int(55 + (marks - r3_cut) * 3)))
                prob_spot = 90
                tier = "Target"
                recommended_allotment = "Round 3 (Competitive Allotment)"
            elif marks >= spot_cut:
                prob_r1 = 2
                prob_r2 = 10
                prob_r3 = 30
                prob_spot = min(75, max(40, int(45 + (marks - spot_cut) * 2)))
                tier = "Dream"
                recommended_allotment = "Mop-Up / Stray Vacancy"
            else:
                prob_r1 = 1
                prob_r2 = 4
                prob_r3 = 12
                prob_spot = 25
                tier = "Dream"
                recommended_allotment = "Aspirational (High Cutoff Reach)"

        else:
            # For Percentiles (0 to 100). Higher is better.
            delta = marks - cutoff
            # Round 1: cutoff
            # Round 2: relaxes by ~0.65%ile
            # Round 3: relaxes by ~1.45%ile
            # Spot: relaxes by ~2.8%ile
            r1_cut = cutoff
            r2_cut = max(0.0, round(cutoff - 0.65, 2))
            r3_cut = max(0.0, round(cutoff - 1.45, 2))
            spot_cut = max(0.0, round(cutoff - 2.80, 2))

            if marks >= r1_cut:
                prob_r1 = min(98, max(84, int(86 + (marks - r1_cut) * 6)))
                prob_r2 = 99
                prob_r3 = 99
                prob_spot = 100
                tier = "Safe"
                recommended_allotment = "Round 1 (High Probability)"
            elif marks >= r2_cut:
                prob_r1 = max(20, int(50 - (r1_cut - marks) * 25))
                prob_r2 = min(92, max(68, int(72 + (marks - r2_cut) * 20)))
                prob_r3 = 95
                prob_spot = 98
                tier = "Target"
                recommended_allotment = "Round 2 (Likely Betterment)"
            elif marks >= r3_cut:
                prob_r1 = 5
                prob_r2 = 30
                prob_r3 = min(85, max(52, int(58 + (marks - r3_cut) * 18)))
                prob_spot = 88
                tier = "Target"
                recommended_allotment = "Round 3 (Final CAP Seat)"
            elif marks >= spot_cut:
                prob_r1 = 1
                prob_r2 = 8
                prob_r3 = 28
                prob_spot = min(72, max(38, int(42 + (marks - spot_cut) * 12)))
                tier = "Dream"
                recommended_allotment = "Institutional / Spot Round"
            else:
                prob_r1 = 0
                prob_r2 = 3
                prob_r3 = 10
                prob_spot = 22
                tier = "Dream"
                recommended_allotment = "Aspirational (Reach College)"

        if tier == "Dream":
            dream_count += 1
        elif tier == "Target":
            target_count += 1
        else:
            safe_count += 1

        simulated_choices.append({
            "preference_order": idx + 1,
            "college_name": college_name,
            "branch": branch,
            "annual_fees": annual_fees,
            "cutoff_marks": cutoff,
            "score_unit": score_unit,
            "tier": tier,
            "score_delta": round(delta, 2),
            "probabilities": None,
            "source_document": c.get("source_document"),
            "official_cutoff_data": bool(c.get("official_cutoff_data") or c.get("is_official_observed")),
            "cutoff_comparison": None,
            "predicted_round": None
        })

    # This compares only each supplied cutoff threshold with the student's score.
    # There is no candidate-level outcome set from which to calculate chances.
    total_choices = len(simulated_choices)
    counts = {"at_or_above_cutoff": 0, "near_cutoff": 0, "below_cutoff": 0}
    for item in simulated_choices:
        item_unit = item["score_unit"]
        cutoff = float(item["cutoff_marks"])
        score_delta = float(item["score_delta"])
        if score_delta >= 0:
            comparison = "At or above supplied cutoff"
            key = "at_or_above_cutoff"
        elif item_unit == "rank" and marks <= cutoff * 1.2:
            comparison = "Within 20% of supplied rank cutoff"
            key = "near_cutoff"
        elif item_unit == "marks_720" and score_delta >= -25:
            comparison = "Within 25 marks of supplied cutoff"
            key = "near_cutoff"
        elif item_unit not in {"rank", "marks_720"} and score_delta >= -5:
            comparison = "Within 5 points of supplied cutoff"
            key = "near_cutoff"
        else:
            comparison = "Below supplied cutoff"
            key = "below_cutoff"
        item["cutoff_comparison"] = comparison
        item["tier"] = key
        item["predicted_round"] = comparison
        counts[key] += 1

    # Keep the student's submitted preference order. Cutoff distance cannot
    # determine an optimal order or guarantee a seat.
    sorted_optimized = list(simulated_choices)
    for item in sorted_optimized:
        item["optimal_preference_order"] = item["preference_order"]

    strategy_health = "Cutoff comparison only"
    health_advice = (
        "These statuses compare your score with the cutoffs supplied for each choice. "
        "They are not admission probabilities; results vary with seats, category, quota, and option-form rules."
    )

    return {
        "success": True,
        "student_profile": {
            "name": student_profile.get("name", "Student"),
            "marks": marks,
            "exam_type": exam_type,
            "score_unit": score_unit
        },
        "counseling_schedule": schedule_data,
        "strategy_health": strategy_health,
        "health_advice": health_advice,
        "distribution": {**counts, "total": total_choices},
        "choices_evaluated": simulated_choices,
        "optimized_option_form": sorted_optimized
    }


# =============================================================================
# COMPREHENSIVE SCHOLARSHIP DATABASE (BUDDY4STUDY PRIVATE/CSR & GOVT SCHEMES)
# =============================================================================

BUDDY4STUDY_AND_GOVT_SCHOLARSHIPS = [
    # --- ENGINEERING & STEM SCHOLARSHIPS ---
    {
        "id": "rel-ug-01",
        "scheme_name": "Reliance Foundation Undergraduate Scholarship",
        "provider": "Reliance Foundation",
        "provider_type": "Corporate / Private CSR (Buddy4Study)",
        "source": "Buddy4Study",
        "domain": ["Engineering", "Medical", "Commerce", "Sciences", "Design", "Law", "Arts", "All Domains"],
        "award_amount": "Up to ₹2,00,000 for entire degree",
        "annual_saving": 50000.0,
        "yearly_income_limit": 1500000.0,
        "yearly_income_limit_text": "₹15.0 Lakhs / yr (Priority < ₹2.5L)",
        "min_10th_marks": 60.0,
        "min_12th_marks": 60.0,
        "gender": "All",
        "other_criteria": "Enrolled in 1st year full-time regular UG degree in any stream; Mandatory online aptitude test; Indian resident.",
        "documents_required": [
            "Class 10 & 12 Board Marksheet",
            "Proof of 1st year college enrollment / Fee Receipt",
            "Family Income Certificate / ITR / Salary Slip",
            "Aadhaar Card",
            "Student Bank Passbook"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com/page/reliance-foundation-undergraduate-scholarships",
        "featured": True,
        "application_cycle": "Open Annually (Aug – Oct)"
    },
    {
        "id": "kotak-kanya-02",
        "scheme_name": "Kotak Kanya Scholarship Program",
        "provider": "Kotak Education Foundation",
        "provider_type": "Corporate / Private CSR (Buddy4Study)",
        "source": "Buddy4Study",
        "domain": ["Engineering", "Medical", "Design", "Law"],
        "award_amount": "₹1,50,000 per year until course completion",
        "annual_saving": 150000.0,
        "yearly_income_limit": 600000.0,
        "yearly_income_limit_text": "₹6.0 Lakhs / yr",
        "min_10th_marks": 60.0,
        "min_12th_marks": 75.0,
        "gender": "Female Only",
        "other_criteria": "Meritorious girl students enrolled in 1st year professional graduation (B.Tech, MBBS, BDS, B.Arch, Int. LLB) at NAAC/NIRF accredited institutes.",
        "documents_required": [
            "Class 10 & 12 Marksheets (Min 75% in 12th)",
            "College Admission Letter & Fee Receipt",
            "Income Certificate issued by Tahsildar/SDM (< 6 LPA)",
            "Aadhaar Card",
            "Student Bank Account Details",
            "Entrance exam scorecard (JEE / NEET / CET)"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com/page/kotak-kanya-scholarship",
        "featured": True,
        "application_cycle": "Active 2025–2026 Cycle"
    },
    {
        "id": "infosys-stem-03",
        "scheme_name": "Infosys Foundation STEM Stars Scholarship",
        "provider": "Infosys Foundation",
        "provider_type": "Corporate / Private CSR (Buddy4Study)",
        "source": "Buddy4Study",
        "domain": ["Engineering", "Medical", "Sciences"],
        "award_amount": "Up to ₹1,00,000 per year (Tuition + Living)",
        "annual_saving": 100000.0,
        "yearly_income_limit": 800000.0,
        "yearly_income_limit_text": "₹8.0 Lakhs / yr",
        "min_10th_marks": 70.0,
        "min_12th_marks": 80.0,
        "gender": "Female Only",
        "other_criteria": "1st year girl students enrolled in undergraduate STEM degrees (Engineering, MBBS, B.Sc) at NIRF-ranked or reputed institutions.",
        "documents_required": [
            "Class 10 and 12 Marksheets",
            "College Admission Proof & Bonafide",
            "Annual Family Income Certificate (< 8 LPA)",
            "Aadhaar Card & Bank Passbook",
            "JEE / NEET Scorecard"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com/page/infosys-foundation-stem-stars-scholarship",
        "featured": True,
        "application_cycle": "Open Annually (Sept – Nov)"
    },
    {
        "id": "siemens-engg-04",
        "scheme_name": "Siemens Scholarship Program for Engineering",
        "provider": "Siemens India",
        "provider_type": "Corporate / Private CSR (Buddy4Study)",
        "source": "Buddy4Study",
        "domain": ["Engineering"],
        "award_amount": "100% Tuition Fees + Allowance + Laptop + Mentorship",
        "annual_saving": 120000.0,
        "yearly_income_limit": 200000.0,
        "yearly_income_limit_text": "₹2.0 Lakhs / yr",
        "min_10th_marks": 60.0,
        "min_12th_marks": 60.0,
        "gender": "All (50% reserved for girls)",
        "other_criteria": "1st year students in Government Engineering Colleges only (Age <= 20 years; Min 60% in PCM in 12th).",
        "documents_required": [
            "SSC (10th) & HSC (12th) Marksheet (Min 60% PCM)",
            "Govt College Admission Confirmation Letter",
            "Income Certificate issued by Revenue Authority (< 2 LPA)",
            "Government Photo ID & Student Bank Details"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com/page/siemens-scholarship-program",
        "featured": True,
        "application_cycle": "Active Cycle"
    },
    {
        "id": "tata-pankh-05",
        "scheme_name": "Tata Capital Pankh Scholarship Program",
        "provider": "Tata Capital Limited",
        "provider_type": "Corporate / Private CSR (Buddy4Study)",
        "source": "Buddy4Study",
        "domain": ["Engineering", "Medical", "Commerce", "Sciences", "All Domains"],
        "award_amount": "Up to ₹50,000 or 80% Tuition Fees",
        "annual_saving": 50000.0,
        "yearly_income_limit": 400000.0,
        "yearly_income_limit_text": "₹4.0 Lakhs / yr",
        "min_10th_marks": 60.0,
        "min_12th_marks": 60.0,
        "gender": "All",
        "other_criteria": "Merit-cum-means assistance for students enrolled in UG, Diploma, or Vocational courses in recognized institutes.",
        "documents_required": [
            "Class 10 & 12 Board Exam Marksheet",
            "Current Academic Year College Fee Receipt",
            "Income Proof (Income Certificate, Salary Slips, or Form 16)",
            "Aadhaar Card",
            "Student Bank Passbook"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com/page/tata-capital-pankh-scholarship-programme",
        "featured": False,
        "application_cycle": "Active Cycle"
    },
    {
        "id": "legrand-emp-06",
        "scheme_name": "Legrand Empowering Scholarship Program",
        "provider": "Legrand India",
        "provider_type": "Corporate / Private CSR (Buddy4Study)",
        "source": "Buddy4Study",
        "domain": ["Engineering", "Commerce", "Design"],
        "award_amount": "₹60,000 to ₹1,00,000 per year",
        "annual_saving": 60000.0,
        "yearly_income_limit": 500000.0,
        "yearly_income_limit_text": "₹5.0 Lakhs / yr",
        "min_10th_marks": 80.0,
        "min_12th_marks": 80.0,
        "gender": "Female & Special Categories",
        "other_criteria": "Open to girl students (80% marks in 10th & 12th) and students with disabilities, LGBTQ+, single parent (70% marks) in B.Tech, B.Arch, BBA, B.Com.",
        "documents_required": [
            "Class 10 and 12 Board Marksheets",
            "College Admission Letter & Fee Receipt",
            "Income Certificate (< 5 LPA)",
            "Special Category Certificate (if applicable)",
            "Aadhaar Card and Bank Details"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com/page/legrand-empowering-scholarship-program",
        "featured": False,
        "application_cycle": "Annual Cycle"
    },
    {
        "id": "rolls-royce-07",
        "scheme_name": "Rolls-Royce Unnati Scholarship for Women Engineers",
        "provider": "Rolls-Royce India",
        "provider_type": "Corporate / Private CSR (Buddy4Study)",
        "source": "Buddy4Study",
        "domain": ["Engineering"],
        "award_amount": "₹35,000 one-time financial grant",
        "annual_saving": 35000.0,
        "yearly_income_limit": 400000.0,
        "yearly_income_limit_text": "₹4.0 Lakhs / yr",
        "min_10th_marks": 60.0,
        "min_12th_marks": 60.0,
        "gender": "Female Only",
        "other_criteria": "Female engineering students studying in 1st, 2nd, or 3rd year B.Tech/B.E. (Aerospace, Marine, Electronics, CS, Mech) in AICTE-recognized colleges.",
        "documents_required": [
            "Class 10 & 12 Board Marksheets (Min 60%)",
            "College ID Card & Bonafide Certificate",
            "Income Certificate issued by Tahsildar (< 4 LPA)",
            "Aadhaar Card",
            "Student Bank Account Details"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com/page/rolls-royce-unnati-scholarships-for-women-engineering-students",
        "featured": False,
        "application_cycle": "Active Cycle"
    },

    # --- MEDICAL & HEALTHCARE SCHOLARSHIPS ---
    {
        "id": "kalam-med-08",
        "scheme_name": "Dr. APJ Abdul Kalam Medical & Engineering Scholarship",
        "provider": "Buddy4Study India Foundation",
        "provider_type": "Corporate / Private CSR (Buddy4Study)",
        "source": "Buddy4Study",
        "domain": ["Medical", "Engineering"],
        "award_amount": "₹30,000 to ₹50,000 per year",
        "annual_saving": 40000.0,
        "yearly_income_limit": 300000.0,
        "yearly_income_limit_text": "₹3.0 Lakhs / yr",
        "min_10th_marks": 60.0,
        "min_12th_marks": 65.0,
        "gender": "All",
        "other_criteria": "Students from economically weaker sections pursuing MBBS, BDS, BAMS, BHMS, B.Pharm, or B.Tech with valid NEET/JEE scores.",
        "documents_required": [
            "Class 10 and 12 Marksheets (PCB / PCM)",
            "NEET / CET Entrance Exam Scorecard",
            "College Admission Letter & Fee Structure",
            "Income Certificate (< 3 LPA)",
            "Aadhaar Card & Bank Details"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com",
        "featured": True,
        "application_cycle": "Active Cycle"
    },
    {
        "id": "colgate-keep-09",
        "scheme_name": "Keep India Smiling Foundational Scholarship (Colgate)",
        "provider": "Colgate-Palmolive (India) Limited",
        "provider_type": "Corporate / Private CSR (Buddy4Study)",
        "source": "Buddy4Study",
        "domain": ["Medical", "Engineering", "All Domains"],
        "award_amount": "₹50,000 per year for 4 years (BDS / Medical)",
        "annual_saving": 50000.0,
        "yearly_income_limit": 500000.0,
        "yearly_income_limit_text": "₹5.0 Lakhs / yr",
        "min_10th_marks": 60.0,
        "min_12th_marks": 65.0,
        "gender": "All",
        "other_criteria": "Enrolled in 1st year BDS, MBBS, or B.Tech in recognized colleges; Focus on students facing severe financial constraints.",
        "documents_required": [
            "Class 10 & 12 Board Exam Marksheet (Min 60–65%)",
            "Admission Fee Receipt & College ID Card",
            "Income Certificate issued by competent authority (< 5 LPA)",
            "Aadhaar Card",
            "Student Bank Passbook"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com/page/keep-india-smiling-foundational-scholarship-program",
        "featured": True,
        "application_cycle": "Active 2025–2026 Cycle"
    },
    {
        "id": "loreal-fywis-10",
        "scheme_name": "L'Oréal India For Young Women In Science (FYWIS)",
        "provider": "L'Oréal India",
        "provider_type": "Corporate / Private CSR (Buddy4Study)",
        "source": "Buddy4Study",
        "domain": ["Medical", "Sciences", "Engineering"],
        "award_amount": "₹2,50,000 for graduation degree (₹50,000/yr)",
        "annual_saving": 50000.0,
        "yearly_income_limit": 600000.0,
        "yearly_income_limit_text": "₹6.0 Lakhs / yr",
        "min_10th_marks": 75.0,
        "min_12th_marks": 85.0,
        "gender": "Female Only",
        "other_criteria": "Female students who passed Class 12 with min 85% in PCB/PCM and enrolled in 1st year MBBS, BDS, B.Pharm, Pure Sciences, or Engineering.",
        "documents_required": [
            "Class 10 & 12 Board Marksheet (Min 85% in PCB/PCM)",
            "College Admission Letter & Fee Receipt",
            "Income Proof (Income certificate, Form 16, or salary slip < 6 LPA)",
            "Aadhaar Card & Bank Details"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com/page/loreal-india-for-young-women-in-science-scholarships",
        "featured": True,
        "application_cycle": "Open Annually (Aug – Oct)"
    },
    {
        "id": "sbif-asha-11",
        "scheme_name": "SBIF Asha Scholarship Program",
        "provider": "State Bank of India Foundation",
        "provider_type": "Corporate / Private CSR (Buddy4Study)",
        "source": "Buddy4Study",
        "domain": ["Engineering", "Medical", "Commerce", "Sciences", "All Domains"],
        "award_amount": "Up to ₹50,000 to ₹3,00,000 per year",
        "annual_saving": 75000.0,
        "yearly_income_limit": 600000.0,
        "yearly_income_limit_text": "₹6.0 Lakhs / yr (Priority < ₹3.0L)",
        "min_10th_marks": 75.0,
        "min_12th_marks": 75.0,
        "gender": "All",
        "other_criteria": "Enrolled in Top 300 NIRF or NAAC accredited universities/colleges (Relaxation to 65% for SC/ST, 60% for PwD).",
        "documents_required": [
            "Class 10 & 12 Marksheets (Min 75% marks)",
            "College Admission Letter & Bonafide",
            "Income Certificate issued by Revenue Authority",
            "Aadhaar Card",
            "Bank Account Passbook"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com/page/sbif-asha-scholarship-program",
        "featured": True,
        "application_cycle": "Active Cycle"
    },
    {
        "id": "ongc-csr-12",
        "scheme_name": "ONGC Foundation Scholarship for SC/ST/OBC/EWS",
        "provider": "ONGC Foundation",
        "provider_type": "Corporate / Private CSR (Buddy4Study)",
        "source": "Buddy4Study",
        "domain": ["Engineering", "Medical", "Commerce"],
        "award_amount": "₹48,000 per year (₹4,000/month stipend)",
        "annual_saving": 48000.0,
        "yearly_income_limit": 200000.0,
        "yearly_income_limit_text": "₹2.0 Lakhs / yr",
        "min_10th_marks": 60.0,
        "min_12th_marks": 60.0,
        "gender": "All (50% reserved for female students)",
        "other_criteria": "Full-time regular 1st year MBBS, Engineering, or MBA students from SC/ST/OBC/EWS backgrounds.",
        "documents_required": [
            "Class 10 and 12 Board Marksheets",
            "Category Certificate (SC/ST/OBC NCL/EWS)",
            "College Admission Fee Receipt",
            "Family Income Certificate (< 2 LPA)",
            "Aadhaar Card & Bank Account"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com/page/ongc-scholarship-scheme-for-sc-st-students",
        "featured": False,
        "application_cycle": "Active Cycle"
    },

    # --- COMMERCE & GENERAL UNDERGRADUATE SCHOLARSHIPS ---
    {
        "id": "hdfc-ecss-13",
        "scheme_name": "HDFC Bank Parivartan's ECSS Programme",
        "provider": "HDFC Bank",
        "provider_type": "Corporate / Private CSR (Buddy4Study)",
        "source": "Buddy4Study",
        "domain": ["Commerce", "Engineering", "Arts", "All Domains"],
        "award_amount": "Up to ₹75,000 per year",
        "annual_saving": 50000.0,
        "yearly_income_limit": 250000.0,
        "yearly_income_limit_text": "₹2.5 Lakhs / yr",
        "min_10th_marks": 55.0,
        "min_12th_marks": 55.0,
        "gender": "All",
        "other_criteria": "Undergraduate students in B.Com, BBA, B.Tech, etc.; Special priority for students experiencing financial hardship or family crisis.",
        "documents_required": [
            "Previous Year Academic Marksheet (Min 55%)",
            "College Admission Letter & Fee Receipt",
            "Income Proof (Income Certificate, BPL card, Salary slip < 2.5 LPA)",
            "Crisis document (if applicable: death of earner, medical proof)",
            "Aadhaar Card and Bank Details"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com/page/hdfc-bank-parivartans-ecss-programme",
        "featured": True,
        "application_cycle": "Active Cycle"
    },
    {
        "id": "aditya-birla-14",
        "scheme_name": "Aditya Birla Capital Scholarship",
        "provider": "Aditya Birla Capital Foundation",
        "provider_type": "Corporate / Private CSR (Buddy4Study)",
        "source": "Buddy4Study",
        "domain": ["Commerce", "Arts", "Sciences", "All Domains"],
        "award_amount": "Up to ₹60,000 per year",
        "annual_saving": 60000.0,
        "yearly_income_limit": 600000.0,
        "yearly_income_limit_text": "₹6.0 Lakhs / yr",
        "min_10th_marks": 60.0,
        "min_12th_marks": 60.0,
        "gender": "All",
        "other_criteria": "Students pursuing regular undergraduate courses (B.Com, BBA, B.Sc, BA) in recognized Indian colleges.",
        "documents_required": [
            "Class 10 and 12 Board Marksheets",
            "Current Year Admission Proof & Fee Receipt",
            "Income Certificate issued by SDM/Tahsildar (< 6 LPA)",
            "Aadhaar Card & Bank Details"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com/page/aditya-birla-capital-covid-scholarship-program",
        "featured": False,
        "application_cycle": "Annual Cycle"
    },
    {
        "id": "santoor-women-15",
        "scheme_name": "Santoor Women's Scholarship Program",
        "provider": "Wipro Consumer Care & Santoor",
        "provider_type": "Corporate / Private CSR (Buddy4Study)",
        "source": "Buddy4Study",
        "domain": ["Sciences", "Commerce", "Arts"],
        "award_amount": "₹24,000 per year for 3 years",
        "annual_saving": 24000.0,
        "yearly_income_limit": 400000.0,
        "yearly_income_limit_text": "₹4.0 Lakhs / yr",
        "min_10th_marks": 50.0,
        "min_12th_marks": 55.0,
        "gender": "Female Only",
        "other_criteria": "Young women from disadvantaged backgrounds who completed 10th from local govt school & 12th from govt junior college, enrolled in 3-yr degree.",
        "documents_required": [
            "Class 10 and 12 Govt School Marksheets",
            "College Admission Bonafide / Fee Receipt",
            "Income Proof (< 4 LPA)",
            "Aadhaar Card & Bank Account in student name"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com/page/santoor-women-s-scholarship",
        "featured": False,
        "application_cycle": "Active Cycle"
    },
    {
        "id": "faea-ambedkar-16",
        "scheme_name": "FAEA B.R. Ambedkar Fellowship & Scholarship",
        "provider": "Foundation for Academic Excellence and Access",
        "provider_type": "Private Trust / Buddy4Study",
        "source": "Buddy4Study",
        "domain": ["Design", "Law", "Arts", "Engineering", "Sciences", "All Domains"],
        "award_amount": "100% Tuition Fees + Maintenance + Hostel Fees",
        "annual_saving": 90000.0,
        "yearly_income_limit": 250000.0,
        "yearly_income_limit_text": "BPL / ₹2.5 Lakhs / yr",
        "min_10th_marks": 60.0,
        "min_12th_marks": 60.0,
        "gender": "All (Focus on SC/ST/BPL/Differently Abled)",
        "other_criteria": "Economically disadvantaged students pursuing undergraduate degrees in Arts, Commerce, Science, Engineering, Law, or Design.",
        "documents_required": [
            "Class 10 & 12 Board Marksheets",
            "Caste / BPL / Disability Certificate",
            "College Admission Proof & Fee Estimate",
            "Income Certificate from Competent Authority",
            "Aadhaar Card & Bank Details"
        ],
        "portal_name": "Buddy4Study",
        "portal_url": "https://www.buddy4study.com/page/faea-scholarship",
        "featured": True,
        "application_cycle": "Active Cycle"
    },

    # --- GOVERNMENT SCHEMES & CENTRAL/STATE STATUTORY SCHEMES ---
    {
        "id": "gov-tfws-17",
        "scheme_name": "AICTE / DTE Tuition Fee Waiver Scheme (TFWS)",
        "provider": "State Common Entrance Test Cell & AICTE",
        "provider_type": "Government Statutory",
        "source": "Government",
        "domain": ["Engineering", "Management", "Design"],
        "award_amount": "100% Tuition Fee Exemption (Save ₹70,000–₹2,00,000/yr)",
        "annual_saving": 90000.0,
        "yearly_income_limit": 800000.0,
        "yearly_income_limit_text": "₹8.0 Lakhs / yr (Statutory Limit)",
        "min_10th_marks": 50.0,
        "min_12th_marks": 50.0,
        "gender": "All",
        "other_criteria": "5% extra supernumerary seats in every branch for merit candidates with family income < 8 LPA through CAP centralized seat allotment.",
        "documents_required": [
            "MHT-CET / JEE Scorecard",
            "Class 10 & 12 Marksheets",
            "Valid Tahsildar Income Certificate (< 8 LPA for current FY)",
            "CAP Allotment Letter confirming TFWS seat",
            "Domicile Certificate"
        ],
        "portal_name": "State CET Cell Maharashtra",
        "portal_url": "https://cetcell.mahacet.org",
        "featured": True,
        "application_cycle": "During CAP Option Form Filling"
    },
    {
        "id": "gov-pragati-18",
        "scheme_name": "AICTE Pragati Scholarship for Girl Students",
        "provider": "All India Council for Technical Education (AICTE)",
        "provider_type": "Central Government",
        "source": "Government",
        "domain": ["Engineering", "Technology"],
        "award_amount": "₹50,000 per year (for all 4 years)",
        "annual_saving": 50000.0,
        "yearly_income_limit": 800000.0,
        "yearly_income_limit_text": "₹8.0 Lakhs / yr",
        "min_10th_marks": 50.0,
        "min_12th_marks": 50.0,
        "gender": "Female Only",
        "other_criteria": "Up to 10,000 girl students admitted to 1st year of AICTE-approved degree colleges; Max 2 girl children per family.",
        "documents_required": [
            "Class 10 and 12 Marksheet",
            "Centralized CAP / Counseling Admission Letter",
            "Annual Family Income Certificate issued by Tahsildar",
            "Parents declaration of number of girl children",
            "Aadhaar seeded Student Bank Account"
        ],
        "portal_name": "National Scholarship Portal (NSP)",
        "portal_url": "https://scholarships.gov.in",
        "featured": True,
        "application_cycle": "Active on NSP (Sept – Dec)"
    },
    {
        "id": "gov-ebc-19",
        "scheme_name": "Rajarshi Chhatrapati Shahu Maharaj EBC Scholarship",
        "provider": "Government of Maharashtra (MahaDBT)",
        "provider_type": "State Government (MahaDBT)",
        "source": "Government",
        "domain": ["Engineering", "Medical", "Commerce", "Sciences", "All Domains"],
        "award_amount": "50% Tuition Fee & 50% Exam Fee Waiver",
        "annual_saving": 70000.0,
        "yearly_income_limit": 800000.0,
        "yearly_income_limit_text": "₹8.0 Lakhs / yr",
        "min_10th_marks": 50.0,
        "min_12th_marks": 50.0,
        "gender": "All",
        "other_criteria": "Statutory Maharashtra scheme for General/OPEN/EWS candidates admitted through CAP rounds with family income up to ₹8.0 Lakh.",
        "documents_required": [
            "Class 10 & 12 Board Marksheet",
            "Tahsildar Income Certificate (< 8 LPA)",
            "CAP Allotment Letter & College Fee Receipt",
            "Maharashtra Domicile Certificate",
            "Aadhaar Linked Bank Passbook",
            "Ration Card / Family Declaration"
        ],
        "portal_name": "MahaDBT Official Portal",
        "portal_url": "https://mahadbt.maharashtra.gov.in",
        "featured": True,
        "application_cycle": "Active on MahaDBT"
    },
    {
        "id": "gov-scst-20",
        "scheme_name": "Government of India Post-Matric Scholarship for SC/ST",
        "provider": "Social Justice & Special Assistance Department",
        "provider_type": "Central Government",
        "source": "Government",
        "domain": ["Engineering", "Medical", "Commerce", "Sciences", "All Domains"],
        "award_amount": "100% Tuition & Development Fee Waiver + Living Grant",
        "annual_saving": 140000.0,
        "yearly_income_limit": 250000.0,
        "yearly_income_limit_text": "₹2.5 Lakhs for Central / Freeship for higher income",
        "min_10th_marks": 0.0,
        "min_12th_marks": 0.0,
        "gender": "All",
        "other_criteria": "Complete tuition, development, and exam fee exemption for SC and ST students admitted via centralized counseling.",
        "documents_required": [
            "Caste Certificate & Caste Validity Certificate",
            "Tahsildar Income Certificate",
            "CAP Seat Allotment Confirmation Letter",
            "Class 10 & 12 Marksheets",
            "Aadhaar Card linked with NPCI Bank Account"
        ],
        "portal_name": "NSP / MahaDBT Portal",
        "portal_url": "https://scholarships.gov.in",
        "featured": True,
        "application_cycle": "Active on NSP & MahaDBT"
    },
    {
        "id": "gov-vjnt-21",
        "scheme_name": "Post-Matric Scholarship for VJNT, OBC and SBC",
        "provider": "OBC, VJNT & SBC Welfare Department, Govt of Maharashtra",
        "provider_type": "State Government (MahaDBT)",
        "source": "Government",
        "domain": ["Engineering", "Medical", "Commerce", "Sciences", "All Domains"],
        "award_amount": "50% Tuition Fee Waiver (100% for VJNT if income < 1.5L)",
        "annual_saving": 65000.0,
        "yearly_income_limit": 800000.0,
        "yearly_income_limit_text": "₹8.0 Lakhs / yr",
        "min_10th_marks": 0.0,
        "min_12th_marks": 0.0,
        "gender": "All",
        "other_criteria": "50% fee reimbursement for OBC/VJNT/SBC candidates with valid Non-Creamy Layer (NCL) certificate admitted through CAP.",
        "documents_required": [
            "Caste Certificate & Caste Validity Certificate",
            "Non-Creamy Layer (NCL) Certificate valid for current FY",
            "Tahsildar Income Certificate (< 8 LPA)",
            "CAP Allotment Letter & College Fee Receipt",
            "Aadhaar Linked Bank Passbook"
        ],
        "portal_name": "MahaDBT Portal",
        "portal_url": "https://mahadbt.maharashtra.gov.in",
        "featured": False,
        "application_cycle": "Active Cycle"
    },
    {
        "id": "gov-panjabrao-22",
        "scheme_name": "Dr. Panjabrao Deshmukh Hostel Maintenance Allowance",
        "provider": "Higher & Technical Education Department, Maharashtra",
        "provider_type": "State Government (MahaDBT)",
        "source": "Government",
        "domain": ["Engineering", "Medical", "Commerce", "Sciences", "All Domains"],
        "award_amount": "₹30,000/yr (Metros) or ₹20,000/yr (Districts) Cash",
        "annual_saving": 30000.0,
        "yearly_income_limit": 800000.0,
        "yearly_income_limit_text": "₹8.0 Lakhs / yr",
        "min_10th_marks": 0.0,
        "min_12th_marks": 0.0,
        "gender": "All",
        "other_criteria": "Hostel allowance directly credited to bank account for hostellers admitted through centralized rounds with income < 8 LPA.",
        "documents_required": [
            "Hostel Admission Proof / PG Rent Agreement",
            "Tahsildar Income Certificate (< 8 LPA)",
            "CAP Allotment Letter",
            "Maharashtra Domicile Certificate",
            "Aadhaar seeded Bank Passbook"
        ],
        "portal_name": "MahaDBT Official Portal",
        "portal_url": "https://mahadbt.maharashtra.gov.in",
        "featured": False,
        "application_cycle": "Active Cycle"
    },
    {
        "id": "gov-csss-23",
        "scheme_name": "Central Sector Scheme of Scholarship (CSSS)",
        "provider": "Department of Higher Education, MHRD",
        "provider_type": "Central Government",
        "source": "Government",
        "domain": ["Commerce", "Sciences", "Engineering", "Medical", "Arts", "All Domains"],
        "award_amount": "₹12,000/yr (UG) to ₹20,000/yr (PG)",
        "annual_saving": 12000.0,
        "yearly_income_limit": 450000.0,
        "yearly_income_limit_text": "₹4.5 Lakhs / yr",
        "min_10th_marks": 60.0,
        "min_12th_marks": 80.0,
        "gender": "All",
        "other_criteria": "Merit-cum-means scholarship for students who scored in the top 20th percentile in their 12th Board examinations.",
        "documents_required": [
            "Class 12 Marksheet (Top 20th percentile)",
            "College Bonafide Certificate",
            "Income Certificate (< 4.5 LPA)",
            "Aadhaar Card & Bank Account"
        ],
        "portal_name": "National Scholarship Portal (NSP)",
        "portal_url": "https://scholarships.gov.in",
        "featured": False,
        "application_cycle": "Active on NSP"
    },
    {
        "id": "gov-inspire-24",
        "scheme_name": "INSPIRE Scholarship for Higher Education (SHE)",
        "provider": "Department of Science & Technology (DST), Govt of India",
        "provider_type": "Central Government",
        "source": "Government",
        "domain": ["Sciences"],
        "award_amount": "₹80,000 per year (₹60,000 stipend + ₹20,000 mentorship)",
        "annual_saving": 80000.0,
        "yearly_income_limit": 99999999.0,
        "yearly_income_limit_text": "No Income Ceiling (Strictly Merit)",
        "min_10th_marks": 60.0,
        "min_12th_marks": 85.0,
        "gender": "All",
        "other_criteria": "Top 1% rankers in Class 12 board examinations or JEE/NEET Top 10,000 pursuing B.Sc. or Integrated M.Sc. in Natural & Basic Sciences.",
        "documents_required": [
            "Class 12 Board Marksheet & Advisory Note",
            "Endorsement Certificate signed by College Principal",
            "Aadhaar Card & SBI Bank Passbook"
        ],
        "portal_name": "DST INSPIRE Portal",
        "portal_url": "https://online-inspire.gov.in",
        "featured": True,
        "application_cycle": "Active on DST Portal"
    }
]

# =============================================================================
# SCHOLARSHIP & NET FEE CALCULATOR ENGINE
# =============================================================================

def calculate_scholarships_and_concessions(
    annual_fees: float,
    category: str = "OPEN",
    family_income: float = 600000.0,
    gender: str = "Male",
    state: str = "Maharashtra",
    is_hosteler: bool = True,
    stream: Optional[str] = "All",
    tenth_marks: Optional[float] = 80.0,
    twelfth_marks: Optional[float] = 85.0,
    provider_type: Optional[str] = "All"
) -> Dict[str, Any]:
    """
    Computes exact statutory government scholarships, tuition fee concessions,
    and returns comprehensive Buddy4Study private/CSR + government scholarships
    matching the student's domain, income, 10th and 12th marks.
    """
    cat_upper = (category or "OPEN").upper().strip()
    income = float(family_income or 600000.0)
    fees = float(annual_fees or 120000.0)
    is_female = (gender or "").lower() in ["female", "girl", "woman"]
    is_mh = (state or "").lower() in ["maharashtra", "mh"]
    tenth = float(tenth_marks if tenth_marks is not None else 80.0)
    twelfth = float(twelfth_marks if twelfth_marks is not None else 85.0)
    user_stream = (stream or "All").strip()
    user_provider_type = (provider_type or "All").strip()

    eligible_statutory_schemes = []
    tuition_waiver = 0.0
    hostel_allowance = 0.0

    # 1. TFWS (Tuition Fee Waiver Scheme - Supernumerary 5% CAP Quota)
    if income <= 800000:
        tfws_waiver = fees * 0.85
        eligible_statutory_schemes.append({
            "scheme_name": "AICTE / DTE Tuition Fee Waiver Scheme (TFWS)",
            "authority": "State CET Cell & AICTE",
            "benefit_type": "100% Tuition Fee Exemption",
            "annual_saving": round(tfws_waiver, 2),
            "description": "5% extra supernumerary seats in every branch for merit students with family income < 8 LPA. 100% tuition fees waived.",
            "portal": "https://cetcell.mahacet.org"
        })

    # 2. MahaDBT EBC
    if is_mh and income <= 800000 and any(c in cat_upper for c in ["OPEN", "GENERAL", "EWS", "SEBC"]):
        ebc_waiver = fees * 0.50
        tuition_waiver = max(tuition_waiver, ebc_waiver)
        eligible_statutory_schemes.append({
            "scheme_name": "Rajarshi Chhatrapati Shahu Maharaj EBC Scholarship",
            "authority": "Government of Maharashtra (Higher & Technical Education)",
            "benefit_type": "50% Tuition Fee & 50% Exam Fee Waiver",
            "annual_saving": round(ebc_waiver, 2),
            "description": "Statutory Maharashtra scheme reimbursing 50% tuition fees for CAP-admitted students with annual family income up to ₹8.0 Lakh.",
            "portal": "https://mahadbt.maharashtra.gov.in"
        })

    # 3. SC / ST Post-Matric Scholarship & Freeship (100% Waiver)
    if any(c in cat_upper for c in ["SC", "ST"]):
        sc_st_waiver = fees * 1.0
        tuition_waiver = max(tuition_waiver, sc_st_waiver)
        eligible_statutory_schemes.append({
            "scheme_name": "Government of India Post-Matric Scholarship / Freeship for SC/ST",
            "authority": "Social Justice & Special Assistance Department",
            "benefit_type": "100% Tuition & Development Fee Exemption",
            "annual_saving": round(sc_st_waiver, 2),
            "description": "Comprehensive scholarship covering 100% of all tuition, lab, library, and examination fees directly credited to the institution.",
            "portal": "https://scholarships.gov.in / MahaDBT"
        })

    # 4. OBC / VJNT / SBC Post-Matric Tuition Fee Concession
    if any(c in cat_upper for c in ["OBC", "VJNT", "NT", "SBC"]) and income <= 800000:
        obc_waiver = fees * 0.50
        tuition_waiver = max(tuition_waiver, obc_waiver)
        eligible_statutory_schemes.append({
            "scheme_name": "Post-Matric Scholarship for VJNT, OBC and SBC",
            "authority": "Vimukta Jati, Nomadic Tribes, OBC and SBC Welfare Dept",
            "benefit_type": "50% Tuition Fee Waiver (100% for VJNT if income < 1.5L)",
            "annual_saving": round(obc_waiver, 2),
            "description": "50% fee reimbursement for OBC/NT candidates admitted through CAP having valid Non-Creamy Layer (NCL).",
            "portal": "https://mahadbt.maharashtra.gov.in"
        })

    # 5. Dr. Panjabrao Deshmukh Vastigruh Nirvah Bhatta Yojna (Hostel Maintenance Allowance)
    if is_mh and is_hosteler and income <= 800000:
        allowance = 30000.0
        hostel_allowance = allowance
        eligible_statutory_schemes.append({
            "scheme_name": "Dr. Panjabrao Deshmukh Hostel Maintenance Allowance",
            "authority": "Government of Maharashtra",
            "benefit_type": "₹30,000 / year Direct Cash Allowance",
            "annual_saving": allowance,
            "description": "Monthly living allowance directly deposited to student's bank account for hostellers admitted through centralized rounds.",
            "portal": "https://mahadbt.maharashtra.gov.in"
        })

    # 6. AICTE Pragati Scholarship for Girl Students
    if is_female and income <= 800000:
        pragati = 50000.0
        eligible_statutory_schemes.append({
            "scheme_name": "AICTE Pragati Scholarship for Female Students",
            "authority": "All India Council for Technical Education (AICTE)",
            "benefit_type": "₹50,000 per Year (Fixed Grant)",
            "annual_saving": pragati,
            "description": "National initiative to encourage girls in technical degrees. Awarded to up to 10,000 female students nationwide every year.",
            "portal": "https://www.aicte-pragati-saksham-gov.in"
        })

    # 7. Central Sector Scholarship Scheme (CSSS) for College & University Students
    if income <= 450000:
        csss = 12000.0
        eligible_statutory_schemes.append({
            "scheme_name": "Central Sector Scheme of Scholarship (CSSS)",
            "authority": "Department of Higher Education, MHRD",
            "benefit_type": "₹12,000 / year (Graduation)",
            "annual_saving": csss,
            "description": "Merit-cum-means scholarship for students who scored in the top 20th percentile in their 12th Board examinations.",
            "portal": "https://scholarships.gov.in"
        })

    # Total Financial Calculation
    primary_waiver = min(fees, tuition_waiver)
    net_payable_tuition = max(0.0, fees - primary_waiver)
    total_annual_savings = primary_waiver + hostel_allowance
    four_year_savings = total_annual_savings * 4

    # =========================================================================
    # PROCESS FULL BUDDY4STUDY & GOVERNMENT SCHOLARSHIPS BY DOMAIN & CRITERIA
    # =========================================================================
    evaluated_scholarships = []
    
    for sch in BUDDY4STUDY_AND_GOVT_SCHOLARSHIPS:
        # 1. Domain Check
        domain_matches = (
            user_stream == "All" or
            user_stream in sch["domain"] or
            "All Domains" in sch["domain"] or
            any(user_stream.lower() in d.lower() for d in sch["domain"])
        )
        
        # 2. Provider Type Check
        provider_matches = True
        if user_provider_type == "Buddy4Study":
            provider_matches = (sch["source"] == "Buddy4Study")
        elif user_provider_type == "Government":
            provider_matches = (sch["source"] == "Government")
        elif user_provider_type != "All":
            provider_matches = (user_provider_type.lower() in sch["provider_type"].lower())
            
        # 3. Income Check
        income_met = income <= sch["yearly_income_limit"]
        
        # 4. 10th Marks Check
        tenth_met = sch["min_10th_marks"] == 0 or tenth >= sch["min_10th_marks"]
        
        # 5. 12th Marks Check
        twelfth_met = sch["min_12th_marks"] == 0 or twelfth >= sch["min_12th_marks"]
        
        # 6. Gender Check
        gender_met = True
        if sch["gender"] == "Female Only":
            gender_met = is_female
            
        # 7. Category Check
        category_met = True
        sch_title_lower = sch["scheme_name"].lower()
        if "sc/st" in sch_title_lower:
            category_met = any(c in cat_upper for c in ["SC", "ST"])
        elif "vjnt, obc" in sch_title_lower:
            category_met = any(c in cat_upper for c in ["OBC", "VJNT", "NT", "SBC"])
        elif "ebc" in sch_title_lower:
            category_met = any(c in cat_upper for c in ["OPEN", "GENERAL", "EWS", "SEBC"])

        is_eligible = (
            domain_matches and
            income_met and
            tenth_met and
            twelfth_met and
            gender_met and
            category_met
        )

        reasons = []
        if not domain_matches:
            reasons.append(f"Domain mismatch (Requires: {', '.join(sch['domain'])})")
        if not income_met:
            reasons.append(f"Income ₹{(income/100000):.1f}L exceeds limit of {sch['yearly_income_limit_text']}")
        if not tenth_met:
            reasons.append(f"10th score ({tenth}%) is below min {sch['min_10th_marks']}%")
        if not twelfth_met:
            reasons.append(f"12th score ({twelfth}%) is below min {sch['min_12th_marks']}%")
        if not gender_met:
            reasons.append("Reserved for Female students only")
        if not category_met:
            reasons.append("Caste category criteria not met")

        sch_copy = dict(sch)
        sch_copy["is_eligible"] = is_eligible
        sch_copy["criteria_status"] = {
            "domain_met": domain_matches,
            "income_met": income_met,
            "tenth_met": tenth_met,
            "twelfth_met": twelfth_met,
            "gender_met": gender_met,
            "category_met": category_met,
            "unmet_reasons": reasons
        }
        
        # Include in list if domain matches (or if user wants to see all)
        if domain_matches and provider_matches:
            evaluated_scholarships.append(sch_copy)

    # Sort evaluated scholarships: Eligible first, then by annual saving descending
    evaluated_scholarships.sort(key=lambda s: (1 if s["is_eligible"] else 0, s.get("annual_saving", 0)), reverse=True)
    eligible_buddy_count = sum(1 for s in evaluated_scholarships if s["is_eligible"])

    return {
        "success": True,
        "input_profile": {
            "annual_fees": fees,
            "category": cat_upper,
            "family_income": income,
            "gender": gender,
            "state": state,
            "is_hosteler": is_hosteler,
            "stream": user_stream,
            "tenth_marks": tenth,
            "twelfth_marks": twelfth,
            "provider_type": user_provider_type
        },
        "financial_summary": {
            "original_annual_fees": fees,
            "tuition_waiver_applied": round(primary_waiver, 2),
            "net_payable_tuition": round(net_payable_tuition, 2),
            "hostel_allowance": round(hostel_allowance, 2),
            "total_annual_savings": round(total_annual_savings, 2),
            "four_year_total_savings": round(four_year_savings, 2),
            "discount_percentage": round((primary_waiver / max(1.0, fees)) * 100, 1)
        },
        "eligible_schemes_count": len(eligible_statutory_schemes),
        "eligible_schemes": eligible_statutory_schemes,
        "all_scholarships": evaluated_scholarships,
        "eligible_scholarships_count": eligible_buddy_count,
        "total_scholarships_count": len(evaluated_scholarships),
        "available_domains": [
            "All", "Engineering", "Medical", "Commerce", "Sciences", "Design", "Law", "Arts"
        ],
        "official_portals": [
            {"name": "Buddy4Study Official Platform", "url": "https://www.buddy4study.com"},
            {"name": "National Scholarship Portal (NSP)", "url": "https://scholarships.gov.in"},
            {"name": "MahaDBT Official Portal", "url": "https://mahadbt.maharashtra.gov.in"},
            {"name": "AICTE National Portal", "url": "https://www.aicte-india.org"}
        ]
    }
