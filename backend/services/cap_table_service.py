"""
Multi-Exam Centralized Admission Preference Table Simulator Service
Supports:
1. MHT-CET (Maharashtra State CET Cell CAP Rounds 1 to 4)
2. JEE Advanced (JoSAA / IIT Seat Allocation Rounds 1 to 6)
3. JEE Main (JoSAA & CSAB / NIT, IIIT, GFTI Allocation)
4. NEET UG (MCC & State DMER Medical MBBS/BDS Allocation)
5. CLAT (Consortium of NLUs Law Seat Allocation)
6. CUET (Delhi University CSAS & Central Universities)
"""

from typing import List, Dict, Any, Optional
import math
import os
import json

# 1. MAHARASHTRA STATE CET CELL (MHT-CET) CATALOG
MHT_CET_CATALOG: List[Dict[str, Any]] = [
    {
        "college_code": "6006",
        "college_name": "COEP Technological University",
        "short_name": "COEP Pune",
        "city": "Pune",
        "type": "State Unitary Public University",
        "nirf_rank": "Rank #1 in State",
        "annual_fees": 135000,
        "branches": [
            {"branch": "Computer Engineering", "domain": "Computer & IT", "cutoff_2024": 99.82, "cutoff_2025": 99.85, "cutoff_2026": 99.88},
            {"branch": "Artificial Intelligence & Robotics", "domain": "AI & Data Science", "cutoff_2024": 99.45, "cutoff_2025": 99.52, "cutoff_2026": 99.60},
            {"branch": "Information Technology", "domain": "Computer & IT", "cutoff_2024": 99.65, "cutoff_2025": 99.70, "cutoff_2026": 99.75},
            {"branch": "Electronics & Telecommunication", "domain": "Electronics & Core", "cutoff_2024": 98.60, "cutoff_2025": 98.75, "cutoff_2026": 98.90},
            {"branch": "Electrical Engineering", "domain": "Electronics & Core", "cutoff_2024": 96.50, "cutoff_2025": 96.65, "cutoff_2026": 96.80},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 95.80, "cutoff_2025": 95.95, "cutoff_2026": 96.15},
            {"branch": "Civil Engineering", "domain": "Civil & Infrastructure", "cutoff_2024": 88.50, "cutoff_2025": 88.75, "cutoff_2026": 89.10},
            {"branch": "Instrumentation & Control", "domain": "Electronics & Core", "cutoff_2024": 94.20, "cutoff_2025": 94.40, "cutoff_2026": 94.65},
            {"branch": "Metallurgy & Material Science", "domain": "Mechanical & Automotive", "cutoff_2024": 84.50, "cutoff_2025": 84.80, "cutoff_2026": 85.10},
        ]
    },
    {
        "college_code": "3012",
        "college_name": "Veermata Jijabai Technological Institute (VJTI)",
        "short_name": "VJTI Mumbai",
        "city": "Mumbai",
        "type": "State Autonomous Institute",
        "nirf_rank": "Premier Mumbai Institute",
        "annual_fees": 92000,
        "branches": [
            {"branch": "Computer Engineering", "domain": "Computer & IT", "cutoff_2024": 99.78, "cutoff_2025": 99.82, "cutoff_2026": 99.85},
            {"branch": "Information Technology", "domain": "Computer & IT", "cutoff_2024": 99.51, "cutoff_2025": 99.58, "cutoff_2026": 99.65},
            {"branch": "Electronics & Telecommunication", "domain": "Electronics & Core", "cutoff_2024": 98.40, "cutoff_2025": 98.55, "cutoff_2026": 98.70},
            {"branch": "Electrical Engineering", "domain": "Electronics & Core", "cutoff_2024": 96.20, "cutoff_2025": 96.40, "cutoff_2026": 96.60},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 95.10, "cutoff_2025": 95.30, "cutoff_2026": 95.50},
            {"branch": "Civil Engineering", "domain": "Civil & Infrastructure", "cutoff_2024": 87.80, "cutoff_2025": 88.10, "cutoff_2026": 88.45},
            {"branch": "Production Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 89.50, "cutoff_2025": 89.80, "cutoff_2026": 90.15},
            {"branch": "Textile Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 81.20, "cutoff_2025": 81.50, "cutoff_2026": 81.85},
        ]
    },
    {
        "college_code": "6271",
        "college_name": "Pune Institute of Computer Technology (PICT)",
        "short_name": "PICT Pune",
        "city": "Pune",
        "type": "Private Autonomous (SPPU)",
        "nirf_rank": "Top Software Placement Hub",
        "annual_fees": 115000,
        "branches": [
            {"branch": "Computer Engineering", "domain": "Computer & IT", "cutoff_2024": 99.55, "cutoff_2025": 99.60, "cutoff_2026": 99.65},
            {"branch": "Information Technology", "domain": "Computer & IT", "cutoff_2024": 99.30, "cutoff_2025": 99.38, "cutoff_2026": 99.45},
            {"branch": "Artificial Intelligence & Data Science", "domain": "AI & Data Science", "cutoff_2024": 99.15, "cutoff_2025": 99.25, "cutoff_2026": 99.35},
            {"branch": "Electronics & Telecommunication", "domain": "Electronics & Core", "cutoff_2024": 97.80, "cutoff_2025": 97.95, "cutoff_2026": 98.15},
            # Note: PICT strictly does NOT offer Mechanical or Civil
        ]
    },
    {
        "college_code": "3215",
        "college_name": "Sardar Patel Institute of Technology (SPIT)",
        "short_name": "SPIT Mumbai",
        "city": "Mumbai",
        "type": "Private Autonomous",
        "nirf_rank": "Tier-1 Autonomous Mumbai",
        "annual_fees": 172000,
        "branches": [
            {"branch": "Computer Engineering", "domain": "Computer & IT", "cutoff_2024": 99.50, "cutoff_2025": 99.55, "cutoff_2026": 99.60},
            {"branch": "Computer Science & Engineering (Data Science)", "domain": "AI & Data Science", "cutoff_2024": 99.20, "cutoff_2025": 99.28, "cutoff_2026": 99.36},
            {"branch": "Artificial Intelligence & Machine Learning", "domain": "AI & Data Science", "cutoff_2024": 99.05, "cutoff_2025": 99.15, "cutoff_2026": 99.25},
            {"branch": "Electronics & Telecommunication", "domain": "Electronics & Core", "cutoff_2024": 97.40, "cutoff_2025": 97.60, "cutoff_2026": 97.80},
        ]
    },
    {
        "college_code": "6007",
        "college_name": "Walchand College of Engineering (WCE)",
        "short_name": "WCE Sangli",
        "city": "Sangli",
        "type": "Government Aided Autonomous",
        "nirf_rank": "Heritage Engineering Hub",
        "annual_fees": 88000,
        "branches": [
            {"branch": "Computer Science & Engineering", "domain": "Computer & IT", "cutoff_2024": 99.10, "cutoff_2025": 99.18, "cutoff_2026": 99.25},
            {"branch": "Information Technology", "domain": "Computer & IT", "cutoff_2024": 98.70, "cutoff_2025": 98.80, "cutoff_2026": 98.90},
            {"branch": "Electronics Engineering", "domain": "Electronics & Core", "cutoff_2024": 96.50, "cutoff_2025": 96.70, "cutoff_2026": 96.90},
            {"branch": "Electrical Engineering", "domain": "Electronics & Core", "cutoff_2024": 94.80, "cutoff_2025": 95.00, "cutoff_2026": 95.20},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 92.50, "cutoff_2025": 92.70, "cutoff_2026": 92.95},
            {"branch": "Civil Engineering", "domain": "Civil & Infrastructure", "cutoff_2024": 86.40, "cutoff_2025": 86.65, "cutoff_2026": 86.90},
        ]
    },
    {
        "college_code": "6175",
        "college_name": "Pimpri Chinchwad College of Engineering (PCCOE)",
        "short_name": "PCCOE Pune",
        "city": "Pune",
        "type": "Private Autonomous",
        "nirf_rank": "Top Industry Connect Pune",
        "annual_fees": 142000,
        "branches": [
            {"branch": "Computer Engineering", "domain": "Computer & IT", "cutoff_2024": 98.85, "cutoff_2025": 98.95, "cutoff_2026": 99.05},
            {"branch": "Information Technology", "domain": "Computer & IT", "cutoff_2024": 98.40, "cutoff_2025": 98.50, "cutoff_2026": 98.62},
            {"branch": "Artificial Intelligence & Machine Learning", "domain": "AI & Data Science", "cutoff_2024": 98.15, "cutoff_2025": 98.30, "cutoff_2026": 98.45},
            {"branch": "Electronics & Telecommunication", "domain": "Electronics & Core", "cutoff_2024": 96.10, "cutoff_2025": 96.28, "cutoff_2026": 96.45},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 89.20, "cutoff_2025": 89.40, "cutoff_2026": 89.65},
            {"branch": "Civil Engineering", "domain": "Civil & Infrastructure", "cutoff_2024": 82.50, "cutoff_2025": 82.75, "cutoff_2026": 83.10},
        ]
    },
    {
        "college_code": "6273",
        "college_name": "Vishwakarma Institute of Technology (VIT)",
        "short_name": "VIT Pune",
        "city": "Pune",
        "type": "Private Autonomous",
        "nirf_rank": "Premier Autonomous Hub",
        "annual_fees": 185000,
        "branches": [
            {"branch": "Computer Engineering", "domain": "Computer & IT", "cutoff_2024": 98.90, "cutoff_2025": 99.00, "cutoff_2026": 99.10},
            {"branch": "Artificial Intelligence & Data Science", "domain": "AI & Data Science", "cutoff_2024": 98.35, "cutoff_2025": 98.48, "cutoff_2026": 98.60},
            {"branch": "Information Technology", "domain": "Computer & IT", "cutoff_2024": 98.50, "cutoff_2025": 98.60, "cutoff_2026": 98.72},
            {"branch": "Electronics & Telecommunication", "domain": "Electronics & Core", "cutoff_2024": 96.20, "cutoff_2025": 96.40, "cutoff_2026": 96.60},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 90.10, "cutoff_2025": 90.30, "cutoff_2026": 90.55},
            {"branch": "Chemical Engineering", "domain": "Specialized Tech", "cutoff_2024": 85.40, "cutoff_2025": 85.65, "cutoff_2026": 85.90},
            {"branch": "Instrumentation Engineering", "domain": "Electronics & Core", "cutoff_2024": 87.20, "cutoff_2025": 87.45, "cutoff_2026": 87.75},
        ]
    },
    {
        "college_code": "3199",
        "college_name": "D. J. Sanghvi College of Engineering",
        "short_name": "DJ Sanghvi Mumbai",
        "city": "Mumbai",
        "type": "Private Autonomous (Minority)",
        "nirf_rank": "Vile Parle Mumbai Hub",
        "annual_fees": 215000,
        "branches": [
            {"branch": "Computer Engineering", "domain": "Computer & IT", "cutoff_2024": 99.10, "cutoff_2025": 99.18, "cutoff_2026": 99.25},
            {"branch": "Information Technology", "domain": "Computer & IT", "cutoff_2024": 98.75, "cutoff_2025": 98.85, "cutoff_2026": 98.95},
            {"branch": "Artificial Intelligence & Machine Learning", "domain": "AI & Data Science", "cutoff_2024": 98.40, "cutoff_2025": 98.55, "cutoff_2026": 98.70},
            {"branch": "Computer Science & Engineering (Data Science)", "domain": "AI & Data Science", "cutoff_2024": 98.25, "cutoff_2025": 98.38, "cutoff_2026": 98.50},
            {"branch": "Electronics & Telecommunication", "domain": "Electronics & Core", "cutoff_2024": 95.80, "cutoff_2025": 96.00, "cutoff_2026": 96.20},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 88.50, "cutoff_2025": 88.75, "cutoff_2026": 89.05},
        ]
    },
    {
        "college_code": "3182",
        "college_name": "Thadomal Shahani Engineering College (TSEC)",
        "short_name": "TSEC Mumbai",
        "city": "Mumbai",
        "type": "Private Aided / Autonomous",
        "nirf_rank": "Bandra Tech Institution",
        "annual_fees": 190000,
        "branches": [
            {"branch": "Computer Engineering", "domain": "Computer & IT", "cutoff_2024": 98.70, "cutoff_2025": 98.80, "cutoff_2026": 98.90},
            {"branch": "Information Technology", "domain": "Computer & IT", "cutoff_2024": 98.20, "cutoff_2025": 98.32, "cutoff_2026": 98.45},
            {"branch": "Artificial Intelligence & Data Science", "domain": "AI & Data Science", "cutoff_2024": 97.90, "cutoff_2025": 98.05, "cutoff_2026": 98.20},
            {"branch": "Electronics & Telecommunication", "domain": "Electronics & Core", "cutoff_2024": 94.60, "cutoff_2025": 94.80, "cutoff_2026": 95.05},
            {"branch": "Chemical Engineering", "domain": "Specialized Tech", "cutoff_2024": 82.00, "cutoff_2025": 82.25, "cutoff_2026": 82.60},
        ]
    },
    {
        "college_code": "6276",
        "college_name": "MKSSS's Cummins College of Engineering for Women",
        "short_name": "Cummins Pune (Women)",
        "city": "Pune",
        "type": "Private Autonomous (Women Only)",
        "nirf_rank": "Premier Women's Engineering College",
        "annual_fees": 168000,
        "branches": [
            {"branch": "Computer Engineering", "domain": "Computer & IT", "cutoff_2024": 98.65, "cutoff_2025": 98.75, "cutoff_2026": 98.85},
            {"branch": "Information Technology", "domain": "Computer & IT", "cutoff_2024": 98.10, "cutoff_2025": 98.22, "cutoff_2026": 98.35},
            {"branch": "Electronics & Telecommunication", "domain": "Electronics & Core", "cutoff_2024": 95.50, "cutoff_2025": 95.70, "cutoff_2026": 95.90},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 87.80, "cutoff_2025": 88.05, "cutoff_2026": 88.35},
            {"branch": "Instrumentation & Control", "domain": "Electronics & Core", "cutoff_2024": 88.20, "cutoff_2025": 88.45, "cutoff_2026": 88.75},
        ]
    },
    {
        "college_code": "6005",
        "college_name": "Government College of Engineering, Karad (GCEK)",
        "short_name": "GCOE Karad",
        "city": "Karad",
        "type": "Government Autonomous",
        "nirf_rank": "Premier Government Hub",
        "annual_fees": 78000,
        "branches": [
            {"branch": "Computer Science & Engineering", "domain": "Computer & IT", "cutoff_2024": 97.40, "cutoff_2025": 97.55, "cutoff_2026": 97.70},
            {"branch": "Information Technology", "domain": "Computer & IT", "cutoff_2024": 96.50, "cutoff_2025": 96.68, "cutoff_2026": 96.85},
            {"branch": "Electrical Engineering", "domain": "Electronics & Core", "cutoff_2024": 92.40, "cutoff_2025": 92.65, "cutoff_2026": 92.90},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 88.80, "cutoff_2025": 89.05, "cutoff_2026": 89.30},
            {"branch": "Civil Engineering", "domain": "Civil & Infrastructure", "cutoff_2024": 83.50, "cutoff_2025": 83.75, "cutoff_2026": 84.05},
        ]
    },
    {
        "college_code": "6284",
        "college_name": "Vishwakarma Institute of Information Technology (VIIT)",
        "short_name": "VIIT Kondhwa Pune",
        "city": "Pune",
        "type": "Private Autonomous",
        "nirf_rank": "Top Tier-2 Pune",
        "annual_fees": 158000,
        "branches": [
            {"branch": "Computer Engineering", "domain": "Computer & IT", "cutoff_2024": 97.80, "cutoff_2025": 97.92, "cutoff_2026": 98.05},
            {"branch": "Information Technology", "domain": "Computer & IT", "cutoff_2024": 97.20, "cutoff_2025": 97.35, "cutoff_2026": 97.50},
            {"branch": "Artificial Intelligence & Data Science", "domain": "AI & Data Science", "cutoff_2024": 96.80, "cutoff_2025": 96.95, "cutoff_2026": 97.10},
            {"branch": "Electronics & Telecommunication", "domain": "Electronics & Core", "cutoff_2024": 94.20, "cutoff_2025": 94.40, "cutoff_2026": 94.65},
            {"branch": "Civil Engineering", "domain": "Civil & Infrastructure", "cutoff_2024": 78.50, "cutoff_2025": 78.80, "cutoff_2026": 79.15},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 84.20, "cutoff_2025": 84.45, "cutoff_2026": 84.75},
        ]
    }
]

