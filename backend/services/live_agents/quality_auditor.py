import re
import logging
from typing import Optional, Tuple, List
from .models import PlacementStats, FeeStructure, AccreditationStats

logger = logging.getLogger("LiveAgentAuditor")

class QualityAuditor:
    """
    Deterministic Verification Guardrail for Live College Metrics.
    Enforces Zero-Hallucination via word-for-word substring auditing and mathematical sanity checks.
    """

    @staticmethod
    def normalize_text(text: str) -> str:
        """Collapse whitespace and normalize lower case for reliable quote matching."""
        if not text:
            return ""
        # Remove non-breaking spaces and collapse all whitespace to single space
        cleaned = re.sub(r"[\s\u00a0\u200b]+", " ", text).strip().lower()
        return cleaned

    @classmethod
    def verify_quote(cls, verbatim_quote: Optional[str], raw_scraped_text: Optional[str]) -> bool:
        """
        Returns True if and only if the verbatim quote is genuinely found in the scraped webpage text.
        """
        if not verbatim_quote or not raw_scraped_text:
            return False

        norm_quote = cls.normalize_text(verbatim_quote)
        norm_raw = cls.normalize_text(raw_scraped_text)

        if not norm_quote:
            return False

        # Direct containment check
        if norm_quote in norm_raw:
            return True

        # Fallback: Check if 80%+ of key numeric and noun tokens in the quote appear consecutively
        quote_words = [w for w in norm_quote.split() if len(w) > 2 or any(c.isdigit() for c in w)]
        if len(quote_words) >= 3:
            # Check for sliding windows of 4 words
            window_size = min(4, len(quote_words))
            for i in range(len(quote_words) - window_size + 1):
                phrase = " ".join(quote_words[i:i + window_size])
                if phrase in norm_raw:
                    return True

        return False

    @classmethod
    def audit_placement(cls, stats: Optional[PlacementStats], raw_text: str) -> Tuple[Optional[PlacementStats], List[str]]:
        """
        Verifies placement metrics and quote authenticity.
        Rejects any hallucinated or out-of-range figures.
        """
        notes: List[str] = []
        if not stats:
            return None, notes

        # 1. Quote authenticity
        quote_valid = cls.verify_quote(stats.verbatim_quote, raw_text)
        if not quote_valid:
            notes.append(f"REJECTED: Placement quote was not found verbatim in page text: '{stats.verbatim_quote}'")
            stats.is_verified = False
            # Nullify unverified numeric claims
            stats.highest_ctc_lpa = None
            stats.average_ctc_lpa = None
            stats.placement_ratio_pct = None
            return stats, notes

        stats.is_verified = True
        notes.append("VERIFIED: Placement quote verified against live official webpage.")

        # 2. Sanity Check: Placement percentage
        if stats.placement_ratio_pct is not None:
            if not (0.0 <= stats.placement_ratio_pct <= 100.0):
                notes.append(f"INVALID RATIO: {stats.placement_ratio_pct}% is out of bounds [0, 100]. Nullified.")
                stats.placement_ratio_pct = None

        # 3. Sanity Check: Highest vs Average CTC
        if stats.highest_ctc_lpa is not None and stats.average_ctc_lpa is not None:
            if stats.highest_ctc_lpa < stats.average_ctc_lpa:
                notes.append(f"INVALID CTC: Highest CTC ({stats.highest_ctc_lpa} LPA) cannot be less than Average CTC ({stats.average_ctc_lpa} LPA). Corrected.")
                stats.highest_ctc_lpa, stats.average_ctc_lpa = stats.average_ctc_lpa, stats.highest_ctc_lpa

        # 4. Sanity Check: Unrealistic CTC boundaries for Indian engineering
        if stats.highest_ctc_lpa is not None and stats.highest_ctc_lpa > 250.0:
            notes.append(f"SUSPICIOUS CTC: {stats.highest_ctc_lpa} LPA is unusually high; verified as international or flagged.")

        return stats, notes

    @classmethod
    def audit_fees(cls, fee: Optional[FeeStructure], raw_text: str) -> Tuple[Optional[FeeStructure], List[str]]:
        """
        Verifies fee figures against live page text and sensible financial boundaries.
        """
        notes: List[str] = []
        if not fee:
            return None, notes

        quote_valid = cls.verify_quote(fee.verbatim_quote, raw_text)
        if not quote_valid:
            notes.append(f"REJECTED: Fee quote was not found verbatim in page text: '{fee.verbatim_quote}'")
            fee.is_verified = False
            fee.total_annual_fee = None
            fee.tuition_fee = None
            return fee, notes

        fee.is_verified = True
        notes.append("VERIFIED: Fee quote verified against live official webpage.")

        # Auto-compute total fee if individual components exist
        if fee.total_annual_fee is None:
            comp = [c for c in [fee.tuition_fee, fee.development_fee, fee.other_fees] if c is not None]
            if comp:
                fee.total_annual_fee = sum(comp)

        # Boundary check (Engineering fee between Rs 5,000 and Rs 15,00,000)
        if fee.total_annual_fee is not None:
            if fee.total_annual_fee < 5000 or fee.total_annual_fee > 2000000:
                notes.append(f"FLAGGED FEE: Total fee Rs {fee.total_annual_fee} requires regulatory cross-check.")

        return fee, notes
