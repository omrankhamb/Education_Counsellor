import re
from typing import Dict, List, Tuple
from .base_worker import BaseStateWorker
from ..domain_searcher import AgenticDomainSearcher

class AllIndiaWorker(BaseStateWorker):
    """
    National & Multi-State Child Agent (100% Agentic & Dynamic).
    Discovers official websites live for ANY college across India.
    Zero Hardcoding!
    """

    def __init__(self):
        super().__init__(state_name="All India", state_code="IN")

    async def resolve_college(self, query: str) -> Tuple[str, str, str]:
        canonical_name, domain = await AgenticDomainSearcher.discover_official_domain(
            college_name=query,
            state="India"
        )
        slug = re.sub(r"[^\w\s]", "", canonical_name.lower())
        college_id = re.sub(r"\s+", "_", slug.strip())
        return college_id, canonical_name, domain

    def get_state_regulatory_urls(self) -> Dict[str, str]:
        return {
            "josaa_portal": "https://josaa.nic.in",
            "csab_portal": "https://csab.nic.in",
            "nirf_portal": "https://www.nirfindia.org",
            "aicte_portal": "https://www.aicte-india.org"
        }

    def get_known_candidate_endpoints(self, college_domain: str) -> List[str]:
        base = college_domain.rstrip("/")
        return [
            f"{base}/placement",
            f"{base}/placements",
            f"{base}/training-placement",
            f"{base}/fees",
            f"{base}/admissions",
            f"{base}/nirf"
        ]
