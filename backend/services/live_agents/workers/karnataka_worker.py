import re
from typing import Dict, List, Tuple
from .base_worker import BaseStateWorker
from ..domain_searcher import AgenticDomainSearcher

class KarnatakaWorker(BaseStateWorker):
    """
    Karnataka Specialist Child Agent (100% Agentic & Dynamic).
    Discovers official websites live for ANY college across Karnataka.
    """

    def __init__(self):
        super().__init__(state_name="Karnataka", state_code="KA")

    async def resolve_college(self, query: str) -> Tuple[str, str, str]:
        """
        Dynamically finds the official website for ANY college in Karnataka.
        Zero Hardcoding!
        """
        canonical_name, domain = await AgenticDomainSearcher.discover_official_domain(
            college_name=query,
            state="Karnataka"
        )
        slug = re.sub(r"[^\w\s]", "", canonical_name.lower())
        college_id = re.sub(r"\s+", "_", slug.strip())
        return college_id, canonical_name, domain

    def get_state_regulatory_urls(self) -> Dict[str, str]:
        return {
            "kea_portal": "https://cetonline.karnataka.gov.in/kea/",
            "comedk_portal": "https://www.comedk.org"
        }

    def get_known_candidate_endpoints(self, college_domain: str) -> List[str]:
        base = college_domain.rstrip("/")
        return [
            f"{base}/placement",
            f"{base}/placements",
            f"{base}/placement-statistics",
            f"{base}/fee-structure",
            f"{base}/admissions/fees",
            f"{base}/nirf"
        ]