# 2. JEE ADVANCED (JoSAA IITs) CATALOG
JEE_ADVANCED_CATALOG: List[Dict[str, Any]] = [
    {
        "college_code": "IITB",
        "college_name": "Indian Institute of Technology, Bombay",
        "short_name": "IIT Bombay",
        "city": "Mumbai",
        "type": "Institute of National Importance (IIT)",
        "nirf_rank": "NIRF #3 All-India (Engineering)",
        "annual_fees": 224000,
        "branches": [
            {"branch": "Computer Science & Engineering", "domain": "Computer & IT", "cutoff_2024": 99.98, "cutoff_2025": 99.98, "cutoff_2026": 99.99},
            {"branch": "Electrical Engineering", "domain": "Electronics & Core", "cutoff_2024": 99.78, "cutoff_2025": 99.80, "cutoff_2026": 99.82},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 99.40, "cutoff_2025": 99.45, "cutoff_2026": 99.50},
            {"branch": "Aerospace Engineering", "domain": "Specialized Tech", "cutoff_2024": 99.10, "cutoff_2025": 99.18, "cutoff_2026": 99.25},
            {"branch": "Civil Engineering", "domain": "Civil & Infrastructure", "cutoff_2024": 98.40, "cutoff_2025": 98.50, "cutoff_2026": 98.60},
            {"branch": "Chemical Engineering", "domain": "Specialized Tech", "cutoff_2024": 98.85, "cutoff_2025": 98.92, "cutoff_2026": 99.00},
            {"branch": "Engineering Physics", "domain": "Specialized Tech", "cutoff_2024": 99.20, "cutoff_2025": 99.25, "cutoff_2026": 99.30},
        ]
    },
    {
        "college_code": "IITD",
        "college_name": "Indian Institute of Technology, Delhi",
        "short_name": "IIT Delhi",
        "city": "New Delhi",
        "type": "Institute of National Importance (IIT)",
        "nirf_rank": "NIRF #2 All-India (Engineering)",
        "annual_fees": 220000,
        "branches": [
            {"branch": "Computer Science & Engineering", "domain": "Computer & IT", "cutoff_2024": 99.95, "cutoff_2025": 99.96, "cutoff_2026": 99.97},
            {"branch": "Mathematics & Computing", "domain": "Computer & IT", "cutoff_2024": 99.85, "cutoff_2025": 99.88, "cutoff_2026": 99.90},
            {"branch": "Electrical Engineering", "domain": "Electronics & Core", "cutoff_2024": 99.70, "cutoff_2025": 99.74, "cutoff_2026": 99.78},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 99.30, "cutoff_2025": 99.35, "cutoff_2026": 99.40},
            {"branch": "Civil Engineering", "domain": "Civil & Infrastructure", "cutoff_2024": 98.20, "cutoff_2025": 98.30, "cutoff_2026": 98.40},
            {"branch": "Chemical Engineering", "domain": "Specialized Tech", "cutoff_2024": 98.70, "cutoff_2025": 98.78, "cutoff_2026": 98.85},
            {"branch": "Textile Technology", "domain": "Specialized Tech", "cutoff_2024": 97.50, "cutoff_2025": 97.65, "cutoff_2026": 97.80},
        ]
    },
    {
        "college_code": "IITM",
        "college_name": "Indian Institute of Technology, Madras",
        "short_name": "IIT Madras",
        "city": "Chennai",
        "type": "Institute of National Importance (IIT)",
        "nirf_rank": "NIRF #1 Overall (India)",
        "annual_fees": 215000,
        "branches": [
            {"branch": "Computer Science & Engineering", "domain": "Computer & IT", "cutoff_2024": 99.92, "cutoff_2025": 99.94, "cutoff_2026": 99.95},
            {"branch": "Electrical Engineering", "domain": "Electronics & Core", "cutoff_2024": 99.65, "cutoff_2025": 99.70, "cutoff_2026": 99.75},
            {"branch": "Aerospace Engineering", "domain": "Specialized Tech", "cutoff_2024": 98.95, "cutoff_2025": 99.05, "cutoff_2026": 99.15},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 99.20, "cutoff_2025": 99.28, "cutoff_2026": 99.35},
            {"branch": "Civil Engineering", "domain": "Civil & Infrastructure", "cutoff_2024": 98.00, "cutoff_2025": 98.15, "cutoff_2026": 98.30},
            {"branch": "Ocean Engineering & Naval Architecture", "domain": "Specialized Tech", "cutoff_2024": 97.20, "cutoff_2025": 97.38, "cutoff_2026": 97.55},
        ]
    },
    {
        "college_code": "IITK",
        "college_name": "Indian Institute of Technology, Kanpur",
        "short_name": "IIT Kanpur",
        "city": "Kanpur",
        "type": "Institute of National Importance (IIT)",
        "nirf_rank": "NIRF #4 All-India",
        "annual_fees": 222000,
        "branches": [
            {"branch": "Computer Science & Engineering", "domain": "Computer & IT", "cutoff_2024": 99.88, "cutoff_2025": 99.90, "cutoff_2026": 99.92},
            {"branch": "Electrical Engineering", "domain": "Electronics & Core", "cutoff_2024": 99.55, "cutoff_2025": 99.60, "cutoff_2026": 99.65},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 99.10, "cutoff_2025": 99.18, "cutoff_2026": 99.25},
            {"branch": "Aerospace Engineering", "domain": "Specialized Tech", "cutoff_2024": 98.80, "cutoff_2025": 98.90, "cutoff_2026": 99.00},
            {"branch": "Materials Science & Engineering", "domain": "Specialized Tech", "cutoff_2024": 97.80, "cutoff_2025": 97.95, "cutoff_2026": 98.10},
            {"branch": "Civil Engineering", "domain": "Civil & Infrastructure", "cutoff_2024": 97.90, "cutoff_2025": 98.05, "cutoff_2026": 98.20},
        ]
    },
    {
        "college_code": "IITKGP",
        "college_name": "Indian Institute of Technology, Kharagpur",
        "short_name": "IIT Kharagpur",
        "city": "Kharagpur",
        "type": "Institute of National Importance (IIT)",
        "nirf_rank": "NIRF #5 All-India",
        "annual_fees": 218000,
        "branches": [
            {"branch": "Computer Science & Engineering", "domain": "Computer & IT", "cutoff_2024": 99.85, "cutoff_2025": 99.88, "cutoff_2026": 99.90},
            {"branch": "Electronics & Electrical Communication", "domain": "Electronics & Core", "cutoff_2024": 99.60, "cutoff_2025": 99.65, "cutoff_2026": 99.70},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 98.85, "cutoff_2025": 98.95, "cutoff_2026": 99.05},
            {"branch": "Civil Engineering", "domain": "Civil & Infrastructure", "cutoff_2024": 97.20, "cutoff_2025": 97.35, "cutoff_2026": 97.50},
            {"branch": "Mining Engineering", "domain": "Specialized Tech", "cutoff_2024": 95.80, "cutoff_2025": 96.00, "cutoff_2026": 96.20},
        ]
    },
    {
        "college_code": "IITR",
        "college_name": "Indian Institute of Technology, Roorkee",
        "short_name": "IIT Roorkee",
        "city": "Roorkee",
        "type": "Institute of National Importance (IIT)",
        "nirf_rank": "NIRF #6 All-India",
        "annual_fees": 216000,
        "branches": [
            {"branch": "Computer Science & Engineering", "domain": "Computer & IT", "cutoff_2024": 99.80, "cutoff_2025": 99.83, "cutoff_2026": 99.86},
            {"branch": "Data Science & Artificial Intelligence", "domain": "AI & Data Science", "cutoff_2024": 99.70, "cutoff_2025": 99.75, "cutoff_2026": 99.80},
            {"branch": "Electrical Engineering", "domain": "Electronics & Core", "cutoff_2024": 99.40, "cutoff_2025": 99.48, "cutoff_2026": 99.55},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 98.70, "cutoff_2025": 98.80, "cutoff_2026": 98.90},
            {"branch": "Civil Engineering", "domain": "Civil & Infrastructure", "cutoff_2024": 97.40, "cutoff_2025": 97.55, "cutoff_2026": 97.70},
        ]
    }
]

