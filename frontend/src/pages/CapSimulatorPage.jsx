import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft, FaGraduationCap, FaSearch, FaPlus, FaTrash,
  FaArrowUp, FaArrowDown, FaCheckCircle, FaExclamationTriangle,
  FaTimesCircle, FaChartLine, FaCopy, FaPrint, FaLightbulb,
  FaSlidersH, FaFilter, FaLayerGroup, FaCheck, FaInfoCircle,
  FaUserGraduate, FaExchangeAlt, FaShieldAlt, FaStethoscope,
  FaRobot, FaMagic, FaPaperPlane, FaUndo, FaBullseye, FaBolt,
  FaFire, FaCheckDouble, FaTable, FaThLarge, FaListUl, FaChevronDown,
  FaChevronUp, FaFileAlt, FaShareAlt, FaEye, FaTimes
} from "react-icons/fa";
import { MdVerified, MdOutlineSchool, MdSwapVert, MdTimeline, MdAutoAwesome, MdDragIndicator } from "react-icons/md";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { APP_NAME } from "./LandingPage";
import DocumentVerificationModal from "../components/DocumentVerificationModal";

// 1. MAHARASHTRA MHT-CET PREMIER ENGINEERING INSTITUTIONS (DTE MAHARASHTRA)
const MHT_CET_CATALOG = [
  {
    college_code: "6006",
    college_name: "COEP Technological University",
    short_name: "COEP Pune",
    city: "Pune",
    type: "State Unitary Public University",
    nirf_rank: "Rank #1 in State",
    annual_fees: 135000,
    branches: [
      { branch: "Computer Engineering", domain: "Computer & IT", cutoff_2024: 99.82, cutoff_2025: 99.85, cutoff_2026: 99.88 },
      { branch: "Artificial Intelligence & Robotics", domain: "AI & Data Science", cutoff_2024: 99.45, cutoff_2025: 99.52, cutoff_2026: 99.60 },
      { branch: "Information Technology", domain: "Computer & IT", cutoff_2024: 99.65, cutoff_2025: 99.70, cutoff_2026: 99.75 },
      { branch: "Electronics & Telecommunication", domain: "Electronics & Core", cutoff_2024: 98.60, cutoff_2025: 98.75, cutoff_2026: 98.90 },
      { branch: "Electrical Engineering", domain: "Electronics & Core", cutoff_2024: 96.50, cutoff_2025: 96.65, cutoff_2026: 96.80 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 95.80, cutoff_2025: 95.95, cutoff_2026: 96.15 },
      { branch: "Civil Engineering", domain: "Civil & Infrastructure", cutoff_2024: 88.50, cutoff_2025: 88.75, cutoff_2026: 89.10 },
      { branch: "Instrumentation & Control", domain: "Electronics & Core", cutoff_2024: 94.20, cutoff_2025: 94.40, cutoff_2026: 94.65 },
      { branch: "Metallurgy & Material Science", domain: "Specialized Tech", cutoff_2024: 84.50, cutoff_2025: 84.80, cutoff_2026: 85.10 }
    ]
  },
  {
    college_code: "3012",
    college_name: "Veermata Jijabai Technological Institute (VJTI)",
    short_name: "VJTI Mumbai",
    city: "Mumbai",
    type: "State Autonomous Institute",
    nirf_rank: "Premier Mumbai Tech Institute",
    annual_fees: 92000,
    branches: [
      { branch: "Computer Engineering", domain: "Computer & IT", cutoff_2024: 99.78, cutoff_2025: 99.82, cutoff_2026: 99.85 },
      { branch: "Information Technology", domain: "Computer & IT", cutoff_2024: 99.51, cutoff_2025: 99.58, cutoff_2026: 99.65 },
      { branch: "Electronics & Telecommunication", domain: "Electronics & Core", cutoff_2024: 98.40, cutoff_2025: 98.55, cutoff_2026: 98.70 },
      { branch: "Electrical Engineering", domain: "Electronics & Core", cutoff_2024: 96.20, cutoff_2025: 96.40, cutoff_2026: 96.60 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 95.10, cutoff_2025: 95.30, cutoff_2026: 95.50 },
      { branch: "Civil Engineering", domain: "Civil & Infrastructure", cutoff_2024: 87.80, cutoff_2025: 88.10, cutoff_2026: 88.45 },
      { branch: "Production Engineering", domain: "Mechanical & Automotive", cutoff_2024: 89.50, cutoff_2025: 89.80, cutoff_2026: 90.15 },
      { branch: "Textile Engineering", domain: "Specialized Tech", cutoff_2024: 81.20, cutoff_2025: 81.50, cutoff_2026: 81.85 }
    ]
  },
  {
    college_code: "6271",
    college_name: "Pune Institute of Computer Technology (PICT)",
    short_name: "PICT Pune",
    city: "Pune",
    type: "Private Autonomous (SPPU)",
    nirf_rank: "Top Software Placement Hub",
    annual_fees: 115000,
    branches: [
      { branch: "Computer Engineering", domain: "Computer & IT", cutoff_2024: 99.55, cutoff_2025: 99.60, cutoff_2026: 99.65 },
      { branch: "Information Technology", domain: "Computer & IT", cutoff_2024: 99.30, cutoff_2025: 99.38, cutoff_2026: 99.45 },
      { branch: "Artificial Intelligence & Data Science", domain: "AI & Data Science", cutoff_2024: 99.15, cutoff_2025: 99.25, cutoff_2026: 99.35 },
      { branch: "Electronics & Telecommunication", domain: "Electronics & Core", cutoff_2024: 97.80, cutoff_2025: 97.95, cutoff_2026: 98.15 }
    ]
  },
  {
    college_code: "3215",
    college_name: "Sardar Patel Institute of Technology (SPIT)",
    short_name: "SPIT Mumbai",
    city: "Mumbai",
    type: "Private Autonomous",
    nirf_rank: "Tier-1 Autonomous Mumbai",
    annual_fees: 172000,
    branches: [
      { branch: "Computer Engineering", domain: "Computer & IT", cutoff_2024: 99.50, cutoff_2025: 99.55, cutoff_2026: 99.60 },
      { branch: "Computer Science & Engineering (Data Science)", domain: "AI & Data Science", cutoff_2024: 99.20, cutoff_2025: 99.28, cutoff_2026: 99.36 },
      { branch: "Artificial Intelligence & Machine Learning", domain: "AI & Data Science", cutoff_2024: 99.05, cutoff_2025: 99.15, cutoff_2026: 99.25 },
      { branch: "Electronics & Telecommunication", domain: "Electronics & Core", cutoff_2024: 97.40, cutoff_2025: 97.60, cutoff_2026: 97.80 }
    ]
  },
  {
    college_code: "6007",
    college_name: "Walchand College of Engineering (WCE)",
    short_name: "WCE Sangli",
    city: "Sangli",
    type: "Government Aided Autonomous",
    nirf_rank: "Heritage Engineering Hub",
    annual_fees: 88000,
    branches: [
      { branch: "Computer Science & Engineering", domain: "Computer & IT", cutoff_2024: 99.10, cutoff_2025: 99.18, cutoff_2026: 99.25 },
      { branch: "Information Technology", domain: "Computer & IT", cutoff_2024: 98.70, cutoff_2025: 98.80, cutoff_2026: 98.90 },
      { branch: "Electronics Engineering", domain: "Electronics & Core", cutoff_2024: 96.50, cutoff_2025: 96.70, cutoff_2026: 96.90 },
      { branch: "Electrical Engineering", domain: "Electronics & Core", cutoff_2024: 94.80, cutoff_2025: 95.00, cutoff_2026: 95.20 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 92.50, cutoff_2025: 92.70, cutoff_2026: 92.95 },
      { branch: "Civil Engineering", domain: "Civil & Infrastructure", cutoff_2024: 86.40, cutoff_2025: 86.65, cutoff_2026: 86.90 }
    ]
  },
  {
    college_code: "6175",
    college_name: "Pimpri Chinchwad College of Engineering (PCCOE)",
    short_name: "PCCOE Pune",
    city: "Pune",
    type: "Private Autonomous",
    nirf_rank: "Top Industry Placement Hub",
    annual_fees: 142000,
    branches: [
      { branch: "Computer Engineering", domain: "Computer & IT", cutoff_2024: 98.85, cutoff_2025: 98.95, cutoff_2026: 99.05 },
      { branch: "Information Technology", domain: "Computer & IT", cutoff_2024: 98.40, cutoff_2025: 98.50, cutoff_2026: 98.62 },
      { branch: "Artificial Intelligence & Machine Learning", domain: "AI & Data Science", cutoff_2024: 98.15, cutoff_2025: 98.30, cutoff_2026: 98.45 },
      { branch: "Electronics & Telecommunication", domain: "Electronics & Core", cutoff_2024: 96.10, cutoff_2025: 96.28, cutoff_2026: 96.45 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 89.20, cutoff_2025: 89.40, cutoff_2026: 89.65 },
      { branch: "Civil Engineering", domain: "Civil & Infrastructure", cutoff_2024: 82.50, cutoff_2025: 82.75, cutoff_2026: 83.10 }
    ]
  },
  {
    college_code: "6273",
    college_name: "Vishwakarma Institute of Technology (VIT)",
    short_name: "VIT Pune",
    city: "Pune",
    type: "Private Autonomous",
    nirf_rank: "Premier Autonomous Tech Hub",
    annual_fees: 185000,
    branches: [
      { branch: "Computer Engineering", domain: "Computer & IT", cutoff_2024: 98.90, cutoff_2025: 99.00, cutoff_2026: 99.10 },
      { branch: "Artificial Intelligence & Data Science", domain: "AI & Data Science", cutoff_2024: 98.35, cutoff_2025: 98.48, cutoff_2026: 98.60 },
      { branch: "Information Technology", domain: "Computer & IT", cutoff_2024: 98.50, cutoff_2025: 98.60, cutoff_2026: 98.72 },
      { branch: "Electronics & Telecommunication", domain: "Electronics & Core", cutoff_2024: 96.20, cutoff_2025: 96.40, cutoff_2026: 96.60 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 90.10, cutoff_2025: 90.30, cutoff_2026: 90.55 },
      { branch: "Chemical Engineering", domain: "Specialized Tech", cutoff_2024: 85.40, cutoff_2025: 85.65, cutoff_2026: 85.90 },
      { branch: "Instrumentation Engineering", domain: "Electronics & Core", cutoff_2024: 87.20, cutoff_2025: 87.45, cutoff_2026: 87.75 }
    ]
  },
  {
    college_code: "3199",
    college_name: "D. J. Sanghvi College of Engineering",
    short_name: "DJ Sanghvi Mumbai",
    city: "Mumbai",
    type: "Private Autonomous (Minority)",
    nirf_rank: "Vile Parle Mumbai Hub",
    annual_fees: 215000,
    branches: [
      { branch: "Computer Engineering", domain: "Computer & IT", cutoff_2024: 99.10, cutoff_2025: 99.18, cutoff_2026: 99.25 },
      { branch: "Information Technology", domain: "Computer & IT", cutoff_2024: 98.75, cutoff_2025: 98.85, cutoff_2026: 98.95 },
      { branch: "Artificial Intelligence & Machine Learning", domain: "AI & Data Science", cutoff_2024: 98.40, cutoff_2025: 98.55, cutoff_2026: 98.70 },
      { branch: "Electronics & Telecommunication", domain: "Electronics & Core", cutoff_2024: 95.80, cutoff_2025: 96.00, cutoff_2026: 96.20 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 88.50, cutoff_2025: 88.75, cutoff_2026: 89.05 }
    ]
  },
  {
    college_code: "3182",
    college_name: "Thadomal Shahani Engineering College (TSEC)",
    short_name: "TSEC Mumbai",
    city: "Mumbai",
    type: "Private Aided / Autonomous",
    nirf_rank: "Bandra Tech Institution",
    annual_fees: 190000,
    branches: [
      { branch: "Computer Engineering", domain: "Computer & IT", cutoff_2024: 98.70, cutoff_2025: 98.80, cutoff_2026: 98.90 },
      { branch: "Information Technology", domain: "Computer & IT", cutoff_2024: 98.20, cutoff_2025: 98.32, cutoff_2026: 98.45 },
      { branch: "Artificial Intelligence & Data Science", domain: "AI & Data Science", cutoff_2024: 97.90, cutoff_2025: 98.05, cutoff_2026: 98.20 },
      { branch: "Electronics & Telecommunication", domain: "Electronics & Core", cutoff_2024: 94.60, cutoff_2025: 94.80, cutoff_2026: 95.05 },
      { branch: "Chemical Engineering", domain: "Specialized Tech", cutoff_2024: 82.00, cutoff_2025: 82.25, cutoff_2026: 82.60 }
    ]
  },
  {
    college_code: "6276",
    college_name: "MKSSS's Cummins College of Engineering for Women",
    short_name: "Cummins Pune (Women)",
    city: "Pune",
    type: "Private Autonomous (Women Only)",
    nirf_rank: "Premier Women's Engineering College",
    annual_fees: 168000,
    branches: [
      { branch: "Computer Engineering", domain: "Computer & IT", cutoff_2024: 98.65, cutoff_2025: 98.75, cutoff_2026: 98.85 },
      { branch: "Information Technology", domain: "Computer & IT", cutoff_2024: 98.10, cutoff_2025: 98.22, cutoff_2026: 98.35 },
      { branch: "Electronics & Telecommunication", domain: "Electronics & Core", cutoff_2024: 95.50, cutoff_2025: 95.70, cutoff_2026: 95.90 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 87.80, cutoff_2025: 88.05, cutoff_2026: 88.35 },
      { branch: "Instrumentation & Control", domain: "Electronics & Core", cutoff_2024: 88.20, cutoff_2025: 88.45, cutoff_2026: 88.75 }
    ]
  },
  {
    college_code: "6005",
    college_name: "Government College of Engineering, Karad (GCEK)",
    short_name: "GCOE Karad",
    city: "Karad",
    type: "Government Autonomous",
    nirf_rank: "Premier Government Hub",
    annual_fees: 78000,
    branches: [
      { branch: "Computer Science & Engineering", domain: "Computer & IT", cutoff_2024: 97.40, cutoff_2025: 97.55, cutoff_2026: 97.70 },
      { branch: "Information Technology", domain: "Computer & IT", cutoff_2024: 96.50, cutoff_2025: 96.68, cutoff_2026: 96.85 },
      { branch: "Electrical Engineering", domain: "Electronics & Core", cutoff_2024: 92.40, cutoff_2025: 92.65, cutoff_2026: 92.90 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 88.80, cutoff_2025: 89.05, cutoff_2026: 89.30 },
      { branch: "Civil Engineering", domain: "Civil & Infrastructure", cutoff_2024: 83.50, cutoff_2025: 83.75, cutoff_2026: 84.05 }
    ]
  },
  {
    college_code: "6284",
    college_name: "Vishwakarma Institute of Information Technology (VIIT)",
    short_name: "VIIT Pune",
    city: "Pune",
    type: "Private Autonomous",
    nirf_rank: "Top Tier-2 Pune Institution",
    annual_fees: 158000,
    branches: [
      { branch: "Computer Engineering", domain: "Computer & IT", cutoff_2024: 97.80, cutoff_2025: 97.92, cutoff_2026: 98.05 },
      { branch: "Information Technology", domain: "Computer & IT", cutoff_2024: 97.20, cutoff_2025: 97.35, cutoff_2026: 97.50 },
      { branch: "Artificial Intelligence & Data Science", domain: "AI & Data Science", cutoff_2024: 96.80, cutoff_2025: 96.95, cutoff_2026: 97.10 },
      { branch: "Electronics & Telecommunication", domain: "Electronics & Core", cutoff_2024: 94.20, cutoff_2025: 94.40, cutoff_2026: 94.65 },
      { branch: "Civil Engineering", domain: "Civil & Infrastructure", cutoff_2024: 78.50, cutoff_2025: 78.80, cutoff_2026: 79.15 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 84.20, cutoff_2025: 84.45, cutoff_2026: 84.75 }
    ]
  }
];

// 2. JEE ADVANCED (JoSAA IITs) CATALOG
const JEE_ADVANCED_CATALOG = [
  {
    college_code: "IITB",
    college_name: "Indian Institute of Technology, Bombay",
    short_name: "IIT Bombay",
    city: "Mumbai",
    type: "Institute of National Importance (IIT)",
    nirf_rank: "NIRF #3 All-India (Engineering)",
    annual_fees: 224000,
    branches: [
      { branch: "Computer Science & Engineering", domain: "Computer & IT", cutoff_2024: 99.98, cutoff_2025: 99.98, cutoff_2026: 99.99 },
      { branch: "Electrical Engineering", domain: "Electronics & Core", cutoff_2024: 99.78, cutoff_2025: 99.80, cutoff_2026: 99.82 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 99.40, cutoff_2025: 99.45, cutoff_2026: 99.50 },
      { branch: "Aerospace Engineering", domain: "Specialized Tech", cutoff_2024: 99.10, cutoff_2025: 99.18, cutoff_2026: 99.25 },
      { branch: "Civil Engineering", domain: "Civil & Infrastructure", cutoff_2024: 98.40, cutoff_2025: 98.50, cutoff_2026: 98.60 },
      { branch: "Chemical Engineering", domain: "Specialized Tech", cutoff_2024: 98.85, cutoff_2025: 98.92, cutoff_2026: 99.00 },
      { branch: "Engineering Physics", domain: "Specialized Tech", cutoff_2024: 99.20, cutoff_2025: 99.25, cutoff_2026: 99.30 }
    ]
  },
  {
    college_code: "IITD",
    college_name: "Indian Institute of Technology, Delhi",
    short_name: "IIT Delhi",
    city: "New Delhi",
    type: "Institute of National Importance (IIT)",
    nirf_rank: "NIRF #2 All-India (Engineering)",
    annual_fees: 220000,
    branches: [
      { branch: "Computer Science & Engineering", domain: "Computer & IT", cutoff_2024: 99.95, cutoff_2025: 99.96, cutoff_2026: 99.97 },
      { branch: "Mathematics & Computing", domain: "Computer & IT", cutoff_2024: 99.85, cutoff_2025: 99.88, cutoff_2026: 99.90 },
      { branch: "Electrical Engineering", domain: "Electronics & Core", cutoff_2024: 99.70, cutoff_2025: 99.74, cutoff_2026: 99.78 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 99.30, cutoff_2025: 99.35, cutoff_2026: 99.40 },
      { branch: "Civil Engineering", domain: "Civil & Infrastructure", cutoff_2024: 98.20, cutoff_2025: 98.30, cutoff_2026: 98.40 },
      { branch: "Chemical Engineering", domain: "Specialized Tech", cutoff_2024: 98.70, cutoff_2025: 98.78, cutoff_2026: 98.85 }
    ]
  },
  {
    college_code: "IITM",
    college_name: "Indian Institute of Technology, Madras",
    short_name: "IIT Madras",
    city: "Chennai",
    type: "Institute of National Importance (IIT)",
    nirf_rank: "NIRF #1 Overall (India)",
    annual_fees: 215000,
    branches: [
      { branch: "Computer Science & Engineering", domain: "Computer & IT", cutoff_2024: 99.92, cutoff_2025: 99.94, cutoff_2026: 99.95 },
      { branch: "Electrical Engineering", domain: "Electronics & Core", cutoff_2024: 99.65, cutoff_2025: 99.70, cutoff_2026: 99.75 },
      { branch: "Aerospace Engineering", domain: "Specialized Tech", cutoff_2024: 98.95, cutoff_2025: 99.05, cutoff_2026: 99.15 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 99.20, cutoff_2025: 99.28, cutoff_2026: 99.35 },
      { branch: "Civil Engineering", domain: "Civil & Infrastructure", cutoff_2024: 98.00, cutoff_2025: 98.15, cutoff_2026: 98.30 }
    ]
  },
  {
    college_code: "IITK",
    college_name: "Indian Institute of Technology, Kanpur",
    short_name: "IIT Kanpur",
    city: "Kanpur",
    type: "Institute of National Importance (IIT)",
    nirf_rank: "NIRF #4 All-India",
    annual_fees: 222000,
    branches: [
      { branch: "Computer Science & Engineering", domain: "Computer & IT", cutoff_2024: 99.88, cutoff_2025: 99.90, cutoff_2026: 99.92 },
      { branch: "Electrical Engineering", domain: "Electronics & Core", cutoff_2024: 99.55, cutoff_2025: 99.60, cutoff_2026: 99.65 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 99.10, cutoff_2025: 99.18, cutoff_2026: 99.25 },
      { branch: "Aerospace Engineering", domain: "Specialized Tech", cutoff_2024: 98.80, cutoff_2025: 98.90, cutoff_2026: 99.00 },
      { branch: "Civil Engineering", domain: "Civil & Infrastructure", cutoff_2024: 97.90, cutoff_2025: 98.05, cutoff_2026: 98.20 }
    ]
  },
  {
    college_code: "IITKGP",
    college_name: "Indian Institute of Technology, Kharagpur",
    short_name: "IIT Kharagpur",
    city: "Kharagpur",
    type: "Institute of National Importance (IIT)",
    nirf_rank: "NIRF #5 All-India",
    annual_fees: 218000,
    branches: [
      { branch: "Computer Science & Engineering", domain: "Computer & IT", cutoff_2024: 99.85, cutoff_2025: 99.88, cutoff_2026: 99.90 },
      { branch: "Electronics & Electrical Communication", domain: "Electronics & Core", cutoff_2024: 99.60, cutoff_2025: 99.65, cutoff_2026: 99.70 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 98.85, cutoff_2025: 98.95, cutoff_2026: 99.05 },
      { branch: "Civil Engineering", domain: "Civil & Infrastructure", cutoff_2024: 97.20, cutoff_2025: 97.35, cutoff_2026: 97.50 }
    ]
  },
  {
    college_code: "IITR",
    college_name: "Indian Institute of Technology, Roorkee",
    short_name: "IIT Roorkee",
    city: "Roorkee",
    type: "Institute of National Importance (IIT)",
    nirf_rank: "NIRF #6 All-India",
    annual_fees: 216000,
    branches: [
      { branch: "Computer Science & Engineering", domain: "Computer & IT", cutoff_2024: 99.80, cutoff_2025: 99.83, cutoff_2026: 99.86 },
      { branch: "Data Science & Artificial Intelligence", domain: "AI & Data Science", cutoff_2024: 99.70, cutoff_2025: 99.75, cutoff_2026: 99.80 },
      { branch: "Electrical Engineering", domain: "Electronics & Core", cutoff_2024: 99.40, cutoff_2025: 99.48, cutoff_2026: 99.55 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 98.70, cutoff_2025: 98.80, cutoff_2026: 98.90 }
    ]
  }
];

