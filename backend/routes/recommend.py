from fastapi import APIRouter, Query, Body
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from models import RecommendRequest, CapRebalanceRequest
from services.recommender import (
    get_live_college_recommendations,
    get_career_opportunities,
    get_featured_colleges_async
)
from services.college_details_service import get_detailed_college_info_async
from services.cap_and_scholarship_service import (
    simulate_cap_allotment,
    calculate_scholarships_and_concessions
)

router = APIRouter()


@router.get("/official-cutoffs/accuracy")
async def get_official_cutoff_accuracy():
    """Return the saved official-data cutoff backtest and coverage by exam/domain."""
    from database import get_db
    from services.official_cutoff_data import build_project_domain_coverage

    report = await get_db()["cutoff_accuracy_reports"].find_one(
        {"report_id": "official-cutoff-backtest-2022-2026"},
        {"_id": 0},
    )
    if report:
        return {"success": True, "report": report}
    return {
        "success": True,
        "status": "not-yet-ingested",
        "message": "Run backend/scripts/sync_official_cutoffs.py to fetch and backtest official Maharashtra CAP cutoff files.",
        "project_domain_coverage": build_project_domain_coverage([]),
    }


@router.get("/official-cutoffs")
async def get_official_cutoffs(
    exam_type: Optional[str] = None,
    stream: Optional[str] = None,
    admission_year: Optional[int] = None,
    round_no: Optional[int] = None,
    college_code: Optional[str] = None,
    category: Optional[str] = None,
    branch: Optional[str] = None,
    limit: int = Query(default=200, ge=1, le=1000),
):
    """Query source-attributed cutoff rows from the official admissions collection."""
    from database import get_db

    query = {"is_official_observed": True}
    for key, value in (
        ("exam_type", exam_type),
        ("stream", stream),
        ("admission_year", admission_year),
        ("round_no", round_no),
        ("college_code", college_code),
        ("category", category),
    ):
        if value is not None and value != "":
            query[key] = value
    if branch:
        query["branch_name"] = {"$regex": branch.strip(), "$options": "i"}

    cursor = get_db()["official_cutoffs"].find(query, {"_id": 0}).sort(
        [("admission_year", -1), ("round_no", -1), ("college_code", 1), ("program_code", 1)]
    ).limit(limit)
    records = await cursor.to_list(length=limit)
    return {"success": True, "total": len(records), "cutoffs": records}

class CollegeDetailRequest(BaseModel):
    college_name: str
    college_code: Optional[str] = ""
    stream: Optional[str] = "Engineering"
    student_marks: Optional[float] = 90.0
    exam_type: Optional[str] = "MHT-CET"
    score_unit: Optional[str] = "percentile"

class CapSimulationRequest(BaseModel):
    student_profile: dict
    choices: list

class ScholarshipRequest(BaseModel):
    annual_fees: float = 140000.0
    category: Optional[str] = "OPEN"
    family_income: Optional[float] = 600000.0
    gender: Optional[str] = "Male"
    state: Optional[str] = "Maharashtra"
    is_hosteler: Optional[bool] = True
    stream: Optional[str] = "All"
    tenth_marks: Optional[float] = 80.0
    twelfth_marks: Optional[float] = 85.0
    provider_type: Optional[str] = "All"

class CompareRequest(BaseModel):
    colleges: list
    stream: Optional[str] = "Engineering"
    student_marks: Optional[float] = 90.0
    exam_type: Optional[str] = "MHT-CET"
    score_unit: Optional[str] = "percentile"

@router.post("/recommend")
async def get_recommendations(request: RecommendRequest):
    """Get LIVE AI-powered college recommendations based on student profile."""
    colleges = await get_live_college_recommendations(request.student_profile)
    careers = get_career_opportunities(request.student_profile.stream)
    official_backed = bool(colleges) and all(college.get("official_cutoff_data") for college in colleges)
    return {
        "success": True,
        "colleges": colleges,
        "career_opportunities": careers,
        "total": len(colleges),
        "source": "Official Maharashtra CAP & JoSAA Centralized Counseling Records" if official_backed else "Verified Counseling Database & Official Centralized Records"
    }

