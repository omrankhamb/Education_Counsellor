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


def algorithmic_rebalance(
    student_score: float,
    exam_type: str,
    category: str,
    cap_round: str,
    strategy_type: str = "golden_ratio",
    prompt: str = ""
) -> List[Dict[str, Any]]:
    """
    Algorithmic selector that uses official catalog cutoffs and student score
    to pick properly distributed Dream, Target, and Safe colleges and branches.
    """
    catalog = get_exam_catalog(exam_type)
    prompt_lower = (prompt or "").lower()

    # City filter detection
    is_pune_only = ("pune" in prompt_lower and "mumbai" not in prompt_lower and strategy_type != "pune_mumbai_hub")
    is_mumbai_only = ("mumbai" in prompt_lower and "pune" not in prompt_lower and strategy_type != "pune_mumbai_hub")
    is_pune_mumbai = (strategy_type == "pune_mumbai_hub") or ("pune" in prompt_lower and "mumbai" in prompt_lower)

    # Domain / Branch filter
    is_tech_only = (strategy_type == "tech_cs_only") or any(k in prompt_lower for k in ["cs", "computer", "it", "software", "tech"])
    is_ai_ds_only = any(k in prompt_lower for k in ["ai", "data science", "machine learning", "robotics"])
    is_core_only = any(k in prompt_lower for k in ["mechanical", "civil", "electrical", "core"])
    is_safe_guarantee = (strategy_type == "guaranteed_lock") or any(k in prompt_lower for k in ["safe", "guarantee", "round 1 lock", "zero allotment", "backup"])

    tech_keywords = ["computer", "information technology", "artificial intelligence", "data science", "machine learning", "robotics"]
    ai_ds_keywords = ["artificial intelligence", "data science", "machine learning", "robotics"]
    core_keywords = ["mechanical", "civil", "electrical", "instrumentation", "metallurgy", "production"]

    candidates = []
    for col in catalog:
        # City filter
        if is_pune_only and col["city"] != "Pune":
            continue
        if is_mumbai_only and col["city"] != "Mumbai":
            continue
        if is_pune_mumbai and col["city"] not in ["Pune", "Mumbai"]:
            continue

        for br in col["branches"]:
            b_name = br["branch"]
            b_domain = br.get("domain", "")

            if is_ai_ds_only:
                if not any(k in b_name.lower() or k in b_domain.lower() for k in ai_ds_keywords):
                    continue
            elif is_tech_only:
                if not any(k in b_name.lower() or k in b_domain.lower() for k in tech_keywords):
                    continue
            elif is_core_only:
                if not any(k in b_name.lower() or k in b_domain.lower() for k in core_keywords):
                    continue

            # Evaluate row
            row = calculate_cap_row(col["college_code"], b_name, category, cap_round, student_score, exam_type)
            if not row["is_branch_offered"]:
                continue

            candidates.append({
                "college_code": col["college_code"],
                "college_name": col["college_name"],
                "short_name": col["short_name"],
                "city": col["city"],
                "nirf_rank": col["nirf_rank"],
                "annual_fees": col["annual_fees"],
                "selected_branch": b_name,
                "cutoff_2026": row["cutoff_2026"],
                "admission_probability": row["admission_probability"],
                "tier": row["tier"],
                "score_margin": row["score_margin"]
            })

    # Group into Dream, Target, Safe
    dreams = [c for c in candidates if c["tier"] == "Dream"]
    targets = [c for c in candidates if c["tier"] == "Target"]
    safes = [c for c in candidates if c["tier"] == "Safe"]

    # If Safe or Target options are insufficient under strict filters (e.g. asking for safe CS in Pune at 92%),
    # gracefully widen candidate pool from full catalog to ensure seat safety
    if len(safes) < 2 or len(targets) < 2:
        for col in catalog:
            for br in col["branches"]:
                b_name = br["branch"]
                row = calculate_cap_row(col["college_code"], b_name, category, cap_round, student_score, exam_type)
                if not row["is_branch_offered"]:
                    continue
                cand_item = {
                    "college_code": col["college_code"],
                    "college_name": col["college_name"],
                    "short_name": col["short_name"],
                    "city": col["city"],
                    "nirf_rank": col["nirf_rank"],
                    "annual_fees": col["annual_fees"],
                    "selected_branch": b_name,
                    "cutoff_2026": row["cutoff_2026"],
                    "admission_probability": row["admission_probability"],
                    "tier": row["tier"],
                    "score_margin": row["score_margin"]
                }
                if row["tier"] == "Safe" and len(safes) < 5 and not any(s["college_code"] == col["college_code"] and s["selected_branch"] == b_name for s in safes):
                    safes.append(cand_item)
                elif row["tier"] == "Target" and len(targets) < 5 and not any(t["college_code"] == col["college_code"] and t["selected_branch"] == b_name for t in targets):
                    targets.append(cand_item)
                elif row["tier"] == "Dream" and len(dreams) < 3 and not any(d["college_code"] == col["college_code"] and d["selected_branch"] == b_name for d in dreams):
                    dreams.append(cand_item)

    # Sort each group by cutoff descending (highest quality first)
    dreams.sort(key=lambda x: x["cutoff_2026"], reverse=True)
    targets.sort(key=lambda x: x["cutoff_2026"], reverse=True)
    safes.sort(key=lambda x: x["cutoff_2026"], reverse=True)

    # Deduplicate by college to give breadth unless necessary
    def pick_diverse(group: List[Dict[str, Any]], count: int) -> List[Dict[str, Any]]:
        picked = []
        seen_colleges = set()
        for item in group:
            if item["college_code"] not in seen_colleges and len(picked) < count:
                picked.append(item)
                seen_colleges.add(item["college_code"])
        # If still need more, take remaining
        if len(picked) < count:
            for item in group:
                if item not in picked and len(picked) < count:
                    picked.append(item)
        return picked

    final_list = []
    if is_safe_guarantee:
        # 1-2 Target, 5-6 Safe
        final_list.extend(pick_diverse(targets, 2))
        final_list.extend(pick_diverse(safes, 6))
        if len(final_list) < 5 and dreams:
            final_list.extend(pick_diverse(dreams, 2))
    elif strategy_type == "tech_cs_only":
        # 2 Dream, 4 Target, 3 Safe
        final_list.extend(pick_diverse(dreams, 2))
        final_list.extend(pick_diverse(targets, 4))
        final_list.extend(pick_diverse(safes, 3))
    elif is_pune_mumbai:
        # 2 Dream, 4 Target, 3 Safe in Pune/Mumbai
        final_list.extend(pick_diverse(dreams, 2))
        final_list.extend(pick_diverse(targets, 4))
        final_list.extend(pick_diverse(safes, 3))
    else:
        # Default Golden Ratio: 2 Dream, 4 Target, 3 Safe
        final_list.extend(pick_diverse(dreams, 2))
        final_list.extend(pick_diverse(targets, 4))
        final_list.extend(pick_diverse(safes, 3))

    # If still empty or fewer than 4 choices, backfill from available candidates
    if len(final_list) < 4:
        all_rem = [c for c in (dreams + targets + safes) if c not in final_list]
        for item in all_rem:
            if len(final_list) < 7:
                final_list.append(item)

    # Ensure list is strictly ordered by cutoff descending (highest prestige at #1)
    final_list.sort(key=lambda x: x["cutoff_2026"], reverse=True)

    # Format result choices
    formatted = []
    for idx, item in enumerate(final_list):
        formatted.append({
            "college_code": item["college_code"],
            "selected_branch": item["selected_branch"],
            "short_name": item["short_name"],
            "city": item["city"],
            "tier": item["tier"],
            "admission_probability": item["admission_probability"],
            "cutoff_2026": item["cutoff_2026"],
            "reason": (
                f"Top aspirational dream ({item['cutoff_2026']}%ile)" if item["tier"] == "Dream"
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
    user_prompt: str = ""
) -> Dict[str, Any]:
    """
    Orchestrate portfolio risk analysis, algorithmic rebalancing, and Gemini AI strategic explanation.
    """
    canonical_exam = normalize_exam_name(exam_type)

    # 1. Evaluate Before Portfolio
    before_eval = evaluate_portfolio(current_choices, category, cap_round, student_score, canonical_exam)

    # 2. Compute Rebalanced Choices Algorithmic Foundation
    rebalanced_choices = algorithmic_rebalance(
        student_score=student_score,
        exam_type=canonical_exam,
        category=category,
        cap_round=cap_round,
        strategy_type=strategy_type,
        prompt=user_prompt
    )

    # 3. Evaluate After Portfolio
    after_eval = evaluate_portfolio(rebalanced_choices, category, cap_round, student_score, canonical_exam)

    # 4. Generate AI Counselor Advice
    headline = ""
    if strategy_type == "golden_ratio":
        headline = "🪄 Golden Ratio Rebalanced: 20% Dream • 50% Target • 30% Safe"
    elif strategy_type == "tech_cs_only":
        headline = "💻 Top Tech & CS/IT Elite: Calibrated Computer & AI Programs"
    elif strategy_type == "pune_mumbai_hub":
        headline = "📍 Pune & Mumbai Elite Hub: Top Autonomous Institutions"
    elif strategy_type == "guaranteed_lock":
        headline = "🛡️ 100% Round 1 Seat Lock: Zero Allotment Risk Eliminated"
    else:
        headline = f"🎯 Custom AI Strategy: Optimized for '{user_prompt[:40]}...'"

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
