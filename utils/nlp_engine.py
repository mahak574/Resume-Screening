import json
import re
import os
from typing import List, Set, Dict

SKILLS_DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "skills_db.json")

SPECIAL_TECH_REPLACEMENTS = {
    r'\bc\+\+\b': 'cpp',
    r'\bc#\b': 'csharp',
    r'\b\.net\b': 'dotnet',
    r'\bnode\.js\b': 'nodejs',
    r'\bvue\.js\b': 'vuejs',
    r'\breact\.js\b': 'reactjs',
    r'\bci\/cd\b': 'cicd',
}

def load_skills_database() -> Set[str]:
    skills = set()
    if os.path.exists(SKILLS_DB_PATH):
        try:
            with open(SKILLS_DB_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for cat, skill_list in data.items():
                    for s in skill_list:
                        skills.add(s.strip().lower())
        except Exception as e:
            print(f"Error reading skills_db.json: {e}")
    if not skills:
        skills = {
            "python", "java", "c++", "c#", "javascript", "typescript", "html", "css",
            "sql", "nosql", "mongodb", "mysql", "postgresql", "react", "angular", "vue",
            "node.js", "django", "flask", "fastapi", "spring boot", "aws", "azure", "gcp",
            "docker", "kubernetes", "machine learning", "nlp", "pandas", "numpy", "git"
        }
    return skills

ALL_SKILLS = load_skills_database()

def preprocess_text(text: str) -> str:
    """Cleans and preprocesses text while preserving special tech symbols."""
    if not text:
        return ""
    clean = text.lower()
    for pat, rep in SPECIAL_TECH_REPLACEMENTS.items():
        clean = re.sub(pat, rep, clean, flags=re.IGNORECASE)
    clean = re.sub(r'[^a-zA-Z\s]', ' ', clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

def extract_skills(text: str) -> List[str]:
    """Extracts skills from text matching against the full skills ontology."""
    if not text:
        return []
    text_lower = text.lower()
    found = set()
    for skill in ALL_SKILLS:
        s_clean = skill.strip().lower()
        if any(ch in s_clean for ch in ['+', '#', '.', '/']):
            escaped = re.escape(s_clean)
            if re.search(rf'(?:(?<=[\s,;\(])|^){escaped}(?=[,\s\.;\)]|$)', text_lower):
                found.add(s_clean)
        else:
            escaped = re.escape(s_clean)
            if re.search(rf'\b{escaped}\b', text_lower):
                found.add(s_clean)
    return sorted(list(found))

def identify_missing_skills(resume_skills: List[str], jd_skills: List[str]) -> List[str]:
    cand_set = {s.lower().strip() for s in resume_skills}
    return [s for s in jd_skills if s.lower().strip() not in cand_set]

def explain_match(matched_skills: List[str], jd_skills: List[str]) -> str:
    matched = list(matched_skills) if matched_skills else []
    jd = list(jd_skills) if jd_skills else []
    if not jd:
        return "No specific skills detected in Job Description."
    pct = len(matched) / len(jd) * 100
    res = f"Matched {len(matched)} of {len(jd)} key skills ({pct:.0f}%)."
    if matched:
        res += f" Strongest matches: {', '.join(matched[:3])}."
    return res