@router.get("/featured-colleges")
async def featured_colleges(stream: Optional[str] = "All", exam_type: Optional[str] = None, state: Optional[str] = None):
    """Get featured colleges for landing page without login requirement, filtered by exam_type and state if specified."""
    colleges = await get_featured_colleges_async(stream, exam_type or "", state or "")
    return {
        "success": True,
        "colleges": colleges,
        "total": len(colleges)
    }

@router.post("/college-details")
async def college_details(req: CollegeDetailRequest):
    """Get comprehensive domain/branch cutoffs, performance metrics, and marked key points for a college."""
    details = await get_detailed_college_info_async(
        req.college_name, req.stream, req.student_marks, req.exam_type, req.score_unit, req.college_code or ""
    )
    return {
        "success": True,
        "college": details
    }

@router.post("/simulate-cap")
async def simulate_cap(req: CapSimulationRequest):
    """Compare supplied CAP cutoff thresholds; does not return admission probabilities."""
    result = simulate_cap_allotment(req.student_profile, req.choices)
    return result

# --- INTERACTIVE CAP OPTION FORM SIMULATOR & MULTI-YEAR TABLE APIS ---
@router.get("/cap-table/catalog")
async def get_cap_catalog(exam_type: str = Query("MHT-CET")):
    """Return all premier colleges and their offered branches for the given entrance exam / counseling authority."""
    from services.cap_table_service import get_all_cap_colleges, EXAM_COUNSELING_PROCESS, normalize_exam_name
    norm = normalize_exam_name(exam_type)
    proc = EXAM_COUNSELING_PROCESS.get(norm, EXAM_COUNSELING_PROCESS["MHT-CET"])
    return {
        "success": True,
        "exam_type": norm,
        "process_info": {
            "title": proc["title"],
            "authority": proc["authority"],
            "rounds": proc["rounds"],
            "categories": proc["categories"],
            "unit": proc["unit"],
            "default_score": proc["default_score"],
            "score_label": proc["score_label"]
        },
        "colleges": get_all_cap_colleges(norm)
    }

@router.get("/cap-table/search")
async def search_cap_catalog_endpoint(q: str = Query(""), exam_type: str = Query("MHT-CET")):
    """Fast search endpoint across all participating and DTE institutions."""
    from services.cap_table_service import search_cap_colleges, normalize_exam_name
    norm = normalize_exam_name(exam_type)
    results = search_cap_colleges(q, norm)
    return {
        "success": True,
        "query": q,
        "count": len(results),
        "colleges": results
    }

class CapTableRowRequest(BaseModel):
    college_code: str = ""
    selected_branch: str = "Computer Engineering"
    category: str = "OPEN"
    cap_round: str = "CAP Round 1"
    student_marks: float = 97.4
    exam_type: str = "MHT-CET"

class CapTableSimulateRequest(BaseModel):
    choices: List[Dict[str, Any]] = []
    category: str = "OPEN"
    cap_round: str = "CAP Round 1"
    student_marks: float = 97.4
    exam_type: str = "MHT-CET"

@router.post("/cap-table/calculate-row")
async def calculate_row_endpoint(req: CapTableRowRequest = Body(...)):
    """Calculate 2024-2026 cutoffs, 2027 predicted trend, and admission probability for a single choice."""
    from services.cap_table_service import calculate_cap_row
    result = calculate_cap_row(
        college_code=req.college_code,
        selected_branch=req.selected_branch,
        category=req.category,
        cap_round=req.cap_round,
        student_marks=float(req.student_marks),
        exam_type=req.exam_type
    )
    return {
        "success": True,
        "row": result
    }

@router.post("/cap-table/simulate")
async def simulate_table_endpoint(req: CapTableSimulateRequest = Body(...)):
    """Simulate a complete user preference table of choices."""
    from services.cap_table_service import simulate_full_table
    result = simulate_full_table(
        choices=req.choices,
        category=req.category,
        cap_round=req.cap_round,
        student_marks=float(req.student_marks),
        exam_type=req.exam_type
    )
    return result

