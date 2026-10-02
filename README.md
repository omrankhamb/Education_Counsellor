# 🎓 Education Counsellor — AI-Powered College Recommendation Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Bootstrap](https://img.shields.io/badge/UI-Bootstrap%205-7952B3?style=flat&logo=bootstrap)](https://getbootstrap.com/)
[![Google Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An intelligent, full-stack educational counseling platform designed for Indian students across all streams (Engineering, Medical, Science, Commerce, Arts, Law, Design). Powered by **Google Gemini AI**, the system delivers live personalized college recommendations, dynamic domain/branch-wise cutoffs, admission feasibility analytics, and an interactive conversational AI admission counselor.

---

## 🌟 Key Features

### 1. 🎯 Dynamic Student Dashboard
* **Instant Eligibility Calculation**: Evaluates your percentage or entrance exam score (JEE Main, NEET, MHT-CET, CUET, 12th %) and categorizes matching colleges into **Safe & Eligible (✅)**, **Borderline Target (⚠️)**, and **Aspirational (❌)**.
* **Smart Filter & Search**: Search colleges in real-time by name, city, stream, government vs. private status, or sort by cutoff percentiles and ratings.
* **Persistent Profile**: Retains student information across sessions via client-side storage.

### 2. 📊 Domain & Branch-Wise Cutoff Breakdown (New!)
* **Specialization-Specific Cutoffs**: Colleges don't have a single cutoff! View detailed cutoff tables broken down by domain (e.g., Computer Engineering vs. AI/Data Science vs. Mechanical vs. Civil).
* **Category Breakdown**: View cutoffs across General, OBC, SC, and ST categories.
* **"Eligible Branches Only" Filter**: One-click filter to instantly see which branches you can realistically get with your score.

### 3. ⭐ Marked Key Performance & Institutional Intelligence
* **Marked Badges & Points**: Highlighting Elite Heritage, Highest CTC, DTE Centralized Admission Codes (e.g., DTE Code 6006), and Hostel/Campus Infrastructure.
* **Placement Metrics**: Average and highest CTC packages along with prominent multinational recruiters (Google, Microsoft, Tata Motors, L&T, etc.).
* **Step-by-Step CAP Admission Roadmap**: Clear 5-step numbered guide from DTE portal registration to campus reporting.

### 4. 🤖 Interactive AI Counselor Chat
* **Formatted Markdown Data Tables**: Multi-year cutoff trends and college comparisons rendered in styled, responsive data tables.
* **Pro-Tip & Notice Callouts**: Custom highlight boxes for critical admission strategies and application deadlines.
* **Education-Only Guardrails**: Dedicated prompt guardrails that keep counseling discussions focused strictly on academics, careers, and colleges.
* **Follow-up Suggestions**: Smart prompt chips for one-click follow-up queries.

### 5. 🏛️ First Page Showcase
* Hero Carousel / Slider highlighting platform features.
* Stream-filtered college showcase previewing verified campus imagery, ratings, and fees without requiring login.

---

## 🛠️ Tech Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite, React Router DOM v6, Bootstrap 5, React-Bootstrap, React Icons, React-Markdown, Remark-GFM |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic v2 |
| **AI Engine** | Google Gemini AI (`google-genai` SDK) with multi-model fallback cascade |
| **Styling & Icons** | Custom Theme, Bootstrap 5, React Icons (`FaGraduationCap`, `FaUserGraduate`, `FaHeadset`, etc.) |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher)
* **Python** (v3.10 or higher)
* **Google Gemini API Key** (Get free key from [Google AI Studio](https://aistudio.google.com/))

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/education-counsellor.git
cd education-counsellor
```

---

### Step 2: Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   python -m pip install -r requirements.txt
   ```

4. Create a `.env` file in the `backend/` folder and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   APP_NAME=Education Counsellor
   DEBUG=True
   ```

5. Start the FastAPI backend server:
   ```bash
   python main.py
   ```
   * Backend will be live at: `http://localhost:8000`
   * Interactive API documentation (Swagger): `http://localhost:8000/docs`

---

### Step 3: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   * Frontend will be live at: `http://localhost:5173`

---

## 📂 Project Architecture

```
education-counsellor/
├── backend/
│   ├── main.py                          # FastAPI application entrypoint with CORS
│   ├── config.py                        # Gemini model config & system prompt
│   ├── models.py                        # Pydantic data schemas
│   ├── requirements.txt                 # Python dependencies
│   ├── .env                             # Environment variables (API Keys)
│   ├── routes/
│   │   ├── chat.py                      # /api/chat endpoint
│   │   └── recommend.py                 # /api/recommend, /featured-colleges, /college-details
│   └── services/
│       ├── gemini_service.py            # Async chat service with non-blocking executor
│       ├── recommender.py               # Live recommendation engine with stream catalogs
│       └── college_details_service.py   # Domain & branch cutoffs and performance metrics
│
├── frontend/
│   ├── index.html                       # HTML template with Google Fonts (Poppins & Inter)
│   ├── vite.config.js                   # Vite config with backend API proxy
│   ├── package.json                     # Frontend scripts and dependencies
│   └── src/
│       ├── main.jsx                     # App entry point with Bootstrap CSS & JS bundle
│       ├── App.jsx                      # React Router route definitions
│       ├── components/
│       │   └── CollegeCard.jsx          # Reusable rich college card component
│       ├── hooks/
│       │   └── useChat.js               # Chat state hook with timeout safeguards
│       └── pages/
│           ├── LandingPage.jsx          # First page: Header, Carousel Slider & Featured Cards
│           ├── ProfileForm.jsx          # Student Login / Admission Profile Form
│           ├── Dashboard.jsx            # Student Recommendation Dashboard
│           ├── CollegeDetailsPage.jsx   # Dedicated Domain Cutoffs & Performance Page
│           └── ChatPage.jsx             # Full-screen AI Counselor Chat
└── README.md
```

---

## 🛡️ License

This project is licensed under the **MIT License** — feel free to use it for educational and non-commercial development.

---

## 💡 Acknowledgments

* Powered by **Google Gemini AI**
* Built with **FastAPI** and **React**
* Inspired by the need for accessible, transparent higher education counseling for every Indian student.