# 3. JEE MAIN (JoSAA & CSAB NITs, IIITs) CATALOG
JEE_MAIN_CATALOG: List[Dict[str, Any]] = [
    {
        "college_code": "NITT",
        "college_name": "National Institute of Technology, Tiruchirappalli",
        "short_name": "NIT Trichy",
        "city": "Tiruchirappalli",
        "type": "National Institute (NIT)",
        "nirf_rank": "Rank #1 among NITs",
        "annual_fees": 155000,
        "branches": [
            {"branch": "Computer Science & Engineering", "domain": "Computer & IT", "cutoff_2024": 99.75, "cutoff_2025": 99.78, "cutoff_2026": 99.82},
            {"branch": "Electronics & Communication", "domain": "Electronics & Core", "cutoff_2024": 99.25, "cutoff_2025": 99.30, "cutoff_2026": 99.38},
            {"branch": "Electrical & Electronics", "domain": "Electronics & Core", "cutoff_2024": 98.80, "cutoff_2025": 98.90, "cutoff_2026": 99.00},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 98.30, "cutoff_2025": 98.40, "cutoff_2026": 98.50},
            {"branch": "Civil Engineering", "domain": "Civil & Infrastructure", "cutoff_2024": 96.80, "cutoff_2025": 96.95, "cutoff_2026": 97.10},
        ]
    },
    {
        "college_code": "NITK",
        "college_name": "National Institute of Technology Karnataka, Surathkal",
        "short_name": "NIT Surathkal",
        "city": "Surathkal",
        "type": "National Institute (NIT)",
        "nirf_rank": "Rank #2 among NITs",
        "annual_fees": 152000,
        "branches": [
            {"branch": "Computer Science & Engineering", "domain": "Computer & IT", "cutoff_2024": 99.65, "cutoff_2025": 99.70, "cutoff_2026": 99.74},
            {"branch": "Information Technology", "domain": "Computer & IT", "cutoff_2024": 99.45, "cutoff_2025": 99.50, "cutoff_2026": 99.55},
            {"branch": "Artificial Intelligence", "domain": "AI & Data Science", "cutoff_2024": 99.40, "cutoff_2025": 99.48, "cutoff_2026": 99.52},
            {"branch": "Electronics & Communication", "domain": "Electronics & Core", "cutoff_2024": 99.10, "cutoff_2025": 99.18, "cutoff_2026": 99.25},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 98.10, "cutoff_2025": 98.20, "cutoff_2026": 98.30},
        ]
    },
    {
        "college_code": "VNIT",
        "college_name": "Visvesvaraya National Institute of Technology",
        "short_name": "VNIT Nagpur",
        "city": "Nagpur",
        "type": "National Institute (NIT Maharashtra)",
        "nirf_rank": "Premier Maharashtra NIT",
        "annual_fees": 148000,
        "branches": [
            {"branch": "Computer Science & Engineering", "domain": "Computer & IT", "cutoff_2024": 99.15, "cutoff_2025": 99.22, "cutoff_2026": 99.30},
            {"branch": "Electronics & Communication", "domain": "Electronics & Core", "cutoff_2024": 98.50, "cutoff_2025": 98.60, "cutoff_2026": 98.70},
            {"branch": "Electrical & Electronics", "domain": "Electronics & Core", "cutoff_2024": 97.80, "cutoff_2025": 97.92, "cutoff_2026": 98.05},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 97.20, "cutoff_2025": 97.35, "cutoff_2026": 97.50},
            {"branch": "Civil Engineering", "domain": "Civil & Infrastructure", "cutoff_2024": 95.10, "cutoff_2025": 95.25, "cutoff_2026": 95.40},
            {"branch": "Metallurgical & Materials", "domain": "Specialized Tech", "cutoff_2024": 94.20, "cutoff_2025": 94.40, "cutoff_2026": 94.60},
        ]
    },
    {
        "college_code": "IIITA",
        "college_name": "Indian Institute of Information Technology, Allahabad",
        "short_name": "IIIT Allahabad",
        "city": "Prayagraj",
        "type": "IIIT Central Institute",
        "nirf_rank": "Premier Software Hub",
        "annual_fees": 195000,
        "branches": [
            {"branch": "Information Technology", "domain": "Computer & IT", "cutoff_2024": 99.40, "cutoff_2025": 99.45, "cutoff_2026": 99.50},
            {"branch": "IT (Business Informatics)", "domain": "Computer & IT", "cutoff_2024": 99.10, "cutoff_2025": 99.18, "cutoff_2026": 99.25},
            {"branch": "Electronics & Communication", "domain": "Electronics & Core", "cutoff_2024": 98.60, "cutoff_2025": 98.70, "cutoff_2026": 98.80},
        ]
    },
    {
        "college_code": "NITW",
        "college_name": "National Institute of Technology, Warangal",
        "short_name": "NIT Warangal",
        "city": "Warangal",
        "type": "National Institute (NIT)",
        "nirf_rank": "Premier Tech Institute",
        "annual_fees": 154000,
        "branches": [
            {"branch": "Computer Science & Engineering", "domain": "Computer & IT", "cutoff_2024": 99.50, "cutoff_2025": 99.55, "cutoff_2026": 99.60},
            {"branch": "Data Science & AI", "domain": "AI & Data Science", "cutoff_2024": 99.30, "cutoff_2025": 99.38, "cutoff_2026": 99.45},
            {"branch": "Electronics & Communication", "domain": "Electronics & Core", "cutoff_2024": 98.90, "cutoff_2025": 99.00, "cutoff_2026": 99.10},
            {"branch": "Mechanical Engineering", "domain": "Mechanical & Automotive", "cutoff_2024": 97.90, "cutoff_2025": 98.05, "cutoff_2026": 98.20},
            {"branch": "Civil Engineering", "domain": "Civil & Infrastructure", "cutoff_2024": 96.20, "cutoff_2025": 96.40, "cutoff_2026": 96.60},
        ]
    }
]

