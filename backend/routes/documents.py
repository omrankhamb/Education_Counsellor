from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from services.document_verifier_service import (
    verify_candidate_documents,
    answer_grounded_document_query,
    PROFORMA_TEMPLATES
)

router = APIRouter()

class DocumentVerifyRequest(BaseModel):
    category: str = Field(default="OPEN", description="Candidate category (OPEN, OBC, SC, ST, VJ/NT, EWS, TFWS)")
    exam_type: str = Field(default="MHT-CET", description="Entrance exam name")
    counseling_authority: Optional[str] = Field(default=None, description="Counseling authority (MHT_CET, JOSAA, NEET_MCC)")
    annual_income: float = Field(default=500000.0, description="Annual family income in INR")
    is_dropper: bool = Field(default=False, description="Whether student has 1+ year study gap after 12th")
    has_caste_validity: bool = Field(default=True, description="Possesses original Caste/Tribe Validity Certificate")
    has_cvc_receipt: bool = Field(default=False, description="Possesses official CVC application receipt")
    ncl_valid_till: Optional[str] = Field(default="2027-03-31", description="Non-Creamy Layer expiry date (YYYY-MM-DD)")
    has_domicile: bool = Field(default=True, description="Has Domicile or Birth Certificate stating birthplace in state")
    has_income_cert: bool = Field(default=True, description="Has Tahsildar Income Certificate for FY 2025-26")
    applied_tfws: bool = Field(default=False, description="Applied under 5% TFWS quota")
    applied_minority: bool = Field(default=False, description="Applied under Religious or Linguistic Minority quota")
    state: str = Field(default="Maharashtra", description="Candidate Home State")

class DocumentQueryRequest(BaseModel):
    query: str = Field(..., description="Student question regarding document rules, deadlines, or certificates")
    candidate_context: Optional[Dict[str, Any]] = Field(default=None, description="Optional profile context")

@router.post("/documents/verify")
async def verify_documents(req: DocumentVerifyRequest):
    """
    Evaluates candidate's documents against official rules matrix (MHT-CET, JoSAA, NEET MCC).
    Returns real-time eligibility status, critical warnings, and mandatory proforma templates.
    """
    try:
        report = verify_candidate_documents(
            category=req.category,
            exam_type=req.exam_type,
            counseling_authority=req.counseling_authority,
            annual_income=req.annual_income,
            is_dropper=req.is_dropper,
            has_caste_validity=req.has_caste_validity,
            has_cvc_receipt=req.has_cvc_receipt,
            ncl_valid_till=req.ncl_valid_till,
            has_domicile=req.has_domicile,
            has_income_cert=req.has_income_cert,
            applied_tfws=req.applied_tfws,
            applied_minority=req.applied_minority,
            state=req.state
        )
        return report
    except Exception as e:
        print(f"[Document Verification Error] {e}")
        raise HTTPException(status_code=500, detail=f"Document verification failed: {str(e)}")

@router.get("/documents/proformas")
async def get_all_proformas():
    """
    Returns official government proforma templates (Proforma H, Gap Certificate Affidavit, Proforma O, Income Declaration).
    """
    return {
        "success": True,
        "proformas": PROFORMA_TEMPLATES
    }

@router.post("/documents/ask-grounded")
async def ask_grounded_document_tool(req: DocumentQueryRequest):
    """
    Live web-grounded question answering regarding official counseling document rules,
    powered by Google Search grounding and official government gazette citations.
    """
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        result = await answer_grounded_document_query(
            query=req.query,
            candidate_context=req.candidate_context
        )
        return result
    except Exception as e:
        print(f"[Document Grounded Query Error] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to query grounded document tool: {str(e)}")
