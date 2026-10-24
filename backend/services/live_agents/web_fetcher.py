import io
import re
import logging
import asyncio
from typing import Dict, List, Optional, Tuple
import httpx
from bs4 import BeautifulSoup

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

logger = logging.getLogger("LiveWebFetcher")

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache"
}

class WebFetcher:
    """
    High-Speed Asynchronous Web Crawler & PDF Extractor.
    Capable of parsing HTML pages and PDF brochures concurrently.
    """

    def __init__(self, timeout: float = 4.5):
        self.timeout = timeout

    async def fetch_url(self, url: str) -> Tuple[str, str, str]:
        """
        Fetches a URL and extracts clean readable text and returns raw HTML for link discovery.
        Returns: (resolved_url, extracted_text, raw_html)
        """
        try:
            timeout_cfg = httpx.Timeout(self.timeout, connect=2.5, read=3.5)
            async with httpx.AsyncClient(headers=DEFAULT_HEADERS, timeout=timeout_cfg, follow_redirects=True, verify=False) as client:
                resp = await client.get(url)
                if resp.status_code != 200:
                    logger.warning(f"Fetch failed with status {resp.status_code} for {url}")
                    return url, "", ""

                content_type = resp.headers.get("content-type", "").lower()
                final_url = str(resp.url)

                # PDF Handling
                if "application/pdf" in content_type or final_url.lower().endswith(".pdf"):
                    text = self._extract_pdf_text(resp.content)
                    return final_url, text, ""

                # HTML Handling
                raw_html = resp.text
                text = self._extract_html_text(raw_html)
                return final_url, text, raw_html

        except Exception as e:
            logger.warning(f"Error fetching {url}: {e}")
            return url, "", ""

    def _extract_pdf_text(self, pdf_bytes: bytes) -> str:
        """Extract text from the first 5 pages of a PDF document."""
        if not PdfReader:
            return "PDF support not installed."

        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            text_chunks = []
            max_pages = min(5, len(reader.pages))
            for i in range(max_pages):
                page_text = reader.pages[i].extract_text() or ""
                if page_text.strip():
                    text_chunks.append(f"--- [PDF Page {i+1}] ---\n{page_text}")
            return "\n\n".join(text_chunks)
        except Exception as e:
            logger.warning(f"Failed to parse PDF bytes: {e}")
            return ""

    def _extract_html_text(self, html: str) -> str:
        """Cleans HTML and converts tables into markdown format for LLM reading."""
        soup = BeautifulSoup(html, "html.parser")

        # Remove irrelevant elements
        for tag in soup(["script", "style", "noscript", "iframe", "svg", "header", "footer"]):
            tag.decompose()

        # Format tables cleanly
        for table in soup.find_all("table"):
            rows = []
            for tr in table.find_all("tr"):
                cells = [td.get_text(separator=" ", strip=True) for td in tr.find_all(["td", "th"])]
                if any(cells):
                    rows.append(" | ".join(cells))
            if rows:
                table_text = "\n[TABLE START]\n" + "\n".join(rows) + "\n[TABLE END]\n"
                table.replace_with(table_text)

        # Extract text and collapse excessive whitespace
        raw_text = soup.get_text(separator="\n", strip=True)
        # Collapse multiple blank lines
        clean_text = re.sub(r"\n\s*\n+", "\n\n", raw_text)
        # Truncate to reasonable token limit (~25,000 characters)
        return clean_text[:25000]

    async def fetch_parallel(self, urls: List[str]) -> Dict[str, str]:
        """Fetches multiple candidate URLs concurrently in ~1-2 seconds."""
        tasks = [self.fetch_url(url) for url in urls if url]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        content_map: Dict[str, str] = {}
        for res in results:
            if isinstance(res, tuple) and len(res) >= 2:
                url = res[0]
                text = res[1]
                if text.strip():
                    content_map[url] = text
        return content_map
