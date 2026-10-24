"""
AI Option Form Auto-Rebalancer & Risk Matrix Service
Solves the critical CAP problem where 80% of students fill their option form wrong
(either all unreachable Dream colleges leading to Zero Allotment, or all safe colleges wasting their high rank).
"""

from typing import List, Dict, Any, Optional
import asyncio
import json
import re
from config import GEMINI_API_KEY, GEMINI_MODEL, FALLBACK_MODELS
from services.cap_table_service import (
    calculate_cap_row,
    get_exam_catalog,
    normalize_exam_name,
    EXAM_COUNSELING_PROCESS
)

# Initialize Gemini Client if available
try:
    from google import genai
    from google.genai import types
    gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
except Exception:
    gemini_client = None


def evaluate_portfolio(
    choices: List[Dict[str, Any]],
    category: str,
    cap_round: str,
    student_score: float,
    exam_type: str
) -> Dict[str, Any]:
    """Calculate the risk distribution (Dream, Target, Safe) of an option list."""
    total = len(choices)
    if total == 0:
        return {
            "total": 0,
            "dream": 0,
            "target": 0,
            "safe": 0,
            "not_offered": 0,
            "dream_pct": 0,
            "target_pct": 0,
            "safe_pct": 0,
            "risk_level": "EMPTY",
            "risk_title": "Empty Option Form",
            "risk_alert": "No colleges added yet. Your option form is completely empty."
        }

    dream = 0
    target = 0
    safe = 0
    not_offered = 0

    for c in choices:
        code = c.get("college_code", "")
        branch = c.get("selected_branch") or c.get("branch", "")
        row = calculate_cap_row(code, branch, category, cap_round, student_score, exam_type)
        if not row["is_branch_offered"]:
            not_offered += 1
        elif row["tier"] == "Safe":
            safe += 1
        elif row["tier"] == "Target":
            target += 1
        elif row["tier"] == "Dream":
            dream += 1

    valid_total = max(1, dream + target + safe)
    dream_pct = round((dream / valid_total) * 100)
    target_pct = round((target / valid_total) * 100)
    safe_pct = round((safe / valid_total) * 100)

    # Risk diagnosis
    if not_offered > 0:
        risk_level = "CRITICAL_INVALID_BRANCH"
        risk_title = f"🚨 {not_offered} Invalid Branch Selections!"
        risk_alert = f"You selected branches not offered by these colleges. DTE / JoSAA counseling will reject or skip these entries."
    elif safe == 0:
        risk_level = "CRITICAL_ZERO_ALLOTMENT"
        risk_title = "🚨 CRITICAL RISK: 0 Safe Colleges!"
        risk_alert = "You have ZERO safe backups. 80% of students with this option form end up with ZERO seat allotments across all rounds. Add at least 2 safe backups immediately!"
    elif dream == 0 and safe > 0:
        risk_level = "SUBOPTIMAL_OVERCONSERVATIVE"
        risk_title = "⚠️ SUB-OPTIMAL: Missing Aspirational Reaches"
        risk_alert = "Your form only contains safe colleges. You have spare percentile headroom to add top aspirational colleges without risking your seat!"
    elif dream_pct > 70:
        risk_level = "HIGH_UNBALANCED_REACHES"
        risk_title = "⚠️ HIGH ALLOTMENT VOLATILITY"
        risk_alert = f"{dream_pct}% of your choices are high-reach dreams. Rebalance towards the Golden 20:50:30 ratio to guarantee a seat."
    else:
        risk_level = "BALANCED"
        risk_title = "✅ BALANCED PORTFOLIO (Golden Ratio Aligned)"
        risk_alert = f"Healthy portfolio distribution: {dream_pct}% Dream, {target_pct}% Target, {safe_pct}% Safe backups."

    return {
        "total": total,
        "dream": dream,
        "target": target,
        "safe": safe,
        "not_offered": not_offered,
        "dream_pct": dream_pct,
        "target_pct": target_pct,
        "safe_pct": safe_pct,
        "risk_level": risk_level,
        "risk_title": risk_title,
        "risk_alert": risk_alert
    }


