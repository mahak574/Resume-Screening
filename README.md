# 🤖 ScreenAI ATS — Next-Gen AI Resume Screening & Candidate Ranking System

An enterprise-ready Applicant Tracking System (ATS) powered by **React**, **FastAPI**, and **Sentence-BERT NLP**. Designed for recruiters to rank candidate resumes against Job Descriptions, detect missing skills, perform multi-role matching, and generate outreach communications.

---

## 🚀 Key Improvements & Enterprise Architecture

1. **Decoupled Client-Server Architecture (React + FastAPI)**:
   - **Frontend**: Modern, responsive **React + Vite** SPA with clean dark glass UI, candidate spotlight cards, interactive shortlist threshold slider, skills gap breakdown, and outreach email composer.
   - **Backend**: High-throughput **FastAPI** asynchronous REST API with Swagger documentation at `/docs`.
2. **Synchronized Skills Ontology**:
   - Dynamic extraction loaded from [`data/skills_db.json`](file:///c:/Users/singh/OneDrive/Desktop/Projects/Resume-Screening/data/skills_db.json) (covering Programming, Web Frameworks, Cloud, DevOps, Databases, Data Science, Soft Skills, and Mobile).
   - Preserves special keywords like `C++`, `C#`, `.NET`, `Node.js`, and `CI/CD` without regex corruption.
3. **Optimized SBERT Vector Embeddings**:
   - Precomputes and reuses embedding vectors for Job Descriptions and resumes, eliminating redundant Transformer matrix calculations.
4. **Dual-Engine Persistence (Zero-Config SQLite + MongoDB)**:
   - Automatic SQLite fallback (`data/candidates.db`) ensures the application works immediately without requiring MongoDB to be installed.
   - Replicates to MongoDB whenever `MONGO_URI` is available.
5. **Multi-Role Candidate Fit Matcher**:
   - Compare a single candidate against 2–5 job descriptions simultaneously to find their best-fit role.
6. **Recruiter Outreach Email Generator**:
   - 1-click generation of personalized Interview Invitations or Constructive Feedback emails with direct links to learning resources.
7. **Customizable Scoring Weights**:
   - Sliders to fine-tune weights for **Skill Match**, **Semantic Similarity**, and **Experience Factor**.

---

## 📂 Project Structure

```text
Resume-Screening/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py         # REST endpoints (/screen, /screen/multi-jd, /candidates, /skills)
│   │   ├── core/
│   │   │   ├── nlp_engine.py     # NLP pipeline, keyword preservation, ontology matching
│   │   │   ├── pdf_processor.py  # Text extraction (PDF/DOCX), name, phone & date-range experience
│   │   │   ├── skill_matcher.py  # SBERT embeddings & hybrid similarity matcher
│   │   │   └── skill_categories.py # Categorizes skills into domains
│   │   ├── db/
│   │   │   └── database.py       # Dual-mode SQLite + MongoDB persistence
│   │   ├── schemas/
│   │   │   └── candidate.py      # Pydantic models
│   │   ├── config.py             # Configs & paths
│   │   └── main.py               # FastAPI entry point & CORS
│   ├── run.py                    # Uvicorn server launcher
│   └── requirements.txt          # Backend dependencies
│
├── frontend/                     # React + Vite Client
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ScreenResumesTab.jsx
│   │   │   ├── MultiJdTab.jsx
│   │   │   ├── CandidateHistoryTab.jsx
│   │   │   ├── CandidateDetailModal.jsx
│   │   │   ├── SkillsGapModal.jsx
│   │   │   ├── WeightSettingsModal.jsx
│   │   │   └── EmailGeneratorModal.jsx
│   │   ├── services/
│   │   │   └── api.js            # Axios client
│   │   ├── App.jsx
│   │   └── index.css             # Design system
│   ├── package.json
│   └── vite.config.js
│
├── data/
│   ├── skills_db.json            # Central skills taxonomy
│   └── candidates.db             # Local SQLite database
├── tests/
│   └── test_engine.py            # Comprehensive test suite
├── app.py                        # Original Streamlit app (kept for legacy support)
└── README.md
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm

### 2. Start the FastAPI Backend
```bash
# From the project root
.\.venv\Scripts\python backend/run.py
```
> The API will be live at: **`http://localhost:8000`**  
> Interactive API Docs: **`http://localhost:8000/docs`**

### 3. Start the React Frontend
```bash
cd frontend
npm run dev
```
> Open your browser at: **`http://localhost:5173`**

---

## 🧪 Running Tests
To verify all core NLP, PDF processing, skill matching, and database modules:
```bash
.\.venv\Scripts\python tests/test_engine.py
```

---

## 📡 API Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/screen` | Batch resume screening against a JD with custom weights and threshold |
| `POST` | `/api/screen/multi-jd` | Compare 1 candidate across 2 to 5 job roles |
| `GET` | `/api/candidates` | List screened candidates with search & filter |
| `DELETE` | `/api/candidates/{id}` | Remove a candidate record |
| `GET` | `/api/analytics` | Summary stats (total screened, average score, top skills) |
| `GET` | `/api/skills` | Returns skills taxonomy and learning resource links |
| `POST` | `/api/generate-email` | Generates personalized outreach emails |
