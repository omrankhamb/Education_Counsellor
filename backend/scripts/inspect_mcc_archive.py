import httpx
from bs4 import BeautifulSoup

url = "https://mcc.nic.in/archive-ug/"
response = httpx.get(url, timeout=30)
response.raise_for_status()
soup = BeautifulSoup(response.text, "html.parser")
for anchor in soup.select("a"):
    title = " ".join(anchor.get_text(" ", strip=True).split())
    if any(word in title.lower() for word in ("final result", "final allotment")):
        if any(str(year) in title for year in range(2022, 2027)):
            print(title, "|", anchor.get("href"))
