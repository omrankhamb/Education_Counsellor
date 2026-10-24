import abc
from typing import Dict, List, Optional, Tuple
from ..models import LiveCollegeIntelligenceResponse

class BaseStateWorker(abc.ABC):
    """
    Abstract Base Class for State Specialist Child Agents.
    Encapsulates state-specific knowledge, regulatory bodies, and domain directories.
    """

    def __init__(self, state_name: str, state_code: str):
        self.state_name = state_name
        self.state_code = state_code

    @abc.abstractmethod
    async def resolve_college(self, query: str) -> Tuple[str, str, str]:
        """
        Dynamically resolves any college query to: (college_id, canonical_name, official_domain)
        using autonomous Agentic search without hardcoded lists.
        """
        pass

    @abc.abstractmethod
    def get_state_regulatory_urls(self) -> Dict[str, str]:
        """
        Returns URLs for the state's official counseling / fee regulating authorities.
        """
        pass

    @abc.abstractmethod
    def get_known_candidate_endpoints(self, college_domain: str) -> List[str]:
        """
        Returns known high-probability subpaths for colleges in this jurisdiction.
        """
        pass
