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

_SKILL_EMBED_CACHE: Dict[str, np.ndarray] = {}

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
        "ci/cd": ["cicd", "continuous integration", "github actions", "jenkins"],
        "xgboost": ["xgb", "gradient boosting"],
        "xgb": ["xgboost"],
        "sbert": ["sentence-transformers", "sentence-bert"],
        "sentence-transformers": ["sbert", "sentence-bert"],
        "k-means": ["kmeans", "k-means clustering", "clustering"],
        "kmeans": ["k-means"]
    }

    def __init__(self):
        self._sbert_model = None
        self.categorizer = SkillCategorizer()

    def warmup(self):
        """Warm up SentenceTransformer model and pre-embed standard ontology for sub-millisecond scoring."""
        if self.model:
            import json, os
            try:
                base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
                skills_path = os.path.join(base_dir, "data", "skills_db.json")
                if os.path.exists(skills_path):
                    with open(skills_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    skills_to_embed = []
                    for cat_skills in data.values():
                        for s in cat_skills:
                            norm_s = normalize_skill(s)
                            if norm_s and norm_s not in _SKILL_EMBED_CACHE:
                                skills_to_embed.append(norm_s)
                    if skills_to_embed:
                        embs = self.model.encode(skills_to_embed, batch_size=64, show_progress_bar=False)
                        for s, emb in zip(skills_to_embed, embs):
                            _SKILL_EMBED_CACHE[s] = emb
                        print(f"SkillMatcher: Successfully cached {len(_SKILL_EMBED_CACHE)} skill embeddings.")
            except Exception as e:
                print(f"Skill pre-warmup warning: {e}")

    def get_skill_embedding(self, skill: str) -> Optional[np.ndarray]:
        clean = normalize_skill(skill)
        if not clean:
            return None
        if clean in _SKILL_EMBED_CACHE:
            return _SKILL_EMBED_CACHE[clean]
        if self.model:
            emb = self.model.encode(clean)
            _SKILL_EMBED_CACHE[clean] = emb
            return emb
        return None

    @property
    def model(self):
        """Lazy load SentenceTransformer model."""
        if self._sbert_model is None:
            try:
                import os
                os.environ.setdefault("HF_HUB_OFFLINE", "1")
                os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
                from sentence_transformers import SentenceTransformer
                self._sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception:
                try:
                    import os
                    os.environ.pop("HF_HUB_OFFLINE", None)
                    os.environ.pop("TRANSFORMERS_OFFLINE", None)
                    from sentence_transformers import SentenceTransformer
                    self._sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
                except Exception as e2:
                    print(f"Could not load SentenceTransformer: {e2}. Will use TF-IDF fallback.")
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
        Ultra-fast hybrid skill matching:
        1. Exact match (instant)
        2. Synonym match (instant)
        3. Reverse synonym match (instant)
        4. Vector cosine similarity (only for remaining unmatched skills, using cached embeddings)
        """
        norm_resume = [normalize_skill(s) for s in resume_skills if normalize_skill(s)]
        norm_job = [normalize_skill(s) for s in job_skills if normalize_skill(s)]

        matched = []
        unmatched_job = []
        resume_set = set(norm_resume)

        # 1. Exact match & Synonyms (0ms)
        for job_skill in norm_job:
            if job_skill in resume_set:
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
                if syn in resume_set:
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

            unmatched_job.append(job_skill)

        # 4. Semantic similarity fallback ONLY for remaining unmatched job skills
        missing = []
        if unmatched_job and norm_resume and self.model:
            # Batch encode any skills missing from cache
            uncached = [s for s in (unmatched_job + norm_resume) if s not in _SKILL_EMBED_CACHE]
            if uncached:
                try:
                    new_embs = self.model.encode(uncached, batch_size=32, show_progress_bar=False)
                    for s, emb in zip(uncached, new_embs):
                        _SKILL_EMBED_CACHE[s] = emb
                except Exception:
                    pass

            # Build resume embedding matrix from cache
            res_embs_list = [_SKILL_EMBED_CACHE[s] for s in norm_resume if s in _SKILL_EMBED_CACHE]
            if res_embs_list:
                res_matrix = np.array(res_embs_list)
                for job_skill in unmatched_job:
                    if job_skill in _SKILL_EMBED_CACHE:
                        j_emb = _SKILL_EMBED_CACHE[job_skill].reshape(1, -1)
                        sims = cosine_similarity(res_matrix, j_emb).flatten()
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
                    missing.append(job_skill)
            else:
                missing.extend(unmatched_job)
        else:
            missing.extend(unmatched_job)

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

