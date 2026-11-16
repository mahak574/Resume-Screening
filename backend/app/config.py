import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

DATA_DIR = BASE_DIR / "data"
SKILLS_DB_PATH = str(DATA_DIR / "skills_db.json")
SQLITE_DB_PATH = str(DATA_DIR / "candidates.db")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB_NAME = "resume_screening_ats"

DEFAULT_WEIGHTS = {
    "semantic_similarity": 0.25,
    "skill_match": 0.60,
    "experience_factor": 0.15
}