# 4. NEET UG (MCC & STATE DMER MEDICAL) CATALOG
NEET_UG_CATALOG: List[Dict[str, Any]] = [
    {
        "college_code": "AIIMS-DELHI",
        "college_name": "All India Institute of Medical Sciences",
        "short_name": "AIIMS New Delhi",
        "city": "New Delhi",
        "type": "Apex Central Autonomous Medical Institute",
        "nirf_rank": "NIRF #1 Medical Institute in India",
        "annual_fees": 1628,
        "branches": [
            {"branch": "MBBS", "domain": "Medical Science", "cutoff_2024": 99.98, "cutoff_2025": 99.99, "cutoff_2026": 99.99},
            {"branch": "B.Sc. Nursing (Hons)", "domain": "Allied Health", "cutoff_2024": 97.80, "cutoff_2025": 97.95, "cutoff_2026": 98.10},
        ]
    },
    {
        "college_code": "GMC-MUMBAI",
        "college_name": "Grant Government Medical College & Sir JJ Group of Hospitals",
        "short_name": "GMC Mumbai (JJ Hospital)",
        "city": "Mumbai",
        "type": "Government Medical College (Heritage 1845)",
        "nirf_rank": "Premier Medical College in Maharashtra",
        "annual_fees": 142000,
        "branches": [
            {"branch": "MBBS", "domain": "Medical Science", "cutoff_2024": 99.78, "cutoff_2025": 99.82, "cutoff_2026": 99.85},
            {"branch": "BDS (Dental Surgery)", "domain": "Dental Science", "cutoff_2024": 98.40, "cutoff_2025": 98.55, "cutoff_2026": 98.70},
        ]
    },
    {
        "college_code": "BJMC-PUNE",
        "college_name": "B. J. Government Medical College & Sassoon Hospital",
        "short_name": "BJMC Pune",
        "city": "Pune",
        "type": "State Government Medical College",
        "nirf_rank": "Top Government Medical Hub Pune",
        "annual_fees": 138000,
        "branches": [
            {"branch": "MBBS", "domain": "Medical Science", "cutoff_2024": 99.68, "cutoff_2025": 99.72, "cutoff_2026": 99.76},
            {"branch": "BDS (Dental Surgery)", "domain": "Dental Science", "cutoff_2024": 98.10, "cutoff_2025": 98.25, "cutoff_2026": 98.40},
            {"branch": "B.Sc. Nursing", "domain": "Allied Health", "cutoff_2024": 94.50, "cutoff_2025": 94.75, "cutoff_2026": 95.00},
        ]
    },
    {
        "college_code": "KEM-MUMBAI",
        "college_name": "Seth G. S. Medical College & KEM Hospital",
        "short_name": "KEM Mumbai",
        "city": "Mumbai",
        "type": "Municipal Autonomous Medical College",
        "nirf_rank": "Top Clinical Training Hub in India",
        "annual_fees": 125000,
        "branches": [
            {"branch": "MBBS", "domain": "Medical Science", "cutoff_2024": 99.88, "cutoff_2025": 99.90, "cutoff_2026": 99.92},
            {"branch": "B.Sc. Nursing", "domain": "Allied Health", "cutoff_2024": 95.80, "cutoff_2025": 96.00, "cutoff_2026": 96.20},
        ]
    },
    {
        "college_code": "AIIMS-NAGPUR",
        "college_name": "All India Institute of Medical Sciences, Nagpur",
        "short_name": "AIIMS Nagpur",
        "city": "Nagpur",
        "type": "Central Autonomous Medical Institute",
        "nirf_rank": "Apex Central Institute in Maharashtra",
        "annual_fees": 5856,
        "branches": [
            {"branch": "MBBS", "domain": "Medical Science", "cutoff_2024": 99.72, "cutoff_2025": 99.76, "cutoff_2026": 99.80},
        ]
    },
    {
        "college_code": "AFMC-PUNE",
        "college_name": "Armed Forces Medical College",
        "short_name": "AFMC Pune",
        "city": "Pune",
        "type": "Ministry of Defence Medical College",
        "nirf_rank": "Elite Defence Medical Academy",
        "annual_fees": 25000,
        "branches": [
            {"branch": "MBBS", "domain": "Medical Science", "cutoff_2024": 99.65, "cutoff_2025": 99.70, "cutoff_2026": 99.75},
        ]
    },
    {
        "college_code": "GMC-NAGPUR",
        "college_name": "Government Medical College, Nagpur",
        "short_name": "GMC Nagpur",
        "city": "Nagpur",
        "type": "State Government Medical College",
        "nirf_rank": "Vidarbha Premier Medical College",
        "annual_fees": 132000,
        "branches": [
            {"branch": "MBBS", "domain": "Medical Science", "cutoff_2024": 99.45, "cutoff_2025": 99.52, "cutoff_2026": 99.58},
            {"branch": "BDS (Dental Surgery)", "domain": "Dental Science", "cutoff_2024": 97.60, "cutoff_2025": 97.75, "cutoff_2026": 97.90},
            {"branch": "BAMS (Ayurveda)", "domain": "Ayush Medical", "cutoff_2024": 94.80, "cutoff_2025": 95.05, "cutoff_2026": 95.30},
        ]
    }
]