// 3. JEE MAIN (JoSAA & CSAB NITs & IIITs) CATALOG
const JEE_MAIN_CATALOG = [
  {
    college_code: "NITT",
    college_name: "National Institute of Technology, Tiruchirappalli",
    short_name: "NIT Trichy",
    city: "Tiruchirappalli",
    type: "National Institute (NIT)",
    nirf_rank: "Rank #1 among NITs",
    annual_fees: 155000,
    branches: [
      { branch: "Computer Science & Engineering", domain: "Computer & IT", cutoff_2024: 99.75, cutoff_2025: 99.78, cutoff_2026: 99.82 },
      { branch: "Electronics & Communication", domain: "Electronics & Core", cutoff_2024: 99.25, cutoff_2025: 99.30, cutoff_2026: 99.38 },
      { branch: "Electrical & Electronics", domain: "Electronics & Core", cutoff_2024: 98.80, cutoff_2025: 98.90, cutoff_2026: 99.00 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 98.30, cutoff_2025: 98.40, cutoff_2026: 98.50 },
      { branch: "Civil Engineering", domain: "Civil & Infrastructure", cutoff_2024: 96.80, cutoff_2025: 96.95, cutoff_2026: 97.10 }
    ]
  },
  {
    college_code: "NITK",
    college_name: "National Institute of Technology Karnataka, Surathkal",
    short_name: "NIT Surathkal",
    city: "Surathkal",
    type: "National Institute (NIT)",
    nirf_rank: "Rank #2 among NITs",
    annual_fees: 152000,
    branches: [
      { branch: "Computer Science & Engineering", domain: "Computer & IT", cutoff_2024: 99.65, cutoff_2025: 99.70, cutoff_2026: 99.74 },
      { branch: "Information Technology", domain: "Computer & IT", cutoff_2024: 99.45, cutoff_2025: 99.50, cutoff_2026: 99.55 },
      { branch: "Artificial Intelligence", domain: "AI & Data Science", cutoff_2024: 99.40, cutoff_2025: 99.48, cutoff_2026: 99.52 },
      { branch: "Electronics & Communication", domain: "Electronics & Core", cutoff_2024: 99.10, cutoff_2025: 99.18, cutoff_2026: 99.25 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 98.10, cutoff_2025: 98.20, cutoff_2026: 98.30 }
    ]
  },
  {
    college_code: "VNIT",
    college_name: "Visvesvaraya National Institute of Technology",
    short_name: "VNIT Nagpur",
    city: "Nagpur",
    type: "National Institute (NIT Maharashtra)",
    nirf_rank: "Premier Maharashtra NIT",
    annual_fees: 148000,
    branches: [
      { branch: "Computer Science & Engineering", domain: "Computer & IT", cutoff_2024: 99.15, cutoff_2025: 99.22, cutoff_2026: 99.30 },
      { branch: "Electronics & Communication", domain: "Electronics & Core", cutoff_2024: 98.50, cutoff_2025: 98.60, cutoff_2026: 98.70 },
      { branch: "Electrical & Electronics", domain: "Electronics & Core", cutoff_2024: 97.80, cutoff_2025: 97.92, cutoff_2026: 98.05 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 97.20, cutoff_2025: 97.35, cutoff_2026: 97.50 },
      { branch: "Civil Engineering", domain: "Civil & Infrastructure", cutoff_2024: 95.10, cutoff_2025: 95.25, cutoff_2026: 95.40 }
    ]
  },
  {
    college_code: "IIITA",
    college_name: "Indian Institute of Information Technology, Allahabad",
    short_name: "IIIT Allahabad",
    city: "Prayagraj",
    type: "IIIT Central Institute",
    nirf_rank: "Premier Software Hub",
    annual_fees: 195000,
    branches: [
      { branch: "Information Technology", domain: "Computer & IT", cutoff_2024: 99.40, cutoff_2025: 99.45, cutoff_2026: 99.50 },
      { branch: "IT (Business Informatics)", domain: "Computer & IT", cutoff_2024: 99.10, cutoff_2025: 99.18, cutoff_2026: 99.25 },
      { branch: "Electronics & Communication", domain: "Electronics & Core", cutoff_2024: 98.60, cutoff_2025: 98.70, cutoff_2026: 98.80 }
    ]
  },
  {
    college_code: "NITW",
    college_name: "National Institute of Technology, Warangal",
    short_name: "NIT Warangal",
    city: "Warangal",
    type: "National Institute (NIT)",
    nirf_rank: "Premier Tech Institute",
    annual_fees: 154000,
    branches: [
      { branch: "Computer Science & Engineering", domain: "Computer & IT", cutoff_2024: 99.50, cutoff_2025: 99.55, cutoff_2026: 99.60 },
      { branch: "Data Science & AI", domain: "AI & Data Science", cutoff_2024: 99.30, cutoff_2025: 99.38, cutoff_2026: 99.45 },
      { branch: "Electronics & Communication", domain: "Electronics & Core", cutoff_2024: 98.90, cutoff_2025: 99.00, cutoff_2026: 99.10 },
      { branch: "Mechanical Engineering", domain: "Mechanical & Automotive", cutoff_2024: 97.90, cutoff_2025: 98.05, cutoff_2026: 98.20 }
    ]
  }
];

// 4. NEET UG (MCC & DMER MEDICAL) CATALOG
const NEET_UG_CATALOG = [
  {
    college_code: "AIIMS-DELHI",
    college_name: "All India Institute of Medical Sciences",
    short_name: "AIIMS New Delhi",
    city: "New Delhi",
    type: "Apex Central Autonomous Medical Institute",
    nirf_rank: "NIRF #1 Medical Institute in India",
    annual_fees: 1628,
    branches: [
      { branch: "MBBS", domain: "Medical Science", cutoff_2024: 99.98, cutoff_2025: 99.99, cutoff_2026: 99.99 },
      { branch: "B.Sc. Nursing (Hons)", domain: "Allied Health", cutoff_2024: 97.80, cutoff_2025: 97.95, cutoff_2026: 98.10 }
    ]
  },
  {
    college_code: "KEM-MUMBAI",
    college_name: "Seth G. S. Medical College & KEM Hospital",
    short_name: "KEM Mumbai",
    city: "Mumbai",
    type: "Municipal Autonomous Medical College",
    nirf_rank: "Top Clinical Training Hub in India",
    annual_fees: 125000,
    branches: [
      { branch: "MBBS", domain: "Medical Science", cutoff_2024: 99.88, cutoff_2025: 99.90, cutoff_2026: 99.92 },
      { branch: "B.Sc. Nursing", domain: "Allied Health", cutoff_2024: 95.80, cutoff_2025: 96.00, cutoff_2026: 96.20 }
    ]
  },
  {
    college_code: "GMC-MUMBAI",
    college_name: "Grant Government Medical College & Sir JJ Group of Hospitals",
    short_name: "GMC Mumbai (JJ Hospital)",
    city: "Mumbai",
    type: "Government Medical College (Heritage 1845)",
    nirf_rank: "Premier Medical College in Maharashtra",
    annual_fees: 142000,
    branches: [
      { branch: "MBBS", domain: "Medical Science", cutoff_2024: 99.78, cutoff_2025: 99.82, cutoff_2026: 99.85 },
      { branch: "BDS (Dental Surgery)", domain: "Dental Science", cutoff_2024: 98.40, cutoff_2025: 98.55, cutoff_2026: 98.70 }
    ]
  },
  {
    college_code: "AFMC-PUNE",
    college_name: "Armed Forces Medical College",
    short_name: "AFMC Pune",
    city: "Pune",
    type: "Ministry of Defence Medical College",
    nirf_rank: "Elite Defence Medical Academy",
    annual_fees: 25000,
    branches: [
      { branch: "MBBS", domain: "Medical Science", cutoff_2024: 99.65, cutoff_2025: 99.70, cutoff_2026: 99.75 }
    ]
  },
  {
    college_code: "BJMC-PUNE",
    college_name: "B. J. Government Medical College & Sassoon Hospital",
    short_name: "BJMC Pune",
    city: "Pune",
    type: "State Government Medical College",
    nirf_rank: "Top Government Medical Hub Pune",
    annual_fees: 138000,
    branches: [
      { branch: "MBBS", domain: "Medical Science", cutoff_2024: 99.68, cutoff_2025: 99.72, cutoff_2026: 99.76 },
      { branch: "BDS (Dental Surgery)", domain: "Dental Science", cutoff_2024: 98.10, cutoff_2025: 98.25, cutoff_2026: 98.40 },
      { branch: "B.Sc. Nursing", domain: "Allied Health", cutoff_2024: 94.50, cutoff_2025: 94.75, cutoff_2026: 95.00 }
    ]
  },
  {
    college_code: "AIIMS-NAGPUR",
    college_name: "All India Institute of Medical Sciences, Nagpur",
    short_name: "AIIMS Nagpur",
    city: "Nagpur",
    type: "Central Autonomous Medical Institute",
    nirf_rank: "Apex Central Institute in Maharashtra",
    annual_fees: 5856,
    branches: [
      { branch: "MBBS", domain: "Medical Science", cutoff_2024: 99.72, cutoff_2025: 99.76, cutoff_2026: 99.80 }
    ]
  },
  {
    college_code: "GMC-NAGPUR",
    college_name: "Government Medical College, Nagpur",
    short_name: "GMC Nagpur",
    city: "Nagpur",
    type: "State Government Medical College",
    nirf_rank: "Vidarbha Premier Medical College",
    annual_fees: 132000,
    branches: [
      { branch: "MBBS", domain: "Medical Science", cutoff_2024: 99.45, cutoff_2025: 99.52, cutoff_2026: 99.58 },
      { branch: "BDS (Dental Surgery)", domain: "Dental Science", cutoff_2024: 97.60, cutoff_2025: 97.75, cutoff_2026: 97.90 },
      { branch: "BAMS (Ayurveda)", domain: "Ayush Medical", cutoff_2024: 94.80, cutoff_2025: 95.05, cutoff_2026: 95.30 }
    ]
  }
];

// COUNSELING AUTHORITY CONFIGURATIONS
export const EXAM_COUNSELING_CONFIGS = {
  "MHT-CET": {
    examId: "MHT-CET",
    title: "Maharashtra CAP Option Form & Cutoff Matrix Simulator",
    authorityBadge: "State CET Cell Maharashtra",
    processSubtitle: "Official CAP Rounds 1 to 4 Centralized Engineering Admissions",
    scoreLabel: "MHT-CET Percentile",
    scoreUnit: "%ile",
    codeLabel: "DTE Code",
    defaultScore: 97.4,
    rounds: ["CAP Round 1", "CAP Round 2", "CAP Round 3", "CAP Round 4"],
    categories: ["OPEN", "OBC", "EWS", "TFWS", "SC", "ST", "VJNT"],
    categoryOffsets: {
      OPEN: 0.0,
      OBC: -0.75,
      EWS: -0.40,
      TFWS: 0.35,
      SC: -4.20,
      ST: -8.50,
      VJNT: -2.10
    },
    roundOffsets: {
      "CAP Round 1": 0.0,
      "CAP Round 2": -0.65,
      "CAP Round 3": -1.40,
      "CAP Round 4": -2.25
    },
    catalog: MHT_CET_CATALOG.map(c => ({ ...c, available_branches: c.branches.map(b => b.branch) })),
    defaultChoices: [
      { college_code: "6006", selected_branch: "Computer Engineering" },
      { college_code: "3012", selected_branch: "Computer Engineering" },
      { college_code: "6271", selected_branch: "Computer Engineering" },
      { college_code: "6006", selected_branch: "Artificial Intelligence & Robotics" },
      { college_code: "3215", selected_branch: "Computer Engineering" },
      { college_code: "6271", selected_branch: "Information Technology" },
      { college_code: "6175", selected_branch: "Computer Engineering" },
      { college_code: "6273", selected_branch: "Computer Engineering" }
    ],
    presets: [
      {
        id: "pune_premier",
        name: "⚡ Top Pune CS/IT (COEP, PICT, VIT, PCCOE)",
        choices: [
          { college_code: "6006", selected_branch: "Computer Engineering" },
          { college_code: "6006", selected_branch: "Artificial Intelligence & Robotics" },
          { college_code: "6271", selected_branch: "Computer Engineering" },
          { college_code: "6271", selected_branch: "Information Technology" },
          { college_code: "6175", selected_branch: "Computer Engineering" },
          { college_code: "6273", selected_branch: "Computer Engineering" },
          { college_code: "6284", selected_branch: "Computer Engineering" }
        ]
      },
      {
        id: "mumbai_premier",
        name: "⚡ Top Mumbai CS/IT (VJTI, SPIT, DJ Sanghvi)",
        choices: [
          { college_code: "3012", selected_branch: "Computer Engineering" },
          { college_code: "3012", selected_branch: "Information Technology" },
          { college_code: "3215", selected_branch: "Computer Engineering" },
          { college_code: "3199", selected_branch: "Computer Engineering" },
          { college_code: "3182", selected_branch: "Computer Engineering" },
          { college_code: "3215", selected_branch: "Artificial Intelligence & Machine Learning" }
        ]
      },
      {
        id: "core_branches",
        name: "⚡ Core Engineering Form (Mechanical & Civil)",
        choices: [
          { college_code: "6006", selected_branch: "Mechanical Engineering" },
          { college_code: "6006", selected_branch: "Civil Engineering" },
          { college_code: "3012", selected_branch: "Mechanical Engineering" },
          { college_code: "3012", selected_branch: "Civil Engineering" },
          { college_code: "6007", selected_branch: "Mechanical Engineering" },
          { college_code: "6005", selected_branch: "Civil Engineering" }
        ]
      }
    ],
    roundTip: "The State CET Cell automatically freezes Choice #1 if allotted. Never put a college as Choice #1 unless you are 100% prepared to take admission there!"
  },
  "JEE Advanced": {
    examId: "JEE Advanced",
    title: "JoSAA IIT Seat Allocation & Cutoff Matrix Simulator",
    authorityBadge: "JoSAA (IIT Admissions)",
    processSubtitle: "Official JoSAA Rounds 1 to 6 Indian Institutes of Technology Allocation",
    scoreLabel: "JEE Advanced Score / AIR %ile",
    scoreUnit: "%ile",
    codeLabel: "JoSAA IIT Code",
    defaultScore: 99.2,
    rounds: ["JoSAA Round 1", "JoSAA Round 2", "JoSAA Round 3", "JoSAA Round 4", "JoSAA Round 5", "JoSAA Round 6"],
    categories: ["OPEN / CRL", "OBC-NCL", "GEN-EWS", "SC", "ST"],
    categoryOffsets: {
      "OPEN / CRL": 0.0,
      "OBC-NCL": -0.75,
      "GEN-EWS": -0.40,
      "SC": -4.20,
      "ST": -8.50
    },
    roundOffsets: {
      "JoSAA Round 1": 0.0,
      "JoSAA Round 2": -0.25,
      "JoSAA Round 3": -0.55,
      "JoSAA Round 4": -0.85,
      "JoSAA Round 5": -1.15,
      "JoSAA Round 6": -1.50
    },
    catalog: JEE_ADVANCED_CATALOG.map(c => ({ ...c, available_branches: c.branches.map(b => b.branch) })),
    defaultChoices: [
      { college_code: "IITB", selected_branch: "Computer Science & Engineering" },
      { college_code: "IITD", selected_branch: "Computer Science & Engineering" },
      { college_code: "IITM", selected_branch: "Computer Science & Engineering" },
      { college_code: "IITB", selected_branch: "Electrical Engineering" },
      { college_code: "IITK", selected_branch: "Computer Science & Engineering" },
      { college_code: "IITKGP", selected_branch: "Computer Science & Engineering" },
      { college_code: "IITR", selected_branch: "Data Science & Artificial Intelligence" },
      { college_code: "IITD", selected_branch: "Mathematics & Computing" }
    ],
    presets: [
      {
        id: "top_iits_cse",
        name: "⚡ Top 5 IITs Computer Science & Computing",
        choices: [
          { college_code: "IITB", selected_branch: "Computer Science & Engineering" },
          { college_code: "IITD", selected_branch: "Computer Science & Engineering" },
          { college_code: "IITM", selected_branch: "Computer Science & Engineering" },
          { college_code: "IITK", selected_branch: "Computer Science & Engineering" },
          { college_code: "IITKGP", selected_branch: "Computer Science & Engineering" },
          { college_code: "IITR", selected_branch: "Computer Science & Engineering" },
          { college_code: "IITD", selected_branch: "Mathematics & Computing" }
        ]
      },
      {
        id: "iit_bombay_delhi_circuital",
        name: "⚡ IIT Bombay & IIT Delhi Circuital Branches",
        choices: [
          { college_code: "IITB", selected_branch: "Computer Science & Engineering" },
          { college_code: "IITD", selected_branch: "Computer Science & Engineering" },
          { college_code: "IITB", selected_branch: "Electrical Engineering" },
          { college_code: "IITD", selected_branch: "Electrical Engineering" },
          { college_code: "IITB", selected_branch: "Aerospace Engineering" },
          { college_code: "IITB", selected_branch: "Mechanical Engineering" }
        ]
      },
      {
        id: "balanced_iit_portfolio",
        name: "⚡ Balanced IIT Preference List (Core & Tech)",
        choices: [
          { college_code: "IITB", selected_branch: "Electrical Engineering" },
          { college_code: "IITM", selected_branch: "Computer Science & Engineering" },
          { college_code: "IITK", selected_branch: "Electrical Engineering" },
          { college_code: "IITR", selected_branch: "Data Science & Artificial Intelligence" },
          { college_code: "IITKGP", selected_branch: "Mechanical Engineering" },
          { college_code: "IITB", selected_branch: "Mechanical Engineering" }
        ]
      }
    ],
    roundTip: "JoSAA allows candidates to Float, Slide, or Freeze choices across Rounds 1–6. Once Round 6 concludes, seat allocations are locked for all IITs!"
  },
  "JEE Main": {
    examId: "JEE Main",
    title: "JoSAA & CSAB NIT / IIIT Preference & Cutoff Matrix Simulator",
    authorityBadge: "JoSAA & CSAB (NITs & IIITs)",
    processSubtitle: "Official JoSAA Rounds 1 to 6 & CSAB Special Rounds Allocation",
    scoreLabel: "JEE Main CRL Percentile",
    scoreUnit: "%ile",
    codeLabel: "NIT / IIIT Code",
    defaultScore: 98.6,
    rounds: ["JoSAA Round 1", "JoSAA Round 2", "JoSAA Round 3", "JoSAA Round 4", "JoSAA Round 5", "JoSAA Round 6", "CSAB Special Round 1", "CSAB Special Round 2"],
    categories: ["OPEN", "OBC-NCL", "EWS", "SC", "ST", "Home State (HS)", "Other State (OS)"],
    categoryOffsets: {
      "OPEN": 0.0,
      "OBC-NCL": -0.75,
      "EWS": -0.40,
      "SC": -4.20,
      "ST": -8.50,
      "Home State (HS)": 0.40,
      "Other State (OS)": -0.40
    },
    roundOffsets: {
      "JoSAA Round 1": 0.0,
      "JoSAA Round 2": -0.25,
      "JoSAA Round 3": -0.55,
      "JoSAA Round 4": -0.85,
      "JoSAA Round 5": -1.15,
      "JoSAA Round 6": -1.50,
      "CSAB Special Round 1": -2.20,
      "CSAB Special Round 2": -3.10
    },
    catalog: JEE_MAIN_CATALOG.map(c => ({ ...c, available_branches: c.branches.map(b => b.branch) })),
    defaultChoices: [
      { college_code: "NITT", selected_branch: "Computer Science & Engineering" },
      { college_code: "NITK", selected_branch: "Computer Science & Engineering" },
      { college_code: "IIITA", selected_branch: "Information Technology" },
      { college_code: "NITW", selected_branch: "Computer Science & Engineering" },
      { college_code: "VNIT", selected_branch: "Computer Science & Engineering" },
      { college_code: "NITK", selected_branch: "Artificial Intelligence" },
      { college_code: "NITT", selected_branch: "Electronics & Communication" },
      { college_code: "VNIT", selected_branch: "Electronics & Communication" }
    ],
    presets: [
      {
        id: "top_nits_cse",
        name: "⚡ Top NITs (Trichy, Surathkal, Warangal) CS/IT",
        choices: [
          { college_code: "NITT", selected_branch: "Computer Science & Engineering" },
          { college_code: "NITK", selected_branch: "Computer Science & Engineering" },
          { college_code: "NITK", selected_branch: "Information Technology" },
          { college_code: "NITW", selected_branch: "Computer Science & Engineering" },
          { college_code: "IIITA", selected_branch: "Information Technology" },
          { college_code: "VNIT", selected_branch: "Computer Science & Engineering" }
        ]
      },
      {
        id: "maharashtra_vnit_hs",
        name: "⚡ VNIT Nagpur Home State Quota Focus",
        choices: [
          { college_code: "VNIT", selected_branch: "Computer Science & Engineering" },
          { college_code: "VNIT", selected_branch: "Electronics & Communication" },
          { college_code: "VNIT", selected_branch: "Electrical & Electronics" },
          { college_code: "VNIT", selected_branch: "Mechanical Engineering" },
          { college_code: "NITK", selected_branch: "Mechanical Engineering" },
          { college_code: "NITT", selected_branch: "Mechanical Engineering" }
        ]
      },
      {
        id: "iiit_tech_specialists",
        name: "⚡ IIIT & NIT Electronics & AI Specialist",
        choices: [
          { college_code: "IIITA", selected_branch: "Information Technology" },
          { college_code: "IIITA", selected_branch: "IT (Business Informatics)" },
          { college_code: "NITK", selected_branch: "Artificial Intelligence" },
          { college_code: "NITW", selected_branch: "Data Science & AI" },
          { college_code: "NITT", selected_branch: "Electronics & Communication" }
        ]
      }
    ],
    roundTip: "NIT admissions offer a 50% Home State quota. If you do not get an allotment in JoSAA 1–6, CSAB Special Rounds 1 & 2 open up significant vacancy relaxations!"
  },
  "NEET": {
    examId: "NEET",
    title: "MCC All India Quota Medical Preference Simulator",
    authorityBadge: "MCC All India Quota (AIQ)",
    processSubtitle: "Official 15% AIQ & Central Universities Medical (MBBS/BDS) Counseling",
    scoreLabel: "NEET Percentile / Marks",
    scoreUnit: "%ile",
    codeLabel: "MCC / Medical Code",
    defaultScore: 99.2,
    rounds: ["MCC Round 1 (AIQ)", "MCC Round 2 (Upgradation)", "MCC Round 3 (Mop-Up)", "Stray Vacancy Round"],
    categories: ["UR / OPEN", "OBC", "EWS", "SC", "ST", "Defense / PwD"],
    categoryOffsets: {
      "UR / OPEN": 0.0,
      "OPEN": 0.0,
      "OBC": -0.75,
      "EWS": -0.40,
      "SC": -4.20,
      "ST": -8.50,
      "Defense / PwD": -3.50
    },
    roundOffsets: {
      "MCC Round 1 (AIQ)": 0.0,
      "MCC Round 2 (Upgradation)": -0.45,
      "MCC Round 3 (Mop-Up)": -1.20,
      "Stray Vacancy Round": -2.10
    },
    catalog: NEET_UG_CATALOG.map(c => ({ ...c, available_branches: c.branches.map(b => b.branch) })),
    defaultChoices: [
      { college_code: "AIIMS-DELHI", selected_branch: "MBBS" },
      { college_code: "KEM-MUMBAI", selected_branch: "MBBS" },
      { college_code: "GMC-MUMBAI", selected_branch: "MBBS" },
      { college_code: "AFMC-PUNE", selected_branch: "MBBS" },
      { college_code: "BJMC-PUNE", selected_branch: "MBBS" },
      { college_code: "AIIMS-NAGPUR", selected_branch: "MBBS" },
      { college_code: "GMC-NAGPUR", selected_branch: "MBBS" },
      { college_code: "GMC-MUMBAI", selected_branch: "BDS (Dental Surgery)" }
    ],
    presets: [
      {
        id: "top_mbbs_league",
        name: "⚡ Premier AIQ Medical League (AIIMS, KEM, AFMC)",
        choices: [
          { college_code: "AIIMS-DELHI", selected_branch: "MBBS" },
          { college_code: "KEM-MUMBAI", selected_branch: "MBBS" },
          { college_code: "GMC-MUMBAI", selected_branch: "MBBS" },
          { college_code: "AFMC-PUNE", selected_branch: "MBBS" },
          { college_code: "BJMC-PUNE", selected_branch: "MBBS" },
          { college_code: "AIIMS-NAGPUR", selected_branch: "MBBS" }
        ]
      },
      {
        id: "maharashtra_gmc_hubs",
        name: "⚡ Maharashtra Government Medical Colleges (MBBS)",
        choices: [
          { college_code: "KEM-MUMBAI", selected_branch: "MBBS" },
          { college_code: "GMC-MUMBAI", selected_branch: "MBBS" },
          { college_code: "BJMC-PUNE", selected_branch: "MBBS" },
          { college_code: "AIIMS-NAGPUR", selected_branch: "MBBS" },
          { college_code: "GMC-NAGPUR", selected_branch: "MBBS" }
        ]
      },
      {
        id: "dental_ayush_nursing",
        name: "⚡ Dental (BDS), Ayush (BAMS) & Allied Health",
        choices: [
          { college_code: "GMC-MUMBAI", selected_branch: "BDS (Dental Surgery)" },
          { college_code: "BJMC-PUNE", selected_branch: "BDS (Dental Surgery)" },
          { college_code: "GMC-NAGPUR", selected_branch: "BDS (Dental Surgery)" },
          { college_code: "GMC-NAGPUR", selected_branch: "BAMS (Ayurveda)" },
          { college_code: "AIIMS-DELHI", selected_branch: "B.Sc. Nursing (Hons)" }
        ]
      }
    ],
    roundTip: "MCC Round 1 offers Free Exit with zero forfeiture of security deposit. In Round 2, you can opt for seat upgradation, but exiting forfeits your refundable fee!"
  },
  "NEET-DMER": {
    examId: "NEET",
    title: "Maharashtra State DMER Medical Preference Simulator",
    authorityBadge: "Maharashtra State DMER (85% Quota)",
    processSubtitle: "Official 85% Maharashtra State Medical (MBBS/BDS) Counseling",
    scoreLabel: "NEET Percentile / Marks",
    scoreUnit: "%ile",
    codeLabel: "DMER Medical Code",
    defaultScore: 99.1,
    rounds: ["DMER Round 1 (State)", "DMER Round 2 (Upgradation)", "DMER Round 3 (Mop-Up)", "Institutional Stray Vacancy"],
    categories: ["OPEN", "OBC", "EWS", "SC", "ST", "VJNT", "Defense / PwD"],
    categoryOffsets: {
      "OPEN": 0.0,
      "OBC": -0.75,
      "EWS": -0.40,
      "SC": -4.20,
      "ST": -8.50,
      "VJNT": -2.10,
      "Defense / PwD": -3.50
    },
    roundOffsets: {
      "DMER Round 1 (State)": 0.0,
      "DMER Round 2 (Upgradation)": -0.55,
      "DMER Round 3 (Mop-Up)": -1.35,
      "Institutional Stray Vacancy": -2.25
    },
    catalog: NEET_UG_CATALOG.map(c => ({ ...c, available_branches: c.branches.map(b => b.branch) })),
    defaultChoices: [
      { college_code: "KEM-MUMBAI", selected_branch: "MBBS" },
      { college_code: "GMC-MUMBAI", selected_branch: "MBBS" },
      { college_code: "BJMC-PUNE", selected_branch: "MBBS" },
      { college_code: "AIIMS-NAGPUR", selected_branch: "MBBS" },
      { college_code: "GMC-NAGPUR", selected_branch: "MBBS" },
      { college_code: "GMC-MUMBAI", selected_branch: "BDS (Dental Surgery)" }
    ],
    presets: [
      {
        id: "dmer_top_mbbs",
        name: "⚡ Maharashtra State GMCs (MBBS)",
        choices: [
          { college_code: "KEM-MUMBAI", selected_branch: "MBBS" },
          { college_code: "GMC-MUMBAI", selected_branch: "MBBS" },
          { college_code: "BJMC-PUNE", selected_branch: "MBBS" },
          { college_code: "GMC-NAGPUR", selected_branch: "MBBS" }
        ]
      },
      {
        id: "dmer_dental_pune_mumbai",
        name: "⚡ Government Dental & Nursing Quota",
        choices: [
          { college_code: "GMC-MUMBAI", selected_branch: "BDS (Dental Surgery)" },
          { college_code: "BJMC-PUNE", selected_branch: "BDS (Dental Surgery)" },
          { college_code: "BJMC-PUNE", selected_branch: "B.Sc. Nursing" }
        ]
      }
    ],
    roundTip: "State DMER rounds govern 85% of Maharashtra seats. Candidates holding Domicile of Maharashtra have state quota preference across all government medical colleges."
  },
  "NEET-AYUSH": {
    examId: "NEET",
    title: "Maharashtra AYUSH & Dental Preference Matrix Simulator",
    authorityBadge: "AYUSH & Dental Admissions",
    processSubtitle: "Government Dental Surgery (BDS) & Ayurvedic (BAMS) Centralized Admissions",
    scoreLabel: "NEET Percentile / Marks",
    scoreUnit: "%ile",
    codeLabel: "AYUSH / Dental Code",
    defaultScore: 97.2,
    rounds: ["AYUSH Round 1", "AYUSH Round 2", "AYUSH Mop-Up Round"],
    categories: ["OPEN", "OBC", "EWS", "SC", "ST", "VJNT"],
    categoryOffsets: {
      "OPEN": 0.0,
      "OBC": -0.75,
      "EWS": -0.40,
      "SC": -4.20,
      "ST": -8.50,
      "VJNT": -2.10
    },
    roundOffsets: {
      "AYUSH Round 1": 0.0,
      "AYUSH Round 2": -0.65,
      "AYUSH Mop-Up Round": -1.50
    },
    catalog: NEET_UG_CATALOG.map(c => ({ ...c, available_branches: c.branches.map(b => b.branch) })),
    defaultChoices: [
      { college_code: "GMC-MUMBAI", selected_branch: "BDS (Dental Surgery)" },
      { college_code: "BJMC-PUNE", selected_branch: "BDS (Dental Surgery)" },
      { college_code: "GMC-NAGPUR", selected_branch: "BDS (Dental Surgery)" },
      { college_code: "GMC-NAGPUR", selected_branch: "BAMS (Ayurveda)" },
      { college_code: "AIIMS-DELHI", selected_branch: "B.Sc. Nursing (Hons)" }
    ],
    presets: [
      {
        id: "ayush_core_bams",
        name: "⚡ Government BAMS & BDS List",
        choices: [
          { college_code: "GMC-MUMBAI", selected_branch: "BDS (Dental Surgery)" },
          { college_code: "BJMC-PUNE", selected_branch: "BDS (Dental Surgery)" },
          { college_code: "GMC-NAGPUR", selected_branch: "BAMS (Ayurveda)" }
        ]
      }
    ],
    roundTip: "AYUSH & Dental allocations are conducted via AACCC for 15% AIQ and State DMER for 85% state quota after MBBS allocations conclude."
  }
};

