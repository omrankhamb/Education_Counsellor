import re
import logging
from urllib.parse import urljoin, urlparse
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from .models import DiscoveredLink

logger = logging.getLogger("LiveLinkDiscovery")

# Comprehensive keyword clusters for Indian college websites
KEYWORD_CLUSTERS = {
    "placement": [
        "placement", "tpo", "training & placement", "training and placement",
        "career", "recruitment", "internship", "placement statistics",
        "corporate relations", "placements", "companies visited", "highest package"
    ],
    "fees": [
        "fee structure", "fees", "fee", "tuition fee", "fra", "shikshan shulka",
        "admissions/fee", "college fees", "fee details", "academic fee"
    ],
    "nirf": [
        "nirf", "mandatory disclosure", "naac", "aicte approval", "accreditation",
        "ranking", "nba", "aicte mandatory disclosure"
    ],
    "admissions": [
        "admission", "eligibility", "intake", "courses offered", "seat matrix",
        "cap admission", "programs offered"
    ]
}

class LinkDiscoveryEngine:
    """
    3-Tier Dynamic Link Discovery Engine.
    Discovers the exact dynamic URLs for Placements, Fees, and NIRF on ANY college website.
    """

    @classmethod
    def discover_links_from_html(cls, base_url: str, html_content: str) -> Dict[str, List[DiscoveredLink]]:
        """
        Tier 1: Scans HTML navigation menus, headers, buttons, and footers for target keywords.
        """
        discovered: Dict[str, List[DiscoveredLink]] = {
            "placement": [],
            "fees": [],
            "nirf": [],
            "admissions": []
        }

        if not html_content or not base_url:
            return discovered

        soup = BeautifulSoup(html_content, "html.parser")
        base_domain = urlparse(base_url).netloc.lower()

        # Prioritize header, nav, footer, but fall back to all anchor tags
        nav_anchors = soup.find_all("a", href=True)

        seen_urls = set()

        for a in nav_anchors:
            href = a.get("href", "").strip()
            text = a.get_text(separator=" ", strip=True).lower()
            title = a.get("title", "").lower()
            combined_desc = f"{text} {title} {href.lower()}"

            if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
                continue

            # Resolve relative URLs
            full_url = urljoin(base_url, href)
            parsed_full = urlparse(full_url)

            # Avoid crawling external third party domains (like facebook, twitter, youtube)
            if parsed_full.netloc and base_domain not in parsed_full.netloc.lower() and not parsed_full.netloc.endswith((".ac.in", ".edu.in", ".org")):
                continue

            if full_url in seen_urls:
                continue

            is_pdf = full_url.lower().endswith(".pdf") or "pdf" in href.lower()

            for category, keywords in KEYWORD_CLUSTERS.items():
                for kw in keywords:
                    if kw in combined_desc:
                        link_obj = DiscoveredLink(
                            category=category,
                            url=full_url,
                            link_text=text or kw,
                            is_pdf=is_pdf
                        )
                        discovered[category].append(link_obj)
                        seen_urls.add(full_url)
                        break

        # Sort: prefer PDFs and specific subpages over generic home anchors
        for cat in discovered:
            discovered[cat].sort(key=lambda x: (not x.is_pdf, len(x.link_text)), reverse=False)

        return discovered

    @classmethod
    def generate_candidate_fallback_urls(cls, base_url: str) -> Dict[str, List[str]]:
        """
        Tier 2 Candidate Pattern Generator: Common institutional subpaths used by Indian colleges.
        """
        clean_base = base_url.rstrip("/")
        return {
            "placement": [
                f"{clean_base}/placement",
                f"{clean_base}/placements",
                f"{clean_base}/training-and-placement",
                f"{clean_base}/tpo",
                f"{clean_base}/placement-statistics",
                f"{clean_base}/placement-records"
            ],
            "fees": [
                f"{clean_base}/fee-structure",
                f"{clean_base}/fees",
                f"{clean_base}/admissions/fees",
                f"{clean_base}/admissions/fee-structure"
            ],
            "nirf": [
                f"{clean_base}/nirf",
                f"{clean_base}/mandatory-disclosure",
                f"{clean_base}/naac"
            ]
        }