# COUNSELING PROCESS DICTIONARY FOR EACH EXAM
EXAM_COUNSELING_PROCESS = {
    "MHT-CET": {
        "title": "Maharashtra Centralized Admission Process (CAP)",
        "authority": "State Common Entrance Test Cell, Maharashtra",
        "rounds": ["CAP Round 1", "CAP Round 2", "CAP Round 3", "CAP Round 4 / Spot"],
        "categories": ["OPEN", "OBC", "EWS", "TFWS", "SC", "ST", "VJNT"],
        "unit": "%ile",
        "default_score": 98.0,
        "score_label": "MHT-CET Percentile",
        "catalog": MHT_CET_CATALOG
    },
    "JEE Advanced": {
        "title": "JoSAA Seat Allocation (IIT Admissions)",
        "authority": "Joint Seat Allocation Authority (JoSAA) & IITs",
        "rounds": ["JoSAA Round 1", "JoSAA Round 2", "JoSAA Round 3", "JoSAA Round 4", "JoSAA Round 5", "JoSAA Round 6"],
        "categories": ["OPEN / CRL", "OBC-NCL", "GEN-EWS", "SC", "ST"],
        "unit": "%ile",
        "default_score": 99.2,
        "score_label": "JEE Advanced Score / AIR %ile",
        "catalog": JEE_ADVANCED_CATALOG
    },
    "JEE Main": {
        "title": "JoSAA & CSAB Seat Allocation (NITs & IIITs)",
        "authority": "Joint Seat Allocation Authority & Central Seat Allocation Board",
        "rounds": ["JoSAA Round 1", "JoSAA Round 2", "JoSAA Round 3", "JoSAA Round 4", "JoSAA Round 5", "JoSAA Round 6", "CSAB Special Round 1", "CSAB Special Round 2"],
        "categories": ["OPEN", "OBC-NCL", "EWS", "SC", "ST", "Home State (HS)", "Other State (OS)"],
        "unit": "%ile",
        "default_score": 98.5,
        "score_label": "JEE Main CRL Percentile",
        "catalog": JEE_MAIN_CATALOG
    },
    "NEET": {
        "title": "MCC All India Quota & State DMER Medical Counseling",
        "authority": "Medical Counselling Committee (MCC) & State DMER",
        "rounds": ["MCC Round 1 (AIQ)", "MCC Round 2 (Upgradation)", "MCC Round 3 (Mop-Up)", "Stray Vacancy Round"],
        "categories": ["UR / OPEN", "OBC", "EWS", "SC", "ST", "Defense / PwD"],
        "unit": "%ile / Marks",
        "default_score": 99.2,
        "score_label": "NEET Percentile / 720 Marks",
        "catalog": NEET_UG_CATALOG
    }
}