// Exam auto-detection helper
function detectExamType(profile) {
  const e = (profile?.exam_type || profile?.exam || "").toLowerCase();
  const s = (profile?.stream || "").toLowerCase();
  if (e.includes("adv") || e.includes("iit")) return "JEE Advanced";
  if (e.includes("main") || e.includes("nit") || e.includes("csab")) return "JEE Main";
  if (e.includes("neet") || e.includes("med") || e.includes("mbbs") || s.includes("med")) return "NEET";
  if (e.includes("jee")) return "JEE Main";
  return "MHT-CET";
}

// Format official 9-digit DTE Choice Code (4-digit Institute + 3-digit Branch + 2-digit Shift/Status)
function getOfficialChoiceCode(collegeCode, branchName) {
  const digits = String(collegeCode || "").replace(/\D/g, "");
  const code = digits.length >= 4 ? digits.slice(0, 4) : String(collegeCode || "6006").padEnd(4, "0").slice(0, 4);
  const b = (branchName || "").toLowerCase();
  let courseCode = "242"; // Computer Engineering
  if (b.includes("info") || b.includes("it")) courseCode = "246";
  else if (b.includes("ai") || b.includes("data") || b.includes("robot") || b.includes("cyber")) courseCode = "995";
  else if (b.includes("telecom") || b.includes("entc") || b.includes("extc") || b.includes("electronics")) courseCode = "372";
  else if (b.includes("mech") || b.includes("auto")) courseCode = "612";
  else if (b.includes("civil") || b.includes("infra")) courseCode = "191";
  else if (b.includes("electr") || b.includes("power")) courseCode = "293";
  else if (b.includes("chem") || b.includes("paint") || b.includes("petro")) courseCode = "507";
  return `${code}${courseCode}10`;
}

// Immediate deterministic calculation function to ensure zero blank states
function computeLocalRow(choice, category, round, studentMarks, currentConfig, extraCatalog = []) {
  const catalog = (extraCatalog && extraCatalog.length > 0) ? extraCatalog : currentConfig.catalog;
  let college = catalog.find(c => String(c.college_code) === String(choice.college_code));
  if (!college && choice.college_name) {
    college = catalog.find(c => String(c.college_name).toLowerCase() === String(choice.college_name).toLowerCase());
  }
  if (!college) {
    const stdBranches = choice.available_branches || [
      choice.selected_branch || "Computer Engineering",
      "Computer Engineering",
      "Information Technology",
      "Artificial Intelligence & Data Science",
      "Electronics & Telecommunication",
      "Mechanical Engineering",
      "Civil Engineering"
    ];
    college = {
      college_code: choice.college_code,
      college_name: choice.college_name || choice.college_code,
      short_name: (choice.college_name || choice.college_code).split(",")[0].trim(),
      city: "Maharashtra",
      nirf_rank: "Participating Institute",
      annual_fees: 110000,
      available_branches: stdBranches,
      branches: stdBranches.map(b => ({
        branch: b,
        domain: "Engineering & Technology",
        cutoff_2024: 85.0,
        cutoff_2025: 85.4,
        cutoff_2026: 85.8
      }))
    };
  }

  const branches = (college.branches && college.branches.length > 0)
    ? college.branches
    : (college.available_branches || ["Computer Engineering"]).map(b => ({
        branch: b,
        domain: "Engineering & Technology",
        cutoff_2024: 85.0,
        cutoff_2025: 85.4,
        cutoff_2026: 85.8
      }));

  const availableBranches = college.available_branches || branches.map(b => b.branch);

  let branchObj = branches.find(b => b.branch.toLowerCase() === (choice.selected_branch || "").toLowerCase());
  if (!branchObj) {
    branchObj = branches.find(b => (
      b.branch.toLowerCase().includes((choice.selected_branch || "").toLowerCase()) ||
      (choice.selected_branch || "").toLowerCase().includes(b.branch.toLowerCase())
    ));
  }
  if (!branchObj && branches.length > 0) {
    branchObj = {
      branch: choice.selected_branch || branches[0].branch,
      domain: branches[0].domain || "Engineering & Technology",
      cutoff_2024: branches[0].cutoff_2024 || 85.0,
      cutoff_2025: branches[0].cutoff_2025 || 85.4,
      cutoff_2026: branches[0].cutoff_2026 || 85.8
    };
  }

  if (!branchObj) {
    return {
      college_code: college.college_code,
      college_name: college.college_name,
      short_name: college.short_name,
      city: college.city,
      nirf_rank: college.nirf_rank,
      annual_fees: college.annual_fees,
      selected_branch: choice.selected_branch,
      is_branch_offered: false,
      branch_status: "Branch Not Offered by this Institute",
      available_branches: availableBranches,
      cutoff_2024: null,
      cutoff_2025: null,
      cutoff_2026: null,
      cutoff_2027_predicted: null,
      trend_direction: "none",
      trend_label: "N/A",
      admission_probability: 0,
      probability_label: "Not Provided",
      tier: "Not Offered",
      score_margin: null,
      status_color: "secondary",
      summary_text: `${college.short_name} does not offer ${choice.selected_branch}.`
    };
  }

  const catOffset = currentConfig.categoryOffsets[category] ?? 0.0;
  const roundOffset = currentConfig.roundOffsets[round] ?? 0.0;

  const raw24 = branchObj.cutoff_2024 + catOffset + roundOffset;
  const raw25 = branchObj.cutoff_2025 + catOffset + roundOffset;
  const raw26 = branchObj.cutoff_2026 + catOffset + roundOffset;

  const c_2024 = parseFloat(Math.min(99.99, Math.max(35.0, raw24)).toFixed(2));
  const c_2025 = parseFloat(Math.min(99.99, Math.max(35.0, raw25)).toFixed(2));
  const c_2026 = parseFloat(Math.min(99.99, Math.max(35.0, raw26)).toFixed(2));

  const slope = parseFloat((((c_2026 - c_2025) + (c_2025 - c_2024)) / 2.0).toFixed(3));
  const c_2027 = parseFloat(Math.min(99.99, Math.max(35.0, c_2026 + slope)).toFixed(2));

  let trend_direction = "stable";
  let trend_label = "⚖️ Stable (±0.02%)";
  if (slope > 0.04) {
    trend_direction = "rising";
    trend_label = `📈 +${slope.toFixed(2)}% (Rising Competition)`;
  } else if (slope < -0.04) {
    trend_direction = "easing";
    trend_label = `📉 ${slope.toFixed(2)}% (Relaxing Trend)`;
  }

  const margin = parseFloat((studentMarks - c_2026).toFixed(2));
  let probability = 50;
  let probability_label = "Realistic (Target)";
  let tier = "Target";
  let status_color = "warning";

  if (margin >= 2.0) {
    probability = 98;
    probability_label = "Very High (Confirmed Safe)";
    tier = "Safe";
    status_color = "success";
  } else if (margin >= 0.8) {
    probability = Math.min(96, Math.round(90 + (margin - 0.8) * 5));
    probability_label = "High Chance (Safe)";
    tier = "Safe";
    status_color = "success";
  } else if (margin >= 0.0) {
    probability = Math.min(88, Math.round(80 + margin * 12));
    probability_label = "Strong Chance (Safe/Target)";
    tier = "Safe";
    status_color = "success";
  } else if (margin >= -0.6) {
    probability = Math.max(45, Math.round(65 + margin * 30));
    probability_label = "Realistic (Target)";
    tier = "Target";
    status_color = "warning";
  } else if (margin >= -1.5) {
    probability = Math.max(15, Math.round(35 + (margin + 0.6) * 22));
    probability_label = "Reach / Dream (Competitive)";
    tier = "Dream";
    status_color = "danger";
  } else {
    probability = Math.max(2, Math.round(10 + (margin + 1.5) * 4));
    probability_label = "High Reach (Dream Only)";
    tier = "Dream";
    status_color = "danger";
  }

  return {
    college_code: college.college_code,
    college_name: college.college_name,
    short_name: college.short_name,
    city: college.city,
    nirf_rank: college.nirf_rank,
    annual_fees: college.annual_fees,
    selected_branch: choice.selected_branch,
    is_branch_offered: true,
    branch_status: "Offered",
    available_branches: availableBranches,
    cutoff_2024: c_2024,
    cutoff_2025: c_2025,
    cutoff_2026: c_2026,
    cutoff_2027_predicted: c_2027,
    trend_direction,
    trend_label,
    admission_probability: probability,
    probability_label,
    tier,
    score_margin: margin,
    status_color,
    summary_text: `Cutoff 2026: ${c_2026}%ile. Your score margin: ${margin >= 0 ? "+" + margin : margin}%ile (${probability}% probability).`
  };
}

function computeLocalTable(choices, category, round, studentMarks, currentConfig, extraCatalog = []) {
  const rows = choices.map((c, idx) => ({
    ...computeLocalRow(c, category, round, studentMarks, currentConfig, extraCatalog),
    preference_no: idx + 1
  }));

  let safe = 0, target = 0, dream = 0, not_offered = 0;
  let firstAllotted = null;

  rows.forEach(r => {
    if (!r.is_branch_offered) {
      not_offered++;
    } else if (r.tier === "Safe") {
      safe++;
      if (!firstAllotted) firstAllotted = r;
    } else if (r.tier === "Target") {
      target++;
      if (!firstAllotted && r.admission_probability >= 65) firstAllotted = r;
    } else if (r.tier === "Dream") {
      dream++;
    }
  });

  return {
    success: true,
    rows,
    counts: {
      total_choices: rows.length,
      safe,
      target,
      dream,
      not_offered
    },
    predicted_allotment: firstAllotted,
    health_color: safe >= 2 && target >= 1 ? "success" : "danger",
    strategy_feedback: safe >= 2
      ? "✅ Healthy Balanced Option Form: You have safe choices as a safety net along with target and dream choices."
      : "⚠️ High Risk List: Add at least 2 safe choices with cutoffs 1-2% below your score to guarantee admission.",
    allotment_advisory: firstAllotted
      ? `🎯 Choice #${firstAllotted.preference_no} (${firstAllotted.short_name} - ${firstAllotted.selected_branch}) is provisionally allotted in ${round}.`
      : `No choice provisionally allotted in ${round}. Consider relaxing your category or adding higher-intake colleges.`
  };
}

