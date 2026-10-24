import re
from typing import Dict, List, Tuple
from .base_worker import BaseStateWorker
from ..domain_searcher import AgenticDomainSearcher

class MaharashtraWorker(BaseStateWorker):
    """
    Maharashtra Specialist Child Agent (100% Agentic & Dynamic).
    Discovers official websites live for ANY college across Maharashtra.
    """

    def __init__(self):
        super().__init__(state_name="Maharashtra", state_code="MH")

    async def resolve_college(self, query: str) -> Tuple[str, str, str]:
        """
        Dynamically finds the official website for ANY college in Maharashtra.
        Zero Hardcoding!
        """
        canonical_name, domain = await AgenticDomainSearcher.discover_official_domain(
            college_name=query,
            state="Maharashtra"
        )
        slug = re.sub(r"[^\w\s]", "", canonical_name.lower())
        college_id = re.sub(r"\s+", "_", slug.strip())
        return college_id, canonical_name, domain

    def get_state_regulatory_urls(self) -> Dict[str, str]:
        return {
            "cet_cell": "https://cetcell.mahacet.org",
            "fra_fees": "https://sssamiti.org",
            "dte_portal": "https://dte.maharashtra.gov.in"
        }

    def get_known_candidate_endpoints(self, college_domain: str) -> List[str]:
        base = college_domain.rstrip("/")
        return [
            f"{base}/placement",
            f"{base}/placements",
            f"{base}/training-and-placement",
            f"{base}/tpo",
            f"{base}/fee-structure",
            f"{base}/admissions/fees",
            f"{base}/nirf",
            f"{base}/mandatory-disclosure"
        ]