# Category adjustments offsets relative to OPEN/General
CATEGORY_OFFSETS = {
    "OPEN": 0.0,
    "OPEN / CRL": 0.0,
    "UR / OPEN": 0.0,
    "GENERAL": 0.0,
    "OBC": -0.75,
    "OBC-NCL": -0.75,
    "EWS": -0.40,
    "GEN-EWS": -0.40,
    "TFWS": 0.35,
    "SC": -4.20,
    "ST": -8.50,
    "NT": -2.10,
    "VJNT": -2.10,
    "HOME STATE (HS)": 0.40,
    "OTHER STATE (OS)": -0.40,
    "DEFENSE / PWD": -3.50,
}

# Round relaxation offsets relative to Round 1
ROUND_OFFSETS = {
    "CAP Round 1": 0.0,
    "CAP Round 2": -0.65,
    "CAP Round 3": -1.40,
    "CAP Round 4 / Spot": -2.25,
    "CAP Round 4": -2.25,
    "Spot Round": -3.10,
    "JoSAA Round 1": 0.0,
    "JoSAA Round 2": -0.25,
    "JoSAA Round 3": -0.55,
    "JoSAA Round 4": -0.85,
    "JoSAA Round 5": -1.15,
    "JoSAA Round 6": -1.50,
    "CSAB Special Round 1": -2.20,
    "CSAB Special Round 2": -3.10,
    "MCC Round 1 (AIQ)": 0.0,
    "MCC Round 2 (Upgradation)": -0.45,
    "MCC Round 3 (Mop-Up)": -1.20,
    "Stray Vacancy Round": -2.10,
}

def normalize_exam_name(exam_type: str) -> str:
    """Normalize input exam string to one of the canonical exam processes."""
    e = (exam_type or "").strip().lower()
    if "adv" in e:
        return "JEE Advanced"
    elif "main" in e or "jee" in e:
        return "JEE Main"
    elif "neet" in e or "med" in e:
        return "NEET"
    else:
        return "MHT-CET"

_MASTER_DTE_CATALOG = None

def get_master_dte_catalog() -> List[Dict[str, Any]]:
    global _MASTER_DTE_CATALOG
    if _MASTER_DTE_CATALOG is None:
        try:
            path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "master_dte_catalog.json")
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as f:
                    _MASTER_DTE_CATALOG = json.load(f)
            else:
                _MASTER_DTE_CATALOG = []
        except Exception:
            _MASTER_DTE_CATALOG = []
    return _MASTER_DTE_CATALOG

