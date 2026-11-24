import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router as api_router, skill_matcher

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Prime SBERT engine in a non-blocking daemon thread so the server is instantly available
    threading.Thread(target=skill_matcher.warmup, daemon=True).start()
    yield

app = FastAPI(
    title="AI Resume Screening & Candidate Ranking API",
    description="Enterprise-ready ATS API powered by NLP, SBERT Embeddings & Hybrid Skill Matching",
    version="2.0.0",
    lifespan=lifespan
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

@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {
        "service": "AI Resume Screening API",
        "status": "online",
        "docs": "/docs"
    }

@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"status": "healthy"}

