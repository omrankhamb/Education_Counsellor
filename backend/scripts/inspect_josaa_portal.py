from __future__ import annotations

import httpx
from bs4 import BeautifulSoup

URL = "https://josaa.admissions.nic.in/applicant/seatmatrix/OpeningClosingRankArchieve.aspx"
BUTTON = "ctl00$ContentPlaceHolder1$btnSubmit"
NAMES = [
    "ctl00$ContentPlaceHolder1$ddlYear",
    "ctl00$ContentPlaceHolder1$ddlroundno",
    "ctl00$ContentPlaceHolder1$ddlInstype",
    "ctl00$ContentPlaceHolder1$ddlInstitute",
    "ctl00$ContentPlaceHolder1$ddlBranch",
    "ctl00$ContentPlaceHolder1$ddlSeatType",
]


def soup_of(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "html.parser")


def form_values(soup: BeautifulSoup) -> dict[str, str]:
    values = {}
    for node in soup.select("input[name]"):
        if node.get("type") in {"hidden", "submit"}:
            values[node["name"]] = node.get("value", "")
    for node in soup.select("select[name]"):
        selected = node.select_one("option[selected]")
        if selected:
            values[node["name"]] = selected.get("value", "")
    return values


def post(client: httpx.Client, current: BeautifulSoup, **selected: str) -> BeautifulSoup:
    data = form_values(current)
    data[BUTTON] = "Submit"
    data.update({f"ctl00$ContentPlaceHolder1${name}": value for name, value in selected.items()})
    response = client.post(URL, data=data, headers={"Referer": URL})
    response.raise_for_status()
    return soup_of(response.text)


def dump(soup: BeautifulSoup) -> None:
    for name in NAMES:
        node = soup.find("select", {"name": name})
        options = [(o.get("value"), o.get_text(" ", strip=True)) for o in node.select("option")] if node else []
        print("SELECT", name.rsplit("$", 1)[-1], "ONCHANGE", node.get("onchange") if node else None, "OPTIONS", options[:12])
    tables = soup.select("table")
    print("TABLES", [(t.get("id"), len(t.select("tr"))) for t in tables])
    print("GRID", bool(soup.find(id="GridView1")))
    print("DATA_NODES", [(n.get("id"), n.get_text(" ", strip=True)[:120]) for n in soup.select("[id*=lbl], [id*=Grid], [id*=Error], [id*=Msg]") if n.get_text(" ", strip=True)][:20])


with httpx.Client(timeout=45, follow_redirects=True) as client:
    response = client.get(URL)
    response.raise_for_status()
    page = soup_of(response.text)
    print("INITIAL")
    dump(page)
    page = post(client, page, ddlYear="2022")
    print("AFTER YEAR 2022")
    dump(page)
    page = post(client, page, ddlYear="2022", ddlroundno="6")
    print("AFTER ROUND 6")
    dump(page)
    page = post(client, page, ddlYear="2022", ddlroundno="6", ddlInstype="ALL")
    print("AFTER TYPE ALL")
    dump(page)
    page = post(client, page, ddlYear="2022", ddlroundno="6", ddlInstype="ALL", ddlInstitute="ALL")
    print("AFTER INSTITUTE ALL")
    dump(page)
    page = post(client, page, ddlYear="2022", ddlroundno="6", ddlInstype="ALL", ddlInstitute="ALL", ddlBranch="ALL")
    print("AFTER BRANCH ALL")
    dump(page)
    page = post(client, page, ddlYear="2022", ddlroundno="6", ddlInstype="ALL", ddlInstitute="ALL", ddlBranch="ALL", ddlSeatType="ALL")
    print("AFTER SEAT TYPE ALL")
    dump(page)
    print("RESULT_TEXT", page.get_text(" ", strip=True)[-1000:])
    grid = page.select_one("table[id$='GridView1']")
    print("SAMPLE_ROWS", [str(row)[:3000] for row in grid.select("tr")[:3]] if grid else [])
    page = post(client, page, ddlYear="2022", ddlroundno="5", ddlInstype="ALL", ddlInstitute="ALL", ddlBranch="ALL", ddlSeatType="ALL")
    grid = page.select_one("table[id$='GridView1']")
    print("DIRECT_NEXT_ROUND", bool(grid), len(grid.select("tr")) if grid else 0, page.get_text(" ", strip=True)[-300:])
    print("DIRECT_NEXT_FILTERS", [(n.get("name"), len(n.select("option")), [o.get("value") for o in n.select("option")[:5]]) for n in page.select("select")])
    page = post(client, page, ddlYear="2022", ddlroundno="5", ddlInstype="ALL")
    page = post(client, page, ddlYear="2022", ddlroundno="5", ddlInstype="ALL", ddlInstitute="ALL")
    page = post(client, page, ddlYear="2022", ddlroundno="5", ddlInstype="ALL", ddlInstitute="ALL", ddlBranch="ALL")
    page = post(client, page, ddlYear="2022", ddlroundno="5", ddlInstype="ALL", ddlInstitute="ALL", ddlBranch="ALL", ddlSeatType="ALL")
    grid = page.select_one("table[id$='GridView1']")
    print("RECASCADE_NEXT_ROUND", bool(grid), len(grid.select("tr")) if grid else 0, page.get_text(" ", strip=True)[-300:])
