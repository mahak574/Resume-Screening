from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router as api_router

app = FastAPI(
    title="AI Resume Screening & Candidate Ranking API",
    description="Enterprise-ready ATS API powered by NLP, SBERT Embeddings & Hybrid Skill Matching",
    version="2.0.0"
)

# Enable CORS for React frontend (Vite defaults to port 5173, standard frontend ports allowed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "service": "AI Resume Screening API",
        "status": "online",
        "docs": "/docs"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

