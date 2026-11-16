import re
import numpy as np
from typing import List, Dict, Any, Optional
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from .skill_categories import SkillCategorizer
from ..config import DEFAULT_WEIGHTS

def normalize_skill(skill: str) -> str:
    """Normalize skill string for uniform comparison."""
    clean = skill.lower().strip()
    return clean

class SkillMatcher:
    # Rich synonym & alias dictionary
    SKILL_SYNONYMS = {
        "javascript": ["js", "es6", "ecmascript"],
        "js": ["javascript", "es6"],
        "typescript": ["ts"],
        "ts": ["typescript"],
        "python": ["py", "python3"],
        "py": ["python"],
        "c++": ["cpp"],
        "cpp": ["c++"],
        "c#": ["csharp", ".net c#"],
        "csharp": ["c#"],
        "sql": ["sql server", "mysql", "postgresql", "rdbms", "tsql"],
        "mongodb": ["nosql", "mongo"],
        "postgresql": ["postgres", "psql"],
        "react": ["react.js", "reactjs"],
        "vue": ["vue.js", "vuejs"],
        "angular": ["angular.js", "angularjs"],
        "node.js": ["nodejs", "node"],
        "nodejs": ["node.js", "node"],
        "docker": ["containerization", "containers"],
        "kubernetes": ["k8s"],
        "k8s": ["kubernetes"],
        "aws": ["amazon web services", "aws cloud"],
        "gcp": ["google cloud", "google cloud platform"],
        "machine learning": ["ml", "applied ml"],
        "ml": ["machine learning"],
        "deep learning": ["dl", "neural networks"],
        "nlp": ["natural language processing", "text mining"],
        "ci/cd": ["cicd", "continuous integration", "github actions", "jenkins"]
    }

    def __init__(self):
        self._sbert_model = None
        self.categorizer = SkillCategorizer()

    @property
    def model(self):
        """Lazy load SentenceTransformer model."""
        if self._sbert_model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                print(f"Could not load SentenceTransformer: {e}. Will use TF-IDF fallback.")
                self._sbert_model = False
        return self._sbert_model

    def get_embedding(self, text: str) -> Optional[np.ndarray]:
        """Generate embedding vector for a single text."""
        if self.model:
            return self.model.encode(text)
        return None

    def get_embeddings(self, texts: List[str]) -> Optional[np.ndarray]:
        """Generate embeddings array for a list of texts."""
        if not texts:
            return None
        if self.model:
            return self.model.encode(texts)
        return None

    def calculate_similarity_from_embeddings(self, emb_a: np.ndarray, emb_b: np.ndarray) -> float:
        """Fast cosine similarity between two precomputed embeddings."""
        if emb_a is None or emb_b is None:
            return 0.0
        vec_a = emb_a.reshape(1, -1)
        vec_b = emb_b.reshape(1, -1)
        sim = float(cosine_similarity(vec_a, vec_b)[0][0])
        return max(0.0, min(1.0, sim))

    def calculate_similarity_texts(self, text_a: str, text_b: str) -> float:
        """
        Calculate semantic similarity between two texts.
        Uses SBERT if available; falls back to TF-IDF cosine similarity.
        """
        if not text_a.strip() or not text_b.strip():
            return 0.0

        if self.model:
            emb_a = self.get_embedding(text_a)
            emb_b = self.get_embedding(text_b)
            return self.calculate_similarity_from_embeddings(emb_a, emb_b)
        else:
            # TF-IDF Fallback
            try:
                vectorizer = TfidfVectorizer().fit([text_a, text_b])
                vecs = vectorizer.transform([text_a, text_b])
                sim = float(cosine_similarity(vecs[0], vecs[1])[0][0])
                return max(0.0, min(1.0, sim))
            except Exception:
                return 0.0

    def match_skills(
        self, 
        resume_skills: List[str], 
        job_skills: List[str], 
        threshold: float = 0.65
    ) -> Dict[str, Any]:
        """
        Hybrid matching:
        1. Exact match
        2. Synonym lookup
        3. Reverse synonym
        4. SBERT embedding semantic similarity
        """
        norm_resume = [normalize_skill(s) for s in resume_skills]
        norm_job = [normalize_skill(s) for s in job_skills]

        matched = []
        missing = []

        # Precompute embeddings only once if SBERT is active and there are items
        resume_embs = self.get_embeddings(norm_resume) if (self.model and norm_resume) else None
        job_embs = self.get_embeddings(norm_job) if (self.model and norm_job) else None

        for j_idx, job_skill in enumerate(norm_job):
            # 1. Exact match
            if job_skill in norm_resume:
                matched.append({
                    "skill": job_skill,
                    "type": "exact",
                    "score": 1.0,
                    "matched_with": job_skill
                })
                continue

            # 2. Synonym match
            syns = self.SKILL_SYNONYMS.get(job_skill, [])
            syn_found = False
            for syn in syns:
                if syn in norm_resume:
                    matched.append({
                        "skill": job_skill,
                        "type": "synonym",
                        "score": 0.92,
                        "matched_with": syn
                    })
                    syn_found = True
                    break
            if syn_found:
                continue

            # 3. Reverse synonym match
            rev_found = False
            for res_skill in norm_resume:
                if job_skill in self.SKILL_SYNONYMS.get(res_skill, []):
                    matched.append({
                        "skill": job_skill,
                        "type": "reverse_synonym",
                        "score": 0.88,
                        "matched_with": res_skill
                    })
                    rev_found = True
                    break
            if rev_found:
                continue

            # 4. Semantic similarity fallback
            if resume_embs is not None and job_embs is not None:
                sims = cosine_similarity(resume_embs, [job_embs[j_idx]]).flatten()
                best_idx = int(np.argmax(sims))
                best_score = float(sims[best_idx])
                if best_score >= threshold:
                    matched.append({
                        "skill": job_skill,
                        "type": "semantic",
                        "score": round(best_score, 2),
                        "matched_with": norm_resume[best_idx]
                    })
                    continue

            # 5. If no match
            missing.append(job_skill)

        match_percentage = (len(matched) / len(norm_job) * 100.0) if norm_job else 0.0

        return {
            "matched": matched,
            "missing": missing,
            "match_percentage": round(match_percentage, 1)
        }

    def calculate_composite_score(
        self, 
        components: Dict[str, float], 
        custom_weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Calculates weighted total score from components:
        - semantic_similarity (0-1)
        - skill_match (0-1)
        - experience_factor (0-1)
        """
        weights = DEFAULT_WEIGHTS.copy()
        if custom_weights:
            weights.update(custom_weights)

        # Normalize weights so they sum to 1.0
        total_w = sum(weights.values()) or 1.0
        norm_weights = {k: v / total_w for k, v in weights.items()}

        total_score = (
            components.get("semantic_similarity", 0.0) * norm_weights["semantic_similarity"] +
            components.get("skill_match", 0.0) * norm_weights["skill_match"] +
            components.get("experience_factor", 0.0) * norm_weights["experience_factor"]
        )

        return {
            "total_score": round(min(100.0, max(0.0, total_score * 100.0)), 1),
            "breakdown": {
                "semantic_score": round(components.get("semantic_similarity", 0.0) * 100, 1),
                "skill_score": round(components.get("skill_match", 0.0) * 100, 1),
                "experience_score": round(components.get("experience_factor", 0.0) * 100, 1),
            },
            "applied_weights": norm_weights
        }