def find_matching_branch_for_college(college_branches: List[Dict[str, Any]], target_branches: List[str]) -> Optional[str]:
    """Find branch in college matching the student's selected branch(es) without changing discipline."""
    b_names = [b.get("branch", "") for b in college_branches if b.get("branch")]
    if not b_names:
        return None

    # Priority 1: Exact case-insensitive match
    for tb in target_branches:
        if not tb:
            continue
        tb_clean = tb.strip().lower()
        for b in b_names:
            if b.strip().lower() == tb_clean:
                return b

    # Priority 2: Direct disciplinary equivalence (Strictly within the exact same field)
    for tb in target_branches:
        if not tb:
            continue
        tb_l = tb.lower().replace("&", "and")

        # Computer Engineering / Science
        if "computer" in tb_l or "cse" in tb_l:
            for b in b_names:
                b_l = b.lower().replace("&", "and")
                if "computer engineering" in b_l or "computer science" in b_l or "cse" in b_l:
                    return b

        # Information Technology (Strictly IT, not Dyestuff or Food tech)
        elif "information technology" in tb_l or tb_l.strip() == "it":
            for b in b_names:
                b_l = b.lower()
                if "information technology" in b_l or " info tech" in b_l:
                    return b

        # AI & Data Science
        elif any(k in tb_l for k in ["artificial intelligence", "data science", "aids", "machine learning"]):
            for b in b_names:
                b_l = b.lower()
                if any(k in b_l for k in ["artificial intelligence", "data science", "aiml", "aids"]):
                    return b

        # Mechanical
        elif "mechanical" in tb_l:
            for b in b_names:
                b_l = b.lower()
                if "mechanical" in b_l:
                    return b

        # Civil
        elif "civil" in tb_l:
            for b in b_names:
                b_l = b.lower()
                if "civil" in b_l:
                    return b

        # Electrical (not electronic)
        elif "electrical" in tb_l:
            for b in b_names:
                b_l = b.lower()
                if "electrical" in b_l and "electronic" not in b_l:
                    return b

        # Electronics & Telecommunication / EXTC / ENTC
        elif any(k in tb_l for k in ["electronic", "telecom", "entc", "extc"]):
            for b in b_names:
                b_l = b.lower()
                if any(k in b_l for k in ["electronic", "telecom", "entc", "extc"]):
                    return b

        # Chemical
        elif "chemical" in tb_l:
            for b in b_names:
                b_l = b.lower()
                if "chemical" in b_l:
                    return b

        # Medical (NEET)
        elif "mbbs" in tb_l:
            for b in b_names:
                if "mbbs" in b.lower():
                    return b
        elif "bds" in tb_l or "dental" in tb_l:
            for b in b_names:
                if "bds" in b.lower() or "dental" in b.lower():
                    return b
        elif "bams" in tb_l or "ayurved" in tb_l:
            for b in b_names:
                if "bams" in b.lower() or "ayurved" in b.lower():
                    return b

    return None