export default function CapSimulatorPage({ studentProfile, currentUser, onLogout }) {
  const navigate = useNavigate();

  // Read saved profile from localStorage if prop is not passed or empty
  const [profileOverride, setProfileOverride] = useState(null);

  const activeProfile = useMemo(() => {
    if (profileOverride) return profileOverride;
    let p = studentProfile;
    if (!p) {
      try {
        const saved = localStorage.getItem("edu_student_profile");
        if (saved) p = JSON.parse(saved);
      } catch {}
    }
    return {
      name: p?.name || currentUser?.name || "Student",
      marks: p?.marks !== undefined && p?.marks !== "" ? parseFloat(p.marks) : 97.4,
      exam_type: p?.exam_type || "MHT-CET",
      score_unit: p?.score_unit || "percentile",
      category: p?.category || "OBC",
      stream: p?.stream || "Engineering"
    };
  }, [studentProfile, currentUser, profileOverride]);

  // Is this candidate profile in Medical Stream?
  const isMedicalProfile = useMemo(() => {
    const s = (activeProfile.stream || "").toLowerCase();
    const e = (activeProfile.exam_type || "").toLowerCase();
    return s.includes("med") || e.includes("neet") || e.includes("mbbs") || e.includes("doctor");
  }, [activeProfile.stream, activeProfile.exam_type]);

  // Toggle to show all national exams or filter by active profile
  const [showAllExams, setShowAllExams] = useState(false);

  // Initial canonical exam detection based on profile
  const initialExam = useMemo(() => detectExamType(activeProfile), [activeProfile]);
  const [selectedExam, setSelectedExam] = useState(initialExam);

  // Active counseling configuration
  const currentConfig = useMemo(() => {
    return EXAM_COUNSELING_CONFIGS[selectedExam] || EXAM_COUNSELING_CONFIGS["MHT-CET"];
  }, [selectedExam]);

  // Global Controls State
  const [studentScore, setStudentScore] = useState(() => {
    const pMarks = parseFloat(activeProfile.marks);
    return !isNaN(pMarks) && pMarks > 0 ? pMarks : currentConfig.defaultScore;
  });

  const [selectedCategory, setSelectedCategory] = useState(() => {
    const profCat = (activeProfile.category || "OPEN").toUpperCase();
    return currentConfig.categories.find(c => c.toUpperCase() === profCat || c.includes(profCat)) || currentConfig.categories[0];
  });

  const [selectedRound, setSelectedRound] = useState(currentConfig.rounds[0]);

  // Colleges Catalog & Search State
  const [collegesCatalog, setCollegesCatalog] = useState(currentConfig.catalog);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Preference Table Choices
  const [tableChoices, setTableChoices] = useState(currentConfig.defaultChoices);

  const [simulatedData, setSimulatedData] = useState(() =>
    computeLocalTable(
      currentConfig.defaultChoices,
      currentConfig.categories[0],
      currentConfig.rounds[0],
      currentConfig.defaultScore,
      currentConfig
    )
  );

  // View mode & Layout states
  const [viewMode, setViewMode] = useState("table"); // "table" | "tiers" | "official" | "compact"
  const [isAiToolsOpen, setIsAiToolsOpen] = useState(true); // Open by default for immediate accessibility
  const [filterQuery, setFilterQuery] = useState("");

  const activeSimulatedData = useMemo(() => {
    if (simulatedData && simulatedData.rows && simulatedData.rows.length === tableChoices.length) {
      return simulatedData;
    }
    return computeLocalTable(tableChoices, selectedCategory, selectedRound, studentScore, currentConfig, collegesCatalog);
  }, [simulatedData, tableChoices, selectedCategory, selectedRound, studentScore, currentConfig, collegesCatalog]);

  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);

  const filteredRows = useMemo(() => {
    const rows = activeSimulatedData?.rows || [];
    if (!filterQuery.trim()) return rows;
    const q = filterQuery.toLowerCase();
    return rows.filter(r =>
      (r.college_name || "").toLowerCase().includes(q) ||
      (r.short_name || "").toLowerCase().includes(q) ||
      (r.selected_branch || "").toLowerCase().includes(q) ||
      (r.city || "").toLowerCase().includes(q) ||
      String(r.college_code || "").includes(q) ||
      (r.tier || "").toLowerCase().includes(q)
    );
  }, [activeSimulatedData, filterQuery]);

  const handleCopyAllOfficialCodes = () => {
    const codes = (activeSimulatedData?.rows || []).map(r => getOfficialChoiceCode(r.college_code, r.selected_branch));
    if (codes.length === 0) return;
    navigator.clipboard.writeText(codes.join(", ")).then(() => {
      setCopyCodeSuccess(true);
      setTimeout(() => setCopyCodeSuccess(false), 2500);
    });
  };

  const handleCopySingleCode = (code, idx) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCodeIdx(idx);
      setTimeout(() => setCopiedCodeIdx(null), 2000);
    });
  };

  // AI Option Form Auto-Rebalancer & Risk Matrix State (Feature 2)
  const [aiRebalanceResult, setAiRebalanceResult] = useState(null);
  const [aiRebalanceLoading, setAiRebalanceLoading] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState("");
  const [previousChoicesBackup, setPreviousChoicesBackup] = useState(null);
  const [appliedAlert, setAppliedAlert] = useState(null);
  const [activeStrategyPreset, setActiveStrategyPreset] = useState("golden_ratio");
  const [aiTab, setAiTab] = useState("strategies"); // "strategies" | "chat"

  // Selected Target Branch for Auto-Rebalancer & Option Form Management
  const [selectedRebalanceBranch, setSelectedRebalanceBranch] = useState("auto");

  // Available major disciplines for current exam counseling
  const availableExamBranches = useMemo(() => {
    if ((selectedExam || "").toLowerCase().includes("neet")) {
      return ["MBBS", "BDS (Dental Surgery)", "BAMS (Ayurvedic Medicine)", "BHMS (Homeopathic Medicine)"];
    }
    return [
      "Computer Engineering",
      "Information Technology",
      "Artificial Intelligence & Data Science",
      "Electronics & Telecommunication",
      "Mechanical Engineering",
      "Civil Engineering",
      "Electrical Engineering",
      "Chemical Engineering"
    ];
  }, [selectedExam]);

  // Dynamically resolve target branch for rebalancing
  const activeTargetBranch = useMemo(() => {
    if (selectedRebalanceBranch && selectedRebalanceBranch !== "auto") {
      return selectedRebalanceBranch;
    }
    return tableChoices[0]?.selected_branch || (selectedExam.includes("NEET") ? "MBBS" : "Computer Engineering");
  }, [selectedRebalanceBranch, tableChoices, selectedExam]);

  // Calculate real-time portfolio risk metrics live from active table
  const portfolioStats = useMemo(() => {
    const rows = activeSimulatedData?.rows || [];
    let dream = 0;
    let target = 0;
    let safe = 0;
    let notOffered = 0;

    rows.forEach(r => {
      if (!r.is_branch_offered) notOffered++;
      else if (r.tier === "Safe") safe++;
      else if (r.tier === "Target") target++;
      else if (r.tier === "Dream") dream++;
    });

    const totalValid = dream + target + safe;
    const dreamPct = totalValid > 0 ? Math.round((dream / totalValid) * 100) : 0;
    const targetPct = totalValid > 0 ? Math.round((target / totalValid) * 100) : 0;
    const safePct = totalValid > 0 ? Math.round((safe / totalValid) * 100) : 0;

    let riskLevel = "BALANCED";
    let statusBadge = "✅ BALANCED PORTFOLIO";
    let badgeClass = "bg-success text-white";
    let alertMsg = "Healthy portfolio distribution. In Round 1, if allotted a target choice, you can opt for Float (Betterment) to safely contest your dream choices in subsequent rounds.";

    if (totalValid === 0) {
      riskLevel = "EMPTY";
      statusBadge = "⚪ EMPTY LIST";
      badgeClass = "bg-secondary text-white";
      alertMsg = "No colleges added yet. Use the 1-Click AI Strategy buttons below or chat with the counselor to construct your optimal option form.";
    } else if (safe === 0) {
      riskLevel = "CRITICAL";
      statusBadge = "🚨 CRITICAL RISK: 0 Safe Colleges!";
      badgeClass = "bg-danger text-white";
      alertMsg = "You have ZERO safe backups in your list! In CAP counseling, 80% of candidates who do this receive ZERO seat allotments across all rounds. Add at least 2 safe backups or click 'Auto-Rebalance' immediately.";
    } else if (dream === 0 && safe > 0) {
      riskLevel = "SUBOPTIMAL";
      statusBadge = "⚠️ SUB-OPTIMAL: Missing Dream Reaches";
      badgeClass = "bg-warning text-dark";
      alertMsg = "Your option form only has safe colleges. You have spare percentile headroom to add top aspirational colleges at preferences #1-#3 without risking your safe allotment!";
    } else if (dreamPct > 70) {
      riskLevel = "HIGH_VOLATILITY";
      statusBadge = "⚠️ HIGH VOLATILITY: Over 70% Reaches";
      badgeClass = "bg-warning text-dark";
      alertMsg = "Over 70% of your choices are high-reach dreams with low probability. Rebalance towards the Golden 20:50:30 ratio to lock in a confirmed seat.";
    }

    return {
      total: rows.length,
      totalValid,
      dream,
      target,
      safe,
      notOffered,
      dreamPct,
      targetPct,
      safePct,
      riskLevel,
      statusBadge,
      badgeClass,
      alertMsg
    };
  }, [activeSimulatedData]);

  // Execute AI Rebalancing Request with strict branch locking
  const handleRunRebalance = async (strategyType = "golden_ratio", customPrompt = "", autoApply = false, overrideBranch = null) => {
    setActiveStrategyPreset(strategyType);
    setAiRebalanceLoading(true);
    setAppliedAlert(null);
    try {
      const targetBranch = overrideBranch || activeTargetBranch;

      const payload = {
        student_score: studentScore,
        exam_type: selectedExam,
        category: selectedCategory,
        cap_round: selectedRound,
        strategy_type: strategyType,
        prompt: customPrompt,
        preferred_branch: targetBranch,
        preferred_branches: [targetBranch],
        current_choices: tableChoices.map(c => ({
          college_code: c.college_code,
          selected_branch: c.selected_branch
        }))
      };

      const res = await fetch("/api/cap/rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setAiRebalanceResult(data);
        if (autoApply && data.recommended_choices && data.recommended_choices.length > 0) {
          setPreviousChoicesBackup([...tableChoices]);
          const newChoices = data.recommended_choices.map(c => ({
            college_code: c.college_code,
            college_name: c.college_name || c.short_name,
            short_name: c.short_name,
            city: c.city,
            selected_branch: c.selected_branch
          }));
          setSimulatedData(null);
          setTableChoices(newChoices);
          const strategyLabels = {
            golden_ratio: "Golden Ratio (20:50:30)",
            tech_cs_only: "Top Tech & CS Only",
            pune_mumbai_hub: "Pune & Mumbai Elite Hub",
            guaranteed_lock: "100% Round 1 Seat Lock",
            custom_chat: "AI Counselor Recommendation"
          };
          const label = strategyLabels[strategyType] || "AI Strategy";
          setAppliedAlert(`🎉 Automatically applied ${label}! Live table updated with ${newChoices.length} choices strictly in your selected branch (${targetBranch}).`);
        }
      }
    } catch (err) {
      console.error("AI Rebalance Error:", err);
    } finally {
      setAiRebalanceLoading(false);
    }
  };

  // One-click Mutation: Apply AI List directly to Live Table
  const handleApplyRebalancedList = (recommendedChoices) => {
    if (!recommendedChoices || recommendedChoices.length === 0) return;
    setPreviousChoicesBackup([...tableChoices]);
    const newChoices = recommendedChoices.map(c => ({
      college_code: c.college_code,
      college_name: c.college_name || c.short_name,
      short_name: c.short_name,
      city: c.city,
      selected_branch: c.selected_branch
    }));
    setSimulatedData(null);
    setTableChoices(newChoices);
    const branchName = newChoices[0]?.selected_branch || activeTargetBranch;
    setAppliedAlert(`🎉 Option Form successfully updated with ${newChoices.length} AI-optimized choices strictly for ${branchName}! Cutoffs and probabilities recalculated.`);
    const tableEl = document.getElementById("cap-simulation-table");
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Helper: Apply target branch across all current table choices
  const handleApplyBranchToAllChoices = (targetBranch) => {
    if (!targetBranch) return;
    setSelectedRebalanceBranch(targetBranch);
    setPreviousChoicesBackup([...tableChoices]);
    setTableChoices(prev => prev.map(c => {
      const catalogCol = collegesCatalog.find(col => String(col.college_code) === String(c.college_code));
      const available = catalogCol?.available_branches || (catalogCol?.branches ? catalogCol.branches.map(b => b.branch) : null) || c.available_branches || [c.selected_branch];
      const matched = available.find(b => b.toLowerCase() === targetBranch.toLowerCase())
        || available.find(b => b.toLowerCase().includes(targetBranch.toLowerCase()) || targetBranch.toLowerCase().includes(b.toLowerCase()))
        || c.selected_branch;
      return {
        ...c,
        selected_branch: matched
      };
    }));
    setSimulatedData(null);
    setAppliedAlert(`Switched existing choices to ${targetBranch} where offered.`);
  };

  // Revert back to previous option list
  const handleUndoRebalance = () => {
    if (previousChoicesBackup) {
      setSimulatedData(null);
      setTableChoices(previousChoicesBackup);
      setPreviousChoicesBackup(null);
      setAppliedAlert("Reverted option form back to previous list.");
    }
  };

  // Handle switching entrance exam and counseling process
  const handleExamSwitch = (newExamId) => {
    const nextCfg = EXAM_COUNSELING_CONFIGS[newExamId] || EXAM_COUNSELING_CONFIGS["MHT-CET"];
    setSelectedExam(newExamId);
    setCollegesCatalog(nextCfg.catalog);
    setTableChoices(nextCfg.defaultChoices);
    setSelectedRound(nextCfg.rounds[0]);
    // Pick suitable category
    const foundCat = nextCfg.categories.find(c => c.toLowerCase().includes((selectedCategory || "").toLowerCase())) || nextCfg.categories[0];
    setSelectedCategory(foundCat);
    const pMarks = parseFloat(activeProfile.marks);
    if (!isNaN(pMarks) && pMarks > 0) {
      setStudentScore(pMarks);
    } else {
      setStudentScore(nextCfg.defaultScore);
    }
    setSearchQuery("");
    setIsSearchOpen(false);

    // Fetch backend catalog for the new exam
    const apiExam = nextCfg.examId || newExamId;
    fetch(`/api/cap-table/catalog?exam_type=${encodeURIComponent(apiExam)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.colleges?.length > 0) {
          setCollegesCatalog(data.colleges);
        }
      })
      .catch(() => {});
  };

  // Keep simulator synchronized whenever studentProfile changes
  useEffect(() => {
    const targetExam = detectExamType(activeProfile);
    if (targetExam !== selectedExam) {
      handleExamSwitch(targetExam);
    }
    if (activeProfile.marks && !isNaN(activeProfile.marks)) {
      setStudentScore(parseFloat(activeProfile.marks));
    }
  }, [activeProfile.exam_type, activeProfile.stream, activeProfile.marks]);

  // Load full catalog on mount or when selectedExam changes
  useEffect(() => {
    const apiExam = EXAM_COUNSELING_CONFIGS[selectedExam]?.examId || selectedExam;
    fetch(`/api/cap-table/catalog?exam_type=${encodeURIComponent(apiExam)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.colleges?.length > 0) {
          setCollegesCatalog(data.colleges);
        }
      })
      .catch(() => {});
  }, [selectedExam]);

  // Dynamic backend search for any institution
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    const timer = setTimeout(() => {
      const apiExam = EXAM_COUNSELING_CONFIGS[selectedExam]?.examId || selectedExam;
      fetch(`/api/cap-table/search?q=${encodeURIComponent(searchQuery.trim())}&exam_type=${encodeURIComponent(apiExam)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.colleges?.length > 0) {
            setCollegesCatalog(prev => {
              const existingCodes = new Set(prev.map(c => String(c.college_code)));
              const newItems = data.colleges.filter(c => !existingCodes.has(String(c.college_code)));
              if (newItems.length > 0) {
                return [...prev, ...newItems];
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedExam]);

  // Handle quick switching of profile exam
  const handleProfileExamChange = (newExam) => {
    const isNewMed = newExam.toLowerCase().includes("neet");
    const updated = {
      ...activeProfile,
      exam_type: newExam,
      stream: isNewMed ? "Medical" : "Engineering",
      marks: isNewMed ? 655 : (newExam === "JEE Advanced" ? 99.2 : newExam === "JEE Main" ? 98.6 : 97.4)
    };
    setProfileOverride(updated);
    try {
      localStorage.setItem("edu_student_profile", JSON.stringify(updated));
    } catch {}
    handleExamSwitch(newExam === "NEET" ? "NEET" : newExam);
  };

  // DYNAMIC COUNSELING OPTIONS THAT DEPEND UPON THE SELECTED PROFILE
  const counselingOptions = useMemo(() => {
    if (!showAllExams) {
      if (isMedicalProfile) {
        return [
          {
            id: "NEET",
            label: "NEET UG (MCC AIQ)",
            icon: "🩺",
            tag: "15% All India Quota",
            desc: "AIIMS, JIPMER, Central Universities, 15% AIQ",
            isProfileExam: true
          },
          {
            id: "NEET-DMER",
            label: "NEET UG (State DMER)",
            icon: "🏥",
            tag: "85% Maharashtra Quota",
            desc: "GMC Mumbai (JJ), BJMC Pune, KEM, GMC Nagpur",
            isProfileExam: false
          },
          {
            id: "NEET-AYUSH",
            label: "Dental & AYUSH (BDS/BAMS)",
            icon: "🦷",
            tag: "BDS & Ayush",
            desc: "Government Dental & Ayurvedic Medical Colleges",
            isProfileExam: false
          }
        ];
      } else {
        // Engineering stream: order with the student's exam first
        const examName = (activeProfile.exam_type || "").toLowerCase();
        const isJeeMain = examName.includes("main") || (examName.includes("jee") && !examName.includes("adv"));
        const isJeeAdv = examName.includes("adv") || examName.includes("iit");
        const isCet = !isJeeMain && !isJeeAdv;

        const options = [
          {
            id: "MHT-CET",
            label: "MHT-CET (CAP)",
            icon: "🚩",
            tag: "Maharashtra State CAP",
            desc: "COEP, VJTI, PICT, SPIT, PCCOE, VIT Pune",
            isProfileExam: isCet
          },
          {
            id: "JEE Main",
            label: "JEE Main (JoSAA & CSAB)",
            icon: "🏢",
            tag: "NITs & IIITs",
            desc: "NIT Trichy, Surathkal, VNIT Nagpur, IIIT Allahabad",
            isProfileExam: isJeeMain
          },
          {
            id: "JEE Advanced",
            label: "JEE Advanced (JoSAA)",
            icon: "🏛️",
            tag: "All 23 IITs",
            desc: "IIT Bombay, Delhi, Madras, Kanpur, Kharagpur, Roorkee",
            isProfileExam: isJeeAdv
          }
        ];

        // Place the student's exact registered profile exam first!
        options.sort((a, b) => (b.isProfileExam ? 1 : 0) - (a.isProfileExam ? 1 : 0));
        return options;
      }
    } else {
      // Show All National Authorities
      return [
        {
          id: "MHT-CET",
          label: "MHT-CET (CAP)",
          icon: "🚩",
          tag: "Maharashtra State",
          isProfileExam: (activeProfile.exam_type || "").toLowerCase().includes("cet")
        },
        {
          id: "JEE Main",
          label: "JEE Main",
          icon: "🏢",
          tag: "JoSAA & CSAB (NITs)",
          isProfileExam: (activeProfile.exam_type || "").toLowerCase().includes("main")
        },
        {
          id: "JEE Advanced",
          label: "JEE Advanced",
          icon: "🏛️",
          tag: "JoSAA (IITs)",
          isProfileExam: (activeProfile.exam_type || "").toLowerCase().includes("adv")
        },
        {
          id: "NEET",
          label: "NEET UG",
          icon: "🩺",
          tag: "MCC Medical (MBBS)",
          isProfileExam: isMedicalProfile
        }
      ];
    }
  }, [showAllExams, isMedicalProfile, activeProfile.exam_type]);

  // Run simulation whenever choices, score, category, round or exam change
  const runSimulation = async () => {
    setIsLoading(true);
    try {
      const apiExam = currentConfig.examId || selectedExam;
      const res = await fetch("/api/cap-table/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choices: tableChoices.map(c => ({
            college_code: c.college_code,
            branch: c.selected_branch
          })),
          category: selectedCategory,
          cap_round: selectedRound,
          student_marks: studentScore,
          exam_type: apiExam
        })
      });
      const data = await res.json();
      if (data && data.success && data.rows && data.rows.length > 0) {
        setSimulatedData(data);
      } else {
        setSimulatedData(computeLocalTable(tableChoices, selectedCategory, selectedRound, studentScore, currentConfig, collegesCatalog));
      }
    } catch (err) {
      setSimulatedData(computeLocalTable(tableChoices, selectedCategory, selectedRound, studentScore, currentConfig, collegesCatalog));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [tableChoices, studentScore, selectedCategory, selectedRound, selectedExam]);

  // Handle adding college from search
  const handleAddCollege = (college) => {
    const branches = college.available_branches || (college.branches ? college.branches.map(b => b.branch) : null) || [
      "Computer Engineering", "Information Technology", "Artificial Intelligence & Data Science", "Electronics & Telecommunication", "Mechanical Engineering", "Civil Engineering"
    ];
    const target = activeTargetBranch || "Computer Engineering";
    const matchedBranch = branches.find(b => b.toLowerCase() === target.toLowerCase())
      || branches.find(b => b.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(b.toLowerCase()))
      || branches[0]
      || "Computer Engineering";

    setCollegesCatalog(prev => {
      if (prev.some(c => String(c.college_code) === String(college.college_code))) return prev;
      return [college, ...prev];
    });
    setTableChoices(prev => [
      ...prev,
      {
        college_code: college.college_code,
        college_name: college.college_name,
        selected_branch: matchedBranch,
        available_branches: branches
      }
    ]);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  // Handle adding custom college
  const handleAddCustomCollege = (customName) => {
    if (!customName || !customName.trim()) return;
    const trimmed = customName.trim();
    const customCode = `DTE_${Math.floor(1000 + Math.random() * 9000)}`;
    const stdBranches = [
      "Computer Engineering",
      "Information Technology",
      "Artificial Intelligence & Data Science",
      "Electronics & Telecommunication",
      "Mechanical Engineering",
      "Electrical Engineering",
      "Civil Engineering"
    ];
    const newCollege = {
      college_code: customCode,
      college_name: trimmed,
      short_name: trimmed.split(",")[0].trim(),
      city: "Maharashtra",
      type: "Participating Institute",
      nirf_rank: "Option Form Entry",
      annual_fees: 110000,
      available_branches: stdBranches,
      branches: stdBranches.map(b => ({
        branch: b,
        domain: "Engineering & Technology",
        cutoff_2024: 85.0,
        cutoff_2025: 85.4,
        cutoff_2026: 85.8
      }))
    };
    handleAddCollege(newCollege);
  };

  // Handle removing row
  const handleRemoveRow = (index) => {
    setTableChoices(prev => prev.filter((_, i) => i !== index));
  };

  // Handle moving row up
  const handleMoveUp = (index) => {
    if (index === 0) return;
    setTableChoices(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return updated;
    });
  };

  // Handle moving row down
  const handleMoveDown = (index) => {
    if (index === tableChoices.length - 1) return;
    setTableChoices(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return updated;
    });
  };

  // Drag and drop state & handlers for reordering preferences
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = draggedIdx !== null ? draggedIdx : parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    setTableChoices(prev => {
      const updated = [...prev];
      const [movedItem] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // Handle changing branch for specific row
  const handleChangeRowBranch = (index, newBranch) => {
    // When user changes branch in a row, automatically sync rebalancer to manage for this branch!
    setSelectedRebalanceBranch(newBranch);
    setTableChoices(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected_branch: newBranch };
      return updated;
    });
  };

  const handleClearTable = () => {
    setTableChoices([]);
  };

  // Filtered colleges for search
  const filteredSearchColleges = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return collegesCatalog.filter(c => {
      const name = String(c.college_name || "").toLowerCase();
      const code = String(c.college_code || "").toLowerCase();
      const short = String(c.short_name || "").toLowerCase();
      const city = String(c.city || "").toLowerCase();
      return name.includes(q) || code.includes(q) || short.includes(q) || city.includes(q);
    });
  }, [searchQuery, collegesCatalog]);

  // Copy Option Form to Clipboard
  const handleCopyOptionForm = () => {
    if (!activeSimulatedData?.rows) return;
    const textLines = [
      `=== ${currentConfig.title.toUpperCase()} (Simulated for ${activeProfile.name}) ===`,
      `Counseling Authority: ${currentConfig.authorityBadge} | Process: ${selectedExam}`,
      `Score: ${studentScore}${currentConfig.scoreUnit} | Category: ${selectedCategory} | Round: ${selectedRound}`,
      `-----------------------------------------------------------------------------------------`,
      `Pref | College Name | Branch | Cutoff '26 | Prob '27 | Admission Probability`,
      `-----------------------------------------------------------------------------------------`,
      ...activeSimulatedData.rows.map(r =>
        `#${r.preference_no} | ${r.short_name} (${r.college_code}) | ${r.selected_branch} | ` +
        (r.is_branch_offered
          ? `${r.cutoff_2026}%ile | ${r.cutoff_2027_predicted}%ile | ${r.admission_probability}% (${r.tier})`
          : `NOT OFFERED | N/A | Branch Not Provided`)
      ),
      `-----------------------------------------------------------------------------------------`,
      `Summary: ${activeSimulatedData.counts?.safe} Safe | ${activeSimulatedData.counts?.target} Target | ${activeSimulatedData.counts?.dream} Dream`,
      `Advice: ${activeSimulatedData.strategy_feedback}`
    ].join("\n");

    navigator.clipboard.writeText(textLines).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      {/* Top Navbar */}
      <nav
        className="navbar navbar-dark px-3 px-md-4 py-2.5 shadow-sm sticky-top"
        style={{
          background: "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)",
          zIndex: 1060,
          boxShadow: "0 2px 12px rgba(13, 20, 87, 0.25)"
        }}
      >
        <div className="container-fluid d-flex align-items-center justify-content-between p-0">
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-sm fw-bold rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 shadow-sm"
              onClick={() => navigate("/dashboard")}
              style={{
                background: "#FFFFFF",
                border: "1px solid #FFFFFF",
                color: "#1A237E",
                fontSize: 12
              }}
            >
              <FaArrowLeft size={11} color="#1A237E" /> Dashboard
            </button>
            <div
              className="navbar-brand d-flex align-items-center gap-2 m-0 cursor-pointer"
              onClick={() => navigate("/")}
              style={{ cursor: "pointer" }}
            >
              <FaGraduationCap size={24} color="#FFB300" />
              <span className="fw-bold fs-6 text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {APP_NAME} <span className="badge bg-warning text-dark ms-1" style={{ fontSize: 10 }}>ADMISSIONS 2026–2027</span>
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-sm"
              onClick={() => navigate("/chat")}
              style={{
                background: "#FFFFFF",
                border: "1px solid #FFFFFF",
                color: "#1A237E",
                fontSize: 12
              }}
            >
              💬 AI Counselor
            </button>
            <button
              className="btn btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-sm"
              onClick={() => navigate("/scholarships")}
              style={{
                background: "#FFFFFF",
                border: "1px solid #FFFFFF",
                color: "#1A237E",
                fontSize: 12
              }}
            >
              💰 Scholarships
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container-fluid px-3 px-md-5 py-4" style={{ maxWidth: 1440 }}>
        
        {/* 1. ACTIVE STUDENT PROFILE BAR WITH INSTANT EXAM SWITCHER */}
        <div className="bg-white p-3 p-md-3.5 rounded-4 shadow-sm border mb-3">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white"
                style={{
                  width: 42,
                  height: 42,
                  background: isMedicalProfile
                    ? "linear-gradient(135deg, #059669 0%, #10B981 100%)"
                    : "linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)"
                }}
              >
                {isMedicalProfile ? <FaStethoscope size={18} /> : <FaUserGraduate size={18} />}
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="fw-bold text-dark fs-6">{activeProfile.name}</span>
                  <span className={`badge ${isMedicalProfile ? "bg-success" : "bg-primary"} text-white`} style={{ fontSize: 10 }}>
                    {activeProfile.stream} Stream
                  </span>
                  <span className="badge bg-light text-secondary border fw-semibold" style={{ fontSize: 10 }}>
                    Profile Exam: <strong className="text-dark">{activeProfile.exam_type}</strong>
                  </span>
                  <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: 10 }}>
                    {studentScore} {currentConfig.scoreUnit}
                  </span>
                  <span className="badge bg-light text-primary border" style={{ fontSize: 10 }}>
                    Category: {selectedCategory}
                  </span>
                </div>
                <div className="small text-muted mt-0.5" style={{ fontSize: 11.5 }}>
                  Counseling options below are <strong>dynamically tailored</strong> for your {activeProfile.stream} ({activeProfile.exam_type}) profile.
                </div>
              </div>
            </div>

            {/* Quick Profile Exam Switcher Dropdown */}
            <div className="d-flex align-items-center gap-2 ms-auto">
              <span className="small text-muted fw-bold d-none d-md-inline" style={{ fontSize: 11 }}>
                Switch Profile Exam:
              </span>
              <select
                className="form-select form-select-sm fw-bold border text-primary shadow-none"
                style={{ width: "auto", fontSize: 12, borderRadius: 20 }}
                value={activeProfile.exam_type}
                onChange={(e) => handleProfileExamChange(e.target.value)}
              >
                <optgroup label="Engineering Stream">
                  <option value="MHT-CET">🚩 MHT-CET (Maharashtra Engineering)</option>
                  <option value="JEE Main">🏢 JEE Main (JoSAA & CSAB NITs)</option>
                  <option value="JEE Advanced">🏛️ JEE Advanced (All 23 IITs)</option>
                </optgroup>
                <optgroup label="Medical Stream">
                  <option value="NEET">🩺 NEET UG (MBBS / BDS / Medical)</option>
                </optgroup>
              </select>
              <button
                className="btn btn-sm rounded-pill px-2.5 py-1 fw-semibold shadow-sm"
                style={{ fontSize: 11, background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#334155" }}
                onClick={() => navigate("/profile")}
                title="Edit Academic Profile"
              >
                ✏️ Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* 2. DYNAMIC COUNSELING AUTHORITY SELECTOR (DEPENDS UPON SELECTED PROFILE) */}
        <div className="bg-white p-3 rounded-4 shadow-sm border mb-3">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="fw-bold small text-secondary text-uppercase" style={{ letterSpacing: "0.5px", fontSize: 11 }}>
                Counseling Process ({isMedicalProfile && !showAllExams ? "Medical" : !showAllExams ? "Engineering" : "All Streams"}):
              </span>
              <div className="btn-group p-1 bg-light rounded-pill border flex-wrap">
                {counselingOptions.map(ex => {
                  const isSelected = selectedExam === ex.id;
                  return (
                    <button
                      key={ex.id}
                      onClick={() => handleExamSwitch(ex.id)}
                      className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold transition-all ${
                        isSelected
                          ? "btn-primary text-white shadow-sm"
                          : "btn-light text-dark border-0"
                      }`}
                      style={{ fontSize: 12.5 }}
                    >
                      <span className="me-1.5">{ex.icon}</span>
                      <span>{ex.label}</span>
                      {ex.isProfileExam && (
                        <span className="badge ms-1.5 bg-warning text-dark fw-bold" style={{ fontSize: 9 }}>
                          Your Profile
                        </span>
                      )}
                      <span
                        className="badge ms-1.5"
                        style={{
                          fontSize: 9.5,
                          background: isSelected ? "rgba(255,255,255,0.25)" : "#E2E8F0",
                          color: isSelected ? "#FFFFFF" : "#475569"
                        }}
                      >
                        {ex.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* Document & Rules Verifier Button */}
              <button
                className="btn btn-sm text-white rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 fw-bold shadow-sm"
                style={{
                  fontSize: 11.5,
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  border: "none",
                  boxShadow: "0 2px 6px rgba(16,185,129,0.3)"
                }}
                onClick={() => setShowDocModal(true)}
                title="Verify required documents, CVC validity deadlines, and Proforma H for this authority"
              >
                <FaShieldAlt size={12} />
                <span>📄 Verify Required Documents & Proformas</span>
              </button>

              {/* Stream Filter Toggle */}
              <button
                className="btn btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1.5 fw-semibold shadow-sm"
                style={{
                  fontSize: 11.5,
                  background: showAllExams ? "linear-gradient(135deg, #2563EB, #1D4ED8)" : "#F1F5F9",
                  color: showAllExams ? "#FFFFFF" : "#334155",
                  border: showAllExams ? "none" : "1px solid #CBD5E1"
                }}
                onClick={() => setShowAllExams(prev => !prev)}
              >
                <FaExchangeAlt size={10} />
                <span>{showAllExams ? `Filtered to My ${activeProfile.stream} Profile` : "Show All National Options"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Header Hero Banner */}
        <div
          className="p-4 p-md-4 rounded-4 mb-4 text-white shadow-sm position-relative overflow-hidden"
          style={{ background: isMedicalProfile
            ? "linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)"
            : "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)"
          }}
        >
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-2 border border-warning" style={{ background: "rgba(255,179,0,0.15)" }}>
                <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: 10 }}>{currentConfig.authorityBadge.toUpperCase()}</span>
                <span className="small text-warning fw-semibold">{currentConfig.processSubtitle}</span>
              </div>
              <h2 className="fw-bold mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {isMedicalProfile ? "🩺" : selectedExam === "JEE Advanced" ? "🏛️" : selectedExam === "JEE Main" ? "🏢" : "🏛️"} {currentConfig.title}
              </h2>
              <p className="mb-0 text-white-50 small" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                Tailored for <strong>{activeProfile.name}'s {activeProfile.stream} Profile</strong>. Simulate your official preference form under <strong>{currentConfig.authorityBadge}</strong>, track cutoffs across <strong>2024 to 2026</strong>, calculate extrapolated <strong>2027 benchmarks</strong>, and compute allotment probability for your exact score and category.
              </p>
            </div>

            {/* Student Verified Profile Badge (Directly from Profile, No manual entry needed) */}
            <div className="col-lg-4 mt-3 mt-lg-0 text-lg-end">
              <div className="d-inline-block bg-white text-dark p-3 rounded-4 shadow-sm text-start" style={{ minWidth: 260 }}>
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <span className="small text-muted fw-bold text-uppercase" style={{ fontSize: 10, letterSpacing: "0.5px" }}>
                    Verified Profile Score
                  </span>
                  <span className="badge bg-success-subtle text-success border border-success-subtle fw-semibold" style={{ fontSize: 9.5 }}>
                    ✓ Academic Profile
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between my-1">
                  <span className="fw-bold fs-4 text-primary">{studentScore.toFixed(2)} {currentConfig.scoreUnit}</span>
                  <span className="badge bg-primary-subtle text-primary border">{selectedExam}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between pt-2 border-top mt-2">
                  <span className="text-muted small" style={{ fontSize: 11 }}>
                    Category: <strong className="text-dark">{selectedCategory}</strong>
                  </span>
                  <button
                    className="btn btn-xs btn-link p-0 text-decoration-none fw-semibold d-flex align-items-center gap-1"
                    style={{ fontSize: 11 }}
                    onClick={() => navigate("/profile")}
                    title="Edit your marks or category in your official profile"
                  >
                    ✏️ Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Global Controls Filter Bar */}
        <div className="bg-white p-3 p-md-4 rounded-4 shadow-sm border mb-4">
          <div className="row g-3 align-items-center">
            
            {/* 1. Category / Quota Selector */}
            <div className="col-md-3">
              <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1 mb-1">
                <FaFilter size={11} color="#4F46E5" /> Reservation Quota / Category:
              </label>
              <select
                className="form-select form-select-sm fw-semibold text-primary shadow-none border"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {currentConfig.categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Admission Round Selector */}
            <div className="col-md-3">
              <label className="form-label small fw-bold text-dark d-flex align-items-center gap-1 mb-1">
                <FaLayerGroup size={11} color="#4F46E5" /> Counseling Round:
              </label>
              <select
                className="form-select form-select-sm fw-semibold text-primary shadow-none border"
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
              >
                {currentConfig.rounds.map(rnd => (
                  <option key={rnd} value={rnd}>
                    {rnd}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Search & Add College */}
            <div className="col-md-6 position-relative" ref={searchContainerRef}>
              <label className="form-label small fw-bold text-dark d-flex align-items-center justify-content-between mb-1">
                <span className="d-flex align-items-center gap-1">
                  <FaSearch size={11} color="#4F46E5" /> Search Participating Institutions ({currentConfig.authorityBadge}):
                </span>
                <span className="text-muted" style={{ fontSize: 11 }}>{collegesCatalog.length} Colleges Available</span>
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <FaSearch color="#94A3B8" size={12} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 shadow-none"
                  placeholder={`Search ${isMedicalProfile ? 'AIIMS, GMC Mumbai, KEM, BJMC, AFMC' : selectedExam === 'JEE Advanced' ? 'IIT Bombay, Delhi, Madras' : selectedExam === 'JEE Main' ? 'NIT Trichy, Surathkal, VNIT' : 'COEP, VJTI, PICT, 6006'}...`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                />
                {searchQuery && (
                  <button
                    className="btn btn-sm fw-semibold shadow-none"
                    type="button"
                    style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#475569" }}
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchOpen(false);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {isSearchOpen && (
                <div
                  className="position-absolute start-0 end-0 bg-white shadow-lg border rounded-3 p-1 mt-1 z-3 overflow-auto"
                  style={{ maxHeight: 320, zIndex: 1050 }}
                >
                  {filteredSearchColleges.length > 0 ? (
                    <>
                      {filteredSearchColleges.map((c) => {
                        const isAlreadyAdded = tableChoices.some(tc => String(tc.college_code) === String(c.college_code));
                        return (
                          <div
                            key={c.college_code}
                            className="p-2 border-bottom d-flex align-items-center justify-content-between hover-bg rounded-2"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleAddCollege(c)}
                          >
                            <div className="pe-2 text-start">
                              <div className="fw-bold small text-dark d-flex align-items-center gap-1.5 flex-wrap">
                                <span>{c.college_name}</span>
                                <span className="badge bg-light text-secondary border" style={{ fontSize: 9 }}>
                                  {currentConfig.codeLabel}: {c.college_code}
                                </span>
                              </div>
                              <div className="text-muted" style={{ fontSize: 11 }}>
                                📍 {c.city} • {c.available_branches?.length || c.branches?.length || 0} Offered Programs • {c.nirf_rank}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-xs rounded-pill px-2.5 py-1 fw-semibold shadow-sm flex-shrink-0"
                              style={{
                                fontSize: 11,
                                background: isAlreadyAdded ? "#EFF6FF" : "linear-gradient(135deg, #2563EB, #1D4ED8)",
                                color: isAlreadyAdded ? "#1D4ED8" : "#FFFFFF",
                                border: isAlreadyAdded ? "1px solid #BFDBFE" : "none"
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddCollege(c);
                              }}
                            >
                              <FaPlus size={9} className="me-1" />
                              {isAlreadyAdded ? "Add Another Branch" : "Add to Table"}
                            </button>
                          </div>
                        );
                      })}

                      {searchQuery.trim() && (
                        <div
                          className="p-2.5 text-center bg-light rounded-2 mt-1 border-top d-flex align-items-center justify-content-between"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleAddCustomCollege(searchQuery)}
                        >
                          <div className="small text-start">
                            <span className="fw-semibold text-primary">➕ Can't find your specific college?</span>
                            <div className="text-muted" style={{ fontSize: 10.5 }}>
                              Click to add "{searchQuery}" as a custom institution with all branches.
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-xs btn-outline-primary rounded-pill px-2.5 py-1 fw-semibold flex-shrink-0"
                            style={{ fontSize: 11 }}
                          >
                            Add Custom
                          </button>
                        </div>
                      )}
                    </>
                  ) : searchQuery.trim() ? (
                    <div className="p-3 text-center">
                      <div className="small text-dark fw-semibold mb-1">
                        No pre-configured institute found matching "<em>{searchQuery}</em>"
                      </div>
                      <p className="text-muted small mb-2" style={{ fontSize: 11 }}>
                        You can still add this college to your simulation and option form! All branches will be available.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm rounded-pill px-3 py-1.5 shadow-sm d-inline-flex align-items-center gap-1.5"
                        onClick={() => handleAddCustomCollege(searchQuery)}
                      >
                        <FaPlus size={11} />
                        <span>Add "{searchQuery}" to My Preference List</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Quick Presets Bar for this Exam */}
          <div className="d-flex align-items-center gap-2 flex-wrap mt-3 pt-3 border-top">
            <span className="small text-muted fw-bold d-flex align-items-center gap-1" style={{ fontSize: 11 }}>
              <FaLightbulb color="#F59E0B" /> {selectedExam} Option Form Templates:
            </span>
            {currentConfig.presets.map(preset => (
              <button
                key={preset.id}
                className="btn btn-sm rounded-pill py-0.5 px-3 fw-semibold shadow-sm"
                style={{ fontSize: 11, background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#334155" }}
                onClick={() => setTableChoices(preset.choices)}
              >
                {preset.name}
              </button>
            ))}
            <button
              className="btn btn-sm rounded-pill py-0.5 px-3 ms-auto fw-semibold shadow-sm"
              style={{ fontSize: 11, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}
              onClick={handleClearTable}
            >
              <FaTrash size={9} className="me-1" /> Clear Table
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4.5. AI OPTION FORM "AUTO-REBALANCER" & RISK MATRIX CARD                  */}
        {/* Solves the 80% incorrect option form filing & Zero Allotment Crisis       */}
        {/* ========================================================================= */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
          
          {/* Card Top Header */}
          <div className="p-3 px-4 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-3" style={{ background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)" }}>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge px-3 py-1 rounded-pill fw-bold text-uppercase d-flex align-items-center gap-1.5 shadow-sm" style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#FFFFFF", fontSize: 10, letterSpacing: "0.5px" }}>
                  <FaMagic size={10} /> AI Autonomous Rebalancer
                </span>
                <span className="badge bg-light text-secondary border" style={{ fontSize: 10 }}>
                  <MdAutoAwesome className="text-warning me-1" /> Gemini Multi-Model Intelligence
                </span>
              </div>
              <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <span>AI Option Form "Auto-Rebalancer" & Risk Matrix</span>
              </h5>
              <div className="text-muted small mt-1" style={{ fontSize: 12 }}>
                Over <strong>80% of candidates</strong> fill their option form wrong — resulting in <strong>Zero Allotment</strong> or wasted percentiles.
                This engine balances your list to the <strong>Golden Ratio (20% Dream : 50% Target : 30% Safe)</strong> and protects your seat.
              </div>
            </div>

            {/* Live Risk Status Badge & Collapsible Toggle */}
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex flex-column align-items-end">
                <span className="small text-muted fw-bold mb-1" style={{ fontSize: 10, letterSpacing: "0.5px" }}>CURRENT PORTFOLIO HEALTH</span>
                <span className={`badge px-3 py-1.5 rounded-pill fw-bold shadow-sm ${portfolioStats.badgeClass}`} style={{ fontSize: 12 }}>
                  {portfolioStats.statusBadge}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm border rounded-pill px-3 py-1.5 ms-2 d-flex align-items-center gap-1.5 shadow-sm fw-semibold"
                style={{ background: "#FFFFFF", color: "#334155", fontSize: 11 }}
                onClick={() => setIsAiToolsOpen(!isAiToolsOpen)}
                title={isAiToolsOpen ? "Minimize AI Optimizer" : "Open AI Optimizer & Counselor"}
              >
                <MdAutoAwesome className="text-warning" size={13} />
                <span>{isAiToolsOpen ? "Minimize AI" : "Open AI Panel"}</span>
                {isAiToolsOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
              </button>
            </div>
          </div>

          {!isAiToolsOpen ? (
            <div className="p-3 px-4 bg-light border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="small text-dark fw-bold d-flex align-items-center gap-1.5" style={{ fontSize: 12 }}>
                  <FaBolt color="#F59E0B" /> Quick Rebalance:
                </span>
                <div className="d-flex align-items-center gap-1.5 bg-white border shadow-sm px-2.5 py-1 rounded-pill" title="Target discipline managed by AI Rebalancer">
                  <span className="text-secondary fw-semibold" style={{ fontSize: 11 }}>🎯 Discipline:</span>
                  <select
                    className="form-select form-select-sm border-0 bg-transparent fw-bold text-primary p-0 shadow-none"
                    style={{ fontSize: 11.5, width: "auto", cursor: "pointer" }}
                    value={activeTargetBranch}
                    onChange={(e) => setSelectedRebalanceBranch(e.target.value)}
                  >
                    {availableExamBranches.map(br => (
                      <option key={br} value={br}>{br}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold shadow-none"
                  style={{ fontSize: 11.5 }}
                  onClick={() => { setIsAiToolsOpen(true); handleRunRebalance("golden_ratio"); }}
                >
                  🪄 Golden Ratio (20:50:30)
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 fw-semibold shadow-none"
                  style={{ fontSize: 11.5 }}
                  onClick={() => { setIsAiToolsOpen(true); handleRunRebalance("tech_cs_only"); }}
                >
                  💻 CS & AI Only
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 fw-semibold shadow-none"
                  style={{ fontSize: 11.5 }}
                  onClick={() => { setIsAiToolsOpen(true); handleRunRebalance("pune_mumbai_hub"); }}
                >
                  📍 Pune & Mumbai
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 fw-bold shadow-none"
                  style={{ fontSize: 11.5 }}
                  onClick={() => { setIsAiToolsOpen(true); handleRunRebalance("guaranteed_lock"); }}
                >
                  🛡️ 100% Seat Lock
                </button>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-primary rounded-pill px-3.5 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-sm"
                style={{ fontSize: 12 }}
                onClick={() => setIsAiToolsOpen(true)}
              >
                <FaRobot size={12} /> Open Full Optimizer Panel
              </button>
            </div>
          ) : (
            <div className="p-4">

            {/* Undo / Applied Notification Bar */}
            {appliedAlert && (
              <div className="alert alert-success d-flex align-items-center justify-content-between rounded-3 py-2 px-3 mb-3 shadow-sm border border-success-subtle animate__animated animate__fadeIn">
                <div className="d-flex align-items-center gap-2 small fw-semibold text-success">
                  <FaCheckCircle size={15} />
                  <span>{appliedAlert}</span>
                </div>
                {previousChoicesBackup && (
                  <button
                    className="btn btn-sm rounded-pill py-0.5 px-3 fw-bold d-flex align-items-center gap-1 shadow-sm"
                    style={{ fontSize: 11, background: "#FFFFFF", color: "#15803D", border: "1px solid #86EFAC" }}
                    onClick={handleUndoRebalance}
                  >
                    <FaUndo size={10} /> Revert / Undo
                  </button>
                )}
              </div>
            )}

            {/* 1. Real-Time Risk Matrix Gauges & Continuous Progress Bar */}
            <div className="bg-light p-3 rounded-4 border mb-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <span className="small text-dark fw-bold d-flex align-items-center gap-1.5" style={{ fontSize: 12 }}>
                  <FaChartLine color="#4F46E5" /> Live Choice Portfolio Distribution ({portfolioStats.total} Choices Active)
                </span>
                <span className="text-muted small" style={{ fontSize: 11 }}>
                  Calibrated for Candidate Score: <strong className="text-primary">{studentScore.toFixed(2)} {currentConfig.scoreUnit}</strong> ({selectedCategory})
                </span>
              </div>

              {/* 3 Metric Cards */}
              <div className="row g-2 mb-3">
                {/* Dream */}
                <div className="col-md-4">
                  <div className="p-2.5 px-3 bg-white rounded-3 border shadow-none d-flex align-items-center justify-content-between">
                    <div>
                      <div className="d-flex align-items-center gap-1 text-warning fw-bold small" style={{ fontSize: 11 }}>
                        <FaFire size={11} /> 🚀 DREAM REACHES
                      </div>
                      <div className="text-muted" style={{ fontSize: 10 }}>Cutoff &gt; Score • High Aspiration</div>
                    </div>
                    <div className="text-end">
                      <span className="fw-bold fs-5 text-warning">{portfolioStats.dream}</span>
                      <span className="text-muted small ms-1" style={{ fontSize: 11 }}>({portfolioStats.dreamPct}%)</span>
                    </div>
                  </div>
                </div>

                {/* Target */}
                <div className="col-md-4">
                  <div className="p-2.5 px-3 bg-white rounded-3 border shadow-none d-flex align-items-center justify-content-between">
                    <div>
                      <div className="d-flex align-items-center gap-1 text-primary fw-bold small" style={{ fontSize: 11 }}>
                        <FaBullseye size={11} /> 🎯 TARGET MATCHES
                      </div>
                      <div className="text-muted" style={{ fontSize: 10 }}>Cutoff ≈ Score • 65–85% Probability</div>
                    </div>
                    <div className="text-end">
                      <span className="fw-bold fs-5 text-primary">{portfolioStats.target}</span>
                      <span className="text-muted small ms-1" style={{ fontSize: 11 }}>({portfolioStats.targetPct}%)</span>
                    </div>
                  </div>
                </div>

                {/* Safe */}
                <div className="col-md-4">
                  <div className="p-2.5 px-3 bg-white rounded-3 border shadow-none d-flex align-items-center justify-content-between">
                    <div>
                      <div className="d-flex align-items-center gap-1 text-success fw-bold small" style={{ fontSize: 11 }}>
                        <FaShieldAlt size={11} /> 🛡️ SAFE BACKUPS
                      </div>
                      <div className="text-muted" style={{ fontSize: 10 }}>Cutoff &lt; Score • &gt;90% Confirmed</div>
                    </div>
                    <div className="text-end">
                      <span className="fw-bold fs-5 text-success">{portfolioStats.safe}</span>
                      <span className="text-muted small ms-1" style={{ fontSize: 11 }}>({portfolioStats.safePct}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Continuous Tri-Color Progress Bar */}
              <div className="progress rounded-pill overflow-hidden shadow-none mb-2" style={{ height: 14, background: "#E2E8F0" }}>
                {portfolioStats.totalValid > 0 ? (
                  <>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${portfolioStats.dreamPct}%`, background: "#F59E0B" }}
                      title={`Dream Reaches: ${portfolioStats.dreamPct}%`}
                    />
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${portfolioStats.targetPct}%`, background: "#3B82F6" }}
                      title={`Target Matches: ${portfolioStats.targetPct}%`}
                    />
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${portfolioStats.safePct}%`, background: "#10B981" }}
                      title={`Safe Backups: ${portfolioStats.safePct}%`}
                    />
                  </>
                ) : (
                  <div className="progress-bar bg-secondary" style={{ width: "100%" }}>Empty Option List</div>
                )}
              </div>

              {/* Real-Time Risk Diagnostic Alert */}
              <div className={`p-2.5 px-3 rounded-3 small d-flex align-items-start gap-2 border ${
                portfolioStats.riskLevel === "CRITICAL"
                  ? "bg-danger-subtle text-danger border-danger-subtle"
                  : portfolioStats.riskLevel === "SUBOPTIMAL" || portfolioStats.riskLevel === "HIGH_VOLATILITY"
                  ? "bg-warning-subtle text-dark border-warning-subtle"
                  : portfolioStats.riskLevel === "EMPTY"
                  ? "bg-light text-secondary border"
                  : "bg-success-subtle text-success border-success-subtle"
              }`} style={{ fontSize: 12 }}>
                {portfolioStats.riskLevel === "CRITICAL" ? (
                  <FaExclamationTriangle className="flex-shrink-0 mt-0.5" size={14} />
                ) : portfolioStats.riskLevel === "BALANCED" ? (
                  <FaCheckCircle className="flex-shrink-0 mt-0.5" size={14} />
                ) : (
                  <FaInfoCircle className="flex-shrink-0 mt-0.5" size={14} />
                )}
                <div>
                  <strong>Allotment Risk Analysis:</strong> {portfolioStats.alertMsg}
                </div>
              </div>
            </div>

            {/* 2. Target Discipline Selector & Sync Bar */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <span className="badge px-3 py-1.5 rounded-pill fw-bold text-uppercase d-flex align-items-center gap-1.5 shadow-sm" style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)", color: "#FFFFFF", fontSize: 11 }}>
                  <FaRobot size={12} /> AI Strategy Engine
                </span>
                <span className="text-secondary small fw-medium" style={{ fontSize: 12 }}>
                  Calibrate your CAP Option Form for maximum allotment security & dream reaches
                </span>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                <div className="d-flex align-items-center gap-1.5 bg-white border shadow-sm px-2.5 py-1 rounded-pill" title="Target discipline strictly managed by AI Rebalancer">
                  <span className="text-secondary fw-semibold" style={{ fontSize: 11 }}>🎯 Target Discipline:</span>
                  <select
                    className="form-select form-select-sm border-0 bg-transparent fw-bold text-primary p-0 shadow-none"
                    style={{ fontSize: 11.5, width: "auto", cursor: "pointer" }}
                    value={activeTargetBranch}
                    onChange={(e) => setSelectedRebalanceBranch(e.target.value)}
                  >
                    {availableExamBranches.map(br => (
                      <option key={br} value={br}>{br}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary rounded-pill py-1 px-2.5 fw-semibold"
                  style={{ fontSize: 10.5 }}
                  onClick={() => handleApplyBranchToAllChoices(activeTargetBranch)}
                  title="Switch all choices in preference table to this branch where offered"
                >
                  Sync table to {activeTargetBranch}
                </button>
              </div>
            </div>

            {/* 3. Interactive AI Prompt Counselor (Natural Language Optimizer) */}
            <div className="card border shadow-sm rounded-4 p-3 bg-white mb-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <div>
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-1.5" style={{ fontSize: 13 }}>
                    <FaRobot color="#4F46E5" size={15} /> Chat with AI Strategy Counselor:
                  </h6>
                  <span className="text-muted small" style={{ fontSize: 11 }}>
                    Type your request in plain English (e.g. cities, preferred branches, cutoff criteria) or pick a quick prompt:
                  </span>
                </div>
              </div>

              {/* Quick Prompts Chips */}
              <div className="d-flex align-items-center gap-1.5 flex-wrap mb-2.5">
                <span className="text-muted small fw-semibold" style={{ fontSize: 10.5 }}>Quick Prompts:</span>
                {[
                  { label: "Mumbai IT Colleges Only", prompt: "Add only colleges near Mumbai for Information Technology" },
                  { label: "Safe Pune CS Backups", prompt: "Fix my zero allotment risk with safe Pune CS backups" },
                  { label: "Autonomous Colleges Only", prompt: "Only autonomous colleges in Pune and Mumbai" },
                  { label: "High Probability (>85%)", prompt: "Add colleges where my admission chance is >85%" },
                  { label: "Round 2 Float Betterment", prompt: "Optimize my list for Round 2 Betterment (Float)" }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-xs rounded-pill py-1 px-2.5 bg-white border border-primary-subtle text-primary fw-medium shadow-sm d-flex align-items-center gap-1"
                    style={{ fontSize: 11, transition: "all 0.15s ease" }}
                    onClick={() => {
                      setAiPromptInput(item.prompt);
                      handleRunRebalance("custom_chat", item.prompt, false);
                    }}
                    disabled={aiRebalanceLoading}
                  >
                    <span className="text-warning">✨</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Chat Input Row */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (aiPromptInput.trim()) {
                    handleRunRebalance("custom_chat", aiPromptInput.trim(), false);
                  }
                }}
              >
                <div className="input-group shadow-sm rounded-3 overflow-hidden border">
                  <span className="input-group-text bg-white border-0 text-primary ps-3">
                    <FaRobot size={15} />
                  </span>
                  <input
                    type="text"
                    className="form-control border-0 shadow-none py-2"
                    placeholder={`e.g. "Add only colleges near Mumbai for Information Technology" or "Give me safe Pune colleges for ${studentScore.toFixed(1)} percentile"...`}
                    style={{ fontSize: 13 }}
                    value={aiPromptInput}
                    onChange={(e) => setAiPromptInput(e.target.value)}
                    disabled={aiRebalanceLoading}
                  />
                  {aiPromptInput && (
                    <button
                      type="button"
                      className="btn bg-white border-0 text-muted px-2"
                      onClick={() => setAiPromptInput("")}
                      title="Clear prompt"
                    >
                      <FaTimes size={12} />
                    </button>
                  )}
                  <button
                    className="btn btn-primary px-4 fw-bold d-flex align-items-center gap-1.5"
                    type="submit"
                    disabled={aiRebalanceLoading || !aiPromptInput.trim()}
                    style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)", border: "none", fontSize: 13 }}
                  >
                    {aiRebalanceLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        <span>Analyzing Cutoffs...</span>
                      </>
                    ) : (
                      <>
                        <FaPaperPlane size={11} />
                        <span>Rebalance with AI</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* 4. 1-Click Proven Strategy Presets */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="small fw-bold text-dark d-flex align-items-center gap-1.5" style={{ fontSize: 12 }}>
                  <FaBolt color="#F59E0B" /> Or Select a 1-Click Proven Strategy Preset:
                </span>
                <span className="text-muted small" style={{ fontSize: 11 }}>
                  Calculated dynamically from official DTE past round cutoff thresholds
                </span>
              </div>

              <div className="row g-3">
                {/* Preset 1: Golden Ratio */}
                <div className="col-md-3">
                  <div className={`card h-100 border rounded-3 p-3 shadow-sm d-flex flex-column justify-content-between transition-all ${
                    activeStrategyPreset === "golden_ratio" ? "border-primary bg-primary-subtle" : "bg-white"
                  }`}>
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-1.5">
                        <span className="fw-bold text-dark d-flex align-items-center gap-1" style={{ fontSize: 13 }}>
                          🪄 Golden Ratio
                        </span>
                        <span className="badge bg-primary text-white rounded-pill px-2 py-0.5" style={{ fontSize: 9 }}>
                          20:50:30
                        </span>
                      </div>
                      <p className="text-muted small mb-3" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                        2-3 Dream reaches + 4-5 Target matches + 2-3 Safe backups. Eliminates zero allotment risk.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm rounded-pill w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5 shadow-sm"
                      disabled={aiRebalanceLoading}
                      onClick={() => handleRunRebalance("golden_ratio")}
                    >
                      <FaBolt size={11} /> Apply Golden Ratio
                    </button>
                  </div>
                </div>

                {/* Preset 2: Tech Only */}
                <div className="col-md-3">
                  <div className={`card h-100 border rounded-3 p-3 shadow-sm d-flex flex-column justify-content-between transition-all ${
                    activeStrategyPreset === "tech_cs_only" ? "border-primary bg-primary-subtle" : "bg-white"
                  }`}>
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-1.5">
                        <span className="fw-bold text-dark d-flex align-items-center gap-1" style={{ fontSize: 13 }}>
                          💻 Tech & CS Only
                        </span>
                        <span className="badge bg-info text-dark rounded-pill px-2 py-0.5" style={{ fontSize: 9 }}>
                          CS / IT / AI
                        </span>
                      </div>
                      <p className="text-muted small mb-3" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                        Filters strictly for Computer, IT & AI/DS branches across top engineering colleges.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm rounded-pill w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5 shadow-sm"
                      disabled={aiRebalanceLoading}
                      onClick={() => handleRunRebalance("tech_cs_only")}
                    >
                      <FaBolt size={11} /> Apply Tech Only
                    </button>
                  </div>
                </div>

                {/* Preset 3: Pune & Mumbai Hub */}
                <div className="col-md-3">
                  <div className={`card h-100 border rounded-3 p-3 shadow-sm d-flex flex-column justify-content-between transition-all ${
                    activeStrategyPreset === "pune_mumbai_hub" ? "border-primary bg-primary-subtle" : "bg-white"
                  }`}>
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-1.5">
                        <span className="fw-bold text-dark d-flex align-items-center gap-1" style={{ fontSize: 13 }}>
                          📍 Metro Hubs
                        </span>
                        <span className="badge bg-secondary text-white rounded-pill px-2 py-0.5" style={{ fontSize: 9 }}>
                          Pune & Mumbai
                        </span>
                      </div>
                      <p className="text-muted small mb-3" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                        Restricts choices to premier autonomous and state institutions in Pune & Mumbai tech corridors.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm rounded-pill w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5 shadow-sm"
                      disabled={aiRebalanceLoading}
                      onClick={() => handleRunRebalance("pune_mumbai_hub")}
                    >
                      <FaBolt size={11} /> Apply Metro Hubs
                    </button>
                  </div>
                </div>

                {/* Preset 4: 100% Guaranteed Lock */}
                <div className="col-md-3">
                  <div className={`card h-100 border rounded-3 p-3 shadow-sm d-flex flex-column justify-content-between transition-all ${
                    activeStrategyPreset === "guaranteed_lock" ? "border-primary bg-primary-subtle" : "bg-white"
                  }`}>
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-1.5">
                        <span className="fw-bold text-dark d-flex align-items-center gap-1" style={{ fontSize: 13 }}>
                          🛡️ 100% Seat Lock
                        </span>
                        <span className="badge bg-success text-white rounded-pill px-2 py-0.5" style={{ fontSize: 9 }}>
                          Zero Risk
                        </span>
                      </div>
                      <p className="text-muted small mb-3" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                        Maximizes high-probability (&gt;85%) safe backup colleges to ensure a guaranteed provisional seat.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm rounded-pill w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5 shadow-sm"
                      disabled={aiRebalanceLoading}
                      onClick={() => handleRunRebalance("guaranteed_lock")}
                    >
                      <FaShieldAlt size={11} /> Apply Seat Lock
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Rebalance Proposal Card (Clean Structured View) */}
            {aiRebalanceResult && (
              <div className="card border-primary-subtle shadow-sm rounded-4 overflow-hidden mb-2 animate__animated animate__fadeIn">
                {/* Proposal Header */}
                <div className="p-3 px-4 bg-primary-subtle border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary text-white rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5" style={{ fontSize: 12 }}>
                      <MdAutoAwesome size={13} /> {aiRebalanceResult.headline}
                    </span>
                    {aiRebalanceResult.gemini_powered && (
                      <span className="badge bg-white text-success border border-success-subtle rounded-pill px-2.5 py-1" style={{ fontSize: 10.5 }}>
                        ✓ Grounded in Official DTE Cutoffs
                      </span>
                    )}
                  </div>

                  {/* Before vs After Metric Pill */}
                  <div className="d-flex align-items-center gap-2 bg-white px-3 py-1 rounded-pill border shadow-sm">
                    <span className="text-muted small" style={{ fontSize: 11 }}>Portfolio Shift:</span>
                    <span className="badge bg-light text-secondary border px-2 py-0.5" style={{ fontSize: 10.5 }}>
                      Before: {aiRebalanceResult.before_portfolio.dream}D • {aiRebalanceResult.before_portfolio.target}T • {aiRebalanceResult.before_portfolio.safe}S
                    </span>
                    <FaExchangeAlt size={10} className="text-muted" />
                    <span className="badge bg-success text-white px-2 py-0.5 shadow-none" style={{ fontSize: 10.5 }}>
                      Rebalanced: {aiRebalanceResult.after_portfolio.dream}D • {aiRebalanceResult.after_portfolio.target}T • {aiRebalanceResult.after_portfolio.safe}S
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white">
                  {/* Strategic Counseling Insights */}
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="small fw-bold text-dark text-uppercase mb-2 d-flex align-items-center gap-1.5" style={{ fontSize: 11, letterSpacing: "0.5px" }}>
                      <FaInfoCircle color="#4F46E5" /> AI Admission Officer Strategic Assessment:
                    </div>
                    <div className="text-dark small" style={{ fontSize: 13, lineHeight: 1.65 }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {aiRebalanceResult.counselor_advice}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Proposed Preference Order (Clean Structured Preview Table) */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="small text-dark fw-bold d-flex align-items-center gap-1.5" style={{ fontSize: 12.5 }}>
                        📋 Proposed Preference Sequence ({aiRebalanceResult.recommended_choices?.length || 0} Institutions):
                      </span>
                      <span className="text-muted small" style={{ fontSize: 11 }}>
                        Strictly arranged descending from Dream Reaches down to Confirmed Safety Backups
                      </span>
                    </div>

                    <div className="table-responsive rounded-3 border overflow-hidden shadow-sm">
                      <table className="table table-sm table-hover align-middle mb-0">
                        <thead className="table-light text-secondary" style={{ fontSize: 11 }}>
                          <tr>
                            <th style={{ width: 60 }} className="text-center py-2">Pref #</th>
                            <th className="py-2">Institute Name & City</th>
                            <th className="py-2">Selected Program / Branch</th>
                            <th className="text-center py-2" style={{ width: 110 }}>Cutoff Score</th>
                            <th className="text-center py-2" style={{ width: 140 }}>Allotment Probability</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aiRebalanceResult.recommended_choices?.map((item, idx) => {
                            const isDream = item.tier === "Dream";
                            const isTarget = item.tier === "Target";
                            const tierBadgeClass = isDream
                              ? "bg-warning-subtle text-dark border border-warning"
                              : isTarget
                              ? "bg-primary-subtle text-primary border border-primary-subtle"
                              : "bg-success-subtle text-success border border-success-subtle";

                            return (
                              <tr key={idx} style={{ fontSize: 12 }}>
                                <td className="text-center fw-bold">
                                  <span className="badge bg-light text-dark border rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 24, height: 24, fontSize: 11 }}>
                                    {idx + 1}
                                  </span>
                                </td>
                                <td>
                                  <span className="fw-bold text-dark">{item.short_name || item.college_name}</span>
                                  <span className="text-muted small ms-1.5" style={{ fontSize: 11 }}>📍 {item.city}</span>
                                </td>
                                <td>
                                  <span className="badge bg-light text-primary border border-primary-subtle fw-semibold px-2 py-1" style={{ fontSize: 11 }}>
                                    {item.selected_branch}
                                  </span>
                                </td>
                                <td className="text-center font-monospace small">
                                  <strong>{item.cutoff_2026}</strong>%ile
                                </td>
                                <td className="text-center">
                                  <span className={`badge px-2.5 py-1 rounded-pill fw-bold ${tierBadgeClass}`} style={{ fontSize: 10.5 }}>
                                    {item.tier} • {item.admission_probability}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action Footer: Completely Clear, Unambiguous Action Buttons */}
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-3 border-top mt-3 bg-light p-3 rounded-3 border">
                    <div className="d-flex align-items-center gap-2">
                      <div className="badge bg-success-subtle text-success p-1.5 rounded-circle">
                        <FaCheckCircle size={14} />
                      </div>
                      <div>
                        <div className="fw-bold text-dark small" style={{ fontSize: 12 }}>
                          {appliedAlert ? "Active in Preference Table" : "Ready to Apply"}
                        </div>
                        <div className="text-muted small" style={{ fontSize: 11 }}>
                          {appliedAlert
                            ? `These ${aiRebalanceResult.recommended_choices?.length || 0} choices are loaded into your live option form table below.`
                            : `Click below to update your preference form with these ${aiRebalanceResult.recommended_choices?.length || 0} choices.`}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {previousChoicesBackup && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5"
                          style={{ fontSize: 12 }}
                          onClick={handleUndoRebalance}
                        >
                          <FaUndo size={11} /> Undo & Restore Previous
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5"
                        style={{ fontSize: 12 }}
                        onClick={() => {
                          const el = document.getElementById("cap-simulation-table");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        <FaTable size={12} /> View in Table Below
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-success rounded-pill px-4 py-2 fw-bold d-flex align-items-center gap-1.5 shadow"
                        style={{ fontSize: 12.5 }}
                        onClick={() => handleApplyRebalancedList(aiRebalanceResult.recommended_choices)}
                      >
                        <FaCheckDouble size={13} />
                        <span>Apply to Preference Form</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}
      </div>

        {/* 5. Live Simulation Table Card with Multi-View Modes */}
        <div id="cap-simulation-table" className="bg-white rounded-4 shadow-sm border overflow-hidden mb-4">
          
          {/* Table Header Bar */}
          <div className="p-3 px-4 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                <span>📋 Official Preference List & Allotment Simulator</span>
                <span className="badge bg-primary rounded-pill">{tableChoices.length} Choices</span>
              </h5>
              <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                <span className="text-secondary small" style={{ fontSize: 12 }}>
                  Cutoff thresholds for <strong>{selectedCategory}</strong> under <strong>{selectedRound}</strong> ({currentConfig.authorityBadge}).
                </span>
                <span className="badge px-2 py-0.5 rounded-pill d-inline-flex align-items-center gap-1 shadow-sm" style={{ fontSize: 11, background: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE" }}>
                  <MdDragIndicator size={13} color="#4F46E5" /> Drag rows or grip handle to reorder preference
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1 shadow-sm"
                style={{
                  fontSize: 12,
                  background: copySuccess ? "#10B981" : "#EFF6FF",
                  color: copySuccess ? "#FFFFFF" : "#1D4ED8",
                  border: copySuccess ? "none" : "1px solid #BFDBFE"
                }}
                onClick={handleCopyOptionForm}
                title="Copy full preference list with cutoffs and admission chance"
              >
                {copySuccess ? <FaCheck size={11} /> : <FaCopy size={11} />}
                <span>{copySuccess ? "Copied Form!" : "Copy Full Form"}</span>
              </button>
              <button
                className="btn btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1 shadow-sm"
                style={{ fontSize: 12, background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#334155" }}
                onClick={() => window.print()}
                title="Print option form document"
              >
                <FaPrint size={11} />
                <span>Print Form</span>
              </button>
            </div>
          </div>

          {/* VIEW SWITCHER & SEARCH TOOLBAR */}
          <div className="p-2.5 px-4 bg-white border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
            {/* View Mode Pills */}
            <div className="d-flex align-items-center gap-1.5 flex-wrap">
              <span className="small text-muted fw-bold me-1 text-uppercase" style={{ fontSize: 10.5, letterSpacing: "0.5px" }}>
                View Options:
              </span>
              <div className="btn-group p-1 bg-light rounded-pill border" role="group">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1.5 transition-all ${
                    viewMode === "table"
                      ? "btn-primary text-white shadow-sm"
                      : "btn-light text-secondary border-0"
                  }`}
                  style={{ fontSize: 12 }}
                  onClick={() => setViewMode("table")}
                  title="Full Matrix Table with historical cutoff trajectories and probability meters"
                >
                  <FaTable size={12} />
                  <span>Matrix Table</span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1.5 transition-all ${
                    viewMode === "tiers"
                      ? "btn-primary text-white shadow-sm"
                      : "btn-light text-secondary border-0"
                  }`}
                  style={{ fontSize: 12 }}
                  onClick={() => setViewMode("tiers")}
                  title="Categorized Kanbans: Dream Reaches, Target Matches, Safe Backups"
                >
                  <FaThLarge size={12} />
                  <span>Tier Cards</span>
                  <span className="badge bg-warning text-dark ms-0.5" style={{ fontSize: 9 }}>
                    {portfolioStats.dream}D • {portfolioStats.target}T • {portfolioStats.safe}S
                  </span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1.5 transition-all ${
                    viewMode === "official"
                      ? "btn-primary text-white shadow-sm"
                      : "btn-light text-secondary border-0"
                  }`}
                  style={{ fontSize: 12 }}
                  onClick={() => setViewMode("official")}
                  title="Official Government DTE Maharashtra 9-Digit Choice Code Form"
                >
                  <FaFileAlt size={12} />
                  <span>Official DTE Codes</span>
                  <span className="badge bg-success-subtle text-success border border-success-subtle ms-0.5" style={{ fontSize: 9 }}>
                    9-Digit
                  </span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1.5 transition-all ${
                    viewMode === "compact"
                      ? "btn-primary text-white shadow-sm"
                      : "btn-light text-secondary border-0"
                  }`}
                  style={{ fontSize: 12 }}
                  onClick={() => setViewMode("compact")}
                  title="High-density single-line list for rapid preference ordering"
                >
                  <FaListUl size={12} />
                  <span>Compact List</span>
                </button>
              </div>
            </div>

            {/* In-Table Filter & View-Specific Quick Actions */}
            <div className="d-flex align-items-center gap-2 ms-auto flex-wrap">
              <div className="input-group input-group-sm" style={{ maxWidth: 240 }}>
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <FaSearch size={11} />
                </span>
                <input
                  type="text"
                  className="form-control form-control-sm border-start-0 shadow-none bg-light"
                  placeholder="Filter choices..."
                  style={{ fontSize: 12 }}
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
                {filterQuery && (
                  <button
                    className="btn btn-sm btn-light border border-start-0 text-muted"
                    onClick={() => setFilterQuery("")}
                    title="Clear filter"
                  >
                    ✕
                  </button>
                )}
              </div>

              {viewMode === "official" && (
                <button
                  className="btn btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1 shadow-sm"
                  style={{
                    fontSize: 12,
                    background: copyCodeSuccess ? "#10B981" : "#EEF2FF",
                    color: copyCodeSuccess ? "#FFFFFF" : "#4338CA",
                    border: copyCodeSuccess ? "none" : "1px solid #C7D2FE"
                  }}
                  onClick={handleCopyAllOfficialCodes}
                  title="Copy comma-separated 9-digit choice codes to clipboard for direct paste into CET Cell candidate portal"
                >
                  {copyCodeSuccess ? <FaCheck size={11} /> : <FaCopy size={11} />}
                  <span>{copyCodeSuccess ? "Copied All Codes!" : "Copy 9-Digit Codes"}</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VIEW 1: MATRIX TABLE (Historical Trajectories & Interactive Drag/Drop)     */}
          {/* ========================================================================= */}
          {viewMode === "table" && (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 text-center" style={{ minWidth: 980 }}>
                <thead className="table-dark" style={{ backgroundColor: "#1A237E", color: "#FFFFFF" }}>
                  <tr>
                    <th style={{ width: 85, backgroundColor: "#1A237E", color: "#FFFFFF", verticalAlign: "middle" }} className="py-3 small fw-bold">
                      <div className="d-flex align-items-center justify-content-center gap-1" title="Drag row or handle to change preference hierarchy">
                        <MdDragIndicator size={14} color="#FFB300" />
                        <span>Pref #</span>
                      </div>
                    </th>
                    <th style={{ textAlign: "left", width: 260, backgroundColor: "#1A237E", color: "#FFFFFF", verticalAlign: "middle" }} className="py-3 small fw-bold">College Name & {currentConfig.codeLabel}</th>
                    <th style={{ textAlign: "left", width: 230, backgroundColor: "#1A237E", color: "#FFFFFF", verticalAlign: "middle" }} className="py-3 small fw-bold">Selected Branch Program</th>
                    <th style={{ width: 95, backgroundColor: "#1A237E", color: "#FFFFFF", verticalAlign: "middle" }} className="py-3 small fw-bold">2024 Cutoff</th>
                    <th style={{ width: 95, backgroundColor: "#1A237E", color: "#FFFFFF", verticalAlign: "middle" }} className="py-3 small fw-bold">2025 Cutoff</th>
                    <th style={{ width: 95, backgroundColor: "#1A237E", color: "#FFFFFF", verticalAlign: "middle" }} className="py-3 small fw-bold">2026 Cutoff</th>
                    <th style={{ width: 135, backgroundColor: "#1A237E", color: "#FFFFFF", verticalAlign: "middle" }} className="py-3 small fw-bold">
                      <span className="text-white">2027 Proj. Benchmark</span>
                      <span className="d-block text-warning fw-normal" style={{ fontSize: 9.5 }}>Trajectory Slope</span>
                    </th>
                    <th style={{ width: 180, backgroundColor: "#1A237E", color: "#FFFFFF", verticalAlign: "middle" }} className="py-3 small fw-bold">
                      <span className="text-white">Admission Probability</span>
                      <span className="d-block text-warning fw-normal" style={{ fontSize: 9.5 }}>For Your {studentScore}{currentConfig.scoreUnit}</span>
                    </th>
                    <th style={{ width: 75, backgroundColor: "#1A237E", color: "#FFFFFF", verticalAlign: "middle" }} className="py-3 small fw-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableChoices.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-5 text-center text-muted">
                        <div className="p-4">
                          <MdOutlineSchool size={48} className="text-muted mb-2" />
                          <h6 className="fw-bold">No colleges added to your {selectedExam} preference list yet.</h6>
                          <p className="small text-secondary mb-3">Search any institution above or click one of the quick templates to populate options.</p>
                          <button
                            className="btn btn-primary btn-sm rounded-pill px-4"
                            onClick={() => setTableChoices(currentConfig.presets[0]?.choices || currentConfig.defaultChoices)}
                          >
                            Load Recommended {selectedExam} Choices
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-5 text-center text-muted">
                        <div className="p-4">
                          <FaSearch size={32} className="text-muted mb-2 opacity-50" />
                          <h6 className="fw-bold">No choices match "{filterQuery}".</h6>
                          <p className="small text-secondary mb-3">Try searching a different college name, branch or city.</p>
                          <button
                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            onClick={() => setFilterQuery("")}
                          >
                            Clear Filter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const realIdx = row.preference_no - 1;
                      const catalogCollege = collegesCatalog.find(c => c.college_code === row.college_code);
                      const availableBranches = catalogCollege?.available_branches ||
                        (catalogCollege?.branches ? catalogCollege.branches.map(b => b.branch) : null) ||
                        row.available_branches || [row.selected_branch];
                      const isOffered = row.is_branch_offered;

                      // Probability Meter styling
                      let probBg = "#10B981";
                      let probBadgeClass = "bg-success text-white";
                      if (!isOffered) {
                        probBg = "#94A3B8";
                        probBadgeClass = "bg-secondary text-white";
                      } else if (row.tier === "Target") {
                        probBg = "#F59E0B";
                        probBadgeClass = "bg-warning text-dark";
                      } else if (row.tier === "Dream") {
                        probBg = "#EF4444";
                        probBadgeClass = "bg-danger text-white";
                      }

                      const isBeingDragged = draggedIdx === realIdx;
                      const isDragTarget = dragOverIdx === realIdx && draggedIdx !== realIdx;

                      // Row dynamic drag styling
                      let rowStyle = {
                        transition: "all 0.15s ease",
                        cursor: "grab",
                      };
                      if (!isOffered) {
                        rowStyle.background = "#FFF1F2";
                      }
                      if (isBeingDragged) {
                        rowStyle.opacity = 0.35;
                        rowStyle.background = "#EEF2FF";
                        rowStyle.outline = "2px dashed #4F46E5";
                      } else if (isDragTarget) {
                        rowStyle.background = "#F0FDF4";
                        if (draggedIdx !== null && draggedIdx < realIdx) {
                          rowStyle.boxShadow = "inset 0 -3px 0 #4F46E5";
                        } else if (draggedIdx !== null && draggedIdx > realIdx) {
                          rowStyle.boxShadow = "inset 0 3px 0 #4F46E5";
                        }
                      }

                      return (
                        <tr
                          key={`${row.college_code}-${row.selected_branch}-${realIdx}`}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, realIdx)}
                          onDragOver={(e) => handleDragOver(e, realIdx)}
                          onDrop={(e) => handleDrop(e, realIdx)}
                          onDragEnd={handleDragEnd}
                          style={rowStyle}
                          className={isBeingDragged ? "table-active" : undefined}
                          title="Click and drag to reorder preference"
                        >
                          {/* 1. Preference Order # with Drag Handle */}
                          <td style={{ verticalAlign: "middle" }}>
                            <div className="d-flex align-items-center justify-content-center gap-1">
                              <span
                                className="text-secondary d-inline-flex align-items-center justify-content-center p-1 rounded"
                                style={{
                                  cursor: "grab",
                                  opacity: isBeingDragged ? 0.3 : 0.75,
                                  transition: "opacity 0.15s ease, transform 0.15s ease",
                                }}
                                title="Click and drag to move college up or down"
                              >
                                <MdDragIndicator size={18} color="#6366F1" />
                              </span>
                              <span
                                className="badge rounded-circle d-inline-flex align-items-center justify-content-center fw-bold shadow-sm"
                                style={{
                                  width: 28,
                                  height: 28,
                                  background: row.preference_no === 1 ? "#FFB300" : "#1A237E",
                                  color: row.preference_no === 1 ? "#000000" : "#FFFFFF",
                                  fontSize: 12
                                }}
                              >
                                {row.preference_no}
                              </span>
                            </div>
                          </td>

                          {/* 2. College Name & Exam Authority Code */}
                          <td style={{ textAlign: "left" }}>
                            <div className="fw-bold text-dark small" style={{ fontSize: 13 }}>
                              {row.college_name}
                            </div>
                            <div className="d-flex align-items-center gap-1 mt-0.5">
                              <span className="badge bg-light text-primary border" style={{ fontSize: 9 }}>
                                {currentConfig.codeLabel}: {row.college_code}
                              </span>
                              <span className="badge bg-light text-secondary border" style={{ fontSize: 9 }}>
                                📍 {row.city}
                              </span>
                            </div>
                          </td>

                          {/* 3. Branch Dropdown */}
                          <td style={{ textAlign: "left" }}>
                            <select
                              draggable={false}
                              onMouseDown={(e) => e.stopPropagation()}
                              className={`form-select form-select-sm shadow-none ${!isOffered ? "border-danger text-danger fw-bold" : "border-secondary-subtle"}`}
                              style={{ fontSize: 12, cursor: "pointer" }}
                              value={row.selected_branch}
                              onChange={(e) => handleChangeRowBranch(realIdx, e.target.value)}
                            >
                              {availableBranches.map((br) => (
                                <option key={br} value={br}>
                                  {br}
                                </option>
                              ))}
                              {!availableBranches.includes(row.selected_branch) && (
                                <option value={row.selected_branch}>
                                  ⚠️ {row.selected_branch} (Not Offered)
                                </option>
                              )}
                            </select>
                            {!isOffered && (
                              <span className="badge bg-danger text-white mt-1 d-inline-block" style={{ fontSize: 9 }}>
                                ⚠️ Program Not Offered by Institute
                              </span>
                            )}
                          </td>

                          {/* 4. 2024 Cutoff */}
                          <td>
                            {isOffered ? (
                              <span className="fw-semibold text-dark small">{row.cutoff_2024}%ile</span>
                            ) : (
                              <span className="text-muted small">—</span>
                            )}
                          </td>

                          {/* 5. 2025 Cutoff */}
                          <td>
                            {isOffered ? (
                              <span className="fw-semibold text-dark small">{row.cutoff_2025}%ile</span>
                            ) : (
                              <span className="text-muted small">—</span>
                            )}
                          </td>

                          {/* 6. 2026 Cutoff */}
                          <td>
                            {isOffered ? (
                              <span className="fw-bold text-primary small">{row.cutoff_2026}%ile</span>
                            ) : (
                              <span className="text-muted small">—</span>
                            )}
                          </td>

                          {/* 7. 2027 Projected Benchmark & Trajectory */}
                          <td>
                            {isOffered ? (
                              <div>
                                <span className="fw-bold text-indigo small" style={{ color: "#312E81" }}>
                                  {row.cutoff_2027_predicted}%ile
                                </span>
                                <div style={{ fontSize: 9.5 }}>
                                  <span className={row.trend_direction === "rising" ? "text-danger fw-semibold" : row.trend_direction === "easing" ? "text-success fw-semibold" : "text-secondary"}>
                                    {row.trend_label}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="badge bg-light text-muted border" style={{ fontSize: 10 }}>Not Provided</span>
                            )}
                          </td>

                          {/* 8. Admission Probability for Student Score */}
                          <td>
                            {isOffered ? (
                              <div className="px-2">
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                  <span className={`badge ${probBadgeClass} px-2 py-0.5 rounded-pill`} style={{ fontSize: 10.5 }}>
                                    {row.admission_probability}% ({row.tier})
                                  </span>
                                  <span className="small text-secondary fw-semibold" style={{ fontSize: 10 }}>
                                    {row.score_margin >= 0 ? `+${row.score_margin}` : row.score_margin}
                                  </span>
                                </div>
                                <div className="progress" style={{ height: 6 }}>
                                  <div
                                    className="progress-bar progress-bar-striped progress-bar-animated"
                                    role="progressbar"
                                    style={{
                                      width: `${row.admission_probability}%`,
                                      background: probBg
                                    }}
                                  />
                                </div>
                                <span className="d-block text-secondary mt-1 text-truncate" style={{ fontSize: 9.5 }}>
                                  {row.probability_label}
                                </span>
                              </div>
                            ) : (
                              <div className="text-center">
                                <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded" style={{ fontSize: 11 }}>
                                  ❌ Not Offered
                                </span>
                                <span className="d-block text-muted mt-0.5" style={{ fontSize: 9.5 }}>
                                  Program not available
                                </span>
                              </div>
                            )}
                          </td>

                          {/* 9. Row Actions */}
                          <td>
                            <div
                              className="d-flex align-items-center justify-content-center gap-1"
                              draggable={false}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <button
                                className="btn btn-sm btn-light p-1 rounded text-secondary"
                                disabled={realIdx === 0}
                                onClick={() => handleMoveUp(realIdx)}
                                title="Move Up Preference"
                              >
                                <FaArrowUp size={11} />
                              </button>
                              <button
                                className="btn btn-sm btn-light p-1 rounded text-secondary"
                                disabled={realIdx === tableChoices.length - 1}
                                onClick={() => handleMoveDown(realIdx)}
                                title="Move Down Preference"
                              >
                                <FaArrowDown size={11} />
                              </button>
                              <button
                                className="btn btn-sm btn-light p-1 rounded text-danger"
                                onClick={() => handleRemoveRow(realIdx)}
                                title="Remove from List"
                              >
                                <FaTrash size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: TIER CARDS (Categorized Strategic Kanbans: Dream / Target / Safe)  */}
          {/* ========================================================================= */}
          {viewMode === "tiers" && (
            <div className="p-3 p-md-4 bg-light">
              {/* Tiers Distribution Quick Header */}
              <div className="p-3 bg-white rounded-3 border mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge px-2.5 py-1 rounded-pill bg-primary text-white fw-bold" style={{ fontSize: 11 }}>
                    Golden Ratio Target: 20% Dream : 50% Target : 30% Safe
                  </span>
                  <span className="small text-secondary" style={{ fontSize: 12 }}>
                    Your Distribution: <strong>{portfolioStats.dreamPct}% Dream</strong> • <strong>{portfolioStats.targetPct}% Target</strong> • <strong>{portfolioStats.safePct}% Safe</strong>
                  </span>
                </div>
                <span className={`badge px-3 py-1 rounded-pill fw-bold ${portfolioStats.badgeClass}`} style={{ fontSize: 11 }}>
                  {portfolioStats.statusBadge}
                </span>
              </div>

              {/* 3 Tier Columns */}
              <div className="row g-3">
                {/* 1. Dream Reaches Column */}
                <div className="col-lg-4">
                  <div className="p-3 rounded-4 border bg-white h-100 shadow-sm">
                    <div className="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom">
                      <div className="d-flex align-items-center gap-1.5 text-warning fw-bold fs-6">
                        <FaFire size={14} />
                        <span>🚀 Dream Reaches</span>
                      </div>
                      <span className="badge bg-warning text-dark rounded-pill fw-bold" style={{ fontSize: 11 }}>
                        {filteredRows.filter(r => r.tier === "Dream" && r.is_branch_offered).length} Choices
                      </span>
                    </div>
                    <p className="text-muted small mb-3" style={{ fontSize: 11.5, lineHeight: 1.4 }}>
                      Cutoff &gt; Score. Placed at Preferences #1-#3 for zero-risk aspirational float.
                    </p>

                    <div className="d-flex flex-column gap-2.5">
                      {filteredRows.filter(r => r.tier === "Dream" && r.is_branch_offered).length === 0 ? (
                        <div className="p-4 rounded-3 text-center border border-dashed bg-light text-muted">
                          <FaFire size={24} className="mb-2 opacity-40 text-warning" />
                          <div className="fw-semibold small">No Dream Choices Added</div>
                          <div className="small text-secondary mt-1" style={{ fontSize: 11 }}>
                            Add 1-3 top-tier reach colleges (e.g. COEP, VJTI) without risking your target seat.
                          </div>
                        </div>
                      ) : (
                        filteredRows
                          .filter(r => r.tier === "Dream" && r.is_branch_offered)
                          .map((row) => {
                            const realIdx = row.preference_no - 1;
                            const choiceCode = getOfficialChoiceCode(row.college_code, row.selected_branch);
                            return (
                              <div
                                key={`${row.college_code}-${row.selected_branch}-${realIdx}`}
                                className="p-3 rounded-3 border bg-white shadow-sm position-relative border-start border-4 border-start-warning"
                              >
                                <div className="d-flex align-items-start justify-content-between gap-1 mb-1">
                                  <div>
                                    <span className="badge bg-warning text-dark fw-bold me-1.5" style={{ fontSize: 10 }}>
                                      Pref #{row.preference_no}
                                    </span>
                                    <strong className="text-dark small" title={row.college_name}>
                                      {row.short_name || row.college_name}
                                    </strong>
                                  </div>
                                  <span className="badge bg-light text-secondary border" style={{ fontSize: 9 }}>
                                    📍 {row.city}
                                  </span>
                                </div>

                                <div className="small text-muted mb-2 fw-semibold" style={{ fontSize: 11.5 }}>
                                  {row.selected_branch}
                                </div>

                                <div className="d-flex align-items-center justify-content-between gap-1 mb-2 small">
                                  <span
                                    className="badge font-monospace bg-light text-dark border p-1 px-2 cursor-pointer"
                                    style={{ fontSize: 10.5 }}
                                    title="Click to copy official DTE choice code"
                                    onClick={() => handleCopySingleCode(choiceCode, realIdx)}
                                  >
                                    Code: {choiceCode} {copiedCodeIdx === realIdx ? <FaCheck size={9} color="#10B981" /> : <FaCopy size={9} className="opacity-50" />}
                                  </span>
                                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: 10 }}>
                                    Margin: {row.score_margin}%ile
                                  </span>
                                </div>

                                {/* Probability Meter */}
                                <div className="mb-2">
                                  <div className="d-flex align-items-center justify-content-between small text-muted mb-1" style={{ fontSize: 10 }}>
                                    <span>Chance: <strong>{row.admission_probability}%</strong></span>
                                    <span>2026 Cutoff: <strong>{row.cutoff_2026}%ile</strong></span>
                                  </div>
                                  <div className="progress" style={{ height: 5 }}>
                                    <div className="progress-bar bg-warning" role="progressbar" style={{ width: `${row.admission_probability}%` }} />
                                  </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                                  <span className="small text-secondary" style={{ fontSize: 10 }}>
                                    2027 Proj: <strong>{row.cutoff_2027_predicted}%ile</strong>
                                  </span>
                                  <div className="d-flex align-items-center gap-1">
                                    <button
                                      className="btn btn-xs btn-light p-1 rounded text-secondary"
                                      disabled={realIdx === 0}
                                      onClick={() => handleMoveUp(realIdx)}
                                      title="Move Up"
                                    >
                                      <FaArrowUp size={10} />
                                    </button>
                                    <button
                                      className="btn btn-xs btn-light p-1 rounded text-secondary"
                                      disabled={realIdx === tableChoices.length - 1}
                                      onClick={() => handleMoveDown(realIdx)}
                                      title="Move Down"
                                    >
                                      <FaArrowDown size={10} />
                                    </button>
                                    <button
                                      className="btn btn-xs btn-light p-1 rounded text-danger"
                                      onClick={() => handleRemoveRow(realIdx)}
                                      title="Remove"
                                    >
                                      <FaTrash size={10} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Target Matches Column */}
                <div className="col-lg-4">
                  <div className="p-3 rounded-4 border bg-white h-100 shadow-sm">
                    <div className="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom">
                      <div className="d-flex align-items-center gap-1.5 text-primary fw-bold fs-6">
                        <FaBullseye size={14} />
                        <span>🎯 Target Matches</span>
                      </div>
                      <span className="badge bg-primary rounded-pill fw-bold" style={{ fontSize: 11 }}>
                        {filteredRows.filter(r => r.tier === "Target" && r.is_branch_offered).length} Choices
                      </span>
                    </div>
                    <p className="text-muted small mb-3" style={{ fontSize: 11.5, lineHeight: 1.4 }}>
                      Cutoff ≈ Score. Core allotment range with high realistic probability (65–85%).
                    </p>

                    <div className="d-flex flex-column gap-2.5">
                      {filteredRows.filter(r => r.tier === "Target" && r.is_branch_offered).length === 0 ? (
                        <div className="p-4 rounded-3 text-center border border-dashed bg-light text-muted">
                          <FaBullseye size={24} className="mb-2 opacity-40 text-primary" />
                          <div className="fw-semibold small">No Target Choices Added</div>
                          <div className="small text-secondary mt-1" style={{ fontSize: 11 }}>
                            Add colleges with cutoffs within 1-2% of your score ({studentScore}%ile).
                          </div>
                        </div>
                      ) : (
                        filteredRows
                          .filter(r => r.tier === "Target" && r.is_branch_offered)
                          .map((row) => {
                            const realIdx = row.preference_no - 1;
                            const choiceCode = getOfficialChoiceCode(row.college_code, row.selected_branch);
                            return (
                              <div
                                key={`${row.college_code}-${row.selected_branch}-${realIdx}`}
                                className="p-3 rounded-3 border bg-white shadow-sm position-relative border-start border-4 border-start-primary"
                              >
                                <div className="d-flex align-items-start justify-content-between gap-1 mb-1">
                                  <div>
                                    <span className="badge bg-primary text-white fw-bold me-1.5" style={{ fontSize: 10 }}>
                                      Pref #{row.preference_no}
                                    </span>
                                    <strong className="text-dark small" title={row.college_name}>
                                      {row.short_name || row.college_name}
                                    </strong>
                                  </div>
                                  <span className="badge bg-light text-secondary border" style={{ fontSize: 9 }}>
                                    📍 {row.city}
                                  </span>
                                </div>

                                <div className="small text-muted mb-2 fw-semibold" style={{ fontSize: 11.5 }}>
                                  {row.selected_branch}
                                </div>

                                <div className="d-flex align-items-center justify-content-between gap-1 mb-2 small">
                                  <span
                                    className="badge font-monospace bg-light text-dark border p-1 px-2 cursor-pointer"
                                    style={{ fontSize: 10.5 }}
                                    title="Click to copy official DTE choice code"
                                    onClick={() => handleCopySingleCode(choiceCode, realIdx)}
                                  >
                                    Code: {choiceCode} {copiedCodeIdx === realIdx ? <FaCheck size={9} color="#10B981" /> : <FaCopy size={9} className="opacity-50" />}
                                  </span>
                                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: 10 }}>
                                    Margin: {row.score_margin >= 0 ? `+${row.score_margin}` : row.score_margin}%ile
                                  </span>
                                </div>

                                {/* Probability Meter */}
                                <div className="mb-2">
                                  <div className="d-flex align-items-center justify-content-between small text-muted mb-1" style={{ fontSize: 10 }}>
                                    <span>Chance: <strong>{row.admission_probability}%</strong></span>
                                    <span>2026 Cutoff: <strong>{row.cutoff_2026}%ile</strong></span>
                                  </div>
                                  <div className="progress" style={{ height: 5 }}>
                                    <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${row.admission_probability}%` }} />
                                  </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                                  <span className="small text-secondary" style={{ fontSize: 10 }}>
                                    2027 Proj: <strong>{row.cutoff_2027_predicted}%ile</strong>
                                  </span>
                                  <div className="d-flex align-items-center gap-1">
                                    <button
                                      className="btn btn-xs btn-light p-1 rounded text-secondary"
                                      disabled={realIdx === 0}
                                      onClick={() => handleMoveUp(realIdx)}
                                      title="Move Up"
                                    >
                                      <FaArrowUp size={10} />
                                    </button>
                                    <button
                                      className="btn btn-xs btn-light p-1 rounded text-secondary"
                                      disabled={realIdx === tableChoices.length - 1}
                                      onClick={() => handleMoveDown(realIdx)}
                                      title="Move Down"
                                    >
                                      <FaArrowDown size={10} />
                                    </button>
                                    <button
                                      className="btn btn-xs btn-light p-1 rounded text-danger"
                                      onClick={() => handleRemoveRow(realIdx)}
                                      title="Remove"
                                    >
                                      <FaTrash size={10} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Safe Backups Column */}
                <div className="col-lg-4">
                  <div className="p-3 rounded-4 border bg-white h-100 shadow-sm">
                    <div className="d-flex align-items-center justify-content-between pb-2 mb-3 border-bottom">
                      <div className="d-flex align-items-center gap-1.5 text-success fw-bold fs-6">
                        <FaShieldAlt size={14} />
                        <span>🛡️ Safe Backups</span>
                      </div>
                      <span className="badge bg-success text-white rounded-pill fw-bold" style={{ fontSize: 11 }}>
                        {filteredRows.filter(r => r.tier === "Safe" && r.is_branch_offered).length} Choices
                      </span>
                    </div>
                    <p className="text-muted small mb-3" style={{ fontSize: 11.5, lineHeight: 1.4 }}>
                      Cutoff &lt; Score. High-probability guarantees (&gt;90%) to prevent zero allotment crisis.
                    </p>

                    <div className="d-flex flex-column gap-2.5">
                      {filteredRows.filter(r => r.tier === "Safe" && r.is_branch_offered).length === 0 ? (
                        <div className="p-4 rounded-3 text-center border border-danger-subtle bg-danger-subtle text-danger">
                          <FaExclamationTriangle size={26} className="mb-2 text-danger" />
                          <div className="fw-bold fs-6">🚨 Zero Safe Backups!</div>
                          <div className="small mt-1 text-danger-emphasis" style={{ fontSize: 11 }}>
                            80% of candidates who do this get ZERO seat allotments. Add at least 2 safe colleges now!
                          </div>
                          <button
                            className="btn btn-danger btn-sm rounded-pill px-3 mt-2 fw-semibold"
                            onClick={() => handleRunRebalance("golden_ratio")}
                          >
                            Auto-Add Safe Choices
                          </button>
                        </div>
                      ) : (
                        filteredRows
                          .filter(r => r.tier === "Safe" && r.is_branch_offered)
                          .map((row) => {
                            const realIdx = row.preference_no - 1;
                            const choiceCode = getOfficialChoiceCode(row.college_code, row.selected_branch);
                            return (
                              <div
                                key={`${row.college_code}-${row.selected_branch}-${realIdx}`}
                                className="p-3 rounded-3 border bg-white shadow-sm position-relative border-start border-4 border-start-success"
                              >
                                <div className="d-flex align-items-start justify-content-between gap-1 mb-1">
                                  <div>
                                    <span className="badge bg-success text-white fw-bold me-1.5" style={{ fontSize: 10 }}>
                                      Pref #{row.preference_no}
                                    </span>
                                    <strong className="text-dark small" title={row.college_name}>
                                      {row.short_name || row.college_name}
                                    </strong>
                                  </div>
                                  <span className="badge bg-light text-secondary border" style={{ fontSize: 9 }}>
                                    📍 {row.city}
                                  </span>
                                </div>

                                <div className="small text-muted mb-2 fw-semibold" style={{ fontSize: 11.5 }}>
                                  {row.selected_branch}
                                </div>

                                <div className="d-flex align-items-center justify-content-between gap-1 mb-2 small">
                                  <span
                                    className="badge font-monospace bg-light text-dark border p-1 px-2 cursor-pointer"
                                    style={{ fontSize: 10.5 }}
                                    title="Click to copy official DTE choice code"
                                    onClick={() => handleCopySingleCode(choiceCode, realIdx)}
                                  >
                                    Code: {choiceCode} {copiedCodeIdx === realIdx ? <FaCheck size={9} color="#10B981" /> : <FaCopy size={9} className="opacity-50" />}
                                  </span>
                                  <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: 10 }}>
                                    Margin: +{row.score_margin}%ile
                                  </span>
                                </div>

                                {/* Probability Meter */}
                                <div className="mb-2">
                                  <div className="d-flex align-items-center justify-content-between small text-muted mb-1" style={{ fontSize: 10 }}>
                                    <span>Chance: <strong>{row.admission_probability}%</strong></span>
                                    <span>2026 Cutoff: <strong>{row.cutoff_2026}%ile</strong></span>
                                  </div>
                                  <div className="progress" style={{ height: 5 }}>
                                    <div className="progress-bar bg-success" role="progressbar" style={{ width: `${row.admission_probability}%` }} />
                                  </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                                  <span className="small text-secondary" style={{ fontSize: 10 }}>
                                    2027 Proj: <strong>{row.cutoff_2027_predicted}%ile</strong>
                                  </span>
                                  <div className="d-flex align-items-center gap-1">
                                    <button
                                      className="btn btn-xs btn-light p-1 rounded text-secondary"
                                      disabled={realIdx === 0}
                                      onClick={() => handleMoveUp(realIdx)}
                                      title="Move Up"
                                    >
                                      <FaArrowUp size={10} />
                                    </button>
                                    <button
                                      className="btn btn-xs btn-light p-1 rounded text-secondary"
                                      disabled={realIdx === tableChoices.length - 1}
                                      onClick={() => handleMoveDown(realIdx)}
                                      title="Move Down"
                                    >
                                      <FaArrowDown size={10} />
                                    </button>
                                    <button
                                      className="btn btn-xs btn-light p-1 rounded text-danger"
                                      onClick={() => handleRemoveRow(realIdx)}
                                      title="Remove"
                                    >
                                      <FaTrash size={10} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 3: OFFICIAL DTE OPTION FORM (Government 9-Digit Choice Code Standard) */}
          {/* ========================================================================= */}
          {viewMode === "official" && (
            <div className="p-3 p-md-4 bg-white" id="official-option-form-print-area">
              {/* Official Seal & Header Banner */}
              <div className="p-3.5 p-md-4 border rounded-3 mb-3" style={{ background: "#F8FAFC", borderColor: "#CBD5E1" }}>
                <div className="text-center pb-3 border-bottom mb-3">
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                    <FaGraduationCap size={24} color="#1A237E" />
                    <h5 className="fw-bold mb-0 text-dark" style={{ fontFamily: "'Poppins', serif", letterSpacing: "0.5px" }}>
                      GOVERNMENT OF MAHARASHTRA
                    </h5>
                  </div>
                  <div className="text-secondary small fw-semibold mb-1.5" style={{ fontSize: 12 }}>
                    STATE COMMON ENTRANCE TEST CELL, MAHARASHTRA STATE, MUMBAI
                  </div>
                  <div className="badge px-3 py-1 text-uppercase fw-bold shadow-sm" style={{ background: "#1E1B4B", color: "#FFD54F", fontSize: 11, letterSpacing: "0.8px" }}>
                    Centralized Admission Process (CAP) 2026–2027 • Candidate Preference Option Form
                  </div>
                </div>

                {/* Candidate Verification Grid */}
                <div className="row g-2 small text-dark" style={{ fontSize: 12 }}>
                  <div className="col-md-3 col-6">
                    <span className="text-muted d-block" style={{ fontSize: 10 }}>CANDIDATE NAME:</span>
                    <strong className="text-dark">{activeProfile.name.toUpperCase()}</strong>
                  </div>
                  <div className="col-md-3 col-6">
                    <span className="text-muted d-block" style={{ fontSize: 10 }}>APPLICATION ID:</span>
                    <strong className="font-monospace text-primary">EN26108942</strong>
                  </div>
                  <div className="col-md-2 col-4">
                    <span className="text-muted d-block" style={{ fontSize: 10 }}>MERIT SCORE:</span>
                    <strong className="text-dark">{studentScore} {currentConfig.scoreUnit}</strong>
                  </div>
                  <div className="col-md-2 col-4">
                    <span className="text-muted d-block" style={{ fontSize: 10 }}>SEAT CATEGORY:</span>
                    <strong className="text-success">{selectedCategory}</strong>
                  </div>
                  <div className="col-md-2 col-4">
                    <span className="text-muted d-block" style={{ fontSize: 10 }}>ADMISSION ROUND:</span>
                    <strong className="text-dark">{selectedRound}</strong>
                  </div>
                </div>
              </div>

              {/* DTE Official Table with 9-Digit Choice Codes */}
              <div className="table-responsive border rounded-3 mb-3">
                <table className="table table-bordered table-sm align-middle mb-0" style={{ fontSize: 12 }}>
                  <thead style={{ background: "#F1F5F9", color: "#1E293B" }}>
                    <tr className="text-center fw-bold">
                      <th style={{ width: 65 }} className="py-2.5">Pref #</th>
                      <th style={{ width: 145 }} className="py-2.5">Official 9-Digit Choice Code</th>
                      <th style={{ textAlign: "left" }} className="py-2.5">Institute Name & DTE Code</th>
                      <th style={{ textAlign: "left" }} className="py-2.5">Course / Program Name</th>
                      <th style={{ width: 120 }} className="py-2.5">Quota / Shift</th>
                      <th style={{ width: 190 }} className="py-2.5">Provisional Allotment Simulation</th>
                      <th style={{ width: 60 }} className="py-2.5">Copy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => {
                      const realIdx = row.preference_no - 1;
                      const choiceCode = getOfficialChoiceCode(row.college_code, row.selected_branch);
                      const isAllottedChoice = activeSimulatedData.predicted_allotment?.preference_no === row.preference_no;
                      const isBettermentEligible = activeSimulatedData.predicted_allotment && row.preference_no < activeSimulatedData.predicted_allotment.preference_no;

                      return (
                        <tr
                          key={`official-${row.college_code}-${realIdx}`}
                          className={isAllottedChoice ? "table-success" : undefined}
                        >
                          <td className="text-center fw-bold" style={{ verticalAlign: "middle" }}>
                            <span className="badge rounded-circle bg-dark text-white" style={{ width: 24, height: 24, lineHeight: "17px", fontSize: 11 }}>
                              {row.preference_no}
                            </span>
                          </td>
                          <td className="text-center" style={{ verticalAlign: "middle" }}>
                            <span className="font-monospace fw-bold px-2 py-0.5 rounded bg-light border text-primary" style={{ fontSize: 12 }}>
                              {choiceCode}
                            </span>
                          </td>
                          <td style={{ textAlign: "left", verticalAlign: "middle" }}>
                            <div className="fw-bold text-dark">{row.college_name}</div>
                            <span className="small text-muted" style={{ fontSize: 10.5 }}>
                              {currentConfig.codeLabel}: {row.college_code} • {row.city}
                            </span>
                          </td>
                          <td style={{ textAlign: "left", verticalAlign: "middle" }}>
                            <span className="fw-semibold text-dark">{row.selected_branch}</span>
                          </td>
                          <td className="text-center" style={{ verticalAlign: "middle" }}>
                            <span className="badge bg-light text-secondary border" style={{ fontSize: 10 }}>
                              State Level (Shift 1)
                            </span>
                          </td>
                          <td className="text-center" style={{ verticalAlign: "middle" }}>
                            {isAllottedChoice ? (
                              <span className="badge bg-success text-white px-2 py-1 shadow-sm d-inline-flex align-items-center gap-1" style={{ fontSize: 11 }}>
                                🎯 ALLOTTED IN {selectedRound.toUpperCase()}
                              </span>
                            ) : isBettermentEligible ? (
                              <span className="badge bg-warning-subtle text-dark border border-warning" style={{ fontSize: 10 }}>
                                ⚡ Float Betterment Contested
                              </span>
                            ) : (
                              <span className="text-muted small" style={{ fontSize: 10.5 }}>
                                Backup Choice
                              </span>
                            )}
                          </td>
                          <td className="text-center" style={{ verticalAlign: "middle" }}>
                            <button
                              className="btn btn-xs btn-light border p-1 rounded"
                              onClick={() => handleCopySingleCode(choiceCode, realIdx)}
                              title="Copy this 9-digit code"
                            >
                              {copiedCodeIdx === realIdx ? <FaCheck size={11} color="#10B981" /> : <FaCopy size={11} className="text-secondary" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Official Candidate Statutory Declaration */}
              <div className="p-3 bg-light rounded-3 border small text-secondary" style={{ fontSize: 11, lineHeight: 1.5 }}>
                <strong>Candidate Statutory Undertaking:</strong> I hereby certify that the 9-digit choice codes listed above have been checked against the official DTE Maharashtra Seat Matrix 2026–2027. I am aware that if <strong>Choice #1</strong> is provisionally allotted, it results in <strong>Auto-Freeze</strong>, and I will not be permitted to contest subsequent CAP rounds. For Choices #2 onwards, I am eligible to choose <strong>Float (Betterment)</strong>.
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 4: COMPACT LIST (High Density Single-Line Scanning)                  */}
          {/* ========================================================================= */}
          {viewMode === "compact" && (
            <div className="p-2 p-md-3 bg-white">
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: 12 }}>
                  <thead className="bg-light">
                    <tr className="text-muted text-uppercase" style={{ fontSize: 10.5, letterSpacing: "0.5px" }}>
                      <th style={{ width: 75 }} className="text-center py-2">Pref #</th>
                      <th className="py-2">College Name & City</th>
                      <th style={{ width: 220 }} className="py-2">Branch</th>
                      <th style={{ width: 125 }} className="text-center py-2">DTE Choice Code</th>
                      <th style={{ width: 95 }} className="text-center py-2">Tier</th>
                      <th style={{ width: 120 }} className="text-center py-2">Admission Chance</th>
                      <th style={{ width: 85 }} className="text-center py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => {
                      const realIdx = row.preference_no - 1;
                      const choiceCode = getOfficialChoiceCode(row.college_code, row.selected_branch);
                      return (
                        <tr key={`compact-${row.college_code}-${realIdx}`}>
                          <td className="text-center" style={{ verticalAlign: "middle" }}>
                            <div className="d-flex align-items-center justify-content-center gap-1">
                              <span className="text-muted" style={{ cursor: "grab" }}>
                                <MdDragIndicator size={14} />
                              </span>
                              <span className="fw-bold">{row.preference_no}</span>
                            </div>
                          </td>
                          <td style={{ verticalAlign: "middle" }}>
                            <span className="fw-bold text-dark">{row.short_name || row.college_name}</span>
                            <span className="text-muted small ms-1.5" style={{ fontSize: 11 }}>({row.city})</span>
                          </td>
                          <td style={{ verticalAlign: "middle" }}>
                            <span className="text-secondary small fw-semibold">{row.selected_branch}</span>
                          </td>
                          <td className="text-center font-monospace" style={{ verticalAlign: "middle", fontSize: 11 }}>
                            <span className="bg-light px-1.5 py-0.5 rounded border">{choiceCode}</span>
                          </td>
                          <td className="text-center" style={{ verticalAlign: "middle" }}>
                            <span className={`badge ${
                              row.tier === "Dream"
                                ? "bg-warning text-dark"
                                : row.tier === "Target"
                                ? "bg-primary text-white"
                                : "bg-success text-white"
                            }`} style={{ fontSize: 10 }}>
                              {row.tier}
                            </span>
                          </td>
                          <td className="text-center" style={{ verticalAlign: "middle" }}>
                            <span className="fw-bold" style={{
                              color: row.tier === "Safe" ? "#10B981" : row.tier === "Target" ? "#2563EB" : "#DC2626"
                            }}>
                              {row.admission_probability}%
                            </span>
                            <span className="text-muted ms-1 small" style={{ fontSize: 10 }}>
                              ({row.score_margin >= 0 ? `+${row.score_margin}` : row.score_margin})
                            </span>
                          </td>
                          <td className="text-center" style={{ verticalAlign: "middle" }}>
                            <div className="d-flex align-items-center justify-content-center gap-1">
                              <button
                                className="btn btn-xs btn-light p-1 rounded text-secondary"
                                disabled={realIdx === 0}
                                onClick={() => handleMoveUp(realIdx)}
                                title="Move Up"
                              >
                                <FaArrowUp size={10} />
                              </button>
                              <button
                                className="btn btn-xs btn-light p-1 rounded text-secondary"
                                disabled={realIdx === tableChoices.length - 1}
                                onClick={() => handleMoveDown(realIdx)}
                                title="Move Down"
                              >
                                <FaArrowDown size={10} />
                              </button>
                              <button
                                className="btn btn-xs btn-light p-1 rounded text-danger"
                                onClick={() => handleRemoveRow(realIdx)}
                                title="Remove"
                              >
                                <FaTrash size={10} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* 6. Analytics & Tactical Strategy Summary Banner */}
        {activeSimulatedData && (
          <div className="row g-3">
            {/* Left Card: Health & Balance */}
            <div className="col-lg-7">
              <div className="p-3.5 p-md-4 bg-white rounded-4 shadow-sm border h-100">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    <MdTimeline size={20} color="#4F46E5" /> {selectedExam} Option Form Portfolio Analysis
                  </h6>
                  <span className="badge bg-light text-primary border px-2.5 py-1">
                    Strategy Check
                  </span>
                </div>
                
                {/* Metric Counter Pills */}
                <div className="row g-2 my-2">
                  <div className="col-3">
                    <div className="p-2.5 rounded-3 bg-success-subtle text-center border border-success-subtle">
                      <div className="fw-bold fs-5 text-success">{activeSimulatedData.counts?.safe || 0}</div>
                      <div className="small text-success-emphasis fw-semibold" style={{ fontSize: 10 }}>🟢 Safe Choices</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="p-2.5 rounded-3 bg-warning-subtle text-center border border-warning-subtle">
                      <div className="fw-bold fs-5 text-warning-emphasis">{activeSimulatedData.counts?.target || 0}</div>
                      <div className="small text-warning-emphasis fw-semibold" style={{ fontSize: 10 }}>🟡 Target Choices</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="p-2.5 rounded-3 bg-danger-subtle text-center border border-danger-subtle">
                      <div className="fw-bold fs-5 text-danger">{activeSimulatedData.counts?.dream || 0}</div>
                      <div className="small text-danger-emphasis fw-semibold" style={{ fontSize: 10 }}>🔴 Dream Choices</div>
                    </div>
                  </div>
                  <div className="col-3">
                    <div className="p-2.5 rounded-3 bg-light text-center border">
                      <div className="fw-bold fs-5 text-dark">{activeSimulatedData.counts?.not_offered || 0}</div>
                      <div className="small text-muted fw-semibold" style={{ fontSize: 10 }}>⚠️ Not Offered</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-3 mt-3 border" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
                  <div className="d-flex align-items-start gap-2">
                    <FaCheckCircle color="#10B981" size={16} className="mt-0.5 flex-shrink-0" />
                    <div className="small text-dark fw-semibold" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                      {activeSimulatedData.strategy_feedback}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Round Allotment Prediction */}
            <div className="col-lg-5">
              <div
                className="p-3.5 p-md-4 rounded-4 shadow-sm text-white h-100 d-flex flex-column justify-content-between"
                style={{ background: isMedicalProfile
                  ? "linear-gradient(135deg, #064E3B 0%, #065F46 100%)"
                  : "linear-gradient(135deg, #1A237E 0%, #3949AB 100%)"
                }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: 10 }}>SIMULATION FORECAST</span>
                    <span className="small text-white-50">{currentConfig.authorityBadge} Engine</span>
                  </div>
                  <h6 className="fw-bold mb-2 text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    🎯 Predicted Provisional Seat Allotment
                  </h6>
                  <div className="p-3 rounded-3 mb-2" style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
                    <div className="small text-white" style={{ fontSize: 13, lineHeight: 1.6 }}>
                      {activeSimulatedData.allotment_advisory}
                    </div>
                  </div>
                </div>

                <div className="small text-white-50 mt-3 border-top pt-2" style={{ fontSize: 11 }}>
                  💡 {currentConfig.roundTip}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Web-Grounded Document Verification & Eligibility Modal */}
        <DocumentVerificationModal
          isOpen={showDocModal}
          onClose={() => setShowDocModal(false)}
          studentProfile={activeProfile}
        />

      </div>
    </div>
  );
}
