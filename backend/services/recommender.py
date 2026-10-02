import json
import re
import asyncio
from google import genai
from google.genai import types
from config import GEMINI_API_KEY, GEMINI_MODEL, FALLBACK_MODELS
from models import StudentProfile

client = genai.Client(api_key=GEMINI_API_KEY)

# Curated campus photography mapped by keywords
CAMPUS_IMAGE_MAP = [
    (r"coep", "https://images.unsplash.com/photo-1562774053-701939374585?w=700&auto=format&fit=crop&q=80"),
    (r"vjti", "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=700&auto=format&fit=crop&q=80"),
    (r"iit", "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=700&auto=format&fit=crop&q=80"),
    (r"nit", "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=700&auto=format&fit=crop&q=80"),
    (r"pict", "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=700&auto=format&fit=crop&q=80"),
    (r"mit|vit", "https://images.unsplash.com/photo-1525921429624-479b6a26d84d?w=700&auto=format&fit=crop&q=80"),
    (r"spit|somaiya", "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=700&auto=format&fit=crop&q=80"),
    (r"aiims|grant|seth|topiwala|medical", "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=700&auto=format&fit=crop&q=80"),
    (r"srcc|xavier|hindu|commerce|bmcc", "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=700&auto=format&fit=crop&q=80"),
    (r"fergusson|ruia|science|iiser", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=700&auto=format&fit=crop&q=80"),
    (r"law|nlu|nalsar|glc|ils", "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=700&auto=format&fit=crop&q=80"),
    (r"design|nid|nift", "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=700&auto=format&fit=crop&q=80")
]

STREAM_DEFAULT_IMAGES = {
    "Engineering": "https://images.unsplash.com/photo-1562774053-701939374585?w=700&auto=format&fit=crop&q=80",
    "Medical": "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=700&auto=format&fit=crop&q=80",
    "Science": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=700&auto=format&fit=crop&q=80",
    "Commerce": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=700&auto=format&fit=crop&q=80",
    "Arts": "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=700&auto=format&fit=crop&q=80",
    "Law": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=700&auto=format&fit=crop&q=80",
    "Design": "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=700&auto=format&fit=crop&q=80"
}


def get_college_image(name: str, stream: str = "Engineering") -> str:
    name_lower = name.lower()
    for pattern, url in CAMPUS_IMAGE_MAP:
        if re.search(pattern, name_lower):
            return url
    return STREAM_DEFAULT_IMAGES.get(stream, STREAM_DEFAULT_IMAGES["Engineering"])


COLLEGE_PROMPT = """You are an Indian college admission system. Recommend 8 to 10 real Indian colleges suitable for this student.

Student Details:
- Name: {name}
- Stream: {stream}
- Marks/Percentage/Percentile: {marks}%
- Exam: {exam_type}
- Preferred State: {preferred_state}
- Budget: {budget}
- College Type: {college_type}

Output MUST be a JSON array of objects with these keys:
- college_name: Official college name
- location: City and State
- stream: {stream}
- branch: Relevant branch or course name
- college_type: "Government" or "Private"
- cutoff_marks: A realistic percentage or percentile cutoff number
- annual_fees: Estimated annual fee in INR as an integer (e.g. 120000)
- rating: Number between 3.5 and 4.9
- nirf_rank: Text description of rank or accreditation (e.g. "NIRF Top 100", "NAAC A+", "State Ranked")
- placement_avg: Text summary (e.g. "₹8.5 LPA" or research stipend)
- placement_high: Text summary (e.g. "₹24.0 LPA")
- established: Year founded (e.g. 1960)
- facilities: An array of 3-4 key tags (e.g. ["Central Library", "Research Labs", "Hostels", "Sports Ground"])
- why_recommended: One concise sentence explaining why it fits this student's score and stream

Return ONLY the JSON array.
"""


def parse_number(val, default=80.0) -> float:
    if isinstance(val, (int, float)):
        return float(val)
    if not val:
        return default
    m = re.search(r"(\d+(\.\d+)?)", str(val).replace(",", ""))
    if m:
        try:
            return float(m.group(1))
        except:
            pass
    return default


def parse_fees(val, default=150000) -> int:
    if isinstance(val, (int, float)):
        return int(val)
    if not val:
        return default
    s = str(val).replace(",", "").replace("₹", "").replace("INR", "").strip()
    m = re.search(r"(\d+(\.\d+)?)", s)
    if m:
        try:
            num = float(m.group(1))
            if "lakh" in str(val).lower() or (num < 100 and "l" in str(val).lower()):
                return int(num * 100000)
            return int(num)
        except:
            pass
    return default


def get_eligibility_status(student_marks: float, cutoff: float) -> dict:
    diff = student_marks - cutoff
    if diff >= 2:
        return {"status": "eligible", "label": "✅ Eligible", "color": "success"}
    elif diff >= -6:
        return {"status": "borderline", "label": "⚠️ Borderline", "color": "warning"}
    else:
        return {"status": "not_eligible", "label": "❌ Aspirational", "color": "danger"}


def get_career_opportunities(stream: str) -> list:
    careers = {
        "Engineering": [
            "Software Development Engineer (SDE)",
            "AI / Machine Learning Engineer",
            "Data Scientist & Cloud Architect",
            "Full Stack Developer",
            "Cybersecurity & DevOps Specialist"
        ],
        "Medical": [
            "MBBS Doctor / Resident Physician",
            "Specialist Surgeon",
            "Clinical & Genetic Researcher",
            "Public Health Officer",
            "Dentist (BDS) & Orthodontist"
        ],
        "Science": [
            "Research Scientist (CSIR / DRDO)",
            "Data Scientist & Quantitative Analyst",
            "Biotechnologist & Bioinformatician",
            "Pharmaceutical R&D Chemist",
            "Astrophysicist / Space Scientist",
            "Environmental & Geoscientist"
        ],
        "Commerce": [
            "Chartered Accountant (CA)",
            "Investment Banking Analyst",
            "Corporate Financial Advisor",
            "Management Consultant (MBA)",
            "Fintech Product Manager"
        ],
        "Arts": [
            "Civil Services (UPSC IAS/IPS/IFS)",
            "Public Policy Analyst",
            "Journalist & Media Editor",
            "Corporate Communications Specialist",
            "Professor & Research Scholar"
        ],
        "Law": [
            "Corporate Advocate",
            "Litigation Lawyer (High Court / Supreme Court)",
            "Legal Advisor / In-House Counsel",
            "Judicial Magistrate"
        ],
        "Design": [
            "UI / UX Product Designer",
            "Industrial & Automotive Designer",
            "Fashion & Textile Stylist",
            "Visual Identity Lead"
        ],
    }
    return careers.get(stream, ["Professional Specialist", "Researcher", "Consultant", "Entrepreneur"])


# Curated catalog covering EVERY stream so no student ever gets 0 colleges
FALLBACK_COLLEGE_CATALOG = {
    "Science": [
        {
            "college_name": "Indian Institute of Science (IISc)",
            "location": "Bengaluru, Karnataka",
            "stream": "Science",
            "branch": "B.Sc (Research) / Pure Sciences",
            "college_type": "Government",
            "cutoff_marks": 98.0,
            "annual_fees": 35000,
            "rating": 4.9,
            "nirf_rank": "NIRF Rank #1 (University)",
            "placement_avg": "₹22.5 LPA / Direct PhD",
            "placement_high": "₹60.0 LPA",
            "established": 1909,
            "facilities": ["Supercomputing Facility", "Cryo-EM Lab", "Centenary Library"],
            "why_recommended": "India's highest ranked premier science research institute."
        },
        {
            "college_name": "Fergusson College",
            "location": "Pune, Maharashtra",
            "stream": "Science",
            "branch": "B.Sc Computer Science / Biotechnology",
            "college_type": "Government",
            "cutoff_marks": 92.0,
            "annual_fees": 45000,
            "rating": 4.7,
            "nirf_rank": "Heritage NAAC A++",
            "placement_avg": "₹6.8 LPA",
            "placement_high": "₹16.0 LPA",
            "established": 1885,
            "facilities": ["Amphitheatre", "Botanical Garden", "Advanced IT Labs"],
            "why_recommended": "Prestigious autonomous institution in Pune with illustrious alumni and top placements."
        },
        {
            "college_name": "St. Xavier's College",
            "location": "Mumbai, Maharashtra",
            "stream": "Science",
            "branch": "B.Sc Physics / Microbiology / IT",
            "college_type": "Private",
            "cutoff_marks": 94.0,
            "annual_fees": 38000,
            "rating": 4.8,
            "nirf_rank": "NIRF Top 10",
            "placement_avg": "₹8.0 LPA",
            "placement_high": "₹22.0 LPA",
            "established": 1869,
            "facilities": ["Caius Research Lab", "Historic Campus", "Digital Library"],
            "why_recommended": "Iconic autonomous college in South Mumbai known for high academic prestige."
        },
        {
            "college_name": "IISER Pune",
            "location": "Pune, Maharashtra",
            "stream": "Science",
            "branch": "BS-MS Dual Degree (Sciences)",
            "college_type": "Government",
            "cutoff_marks": 95.0,
            "annual_fees": 70000,
            "rating": 4.9,
            "nirf_rank": "Institute of National Importance",
            "placement_avg": "₹14.0 LPA / Global PhDs",
            "placement_high": "₹35.0 LPA",
            "established": 2006,
            "facilities": ["Clean Rooms", "NMR Facility", "Modern Hostels"],
            "why_recommended": "World-class autonomous basic science research institute with funded fellowships."
        },
        {
            "college_name": "Ramnarain Ruia Autonomous College",
            "location": "Matunga, Mumbai",
            "stream": "Science",
            "branch": "B.Sc Analytical Chemistry / Bioanalytical",
            "college_type": "Government",
            "cutoff_marks": 88.0,
            "annual_fees": 30000,
            "rating": 4.5,
            "nirf_rank": "NAAC A+ (CGPA 3.70)",
            "placement_avg": "₹5.5 LPA",
            "placement_high": "₹12.0 LPA",
            "established": 1937,
            "facilities": ["Instrumentation Center", "Eco-friendly Campus", "Auditorium"],
            "why_recommended": "Leading Mumbai science college with strong industry-academia collaborations."
        },
        {
            "college_name": "Modern College of Arts, Science and Commerce",
            "location": "Shivajinagar, Pune",
            "stream": "Science",
            "branch": "B.Sc Computer Science / Data Science",
            "college_type": "Government",
            "cutoff_marks": 82.0,
            "annual_fees": 35000,
            "rating": 4.3,
            "nirf_rank": "Autonomous NAAC A+",
            "placement_avg": "₹5.0 LPA",
            "placement_high": "₹11.0 LPA",
            "established": 1970,
            "facilities": ["Software Testing Lab", "Language Lab", "Central Library"],
            "why_recommended": "High placement conversion in IT and biotechnology firms in Pune."
        }
    ],
    "Engineering": [
        {
            "college_name": "COEP Technological University",
            "location": "Pune, Maharashtra",
            "stream": "Engineering",
            "branch": "Computer Engineering / IT",
            "college_type": "Government",
            "cutoff_marks": 94,
            "annual_fees": 90000,
            "rating": 4.8,
            "nirf_rank": "State Rank #1",
            "placement_avg": "₹11.5 LPA",
            "placement_high": "₹50.5 LPA",
            "established": 1854,
            "facilities": ["Boat Club", "AI Research Lab", "High-Tech Campus", "Central Library"],
            "why_recommended": "Historic government engineering pioneer in Maharashtra with top-tier recruitment."
        },
        {
            "college_name": "Veermata Jijabai Technological Institute (VJTI)",
            "location": "Mumbai, Maharashtra",
            "stream": "Engineering",
            "branch": "Electronics and Telecommunication",
            "college_type": "Government",
            "cutoff_marks": 95,
            "annual_fees": 85000,
            "rating": 4.7,
            "nirf_rank": "NIRF Top 100",
            "placement_avg": "₹12.8 LPA",
            "placement_high": "₹62.0 LPA",
            "established": 1887,
            "facilities": ["Incubation Center", "Hostels", "Robotics Lab", "Wi-Fi Campus"],
            "why_recommended": "Elite technical institute in the heart of Mumbai with corporate recruitment."
        },
        {
            "college_name": "Sardar Patel Institute of Technology (SPIT)",
            "location": "Mumbai, Maharashtra",
            "stream": "Engineering",
            "branch": "Computer Science & Engineering",
            "college_type": "Private",
            "cutoff_marks": 93,
            "annual_fees": 170000,
            "rating": 4.6,
            "nirf_rank": "NIRF Top 150",
            "placement_avg": "₹14.2 LPA",
            "placement_high": "₹42.0 LPA",
            "established": 2005,
            "facilities": ["Fintech Lab", "Maker Space", "Auditorium", "Smart Classrooms"],
            "why_recommended": "Exceptional coding culture with high placement averages."
        },
        {
            "college_name": "Pune Institute of Computer Technology (PICT)",
            "location": "Pune, Maharashtra",
            "stream": "Engineering",
            "branch": "Computer Engineering",
            "college_type": "Private",
            "cutoff_marks": 92,
            "annual_fees": 110000,
            "rating": 4.6,
            "nirf_rank": "State Renowned",
            "placement_avg": "₹12.0 LPA",
            "placement_high": "₹45.0 LPA",
            "established": 1983,
            "facilities": ["Supercomputer Lab", "Coding Arena", "Placement Center"],
            "why_recommended": "Premier software coding powerhouse of Pune."
        }
    ],
    "Medical": [
        {
            "college_name": "Grant Government Medical College",
            "location": "Mumbai, Maharashtra",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 94,
            "annual_fees": 125000,
            "rating": 4.8,
            "nirf_rank": "NIRF Top 20",
            "placement_avg": "Sir JJ Hospital (3000 Beds)",
            "placement_high": "Top PG Matches",
            "established": 1845,
            "facilities": ["Trauma Center", "Historic Library", "Pathology Museum"],
            "why_recommended": "Premier medical college with unmatched clinical caseload."
        },
        {
            "college_name": "Seth G.S. Medical College & KEM Hospital",
            "location": "Parel, Mumbai",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 96,
            "annual_fees": 130000,
            "rating": 4.9,
            "nirf_rank": "State Rank #1",
            "placement_avg": "KEM Hospital (1800 Beds)",
            "placement_high": "98% PG Selection",
            "established": 1926,
            "facilities": ["ICU Simulation", "Organ Transplant Unit", "Research Hub"],
            "why_recommended": "Most revered medical institute in western India with world-class faculty."
        }
    ],
    "Commerce": [
        {
            "college_name": "Shri Ram College of Commerce (SRCC)",
            "location": "Delhi, Delhi",
            "stream": "Commerce",
            "branch": "B.Com (Hons)",
            "college_type": "Government",
            "cutoff_marks": 98,
            "annual_fees": 30000,
            "rating": 4.9,
            "nirf_rank": "NIRF #1 (Commerce)",
            "placement_avg": "₹10.5 LPA",
            "placement_high": "₹35.0 LPA",
            "established": 1926,
            "facilities": ["Finance Lab", "Auditorium", "Digital Resource Center"],
            "why_recommended": "Pinnacle commerce institution in India with stellar consulting placements."
        },
        {
            "college_name": "Brihan Maharashtra College of Commerce (BMCC)",
            "location": "Pune, Maharashtra",
            "stream": "Commerce",
            "branch": "B.Com / BBA",
            "college_type": "Government",
            "cutoff_marks": 88,
            "annual_fees": 25000,
            "rating": 4.6,
            "nirf_rank": "Autonomous NAAC A+",
            "placement_avg": "₹6.0 LPA",
            "placement_high": "₹15.0 LPA",
            "established": 1943,
            "facilities": ["Commerce Lab", "Incubation Center", "Sports Ground"],
            "why_recommended": "Premier commerce college in Pune known for CA coaching synergy."
        }
    ]
}


def get_featured_colleges(stream: str = "All") -> list:
    """Return featured colleges for the landing page."""
    colleges = []
    if stream == "All":
        for s in ["Science", "Engineering", "Medical", "Commerce"]:
            colleges.extend(FALLBACK_COLLEGE_CATALOG.get(s, []))
    else:
        colleges = FALLBACK_COLLEGE_CATALOG.get(stream, FALLBACK_COLLEGE_CATALOG["Engineering"])

    results = []
    for c in colleges[:9]:
        img = get_college_image(c["college_name"], c["stream"])
        results.append({
            **c,
            "image_url": img,
            "eligibility": {"status": "eligible", "label": "Featured", "color": "primary"},
            "student_marks": 90.0
        })
    return results


async def get_live_college_recommendations(profile: StudentProfile) -> list:
    """
    Fetch LIVE AI recommendations using Gemini API with tight timeout and stream fallback.
    """
    prompt = COLLEGE_PROMPT.format(
        name=profile.name,
        stream=profile.stream,
        marks=profile.marks,
        exam_type=profile.exam_type,
        preferred_state=profile.preferred_state if profile.preferred_state != "Any" else "India",
        budget=profile.budget if profile.budget != "Any" else "Flexible",
        college_type=profile.college_type if profile.college_type != "Any" else "Both Government & Private",
    )

    models_to_try = [GEMINI_MODEL] + [m for m in FALLBACK_MODELS if m != GEMINI_MODEL]

    for model_name in models_to_try:
        try:
            # Run model generation in thread pool with strict 4.5s timeout
            loop = asyncio.get_event_loop()
            resp = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=0.3,
                            response_mime_type="application/json"
                        )
                    )
                ),
                timeout=4.5
            )

            raw_text = resp.text or ""
            if not raw_text and resp.candidates:
                for part in resp.candidates[0].content.parts:
                    if hasattr(part, "text") and part.text:
                        raw_text = part.text
                        break

            if not raw_text:
                continue

            raw_text = raw_text.strip()
            raw_text = re.sub(r"```json\s*", "", raw_text)
            raw_text = re.sub(r"```\s*", "", raw_text)

            match = re.search(r"\[.*\]", raw_text, re.DOTALL)
            json_str = match.group() if match else raw_text
            colleges_data = json.loads(json_str)

            if isinstance(colleges_data, list) and len(colleges_data) > 0:
                results = []
                for c in colleges_data:
                    cname = str(c.get("college_name", "College"))
                    cutoff = parse_number(c.get("cutoff_marks"), 75.0)
                    fees = parse_fees(c.get("annual_fees"), 100000)
                    rating = parse_number(c.get("rating"), 4.3)
                    eligibility = get_eligibility_status(profile.marks, cutoff)
                    image_url = get_college_image(cname, profile.stream)

                    results.append({
                        "college_name": cname,
                        "location": str(c.get("location", "India")),
                        "stream": str(c.get("stream", profile.stream)),
                        "branch": str(c.get("branch", "Relevant Program")),
                        "college_type": str(c.get("college_type", "Government")),
                        "cutoff_marks": round(cutoff, 1),
                        "annual_fees": fees,
                        "rating": min(5.0, max(3.5, round(rating, 1))),
                        "image_url": image_url,
                        "nirf_rank": str(c.get("nirf_rank", "Recognized")),
                        "placement_avg": str(c.get("placement_avg", "High Placement Rate")),
                        "placement_high": str(c.get("placement_high", "Excellent Career Prospects")),
                        "established": c.get("established", 1990),
                        "facilities": c.get("facilities", ["Modern Labs", "Library", "Hostels", "Sports"]),
                        "why_recommended": str(c.get("why_recommended", "Recommended based on your academic profile.")),
                        "eligibility": eligibility,
                        "student_marks": profile.marks,
                    })
                return results
        except Exception as e:
            print(f"Warning: Model {model_name} failed: {e}")
            continue

    # Fallback to curated catalog
    print(f"Using curated catalog fallback for stream: {profile.stream}...")
    stream_catalog = FALLBACK_COLLEGE_CATALOG.get(profile.stream, FALLBACK_COLLEGE_CATALOG.get("Science", FALLBACK_COLLEGE_CATALOG["Engineering"]))
    fallback_results = []
    for item in stream_catalog:
        eligibility = get_eligibility_status(profile.marks, item["cutoff_marks"])
        img = get_college_image(item["college_name"], item["stream"])
        fallback_results.append({
            **item,
            "image_url": img,
            "eligibility": eligibility,
            "student_marks": profile.marks
        })
    return fallback_results