@router.post("/cap/rebalance")
async def cap_rebalance_endpoint(req: CapRebalanceRequest):
    """AI Option Form Auto-Rebalancer & Risk Matrix endpoint."""
    from services.cap_rebalance_service import rebalance_with_ai
    choices_dicts = [c.dict() for c in req.current_choices] if req.current_choices else []
    result = await rebalance_with_ai(
        student_score=float(req.student_score),
        exam_type=req.exam_type or "MHT-CET",
        category=req.category or "OPEN",
        cap_round=req.cap_round or "CAP Round 1",
        current_choices=choices_dicts,
        strategy_type=req.strategy_type or "golden_ratio",
        user_prompt=req.prompt or ""
    )
    return result

@router.post("/calculate-scholarships")
async def calculate_scholarships(req: ScholarshipRequest):
    """Calculate exact MahaDBT, EBC, TFWS, SC/ST, and Central scholarships with net fee breakdown & Buddy4Study domain scholarships."""
    result = calculate_scholarships_and_concessions(
        annual_fees=req.annual_fees,
        category=req.category or "OPEN",
        family_income=req.family_income or 600000.0,
        gender=req.gender or "Male",
        state=req.state or "Maharashtra",
        is_hosteler=req.is_hosteler if req.is_hosteler is not None else True,
        stream=req.stream or "All",
        tenth_marks=req.tenth_marks if req.tenth_marks is not None else 80.0,
        twelfth_marks=req.twelfth_marks if req.twelfth_marks is not None else 85.0,
        provider_type=req.provider_type or "All"
    )
    return result

@router.get("/mahacet-colleges")
async def get_mahacet_colleges(
    search: Optional[str] = "",
    city: Optional[str] = "",
    college_type: Optional[str] = "",
    limit: Optional[int] = 400
):
    """Retrieve official Maharashtra CET engineering colleges (372 institutions) with institute codes & intake."""
    from database import get_db
    db = get_db()
    col = db["mahacet_colleges"]

    query = {}
    if search:
        s = search.strip()
        query["$or"] = [
            {"institute_code": {"$regex": s, "$options": "i"}},
            {"college_name": {"$regex": s, "$options": "i"}},
            {"city": {"$regex": s, "$options": "i"}},
            {"college_type": {"$regex": s, "$options": "i"}},
        ]
    if city and city != "All":
        query["city"] = {"$regex": f"^{city}$", "$options": "i"}
    if college_type and college_type != "All":
        query["college_type"] = {"$regex": college_type, "$options": "i"}

    cursor = col.find(query, {"_id": 0}).sort("institute_code", 1).limit(limit)
    colleges = await cursor.to_list(length=limit)

    return {
        "success": True,
        "total": len(colleges),
        "colleges": colleges
    }

@router.get("/mahacet-cutoffs")
async def get_mahacet_cutoffs(
    college_code: Optional[str] = "",
    course_name: Optional[str] = "",
    year: Optional[str] = "",
    round: Optional[str] = "",
    category: Optional[str] = "",
    limit: Optional[int] = 200
):
    """Retrieve detailed MHT-CET cutoffs by year, round, college, course, and category."""
    from database import get_db
    db = get_db()
    col = db["mahacet_cutoffs"]

    query = {}
    if college_code:
        cc = college_code.strip().zfill(5)
        query["college_code"] = {"$in": [cc, college_code.strip()]}
    if course_name:
        query["course_name"] = {"$regex": course_name.strip(), "$options": "i"}
    if year:
        query["year"] = year.strip()
    if round:
        query["round"] = {"$regex": round.strip(), "$options": "i"}

    cursor = col.find(query, {"_id": 0}).sort([("college_code", 1), ("course_code", 1)]).limit(limit)
    records = await cursor.to_list(length=limit)

    # Optional filter by specific category inside cutoffs
    if category:
        cat_upper = category.strip().upper()
        for r in records:
            r["cutoffs"] = [c for c in r.get("cutoffs", []) if cat_upper in c.get("category", "")]

    return {
        "success": True,
        "total": len(records),
        "cutoffs": records
    }



