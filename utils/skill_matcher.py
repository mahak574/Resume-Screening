from sentence_transformers import SentenceTransformer, util
from typing import List, Dict
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import re


def normalize_skill(skill: str) -> str:
    """Normalize skill text"""
    return re.sub(r'[^\w\s]', '', skill.lower().strip())


class SkillMatcher:

    # Synonym dictionary
    SKILL_SYNONYMS = {
        "javascript": ["js"],
        "js": ["javascript"],
        "sql": ["sql server", "mysql"],
        "sql server": ["sql"],
        "mysql": ["sql"],
        "html": ["html5", "frontend"],
        "css": ["css3", "frontend"],
        "python": ["py"],
        "wordpress": ["wp"],
    }

    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.categorizer = None

    def load_categorizer(self, skills_db_path: str):
        """Load skill categorizer"""
        from .skill_categories import SkillCategorizer
        self.categorizer = SkillCategorizer(skills_db_path)

    def get_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for texts"""
        return self.model.encode(texts)

    def calculate_similarity(self, resume_text: str, job_desc: str) -> float:
        """Semantic similarity between full texts"""
        embeddings = self.get_embeddings([resume_text, job_desc])
        similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return float(similarity)

    def match_skills(self, resume_skills: List[str], job_skills: List[str], threshold=0.6) -> Dict:
        """Hybrid skill matching: exact + synonym + embedding"""

        resume_skills = [normalize_skill(s) for s in resume_skills]
        job_skills = [normalize_skill(s) for s in job_skills]

        matched = []
        missing = []

        # Precompute embeddings (only once)
        resume_emb = self.get_embeddings(resume_skills) if resume_skills else None
        job_emb = self.get_embeddings(job_skills) if job_skills else None

        for j_idx, job_skill in enumerate(job_skills):
            found = False

            # 1. Exact match
            if job_skill in resume_skills:
                matched.append({
                    "skill": job_skill,
                    "type": "exact",
                    "score": 1.0
                })
                continue

            # 2. Synonym match
            synonyms = self.SKILL_SYNONYMS.get(job_skill, [])
            for syn in synonyms:
                if syn in resume_skills:
                    matched.append({
                        "skill": job_skill,
                        "type": "synonym",
                        "score": 0.9
                    })
                    found = True
                    break

            if found:
                continue

            # 3. Reverse synonym match
            for res_skill in resume_skills:
                if job_skill in self.SKILL_SYNONYMS.get(res_skill, []):
                    matched.append({
                        "skill": job_skill,
                        "type": "reverse_synonym",
                        "score": 0.85
                    })
                    found = True
                    break

            if found:
                continue

            # 4. Embedding similarity (fallback)
            if resume_emb is not None and job_emb is not None:
                similarities = util.cos_sim(resume_emb, job_emb)
                best_idx = int(np.argmax(similarities[:, j_idx]))
                best_score = float(similarities[best_idx, j_idx])

                if best_score >= threshold:
                    matched.append({
                        "skill": job_skill,
                        "type": "semantic",
                        "score": round(best_score, 3),
                        "matched_with": resume_skills[best_idx]
                    })
                    continue

            # 5. If nothing matched
            missing.append(job_skill)

        match_percentage = (len(matched) / len(job_skills)) * 100 if job_skills else 0

        return {
            "matched": matched,
            "missing": missing,
            "match_percentage": round(match_percentage, 2)
        }

    def calculate_composite_score(self, components: Dict) -> Dict:
        """Weighted composite score (FIXED WEIGHTS)"""

        weights = {
            "semantic_similarity": 0.25,
            "skill_match": 0.60,
            "experience_factor": 0.15
        }

        total_score = (
            components.get("semantic_similarity", 0) * weights["semantic_similarity"] +
            components.get("skill_match", 0) * weights["skill_match"] +
            components.get("experience_factor", 0) * weights["experience_factor"]
        )

        return {
            "total_score": round(total_score * 100, 2),
            "breakdown": components,
            "rank": None
        }