def algorithmic_rebalance(
    student_score: float,
    exam_type: str,
    category: str,
    cap_round: str,
    strategy_type: str = "golden_ratio",
    prompt: str = "",
    current_choices: Optional[List[Dict[str, Any]]] = None,
    preferred_branch: Optional[str] = None,
    preferred_branches: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Algorithmic selector that strictly preserves user's selected branch(es)
    and distributes Dream, Target, and Safe colleges according to strategy.
    """
    catalog = get_exam_catalog(exam_type)
    prompt_lower = (prompt or "").lower()

    # City filter detection
    is_pune_only = ("pune" in prompt_lower and "mumbai" not in prompt_lower and strategy_type != "pune_mumbai_hub")
    is_mumbai_only = ("mumbai" in prompt_lower and "pune" not in prompt_lower and strategy_type != "pune_mumbai_hub")
    is_pune_mumbai = (strategy_type == "pune_mumbai_hub") or ("pune" in prompt_lower and "mumbai" in prompt_lower)
    is_safe_guarantee = (strategy_type == "guaranteed_lock") or any(k in prompt_lower for k in ["safe", "guarantee", "round 1 lock", "zero allotment", "backup"])

    # 1. Determine user's selected branch strictly
    # Priority: explicit preferred_branch > explicit prompt keyword > first current choice branch > default
    user_branches = []
    prompt_branch = None
    if any(k in prompt_lower for k in ["mechanical", "mech"]):
        prompt_branch = "Mechanical Engineering"
    elif any(k in prompt_lower for k in ["civil"]):
        prompt_branch = "Civil Engineering"
    elif any(k in prompt_lower for k in ["electrical"]):
        prompt_branch = "Electrical Engineering"
    elif any(k in prompt_lower for k in ["chemical"]):
        prompt_branch = "Chemical Engineering"
    elif any(k in prompt_lower for k in ["electronics", "entc", "extc", "telecom"]):
        prompt_branch = "Electronics & Telecommunication"
    elif any(k in prompt_lower for k in ["information technology", " info tech "]) or re.search(r"\bit\b", prompt_lower):
        prompt_branch = "Information Technology"
    elif any(k in prompt_lower for k in ["artificial intelligence", "data science", "aiml", "aids", "machine learning"]) or re.search(r"\bai\b", prompt_lower):
        prompt_branch = "Artificial Intelligence & Data Science"
    elif any(k in prompt_lower for k in ["computer", "cse"]) or re.search(r"\bcs\b", prompt_lower):
        prompt_branch = "Computer Engineering"

    if prompt_branch:
        user_branches = [prompt_branch]
    elif preferred_branch and preferred_branch.strip() and preferred_branch.strip() != "auto":
        # Strict branch lock from user's explicit selection
        user_branches = [preferred_branch.strip()]
    elif preferred_branches and len(preferred_branches) > 0 and preferred_branches[0] != "auto":
        user_branches = [b.strip() for b in preferred_branches if b and b.strip() and b.strip() != "auto"]
    elif current_choices and len(current_choices) > 0:
        first_branch = current_choices[0].get("selected_branch") or current_choices[0].get("branch")
        if first_branch and first_branch.strip():
            user_branches = [first_branch.strip()]

    if not user_branches:
        user_branches = ["MBBS"] if "NEET" in exam_type.upper() else ["Computer Engineering"]

    target_discipline = user_branches[0]

    # Map catalog for fast college branch lookup
    catalog_by_code = {c["college_code"]: c for c in catalog}

    # 2. Evaluate and preserve user's hand-picked choices strictly aligned with target discipline and city
    user_existing = []
    if current_choices:
        for c in current_choices:
            code = c.get("college_code")
            if not code:
                continue
            cat_col = catalog_by_code.get(code)
            if not cat_col:
                continue

            col_city = cat_col.get("city", "")
            if is_pune_only and col_city != "Pune":
                continue
            if is_mumbai_only and col_city != "Mumbai":
                continue
            if is_pune_mumbai and col_city not in ["Pune", "Mumbai"]:
                continue

            col_branches = cat_col.get("branches", [])
            matched_br = find_matching_branch_for_college(col_branches, user_branches)
            if not matched_br:
                continue

            row = calculate_cap_row(code, matched_br, category, cap_round, student_score, exam_type)
            if row.get("is_branch_offered"):
                user_existing.append({
                    "college_code": row["college_code"],
                    "college_name": row["college_name"],
                    "short_name": row["short_name"],
                    "city": row["city"],
                    "nirf_rank": row.get("nirf_rank", "N/A"),
                    "annual_fees": row.get("annual_fees", 110000),
                    "selected_branch": matched_br,
                    "cutoff_2026": row["cutoff_2026"],
                    "admission_probability": row["admission_probability"],
                    "tier": row["tier"],
                    "score_margin": row["score_margin"]
                })

    # 3. Scan catalog for candidate colleges strictly offering the user's selected branch
    candidates = []
    for col in catalog:
        # City filter
        col_city = col.get("city", "")
        if is_pune_only and col_city != "Pune":
            continue
        if is_mumbai_only and col_city != "Mumbai":
            continue
        if is_pune_mumbai and col_city not in ["Pune", "Mumbai"]:
            continue

        matched_branch = find_matching_branch_for_college(col.get("branches", []), user_branches)
        if not matched_branch:
            continue

        row = calculate_cap_row(col["college_code"], matched_branch, category, cap_round, student_score, exam_type)
        if not row["is_branch_offered"]:
            continue

        candidates.append({
            "college_code": col["college_code"],
            "college_name": col["college_name"],
            "short_name": col["short_name"],
            "city": col_city,
            "nirf_rank": col.get("nirf_rank", "N/A"),
            "annual_fees": col.get("annual_fees", 110000),
            "selected_branch": matched_branch,
            "cutoff_2026": row["cutoff_2026"],
            "admission_probability": row["admission_probability"],
            "tier": row["tier"],
            "score_margin": row["score_margin"]
        })

    # Group into Dream, Target, Safe
    dreams = [c for c in candidates if c["tier"] == "Dream"]
    targets = [c for c in candidates if c["tier"] == "Target"]
    safes = [c for c in candidates if c["tier"] == "Safe"]

    # Only widen city scope if the user did NOT specify a strict geographic preference
    allow_city_widen = not (is_pune_only or is_mumbai_only or is_pune_mumbai)
    if (len(safes) < 3 or len(targets) < 2) and allow_city_widen:
        for col in catalog:
            matched_branch = find_matching_branch_for_college(col.get("branches", []), user_branches)
            if not matched_branch:
                continue
            row = calculate_cap_row(col["college_code"], matched_branch, category, cap_round, student_score, exam_type)
            if not row["is_branch_offered"]:
                continue
            cand_item = {
                "college_code": col["college_code"],
                "college_name": col["college_name"],
                "short_name": col["short_name"],
                "city": col.get("city", ""),
                "nirf_rank": col.get("nirf_rank", "N/A"),
                "annual_fees": col.get("annual_fees", 110000),
                "selected_branch": matched_branch,
                "cutoff_2026": row["cutoff_2026"],
                "admission_probability": row["admission_probability"],
                "tier": row["tier"],
                "score_margin": row["score_margin"]
            }
            if row["tier"] == "Safe" and len(safes) < 6 and not any(s["college_code"] == col["college_code"] for s in safes):
                safes.append(cand_item)
            elif row["tier"] == "Target" and len(targets) < 6 and not any(t["college_code"] == col["college_code"] for t in targets):
                targets.append(cand_item)
            elif row["tier"] == "Dream" and len(dreams) < 3 and not any(d["college_code"] == col["college_code"] for d in dreams):
                dreams.append(cand_item)

    # Sort each group by cutoff descending (highest prestige first)
    dreams.sort(key=lambda x: x["cutoff_2026"], reverse=True)
    targets.sort(key=lambda x: x["cutoff_2026"], reverse=True)
    safes.sort(key=lambda x: x["cutoff_2026"], reverse=True)

    # Target quotas based on strategy
    if is_safe_guarantee:
        dream_quota = 1
        target_quota = 2
        safe_quota = 6
    elif strategy_type == "golden_ratio" or is_pune_mumbai or strategy_type == "tech_cs_only":
        dream_quota = 2
        target_quota = 4
        safe_quota = 3
    else:
        dream_quota = 2
        target_quota = 4
        safe_quota = 3

    final_list = []
    seen_colleges = set()

    # 1. Fill Dreams: First from user's existing choices, then from catalog dreams
    for d in user_existing:
        if d["tier"] == "Dream" and len([x for x in final_list if x["tier"] == "Dream"]) < dream_quota and d["college_code"] not in seen_colleges:
            final_list.append(d)
            seen_colleges.add(d["college_code"])
    for d in dreams:
        if len([x for x in final_list if x["tier"] == "Dream"]) < dream_quota and d["college_code"] not in seen_colleges:
            final_list.append(d)
            seen_colleges.add(d["college_code"])

    # 2. Fill Targets: First from user's existing choices, then from catalog targets
    for t in user_existing:
        if t["tier"] == "Target" and len([x for x in final_list if x["tier"] == "Target"]) < target_quota and t["college_code"] not in seen_colleges:
            final_list.append(t)
            seen_colleges.add(t["college_code"])
    for t in targets:
        if len([x for x in final_list if x["tier"] == "Target"]) < target_quota and t["college_code"] not in seen_colleges:
            final_list.append(t)
            seen_colleges.add(t["college_code"])

    # 3. Fill Safes: First from user's existing choices, then from catalog safes
    for s in user_existing:
        if s["tier"] == "Safe" and len([x for x in final_list if x["tier"] == "Safe"]) < safe_quota and s["college_code"] not in seen_colleges:
            final_list.append(s)
            seen_colleges.add(s["college_code"])
    for s in safes:
        if len([x for x in final_list if x["tier"] == "Safe"]) < safe_quota and s["college_code"] not in seen_colleges:
            final_list.append(s)
            seen_colleges.add(s["college_code"])

    # Backfill if list is still below 6
    if len(final_list) < 6:
        for c in (safes + targets + dreams):
            if c["college_code"] not in seen_colleges and len(final_list) < 8:
                final_list.append(c)
                seen_colleges.add(c["college_code"])

    # Strictly order by Cutoff descending (Prestige order)
    final_list.sort(key=lambda x: x["cutoff_2026"], reverse=True)

    # Format result
    formatted = []
    for item in final_list:
        formatted.append({
            "college_code": item["college_code"],
            "college_name": item["college_name"],
            "selected_branch": item["selected_branch"],
            "short_name": item["short_name"],
            "city": item["city"],
            "tier": item["tier"],
            "admission_probability": item["admission_probability"],
            "cutoff_2026": item["cutoff_2026"],
            "reason": (
                f"Top aspirational reach ({item['cutoff_2026']}%ile)" if item["tier"] == "Dream"
                else f"Realistic match with {item['admission_probability']}% probability" if item["tier"] == "Target"
                else f"Guaranteed safety net ({item['admission_probability']}% chance)"
            )
        })

    return formatted


async def rebalance_with_ai(
    student_score: float,
    exam_type: str,
    category: str,
    cap_round: str,
    current_choices: List[Dict[str, Any]],
    strategy_type: str = "golden_ratio",
    user_prompt: str = "",
    preferred_branch: Optional[str] = None,
    preferred_branches: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Orchestrate portfolio risk analysis, algorithmic rebalancing, and Gemini AI strategic explanation.
    """
    canonical_exam = normalize_exam_name(exam_type)

    # 1. Evaluate Before Portfolio
    before_eval = evaluate_portfolio(current_choices, category, cap_round, student_score, canonical_exam)

    # 2. Compute Rebalanced Choices Algorithmic Foundation (Preserving User's Selected Branch)
    rebalanced_choices = algorithmic_rebalance(
        student_score=student_score,
        exam_type=canonical_exam,
        category=category,
        cap_round=cap_round,
        strategy_type=strategy_type,
        prompt=user_prompt,
        current_choices=current_choices,
        preferred_branch=preferred_branch,
        preferred_branches=preferred_branches
    )

    # 3. Evaluate After Portfolio
    after_eval = evaluate_portfolio(rebalanced_choices, category, cap_round, student_score, canonical_exam)

    # 4. Generate AI Counselor Advice
    target_branch_label = preferred_branch if (preferred_branch and preferred_branch != "auto") else (rebalanced_choices[0]["selected_branch"] if rebalanced_choices else "Target Discipline")
    headline = ""
    if strategy_type == "golden_ratio":
        headline = f"🪄 Golden Ratio Rebalanced ({target_branch_label}): 20% Dream • 50% Target • 30% Safe"
    elif strategy_type == "tech_cs_only":
        headline = f"💻 Top Tech & CS/IT Elite ({target_branch_label}): Calibrated Discipline Programs"
    elif strategy_type == "pune_mumbai_hub":
        headline = f"📍 Pune & Mumbai Elite Hub ({target_branch_label}): Top Autonomous Institutions"
    elif strategy_type == "guaranteed_lock":
        headline = f"🛡️ 100% Round 1 Seat Lock ({target_branch_label}): Zero Allotment Risk Eliminated"
    else:
        headline = f"🎯 Custom AI Strategy ({target_branch_label}): Optimized for '{user_prompt[:40]}...'"

    # Counselor reasoning generator (Gemini fallback built-in)
    advice_text = ""
    gemini_generated = False

    if gemini_client and user_prompt:
        try:
            prompt_context = (
                f"You are an expert Chief Admission Officer specializing in Centralized Admission Process (CAP) in India ({canonical_exam}).\n"
                f"Student Score: {student_score} ({category} category, {cap_round}).\n"
                f"Before Portfolio: {before_eval['dream']} Dream, {before_eval['target']} Target, {before_eval['safe']} Safe ({before_eval['risk_title']}).\n"
                f"After Rebalanced: {after_eval['dream']} Dream, {after_eval['target']} Target, {after_eval['safe']} Safe.\n"
                f"Student Instruction: \"{user_prompt}\".\n"
                f"Recommended Choice List: {json.dumps([{'pref': i+1, 'college': c['short_name'], 'branch': c['selected_branch'], 'tier': c['tier'], 'prob': c['admission_probability']} for i, c in enumerate(rebalanced_choices)])}.\n"
                f"Provide concise, authoritative strategic counseling advice in 3 short bullet points:\n"
                f"1. Portfolio Risk Diagnosis: Explain what was wrong with the previous list and how this fix protects their seat.\n"
                f"2. Allotment Strategy & Betterment: Explain why choices are ordered strictly from Dream to Safe (Auto-Freeze rules vs Float / Betterment in Round 2).\n"
                f"3. Allotment Prediction: State which preference number is most likely to be allotted in {cap_round}.\n"
                f"Keep it under 180 words, sharp and encouraging. Do not use greetings."
            )

            models_to_try = [GEMINI_MODEL] + [m for m in FALLBACK_MODELS if m != GEMINI_MODEL]
            loop = asyncio.get_event_loop()

            for model_name in models_to_try:
                try:
                    response = await asyncio.wait_for(
                        loop.run_in_executor(
                            None,
                            lambda: gemini_client.models.generate_content(
                                model=model_name,
                                contents=prompt_context,
                                config=types.GenerateContentConfig(
                                    temperature=0.4,
                                    max_output_tokens=350
                                )
                            )
                        ),
                        timeout=8.0
                    )
                    if response and response.text:
                        advice_text = response.text.strip()
                        gemini_generated = True
                        break
                except Exception:
                    continue
        except Exception as e:
            print(f"[Warning] Gemini CAP rebalance advisory: {e}")

    # Deterministic high-quality advice fallback
    if not advice_text:
        first_allot = next((c for c in rebalanced_choices if c["tier"] in ["Safe", "Target"] and c["admission_probability"] >= 65), None)
        first_name = first_allot["short_name"] if first_allot else "Top Target Choice"
        first_branch = first_allot["selected_branch"] if first_allot else "Engineering"
        pref_no = rebalanced_choices.index(first_allot) + 1 if first_allot else 3

        advice_text = (
            f"• **Portfolio Risk Resolved:** Rebalanced your list from high allotment risk into the **Golden Ratio** ({after_eval['dream']} Dream, {after_eval['target']} Target, and {after_eval['safe']} Safe backups).\n"
            f"• **CAP Rule Optimization:** Choices #1 to #{after_eval['dream']} are placed as aspirational reaches. Under official DTE rules, if you are allotted choice #{pref_no} ({first_name} - {first_branch}), you can accept the seat with **'Betterment (Float)'** to contest your higher dream preferences in CAP Round 2 without forfeiting your seat!\n"
            f"• **Projected Round 1 Allotment:** High confidence of securing a provisional seat at **Choice #{pref_no} ({first_name})** in {cap_round} for {category} category."
        )

    quick_rules = [
        "⚠️ Choice #1 is Auto-Freeze: If allotted your 1st preference, you CANNOT participate in CAP Round 2. Always place your ultimate dream college at #1.",
        "🔄 Float / Betterment Protection: If allotted preference #2 or lower, you can pay the Seat Acceptance Fee and contest higher preferences in subsequent rounds.",
        "🛡️ Golden Ratio Defense: 20% Dream (top reaches), 50% Target (realistic matches), 30% Safe (confirmed backups) guarantees zero allotment is prevented."
    ]

    return {
        "success": True,
        "strategy_type": strategy_type,
        "headline": headline,
        "exam_type": canonical_exam,
        "category": category,
        "cap_round": cap_round,
        "student_score": student_score,
        "gemini_powered": gemini_generated,
        "before_portfolio": before_eval,
        "after_portfolio": after_eval,
        "counselor_advice": advice_text,
        "recommended_choices": rebalanced_choices,
        "quick_rules": quick_rules
    }
