import json
import re
import asyncio
from typing import List, Dict, Any, Optional
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
    (r"aiims|grant|seth|topiwala|medical|kem|afmc|bjmc", "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=700&auto=format&fit=crop&q=80"),
    (r"srcc|xavier|hindu|commerce|bmcc|hansraj|podar", "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=700&auto=format&fit=crop&q=80"),
    (r"fergusson|ruia|science|iiser|iisc", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=700&auto=format&fit=crop&q=80"),
    (r"law|nlu|nalsar|glc|ils|nlsiu", "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=700&auto=format&fit=crop&q=80"),
    (r"design|nid|nift|srishti|idc|pearl", "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=700&auto=format&fit=crop&q=80")
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


# Dynamic prompt builder based directly on student's Edit Profile (No static prompt)


def get_exam_score_info(exam_type: str, score_unit: str = "") -> dict:
    exam_lower = (exam_type or "").lower()
    unit = (score_unit or "").lower()

    if unit == "rank" or "advanced" in exam_lower or "air" in exam_lower or "clat" in exam_lower:
        return {
            "unit": "rank",
            "display": "AIR",
            "instruction": "Provide cutoff as All India Rank (AIR, e.g. 4500). Lower rank number is better.",
            "is_rank": True
        }
    elif unit == "marks_720" or "neet" in exam_lower:
        return {
            "unit": "marks_720",
            "display": "/720",
            "instruction": "Provide cutoff as Total Marks out of 720 (e.g. 615).",
            "is_rank": False
        }
    elif unit == "percentile" or "cet" in exam_lower or "main" in exam_lower or "cat" in exam_lower or "nid" in exam_lower or "uceed" in exam_lower:
        return {
            "unit": "percentile",
            "display": "%ile",
            "instruction": "Provide cutoff as Percentile (0 to 100, e.g. 96.5).",
            "is_rank": False
        }
    else:
        return {
            "unit": "percentage",
            "display": "%",
            "instruction": "Provide cutoff as Percentage (0 to 100, e.g. 88.5).",
            "is_rank": False
        }


def format_score_text(marks: float, exam_type: str = "", score_unit: str = "") -> str:
    info = get_exam_score_info(exam_type, score_unit)
    if info["unit"] == "rank":
        return f"AIR {int(marks):,}"
    elif info["unit"] == "marks_720":
        return f"{int(marks)}/720 Marks"
    elif info["unit"] == "percentile":
        return f"{marks:.2f} %ile"
    else:
        return f"{marks:.2f}%"


def generate_prompt_from_edit_profile(profile) -> str:
    score_info = get_exam_score_info(profile.exam_type, getattr(profile, "score_unit", ""))
    formatted_score = format_score_text(profile.marks, profile.exam_type, getattr(profile, "score_unit", ""))
    exam_lower = (profile.exam_type or "").lower()
    pref_state = profile.preferred_state if profile.preferred_state and profile.preferred_state != "Any" else ("Maharashtra" if "cet" in exam_lower else "India")
    budget = profile.budget if profile.budget and profile.budget != "Any" else "Flexible"
    ctype = profile.college_type if profile.college_type and profile.college_type != "Any" else "Government & Private"
    category = getattr(profile, "category", "General") or "General"
    age = getattr(profile, "age", 18) or 18

    # Specific exam directive derived directly from student's Edit Profile:
    if "advanced" in exam_lower:
        exam_directive = """CRITICAL EXAM RULES (JEE ADVANCED):
- The student appeared for JEE Advanced.
- They can take admission ONLY in Indian Institutes of Technology (IITs).
- Return EXCLUSIVELY 20 Indian Institutes of Technology (IIT Bombay, IIT Delhi, IIT Madras, IIT Kanpur, IIT Kharagpur, IIT Roorkee, IIT Guwahati, IIT Hyderabad, IIT BHU, IIT Indore, etc.) with All India Rank (AIR) cutoffs.
- DO NOT return non-IIT colleges or private colleges."""
    elif "main" in exam_lower:
        exam_directive = """CRITICAL EXAM RULES (JEE MAIN):
- The student appeared for JEE Main (NTA).
- Eligible Colleges: National Institutes of Technology (NIT Trichy, VNIT Nagpur, NIT Surathkal), IIITs (IIIT Hyderabad, IIIT Bangalore, IIIT Delhi, IIIT Pune), and premier State Institutions admitting via JEE Main All India Quota (such as COEP Technological University Pune All India seats, VJTI Mumbai All India seats, DTU Delhi, NSUT Delhi, Thapar).
- CRITICAL: CANDIDATES CANNOT TAKE ADMISSION IN IIT COLLEGES WITH JEE MAIN! IIT admissions strictly require JEE Advanced.
- Under NO circumstances recommend IIT Bombay or any IIT college! Recommend colleges accepting JEE Main (COEP, NITs, IIITs, DTU)."""
    elif "cet" in exam_lower:
        exam_directive = """CRITICAL EXAM RULES (MHT-CET):
- The student appeared for MHT-CET (Maharashtra State CET).
- Eligible Colleges: EXCLUSIVELY Maharashtra State CET Cell CAP round engineering colleges (such as COEP Technological University Pune, VJTI Mumbai, SPIT Mumbai, PICT Pune, Walchand Sangli, PCCOE Pune, VIT Pune, D.J. Sanghvi Mumbai, TSEC Mumbai, Cummins Pune, GCE Karad, GCOEN Nagpur, etc.).
- CRITICAL: MHT-CET scores CANNOT grant admission to IITs (like IIT Bombay) or NITs!
- Under NO circumstances recommend IIT Bombay or any IIT or NIT! Recommend EXCLUSIVELY Maharashtra CAP colleges accepting MHT-CET."""
    elif "neet" in exam_lower or profile.stream.lower() == "medical":
        exam_directive = """CRITICAL EXAM RULES (NEET UG):
- The student appeared for NEET UG (Medical).
- Eligible Colleges: EXCLUSIVELY Medical & Dental colleges (MBBS/BDS) such as AIIMS (AIIMS New Delhi, AIIMS Nagpur, AIIMS Bhopal, AIIMS Rishikesh, AIIMS Jodhpur), JIPMER, Armed Forces Medical College (AFMC Pune), Seth GS Medical College (KEM Hospital) Mumbai, Grant Medical College Mumbai, BJMC Pune, MAMC Delhi, and government medical colleges.
- CRITICAL: Recommend ONLY Medical/Dental colleges. DO NOT recommend engineering or non-medical colleges! Cutoffs must be out of 720 marks."""
    else:
        exam_directive = f"""CRITICAL EXAM RULES:
- Recommend 20 accredited colleges in {profile.stream} accepting {profile.exam_type} in {pref_state}."""

    return f"""You are an Indian college admission counselor specializing in Academic Years 2025 and 2026 admissions.
Evaluate this student's exact Admission Profile from Edit Profile and recommend exactly 20 real accredited colleges:

STUDENT ADMISSION PROFILE (FROM EDIT PROFILE):
- Name: {profile.name}
- Age: {age}
- Target Stream: {profile.stream}
- Qualifying Entrance Exam: {profile.exam_type}
- Candidate Score: {formatted_score} ({score_info['display']})
- Preferred State / Location: {pref_state}
- Budget: {budget}
- Preferred College Type: {ctype}
- Category: {category}
- Target Academic Years: 2025 and 2026

{exam_directive}

REQUIREMENTS:
1. Provide a list of at least 20 real accredited Indian colleges matching this student's exact exam, location, and stream.
2. Cutoff marks must be in student's score unit ({score_info['display']}) for Academic Years 2025/2026.
3. DO NOT hallucinate: every college must genuinely admit students through {profile.exam_type}.

Output MUST be a JSON array of at least 20 objects with these exact keys:
- college_name: Official accredited institution name
- location: City and State (e.g. "Shivajinagar, Pune" or "Matunga, Mumbai")
- stream: {profile.stream}
- branch: Degree or specialization in {profile.stream}
- college_type: "Government" or "Private"
- cutoff_marks: Realistic verified 2025/2026 cutoff benchmark in student's score unit ({score_info['display']})
- annual_fees: Estimated annual fee in INR as an integer (e.g. 90000)
- rating: Number between 3.5 and 4.9
- nirf_rank: NIRF rank or state accreditation tier (e.g. "State Rank #1", "NIRF Top 50", "NAAC A++")
- placement_avg: Text summary (e.g. "₹11.5 LPA")
- placement_high: Text summary (e.g. "₹50.5 LPA")
- established: Year founded (e.g. 1854)
- facilities: Array of 3-4 key campus highlights (e.g. ["AI Research Lab", "Central Library", "Hostels", "Incubation Center"])
- why_recommended: One crisp sentence explaining why this college matches the student's exact score in {profile.exam_type} for 2025/2026 admissions.

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


def is_iit_college(name: str) -> bool:
    """Return True only if this is genuinely an Indian Institute of Technology (IIT)."""
    name_l = name.lower()
    if "indian institute of information technology" in name_l or "iiit" in name_l or "viit" in name_l or "kiit" in name_l:
        return False
    if "indian institute of technology" in name_l:
        return True
    return bool(re.search(r"\biit\b", name_l))


def is_nit_college(name: str) -> bool:
    """Return True if this is a National Institute of Technology (NIT)."""
    name_l = name.lower()
    if "national institute of technology" in name_l:
        return True
    return bool(re.search(r"\b(nit|vnit|svnit|mnit|manit)\b", name_l))


def get_eligibility_status(student_marks: float, cutoff: float, exam_type: str = "", score_unit: str = "") -> dict:
    info = get_exam_score_info(exam_type, score_unit)

    if info["unit"] == "rank":
        # Lower rank is better (e.g. rank 3000 <= cutoff 5000 is eligible!)
        if student_marks <= cutoff:
            return {"status": "eligible", "label": "✅ Eligible", "color": "success"}
        elif student_marks <= cutoff * 1.20:
            return {"status": "borderline", "label": "⚠️ Borderline", "color": "warning"}
        else:
            return {"status": "not_eligible", "label": "❌ Aspirational", "color": "danger"}

    elif info["unit"] == "marks_720":
        # NEET marks out of 720
        diff = student_marks - cutoff
        if diff >= 5:
            return {"status": "eligible", "label": "✅ Eligible", "color": "success"}
        elif diff >= -25:
            return {"status": "borderline", "label": "⚠️ Borderline", "color": "warning"}
        else:
            return {"status": "not_eligible", "label": "❌ Aspirational", "color": "danger"}

    else:
        # Percentile or Percentage (0–100)
        diff = student_marks - cutoff
        if diff >= 1.5:
            return {"status": "eligible", "label": "✅ Eligible", "color": "success"}
        elif diff >= -5.0:
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
            "Specialist Surgeon (MD/MS)",
            "Clinical & Genetic Researcher",
            "Public Health Officer (WHO/Govt)",
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
            "Public Policy & Diplomatic Analyst",
            "Investigative Journalist & Media Lead",
            "Corporate Communications Specialist",
            "Professor & Research Scholar"
        ],
        "Law": [
            "Corporate Law Advocate",
            "Litigation Lawyer (High Court / Supreme Court)",
            "In-House General Legal Counsel",
            "Judicial Magistrate / Civil Judge",
            "Arbitration & Intellectual Property Specialist"
        ],
        "Design": [
            "UI / UX & Digital Product Designer",
            "Industrial & Automobile Stylist",
            "Fashion & Luxury Textile Designer",
            "Animation, VFX & Game Artist",
            "Design Strategist & Creative Director"
        ],
    }
    return careers.get(stream, ["Professional Specialist", "Researcher", "Consultant", "Entrepreneur"])



# ---------------------------------------------------------------------------
# EXAM-SPECIFIC DEDICATED CATALOGS (CRITICAL TO PREVENT HALLUCINATIONS)
# ---------------------------------------------------------------------------

IIT_COLLEGES_CATALOG = [
    {
        "college_name": "Indian Institute of Technology Bombay (IIT Bombay)",
        "location": "Powai, Mumbai, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 68,
        "cutoff_rank": 68,
        "annual_fees": 250000,
        "rating": 4.9,
        "nirf_rank": "NIRF Rank #3 (Overall #1 West)",
        "placement_avg": "₹21.5 LPA",
        "placement_high": "₹1.68 Cr PA",
        "established": 1958,
        "facilities": ["Nanotech Center", "Supercomputing Cluster", "Techfest Campus"],
        "why_recommended": "India's highest cut-off engineering institute with premier global brand value."
    },
    {
        "college_name": "Indian Institute of Technology Delhi (IIT Delhi)",
        "location": "Hauz Khas, New Delhi",
        "stream": "Engineering",
        "branch": "Computer Science / Mathematics & Computing",
        "college_type": "Government",
        "cutoff_marks": 115,
        "cutoff_rank": 115,
        "annual_fees": 240000,
        "rating": 4.9,
        "nirf_rank": "NIRF Rank #2 (Engineering)",
        "placement_avg": "₹22.0 LPA",
        "placement_high": "₹2.0 Cr PA",
        "established": 1961,
        "facilities": ["AI Research School", "Clean Rooms", "Incubation Center"],
        "why_recommended": "Pinnacle of technology and startup culture in the national capital."
    },
    {
        "college_name": "Indian Institute of Technology Madras (IIT Madras)",
        "location": "Chennai, Tamil Nadu",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 160,
        "cutoff_rank": 160,
        "annual_fees": 230000,
        "rating": 4.9,
        "nirf_rank": "NIRF Rank #1 Overall (8 Consecutive Years)",
        "placement_avg": "₹21.0 LPA",
        "placement_high": "₹1.9 Cr PA",
        "established": 1959,
        "facilities": ["IITM Research Park", "Ocean Engineering Lab", "Green Campus"],
        "why_recommended": "Ranked #1 engineering institute in India with top patent output and research."
    },
    {
        "college_name": "Indian Institute of Technology Kanpur (IIT Kanpur)",
        "location": "Kanpur, Uttar Pradesh",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 240,
        "cutoff_rank": 240,
        "annual_fees": 235000,
        "rating": 4.9,
        "nirf_rank": "NIRF Rank #4 (Engineering)",
        "placement_avg": "₹20.5 LPA",
        "placement_high": "₹1.9 Cr PA",
        "established": 1959,
        "facilities": ["Airstrip & Flight Lab", "Cybersecurity Hub C3i", "Supercomputer"],
        "why_recommended": "Revered academic rigor, elite coding ecosystem, and premier national research labs."
    },
    {
        "college_name": "Indian Institute of Technology Kharagpur (IIT Kharagpur)",
        "location": "Kharagpur, West Bengal",
        "stream": "Engineering",
        "branch": "Computer Science / Data Science",
        "college_type": "Government",
        "cutoff_marks": 300,
        "cutoff_rank": 300,
        "annual_fees": 230000,
        "rating": 4.8,
        "nirf_rank": "NIRF Rank #5 (Engineering)",
        "placement_avg": "₹19.5 LPA",
        "placement_high": "₹2.1 Cr PA",
        "established": 1951,
        "facilities": ["Largest 2100-acre Campus", "Center of AI", "Science & Tech Park"],
        "why_recommended": "The first and largest IIT with an expansive alumni network across global leadership."
    },
    {
        "college_name": "Indian Institute of Technology Roorkee (IIT Roorkee)",
        "location": "Roorkee, Uttarakhand",
        "stream": "Engineering",
        "branch": "Computer Science / Electronics",
        "college_type": "Government",
        "cutoff_marks": 450,
        "cutoff_rank": 450,
        "annual_fees": 230000,
        "rating": 4.8,
        "nirf_rank": "NIRF Rank #5 (Engineering)",
        "placement_avg": "₹18.8 LPA",
        "placement_high": "₹1.5 Cr PA",
        "established": 1847,
        "facilities": ["Hydraulic Labs", "Supercomputer PARAM Ganga", "Heritage Campus"],
        "why_recommended": "Oldest technical institution in Asia offering elite education and high corporate placement."
    },
    {
        "college_name": "Indian Institute of Technology Guwahati (IIT Guwahati)",
        "location": "Guwahati, Assam",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 600,
        "cutoff_rank": 600,
        "annual_fees": 225000,
        "rating": 4.8,
        "nirf_rank": "NIRF Rank #7 (Engineering)",
        "placement_avg": "₹18.5 LPA",
        "placement_high": "₹1.4 Cr PA",
        "established": 1994,
        "facilities": ["Brahmaputra Scenic Campus", "PARAM Kamrupa Supercomputer", "Modern Labs"],
        "why_recommended": "Spectacular campus with top-tier tech recruitment and breakthrough international research."
    },
    {
        "college_name": "Indian Institute of Technology Hyderabad (IIT Hyderabad)",
        "location": "Kandi, Sangareddy, Telangana",
        "stream": "Engineering",
        "branch": "Artificial Intelligence / Computer Science",
        "college_type": "Government",
        "cutoff_marks": 650,
        "cutoff_rank": 650,
        "annual_fees": 230000,
        "rating": 4.8,
        "nirf_rank": "NIRF Rank #8 (Engineering)",
        "placement_avg": "₹20.0 LPA",
        "placement_high": "₹1.5 Cr PA",
        "established": 2008,
        "facilities": ["First Department of AI in India", "Japan Collaboration Hub", "Smart Mobility Lab"],
        "why_recommended": "Fastest rising 2nd-gen IIT pioneering specialized AI degrees and top Silicon Valley recruitment."
    },
    {
        "college_name": "Indian Institute of Technology (BHU) Varanasi",
        "location": "Varanasi, Uttar Pradesh",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 1050,
        "cutoff_rank": 1050,
        "annual_fees": 220000,
        "rating": 4.7,
        "nirf_rank": "NIRF Rank #10 (Engineering)",
        "placement_avg": "₹18.0 LPA",
        "placement_high": "₹1.2 Cr PA",
        "established": 1919,
        "facilities": ["Centenary Campus", "National Coding Champions Hub", "Incubation Center"],
        "why_recommended": "Legendary alumni network with industry-leading placement statistics in computer science."
    },
    {
        "college_name": "Indian Institute of Technology Indore (IIT Indore)",
        "location": "Simrol, Indore, Madhya Pradesh",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 1400,
        "cutoff_rank": 1400,
        "annual_fees": 235000,
        "rating": 4.7,
        "nirf_rank": "NIRF Top 15 (Engineering)",
        "placement_avg": "₹17.5 LPA",
        "placement_high": "₹1.1 Cr PA",
        "established": 2009,
        "facilities": ["Space Astronomy Center", "Sophisticated Instrumentation Facility", "Hostels"],
        "why_recommended": "Highest placement and research citation per faculty member among second-generation IITs."
    },
    {
        "college_name": "Indian Institute of Technology Gandhinagar (IIT Gandhinagar)",
        "location": "Gandhinagar, Gujarat",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 1600,
        "cutoff_rank": 1600,
        "annual_fees": 240000,
        "rating": 4.6,
        "nirf_rank": "NIRF Top 18 (Engineering)",
        "placement_avg": "₹16.8 LPA",
        "placement_high": "₹90.0 LPA",
        "established": 2008,
        "facilities": ["Maker Bhavan", "5-Star Green Campus", "Design Innovation Center"],
        "why_recommended": "Liberal academic curriculum, world-class living infrastructure, and vibrant project culture."
    },
    {
        "college_name": "Indian Institute of Technology Ropar (IIT Ropar)",
        "location": "Rupnagar, Punjab",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 1900,
        "cutoff_rank": 1900,
        "annual_fees": 230000,
        "rating": 4.6,
        "nirf_rank": "NIRF Top 22 (Engineering)",
        "placement_avg": "₹16.5 LPA",
        "placement_high": "₹85.0 LPA",
        "established": 2008,
        "facilities": ["Center for Agriculture IoT", "Biomedical Labs", "Modern Residential Campus"],
        "why_recommended": "Ranked among top Indian universities for research citations and tech placements."
    },
    {
        "college_name": "Indian Institute of Technology Patna (IIT Patna)",
        "location": "Bihta, Patna, Bihar",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 2700,
        "cutoff_rank": 2700,
        "annual_fees": 225000,
        "rating": 4.6,
        "nirf_rank": "NIRF Top 25",
        "placement_avg": "₹16.2 LPA",
        "placement_high": "₹82.0 LPA",
        "established": 2008,
        "facilities": ["Incubation Center", "AI NLP Lab", "Spacious Hostels"],
        "why_recommended": "Outstanding competitive coding track record with huge software development job offers."
    },
    {
        "college_name": "Indian Institute of Technology Mandi (IIT Mandi)",
        "location": "Kamand, Mandi, Himachal Pradesh",
        "stream": "Engineering",
        "branch": "Data Science & Artificial Intelligence",
        "college_type": "Government",
        "cutoff_marks": 3100,
        "cutoff_rank": 3100,
        "annual_fees": 220000,
        "rating": 4.5,
        "nirf_rank": "NIRF Top 30",
        "placement_avg": "₹15.8 LPA",
        "placement_high": "₹75.0 LPA",
        "established": 2009,
        "facilities": ["Scenic Himalayan Campus", "Advanced Materials Research", "Robotics Labs"],
        "why_recommended": "Unique interactive socio-technical practicum with strong specialized branches."
    },
    {
        "college_name": "Indian Institute of Technology Jodhpur (IIT Jodhpur)",
        "location": "Karwar, Jodhpur, Rajasthan",
        "stream": "Engineering",
        "branch": "Artificial Intelligence & Data Science",
        "college_type": "Government",
        "cutoff_marks": 3200,
        "cutoff_rank": 3200,
        "annual_fees": 230000,
        "rating": 4.5,
        "nirf_rank": "NIRF Top 30",
        "placement_avg": "₹15.5 LPA",
        "placement_high": "₹72.0 LPA",
        "established": 2008,
        "facilities": ["AIoT Technology Hub", "VR AR Simulation Lab", "Solar Park"],
        "why_recommended": "Modern futuristic curriculum focused on emerging deep-tech and computing."
    },
    {
        "college_name": "Indian Institute of Technology Bhubaneswar (IIT Bhubaneswar)",
        "location": "Arugul, Jatni, Odisha",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 3400,
        "cutoff_rank": 3400,
        "annual_fees": 225000,
        "rating": 4.5,
        "nirf_rank": "NIRF Top 35",
        "placement_avg": "₹15.2 LPA",
        "placement_high": "₹68.0 LPA",
        "established": 2008,
        "facilities": ["Center for Climate Sciences", "Modern Labs", "Expansive Campus"],
        "why_recommended": "Rapidly expanding academic hub with stellar core and software engineering placements."
    },
    {
        "college_name": "Indian Institute of Technology Tirupati (IIT Tirupati)",
        "location": "Yerpedu, Tirupati, Andhra Pradesh",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 4100,
        "cutoff_rank": 4100,
        "annual_fees": 220000,
        "rating": 4.5,
        "nirf_rank": "NIRF Top 45",
        "placement_avg": "₹14.8 LPA",
        "placement_high": "₹65.0 LPA",
        "established": 2015,
        "facilities": ["Permanent Modern Campus", "IoT Labs", "Central Library"],
        "why_recommended": "Third-generation IIT with ultra-modern smart campus facilities and high placement growth."
    },
    {
        "college_name": "Indian Institute of Technology Palakkad (IIT Palakkad)",
        "location": "Kanjikode, Palakkad, Kerala",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 4600,
        "cutoff_rank": 4600,
        "annual_fees": 220000,
        "rating": 4.4,
        "nirf_rank": "3rd Gen IIT Pioneer",
        "placement_avg": "₹14.2 LPA",
        "placement_high": "₹60.0 LPA",
        "established": 2015,
        "facilities": ["Data Science Hub", "Central Fabrication", "Eco-friendly Campus"],
        "why_recommended": "Strong foundational computer science research with fast-growing national recruitment."
    },
    {
        "college_name": "Indian Institute of Technology Jammu (IIT Jammu)",
        "location": "Jagti, Jammu, J&K",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 5200,
        "cutoff_rank": 5200,
        "annual_fees": 215000,
        "rating": 4.4,
        "nirf_rank": "3rd Gen IIT",
        "placement_avg": "₹13.8 LPA",
        "placement_high": "₹55.0 LPA",
        "established": 2016,
        "facilities": ["High Performance Computing", "Smart Classrooms", "Hostels"],
        "why_recommended": "Scenic foothills campus with dedicated mentorship from IIT Delhi."
    },
    {
        "college_name": "Indian Institute of Technology Dharwad (IIT Dharwad)",
        "location": "Dharwad, Karnataka",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 5400,
        "cutoff_rank": 5400,
        "annual_fees": 220000,
        "rating": 4.4,
        "nirf_rank": "3rd Gen IIT",
        "placement_avg": "₹13.5 LPA",
        "placement_high": "₹52.0 LPA",
        "established": 2016,
        "facilities": ["New Permanent Campus", "Center of Excellence in AI", "Incubation Hub"],
        "why_recommended": "Close synergy with Karnataka's tech corridor providing active internship pipelines."
    },
    {
        "college_name": "Indian Institute of Technology Bhilai (IIT Bhilai)",
        "location": "Kutelabhata, Bhilai, Chhattisgarh",
        "stream": "Engineering",
        "branch": "Data Science & Artificial Intelligence",
        "college_type": "Government",
        "cutoff_marks": 5800,
        "cutoff_rank": 5800,
        "annual_fees": 215000,
        "rating": 4.3,
        "nirf_rank": "3rd Gen IIT",
        "placement_avg": "₹13.2 LPA",
        "placement_high": "₹48.0 LPA",
        "established": 2016,
        "facilities": ["State-of-the-Art Permanent Campus", "Robotics Wing", "Central Library"],
        "why_recommended": "Specialized curriculum in cutting-edge computer science and automation."
    },
    {
        "college_name": "Indian Institute of Technology Goa (IIT Goa)",
        "location": "Farmagudi, Ponda, Goa",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 5100,
        "cutoff_rank": 5100,
        "annual_fees": 220000,
        "rating": 4.4,
        "nirf_rank": "3rd Gen IIT",
        "placement_avg": "₹14.0 LPA",
        "placement_high": "₹54.0 LPA",
        "established": 2016,
        "facilities": ["AI Research Labs", "Hardware Prototyping", "Coastal Innovation Lab"],
        "why_recommended": "Dynamic faculty, international research exposure, and high software development placements."
    }
]

JEE_MAIN_COLLEGES_CATALOG = [
    {
        "college_name": "National Institute of Technology Tiruchirappalli (NIT Trichy)",
        "location": "Tiruchirappalli, Tamil Nadu",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 99.6,
        "cutoff_percent": 99.6,
        "cutoff_rank": 4200,
        "annual_fees": 150000,
        "rating": 4.9,
        "nirf_rank": "NIRF Rank #9 (NIT #1)",
        "placement_avg": "₹17.8 LPA",
        "placement_high": "₹52.0 LPA",
        "established": 1964,
        "facilities": ["Octagon Computer Center", "Robotics Lab", "Hostels", "Sports Arena"],
        "why_recommended": "Apex NIT in India with exceptional coding placements and national prestige."
    },
    {
        "college_name": "National Institute of Technology Karnataka (NIT Surathkal)",
        "location": "Mangaluru, Karnataka",
        "stream": "Engineering",
        "branch": "Information Technology / CSE",
        "college_type": "Government",
        "cutoff_marks": 99.4,
        "cutoff_percent": 99.4,
        "cutoff_rank": 5500,
        "annual_fees": 155000,
        "rating": 4.8,
        "nirf_rank": "NIRF Rank #12",
        "placement_avg": "₹18.2 LPA",
        "placement_high": "₹54.5 LPA",
        "established": 1960,
        "facilities": ["Private Beachfront Campus", "Central Computing Facility", "Incubation Center"],
        "why_recommended": "Premier coastal NIT renowned for extraordinary IT and software job offers."
    },
    {
        "college_name": "National Institute of Technology Warangal (NIT Warangal)",
        "location": "Warangal, Telangana",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 99.2,
        "cutoff_percent": 99.2,
        "cutoff_rank": 6800,
        "annual_fees": 150000,
        "rating": 4.8,
        "nirf_rank": "NIRF Rank #21",
        "placement_avg": "₹17.2 LPA",
        "placement_high": "₹88.0 LPA",
        "established": 1959,
        "facilities": ["Supercomputing Facility", "Innovation Garage", "Massive Library"],
        "why_recommended": "Historic pioneer among RECs with outstanding software placement records."
    },
    {
        "college_name": "Visvesvaraya National Institute of Technology (VNIT Nagpur)",
        "location": "Nagpur, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 98.6,
        "cutoff_percent": 98.6,
        "cutoff_rank": 8500,
        "annual_fees": 145000,
        "rating": 4.7,
        "nirf_rank": "NIRF Top 40",
        "placement_avg": "₹14.5 LPA",
        "placement_high": "₹64.0 LPA",
        "established": 1960,
        "facilities": ["Modern Computing Center", "Materials Research Lab", "Green Campus"],
        "why_recommended": "Premier national institute in Maharashtra offering excellent academic standards via JEE Main."
    },
    {
        "college_name": "COEP Technological University (All India Quota via JEE Main)",
        "location": "Shivajinagar, Pune, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Engineering / IT",
        "college_type": "Government",
        "cutoff_marks": 98.4,
        "cutoff_percent": 98.4,
        "cutoff_rank": 9500,
        "annual_fees": 90000,
        "rating": 4.8,
        "nirf_rank": "State Rank #1 (NIRF Top 50)",
        "placement_avg": "₹11.5 LPA",
        "placement_high": "₹50.5 LPA",
        "established": 1854,
        "facilities": ["Boat Club", "AI Research Lab", "High-Tech Campus", "Central Library"],
        "why_recommended": "Historic government engineering pioneer accepting JEE Main scores for 15% All India Quota seats."
    },
    {
        "college_name": "International Institute of Information Technology Hyderabad (IIIT Hyderabad)",
        "location": "Gachibowli, Hyderabad, Telangana",
        "stream": "Engineering",
        "branch": "B.Tech Computer Science & Engineering",
        "college_type": "Private",
        "cutoff_marks": 99.8,
        "cutoff_percent": 99.8,
        "cutoff_rank": 1200,
        "annual_fees": 360000,
        "rating": 4.9,
        "nirf_rank": "Top Coding Institute in India",
        "placement_avg": "₹32.0 LPA",
        "placement_high": "₹1.02 Cr PA",
        "established": 1998,
        "facilities": ["Kohli Center on Intelligent Systems", "Robotics Lab", "Incubation Hub"],
        "why_recommended": "Widely regarded as India's best coding and computer science research institute accepting JEE Main."
    },
    {
        "college_name": "Delhi Technological University (DTU)",
        "location": "Rohini, New Delhi",
        "stream": "Engineering",
        "branch": "Computer Science / Software Engineering",
        "college_type": "Government",
        "cutoff_marks": 98.8,
        "cutoff_percent": 98.8,
        "cutoff_rank": 7800,
        "annual_fees": 190000,
        "rating": 4.8,
        "nirf_rank": "NIRF Top 30",
        "placement_avg": "₹16.5 LPA",
        "placement_high": "₹1.2 Cr PA",
        "established": 1941,
        "facilities": ["164-acre Green Campus", "Formula Student Lab", "Supercomputer"],
        "why_recommended": "Legendary institution producing thousands of top software engineers and tech startup founders."
    },
    {
        "college_name": "Netaji Subhas University of Technology (NSUT)",
        "location": "Dwarka, New Delhi",
        "stream": "Engineering",
        "branch": "Computer Engineering / AI",
        "college_type": "Government",
        "cutoff_marks": 98.5,
        "cutoff_percent": 98.5,
        "cutoff_rank": 8900,
        "annual_fees": 195000,
        "rating": 4.7,
        "nirf_rank": "NIRF Top 60",
        "placement_avg": "₹16.0 LPA",
        "placement_high": "₹1.05 Cr PA",
        "established": 1983,
        "facilities": ["Smart Classrooms", "Advanced Computing Center", "Sports Grounds"],
        "why_recommended": "Elite coding and software development placements via JAC Delhi counseling on JEE Main rank."
    },
    {
        "college_name": "Motilal Nehru National Institute of Technology (MNNIT Allahabad)",
        "location": "Prayagraj, Uttar Pradesh",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 98.7,
        "cutoff_percent": 98.7,
        "cutoff_rank": 7200,
        "annual_fees": 140000,
        "rating": 4.7,
        "nirf_rank": "NIRF Top 50",
        "placement_avg": "₹16.8 LPA",
        "placement_high": "₹82.0 LPA",
        "established": 1961,
        "facilities": ["Param Shavak Supercomputer", "Hostels", "Innovation Cell"],
        "why_recommended": "Famous for top-ranked competitive programming alumni and phenomenal placement statistics."
    },
    {
        "college_name": "Malaviya National Institute of Technology (MNIT Jaipur)",
        "location": "Jaipur, Rajasthan",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 98.2,
        "cutoff_percent": 98.2,
        "cutoff_rank": 9800,
        "annual_fees": 145000,
        "rating": 4.6,
        "nirf_rank": "NIRF Top 40",
        "placement_avg": "₹14.2 LPA",
        "placement_high": "₹64.0 LPA",
        "established": 1963,
        "facilities": ["Materials Research Center", "Incubation Hub", "Expansive Campus"],
        "why_recommended": "Premier technical institute in north-west India with massive corporate recruiter presence."
    },
    {
        "college_name": "National Institute of Technology Rourkela (NIT Rourkela)",
        "location": "Rourkela, Odisha",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 98.5,
        "cutoff_percent": 98.5,
        "cutoff_rank": 8200,
        "annual_fees": 150000,
        "rating": 4.7,
        "nirf_rank": "NIRF Rank #16",
        "placement_avg": "₹15.5 LPA",
        "placement_high": "₹83.0 LPA",
        "established": 1961,
        "facilities": ["647-acre Campus", "TIIR Innovation Center", "High-Tech Labs"],
        "why_recommended": "High NIRF ranked NIT with huge multidisciplinary research funding and top placements."
    },
    {
        "college_name": "National Institute of Technology Calicut (NIT Calicut)",
        "location": "Kozhikode, Kerala",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 98.1,
        "cutoff_percent": 98.1,
        "cutoff_rank": 10200,
        "annual_fees": 145000,
        "rating": 4.6,
        "nirf_rank": "NIRF Rank #23",
        "placement_avg": "₹14.8 LPA",
        "placement_high": "₹67.0 LPA",
        "established": 1961,
        "facilities": ["Technology Business Incubator", "Nanotechnology Center", "Library"],
        "why_recommended": "Premier southern technical institute with thriving student startup ventures and IT drives."
    },
    {
        "college_name": "International Institute of Information Technology Bangalore (IIIT Bangalore)",
        "location": "Electronic City, Bengaluru, Karnataka",
        "stream": "Engineering",
        "branch": "Integrated M.Tech Computer Science / Data Science",
        "college_type": "Private",
        "cutoff_marks": 99.1,
        "cutoff_percent": 99.1,
        "cutoff_rank": 8100,
        "annual_fees": 380000,
        "rating": 4.8,
        "nirf_rank": "Top Tier IIIT",
        "placement_avg": "₹26.5 LPA",
        "placement_high": "₹65.0 LPA",
        "established": 1999,
        "facilities": ["Location in Tech Capital Electronic City", "IoT Innovation Lab", "Incubation Center"],
        "why_recommended": "Surrounded by tech giants in Electronic City with astronomical starting salary averages."
    },
    {
        "college_name": "Indraprastha Institute of Information Technology Delhi (IIIT Delhi)",
        "location": "Okhla, New Delhi",
        "stream": "Engineering",
        "branch": "Computer Science & Artificial Intelligence",
        "college_type": "Government",
        "cutoff_marks": 98.3,
        "cutoff_percent": 98.3,
        "cutoff_rank": 9900,
        "annual_fees": 420000,
        "rating": 4.7,
        "nirf_rank": "NIRF Top 70",
        "placement_avg": "₹20.4 LPA",
        "placement_high": "₹51.0 LPA",
        "established": 2008,
        "facilities": ["Center for AI", "Cybersecurity Research Lab", "Modern Campus"],
        "why_recommended": "World-class CS and AI research faculty with stellar international research output."
    },
    {
        "college_name": "Indian Institute of Information Technology, Allahabad (IIIT Allahabad)",
        "location": "Jhalwa, Prayagraj, Uttar Pradesh",
        "stream": "Engineering",
        "branch": "Information Technology / CSE",
        "college_type": "Government",
        "cutoff_marks": 98.0,
        "cutoff_percent": 98.0,
        "cutoff_rank": 11500,
        "annual_fees": 180000,
        "rating": 4.7,
        "nirf_rank": "Institute of National Importance",
        "placement_avg": "₹20.8 LPA",
        "placement_high": "₹82.5 LPA",
        "established": 1999,
        "facilities": ["State-of-the-Art IT Hub", "Big Data Analytics Lab", "Hostels"],
        "why_recommended": "Unmatched track record in Competitive Programming, Google Summer of Code, and top SDE hiring."
    },
    {
        "college_name": "Veermata Jijabai Technological Institute (VJTI Mumbai - All India Seats)",
        "location": "Matunga, Mumbai, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Engineering & Data Science",
        "college_type": "Government",
        "cutoff_marks": 98.2,
        "cutoff_percent": 98.2,
        "cutoff_rank": 10500,
        "annual_fees": 85000,
        "rating": 4.7,
        "nirf_rank": "NIRF Top 100",
        "placement_avg": "₹12.8 LPA",
        "placement_high": "₹62.0 LPA",
        "established": 1887,
        "facilities": ["Incubation Center", "Hostels", "Robotics Lab", "Wi-Fi Campus"],
        "why_recommended": "Top Mumbai government institution accepting JEE Main for 15% All India quota seats."
    },
    {
        "college_name": "Thapar Institute of Engineering and Technology (TIET)",
        "location": "Patiala, Punjab",
        "stream": "Engineering",
        "branch": "Computer Engineering",
        "college_type": "Private",
        "cutoff_marks": 95.5,
        "cutoff_percent": 95.5,
        "cutoff_rank": 28000,
        "annual_fees": 450000,
        "rating": 4.5,
        "nirf_rank": "NIRF Rank #20",
        "placement_avg": "₹11.8 LPA",
        "placement_high": "₹45.0 LPA",
        "established": 1956,
        "facilities": ["Vast 250-acre Campus", "Trinity College Dublin Partnership", "Modern Hostels"],
        "why_recommended": "High-reputation deemed university admitting heavily on JEE Main percentiles."
    },
    {
        "college_name": "Birla Institute of Technology, Mesra (BIT Mesra)",
        "location": "Ranchi, Jharkhand",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 96.0,
        "cutoff_percent": 96.0,
        "cutoff_rank": 24000,
        "annual_fees": 310000,
        "rating": 4.5,
        "nirf_rank": "NIRF Top 55",
        "placement_avg": "₹13.0 LPA",
        "placement_high": "₹51.0 LPA",
        "established": 1955,
        "facilities": ["Supercomputing Lab", "Rocketry & Space Lab", "Green Campus"],
        "why_recommended": "Premier GFTI participating directly in JoSAA counseling accepting JEE Main scores."
    },
    {
        "college_name": "Punjab Engineering College (PEC Chandigarh)",
        "location": "Chandigarh, UT",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 96.8,
        "cutoff_percent": 96.8,
        "cutoff_rank": 19000,
        "annual_fees": 190000,
        "rating": 4.6,
        "nirf_rank": "Premier Centenary College",
        "placement_avg": "₹15.2 LPA",
        "placement_high": "₹64.0 LPA",
        "established": 1921,
        "facilities": ["Semiconductor Clean Room", "Aerospace Wind Tunnel", "Hostels"],
        "why_recommended": "Historic government institution producing premier astronauts and tech leaders."
    },
    {
        "college_name": "Indian Institute of Engineering Science and Technology (IIEST Shibpur)",
        "location": "Howrah, West Bengal",
        "stream": "Engineering",
        "branch": "Computer Science & Technology",
        "college_type": "Government",
        "cutoff_marks": 96.2,
        "cutoff_percent": 96.2,
        "cutoff_rank": 22000,
        "annual_fees": 140000,
        "rating": 4.5,
        "nirf_rank": "Institute of National Importance",
        "placement_avg": "₹12.5 LPA",
        "placement_high": "₹50.0 LPA",
        "established": 1856,
        "facilities": ["Historic Botanical Campus", "Center for Healthcare Tech", "Central Library"],
        "why_recommended": "Centuries-old institute of national importance admitting via JEE Main JoSAA rounds."
    },
    {
        "college_name": "National Institute of Technology Kurukshetra (NIT Kurukshetra)",
        "location": "Kurukshetra, Haryana",
        "stream": "Engineering",
        "branch": "Computer Engineering / IT",
        "college_type": "Government",
        "cutoff_marks": 97.5,
        "cutoff_percent": 97.5,
        "cutoff_rank": 13500,
        "annual_fees": 145000,
        "rating": 4.6,
        "nirf_rank": "NIRF Top 55",
        "placement_avg": "₹13.8 LPA",
        "placement_high": "₹52.0 LPA",
        "established": 1963,
        "facilities": ["Siemens Center of Excellence", "High Tech Computing", "Hostels"],
        "why_recommended": "Proximity to NCR tech hub ensures active campus recruiting by Microsoft and Amazon."
    },
    {
        "college_name": "National Institute of Technology Silchar (NIT Silchar)",
        "location": "Silchar, Assam",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 96.0,
        "cutoff_percent": 96.0,
        "cutoff_rank": 23500,
        "annual_fees": 140000,
        "rating": 4.5,
        "nirf_rank": "NIRF Rank #40",
        "placement_avg": "₹13.5 LPA",
        "placement_high": "₹44.0 LPA",
        "established": 1967,
        "facilities": ["Scenic 600-acre Campus", "PARAM Supercomputer", "Modern Hostels"],
        "why_recommended": "Top ranking NIT in the north-east with high placement percentage in IT."
    }
]

MHT_CET_COLLEGES_CATALOG = [
    {
        "college_name": "COEP Technological University",
        "location": "Shivajinagar, Pune, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Engineering / IT",
        "college_type": "Government",
        "cutoff_marks": 99.4,
        "cutoff_percent": 99.4,
        "cutoff_rank": 3500,
        "annual_fees": 90000,
        "rating": 4.8,
        "nirf_rank": "State Rank #1 (NIRF Top 50)",
        "placement_avg": "₹11.5 LPA",
        "placement_high": "₹50.5 LPA",
        "established": 1854,
        "facilities": ["Boat Club", "AI Research Lab", "High-Tech Campus", "Central Library"],
        "why_recommended": "Historic government engineering pioneer in Maharashtra admitting through MHT-CET CAP rounds."
    },
    {
        "college_name": "Veermata Jijabai Technological Institute (VJTI)",
        "location": "Matunga, Mumbai, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Engineering & Data Science",
        "college_type": "Government",
        "cutoff_marks": 99.2,
        "cutoff_percent": 99.2,
        "cutoff_rank": 4200,
        "annual_fees": 85000,
        "rating": 4.7,
        "nirf_rank": "NIRF Top 100",
        "placement_avg": "₹12.8 LPA",
        "placement_high": "₹62.0 LPA",
        "established": 1887,
        "facilities": ["Incubation Center", "Hostels", "Robotics Lab", "Wi-Fi Campus"],
        "why_recommended": "Elite technical institute in the heart of Mumbai with premier corporate hiring."
    },
    {
        "college_name": "Sardar Patel Institute of Technology (SPIT)",
        "location": "Andheri West, Mumbai, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Private",
        "cutoff_marks": 98.6,
        "cutoff_percent": 98.6,
        "cutoff_rank": 6500,
        "annual_fees": 170000,
        "rating": 4.6,
        "nirf_rank": "NIRF Top 150",
        "placement_avg": "₹14.2 LPA",
        "placement_high": "₹42.0 LPA",
        "established": 2005,
        "facilities": ["Fintech Lab", "Maker Space", "Auditorium", "Smart Classrooms"],
        "why_recommended": "Exceptional coding culture with high placement averages and corporate links."
    },
    {
        "college_name": "Pune Institute of Computer Technology (PICT)",
        "location": "Dhankawadi, Pune, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Engineering / AI & DS",
        "college_type": "Private",
        "cutoff_marks": 98.4,
        "cutoff_percent": 98.4,
        "cutoff_rank": 7200,
        "annual_fees": 115000,
        "rating": 4.6,
        "nirf_rank": "Autonomous NAAC A+",
        "placement_avg": "₹13.5 LPA",
        "placement_high": "₹44.0 LPA",
        "established": 1983,
        "facilities": ["Competitive Coding Cell", "Digital Library", "High Speed Campus"],
        "why_recommended": "Unmatched software placement records in Pune, producing thousands of top software developers."
    },
    {
        "college_name": "Walchand College of Engineering",
        "location": "Vishrambag, Sangli, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 97.2,
        "cutoff_percent": 97.2,
        "cutoff_rank": 10500,
        "annual_fees": 85000,
        "rating": 4.5,
        "nirf_rank": "Autonomous Heritage Institute",
        "placement_avg": "₹9.2 LPA",
        "placement_high": "₹37.0 LPA",
        "established": 1947,
        "facilities": ["Sprawling 90-acre Campus", "Hostels", "Advanced Computing Center"],
        "why_recommended": "Venerated autonomous institution with consistent high placements in global tech firms."
    },
    {
        "college_name": "Vishwakarma Institute of Technology (VIT)",
        "location": "Bibwewadi, Pune, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Engineering / Information Technology",
        "college_type": "Private",
        "cutoff_marks": 96.8,
        "cutoff_percent": 96.8,
        "cutoff_rank": 11800,
        "annual_fees": 190000,
        "rating": 4.5,
        "nirf_rank": "NIRF Top 150",
        "placement_avg": "₹9.0 LPA",
        "placement_high": "₹44.0 LPA",
        "established": 1983,
        "facilities": ["Center for AI", "Incubation Center", "Auditorium"],
        "why_recommended": "Premier private autonomous college in Pune with active corporate recruitment ties."
    },
    {
        "college_name": "D.J. Sanghvi College of Engineering",
        "location": "Vile Parle West, Mumbai, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Engineering / Data Science",
        "cutoff_marks": 97.8,
        "cutoff_percent": 97.8,
        "cutoff_rank": 9200,
        "annual_fees": 220000,
        "rating": 4.6,
        "nirf_rank": "Autonomous NAAC A+",
        "placement_avg": "₹11.0 LPA",
        "placement_high": "₹45.0 LPA",
        "established": 1994,
        "facilities": ["Modern Coding Labs", "Apple Mac Labs", "Auditorium"],
        "why_recommended": "Highly sought-after suburban Mumbai college known for finance, consulting, and tech hiring."
    },
    {
        "college_name": "Thadomal Shahani Engineering College (TSEC)",
        "location": "Bandra West, Mumbai, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Engineering / AI & DS",
        "college_type": "Private",
        "cutoff_marks": 95.8,
        "cutoff_percent": 95.8,
        "cutoff_rank": 14200,
        "annual_fees": 185000,
        "rating": 4.4,
        "nirf_rank": "Autonomous NAAC A",
        "placement_avg": "₹9.5 LPA",
        "placement_high": "₹40.0 LPA",
        "established": 1983,
        "facilities": ["Bandra Proximity", "Innovation Lab", "Hostels"],
        "why_recommended": "Prime Bandra location offering immediate connections to Mumbai's tech and finance firms."
    },
    {
        "college_name": "MKSSS Cummins College of Engineering for Women",
        "location": "Karve Nagar, Pune, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Engineering",
        "college_type": "Private",
        "cutoff_marks": 95.2,
        "cutoff_percent": 95.2,
        "cutoff_rank": 15500,
        "annual_fees": 175000,
        "rating": 4.5,
        "nirf_rank": "Top Women's Engineering College",
        "placement_avg": "₹10.5 LPA",
        "placement_high": "₹45.0 LPA",
        "established": 1991,
        "facilities": ["Cummins Research Center", "Digital Library", "Safe Campus Hostels"],
        "why_recommended": "India's premier all-women engineering college with exceptional diversity recruitment drives."
    },
    {
        "college_name": "Pimpri Chinchwad College of Engineering (PCCOE)",
        "location": "Akurdi, Pune, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Engineering / IT",
        "college_type": "Private",
        "cutoff_marks": 94.8,
        "cutoff_percent": 94.8,
        "cutoff_rank": 16800,
        "annual_fees": 140000,
        "rating": 4.4,
        "nirf_rank": "Autonomous NAAC A",
        "placement_avg": "₹7.8 LPA",
        "placement_high": "₹32.0 LPA",
        "established": 1999,
        "facilities": ["Central Placement Cell", "Innovation Cell", "Sports Ground"],
        "why_recommended": "Famous for massive placement drives across Pune and Pimpri-Chinchwad tech corridor."
    },
    {
        "college_name": "MIT World Peace University (MIT-WPU)",
        "location": "Kothrud, Pune, Maharashtra",
        "stream": "Engineering",
        "branch": "B.Tech Computer Science & Engineering",
        "college_type": "Private",
        "cutoff_marks": 92.5,
        "cutoff_percent": 92.5,
        "cutoff_rank": 22000,
        "annual_fees": 320000,
        "rating": 4.4,
        "nirf_rank": "State Private University",
        "placement_avg": "₹8.5 LPA",
        "placement_high": "₹44.0 LPA",
        "established": 1983,
        "facilities": ["World Peace Dome", "High-Tech Classrooms", "Modern Labs"],
        "why_recommended": "Vast infrastructure with holistic curriculum and dedicated campus recruitment."
    },
    {
        "college_name": "Government College of Engineering, Aurangabad",
        "location": "Chhatrapati Sambhajinagar, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 92.8,
        "cutoff_percent": 92.8,
        "cutoff_rank": 21000,
        "annual_fees": 75000,
        "rating": 4.4,
        "nirf_rank": "State Autonomous Institute",
        "placement_avg": "₹7.5 LPA",
        "placement_high": "₹28.0 LPA",
        "established": 1960,
        "facilities": ["CAD Center", "Auditorium", "Campus Hostels"],
        "why_recommended": "Affordable autonomous government institute with strong engineering faculty."
    },
    {
        "college_name": "K.J. Somaiya College of Engineering",
        "location": "Vidyavihar, Mumbai, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Engineering",
        "college_type": "Private",
        "cutoff_marks": 94.0,
        "cutoff_percent": 94.0,
        "cutoff_rank": 18000,
        "annual_fees": 350000,
        "rating": 4.4,
        "nirf_rank": "Somaiya Vidyavihar University",
        "placement_avg": "₹8.8 LPA",
        "placement_high": "₹30.0 LPA",
        "established": 1983,
        "facilities": ["Massive Green Campus", "FabLab", "Olympic Sports Complex"],
        "why_recommended": "Vast 65-acre campus in Mumbai offering multidisciplinary engineering degrees."
    },
    {
        "college_name": "Government College of Engineering, Amravati",
        "location": "Amravati, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 91.5,
        "cutoff_percent": 91.5,
        "cutoff_rank": 24000,
        "annual_fees": 75000,
        "rating": 4.3,
        "nirf_rank": "State Autonomous",
        "placement_avg": "₹6.8 LPA",
        "placement_high": "₹22.0 LPA",
        "established": 1964,
        "facilities": ["Workshop Complex", "Hostels", "Library"],
        "why_recommended": "Prominent Vidarbha government institution offering low tuition and reliable placements."
    },
    {
        "college_name": "Vishwakarma Institute of Information Technology (VIIT)",
        "location": "Kondhwa, Pune, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Engineering / AI & DS",
        "college_type": "Private",
        "cutoff_marks": 93.5,
        "cutoff_percent": 93.5,
        "cutoff_rank": 19000,
        "annual_fees": 170000,
        "rating": 4.4,
        "nirf_rank": "Autonomous NAAC A+",
        "placement_avg": "₹7.5 LPA",
        "placement_high": "₹33.0 LPA",
        "established": 2002,
        "facilities": ["Modern Coding Labs", "Incubation Center", "Sports Grounds"],
        "why_recommended": "Sister institute of VIT Pune sharing centralized placement assistance and high IT recruitment."
    },
    {
        "college_name": "Fr. Conceicao Rodrigues College of Engineering (CRCE)",
        "location": "Bandra West, Mumbai, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Engineering",
        "college_type": "Private",
        "cutoff_marks": 93.8,
        "cutoff_percent": 93.8,
        "cutoff_rank": 18500,
        "annual_fees": 160000,
        "rating": 4.4,
        "nirf_rank": "Premier Mumbai Engineering",
        "placement_avg": "₹8.2 LPA",
        "placement_high": "₹35.0 LPA",
        "established": 1984,
        "facilities": ["Bandra Seaside Campus", "Robotics Lab", "E-Cell"],
        "why_recommended": "Sought-after Bandra institution with strong connections to Mumbai financial and tech sectors."
    },
    {
        "college_name": "Vidyalankar Institute of Technology (VIT Wadala)",
        "location": "Wadala, Mumbai, Maharashtra",
        "stream": "Engineering",
        "branch": "Information Technology / Computer Engineering",
        "college_type": "Private",
        "cutoff_marks": 91.2,
        "cutoff_percent": 91.2,
        "cutoff_rank": 24500,
        "annual_fees": 155000,
        "rating": 4.3,
        "nirf_rank": "NAAC A+ Accredited",
        "placement_avg": "₹6.8 LPA",
        "placement_high": "₹28.0 LPA",
        "established": 1999,
        "facilities": ["State-of-the-Art Apple Lab", "Cinema Theater Classrooms", "Cafeteria"],
        "why_recommended": "Award-winning campus design with cutting-edge software and electronics laboratory facilities."
    },
    {
        "college_name": "Government College of Engineering, Karad (GCE Karad)",
        "location": "Karad, Satara, Maharashtra",
        "stream": "Engineering",
        "branch": "Information Technology / Mechanical",
        "college_type": "Government",
        "cutoff_marks": 90.5,
        "cutoff_percent": 90.5,
        "cutoff_rank": 26000,
        "annual_fees": 72000,
        "rating": 4.3,
        "nirf_rank": "State Autonomous Government",
        "placement_avg": "₹6.5 LPA",
        "placement_high": "₹25.0 LPA",
        "established": 1960,
        "facilities": ["Vast Green Campus", "Central Library", "Government Hostels"],
        "why_recommended": "Premier autonomous government engineering college in western Maharashtra with nominal fees."
    },
    {
        "college_name": "Shri Guru Gobind Singhji Institute of Engineering & Technology (SGGSIE&T)",
        "location": "Nanded, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 89.8,
        "cutoff_percent": 89.8,
        "cutoff_rank": 27500,
        "annual_fees": 70000,
        "rating": 4.3,
        "nirf_rank": "State Autonomous Institute",
        "placement_avg": "₹6.2 LPA",
        "placement_high": "₹24.0 LPA",
        "established": 1981,
        "facilities": ["VLSI Design Center", "Center for Excellence", "Spacious Hostels"],
        "why_recommended": "Pioneering state government-aided autonomous institute with dedicated industry-sponsored research."
    },
    {
        "college_name": "Dr. D.Y. Patil Institute of Technology",
        "location": "Pimpri, Pune, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Engineering / AI & Data Science",
        "college_type": "Private",
        "cutoff_marks": 88.5,
        "cutoff_percent": 88.5,
        "cutoff_rank": 29000,
        "annual_fees": 135000,
        "rating": 4.2,
        "nirf_rank": "NAAC A++ (NIRF Top 200)",
        "placement_avg": "₹6.0 LPA",
        "placement_high": "₹26.0 LPA",
        "established": 1998,
        "facilities": ["Incubation Center", "Sports Complex", "Auditorium"],
        "why_recommended": "Located in the heart of Pune's industrial hub with massive pool campus recruitment drives."
    },
    {
        "college_name": "Government College of Engineering, Nagpur (GCOEN)",
        "location": "Nagpur, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Science & Engineering",
        "college_type": "Government",
        "cutoff_marks": 91.0,
        "cutoff_percent": 91.0,
        "cutoff_rank": 25000,
        "annual_fees": 70000,
        "rating": 4.3,
        "nirf_rank": "State Government Institute",
        "placement_avg": "₹6.5 LPA",
        "placement_high": "₹22.0 LPA",
        "established": 2016,
        "facilities": ["Modern Campus", "Robotics & AI Labs", "Government Hostels"],
        "why_recommended": "Rapidly advancing state government engineering college with high academic standards in Vidarbha."
    },
    {
        "college_name": "Sinhgad College of Engineering (SCOE)",
        "location": "Vadgaon BK, Pune, Maharashtra",
        "stream": "Engineering",
        "branch": "Computer Engineering / IT",
        "college_type": "Private",
        "cutoff_marks": 87.5,
        "cutoff_percent": 87.5,
        "cutoff_rank": 31000,
        "annual_fees": 130000,
        "rating": 4.2,
        "nirf_rank": "NAAC A Grade (SPPU Affiliated)",
        "placement_avg": "₹5.8 LPA",
        "placement_high": "₹24.0 LPA",
        "established": 1996,
        "facilities": ["Massive Vadgaon Campus", "Central Library", "Sports Complex"],
        "why_recommended": "Renowned for extensive campus placement drives across hundreds of Pune software and engineering firms."
    },
    {
        "college_name": "Thakur College of Engineering and Technology (TCET)",
        "location": "Kandivali East, Mumbai, Maharashtra",
        "stream": "Engineering",
        "branch": "Information Technology / Computer Science",
        "college_type": "Private",
        "cutoff_marks": 89.2,
        "cutoff_percent": 89.2,
        "cutoff_rank": 28000,
        "annual_fees": 160000,
        "rating": 4.3,
        "nirf_rank": "Autonomous NAAC A",
        "placement_avg": "₹6.5 LPA",
        "placement_high": "₹30.0 LPA",
        "established": 2001,
        "facilities": ["Advanced Coding Center", "Seminar Halls", "Modern Infrastructure"],
        "why_recommended": "Top Western Suburbs autonomous institute in Mumbai offering high software placement consistency."
    }
]


def get_catalog_for_exam_and_stream(stream: str, exam_type: str = "") -> list:
    """Return an exact curated catalog tailored strictly to candidate exam type and stream."""
    exam_lower = (exam_type or "").lower()
    stream_lower = (stream or "").lower()

    if "advanced" in exam_lower:
        # JEE Advanced -> ONLY IITs
        return list(IIT_COLLEGES_CATALOG)
    elif "main" in exam_lower:
        # JEE Main -> NITs, IIITs, COEP Pune (All India Quota), DTU, NSUT (strictly NO IITs)
        return list(JEE_MAIN_COLLEGES_CATALOG)
    elif "cet" in exam_lower:
        # MHT-CET -> ONLY Maharashtra State CAP engineering colleges (strictly NO IITs or NITs)
        return list(MHT_CET_COLLEGES_CATALOG)
    elif "neet" in exam_lower or "med" in stream_lower:
        # NEET -> Medical & Dental colleges (AIIMS, GMCs)
        return list(FALLBACK_COLLEGE_CATALOG.get("Medical", []))
    else:
        matched = next((k for k in FALLBACK_COLLEGE_CATALOG.keys() if k.lower() == stream_lower), None)
        if matched:
            return list(FALLBACK_COLLEGE_CATALOG[matched])
        return list(JEE_MAIN_COLLEGES_CATALOG)


# Curated catalog covering AT LEAST 20 colleges for EVERY major Indian stream
FALLBACK_COLLEGE_CATALOG: Dict[str, List[Dict[str, Any]]] = {
    "Design": [
        {
            "college_name": "National Institute of Design (NID)",
            "location": "Ahmedabad, Gujarat",
            "stream": "Design",
            "branch": "B.Des Product / Interaction Design",
            "college_type": "Government",
            "cutoff_marks": 96.0,
            "cutoff_percent": 96.0,
            "annual_fees": 385000,
            "rating": 4.9,
            "nirf_rank": "National Institute of Importance",
            "placement_avg": "₹15.5 LPA",
            "placement_high": "₹45.0 LPA",
            "established": 1961,
            "facilities": ["Prototyping Labs", "Ergonomics Studio", "Design Archives", "Digital Workshop"],
            "why_recommended": "India's premier apex design institution renowned internationally for design leadership."
        },
        {
            "college_name": "Industrial Design Centre (IDC), IIT Bombay",
            "location": "Mumbai, Maharashtra",
            "stream": "Design",
            "branch": "B.Des Communication / Industrial Design",
            "college_type": "Government",
            "cutoff_marks": 97.5,
            "cutoff_percent": 97.5,
            "annual_fees": 250000,
            "rating": 4.9,
            "nirf_rank": "IIT Bombay Design Wing",
            "placement_avg": "₹18.0 LPA",
            "placement_high": "₹52.0 LPA",
            "established": 1969,
            "facilities": ["VR & Interaction Labs", "Rapid Prototyping", "Wood & Metal Studios"],
            "why_recommended": "Elite technical design school at IIT Bombay with stellar tech-design placements."
        },
        {
            "college_name": "National Institute of Fashion Technology (NIFT)",
            "location": "New Delhi, Delhi",
            "stream": "Design",
            "branch": "B.Des Fashion / Textile Design",
            "college_type": "Government",
            "cutoff_marks": 94.0,
            "cutoff_percent": 94.0,
            "annual_fees": 290000,
            "rating": 4.8,
            "nirf_rank": "NIFT Apex Campus #1",
            "placement_avg": "₹11.0 LPA",
            "placement_high": "₹32.0 LPA",
            "established": 1986,
            "facilities": ["Textile Testing Lab", "Pattern Making Studios", "Resource Centre"],
            "why_recommended": "Top fashion and lifestyle design college in India with prominent alumni."
        },
        {
            "college_name": "NIFT Mumbai",
            "location": "Navi Mumbai, Maharashtra",
            "stream": "Design",
            "branch": "B.Des Fashion Communication & Apparel Design",
            "college_type": "Government",
            "cutoff_marks": 92.5,
            "cutoff_percent": 92.5,
            "annual_fees": 290000,
            "rating": 4.7,
            "nirf_rank": "Top Ranked Fashion Institute",
            "placement_avg": "₹10.5 LPA",
            "placement_high": "₹28.0 LPA",
            "established": 1995,
            "facilities": ["Visual Merchandising Lab", "Knitwear Studio", "Design Runway"],
            "why_recommended": "Prime industry networking in India's commercial & fashion capital."
        },
        {
            "college_name": "National Institute of Design (NID)",
            "location": "Bengaluru, Karnataka",
            "stream": "Design",
            "branch": "Design for Digital Experience / Interaction",
            "college_type": "Government",
            "cutoff_marks": 93.0,
            "cutoff_percent": 93.0,
            "annual_fees": 360000,
            "rating": 4.8,
            "nirf_rank": "Institute of National Importance",
            "placement_avg": "₹14.0 LPA",
            "placement_high": "₹38.0 LPA",
            "established": 2006,
            "facilities": ["UX Research Lab", "IoT Prototyping", "Design Hub"],
            "why_recommended": "Strategic tech hub location with immediate recruitment by top tech and UX firms."
        },
        {
            "college_name": "MIT Institute of Design (MIT-ID)",
            "location": "Pune, Maharashtra",
            "stream": "Design",
            "branch": "B.Des User Experience (UX) / Product Design",
            "college_type": "Private",
            "cutoff_marks": 88.0,
            "cutoff_percent": 88.0,
            "annual_fees": 450000,
            "rating": 4.6,
            "nirf_rank": "Top Private Design School",
            "placement_avg": "₹9.5 LPA",
            "placement_high": "₹26.0 LPA",
            "established": 2006,
            "facilities": ["Automotive Clay Modeling", "XR Simulation Studio", "Innovation Lab"],
            "why_recommended": "Premier private design institute in Pune with exceptional UX/UI industry hiring."
        },
        {
            "college_name": "Symbiosis Institute of Design (SID)",
            "location": "Viman Nagar, Pune",
            "stream": "Design",
            "branch": "B.Des Communication / Industrial Design",
            "college_type": "Private",
            "cutoff_marks": 89.0,
            "cutoff_percent": 89.0,
            "annual_fees": 420000,
            "rating": 4.6,
            "nirf_rank": "Symbiosis Deemed University",
            "placement_avg": "₹8.8 LPA",
            "placement_high": "₹24.0 LPA",
            "established": 2006,
            "facilities": ["Animation Suites", "Photography Studio", "Makerspace"],
            "why_recommended": "High academic reputation with robust corporate design placements."
        },
        {
            "college_name": "Srishti Manipal Institute of Art, Design & Technology",
            "location": "Bengaluru, Karnataka",
            "stream": "Design",
            "branch": "B.Des Visual Communication & Digital Media",
            "college_type": "Private",
            "cutoff_marks": 86.0,
            "cutoff_percent": 86.0,
            "annual_fees": 440000,
            "rating": 4.5,
            "nirf_rank": "Manipal Academy Campus",
            "placement_avg": "₹8.2 LPA",
            "placement_high": "₹22.0 LPA",
            "established": 1996,
            "facilities": ["FabLab", "Printmaking Studio", "Sound Engineering Suite"],
            "why_recommended": "Renowned for creative freedom, interdisciplinary design, and global faculty."
        },
        {
            "college_name": "NIFT Bangalore",
            "location": "Bengaluru, Karnataka",
            "stream": "Design",
            "branch": "B.Des Textile & Accessory Design",
            "college_type": "Government",
            "cutoff_marks": 91.0,
            "cutoff_percent": 91.0,
            "annual_fees": 290000,
            "rating": 4.7,
            "nirf_rank": "Top Tier NIFT",
            "placement_avg": "₹9.8 LPA",
            "placement_high": "₹25.0 LPA",
            "established": 1997,
            "facilities": ["CAD Design Labs", "Leather Craft Lab", "Auditorium"],
            "why_recommended": "Strong synergy with Karnataka's apparel industry and modern product design startups."
        },
        {
            "college_name": "NID Madhya Pradesh",
            "location": "Bhopal, Madhya Pradesh",
            "stream": "Design",
            "branch": "B.Des Industrial & Communication Design",
            "college_type": "Government",
            "cutoff_marks": 89.5,
            "cutoff_percent": 89.5,
            "annual_fees": 320000,
            "rating": 4.6,
            "nirf_rank": "National Importance",
            "placement_avg": "₹11.5 LPA",
            "placement_high": "₹30.0 LPA",
            "established": 2019,
            "facilities": ["Modern Campus", "Model Making Labs", "Digital Fabrication"],
            "why_recommended": "Rapidly ascending autonomous NID campus with cutting-edge infrastructure."
        },
        {
            "college_name": "Department of Design, IIT Delhi",
            "location": "New Delhi, Delhi",
            "stream": "Design",
            "branch": "B.Des Design",
            "college_type": "Government",
            "cutoff_marks": 96.0,
            "cutoff_percent": 96.0,
            "annual_fees": 240000,
            "rating": 4.9,
            "nirf_rank": "IIT Delhi Faculty of Design",
            "placement_avg": "₹17.5 LPA",
            "placement_high": "₹48.0 LPA",
            "established": 2017,
            "facilities": ["Design Research Hub", "HCI Laboratory", "Mechatronics Lab"],
            "why_recommended": "Combines IIT Delhi technical rigor with futuristic user experience design."
        },
        {
            "college_name": "Department of Design, IIT Guwahati",
            "location": "Guwahati, Assam",
            "stream": "Design",
            "branch": "B.Des Electronic Product & Interaction Design",
            "college_type": "Government",
            "cutoff_marks": 94.5,
            "cutoff_percent": 94.5,
            "annual_fees": 230000,
            "rating": 4.8,
            "nirf_rank": "IIT Guwahati Wing",
            "placement_avg": "₹16.0 LPA",
            "placement_high": "₹42.0 LPA",
            "established": 1999,
            "facilities": ["Usability Engineering Lab", "Virtual Reality Lab", "Scenic Campus"],
            "why_recommended": "Oldest IIT design department for undergraduate B.Des with exceptional alumni."
        },
        {
            "college_name": "NID Haryana",
            "location": "Kurukshetra, Haryana",
            "stream": "Design",
            "branch": "B.Des Textile & Apparel Design",
            "college_type": "Government",
            "cutoff_marks": 88.0,
            "cutoff_percent": 88.0,
            "annual_fees": 320000,
            "rating": 4.5,
            "nirf_rank": "National Importance",
            "placement_avg": "₹10.5 LPA",
            "placement_high": "₹26.0 LPA",
            "established": 2016,
            "facilities": ["Digital Weaving Studio", "Design Library", "Hostels"],
            "why_recommended": "Dedicated design curriculum backed by central government standards."
        },
        {
            "college_name": "NID Andhra Pradesh",
            "location": "Amaravati, Andhra Pradesh",
            "stream": "Design",
            "branch": "B.Des Communication & Industrial Design",
            "college_type": "Government",
            "cutoff_marks": 87.0,
            "cutoff_percent": 87.0,
            "annual_fees": 320000,
            "rating": 4.5,
            "nirf_rank": "National Importance",
            "placement_avg": "₹10.0 LPA",
            "placement_high": "₹24.0 LPA",
            "established": 2015,
            "facilities": ["Studio Workshops", "IT Hub", "Cultural Center"],
            "why_recommended": "High-value public design education with state-of-the-art facilities."
        },
        {
            "college_name": "NIFT Hyderabad",
            "location": "Madhapur, Hyderabad",
            "stream": "Design",
            "branch": "B.Des Accessory & Fashion Design",
            "college_type": "Government",
            "cutoff_marks": 88.5,
            "cutoff_percent": 88.5,
            "annual_fees": 290000,
            "rating": 4.6,
            "nirf_rank": "Top NIFT Campus",
            "placement_avg": "₹9.0 LPA",
            "placement_high": "₹22.0 LPA",
            "established": 1995,
            "facilities": ["Leather & Metal Studio", "Design Labs", "Cyber Security"],
            "why_recommended": "Located in HITEC City with immense corporate access and lifestyle brand recruiters."
        },
        {
            "college_name": "NIFT Chennai",
            "location": "Taramani, Chennai",
            "stream": "Design",
            "branch": "B.Des Fashion & Knitwear Design",
            "college_type": "Government",
            "cutoff_marks": 87.5,
            "cutoff_percent": 87.5,
            "annual_fees": 290000,
            "rating": 4.5,
            "nirf_rank": "Top NIFT Campus",
            "placement_avg": "₹8.5 LPA",
            "placement_high": "₹20.0 LPA",
            "established": 1995,
            "facilities": ["Pattern Making Workshop", "Dyeing Lab", "Library"],
            "why_recommended": "Deep ties to South India's massive textile and export manufacturing giants."
        },
        {
            "college_name": "Pearl Academy",
            "location": "Mumbai, Maharashtra",
            "stream": "Design",
            "branch": "B.Des Fashion, Styling & Interior Design",
            "college_type": "Private",
            "cutoff_marks": 80.0,
            "cutoff_percent": 80.0,
            "annual_fees": 580000,
            "rating": 4.4,
            "nirf_rank": "Global Design Partner",
            "placement_avg": "₹7.8 LPA",
            "placement_high": "₹20.0 LPA",
            "established": 1993,
            "facilities": ["Glamour Studio", "Fashion Runway", "Audio-Visual Labs"],
            "why_recommended": "High celebrity and luxury industry exposure in the media heart of Mumbai."
        },
        {
            "college_name": "Unitedworld Institute of Design (UID)",
            "location": "Gandhinagar, Gujarat",
            "stream": "Design",
            "branch": "B.Des Visual & Automobile Design",
            "college_type": "Private",
            "cutoff_marks": 81.0,
            "cutoff_percent": 81.0,
            "annual_fees": 480000,
            "rating": 4.4,
            "nirf_rank": "Karnavati University",
            "placement_avg": "₹7.5 LPA",
            "placement_high": "₹18.0 LPA",
            "established": 2012,
            "facilities": ["Automotive Clay Studio", "Laser Cutting Lab", "Hostels"],
            "why_recommended": "Massive dedicated design campus with modern prototyping equipment."
        },
        {
            "college_name": "UPES School of Design",
            "location": "Dehradun, Uttarakhand",
            "stream": "Design",
            "branch": "B.Des Transportation & Game Design",
            "college_type": "Private",
            "cutoff_marks": 79.0,
            "cutoff_percent": 79.0,
            "annual_fees": 410000,
            "rating": 4.3,
            "nirf_rank": "NIRF Top 100",
            "placement_avg": "₹7.2 LPA",
            "placement_high": "₹18.5 LPA",
            "established": 2013,
            "facilities": ["Transportation Studio", "Motion Capture Lab", "Campus Wi-Fi"],
            "why_recommended": "Specialized curriculum for automotive styling, mobility design, and game design."
        },
        {
            "college_name": "NIFT Kolkata",
            "location": "Salt Lake, Kolkata",
            "stream": "Design",
            "branch": "B.Des Leather Design & Fashion Technology",
            "college_type": "Government",
            "cutoff_marks": 86.0,
            "cutoff_percent": 86.0,
            "annual_fees": 290000,
            "rating": 4.5,
            "nirf_rank": "Government Central NIFT",
            "placement_avg": "₹8.0 LPA",
            "placement_high": "₹19.0 LPA",
            "established": 1995,
            "facilities": ["Leather Processing Lab", "Fashion Studio", "Resource Center"],
            "why_recommended": "Premier public design institute in Eastern India with affordable fee structure."
        },
        {
            "college_name": "Vellore Institute of Technology (VIT School of Design)",
            "location": "Vellore, Tamil Nadu",
            "stream": "Design",
            "branch": "B.Des Industrial & Graphic Design",
            "college_type": "Private",
            "cutoff_marks": 83.0,
            "cutoff_percent": 83.0,
            "annual_fees": 285000,
            "rating": 4.4,
            "nirf_rank": "NIRF #11 Overall",
            "placement_avg": "₹7.8 LPA",
            "placement_high": "₹21.0 LPA",
            "established": 2018,
            "facilities": ["Digital Media Lab", "Ergonomics Unit", "Smart Classrooms"],
            "why_recommended": "High corporate placement machinery of VIT integrated into professional design courses."
        }
    ],

    "Medical": [
        {
            "college_name": "All India Institute of Medical Sciences (AIIMS)",
            "location": "Ansari Nagar, New Delhi",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 99.5,
            "cutoff_percent": 99.5,
            "cutoff_neet": 705,
            "annual_fees": 5856,
            "rating": 4.9,
            "nirf_rank": "NIRF Rank #1 (Medical)",
            "placement_avg": "AIIMS Residency / Global Fellowships",
            "placement_high": "100% Top PG Selections",
            "established": 1956,
            "facilities": ["Super-Specialty Hospital", "Genomics Research", "Trauma Center", "Centenary Library"],
            "why_recommended": "India's supreme medical institution with nominal fees and world-renowned clinical exposure."
        },
        {
            "college_name": "Christian Medical College (CMC)",
            "location": "Vellore, Tamil Nadu",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Private",
            "cutoff_marks": 98.0,
            "cutoff_percent": 98.0,
            "cutoff_neet": 675,
            "annual_fees": 52000,
            "rating": 4.9,
            "nirf_rank": "NIRF Rank #3 (Medical)",
            "placement_avg": "CMC Hospital (2800 Beds)",
            "placement_high": "Global Post-Graduation Matches",
            "established": 1900,
            "facilities": ["Stem Cell Research", "Advanced Oncology", "Rural Health Centers"],
            "why_recommended": "Globally respected missionary hospital providing ethical medical training and heavy patient flow."
        },
        {
            "college_name": "Seth G.S. Medical College & KEM Hospital",
            "location": "Parel, Mumbai",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 97.0,
            "cutoff_percent": 97.0,
            "cutoff_neet": 665,
            "annual_fees": 130000,
            "rating": 4.9,
            "nirf_rank": "State Rank #1 (Maharashtra)",
            "placement_avg": "KEM Hospital (1800 Beds)",
            "placement_high": "98% PG Selection Rate",
            "established": 1926,
            "facilities": ["ICU Simulation", "Organ Transplant Unit", "Research Hub"],
            "why_recommended": "Most revered government medical institute in western India with immense surgical exposure."
        },
        {
            "college_name": "Grant Government Medical College & Sir JJ Hospital",
            "location": "Byculla, Mumbai",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 96.0,
            "cutoff_percent": 96.0,
            "cutoff_neet": 655,
            "annual_fees": 125000,
            "rating": 4.8,
            "nirf_rank": "NIRF Top 20",
            "placement_avg": "Sir JJ Hospital (3000 Beds)",
            "placement_high": "Top PG Residency Selection",
            "established": 1845,
            "facilities": ["Trauma Center", "Historic Library", "Pathology Museum"],
            "why_recommended": "One of Asia's oldest medical colleges with unmatched clinical caseload and surgical training."
        },
        {
            "college_name": "Armed Forces Medical College (AFMC)",
            "location": "Wanowrie, Pune",
            "stream": "Medical",
            "branch": "MBBS (Commissioned Officer)",
            "college_type": "Government",
            "cutoff_marks": 95.5,
            "cutoff_percent": 95.5,
            "cutoff_neet": 645,
            "annual_fees": 65000,
            "rating": 4.9,
            "nirf_rank": "NIRF Top 5 Medical",
            "placement_avg": "Indian Armed Forces (Captain)",
            "placement_high": "100% Commissioned Placement",
            "established": 1948,
            "facilities": ["Command Hospital", "Sports Stadium", "Military Medical Labs"],
            "why_recommended": "Prestigious defense medical college providing full sponsorship and guaranteed officer commission."
        },
        {
            "college_name": "B.J. Government Medical College (BJMC)",
            "location": "Pune, Maharashtra",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 94.5,
            "cutoff_percent": 94.5,
            "cutoff_neet": 640,
            "annual_fees": 120000,
            "rating": 4.7,
            "nirf_rank": "Premier Government College",
            "placement_avg": "Sassoon General Hospital (1300 Beds)",
            "placement_high": "High PG Selection",
            "established": 1946,
            "facilities": ["Sassoon Hospital", "Advanced Burn Unit", "Central Diagnostics"],
            "why_recommended": "Leading Pune government medical college with round-the-clock emergency medical cases."
        },
        {
            "college_name": "Maulana Azad Medical College (MAMC)",
            "location": "New Delhi, Delhi",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 99.0,
            "cutoff_percent": 99.0,
            "cutoff_neet": 690,
            "annual_fees": 15000,
            "rating": 4.9,
            "nirf_rank": "NIRF Top 5",
            "placement_avg": "LNJP Hospital (2000 Beds)",
            "placement_high": "Top USMLE & PG Matches",
            "established": 1958,
            "facilities": ["GB Pant Hospital", "Super-Specialty Cardiology", "Research Center"],
            "why_recommended": "Apex Delhi state medical institution famous for extremely high NEET cutoff percentiles."
        },
        {
            "college_name": "King George's Medical University (KGMU)",
            "location": "Lucknow, Uttar Pradesh",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 95.0,
            "cutoff_percent": 95.0,
            "cutoff_neet": 650,
            "annual_fees": 60000,
            "rating": 4.8,
            "nirf_rank": "NIRF Top 12 Medical",
            "placement_avg": "KGMU Hospital (4500 Beds)",
            "placement_high": "Pinnacle Residency Record",
            "established": 1905,
            "facilities": ["Trauma Center", "Centenary Hospital", "Organ Transplant Unit"],
            "why_recommended": "Northern India's largest medical university offering vast clinical cases and research."
        },
        {
            "college_name": "Lokmanya Tilak Municipal Medical College (Sion)",
            "location": "Sion, Mumbai",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 93.5,
            "cutoff_percent": 93.5,
            "cutoff_neet": 635,
            "annual_fees": 125000,
            "rating": 4.7,
            "nirf_rank": "Top Tier Municipal College",
            "placement_avg": "LTMG Hospital (1400 Beds)",
            "placement_high": "Superb Critical Care Cases",
            "established": 1964,
            "facilities": ["First Trauma Care in India", "Skin Bank", "Neonatal ICU"],
            "why_recommended": "Pioneered trauma emergency services in India; renowned for critical care exposure."
        },
        {
            "college_name": "Topiwala National Medical College (Nair Hospital)",
            "location": "Mumbai Central, Mumbai",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 93.0,
            "cutoff_percent": 93.0,
            "cutoff_neet": 630,
            "annual_fees": 125000,
            "rating": 4.7,
            "nirf_rank": "Municipal Premier College",
            "placement_avg": "BYL Nair Hospital (1600 Beds)",
            "placement_high": "95% PG Residency",
            "established": 1921,
            "facilities": ["Hyperbaric Oxygen Unit", "Audiology Center", "Central Lab"],
            "why_recommended": "Historic South Mumbai medical college with prominent clinical faculties."
        },
        {
            "college_name": "JIPMER",
            "location": "Puducherry, Puducherry",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 98.5,
            "cutoff_percent": 98.5,
            "cutoff_neet": 680,
            "annual_fees": 25000,
            "rating": 4.9,
            "nirf_rank": "Institute of National Importance",
            "placement_avg": "JIPMER Hospitals (2100 Beds)",
            "placement_high": "Global PG Research",
            "established": 1823,
            "facilities": ["Super-Specialty Block", "Robotic Surgery", "Digital Anatomy"],
            "why_recommended": "Autonomous central institute offering subsidized elite medical education and research."
        },
        {
            "college_name": "Institute of Medical Sciences, BHU",
            "location": "Varanasi, Uttar Pradesh",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 97.0,
            "cutoff_percent": 97.0,
            "cutoff_neet": 665,
            "annual_fees": 40000,
            "rating": 4.8,
            "nirf_rank": "NIRF Top 8 Medical",
            "placement_avg": "Sir Sunderlal Hospital (1800 Beds)",
            "placement_high": "High NEET PG/INICET Ranks",
            "established": 1960,
            "facilities": ["Ayush Center", "Trauma Center", "Cancer Hospital"],
            "why_recommended": "Prestigious central university campus with extensive tertiary care medical facilities."
        },
        {
            "college_name": "Madras Medical College",
            "location": "Chennai, Tamil Nadu",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 96.5,
            "cutoff_percent": 96.5,
            "cutoff_neet": 660,
            "annual_fees": 35000,
            "rating": 4.8,
            "nirf_rank": "NIRF Top 15",
            "placement_avg": "Rajiv Gandhi Govt Hospital (2700 Beds)",
            "placement_high": "Top Fellowship Selection",
            "established": 1835,
            "facilities": ["Oldest Medical Hall", "Rheumatology Unit", "ICU Facility"],
            "why_recommended": "One of India's earliest medical colleges with exceptional historical and clinical standing."
        },
        {
            "college_name": "Bangalore Medical College & Research Institute (BMCRI)",
            "location": "Bengaluru, Karnataka",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 95.5,
            "cutoff_percent": 95.5,
            "cutoff_neet": 650,
            "annual_fees": 60000,
            "rating": 4.8,
            "nirf_rank": "NIRF Top 20",
            "placement_avg": "Victoria Hospital (2000 Beds)",
            "placement_high": "Excellent PG Placements",
            "established": 1955,
            "facilities": ["Victoria & Bowring Hospitals", "Trauma Unit", "Genetics Lab"],
            "why_recommended": "Karnataka's foremost government medical college affiliated with 4 multi-specialty hospitals."
        },
        {
            "college_name": "Government Medical College (GMC), Nagpur",
            "location": "Nagpur, Maharashtra",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 92.0,
            "cutoff_percent": 92.0,
            "cutoff_neet": 620,
            "annual_fees": 115000,
            "rating": 4.6,
            "nirf_rank": "Historic Government Institute",
            "placement_avg": "GMC Hospital (1400 Beds)",
            "placement_high": "Regional Medical Anchor",
            "established": 1947,
            "facilities": ["Asia's Largest Campus Area", "Trauma Hub", "Auditorium"],
            "why_recommended": "Central India's oldest medical college serving massive patient footfall across 3 states."
        },
        {
            "college_name": "Indira Gandhi Government Medical College (IGGMC)",
            "location": "Nagpur, Maharashtra",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 90.5,
            "cutoff_percent": 90.5,
            "cutoff_neet": 610,
            "annual_fees": 115000,
            "rating": 4.5,
            "nirf_rank": "State Government Institute",
            "placement_avg": "Mayo Hospital (900 Beds)",
            "placement_high": "88% PG Matches",
            "established": 1968,
            "facilities": ["Mayo Hospital", "CT/MRI Suite", "Modern Lecture Halls"],
            "why_recommended": "Prominent state government medical college offering solid practical surgical training."
        },
        {
            "college_name": "Government Medical College, Chhatrapati Sambhajinagar",
            "location": "Chhatrapati Sambhajinagar, Maharashtra",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Government",
            "cutoff_marks": 89.5,
            "cutoff_percent": 89.5,
            "cutoff_neet": 605,
            "annual_fees": 115000,
            "rating": 4.5,
            "nirf_rank": "Marathwada Apex Hospital",
            "placement_avg": "Ghati Hospital (1100 Beds)",
            "placement_high": "85% PG Matches",
            "established": 1956,
            "facilities": ["Ghati Hospital", "Regional Cancer Center", "Blood Bank"],
            "why_recommended": "Marathwada's premier tertiary healthcare hub with vast clinical bed capacity."
        },
        {
            "college_name": "St. John's Medical College",
            "location": "Koramangala, Bengaluru",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Private",
            "cutoff_marks": 92.5,
            "cutoff_percent": 92.5,
            "cutoff_neet": 625,
            "annual_fees": 680000,
            "rating": 4.7,
            "nirf_rank": "NIRF Top 15",
            "placement_avg": "St. John's Hospital (1350 Beds)",
            "placement_high": "Global Research Fellowships",
            "established": 1963,
            "facilities": ["Research Institute", "Bioethics Wing", "Simulation Lab"],
            "why_recommended": "Elite autonomous private medical college celebrated for biomedical research and ethics."
        },
        {
            "college_name": "Kasturba Medical College (KMC)",
            "location": "Manipal, Karnataka",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Private",
            "cutoff_marks": 88.0,
            "cutoff_percent": 88.0,
            "cutoff_neet": 590,
            "annual_fees": 1450000,
            "rating": 4.6,
            "nirf_rank": "NIRF Top 10 Medical",
            "placement_avg": "Kasturba Hospital (2000 Beds)",
            "placement_high": "Highest USMLE Pass Rate",
            "established": 1953,
            "facilities": ["World-Class Anatomy Museum", "Simulation Center", "Hostels"],
            "why_recommended": "India's premier private medical college renowned globally for residency placements in US & UK."
        },
        {
            "college_name": "Dr. D.Y. Patil Medical College & Hospital",
            "location": "Pimpri, Pune",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Private",
            "cutoff_marks": 78.0,
            "cutoff_percent": 78.0,
            "cutoff_neet": 485,
            "annual_fees": 2500000,
            "rating": 4.4,
            "nirf_rank": "NIRF Top 20 Medical",
            "placement_avg": "DY Patil Hospital (2000 Beds)",
            "placement_high": "Corporate Multi-Specialty Network",
            "established": 1996,
            "facilities": ["Robotic Surgery Wing", "Asia's Largest Simulation Lab", "Air-conditioned Hostels"],
            "why_recommended": "High-tech private university with advanced surgical robotics and massive infrastructure."
        },
        {
            "college_name": "Bharati Vidyapeeth Deemed University Medical College",
            "location": "Katraj, Pune",
            "stream": "Medical",
            "branch": "MBBS",
            "college_type": "Private",
            "cutoff_marks": 81.0,
            "cutoff_percent": 81.0,
            "cutoff_neet": 510,
            "annual_fees": 2100000,
            "rating": 4.3,
            "nirf_rank": "NAAC A+ Accredited",
            "placement_avg": "Bharati Hospital (1000 Beds)",
            "placement_high": "80% Residency Selection",
            "established": 1989,
            "facilities": ["Pediatric ICU", "Modern OT Complex", "Central Research Lab"],
            "why_recommended": "Well-established deemed medical college with active patient outreach in southern Pune."
        }
    ],

    "Engineering": [
        {
            "college_name": "Indian Institute of Technology (IIT Bombay)",
            "location": "Powai, Mumbai",
            "stream": "Engineering",
            "branch": "Computer Science & Engineering",
            "college_type": "Government",
            "cutoff_marks": 99.8,
            "cutoff_percent": 99.8,
            "cutoff_rank": 800,
            "annual_fees": 250000,
            "rating": 4.9,
            "nirf_rank": "NIRF Rank #3 (Overall #1 West)",
            "placement_avg": "₹21.5 LPA",
            "placement_high": "₹1.68 Cr PA",
            "established": 1958,
            "facilities": ["Nanotech Center", "Supercomputing Cluster", "Techfest Campus"],
            "why_recommended": "India's highest cut-off engineering institute with premier global brand value."
        },
        {
            "college_name": "COEP Technological University",
            "location": "Shivajinagar, Pune",
            "stream": "Engineering",
            "branch": "Computer Engineering / IT",
            "college_type": "Government",
            "cutoff_marks": 99.4,
            "cutoff_percent": 99.4,
            "cutoff_rank": 3500,
            "annual_fees": 90000,
            "rating": 4.8,
            "nirf_rank": "State Rank #1 (NIRF Top 50)",
            "placement_avg": "₹11.5 LPA",
            "placement_high": "₹50.5 LPA",
            "established": 1854,
            "facilities": ["Boat Club", "AI Research Lab", "High-Tech Campus", "Central Library"],
            "why_recommended": "Historic government engineering pioneer in Maharashtra with top-tier recruitment."
        },
        {
            "college_name": "Veermata Jijabai Technological Institute (VJTI)",
            "location": "Matunga, Mumbai",
            "stream": "Engineering",
            "branch": "Computer Engineering & Data Science",
            "college_type": "Government",
            "cutoff_marks": 99.2,
            "cutoff_percent": 99.2,
            "cutoff_rank": 4200,
            "annual_fees": 85000,
            "rating": 4.7,
            "nirf_rank": "NIRF Top 100",
            "placement_avg": "₹12.8 LPA",
            "placement_high": "₹62.0 LPA",
            "established": 1887,
            "facilities": ["Incubation Center", "Hostels", "Robotics Lab", "Wi-Fi Campus"],
            "why_recommended": "Elite technical institute in the heart of Mumbai with premier corporate hiring."
        },
        {
            "college_name": "BITS Pilani",
            "location": "Pilani, Rajasthan",
            "stream": "Engineering",
            "branch": "B.E. Computer Science",
            "college_type": "Private",
            "cutoff_marks": 98.8,
            "cutoff_percent": 98.8,
            "cutoff_rank": 2500,
            "annual_fees": 540000,
            "rating": 4.8,
            "nirf_rank": "Institute of Eminence",
            "placement_avg": "₹19.5 LPA",
            "placement_high": "₹60.0 LPA",
            "established": 1964,
            "facilities": ["Practice School System", "Student Satellite Lab", "Innovation Hub"],
            "why_recommended": "Top private engineering university in India with zero-attendance policy and massive alumni."
        },
        {
            "college_name": "Sardar Patel Institute of Technology (SPIT)",
            "location": "Andheri West, Mumbai",
            "stream": "Engineering",
            "branch": "Computer Science & Engineering",
            "college_type": "Private",
            "cutoff_marks": 98.6,
            "cutoff_percent": 98.6,
            "cutoff_rank": 6500,
            "annual_fees": 170000,
            "rating": 4.6,
            "nirf_rank": "NIRF Top 150",
            "placement_avg": "₹14.2 LPA",
            "placement_high": "₹42.0 LPA",
            "established": 2005,
            "facilities": ["Fintech Lab", "Maker Space", "Auditorium", "Smart Classrooms"],
            "why_recommended": "Exceptional coding culture with high placement averages and corporate links."
        },
        {
            "college_name": "Pune Institute of Computer Technology (PICT)",
            "location": "Dhankawadi, Pune",
            "stream": "Engineering",
            "branch": "Computer Engineering / AI & DS",
            "college_type": "Private",
            "cutoff_marks": 98.4,
            "cutoff_percent": 98.4,
            "cutoff_rank": 7200,
            "annual_fees": 110000,
            "rating": 4.6,
            "nirf_rank": "State Renowned CS Hub",
            "placement_avg": "₹12.0 LPA",
            "placement_high": "₹45.0 LPA",
            "established": 1983,
            "facilities": ["Supercomputer Lab", "Coding Arena", "Placement Center"],
            "why_recommended": "Premier software coding powerhouse of Pune producing hundreds of SDEs annually."
        },
        {
            "college_name": "National Institute of Technology (NIT Trichy)",
            "location": "Tiruchirappalli, Tamil Nadu",
            "stream": "Engineering",
            "branch": "Computer Science & Engineering",
            "college_type": "Government",
            "cutoff_marks": 99.1,
            "cutoff_percent": 99.1,
            "cutoff_rank": 4800,
            "annual_fees": 150000,
            "rating": 4.8,
            "nirf_rank": "NIRF Rank #1 Among NITs",
            "placement_avg": "₹15.8 LPA",
            "placement_high": "₹55.0 LPA",
            "established": 1964,
            "facilities": ["Octagon Computer Center", "High-Speed LAN", "Modern Hostels"],
            "why_recommended": "India's top-ranked National Institute of Technology with nationwide prestige."
        },
        {
            "college_name": "NIT Surathkal",
            "location": "Mangaluru, Karnataka",
            "stream": "Engineering",
            "branch": "Information Technology",
            "college_type": "Government",
            "cutoff_marks": 98.9,
            "cutoff_percent": 98.9,
            "cutoff_rank": 5500,
            "annual_fees": 150000,
            "rating": 4.7,
            "nirf_rank": "NIRF Top 12 Engineering",
            "placement_avg": "₹15.2 LPA",
            "placement_high": "₹54.0 LPA",
            "established": 1960,
            "facilities": ["Beachside Campus", "Supercomputing Lab", "Incubation Hub"],
            "why_recommended": "Premier coastal technical institute offering top placements and scenic campus life."
        },
        {
            "college_name": "Walchand College of Engineering",
            "location": "Sangli, Maharashtra",
            "stream": "Engineering",
            "branch": "Computer Science & Engineering",
            "college_type": "Government",
            "cutoff_marks": 97.2,
            "cutoff_percent": 97.2,
            "cutoff_rank": 11000,
            "annual_fees": 85000,
            "rating": 4.5,
            "nirf_rank": "Historic Autonomous College",
            "placement_avg": "₹9.8 LPA",
            "placement_high": "₹36.0 LPA",
            "established": 1947,
            "facilities": ["Microprocessor Lab", "Central Library", "Hostels"],
            "why_recommended": "Autonomous heritage college renowned for core engineering and software hiring."
        },
        {
            "college_name": "Vishwakarma Institute of Technology (VIT)",
            "location": "Bibwewadi, Pune",
            "stream": "Engineering",
            "branch": "Computer Engineering / AI",
            "college_type": "Private",
            "cutoff_marks": 96.8,
            "cutoff_percent": 96.8,
            "cutoff_rank": 12500,
            "annual_fees": 190000,
            "rating": 4.5,
            "nirf_rank": "Autonomous NAAC A++",
            "placement_avg": "₹9.2 LPA",
            "placement_high": "₹38.0 LPA",
            "established": 1983,
            "facilities": ["Robotics Center", "Placement Complex", "Wi-Fi Campus"],
            "why_recommended": "Leading autonomous engineering college in Pune with active corporate collaborations."
        },
        {
            "college_name": "D.J. Sanghvi College of Engineering",
            "location": "Vile Parle, Mumbai",
            "stream": "Engineering",
            "branch": "Computer Engineering",
            "college_type": "Private",
            "cutoff_marks": 97.8,
            "cutoff_percent": 97.8,
            "cutoff_rank": 9800,
            "annual_fees": 220000,
            "rating": 4.5,
            "nirf_rank": "Top Mumbai Autonomous",
            "placement_avg": "₹11.0 LPA",
            "placement_high": "₹40.0 LPA",
            "established": 1994,
            "facilities": ["Modern Coding Labs", "Incubation Center", "Sports Facilities"],
            "why_recommended": "High academic caliber and prime Mumbai location attracting prominent IT recruiters."
        },
        {
            "college_name": "Thadomal Shahani Engineering College (TSEC)",
            "location": "Bandra, Mumbai",
            "stream": "Engineering",
            "branch": "Information Technology / AI & DS",
            "college_type": "Private",
            "cutoff_marks": 95.8,
            "cutoff_percent": 95.8,
            "cutoff_rank": 14000,
            "annual_fees": 195000,
            "rating": 4.4,
            "nirf_rank": "Mumbai University Affiliated",
            "placement_avg": "₹9.5 LPA",
            "placement_high": "₹34.0 LPA",
            "established": 1983,
            "facilities": ["Tech Hub", "Auditorium", "Library"],
            "why_recommended": "Located in Bandra with solid tech placements across financial and IT firms."
        },
        {
            "college_name": "Cummins College of Engineering for Women",
            "location": "Karve Nagar, Pune",
            "stream": "Engineering",
            "branch": "Computer Engineering",
            "college_type": "Private",
            "cutoff_marks": 95.2,
            "cutoff_percent": 95.2,
            "cutoff_rank": 15500,
            "annual_fees": 175000,
            "rating": 4.5,
            "nirf_rank": "India's #1 Women's Engineering College",
            "placement_avg": "₹10.2 LPA",
            "placement_high": "₹43.0 LPA",
            "established": 1991,
            "facilities": ["Mechanical Workshop", "Hostels", "Gymnasium"],
            "why_recommended": "Empowering women in engineering with top MNCs visiting specifically for diversity hiring."
        },
        {
            "college_name": "Pimpri Chinchwad College of Engineering (PCCOE)",
            "location": "Akurdi, Pune",
            "stream": "Engineering",
            "branch": "Computer Engineering",
            "college_type": "Private",
            "cutoff_marks": 94.8,
            "cutoff_percent": 94.8,
            "cutoff_rank": 16800,
            "annual_fees": 140000,
            "rating": 4.4,
            "nirf_rank": "Autonomous NAAC A",
            "placement_avg": "₹7.8 LPA",
            "placement_high": "₹32.0 LPA",
            "established": 1999,
            "facilities": ["Central Placement Cell", "Innovation Cell", "Sports Ground"],
            "why_recommended": "Famous for massive placement drives across Pune and Pimpri-Chinchwad tech corridor."
        },
        {
            "college_name": "MIT World Peace University (MIT-WPU)",
            "location": "Kothrud, Pune",
            "stream": "Engineering",
            "branch": "B.Tech Computer Science & Engineering",
            "college_type": "Private",
            "cutoff_marks": 92.5,
            "cutoff_percent": 92.5,
            "cutoff_rank": 22000,
            "annual_fees": 320000,
            "rating": 4.4,
            "nirf_rank": "State Private University",
            "placement_avg": "₹8.5 LPA",
            "placement_high": "₹44.0 LPA",
            "established": 1983,
            "facilities": ["World Peace Dome", "High-Tech Classrooms", "Modern Labs"],
            "why_recommended": "Vast infrastructure with holistic curriculum and dedicated campus recruitment."
        },
        {
            "college_name": "Government College of Engineering, Aurangabad",
            "location": "Chhatrapati Sambhajinagar, Maharashtra",
            "stream": "Engineering",
            "branch": "Computer Science & Engineering",
            "college_type": "Government",
            "cutoff_marks": 92.8,
            "cutoff_percent": 92.8,
            "cutoff_rank": 21000,
            "annual_fees": 75000,
            "rating": 4.4,
            "nirf_rank": "State Autonomous Institute",
            "placement_avg": "₹7.5 LPA",
            "placement_high": "₹28.0 LPA",
            "established": 1960,
            "facilities": ["CAD Center", "Auditorium", "Campus Hostels"],
            "why_recommended": "Affordable autonomous government institute with strong engineering faculty."
        },
        {
            "college_name": "K.J. Somaiya College of Engineering",
            "location": "Vidyavihar, Mumbai",
            "stream": "Engineering",
            "branch": "Computer Engineering",
            "college_type": "Private",
            "cutoff_marks": 94.0,
            "cutoff_percent": 94.0,
            "cutoff_rank": 18000,
            "annual_fees": 350000,
            "rating": 4.4,
            "nirf_rank": "Somaiya Vidyavihar University",
            "placement_avg": "₹8.8 LPA",
            "placement_high": "₹30.0 LPA",
            "established": 1983,
            "facilities": ["Massive Green Campus", "FabLab", "Olympic Sports Complex"],
            "why_recommended": "Vast 65-acre campus in Mumbai offering multidisciplinary engineering degrees."
        },
        {
            "college_name": "Vellore Institute of Technology (VIT Vellore)",
            "location": "Vellore, Tamil Nadu",
            "stream": "Engineering",
            "branch": "B.Tech Computer Science & Engineering",
            "college_type": "Private",
            "cutoff_marks": 94.5,
            "cutoff_percent": 94.5,
            "cutoff_rank": 15000,
            "annual_fees": 280000,
            "rating": 4.5,
            "nirf_rank": "NIRF Top 11 Engineering",
            "placement_avg": "₹9.5 LPA",
            "placement_high": "₹1.02 Cr PA",
            "established": 1984,
            "facilities": ["Smart Campus", "Tech Park", "International Hostels"],
            "why_recommended": "Superb corporate recruitment pipeline with thousands of engineering job offers annually."
        },
        {
            "college_name": "Government College of Engineering, Amravati",
            "location": "Amravati, Maharashtra",
            "stream": "Engineering",
            "branch": "Computer Science & Engineering",
            "college_type": "Government",
            "cutoff_marks": 91.5,
            "cutoff_percent": 91.5,
            "cutoff_rank": 24000,
            "annual_fees": 75000,
            "rating": 4.3,
            "nirf_rank": "State Autonomous",
            "placement_avg": "₹6.8 LPA",
            "placement_high": "₹22.0 LPA",
            "established": 1964,
            "facilities": ["Workshop Complex", "Hostels", "Library"],
            "why_recommended": "Prominent Vidarbha government institution offering low tuition and reliable placements."
        },
        {
            "college_name": "SRM Institute of Science and Technology",
            "location": "Kattankulathur, Chennai",
            "stream": "Engineering",
            "branch": "B.Tech Computer Science & Engineering",
            "college_type": "Private",
            "cutoff_marks": 89.0,
            "cutoff_percent": 89.0,
            "cutoff_rank": 28000,
            "annual_fees": 260000,
            "rating": 4.3,
            "nirf_rank": "NIRF Top 25 Engineering",
            "placement_avg": "₹7.5 LPA",
            "placement_high": "₹45.0 LPA",
            "established": 1985,
            "facilities": ["Hi-Tech IT Park", "Supercomputer Facility", "Hostels"],
            "why_recommended": "Large campus with active tech recruiting drives by global IT and consulting firms."
        },
        {
            "college_name": "Vishwakarma Institute of Information Technology (VIIT)",
            "location": "Kondhwa, Pune",
            "stream": "Engineering",
            "branch": "Computer Engineering / AI & DS",
            "college_type": "Private",
            "cutoff_marks": 93.5,
            "cutoff_percent": 93.5,
            "cutoff_rank": 19000,
            "annual_fees": 170000,
            "rating": 4.4,
            "nirf_rank": "Autonomous NAAC A+",
            "placement_avg": "₹7.5 LPA",
            "placement_high": "₹33.0 LPA",
            "established": 2002,
            "facilities": ["Modern Coding Labs", "Incubation Center", "Sports Grounds"],
            "why_recommended": "Sister institute of VIT Pune sharing centralized placement assistance and high IT recruitment."
        },
        {
            "college_name": "Fr. Conceicao Rodrigues College of Engineering (CRCE)",
            "location": "Bandra West, Mumbai",
            "stream": "Engineering",
            "branch": "Computer Engineering",
            "college_type": "Private",
            "cutoff_marks": 93.8,
            "cutoff_percent": 93.8,
            "cutoff_rank": 18500,
            "annual_fees": 160000,
            "rating": 4.4,
            "nirf_rank": "Premier Mumbai Engineering",
            "placement_avg": "₹8.2 LPA",
            "placement_high": "₹35.0 LPA",
            "established": 1984,
            "facilities": ["Bandra Seaside Campus", "Robotics Lab", "E-Cell"],
            "why_recommended": "Sought-after Bandra institution with strong connections to Mumbai financial and tech sectors."
        },
        {
            "college_name": "Vidyalankar Institute of Technology (VIT Wadala)",
            "location": "Wadala, Mumbai",
            "stream": "Engineering",
            "branch": "Information Technology / Computer Engineering",
            "college_type": "Private",
            "cutoff_marks": 91.2,
            "cutoff_percent": 91.2,
            "cutoff_rank": 24500,
            "annual_fees": 155000,
            "rating": 4.3,
            "nirf_rank": "NAAC A+ Accredited",
            "placement_avg": "₹6.8 LPA",
            "placement_high": "₹28.0 LPA",
            "established": 1999,
            "facilities": ["State-of-the-Art Apple Lab", "Cinema Theater Classrooms", "Cafeteria"],
            "why_recommended": "Award-winning campus design with cutting-edge software and electronics laboratory facilities."
        },
        {
            "college_name": "Government College of Engineering, Karad (GCE Karad)",
            "location": "Karad, Satara, Maharashtra",
            "stream": "Engineering",
            "branch": "Information Technology / Mechanical",
            "college_type": "Government",
            "cutoff_marks": 90.5,
            "cutoff_percent": 90.5,
            "cutoff_rank": 26000,
            "annual_fees": 72000,
            "rating": 4.3,
            "nirf_rank": "State Autonomous Government",
            "placement_avg": "₹6.5 LPA",
            "placement_high": "₹25.0 LPA",
            "established": 1960,
            "facilities": ["Vast Green Campus", "Central Library", "Government Hostels"],
            "why_recommended": "Premier autonomous government engineering college in western Maharashtra with nominal fees."
        },
        {
            "college_name": "Shri Guru Gobind Singhji Institute of Engineering & Technology (SGGSIE&T)",
            "location": "Nanded, Maharashtra",
            "stream": "Engineering",
            "branch": "Computer Science & Engineering",
            "college_type": "Government",
            "cutoff_marks": 89.8,
            "cutoff_percent": 89.8,
            "cutoff_rank": 27500,
            "annual_fees": 70000,
            "rating": 4.3,
            "nirf_rank": "State Autonomous Institute",
            "placement_avg": "₹6.2 LPA",
            "placement_high": "₹24.0 LPA",
            "established": 1981,
            "facilities": ["VLSI Design Center", "Center for Excellence", "Spacious Hostels"],
            "why_recommended": "Pioneering state government-aided autonomous institute with dedicated industry-sponsored research."
        },
        {
            "college_name": "Dr. D.Y. Patil Institute of Technology",
            "location": "Pimpri, Pune",
            "stream": "Engineering",
            "branch": "Computer Engineering / AI & Data Science",
            "college_type": "Private",
            "cutoff_marks": 88.5,
            "cutoff_percent": 88.5,
            "cutoff_rank": 29000,
            "annual_fees": 135000,
            "rating": 4.2,
            "nirf_rank": "NAAC A++ (NIRF Top 200)",
            "placement_avg": "₹6.0 LPA",
            "placement_high": "₹26.0 LPA",
            "established": 1998,
            "facilities": ["Incubation Center", "Sports Complex", "Auditorium"],
            "why_recommended": "Located in the heart of Pune's industrial hub with massive pool campus recruitment drives."
        },
        {
            "college_name": "Government College of Engineering, Nagpur (GCOEN)",
            "location": "Nagpur, Maharashtra",
            "stream": "Engineering",
            "branch": "Computer Science & Engineering",
            "college_type": "Government",
            "cutoff_marks": 91.0,
            "cutoff_percent": 91.0,
            "cutoff_rank": 25000,
            "annual_fees": 70000,
            "rating": 4.3,
            "nirf_rank": "State Government Institute",
            "placement_avg": "₹6.5 LPA",
            "placement_high": "₹22.0 LPA",
            "established": 2016,
            "facilities": ["Modern Campus", "Robotics & AI Labs", "Government Hostels"],
            "why_recommended": "Rapidly advancing state government engineering college with high academic standards in Vidarbha."
        },
        {
            "college_name": "Sinhgad College of Engineering (SCOE)",
            "location": "Vadgaon BK, Pune",
            "stream": "Engineering",
            "branch": "Computer Engineering / IT",
            "college_type": "Private",
            "cutoff_marks": 87.5,
            "cutoff_percent": 87.5,
            "cutoff_rank": 31000,
            "annual_fees": 130000,
            "rating": 4.2,
            "nirf_rank": "NAAC A Grade (SPPU Affiliated)",
            "placement_avg": "₹5.8 LPA",
            "placement_high": "₹24.0 LPA",
            "established": 1996,
            "facilities": ["Massive Vadgaon Campus", "Central Library", "Sports Complex"],
            "why_recommended": "Renowned for extensive campus placement drives across hundreds of Pune software and engineering firms."
        },
        {
            "college_name": "Thakur College of Engineering and Technology (TCET)",
            "location": "Kandivali East, Mumbai",
            "stream": "Engineering",
            "branch": "Information Technology / Computer Science",
            "college_type": "Private",
            "cutoff_marks": 89.2,
            "cutoff_percent": 89.2,
            "cutoff_rank": 28000,
            "annual_fees": 160000,
            "rating": 4.3,
            "nirf_rank": "Autonomous NAAC A",
            "placement_avg": "₹6.5 LPA",
            "placement_high": "₹30.0 LPA",
            "established": 2001,
            "facilities": ["Advanced Coding Center", "Seminar Halls", "Modern Infrastructure"],
            "why_recommended": "Top Western Suburbs autonomous institute in Mumbai offering high software placement consistency."
        }
    ],

    "Commerce": [
        {
            "college_name": "Shri Ram College of Commerce (SRCC)",
            "location": "North Campus, Delhi",
            "stream": "Commerce",
            "branch": "B.Com (Hons)",
            "college_type": "Government",
            "cutoff_marks": 98.5,
            "cutoff_percent": 98.5,
            "annual_fees": 30000,
            "rating": 4.9,
            "nirf_rank": "NIRF #1 (Commerce)",
            "placement_avg": "₹10.5 LPA",
            "placement_high": "₹35.0 LPA",
            "established": 1926,
            "facilities": ["Finance Lab", "Auditorium", "Digital Resource Center"],
            "why_recommended": "Pinnacle commerce institution in India with stellar consulting and finance placements."
        },
        {
            "college_name": "Lady Shri Ram College for Women (LSR)",
            "location": "Lajpat Nagar, Delhi",
            "stream": "Commerce",
            "branch": "B.Com (Hons)",
            "college_type": "Government",
            "cutoff_marks": 97.5,
            "cutoff_percent": 97.5,
            "annual_fees": 28000,
            "rating": 4.9,
            "nirf_rank": "NIRF Top 5 College",
            "placement_avg": "₹9.8 LPA",
            "placement_high": "₹30.0 LPA",
            "established": 1956,
            "facilities": ["Amphitheatre", "Heritage Library", "Commerce Society"],
            "why_recommended": "Elite women's commerce institution with high McKinsey and BCG campus recruiting."
        },
        {
            "college_name": "Loyola College",
            "location": "Nungambakkam, Chennai",
            "stream": "Commerce",
            "branch": "B.Com General / Corporate Secretaryship",
            "college_type": "Government",
            "cutoff_marks": 96.0,
            "cutoff_percent": 96.0,
            "annual_fees": 45000,
            "rating": 4.8,
            "nirf_rank": "NIRF Top 4 College",
            "placement_avg": "₹8.5 LPA",
            "placement_high": "₹24.0 LPA",
            "established": 1925,
            "facilities": ["Commerce Lab", "Sports Stadium", "Centenary Library"],
            "why_recommended": "South India's highest rated autonomous commerce college with illustrious alumni."
        },
        {
            "college_name": "St. Xavier's College",
            "location": "Fort, Mumbai",
            "stream": "Commerce",
            "branch": "B.Com / Bachelor of Management Studies (BMS)",
            "college_type": "Private",
            "cutoff_marks": 95.5,
            "cutoff_percent": 95.5,
            "annual_fees": 38000,
            "rating": 4.8,
            "nirf_rank": "Autonomous NAAC A++",
            "placement_avg": "₹8.8 LPA",
            "placement_high": "₹25.0 LPA",
            "established": 1869,
            "facilities": ["Gothic Heritage Campus", "Placement Cell", "Wi-Fi Hub"],
            "why_recommended": "Most prestigious autonomous college in South Mumbai with high investment banking hiring."
        },
        {
            "college_name": "Brihan Maharashtra College of Commerce (BMCC)",
            "location": "Shivajinagar, Pune",
            "stream": "Commerce",
            "branch": "B.Com / BBA (Finance)",
            "college_type": "Government",
            "cutoff_marks": 92.0,
            "cutoff_percent": 92.0,
            "annual_fees": 25000,
            "rating": 4.7,
            "nirf_rank": "Autonomous Heritage NAAC A+",
            "placement_avg": "₹6.5 LPA",
            "placement_high": "₹16.0 LPA",
            "established": 1943,
            "facilities": ["Commerce Lab", "Incubation Center", "Sports Ground"],
            "why_recommended": "Premier commerce college in Pune known for exceptional Chartered Accountancy (CA) results."
        },
        {
            "college_name": "Hindu College",
            "location": "North Campus, Delhi",
            "stream": "Commerce",
            "branch": "B.Com (Hons)",
            "college_type": "Government",
            "cutoff_marks": 97.0,
            "cutoff_percent": 97.0,
            "annual_fees": 26000,
            "rating": 4.8,
            "nirf_rank": "NIRF Rank #2 (College)",
            "placement_avg": "₹9.5 LPA",
            "placement_high": "₹29.0 LPA",
            "established": 1899,
            "facilities": ["Finance Cell", "Auditorium", "Digital Research Wing"],
            "why_recommended": "Top-tier Delhi University college with high corporate banking placements."
        },
        {
            "college_name": "Hansraj College",
            "location": "North Campus, Delhi",
            "stream": "Commerce",
            "branch": "B.Com (Hons)",
            "college_type": "Government",
            "cutoff_marks": 96.5,
            "cutoff_percent": 96.5,
            "annual_fees": 27000,
            "rating": 4.7,
            "nirf_rank": "NIRF Top 10",
            "placement_avg": "₹8.8 LPA",
            "placement_high": "₹24.0 LPA",
            "established": 1948,
            "facilities": ["Smart Classrooms", "Modern Auditorium", "Sports Complex"],
            "why_recommended": "Renowned North Campus college with rich student societies and finance networks."
        },
        {
            "college_name": "Narsee Monjee College of Commerce and Economics (NM)",
            "location": "Vile Parle, Mumbai",
            "stream": "Commerce",
            "branch": "B.Com (Accounting & Finance) / BAF",
            "college_type": "Private",
            "cutoff_marks": 94.5,
            "cutoff_percent": 94.5,
            "annual_fees": 35000,
            "rating": 4.7,
            "nirf_rank": "Autonomous NAAC A",
            "placement_avg": "₹7.5 LPA",
            "placement_high": "₹20.0 LPA",
            "established": 1964,
            "facilities": ["Computer Labs", "Auditorium", "Library"],
            "why_recommended": "Powerhouse for CA aspirants and corporate finance analysts in Mumbai."
        },
        {
            "college_name": "Mithibai College of Arts & Chauhan Institute",
            "location": "Vile Parle, Mumbai",
            "stream": "Commerce",
            "branch": "B.Com / B.Com (Financial Markets)",
            "college_type": "Private",
            "cutoff_marks": 93.0,
            "cutoff_percent": 93.0,
            "annual_fees": 32000,
            "rating": 4.6,
            "nirf_rank": "Autonomous Grade A",
            "placement_avg": "₹6.8 LPA",
            "placement_high": "₹18.0 LPA",
            "established": 1961,
            "facilities": ["State-of-the-Art Media & Finance Labs", "Cafeteria", "Library"],
            "why_recommended": "High corporate demand in Mumbai's commercial banking and consulting firms."
        },
        {
            "college_name": "R.A. Podar College of Commerce & Economics",
            "location": "Matunga, Mumbai",
            "stream": "Commerce",
            "branch": "B.Com / BMS",
            "college_type": "Government",
            "cutoff_marks": 92.5,
            "cutoff_percent": 92.5,
            "annual_fees": 22000,
            "rating": 4.6,
            "nirf_rank": "Autonomous NAAC A+",
            "placement_avg": "₹6.5 LPA",
            "placement_high": "₹16.5 LPA",
            "established": 1941,
            "facilities": ["Commerce & Business Lab", "Reading Hall", "Gymkhana"],
            "why_recommended": "Historic commerce college in Central Mumbai producing rank holders in CA & CS."
        },
        {
            "college_name": "Christ University",
            "location": "Hosur Road, Bengaluru",
            "stream": "Commerce",
            "branch": "B.Com (Finance & Accountancy) / BBA",
            "college_type": "Private",
            "cutoff_marks": 90.0,
            "cutoff_percent": 90.0,
            "annual_fees": 195000,
            "rating": 4.6,
            "nirf_rank": "NIRF Top 60 (Overall)",
            "placement_avg": "₹7.2 LPA",
            "placement_high": "₹21.0 LPA",
            "established": 1969,
            "facilities": ["Corporate Block", "Amphitheatre", "Finance Simulation Lab"],
            "why_recommended": "World-class campus with strict professional rigor and Big 4 corporate recruitment."
        },
        {
            "college_name": "Symbiosis College of Arts and Commerce",
            "location": "Senapati Bapat Road, Pune",
            "stream": "Commerce",
            "branch": "B.Com (Hons) / Business Analytics",
            "college_type": "Private",
            "cutoff_marks": 91.5,
            "cutoff_percent": 91.5,
            "annual_fees": 42000,
            "rating": 4.6,
            "nirf_rank": "Autonomous College with Potential for Excellence",
            "placement_avg": "₹6.5 LPA",
            "placement_high": "₹17.0 LPA",
            "established": 1983,
            "facilities": ["Language Lab", "Commerce Center", "Modern Library"],
            "why_recommended": "Cosmopolitan student community with ACCA and international finance accreditations."
        },
        {
            "college_name": "St. Joseph's College of Commerce (SJCC)",
            "location": "Brigade Road, Bengaluru",
            "stream": "Commerce",
            "branch": "B.Com (Analytics / Strategic Finance)",
            "college_type": "Private",
            "cutoff_marks": 91.0,
            "cutoff_percent": 91.0,
            "annual_fees": 95000,
            "rating": 4.6,
            "nirf_rank": "Autonomous NAAC A++",
            "placement_avg": "₹6.8 LPA",
            "placement_high": "₹18.0 LPA",
            "established": 1972,
            "facilities": ["Bloomberg Terminals", "Auditorium", "Incubation Hub"],
            "why_recommended": "Located in central Bengaluru with strong fintech and corporate analytics placements."
        },
        {
            "college_name": "H.R. College of Commerce and Economics",
            "location": "Churchgate, Mumbai",
            "stream": "Commerce",
            "branch": "B.Com / BAF / Banking & Insurance",
            "college_type": "Private",
            "cutoff_marks": 93.5,
            "cutoff_percent": 93.5,
            "annual_fees": 28000,
            "rating": 4.6,
            "nirf_rank": "HSNC University Lead College",
            "placement_avg": "₹7.0 LPA",
            "placement_high": "₹19.0 LPA",
            "established": 1960,
            "facilities": ["Conference Center", "Digital Library", "Career Cell"],
            "why_recommended": "South Mumbai commercial powerhouse with stellar CA and investment banking networks."
        },
        {
            "college_name": "Madras Christian College (MCC)",
            "location": "Tambaram, Chennai",
            "stream": "Commerce",
            "branch": "B.Com General / Accounting & Finance",
            "college_type": "Government",
            "cutoff_marks": 89.5,
            "cutoff_percent": 89.5,
            "annual_fees": 38000,
            "rating": 4.5,
            "nirf_rank": "NIRF Top 15 College",
            "placement_avg": "₹6.0 LPA",
            "placement_high": "₹15.0 LPA",
            "established": 1837,
            "facilities": ["Historic Scrub Campus", "Commerce Hall", "Hostels"],
            "why_recommended": "Heritage South Indian institution providing robust academic values and corporate hiring."
        },
        {
            "college_name": "Goenka College of Commerce & Business Administration",
            "location": "Kolkata, West Bengal",
            "stream": "Commerce",
            "branch": "B.Com (Hons)",
            "college_type": "Government",
            "cutoff_marks": 91.0,
            "cutoff_percent": 91.0,
            "annual_fees": 15000,
            "rating": 4.5,
            "nirf_rank": "Historic State College",
            "placement_avg": "₹5.8 LPA",
            "placement_high": "₹14.0 LPA",
            "established": 1905,
            "facilities": ["Heritage Building", "Library", "Computer Lab"],
            "why_recommended": "East India's most prominent government commerce institution with negligible fees."
        },
        {
            "college_name": "Gargi College",
            "location": "Siri Fort Road, Delhi",
            "stream": "Commerce",
            "branch": "B.Com (Hons)",
            "college_type": "Government",
            "cutoff_marks": 94.0,
            "cutoff_percent": 94.0,
            "annual_fees": 22000,
            "rating": 4.5,
            "nirf_rank": "NIRF Top 20",
            "placement_avg": "₹6.8 LPA",
            "placement_high": "₹18.0 LPA",
            "established": 1967,
            "facilities": ["Auditorium", "Bio-Commerce Lab", "Sports Facilities"],
            "why_recommended": "Premier South Campus Delhi college with active corporate placement drives."
        },
        {
            "college_name": "Stella Maris College",
            "location": "Cathedral Road, Chennai",
            "stream": "Commerce",
            "branch": "B.Com (Corporate Secretaryship) / B.Com Hons",
            "college_type": "Government",
            "cutoff_marks": 89.0,
            "cutoff_percent": 89.0,
            "annual_fees": 35000,
            "rating": 4.5,
            "nirf_rank": "NIRF Top 30",
            "placement_avg": "₹5.8 LPA",
            "placement_high": "₹15.0 LPA",
            "established": 1947,
            "facilities": ["Air-conditioned Classrooms", "Modern Library", "Auditorium"],
            "why_recommended": "Eminent autonomous women's college in Chennai with notable corporate tie-ups."
        },
        {
            "college_name": "Ness Wadia College of Commerce",
            "location": "Pune, Maharashtra",
            "stream": "Commerce",
            "branch": "B.Com / BBA (International Business)",
            "college_type": "Private",
            "cutoff_marks": 86.0,
            "cutoff_percent": 86.0,
            "annual_fees": 28000,
            "rating": 4.4,
            "nirf_rank": "Savitribai Phule Pune University",
            "placement_avg": "₹5.2 LPA",
            "placement_high": "₹12.5 LPA",
            "established": 1969,
            "facilities": ["Modern Sports Arena", "Auditorium", "Reading Room"],
            "why_recommended": "Well-regarded commerce institution in Pune with international trade specializations."
        },
        {
            "college_name": "K.J. Somaiya College of Arts and Commerce",
            "location": "Vidyavihar, Mumbai",
            "stream": "Commerce",
            "branch": "B.Com / BAF / BBI",
            "college_type": "Private",
            "cutoff_marks": 88.5,
            "cutoff_percent": 88.5,
            "annual_fees": 35000,
            "rating": 4.4,
            "nirf_rank": "NAAC A Grade",
            "placement_avg": "₹5.5 LPA",
            "placement_high": "₹14.0 LPA",
            "established": 1960,
            "facilities": ["Spacious Campus", "Sports Complex", "Digital Library"],
            "why_recommended": "Vibrant campus environment with continuous visits from banking and audit firms."
        },
        {
            "college_name": "Sydenham College of Commerce and Economics",
            "location": "Churchgate, Mumbai",
            "stream": "Commerce",
            "branch": "B.Com / BMS",
            "college_type": "Government",
            "cutoff_marks": 91.0,
            "cutoff_percent": 91.0,
            "annual_fees": 18000,
            "rating": 4.4,
            "nirf_rank": "Oldest Commerce College in Asia",
            "placement_avg": "₹6.2 LPA",
            "placement_high": "₹15.0 LPA",
            "established": 1913,
            "facilities": ["Heritage Building", "Seminar Hall", "Library"],
            "why_recommended": "Asia's oldest commerce institution located in Mumbai's financial center."
        }
    ],

    "Science": [
        {
            "college_name": "Indian Institute of Science (IISc)",
            "location": "Bengaluru, Karnataka",
            "stream": "Science",
            "branch": "B.Sc (Research) / Pure Sciences",
            "college_type": "Government",
            "cutoff_marks": 98.0,
            "cutoff_percent": 98.0,
            "annual_fees": 35000,
            "rating": 4.9,
            "nirf_rank": "NIRF Rank #1 (University)",
            "placement_avg": "₹22.5 LPA / Direct PhD",
            "placement_high": "₹60.0 LPA",
            "established": 1909,
            "facilities": ["Supercomputing Facility", "Cryo-EM Lab", "Centenary Library"],
            "why_recommended": "India's highest ranked premier science research institute with global acclaim."
        },
        {
            "college_name": "IISER Pune",
            "location": "Pashan, Pune",
            "stream": "Science",
            "branch": "BS-MS Dual Degree (Sciences)",
            "college_type": "Government",
            "cutoff_marks": 95.5,
            "cutoff_percent": 95.5,
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
            "college_name": "St. Stephen's College",
            "location": "North Campus, Delhi",
            "stream": "Science",
            "branch": "B.Sc (Hons) Physics / Mathematics / Chemistry",
            "college_type": "Government",
            "cutoff_marks": 97.5,
            "cutoff_percent": 97.5,
            "annual_fees": 42000,
            "rating": 4.9,
            "nirf_rank": "NIRF Top 2 College",
            "placement_avg": "₹10.5 LPA",
            "placement_high": "₹30.0 LPA",
            "established": 1881,
            "facilities": ["Historic Quadrangle", "Advanced Optics Lab", "Science Library"],
            "why_recommended": "India's most prestigious undergraduate college for physics and mathematical sciences."
        },
        {
            "college_name": "Fergusson College",
            "location": "FC Road, Pune",
            "stream": "Science",
            "branch": "B.Sc Computer Science / Biotechnology",
            "college_type": "Government",
            "cutoff_marks": 93.0,
            "cutoff_percent": 93.0,
            "annual_fees": 45000,
            "rating": 4.7,
            "nirf_rank": "Heritage Autonomous NAAC A++",
            "placement_avg": "₹6.8 LPA",
            "placement_high": "₹16.0 LPA",
            "established": 1885,
            "facilities": ["Amphitheatre", "Botanical Garden", "Advanced IT Labs"],
            "why_recommended": "Prestigious autonomous institution in Pune with illustrious alumni and top placements."
        },
        {
            "college_name": "St. Xavier's College",
            "location": "Fort, Mumbai",
            "stream": "Science",
            "branch": "B.Sc Physics / Microbiology / IT",
            "college_type": "Private",
            "cutoff_marks": 94.0,
            "cutoff_percent": 94.0,
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
            "college_name": "Hindu College",
            "location": "North Campus, Delhi",
            "stream": "Science",
            "branch": "B.Sc (Hons) Statistics / Physics",
            "college_type": "Government",
            "cutoff_marks": 96.5,
            "cutoff_percent": 96.5,
            "annual_fees": 28000,
            "rating": 4.8,
            "nirf_rank": "NIRF Rank #2",
            "placement_avg": "₹9.2 LPA",
            "placement_high": "₹26.0 LPA",
            "established": 1899,
            "facilities": ["Advanced Science Instrumentation", "Planetarium Link", "Library"],
            "why_recommended": "Unbeatable statistics and physical sciences placement record in Delhi University."
        },
        {
            "college_name": "Ramnarain Ruia Autonomous College",
            "location": "Matunga, Mumbai",
            "stream": "Science",
            "branch": "B.Sc Analytical Chemistry / Bioanalytical",
            "college_type": "Government",
            "cutoff_marks": 89.5,
            "cutoff_percent": 89.5,
            "annual_fees": 30000,
            "rating": 4.6,
            "nirf_rank": "NAAC A+ (CGPA 3.70)",
            "placement_avg": "₹5.8 LPA",
            "placement_high": "₹14.0 LPA",
            "established": 1937,
            "facilities": ["Instrumentation Center", "Eco-friendly Campus", "Auditorium"],
            "why_recommended": "Leading Mumbai science college with strong industry-academia collaborations."
        },
        {
            "college_name": "Miranda House",
            "location": "North Campus, Delhi",
            "stream": "Science",
            "branch": "B.Sc (Hons) Life Sciences / Zoology",
            "college_type": "Government",
            "cutoff_marks": 96.0,
            "cutoff_percent": 96.0,
            "annual_fees": 22000,
            "rating": 4.9,
            "nirf_rank": "NIRF Rank #1 Among Colleges",
            "placement_avg": "₹8.5 LPA",
            "placement_high": "₹21.0 LPA",
            "established": 1948,
            "facilities": ["DS Kothari Science Center", "Herbal Garden", "Laboratories"],
            "why_recommended": "Consecutively ranked India's top college for women in physical and biological sciences."
        },
        {
            "college_name": "IISER Kolkata",
            "location": "Mohanpur, West Bengal",
            "stream": "Science",
            "branch": "BS-MS Integrated Sciences",
            "college_type": "Government",
            "cutoff_marks": 94.0,
            "cutoff_percent": 94.0,
            "annual_fees": 65000,
            "rating": 4.8,
            "nirf_rank": "Institute of National Importance",
            "placement_avg": "₹12.0 LPA / PhD",
            "placement_high": "₹32.0 LPA",
            "established": 2006,
            "facilities": ["Center of Excellence in Space Sciences", "Laser Labs", "Hostels"],
            "why_recommended": "Autonomous institute with deep focus on chemical and earth science discoveries."
        },
        {
            "college_name": "IISER Mohali",
            "location": "Mohali, Punjab",
            "stream": "Science",
            "branch": "BS-MS Physical / Mathematical Sciences",
            "college_type": "Government",
            "cutoff_marks": 93.5,
            "cutoff_percent": 93.5,
            "annual_fees": 65000,
            "rating": 4.7,
            "nirf_rank": "Institute of National Importance",
            "placement_avg": "₹11.5 LPA",
            "placement_high": "₹30.0 LPA",
            "established": 2007,
            "facilities": ["Single Crystal X-Ray Unit", "Computing Lab", "Auditorium"],
            "why_recommended": "Elite destination for pure mathematics, theoretical physics, and computational science."
        },
        {
            "college_name": "Loyola College",
            "location": "Chennai, Tamil Nadu",
            "stream": "Science",
            "branch": "B.Sc Chemistry / Statistics / Visual Communication",
            "college_type": "Government",
            "cutoff_marks": 92.5,
            "cutoff_percent": 92.5,
            "annual_fees": 42000,
            "rating": 4.7,
            "nirf_rank": "NIRF Top 4",
            "placement_avg": "₹7.2 LPA",
            "placement_high": "₹18.0 LPA",
            "established": 1925,
            "facilities": ["Entomology Research Institute", "Herbarium", "Media Labs"],
            "why_recommended": "South India's premier science institution with dedicated research labs and corporate placements."
        },
        {
            "college_name": "Madras Christian College (MCC)",
            "location": "Chennai, Tamil Nadu",
            "stream": "Science",
            "branch": "B.Sc Physics / Plant Biology",
            "college_type": "Government",
            "cutoff_marks": 88.0,
            "cutoff_percent": 88.0,
            "annual_fees": 36000,
            "rating": 4.5,
            "nirf_rank": "NIRF Top 15",
            "placement_avg": "₹5.5 LPA",
            "placement_high": "₹14.0 LPA",
            "established": 1837,
            "facilities": ["Natural Flora Campus", "Bio-Instrumentation", "Hostels"],
            "why_recommended": "Expansive 365-acre natural forest campus with rich biological science research facilities."
        },
        {
            "college_name": "Modern College of Arts, Science & Commerce",
            "location": "Shivajinagar, Pune",
            "stream": "Science",
            "branch": "B.Sc Computer Science / Data Science",
            "college_type": "Government",
            "cutoff_marks": 86.0,
            "cutoff_percent": 86.0,
            "annual_fees": 35000,
            "rating": 4.4,
            "nirf_rank": "Autonomous NAAC A+",
            "placement_avg": "₹5.2 LPA",
            "placement_high": "₹14.0 LPA",
            "established": 1970,
            "facilities": ["Biotechnology Lab", "Central IT Center", "Placement Cell"],
            "why_recommended": "Rapidly growing IT and pure science institution in Pune with active company placement drives."
        },
        {
            "college_name": "Mithibai College (Science Faculty)",
            "location": "Vile Parle, Mumbai",
            "stream": "Science",
            "branch": "B.Sc Computer Science / Biotechnology",
            "college_type": "Private",
            "cutoff_marks": 88.5,
            "cutoff_percent": 88.5,
            "annual_fees": 35000,
            "rating": 4.5,
            "nirf_rank": "Autonomous NAAC A Grade",
            "placement_avg": "₹6.0 LPA",
            "placement_high": "₹15.5 LPA",
            "established": 1961,
            "facilities": ["Modern Biotech Labs", "Computer Centers", "Library"],
            "why_recommended": "Top-tier Mumbai autonomous college with high software and pharmaceutical hiring."
        },
        {
            "college_name": "Hansraj College (Science Wing)",
            "location": "North Campus, Delhi",
            "stream": "Science",
            "branch": "B.Sc (Hons) Chemistry / Geology",
            "college_type": "Government",
            "cutoff_marks": 95.0,
            "cutoff_percent": 95.0,
            "annual_fees": 28000,
            "rating": 4.7,
            "nirf_rank": "NIRF Top 10",
            "placement_avg": "₹8.0 LPA",
            "placement_high": "₹22.0 LPA",
            "established": 1948,
            "facilities": ["Geology Museum", "Advanced Chemical Labs", "Sports Complex"],
            "why_recommended": "Eminent physical sciences hub in Delhi with strong scientific societies and internships."
        },
        {
            "college_name": "Presidency College",
            "location": "Kamarajar Salai, Chennai",
            "stream": "Science",
            "branch": "B.Sc Mathematics / Geology",
            "college_type": "Government",
            "cutoff_marks": 87.0,
            "cutoff_percent": 87.0,
            "annual_fees": 12000,
            "rating": 4.5,
            "nirf_rank": "NIRF Rank #3 Among Colleges",
            "placement_avg": "₹5.2 LPA",
            "placement_high": "₹12.0 LPA",
            "established": 1840,
            "facilities": ["Historical Campus", "Marine Geology Lab", "Central Library"],
            "why_recommended": "Historic government institution with nominal fees producing renowned Indian scientists."
        },
        {
            "college_name": "D.G. Ruparel College of Arts, Science and Commerce",
            "location": "Matunga West, Mumbai",
            "stream": "Science",
            "branch": "B.Sc Information Technology / Physics",
            "college_type": "Government",
            "cutoff_marks": 86.5,
            "cutoff_percent": 86.5,
            "annual_fees": 24000,
            "rating": 4.4,
            "nirf_rank": "NAAC A Grade",
            "placement_avg": "₹5.0 LPA",
            "placement_high": "₹13.0 LPA",
            "established": 1952,
            "facilities": ["Green Campus in Mumbai", "Laboratories", "Gymkhana"],
            "why_recommended": "Central Mumbai landmark science college with strong merit cutoffs and faculty."
        },
        {
            "college_name": "Sri Venkateswara College (Venky)",
            "location": "Dhaula Kuan, New Delhi",
            "stream": "Science",
            "branch": "B.Sc (Hons) Biological Sciences / Electronics",
            "college_type": "Government",
            "cutoff_marks": 93.5,
            "cutoff_percent": 93.5,
            "annual_fees": 28000,
            "rating": 4.6,
            "nirf_rank": "NIRF Top 15",
            "placement_avg": "₹7.5 LPA",
            "placement_high": "₹20.0 LPA",
            "established": 1961,
            "facilities": ["Bioinformatics Facility", "Auditorium", "Hostels"],
            "why_recommended": "Leading South Campus institution celebrated for biological sciences and research."
        },
        {
            "college_name": "Mount Carmel College",
            "location": "Vasanth Nagar, Bengaluru",
            "stream": "Science",
            "branch": "B.Sc Biotechnology / Chemistry / Environmental Science",
            "college_type": "Private",
            "cutoff_marks": 87.5,
            "cutoff_percent": 87.5,
            "annual_fees": 75000,
            "rating": 4.5,
            "nirf_rank": "Autonomous NAAC A+",
            "placement_avg": "₹6.0 LPA",
            "placement_high": "₹15.0 LPA",
            "established": 1948,
            "facilities": ["Research Laboratories", "Auditorium", "Botanical Garden"],
            "why_recommended": "Premier Bengaluru autonomous college offering modern biotechnology and life science tracks."
        },
        {
            "college_name": "B.K. Birla College of Arts, Science and Commerce",
            "location": "Kalyan, Maharashtra",
            "stream": "Science",
            "branch": "B.Sc Computer Science / Microbiology",
            "college_type": "Private",
            "cutoff_marks": 84.0,
            "cutoff_percent": 84.0,
            "annual_fees": 26000,
            "rating": 4.3,
            "nirf_rank": "Autonomous NAAC A++ (CGPA 3.58)",
            "placement_avg": "₹4.8 LPA",
            "placement_high": "₹12.0 LPA",
            "established": 1972,
            "facilities": ["Microbiology Research Center", "Digital Library", "Sports Complex"],
            "why_recommended": "Thane-Mumbai suburban science leader with high academic ratings and research output."
        },
        {
            "college_name": "Abasaheb Garware College",
            "location": "Karve Road, Pune",
            "stream": "Science",
            "branch": "B.Sc Chemistry / Physics / Computer Science",
            "college_type": "Government",
            "cutoff_marks": 83.0,
            "cutoff_percent": 83.0,
            "annual_fees": 25000,
            "rating": 4.3,
            "nirf_rank": "Autonomous Grade A",
            "placement_avg": "₹4.6 LPA",
            "placement_high": "₹11.0 LPA",
            "established": 1945,
            "facilities": ["Central Instrumentation", "Chemical Laboratories", "Library"],
            "why_recommended": "Affordable science education with consistent corporate campus placements in Pune."
        }
    ],

    "Law": [
        {
            "college_name": "National Law School of India University (NLSIU)",
            "location": "Nagarbhavi, Bengaluru",
            "stream": "Law",
            "branch": "B.A. LL.B. (Hons)",
            "college_type": "Government",
            "cutoff_marks": 98.5,
            "cutoff_percent": 98.5,
            "cutoff_rank": 110,
            "annual_fees": 340000,
            "rating": 4.9,
            "nirf_rank": "NIRF Rank #1 (Law in India)",
            "placement_avg": "₹18.0 LPA",
            "placement_high": "₹42.0 LPA",
            "established": 1987,
            "facilities": ["Sri Narayan Rao Moot Court", "Digital Law Library", "Hostels"],
            "why_recommended": "India's highest ranked law university with unmatched global and corporate legal recruitment."
        },
        {
            "college_name": "NALSAR University of Law",
            "location": "Shamirpet, Hyderabad",
            "stream": "Law",
            "branch": "B.A. LL.B. (Hons)",
            "college_type": "Government",
            "cutoff_marks": 97.5,
            "cutoff_percent": 97.5,
            "cutoff_rank": 260,
            "annual_fees": 310000,
            "rating": 4.9,
            "nirf_rank": "NIRF Rank #3",
            "placement_avg": "₹16.5 LPA",
            "placement_high": "₹38.0 LPA",
            "established": 1998,
            "facilities": ["Moot Court Complex", "Auditorium", "High-Tech Law Center"],
            "why_recommended": "Elite national law university renowned for judicial, corporate, and civil litigation training."
        },
        {
            "college_name": "National Law University (NLU Delhi)",
            "location": "Dwarka, New Delhi",
            "stream": "Law",
            "branch": "B.A. LL.B. (Hons)",
            "college_type": "Government",
            "cutoff_marks": 98.0,
            "cutoff_percent": 98.0,
            "cutoff_rank": 180,
            "annual_fees": 320000,
            "rating": 4.9,
            "nirf_rank": "NIRF Rank #2",
            "placement_avg": "₹17.0 LPA",
            "placement_high": "₹40.0 LPA",
            "established": 2008,
            "facilities": ["Justice Chawla Library", "Moot Courtrooms", "Hostels"],
            "why_recommended": "Supreme Court of India proximity providing unmatched internships with senior advocates."
        },
        {
            "college_name": "The West Bengal National University of Juridical Sciences (WBNUJS)",
            "location": "Salt Lake, Kolkata",
            "stream": "Law",
            "branch": "B.A. LL.B. (Hons)",
            "college_type": "Government",
            "cutoff_marks": 96.5,
            "cutoff_percent": 96.5,
            "cutoff_rank": 420,
            "annual_fees": 290000,
            "rating": 4.8,
            "nirf_rank": "NIRF Top 4 Law",
            "placement_avg": "₹15.5 LPA",
            "placement_high": "₹35.0 LPA",
            "established": 1999,
            "facilities": ["Arbitration Center", "Legal Aid Clinic", "E-Library"],
            "why_recommended": "Top-tier national law university with leading Tier-1 corporate law firm placements."
        },
        {
            "college_name": "Government Law College (GLC)",
            "location": "Churchgate, Mumbai",
            "stream": "Law",
            "branch": "B.L.S. LL.B. (5 Year Integrated)",
            "college_type": "Government",
            "cutoff_marks": 95.0,
            "cutoff_percent": 95.0,
            "cutoff_rank": 1200,
            "annual_fees": 15000,
            "rating": 4.7,
            "nirf_rank": "Oldest Law School in Asia",
            "placement_avg": "₹9.5 LPA",
            "placement_high": "₹28.0 LPA",
            "established": 1855,
            "facilities": ["Bombay High Court Proximity", "Historic Library", "Moot Court"],
            "why_recommended": "Asia's oldest law college producing 6 Chief Justices of India and leading advocates."
        },
        {
            "college_name": "ILS Law College",
            "location": "Law College Road, Pune",
            "stream": "Law",
            "branch": "B.A. LL.B. (5 Year Integrated)",
            "college_type": "Government",
            "cutoff_marks": 93.5,
            "cutoff_percent": 93.5,
            "cutoff_rank": 1600,
            "annual_fees": 45000,
            "rating": 4.7,
            "nirf_rank": "Top Ranked Law College",
            "placement_avg": "₹8.8 LPA",
            "placement_high": "₹24.0 LPA",
            "established": 1924,
            "facilities": ["154-Acre Hill Campus", "Legal Aid Center", "Saraswati Library"],
            "why_recommended": "Prestigious autonomous institution in Pune with exceptional trial and appellate advocate pedigree."
        },
        {
            "college_name": "Symbiosis Law School (SLS)",
            "location": "Viman Nagar, Pune",
            "stream": "Law",
            "branch": "B.A. LL.B. / B.B.A. LL.B. (Hons)",
            "college_type": "Private",
            "cutoff_marks": 91.0,
            "cutoff_percent": 91.0,
            "cutoff_rank": 2200,
            "annual_fees": 410000,
            "rating": 4.7,
            "nirf_rank": "NIRF Top 5 Law",
            "placement_avg": "₹9.5 LPA",
            "placement_high": "₹26.0 LPA",
            "established": 1977,
            "facilities": ["Modern Moot Court", "Corporate Law Cell", "Hostels"],
            "why_recommended": "Premier private law school with massive multinational and corporate counsel recruitments."
        },
        {
            "college_name": "National Law Institute University (NLIU)",
            "location": "Bhopal, Madhya Pradesh",
            "stream": "Law",
            "branch": "B.A. LL.B. (Hons) / Cyber Law",
            "college_type": "Government",
            "cutoff_marks": 95.5,
            "cutoff_percent": 95.5,
            "cutoff_rank": 650,
            "annual_fees": 260000,
            "rating": 4.7,
            "nirf_rank": "NIRF Top 10",
            "placement_avg": "₹14.0 LPA",
            "placement_high": "₹32.0 LPA",
            "established": 1997,
            "facilities": ["Cyber Law Research Center", "Digital Library", "Moot Court"],
            "why_recommended": "National leader in cyber jurisprudence, corporate transactions, and IP litigation."
        },
        {
            "college_name": "Gujarat National Law University (GNLU)",
            "location": "Gandhinagar, Gujarat",
            "stream": "Law",
            "branch": "B.A. LL.B. / B.B.A. LL.B.",
            "college_type": "Government",
            "cutoff_marks": 95.0,
            "cutoff_percent": 95.0,
            "cutoff_rank": 750,
            "annual_fees": 280000,
            "rating": 4.7,
            "nirf_rank": "NIRF Top 7",
            "placement_avg": "₹13.5 LPA",
            "placement_high": "₹30.0 LPA",
            "established": 2003,
            "facilities": ["Maritime Law Center", "Moot Courtrooms", "Gymnasium"],
            "why_recommended": "Renowned for international trade, securities law, and maritime legal practice."
        },
        {
            "college_name": "Maharashtra National Law University (MNLU)",
            "location": "Powai, Mumbai",
            "stream": "Law",
            "branch": "B.A. LL.B. (Hons)",
            "college_type": "Government",
            "cutoff_marks": 94.0,
            "cutoff_percent": 94.0,
            "cutoff_rank": 950,
            "annual_fees": 275000,
            "rating": 4.6,
            "nirf_rank": "State Apex National Law University",
            "placement_avg": "₹12.0 LPA",
            "placement_high": "₹28.0 LPA",
            "established": 2014,
            "facilities": ["High Court Proximity", "Corporate Internship Cell", "Digital Resource"],
            "why_recommended": "Strategic advantage of Mumbai's financial and corporate headquarters ecosystem."
        },
        {
            "college_name": "Rajiv Gandhi National University of Law (RGNUL)",
            "location": "Patiala, Punjab",
            "stream": "Law",
            "branch": "B.A. LL.B. (Hons)",
            "college_type": "Government",
            "cutoff_marks": 92.0,
            "cutoff_percent": 92.0,
            "cutoff_rank": 1400,
            "annual_fees": 240000,
            "rating": 4.6,
            "nirf_rank": "NIRF Top 15",
            "placement_avg": "₹10.5 LPA",
            "placement_high": "₹24.0 LPA",
            "established": 2006,
            "facilities": ["Air-conditioned Classrooms", "Moot Courts", "Green Campus"],
            "why_recommended": "State-of-the-art residential NLU campus with high judicial services selection."
        },
        {
            "college_name": "Dr. Ram Manohar Lohiya National Law University (RMLNLU)",
            "location": "Lucknow, Uttar Pradesh",
            "stream": "Law",
            "branch": "B.A. LL.B. (Hons)",
            "college_type": "Government",
            "cutoff_marks": 93.0,
            "cutoff_percent": 93.0,
            "cutoff_rank": 1100,
            "annual_fees": 220000,
            "rating": 4.6,
            "nirf_rank": "NIRF Top 16",
            "placement_avg": "₹11.0 LPA",
            "placement_high": "₹25.0 LPA",
            "established": 2005,
            "facilities": ["Madhu Limaye Library", "Auditorium", "Legal Aid Cell"],
            "why_recommended": "High selection in civil judge judicial services and public prosecutor appointments."
        },
        {
            "college_name": "Faculty of Law, Jamia Millia Islamia",
            "location": "New Delhi, Delhi",
            "stream": "Law",
            "branch": "B.A. LL.B. (Hons)",
            "college_type": "Government",
            "cutoff_marks": 92.5,
            "cutoff_percent": 92.5,
            "cutoff_rank": 1800,
            "annual_fees": 20000,
            "rating": 4.6,
            "nirf_rank": "NIRF Top 6 Law",
            "placement_avg": "₹9.0 LPA",
            "placement_high": "₹22.0 LPA",
            "established": 1989,
            "facilities": ["Moot Court Hall", "Legal Clinic", "Central Library"],
            "why_recommended": "Outstanding central university faculty offering affordable, high-prestige legal training."
        },
        {
            "college_name": "School of Law, Christ University",
            "location": "Bengaluru, Karnataka",
            "stream": "Law",
            "branch": "B.A. LL.B. / B.B.A. LL.B. (Hons)",
            "college_type": "Private",
            "cutoff_marks": 88.5,
            "cutoff_percent": 88.5,
            "cutoff_rank": 2900,
            "annual_fees": 240000,
            "rating": 4.5,
            "nirf_rank": "NIRF Top 20",
            "placement_avg": "₹8.2 LPA",
            "placement_high": "₹20.0 LPA",
            "established": 2006,
            "facilities": ["Moot Courtrooms", "Digital Legal Databases", "Hostels"],
            "why_recommended": "Dynamic corporate training with direct recruitment into Bengaluru tech and IP law firms."
        },
        {
            "college_name": "Army Institute of Law (AIL)",
            "location": "Mohali, Punjab",
            "stream": "Law",
            "branch": "B.A. LL.B.",
            "college_type": "Government",
            "cutoff_marks": 90.0,
            "cutoff_percent": 90.0,
            "cutoff_rank": 2100,
            "annual_fees": 190000,
            "rating": 4.5,
            "nirf_rank": "Premier Armed Forces Institute",
            "placement_avg": "₹8.5 LPA",
            "placement_high": "₹21.0 LPA",
            "established": 1999,
            "facilities": ["Moot Court", "Shooting Range", "Hostels"],
            "why_recommended": "Unmatched discipline, litigation exposure, and high selection into Indian Army JAG branch."
        },
        {
            "college_name": "Maharashtra National Law University (MNLU)",
            "location": "Nagpur, Maharashtra",
            "stream": "Law",
            "branch": "B.A. LL.B. (Hons)",
            "college_type": "Government",
            "cutoff_marks": 90.0,
            "cutoff_percent": 90.0,
            "cutoff_rank": 2000,
            "annual_fees": 250000,
            "rating": 4.5,
            "nirf_rank": "Modern National Law University",
            "placement_avg": "₹9.8 LPA",
            "placement_high": "₹22.0 LPA",
            "established": 2016,
            "facilities": ["High-Court Moot Bench", "Residential Complex", "Library"],
            "why_recommended": "Rapidly growing national law university with active judicial and bar mentors."
        },
        {
            "college_name": "National University of Study and Research in Law (NUSRL)",
            "location": "Ranchi, Jharkhand",
            "stream": "Law",
            "branch": "B.A. LL.B. (Hons)",
            "college_type": "Government",
            "cutoff_marks": 89.0,
            "cutoff_percent": 89.0,
            "cutoff_rank": 2400,
            "annual_fees": 210000,
            "rating": 4.4,
            "nirf_rank": "NLU Campus",
            "placement_avg": "₹8.0 LPA",
            "placement_high": "₹18.0 LPA",
            "established": 2010,
            "facilities": ["Moot Courtrooms", "E-Library", "Hostels"],
            "why_recommended": "Autonomous national law university focusing on mining, energy, and corporate governance."
        },
        {
            "college_name": "Pravin Gandhi College of Law",
            "location": "Vile Parle, Mumbai",
            "stream": "Law",
            "branch": "B.L.S. LL.B. (5 Year Integrated)",
            "college_type": "Private",
            "cutoff_marks": 87.0,
            "cutoff_percent": 87.0,
            "cutoff_rank": 3200,
            "annual_fees": 75000,
            "rating": 4.4,
            "nirf_rank": "SVKM Affiliated",
            "placement_avg": "₹6.8 LPA",
            "placement_high": "₹16.0 LPA",
            "established": 2004,
            "facilities": ["Moot Court", "Legal Aid Cell", "Smart Classrooms"],
            "why_recommended": "High corporate internship placements with Mumbai law chambers and legal consultancies."
        },
        {
            "college_name": "DES Shri Navalmal Firodia Law College",
            "location": "Fergusson College Campus, Pune",
            "stream": "Law",
            "branch": "B.A. LL.B. / B.B.A. LL.B.",
            "college_type": "Private",
            "cutoff_marks": 86.0,
            "cutoff_percent": 86.0,
            "cutoff_rank": 3500,
            "annual_fees": 55000,
            "rating": 4.4,
            "nirf_rank": "Deccan Education Society",
            "placement_avg": "₹6.5 LPA",
            "placement_high": "₹15.0 LPA",
            "established": 2004,
            "facilities": ["Moot Court Room", "Computer Lab", "Central Library"],
            "why_recommended": "Renowned legal faculty backed by Deccan Education Society's 140-year heritage."
        },
        {
            "college_name": "Bharati Vidyapeeth New Law College",
            "location": "Erandwane, Pune",
            "stream": "Law",
            "branch": "B.B.A. LL.B. / B.A. LL.B.",
            "college_type": "Private",
            "cutoff_marks": 84.0,
            "cutoff_percent": 84.0,
            "cutoff_rank": 4200,
            "annual_fees": 120000,
            "rating": 4.3,
            "nirf_rank": "NAAC A+ Accredited",
            "placement_avg": "₹6.0 LPA",
            "placement_high": "₹14.0 LPA",
            "established": 1978,
            "facilities": ["Cyber Law Center", "Moot Court Hall", "Hostels"],
            "why_recommended": "Established private law institution with notable alumni in Maharashtra judiciary."
        },
        {
            "college_name": "Rizvi Law College",
            "location": "Bandra West, Mumbai",
            "stream": "Law",
            "branch": "B.L.S. LL.B.",
            "college_type": "Private",
            "cutoff_marks": 83.0,
            "cutoff_percent": 83.0,
            "cutoff_rank": 4600,
            "annual_fees": 60000,
            "rating": 4.3,
            "nirf_rank": "Mumbai University Affiliated",
            "placement_avg": "₹5.5 LPA",
            "placement_high": "₹13.0 LPA",
            "established": 2002,
            "facilities": ["Moot Court", "Library", "Legal Aid Cell"],
            "why_recommended": "Active moot court society with direct access to South Mumbai courts and advocates."
        }
    ],

    "Arts": [
        {
            "college_name": "St. Stephen's College",
            "location": "North Campus, Delhi",
            "stream": "Arts",
            "branch": "B.A. (Hons) Economics / History / English",
            "college_type": "Government",
            "cutoff_marks": 98.0,
            "cutoff_percent": 98.0,
            "annual_fees": 40000,
            "rating": 4.9,
            "nirf_rank": "NIRF Top 2 College",
            "placement_avg": "₹11.0 LPA",
            "placement_high": "₹32.0 LPA",
            "established": 1881,
            "facilities": ["Heritage Dining Hall", "Library", "Amphitheatre"],
            "why_recommended": "Supreme liberal arts college in India with unmatched civil services and consulting alumni."
        },
        {
            "college_name": "Lady Shri Ram College for Women (LSR)",
            "location": "Lajpat Nagar, Delhi",
            "stream": "Arts",
            "branch": "B.A. (Hons) Psychology / Journalism / Political Science",
            "college_type": "Government",
            "cutoff_marks": 97.5,
            "cutoff_percent": 97.5,
            "annual_fees": 25000,
            "rating": 4.9,
            "nirf_rank": "NIRF Top 5",
            "placement_avg": "₹9.8 LPA",
            "placement_high": "₹30.0 LPA",
            "established": 1956,
            "facilities": ["Journalism Lab", "Counseling Cell", "Heritage Gardens"],
            "why_recommended": "Pinnacle women's institution producing civil servants, journalists, and global diplomats."
        },
        {
            "college_name": "Miranda House",
            "location": "North Campus, Delhi",
            "stream": "Arts",
            "branch": "B.A. (Hons) English / Sociology / Geography",
            "college_type": "Government",
            "cutoff_marks": 97.0,
            "cutoff_percent": 97.0,
            "annual_fees": 20000,
            "rating": 4.9,
            "nirf_rank": "NIRF Rank #1 (Colleges)",
            "placement_avg": "₹8.8 LPA",
            "placement_high": "₹22.0 LPA",
            "established": 1948,
            "facilities": ["Digital Audio-Visual Lab", "Heritage Architecture", "Library"],
            "why_recommended": "Ranked #1 college in India with legendary social sciences and literature departments."
        },
        {
            "college_name": "St. Xavier's College",
            "location": "Fort, Mumbai",
            "stream": "Arts",
            "branch": "B.A. Psychology / Ancient Indian Culture / Economics",
            "college_type": "Private",
            "cutoff_marks": 94.5,
            "cutoff_percent": 94.5,
            "annual_fees": 35000,
            "rating": 4.8,
            "nirf_rank": "Autonomous NAAC A++",
            "placement_avg": "₹7.8 LPA",
            "placement_high": "₹20.0 LPA",
            "established": 1869,
            "facilities": ["Gothic Foyer", "Herodian Media Center", "Research Hall"],
            "why_recommended": "Iconic arts college in Mumbai producing award-winning media leaders, authors, and economists."
        },
        {
            "college_name": "Fergusson College",
            "location": "FC Road, Pune",
            "stream": "Arts",
            "branch": "B.A. Psychology / Political Science / Economics",
            "college_type": "Government",
            "cutoff_marks": 91.5,
            "cutoff_percent": 91.5,
            "annual_fees": 30000,
            "rating": 4.7,
            "nirf_rank": "Heritage Autonomous NAAC A++",
            "placement_avg": "₹6.2 LPA",
            "placement_high": "₹15.0 LPA",
            "established": 1885,
            "facilities": ["Amphitheatre", "Wadia Library", "Psychology Lab"],
            "why_recommended": "Birthplace of leading Indian social reformers and politicians with active UPSC study circles."
        },
        {
            "college_name": "Loyola College",
            "location": "Chennai, Tamil Nadu",
            "stream": "Arts",
            "branch": "B.A. Economics / History / English Literature",
            "college_type": "Government",
            "cutoff_marks": 93.0,
            "cutoff_percent": 93.0,
            "annual_fees": 35000,
            "rating": 4.8,
            "nirf_rank": "NIRF Top 4",
            "placement_avg": "₹7.0 LPA",
            "placement_high": "₹18.0 LPA",
            "established": 1925,
            "facilities": ["Visual Communication Studio", "Language Lab", "Library"],
            "why_recommended": "Prominent humanities center in South India known for public service orientation."
        },
        {
            "college_name": "Hindu College",
            "location": "North Campus, Delhi",
            "stream": "Arts",
            "branch": "B.A. (Hons) Political Science / Sociology",
            "college_type": "Government",
            "cutoff_marks": 96.5,
            "cutoff_percent": 96.5,
            "annual_fees": 24000,
            "rating": 4.8,
            "nirf_rank": "NIRF Rank #2",
            "placement_avg": "₹8.5 LPA",
            "placement_high": "₹24.0 LPA",
            "established": 1899,
            "facilities": ["Parliament Mock Hall", "Amphitheatre", "Digital Library"],
            "why_recommended": "Celebrated political science and economics faculties with deep civil service mentorship."
        },
        {
            "college_name": "Madras Christian College (MCC)",
            "location": "Tambaram, Chennai",
            "stream": "Arts",
            "branch": "B.A. History / Political Science / Journalism",
            "college_type": "Government",
            "cutoff_marks": 89.0,
            "cutoff_percent": 89.0,
            "annual_fees": 32000,
            "rating": 4.6,
            "nirf_rank": "NIRF Top 15",
            "placement_avg": "₹5.8 LPA",
            "placement_high": "₹14.0 LPA",
            "established": 1837,
            "facilities": ["Heritage Quadrangle", "Media Lab", "Hostels"],
            "why_recommended": "Historic South Indian institution with distinguished public policy alumni."
        },
        {
            "college_name": "Presidency University",
            "location": "College Street, Kolkata",
            "stream": "Arts",
            "branch": "B.A. (Hons) History / English / Philosophy",
            "college_type": "Government",
            "cutoff_marks": 92.0,
            "cutoff_percent": 92.0,
            "annual_fees": 12000,
            "rating": 4.7,
            "nirf_rank": "Eminent Heritage University",
            "placement_avg": "₹6.0 LPA",
            "placement_high": "₹16.0 LPA",
            "established": 1817,
            "facilities": ["Centenary Library", "Derozio Hall", "Arts Archives"],
            "why_recommended": "Intellectual cradle of modern India producing Nobel laureates and national leaders."
        },
        {
            "college_name": "Ramjas College",
            "location": "North Campus, Delhi",
            "stream": "Arts",
            "branch": "B.A. (Hons) History / Political Science",
            "college_type": "Government",
            "cutoff_marks": 94.0,
            "cutoff_percent": 94.0,
            "annual_fees": 22000,
            "rating": 4.6,
            "nirf_rank": "NIRF Top 20",
            "placement_avg": "₹7.2 LPA",
            "placement_high": "₹19.0 LPA",
            "established": 1917,
            "facilities": ["Auditorium", "Seminar Halls", "Sports Complex"],
            "why_recommended": "North Campus powerhouse for literature, political activism, and UPSC training."
        },
        {
            "college_name": "Symbiosis College of Arts and Commerce",
            "location": "Pune, Maharashtra",
            "stream": "Arts",
            "branch": "B.A. Psychology / English / Economics",
            "college_type": "Private",
            "cutoff_marks": 90.0,
            "cutoff_percent": 90.0,
            "annual_fees": 38000,
            "rating": 4.6,
            "nirf_rank": "Autonomous NAAC A+",
            "placement_avg": "₹6.0 LPA",
            "placement_high": "₹15.0 LPA",
            "established": 1983,
            "facilities": ["Language Lab", "Psychology Studio", "Modern Classrooms"],
            "why_recommended": "Cosmopolitan humanities center with active publishing and corporate communications hiring."
        },
        {
            "college_name": "Mithibai College of Arts",
            "location": "Vile Parle, Mumbai",
            "stream": "Arts",
            "branch": "B.A. Psychology / Sociology / English Literature",
            "college_type": "Private",
            "cutoff_marks": 90.5,
            "cutoff_percent": 90.5,
            "annual_fees": 30000,
            "rating": 4.6,
            "nirf_rank": "Autonomous Grade A",
            "placement_avg": "₹6.2 LPA",
            "placement_high": "₹16.0 LPA",
            "established": 1961,
            "facilities": ["Media Lab", "Counseling Center", "Library"],
            "why_recommended": "Celebrated cultural institution with active campus placements across PR, media, and marketing."
        },
        {
            "college_name": "Stella Maris College",
            "location": "Cathedral Road, Chennai",
            "stream": "Arts",
            "branch": "B.A. International Studies / English / Sociology",
            "college_type": "Government",
            "cutoff_marks": 89.5,
            "cutoff_percent": 89.5,
            "annual_fees": 30000,
            "rating": 4.6,
            "nirf_rank": "NIRF Top 30",
            "placement_avg": "₹5.8 LPA",
            "placement_high": "₹14.0 LPA",
            "established": 1947,
            "facilities": ["International Studies Center", "Library", "Open Air Theatre"],
            "why_recommended": "Distinguished women's college providing specialized courses in global diplomacy."
        },
        {
            "college_name": "Gargi College",
            "location": "Siri Fort, New Delhi",
            "stream": "Arts",
            "branch": "B.A. (Hons) Applied Psychology / History",
            "college_type": "Government",
            "cutoff_marks": 93.0,
            "cutoff_percent": 93.0,
            "annual_fees": 20000,
            "rating": 4.5,
            "nirf_rank": "NIRF Top 20",
            "placement_avg": "₹6.5 LPA",
            "placement_high": "₹16.5 LPA",
            "established": 1967,
            "facilities": ["Psychology Laboratories", "Auditorium", "Library"],
            "why_recommended": "South Campus leader in clinical psychology and humanities with vibrant campus societies."
        },
        {
            "college_name": "Jai Hind College",
            "location": "Churchgate, Mumbai",
            "stream": "Arts",
            "branch": "B.A. Psychology / Economics / Media Studies",
            "college_type": "Private",
            "cutoff_marks": 91.0,
            "cutoff_percent": 91.0,
            "annual_fees": 32000,
            "rating": 4.6,
            "nirf_rank": "Autonomous NAAC A++",
            "placement_avg": "₹6.8 LPA",
            "placement_high": "₹18.0 LPA",
            "established": 1948,
            "facilities": ["Media Sound Studio", "Auditorium", "Marine Drive Proximity"],
            "why_recommended": "Prime South Mumbai location providing immediate access to advertising and media firms."
        },
        {
            "college_name": "Indraprastha College for Women (IP College)",
            "location": "Civil Lines, Delhi",
            "stream": "Arts",
            "branch": "B.A. (Hons) Mass Media / Political Science",
            "college_type": "Government",
            "cutoff_marks": 93.5,
            "cutoff_percent": 93.5,
            "annual_fees": 25000,
            "rating": 4.5,
            "nirf_rank": "Oldest Women's College in Delhi",
            "placement_avg": "₹6.5 LPA",
            "placement_high": "₹17.0 LPA",
            "established": 1924,
            "facilities": ["Audio-Visual Production Studio", "Heritage Campus", "Hostels"],
            "why_recommended": "Pioneered mass media studies in Delhi University with exceptional broadcast alumni."
        },
        {
            "college_name": "Sophia College for Women",
            "location": "Breach Candy, Mumbai",
            "stream": "Arts",
            "branch": "B.A. Psychology / Philosophy / Literature",
            "college_type": "Government",
            "cutoff_marks": 88.5,
            "cutoff_percent": 88.5,
            "annual_fees": 28000,
            "rating": 4.5,
            "nirf_rank": "Autonomous NAAC A",
            "placement_avg": "₹5.5 LPA",
            "placement_high": "₹14.0 LPA",
            "established": 1940,
            "facilities": ["Historic Heritage Hall", "Counseling Center", "Library"],
            "why_recommended": "South Mumbai landmark institution with high reputations in clinical psychology."
        },
        {
            "college_name": "Christ University (Department of Humanities)",
            "location": "Bengaluru, Karnataka",
            "stream": "Arts",
            "branch": "B.A. Journalism / Psychology / English",
            "college_type": "Private",
            "cutoff_marks": 89.0,
            "cutoff_percent": 89.0,
            "annual_fees": 140000,
            "rating": 4.5,
            "nirf_rank": "Deemed University",
            "placement_avg": "₹6.2 LPA",
            "placement_high": "₹16.0 LPA",
            "established": 1969,
            "facilities": ["Television Studio", "Psychometric Labs", "Language Center"],
            "why_recommended": "State-of-the-art media broadcasting and behavioral science facilities with top recruiters."
        },
        {
            "college_name": "Modern College of Arts, Science & Commerce",
            "location": "Shivajinagar, Pune",
            "stream": "Arts",
            "branch": "B.A. English / Geography / History",
            "college_type": "Government",
            "cutoff_marks": 85.0,
            "cutoff_percent": 85.0,
            "annual_fees": 25000,
            "rating": 4.4,
            "nirf_rank": "Autonomous Grade A+",
            "placement_avg": "₹4.8 LPA",
            "placement_high": "₹12.0 LPA",
            "established": 1970,
            "facilities": ["Language Lab", "Library", "Placement Cell"],
            "why_recommended": "Affordable humanities education in Pune with active government service guidance."
        },
        {
            "college_name": "Mount Carmel College",
            "location": "Vasanth Nagar, Bengaluru",
            "stream": "Arts",
            "branch": "B.A. Communication Studies / Travel & Tourism",
            "college_type": "Private",
            "cutoff_marks": 88.0,
            "cutoff_percent": 88.0,
            "annual_fees": 65000,
            "rating": 4.5,
            "nirf_rank": "Autonomous NAAC A+",
            "placement_avg": "₹5.8 LPA",
            "placement_high": "₹15.0 LPA",
            "established": 1948,
            "facilities": ["Radio Studio", "Amphitheatre", "Language Center"],
            "why_recommended": "Eminent private institution in Bengaluru with notable media, art, and civil leadership."
        },
        {
            "college_name": "K.J. Somaiya College of Arts and Commerce",
            "location": "Vidyavihar, Mumbai",
            "stream": "Arts",
            "branch": "B.A. Economics / Sociology / Philosophy",
            "college_type": "Private",
            "cutoff_marks": 86.5,
            "cutoff_percent": 86.5,
            "annual_fees": 30000,
            "rating": 4.4,
            "nirf_rank": "Somaiya University",
            "placement_avg": "₹5.0 LPA",
            "placement_high": "₹12.5 LPA",
            "established": 1960,
            "facilities": ["Green Campus", "Language Lab", "Auditorium"],
            "why_recommended": "Vast educational campus with extensive extracurricular societies and publishing."
        }
    ]
}


def adapt_catalog_college_for_student(item: dict, profile: StudentProfile, score_info: dict) -> dict:
    """Accurately calculates student cutoff number based on exam type and score unit."""
    unit = score_info["unit"]
    if unit == "rank":
        cutoff_val = item.get("cutoff_rank") or int(max(300, (100 - item.get("cutoff_marks", 85)) * 1200))
    elif unit == "marks_720":
        cutoff_val = item.get("cutoff_neet") or int(item.get("cutoff_marks", 85) * 7.2)
    else:
        cutoff_val = item.get("cutoff_percent") or item.get("cutoff_marks", 85.0)

    eligibility = get_eligibility_status(profile.marks, cutoff_val, profile.exam_type, unit)
    img = get_college_image(item["college_name"], item["stream"])

    return {
        **item,
        "cutoff_marks": int(cutoff_val) if score_info["is_rank"] else round(cutoff_val, 1),
        "image_url": img,
        "eligibility": eligibility,
        "student_marks": profile.marks,
        "score_unit": unit,
        "score_unit_display": score_info["display"],
        "exam_type": profile.exam_type,
    }


def get_featured_colleges(stream: str = "All", exam_type: str = "") -> list:
    """Return featured colleges for the landing page or a specific stream strictly matched to exam."""
    colleges = []
    if stream == "All" and not exam_type:
        # 3 from each major stream
        for s in ["Engineering", "Medical", "Design", "Science", "Commerce", "Law", "Arts"]:
            colleges.extend(FALLBACK_COLLEGE_CATALOG.get(s, [])[:3])
    else:
        target_stream = stream if stream != "All" else "Engineering"
        colleges = get_catalog_for_exam_and_stream(target_stream, exam_type)

    results = []
    for c in colleges:
        img = get_college_image(c["college_name"], c["stream"])
        results.append({
            **c,
            "image_url": img,
            "eligibility": {"status": "eligible", "label": "Featured", "color": "primary"},
            "student_marks": 90.0,
            "score_unit": "percentage",
            "score_unit_display": "%",
            "exam_type": exam_type or "Entrance Exam"
        })
    return results


async def get_live_college_recommendations(profile: StudentProfile) -> list:
    """
    Fetch LIVE AI recommendations using Gemini API, strictly matching the student's stream,
    and guaranteed to return AT LEAST 20 colleges for the dashboard.
    """
    score_info = get_exam_score_info(profile.exam_type, getattr(profile, "score_unit", ""))
    formatted_score = format_score_text(profile.marks, profile.exam_type, getattr(profile, "score_unit", ""))

    # Fetch exact curated exam-matched catalog (20+ colleges for MHT-CET, JEE Main, JEE Adv, NEET, etc.)
    raw_catalog = get_catalog_for_exam_and_stream(profile.stream, profile.exam_type)

    curated_pool = [
        adapt_catalog_college_for_student(c, profile, score_info)
        for c in raw_catalog
    ]

    prompt = generate_prompt_from_edit_profile(profile)

    models_to_try = [GEMINI_MODEL] + [m for m in FALLBACK_MODELS if m != GEMINI_MODEL]

    for model_name in models_to_try:
        try:
            loop = asyncio.get_event_loop()
            resp = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    lambda: client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=0.2,
                            response_mime_type="application/json"
                        )
                    )
                ),
                timeout=9.5
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
                ai_results = []
                for c in colleges_data:
                    cname = str(c.get("college_name", "College"))
                    # STRICT STREAM CHECK: Reject if AI gave wrong stream!
                    item_stream = str(c.get("stream", profile.stream))
                    if item_stream.lower() != profile.stream.lower():
                        continue

                    # STRICT EXAM TYPE POST-FILTER (CRITICAL RULE):
                    # 1. JEE Advanced: Candidate appeared for JEE Advanced -> MUST be an IIT!
                    if "advanced" in exam_lower and not is_iit_college(cname):
                        continue

                    # 2. JEE Main: Candidate appeared for JEE Main -> CANNOT be an IIT (IIT requires JEE Advanced)
                    if "main" in exam_lower and is_iit_college(cname):
                        continue

                    # 3. MHT-CET: Candidate appeared for MHT-CET -> CANNOT be an IIT, NIT, BITS, VIT Vellore, SRM
                    if "cet" in exam_lower:
                        if is_iit_college(cname) or is_nit_college(cname):
                            continue
                        if any(k in cname.lower() for k in ["bits pilani", "vit vellore", "srm institute"]):
                            continue

                    # 4. NEET: MUST be a medical / dental college (AIIMS, JIPMER, GMC, etc.)
                    if ("neet" in exam_lower or profile.stream.lower() == "medical") and not any(k in cname.lower() for k in [
                        "medical", "aiims", "jipmer", "hospital", "institute of medical", "gmc", "afmc", "kem", "dental"
                    ]):
                        continue

                    default_cut = 5000 if score_info["is_rank"] else (580 if score_info["unit"] == "marks_720" else 75.0)
                    cutoff = parse_number(c.get("cutoff_marks"), default_cut)
                    fees = parse_fees(c.get("annual_fees"), 100000)
                    rating = parse_number(c.get("rating"), 4.3)
                    eligibility = get_eligibility_status(profile.marks, cutoff, profile.exam_type, score_info["unit"])
                    image_url = get_college_image(cname, profile.stream)

                    ai_results.append({
                        "college_name": cname,
                        "location": str(c.get("location", "India")),
                        "stream": profile.stream,
                        "branch": str(c.get("branch", f"Program in {profile.stream}")),
                        "college_type": str(c.get("college_type", "Government")),
                        "cutoff_marks": int(cutoff) if score_info["is_rank"] else round(cutoff, 1),
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
                        "score_unit": score_info["unit"],
                        "score_unit_display": score_info["display"],
                        "exam_type": profile.exam_type,
                    })

                # If AI returned at least 20, return them!
                if len(ai_results) >= 20:
                    return ai_results

                # If AI returned between 1 and 19, supplement from curated pool to guarantee >= 20
                existing_names = {c["college_name"].lower() for c in ai_results}
                combined = list(ai_results)
                for item in curated_pool:
                    if item["college_name"].lower() not in existing_names:
                        combined.append(item)
                        existing_names.add(item["college_name"].lower())
                    if len(combined) >= 22:
                        break
                return combined
        except Exception as e:
            print(f"Warning: Model {model_name} failed: {e}")
            continue

    # Fallback to curated catalog (Guarantees at least 20 colleges for THIS stream)
    print(f"Using rich curated catalog for stream: {profile.stream} ({len(curated_pool)} colleges)...")
    return curated_pool