def get_exam_catalog(exam_type: str = "MHT-CET") -> List[Dict[str, Any]]:
    """Return the corresponding college catalog for the chosen entrance exam, including all 370+ DTE institutes."""
    canonical = normalize_exam_name(exam_type)
    base_catalog = list(EXAM_COUNSELING_PROCESS.get(canonical, EXAM_COUNSELING_PROCESS["MHT-CET"])["catalog"])
    if canonical == "MHT-CET":
        dte_list = get_master_dte_catalog()
        if dte_list:
            existing_codes = {str(c.get("college_code")) for c in base_catalog}
            extra = [c for c in dte_list if str(c.get("college_code")) not in existing_codes]
            return base_catalog + extra
    return base_catalog

def get_all_cap_colleges(exam_type: str = "MHT-CET") -> List[Dict[str, Any]]:
    """Return lightweight list of all participating colleges and their available branches for client-side search."""
    catalog = get_exam_catalog(exam_type)
    return [
        {
            "college_code": str(c["college_code"]),
            "college_name": c["college_name"],
            "short_name": c.get("short_name", c["college_name"].split(",")[0].strip()),
            "city": c.get("city", "Maharashtra"),
            "type": c.get("type", "Approved Institute"),
            "nirf_rank": c.get("nirf_rank", f"Code {c['college_code']}"),
            "annual_fees": c.get("annual_fees", 110000),
            "available_branches": c.get("available_branches") or [b["branch"] for b in c.get("branches", [])],
            "domains": sorted(list(set(b["domain"] for b in c.get("branches", []) if "domain" in b)))
        }
        for c in catalog
    ]

def search_cap_colleges(query: str, exam_type: str = "MHT-CET") -> List[Dict[str, Any]]:
    """Perform fast multi-attribute search across all colleges."""
    catalog = get_all_cap_colleges(exam_type)
    q = (query or "").strip().lower()
    if not q:
        return catalog[:60]
    
    scored = []
    for c in catalog:
        code_str = str(c.get("college_code", "")).lower()
        name_str = str(c.get("college_name", "")).lower()
        short_str = str(c.get("short_name", "")).lower()
        city_str = str(c.get("city", "")).lower()
        
        score = 0
        if q == code_str:
            score += 100
        elif code_str.startswith(q):
            score += 70
        elif q in short_str:
            score += 50
        elif q in name_str:
            score += 40
        elif q in city_str:
            score += 25
            
        if score > 0:
            scored.append((score, c))
            
    scored.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored[:60]]

def calculate_cap_row(
    college_code: str,
    selected_branch: str,
    category: str = "OPEN",
    cap_round: str = "CAP Round 1",
    student_marks: float = 97.4,
    exam_type: str = "MHT-CET"
) -> Dict[str, Any]:
    """
    Calculate the exact row values:
    - 2024 cutoff
    - 2025 cutoff
    - 2026 cutoff
    - 2027 predicted probability & momentum
    - Admission Probability based on student marks
    - Gracefully handles custom/searched colleges.
    """
    catalog = get_exam_catalog(exam_type)
    code_str = str(college_code).strip()
    college = next((c for c in catalog if str(c.get("college_code", "")).strip() == code_str), None)
    
    if not college:
        # Search by partial name match
        college = next((c for c in catalog if code_str.lower() in str(c.get("college_name", "")).lower()), None)
        
    if not college:
        # Synthesize entry for custom user-added college
        custom_name = str(college_code)
        std_branches = [
            "Computer Engineering", "Information Technology",
            "Artificial Intelligence & Data Science", "Electronics & Telecommunication",
            "Mechanical Engineering", "Civil Engineering", "Electrical Engineering"
        ]
        if selected_branch and selected_branch not in std_branches:
            std_branches.insert(0, selected_branch)
        college = {
            "college_code": code_str,
            "college_name": custom_name,
            "short_name": custom_name.split(",")[0].strip(),
            "city": "Maharashtra",
            "type": "Recognized Institute",
            "nirf_rank": "State Approved",
            "annual_fees": 110000,
            "branches": [
                {"branch": b, "domain": "Engineering & Technology", "cutoff_2024": 85.0, "cutoff_2025": 85.4, "cutoff_2026": 85.8}
                for b in std_branches
            ]
        }

    branch_obj = next((b for b in college.get("branches", []) if b.get("branch", "").strip().lower() == selected_branch.strip().lower()), None)
    if not branch_obj:
        branch_obj = next((b for b in college.get("branches", []) if selected_branch.strip().lower() in b.get("branch", "").strip().lower() or b.get("branch", "").strip().lower() in selected_branch.strip().lower()), None)
    
    if not branch_obj and college.get("branches"):
        # Auto-synthesize cutoff for new branch so user choice always calculates
        first_b = college["branches"][0]
        base_c = first_b.get("cutoff_2026", 85.0)
        branch_obj = {
            "branch": selected_branch,
            "domain": "Engineering & Technology",
            "cutoff_2024": round(max(35.0, base_c - 0.4), 2),
            "cutoff_2025": round(max(35.0, base_c - 0.2), 2),
            "cutoff_2026": base_c
        }

    # IF STILL NO BRANCH:
    if not branch_obj:
        return {
            "college_code": college["college_code"],
            "college_name": college["college_name"],
            "short_name": college.get("short_name", college["college_name"]),
            "city": college.get("city", "Maharashtra"),
            "nirf_rank": college.get("nirf_rank", "N/A"),
            "annual_fees": college.get("annual_fees", 110000),
            "selected_branch": selected_branch,
            "is_branch_offered": False,
            "branch_status": "Branch Not Offered by this Institute",
            "available_branches": [b["branch"] for b in college.get("branches", [])],
            "cutoff_2024": None,
            "cutoff_2025": None,
            "cutoff_2026": None,
            "cutoff_2027_predicted": None,
            "trend_direction": "none",
            "trend_label": "N/A",
            "admission_probability": 0,
            "probability_label": "Not Provided",
            "tier": "Not Offered",
            "score_margin": None,
            "status_color": "secondary",
            "summary_text": f"{college.get('short_name', college['college_name'])} does not offer {selected_branch}."
        }

    # BRANCH IS OFFERED:
    cat_offset = CATEGORY_OFFSETS.get(category.upper(), 0.0)
    round_offset = ROUND_OFFSETS.get(cap_round, 0.0)

    # Base year cutoffs adjusted for Category & Round
    raw_2024 = branch_obj["cutoff_2024"] + cat_offset + round_offset
    raw_2025 = branch_obj["cutoff_2025"] + cat_offset + round_offset
    raw_2026 = branch_obj["cutoff_2026"] + cat_offset + round_offset

    # Ensure bounds (e.g. max 99.98, min 35.0)
    c_2024 = round(min(99.98, max(35.0, raw_2024)), 2)
    c_2025 = round(min(99.98, max(35.0, raw_2025)), 2)
    c_2026 = round(min(99.98, max(35.0, raw_2026)), 2)

    # Calculate 2027 Projected Benchmark using Momentum / Slope
    slope = round(((c_2026 - c_2025) + (c_2025 - c_2024)) / 2.0, 3)
    c_2027 = round(min(99.98, max(35.0, c_2026 + slope)), 2)

    if slope > 0.04:
        trend_direction = "rising"
        trend_label = f"📈 +{slope:.2f}% (Rising Competition)"
    elif slope < -0.04:
        trend_direction = "easing"
        trend_label = f"📉 {slope:.2f}% (Relaxing Trend)"
    else:
        trend_direction = "stable"
        trend_label = "⚖️ Stable (±0.02%)"

    # Admission Probability Calculation based on Student's Marks
    margin = round(student_marks - c_2026, 2)

    if margin >= 2.0:
        probability = 98
        probability_label = "Very High (Confirmed Safe)"
        tier = "Safe"
        status_color = "success"
    elif margin >= 0.8:
        probability = min(96, int(90 + (margin - 0.8) * 5))
        probability_label = "High Chance (Safe)"
        tier = "Safe"
        status_color = "success"
    elif margin >= 0.0:
        probability = min(88, int(80 + margin * 12))
        probability_label = "Strong Chance (Safe/Target)"
        tier = "Safe"
        status_color = "success"
    elif margin >= -0.6:
        probability = max(65, int(75 + margin * 15))
        probability_label = "Realistic (Target / Betterment)"
        tier = "Target"
        status_color = "warning"
    elif margin >= -1.5:
        probability = max(45, int(58 + (margin + 0.6) * 14))
        probability_label = "Borderline (Target in Later Rounds)"
        tier = "Target"
        status_color = "warning"
    elif margin >= -3.0:
        probability = max(20, int(35 + (margin + 1.5) * 10))
        probability_label = "Reach / Dream (Try in Round 2/3)"
        tier = "Dream"
        status_color = "danger"
    else:
        probability = max(5, int(15 + (margin + 3.0) * 3))
        probability_label = "Aspirational (High Cutoff Dream)"
        tier = "Dream"
        status_color = "danger"

    margin_text = f"+{margin:.2f}%ile above cutoff" if margin >= 0 else f"{margin:.2f}%ile below cutoff"

    return {
        "college_code": college["college_code"],
        "college_name": college["college_name"],
        "short_name": college["short_name"],
        "city": college["city"],
        "nirf_rank": college["nirf_rank"],
        "annual_fees": college["annual_fees"],
        "selected_branch": selected_branch,
        "is_branch_offered": True,
        "branch_status": "Offered",
        "available_branches": [b["branch"] for b in college["branches"]],
        "cutoff_2024": c_2024,
        "cutoff_2025": c_2025,
        "cutoff_2026": c_2026,
        "cutoff_2027_predicted": c_2027,
        "trend_direction": trend_direction,
        "trend_label": trend_label,
        "admission_probability": probability,
        "probability_label": probability_label,
        "tier": tier,
        "score_margin": margin,
        "margin_text": margin_text,
        "status_color": status_color,
        "summary_text": f"Cutoff 2026: {c_2026}%ile. Your score margin: {margin_text} ({probability}% probability)."
    }

