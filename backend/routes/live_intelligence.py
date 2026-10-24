import logging
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from services.live_agents.master_orchestrator import MasterOrchestrator
from services.live_agents.models import LiveCollegeIntelligenceResponse

logger = logging.getLogger("LiveIntelRoute")

router = APIRouter(prefix="/agent", tags=["Live College Intelligence Multi-Agent"])
orchestrator = MasterOrchestrator()

@router.get("/live-intel", response_model=LiveCollegeIntelligenceResponse)
async def get_live_college_intelligence(
    college: str = Query(..., description="College name, acronym, or code (e.g. 'pict', 'coep', 'rvce', 'dtu')"),
    state: Optional[str] = Query(None, description="Optional state hint (e.g. 'maharashtra', 'karnataka')")
):
    """
    Live Dual-Source College Intelligence Endpoint.
    Directly scrapes and extracts verified placement metrics, packages, and fees from official websites.
    """
    try:
        response = await orchestrator.execute_live_intelligence(
            college_query=college,
            state_hint=state
        )
        return response
    except Exception as e:
        logger.error(f"Failed to gather live intelligence for {college}: {e}")
        raise HTTPException(status_code=500, detail=f"Live intelligence extraction failed: {str(e)}")
