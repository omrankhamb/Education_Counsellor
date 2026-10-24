from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class PlacementStats(BaseModel):
    placement_ratio_pct: Optional[float] = Field(None, description="Placement percentage, e.g. 92.4")
    highest_ctc_lpa: Optional[float] = Field(None, description="Highest package in Lakhs Per Annum, e.g. 44.5")
    average_ctc_lpa: Optional[float] = Field(None, description="Average package in Lakhs Per Annum, e.g. 12.8")
    median_ctc_lpa: Optional[float] = Field(None, description="Median package in Lakhs Per Annum")
    top_recruiters: List[str] = Field(default_factory=list, description="Top companies recruited")
    total_offers: Optional[int] = Field(None, description="Total job offers received")
    academic_batch_year: Optional[str] = Field(None, description="Batch year e.g. '2025-2026' or '2024-2025'")
    source_url: str = Field(..., description="Direct URL of the official TPO/placement page or PDF")
    verbatim_quote: Optional[str] = Field(None, description="Exact verbatim sentence quote from the webpage")
    is_verified: bool = Field(False, description="Whether the quote passed the deterministic Python verification audit")

class FeeStructure(BaseModel):
    tuition_fee: Optional[int] = Field(None, description="Approved Tuition Fee in INR")
    development_fee: Optional[int] = Field(None, description="Development Fee in INR")
    other_fees: Optional[int] = Field(None, description="Other university / gymkhana fees in INR")
    total_annual_fee: Optional[int] = Field(None, description="Total Annual Fee payable in INR")
    fra_approved_academic_year: Optional[str] = Field(None, description="Approved academic year e.g. '2026-27'")
    source_url: str = Field(..., description="Direct URL of the official fee circular or admissions page")
    verbatim_quote: Optional[str] = Field(None, description="Exact verbatim sentence quote from fee page")
    is_verified: bool = Field(False, description="Whether fee passed deterministic Python audit")

class AccreditationStats(BaseModel):
    naac_grade: Optional[str] = Field(None, description="e.g. 'A++', 'A+', 'A'")
    nirf_rank_range: Optional[str] = Field(None, description="e.g. 'Rank 50-100' or 'Rank 120'")
    nba_accredited: Optional[bool] = Field(None, description="Whether key engineering branches are NBA accredited")
    source_url: Optional[str] = None
    verbatim_quote: Optional[str] = None
    is_verified: bool = False

class ChangeAuditRecord(BaseModel):
    timestamp_iso: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    field_name: str
    old_value: Any
    new_value: Any
    source_url: str
    reason: str

class DiscoveredLink(BaseModel):
    category: str  # 'placement', 'fees', 'nirf', 'admissions'
    url: str
    link_text: str
    is_pdf: bool = False

class LiveCollegeIntelligenceResponse(BaseModel):
    college_id: str
    canonical_name: str
    state: str
    official_domain: str
    live_timestamp_iso: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    verification_badge: str = "LIVE_OFFICIAL_VERIFIED"
    placement_intelligence: Optional[PlacementStats] = None
    fee_intelligence: Optional[FeeStructure] = None
    accreditation_intelligence: Optional[AccreditationStats] = None
    latency_ms: int = 0
    audit_passed: bool = False
    audit_notes: List[str] = Field(default_factory=list)
    db_sync_status: str = "LIVE_ONLY"
    change_history: List[ChangeAuditRecord] = Field(default_factory=list)