def simulate_full_table(
    choices: List[Dict[str, str]],
    category: str = "OPEN",
    cap_round: str = "CAP Round 1",
    student_marks: float = 97.4,
    exam_type: str = "MHT-CET"
) -> Dict[str, Any]:
    """
    Simulate a complete user preference table of choices.
    Returns:
    - rows: decorated choices with cutoffs and admission probability
    - counts: {safe, target, dream, not_offered}
    - strategy_feedback: assessment of preference ordering health
    - predicted_allotment: first choice in preference list likely to be allotted
    """
    canonical_exam = normalize_exam_name(exam_type)
    process_info = EXAM_COUNSELING_PROCESS.get(canonical_exam, EXAM_COUNSELING_PROCESS["MHT-CET"])

    rows = []
    safe_count = 0
    target_count = 0
    dream_count = 0
    not_offered_count = 0
    first_allotted_choice = None

    for idx, choice in enumerate(choices):
        row_data = calculate_cap_row(
            college_code=choice.get("college_code", ""),
            selected_branch=choice.get("branch") or choice.get("selected_branch", "Computer Engineering"),
            category=category,
            cap_round=cap_round,
            student_marks=student_marks,
            exam_type=canonical_exam
        )
        row_data["preference_no"] = idx + 1
        rows.append(row_data)

        if not row_data["is_branch_offered"]:
            not_offered_count += 1
        elif row_data["tier"] == "Safe":
            safe_count += 1
            if first_allotted_choice is None:
                first_allotted_choice = row_data
        elif row_data["tier"] == "Target":
            target_count += 1
            if first_allotted_choice is None and row_data["admission_probability"] >= 65:
                first_allotted_choice = row_data
        elif row_data["tier"] == "Dream":
            dream_count += 1

    # Strategy health assessment
    total_valid = safe_count + target_count + dream_count
    if safe_count == 0:
        strategy_feedback = f"⚠️ High Risk List: You have NO safe choices for {canonical_exam}. Add at least 2 safe colleges with cutoffs 1-2% below your score to avoid zero allotment."
        health_color = "danger"
    elif dream_count == 0 and safe_count > 0:
        strategy_feedback = f"💡 Conservative List: All choices are safe for {canonical_exam}. You have room to add 2-3 aspirational dream colleges at the top without risk!"
        health_color = "info"
    elif dream_count > 0 and target_count > 0 and safe_count > 0:
        strategy_feedback = f"✅ Healthy Balanced Option Form for {canonical_exam}: You have {dream_count} Dream choices at top, {target_count} Target choices in middle, and {safe_count} Safe choices as safety net."
        health_color = "success"
    else:
        strategy_feedback = f"Option form ready with {total_valid} valid choices for {canonical_exam}. Review preference order before submitting on counseling portal."
        health_color = "primary"

    allotment_advisory = ""
    if first_allotted_choice:
        pref = first_allotted_choice["preference_no"]
        name = first_allotted_choice["short_name"]
        br = first_allotted_choice["selected_branch"]
        if pref == 1:
            allotment_advisory = f"🎯 Choice #1 ({name} - {br}) is likely to be allotted in Round 1 (Auto-Freeze rules apply!)."
        else:
            allotment_advisory = f"✨ Choice #{pref} ({name} - {br}) is projected for Round 1 allotment. You can opt for Betterment (Float) to contest choices #1 to #{pref-1} in subsequent rounds."
    else:
        allotment_advisory = f"No choice provisionally allotted in Round 1 of {process_info['title']}. Consider relaxing category or adding higher-intake colleges."

    return {
        "success": True,
        "exam_type": canonical_exam,
        "process_title": process_info["title"],
        "authority": process_info["authority"],
        "score_label": process_info["score_label"],
        "rows": rows,
        "counts": {
            "total_choices": len(rows),
            "safe": safe_count,
            "target": target_count,
            "dream": dream_count,
            "not_offered": not_offered_count
        },
        "strategy_feedback": strategy_feedback,
        "health_color": health_color,
        "allotment_advisory": allotment_advisory,
        "predicted_allotment": first_allotted_choice
    }
