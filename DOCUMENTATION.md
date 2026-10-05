# 🎓 Education Counsellor — Complete Project Documentation

> **AI-Powered Hybrid College Recommendation & Interactive Student Guidance System**  
> *Developed for Indian higher education entrance counseling across Engineering, Medical, Commerce, Arts, Science, Law, and Design streams.*

---

## 📌 Table of Contents

1. [Executive Summary & Project Overview](#1-executive-summary--project-overview)
2. [Problem Statement & The Solution](#2-problem-statement--the-solution)
3. [System Architecture](#3-system-architecture)
4. [What We Use (Complete Technology Stack)](#4-what-we-use-complete-technology-stack)
5. [Why We Use It (Technology Rationale & Justification)](#5-why-we-use-it-technology-rationale--justification)
6. [Core System Features & Modules](#6-core-system-features--modules)
7. [Recommendation Engine & Scoring Architecture](#7-recommendation-engine--scoring-architecture)
8. [Database Schema & Data Persistence](#8-database-schema--data-persistence)
9. [API Endpoints Reference](#9-api-endpoints-reference)
10. [Frontend Component Architecture & Pages](#10-frontend-component-architecture--pages)
11. [Installation, Configuration & Run Guide](#11-installation-configuration--run-guide)
12. [Future Roadmap & Enhancements](#12-future-roadmap--enhancements)

---

## 1. Executive Summary & Project Overview

The **Education Counsellor** application is a modern, full-stack, AI-integrated decision-support platform designed to solve the complexity of Indian college admissions. 

Every year, millions of Indian students appear for diverse national and state entrance examinations such as **JEE Main**, **JEE Advanced**, **NEET**, **MHT-CET**, **CUET**, **CLAT**, and **NID/NIFT**. Navigating cutoff lists, quotas, fee structures, branch eligibility, and counseling timelines across central (JoSAA, CSAB, MCC) and state (CAP, KEA, DTE) portals is overwhelming, stressful, and often leads to uninformed career decisions or reliance on expensive, biased private agents.

This project delivers:
- **Personalized College Recommendations:** Dynamically evaluated against the student's exam score, percentile, or All India Rank (AIR).
- **Rule-Based Eligibility Classification:** Strict, deterministic bucketing into **Safe (>90%)**, **Target (50–85%)**, and **Dream (<40%)** tiers to prevent unrealistic choices.
- **Conversational AI Counselor:** Powered by Google's Gemini LLM, acting as a supportive, empathetic education counselor that understands Indian academic vernacular and provides tailored guidance.
- **Student Productivity Hub:** Left-side collapsible tools with an Admission Chances Meter, Personal Shortlist, 3-way College Comparison, Stream Deadlines, and Printable PDF Summaries.
- **Persistent Student Profiles & Chat History:** Stored in a local or cloud MongoDB database with full inspection capabilities via MongoDB Compass.

---

## 2. Problem Statement & The Solution

### The Challenges in Indian Admissions:
1. **Diverse Scoring Units:** Different entrance tests use incompatible scoring metrics:
   - *NEET* uses total marks (out of 720).
   - *JEE Advanced & CLAT* use All India Rank (AIR, where lower is better).
   - *JEE Main & MHT-CET* use NTA/State percentiles (0–100 %ile).
   - *Board exams* use aggregate percentages (0–100%).
2. **Information Asymmetry:** Cutoff data from previous years (2022–2024) is buried inside hundreds of government PDFs, making it nearly impossible for students to compare multiple institutions effectively.
3. **Impersonal or Generic Advice:** Traditional search engines return sponsored advertisements, while naive LLMs often hallucinate cutoffs or produce overwhelming walls of text for simple greetings.

### Our Solution:
A **Hybrid Architecture** combining:
- **Deterministic Rules & Data Validation:** Ensures that cutoffs, ranking inversions (e.g., AIR 2000 is better than AIR 8000), and fee structures are mathematically checked and validated.
- **Generative AI Guidance:** Generates qualitative insights ("Why Recommended", campus culture, placement statistics, career roadmaps) and engages in natural, context-aware dialogues.
- **Fluid, Interactive User Experience:** A responsive Single-Page Application (SPA) designed with collapsible sidebars, independent scroll containers, and zero-page-reload interactivity.

---

## 3. System Architecture

The project adheres to a clean, decoupled **Client-Server-Database-AI Service** architecture:

```
+-------------------------------------------------------------------------+
|                         CLIENT (FRONTEND)                               |
|   React 18 SPA + Vite 5 + Bootstrap 5 + React Icons + React Markdown    |
+------------------------------------+------------------------------------+
                                     |
                         HTTP / REST | (JSON over Fetch API)
                                     v
+-------------------------------------------------------------------------+
|                         SERVER (BACKEND)                                |
|   FastAPI (Python 3.10+) + Uvicorn ASGI Server                          |
|   - Authentication Middleware (Salted SHA-256)                          |
|   - Pydantic v2 Request/Response Validation                             |
|   - Hybrid Recommender Engine (Scoring Rules + Score Normalization)      |
+-------------------+--------------------------------+--------------------+
                    |                                |
   Motor (Async IO) |                 Google GenAI   | (REST / HTTPS)
                    v                                v
+------------------------------------+  +---------------------------------+
|       DATABASE (PERSISTENCE)       |  |     INTELLIGENCE (AI MODEL)     |
|   MongoDB (Port 27017)             |  |   Google Gemini 2.5 Flash       |
|   - Database: education_counsellor |  |   - Contextual Counselor Prompt |
|   - Collection: users              |  |   - Structured JSON Generator   |
|   - Collection: conversations      |  |   - Multi-Turn History Memory   |
+------------------------------------+  +---------------------------------+
```

### Request Flow:
1. **Student Interaction:** The student enters their marks and stream (e.g., 94.2 %ile in MHT-CET, Engineering).
2. **API Dispatch:** React sends a structured JSON payload to FastAPI (`POST /api/recommend`).
3. **Hybrid Processing:**
   - The backend checks exam parameters and formats the score.
   - It queries Gemini for live accredited colleges in that specific stream with verified cutoff criteria.
   - The rule engine performs eligibility checks: comparing cutoff vs student score, classifying each college into `Safe`, `Target`, or `Dream`.
4. **Presentation:** The frontend renders dynamic cards, computes the Chances Meter proportions, and updates the Left Sidebar.
5. **Conversational Support:** When the student asks questions in chat, the context (profile marks, stream, and previous dialog) is routed to Gemini, with greeting interceptors ensuring concise, friendly counselor replies.

---

## 4. What We Use (Complete Technology Stack)

### A. Frontend Technologies
| Tool / Library | Version | Purpose in Project |
| :--- | :--- | :--- |
| **React** | `^18.3.1` | Declarative UI library for component-based Single Page Architecture. |
| **Vite** | `^5.4.8` | Next-generation frontend tooling providing sub-second Hot Module Replacement (HMR) and optimized Rollup production builds. |
| **React Router DOM** | `^6.26.2` | Client-side routing between Landing Page, Auth, Dashboard, Chat, and College Details. |
| **Bootstrap** | `^5.3.8` | Responsive 12-column grid layout, styling utilities, and typography. |
| **React Icons** | `^5.7.0` | Comprehensive iconography (Font Awesome, Material Design) for intuitive visual cues. |
| **React Markdown & Remark GFM** | `^9.0.1` / `^4.0.1` | Renders rich AI responses (tables, bulleted roadmaps, highlighted badges) cleanly without terminal-like code block glitches. |
| **Framer Motion** | `^11.5.4` | Micro-interactions and smooth transitions across views. |

### B. Backend Technologies
| Tool / Library | Version | Purpose in Project |
| :--- | :--- | :--- |
| **Python** | `3.10+` | Core backend programming language offering robust data processing and AI libraries. |
| **FastAPI** | `^0.110+` | High-performance, asynchronous web framework built on Starlette and Pydantic. |
| **Uvicorn** | `^0.28+` | Lightning-fast ASGI web server implementing HTTP/1.1 and WebSockets. |
| **Pydantic v2** | `^2.6+` | Strict schema definition, request validation, and data parsing. |
| **Google GenAI SDK** | `google-genai` | Official Google SDK for interacting with Gemini models (`gemini-2.5-flash`). |
| **Motor** | `^3.4+` | Asynchronous, non-blocking Python driver for MongoDB. |
| **PyMongo** | `^4.6+` | Core synchronous/underlying MongoDB protocol support and ObjectId handling. |
| **python-dotenv** | `^1.0+` | Loads sensitive environment variables (`GEMINI_API_KEY`, `MONGODB_URL`) securely. |
| **HTTPX** | `^0.27+` | Modern asynchronous HTTP client for external service verification. |

### C. Database & Persistence
| Component | Configuration | Purpose in Project |
| :--- | :--- | :--- |
| **MongoDB** | `mongodb://127.0.0.1:27017` | Document-oriented database (`education_counsellor`) storing student accounts and chat history. |
| **MongoDB Compass** | GUI Tool | Visual database inspector used to monitor real-time reads, writes, and indexing. |

---

## 5. Why We Use It (Technology Rationale & Justification)

### 1. Why FastAPI Instead of Django or Flask?
- **Asynchronous Throughput (Async/Await):** Generating AI recommendations and streaming chat responses requires non-blocking I/O. FastAPI runs natively on ASGI (Uvicorn), allowing multiple students to chat with the AI concurrently without thread starvation.
- **Native Pydantic Type Safety:** In admissions counseling, incorrect data types (e.g., passing a string for NEET marks instead of an integer) lead to faulty eligibility calculations. Pydantic validates incoming payloads automatically before reaching business logic.
- **Automatic Interactive OpenAPI/Swagger Documentation:** FastAPI automatically generates `/docs`, making API testing effortless.

### 2. Why React + Vite Instead of Traditional MPAs or Create-React-App?
- **Instantaneous State Reactivity:** The student dashboard requires real-time filtering (switching from "All" to "Safe", filtering by shortlist, or toggling sidebars) without reloading the page.
- **Fast Developer Experience (Vite HMR):** Vite leverages native ES modules in development, compiling changes in under 50 milliseconds compared to Webpack's multi-second bundle re-runs.
- **Modular Component Reuse:** Components such as `CollegeCard`, `EligibilityBadge`, and markdown formatters are defined once and reused across Landing, Dashboard, and Details pages.

### 3. Why MongoDB Instead of Relational SQL (Postgres / MySQL)?
- **Dynamic & Evolving Profile Schemas:** A student applying for Medical has NEET scores (out of 720), while an Engineering applicant has JEE percentiles or Advanced AIR ranks. Storing diverse academic attributes in a flexible JSON document avoids messy SQL table migrations and sparse relational tables.
- **Natural Fit for Conversation Threads:** Chat history is naturally represented as an array of message objects (`[{ role: 'user', content: '...' }, { role: 'model', content: '...' }]`) embedded directly in the conversation document.
- **High Read/Write Performance:** Non-blocking async queries via `motor` provide sub-millisecond retrieval of user shortlists and preferences.

### 4. Why Google Gemini 2.5 Flash?
- **Deep Understanding of the Indian Education Ecosystem:** Gemini has extensive training on Indian state entrance systems, NIRF rankings, CAP rounds, branch specializations, and fee ranges.
- **Structured JSON Generation:** Gemini can be constrained to output pure JSON arrays containing college cutoffs, NIRF details, and facilities, which the backend safely parses into UI cards.
- **Speed & Cost Efficiency:** `gemini-2.5-flash` delivers low time-to-first-token (TTFT), ensuring conversational replies feel natural and responsive.

### 5. Why a Hybrid Recommendation System (Rules + AI)?
- **Hallucination Prevention:** Pure AI models can invent nonexistent colleges or inaccurate cutoff requirements. Our rule engine mathematically validates the college cutoff against the student's actual score:
  - Higher-is-better exams (Percentiles, Marks): `Student Score >= Cutoff` $\rightarrow$ Safe.
  - Lower-is-better exams (AIR Rank): `Student Rank <= Cutoff Rank` $\rightarrow$ Safe.
- **Personalized Contextualization:** While the rule engine guarantees mathematical correctness, the AI provides the *qualitative* insights: why a college is a strong fit, campus culture, hostel availability, and branch career trajectories.

---

## 6. Core System Features & Modules

### 1. Modern Authentication & User Persistence
- **Sign In & Sign Up Experience:** 2-column layout with visual branding, password visibility toggles, and instant demo credentials auto-fill.
- **Security:** Passwords are never stored in plaintext; they are hashed using **Salted SHA-256** (`edu_counsellor_secure_salt_2026`).
- **Database Synchronization:** Logging in synchronizes user data from MongoDB directly into client `localStorage` for uninterrupted sessions.

### 2. Multi-Stream & Multi-Exam Academic Profile Setup
Supports 7 major academic streams with their corresponding exams and scoring units:
1. **Engineering:** JEE Main (%ile), JEE Advanced (AIR), MHT-CET (%ile), State CET (%ile), 12th Board (%).
2. **Medical:** NEET (Marks out of 720), 12th Board (%).
3. **Arts / Humanities:** CUET (%ile), 12th Board (%).
4. **Commerce / Management:** CUET (%ile), CAT (%ile), 12th Board (%).
5. **Science / Research:** CUET (%ile), IISER Aptitude, 12th Board (%).
6. **Law:** CLAT (AIR), AILET (AIR), 12th Board (%).
7. **Design & Architecture:** NID DAT, NIFT, UCEED, 12th Board (%).

### 3. Student Recommendation Dashboard
- **Personalized Hero Welcome:** Displays verified student score, target stream, and exam badge.
- **Left Sidebar (Counseling Tools Hub):**
  - **Admission Chances Meter:** Visual tripartite progress bar (Safe, Target, Dream) with interactive filter toggles.
  - **My Shortlist:** Save preferred colleges with a single click (❤️), persisted per student.
  - **Compare Colleges Hub:** Select up to 3 colleges for side-by-side metric comparison (Cutoff, Fees, Placement, Established year, Facilities).
  - **Counseling Timeline & Deadlines:** Stream-specific upcoming counseling dates (e.g., CAP Round 1, Merit List, Option Form Locking).
  - **Printable PDF Counseling Report:** Formats student results into a clean, printable admission dossier.
- **Slide Up/Down & Hide Left Controls:**
  - Dedicated smooth-scroll container (`maxHeight: calc(100vh - 175px)` with sleek custom scrollbar).
  - Quick-action **▲ Slide Up** and **▼ Slide Down** 1-click scroll buttons.
  - Quick-jump navigation chips (`📊 Chances`, `❤️ Shortlist`, `⚖️ Compare`, `📅 Deadlines`, `📄 PDF Report`).
  - **Hide Left Button (`◂ Hide Left`):** Smoothly collapses the sidebar to the left.
  - **Docked Floating Tab (`➔ Show Sidebar`):** Appears when hidden, showing saved college count badges.
  - **Adaptive Grid:** When the sidebar is hidden, the college recommendation grid automatically expands to a **full-width 3-column layout (`col-xl-4`)**.

### 4. Interactive Conversational AI Counselor
- **Human-Like Greeting Intelligence:** Intercepts short casual greetings like *"hi"*, *"hello"*, or *"hii counselor"*, returning a natural 2–3 sentence warm welcome acknowledging the student's stream and score, rather than dumping unwanted tables and cutoff essays.
- **Context-Aware Deep Guidance:** Remembers the student's background throughout the conversation.
- **Custom Markdown Rendering:** Output includes properly formatted data tables, quote callouts, and clean link badges without terminal-like formatting bugs.

### 5. College Details Deep-Dive Page
- Detailed institution banner with campus photography.
- Multi-year cutoff trends (2024, 2023, 2022).
- Branch-by-branch eligibility status (CSE, AI/DS, IT, Mechanical, Electrical, Civil, etc.).
- Placement records (Average vs Highest package) and campus facilities tags.
- Direct **"Ask Counselor About This College"** button to jump straight into chat with prepopulated questions.

---

## 7. Recommendation Engine & Scoring Architecture

### Eligibility Logic & Score Normalization
The engine dynamically switches mathematical evaluation based on `score_unit`:

```python
# Rank-based exams (JEE Advanced, CLAT): Lower number is better
if is_rank:
    if student_score <= cutoff_rank * 0.95:
        status = "eligible"       # Safe chance (>90%)
    elif student_score <= cutoff_rank * 1.15:
        status = "borderline"     # Target / Realistic (50-85%)
    else:
        status = "not_eligible"   # Dream / Reach (<40%)

# Score-based exams (Percentiles, NEET /720, Board %): Higher number is better
else:
    diff = student_score - cutoff_marks
    if diff >= 0:
        status = "eligible"       # Safe chance (>90%)
    elif diff >= -3.0:
        status = "borderline"     # Target / Realistic (50-85%)
    else:
        status = "not_eligible"   # Dream / Reach (<40%)
```

---

## 8. Database Schema & Data Persistence

### Collection: `users`
Stores student authentication credentials and academic profile details.
```json
{
  "_id": { "$oid": "670014a9b4f2c91834e56789" },
  "name": "Omprasad Shinde",
  "email": "student@example.com",
  "password_hash": "a4b5c6... (Salted SHA-256)",
  "phone": "+91 9876543210",
  "profile": {
    "name": "Omprasad Shinde",
    "age": 18,
    "stream": "Engineering",
    "marks": 94.2,
    "exam_type": "MHT-CET",
    "score_unit": "percentile",
    "preferred_state": "Maharashtra",
    "budget": "Any",
    "college_type": "Any"
  },
  "created_at": "2026-10-04T16:15:30.000Z",
  "updated_at": "2026-10-04T16:18:45.000Z"
}
```
*Index:* `{ "email": 1 }` (Unique).

### Collection: `conversations`
Stores persistent chat messages exchanged between student and the AI Counselor.
```json
{
  "_id": { "$oid": "670015b8c3e4d82945f67890" },
  "user_id": "670014a9b4f2c91834e56789",
  "user_name": "Omprasad Shinde",
  "messages": [
    {
      "role": "user",
      "content": "Hi counselor, can I get COEP Pune with 94.2 percentile in MHT-CET?",
      "timestamp": "2026-10-04T16:20:10.000Z"
    },
    {
      "role": "model",
      "content": "Hello Omprasad! With your 94.2 percentile in MHT-CET, getting Computer Science at COEP will be aspirational since CSE cutoffs typically close above 99.6 percentile. However, you stand a strong chance in core branches like Manufacturing Science, Civil, or Metallurgy, or Computer branches in other top Pune colleges like PCCOE and MIT-WPU.",
      "timestamp": "2026-10-04T16:20:14.000Z"
    }
  ],
  "created_at": "2026-10-04T16:20:10.000Z",
  "updated_at": "2026-10-04T16:20:14.000Z"
}
```
*Index:* `{ "user_id": 1 }`.

---

## 9. API Endpoints Reference

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Description | Request Body / Params |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new student in MongoDB | `{ name, email, password, phone }` |
| `POST` | `/auth/login` | Authenticate student and load profile | `{ email, password }` |
| `GET` | `/auth/profile/{user_id}` | Fetch student profile by user ID | N/A |
| `POST` | `/auth/profile` | Update student academic preferences | `{ user_id, profile: {...} }` |
| `POST` | `/recommend` | Generate dynamic college recommendations | `{ student_profile: {...} }` |
| `GET` | `/featured-colleges` | Public showcase colleges for Landing Page | `?stream=All` |
| `POST` | `/college-details` | Multi-year cutoffs and branch analytics | `{ college_name, stream, student_marks, ... }` |
| `POST` | `/chat` | Contextual AI counselor chat with history | `{ message, student_profile, history, user_id }` |
| `GET` | `/chat/history/{user_id}` | Retrieve past chat history from MongoDB | N/A |
| `DELETE`| `/chat/history/{user_id}` | Clear conversation thread from MongoDB | N/A |
| `GET` | `/health` | Server and MongoDB database status check | N/A |

---

## 10. Frontend Component Architecture & Pages

```
frontend/src/
├── main.jsx                     # Application root entry
├── App.jsx                      # Route configurations & user state management
├── components/
│   └── CollegeCard.jsx          # Reusable college presentation card with badges
├── hooks/
│   └── useChat.js               # Custom hook managing chat state and streaming
├── pages/
│   ├── LandingPage.jsx          # Public portal, hero carousel & featured campuses
│   ├── AuthPage.jsx             # Sign In / Sign Up tabs with custom branding
│   ├── ProfileForm.jsx          # Academic stream, exam & marks setup
│   ├── Dashboard.jsx            # Main recommendation center with left tools sidebar
│   ├── ChatPage.jsx             # AI Counselor conversation interface
│   └── CollegeDetailsPage.jsx   # Detailed branch cutoffs & placement analysis
├── styles/
│   └── theme.js                 # Theme palette constants
└── utils/
    └── scoreUtils.js            # Exam score formatters and unit converters
```

---

## 11. Installation, Configuration & Run Guide

### Prerequisites:
- **Node.js:** v18.0.0 or higher
- **Python:** v3.10 or higher
- **MongoDB:** Community Server running locally on port 27017, or a MongoDB Atlas connection string.
- **Google Gemini API Key:** Obtainable from [Google AI Studio](https://aistudio.google.com/).

### Step 1: Clone or Navigate to the Repository
```bash
cd C:\Users\OMPRASAD\.gemini\antigravity\scratch\hybrid-college-recommendation
```

### Step 2: Configure Environment Variables
Inside `backend/.env`:
```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-2.5-flash
MONGODB_URL=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=education_counsellor
PORT=8000
```

### Step 3: Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```
*Backend will start on [http://localhost:8000](http://localhost:8000).*

### Step 4: Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
*Frontend will start on [http://localhost:5173](http://localhost:5173).*

### Step 5: One-Click Startup (Windows)
Double-click `START.bat` in the root project folder to launch both backend and frontend servers simultaneously in separate terminal windows.

---

## 12. Future Roadmap & Enhancements

1. **CAP Round Option Form Generator:** Automatically generate an optimal, prioritized option form list for JoSAA or Maharashtra State CET cell based on historical allocation algorithms.
2. **Machine Learning Collaborative Filtering:** Incorporate historical allotment data from previous year candidates with similar rank profiles to predict percentile inflation and shift trends.
3. **SMS & WhatsApp Alerts:** Send automated notifications for cutoff release dates, merit list announcements, and document verification deadlines.
4. **Scholarship Matcher:** Automatically cross-reference family income, category, and academic merit with government scholarship portals (e.g., MahaDBT, NSP).

---

*Document compiled for the Education Counsellor project — 2026.*
