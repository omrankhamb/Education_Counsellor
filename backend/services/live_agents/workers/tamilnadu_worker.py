import re
from typing import Dict, List, Tuple
from .base_worker import BaseStateWorker
from ..domain_searcher import AgenticDomainSearcher

class TamilNaduWorker(BaseStateWorker):
    """
    Tamil Nadu Specialist Child Agent (100% Agentic & Dynamic).
    Discovers official websites live for ANY college across Tamil Nadu.
    """

    def __init__(self):
        super().__init__(state_name="Tamil Nadu", state_code="TN")

    async def resolve_college(self, query: str) -> Tuple[str, str, str]:
        canonical_name, domain = await AgenticDomainSearcher.discover_official_domain(
            college_name=query,
            state="Tamil Nadu"
        )
        slug = re.sub(r"[^\w\s]", "", canonical_name.lower())
        college_id = re.sub(r"\s+", "_", slug.strip())
        return college_id, canonical_name, domain

    def get_state_regulatory_urls(self) -> Dict[str, str]:
        return {
            "tnea_portal": "https://www.tneaonline.org",
            "anna_univ": "https://www.annauniv.edu"
        }

    def get_known_candidate_endpoints(self, college_domain: str) -> List[str]:
        base = college_domain.rstrip("/")
        return [
            f"{base}/placement",
            f"{base}/placements",
            f"{base}/fees",
            f"{base}/fee-structure",
            f"{base}/nirf"
        ]
