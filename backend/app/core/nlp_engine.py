import json
import re
import os
from typing import List, Set, Dict, Optional
from ..config import SKILLS_DB_PATH

# Replacement mapping for preserving technical symbols
SPECIAL_TECH_REPLACEMENTS = {
    r'\bc\+\+\b': 'cpp',
    r'\bc#\b': 'csharp',
    r'\b\.net\b': 'dotnet',
    r'\bnode\.js\b': 'nodejs',
    r'\bvue\.js\b': 'vuejs',
    r'\breact\.js\b': 'reactjs',
    r'\bci\/cd\b': 'cicd',
}

REVERSE_TECH_REPLACEMENTS = {
    'cpp': 'c++',
    'csharp': 'c#',
    'dotnet': '.net',
    'nodejs': 'node.js',
    'vuejs': 'vue.js',
    'reactjs': 'react.js',
    'cicd': 'ci/cd',
}

class NLPEngine:
    def __init__(self, skills_db_path: str = SKILLS_DB_PATH):
        self.skills_db_path = skills_db_path
        self.all_skills: Set[str] = set()
        self.skills_by_category: Dict[str, List[str]] = {}
        self._load_skills()

    def _load_skills(self):
        """Loads all skills dynamically from skills_db.json."""
        if os.path.exists(self.skills_db_path):
            try:
                with open(self.skills_db_path, "r", encoding="utf-8") as f:
                    self.skills_by_category = json.load(f)
                    for cat, skills in self.skills_by_category.items():
                        for s in skills:
                            self.all_skills.add(s.strip().lower())
            except Exception as e:
                print(f"Error loading skills_db.json: {e}")
        
        # Fallback essentials if file was empty
        if not self.all_skills:
            self.all_skills = {
                "python", "java", "c++", "c#", "javascript", "typescript", "html", "css",
                "sql", "nosql", "mongodb", "mysql", "postgresql", "react", "angular", "vue",
                "node.js", "django", "flask", "fastapi", "spring boot", "aws", "azure", "gcp",
                "docker", "kubernetes", "machine learning", "nlp", "deep learning", "git"
            }

    def preprocess_text(self, text: str) -> str:
        """
        Cleans text while preserving technical keywords (C++, C#, .NET, etc.).
        """
        if not text:
            return ""

        clean = text.lower()
        # Protect special symbols
        for pattern, replacement in SPECIAL_TECH_REPLACEMENTS.items():
            clean = re.sub(pattern, replacement, clean, flags=re.IGNORECASE)

        # Remove punctuation except letters and spaces
        clean = re.sub(r'[^a-zA-Z\s]', ' ', clean)
        # Collapse multiple spaces
        clean = re.sub(r'\s+', ' ', clean).strip()

        # Simple fast stopword filtering
        common_stops = {
            'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
            'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'did', 'do',
            'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have',
            'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in',
            'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not',
            'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over',
            'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs',
            'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
            'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while',
            'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
        }

        tokens = [word for word in clean.split() if word not in common_stops and len(word) > 1]
        return " ".join(tokens)

    def extract_skills(self, text: str, additional_skills: Optional[List[str]] = None) -> List[str]:
        """
        Universal & Domain-Agnostic Skill Extractor:
        1. Known Ontology Matching: Fast lookup across indexed technical/industry skills.
        2. Dynamic Acronym & Full-Form Pairs: Detects 'Search Engine Optimization (SEO)', 'Sentence-Transformers (SBERT)'.
        3. Dynamic Section Extraction: Automatically parses SKILLS / CORE COMPETENCIES / EXPERTISE sections across any domain.
        4. Target JD Skills Injection: Automatically guarantees any skills specified in the JD are verified in the candidate text.
        """
        if not text:
            return []

        text_lower = text.lower()
        found_skills = set()

        # 1. Base ontology search
        search_skills = set(self.all_skills)
        if additional_skills:
            for s in additional_skills:
                if s and s.strip():
                    search_skills.add(s.strip().lower())

        for skill in search_skills:
            normalized_skill = skill.lower().strip()
            # Handle special symbols like c++, c#, .net, ci/cd, scikit-learn, k-means
            if any(ch in normalized_skill for ch in ['+', '#', '.', '/', '-']):
                escaped = re.escape(normalized_skill)
                pattern = r'(?:(?<=[\s,;\(\[])|^)' + escaped + r'(?=[,\s\.;\)\]]|$)'
                if re.search(pattern, text_lower):
                    found_skills.add(normalized_skill)
            else:
                escaped = re.escape(normalized_skill)
                if re.search(rf'\b{escaped}\b', text_lower):
                    found_skills.add(normalized_skill)

        # 2. Dynamic Acronym Extraction: Full Name (ACRONYM)
        for m in re.finditer(r'\b([A-Za-z][A-Za-z\s-]{2,35})\s*\(([A-Za-z0-9\+]{2,10})\)', text):
            phrase = m.group(1).strip().lower()
            acronym = m.group(2).strip().lower()
            if len(phrase) > 2 and len(phrase) <= 40:
                found_skills.add(phrase)
                found_skills.add(acronym)

        # 3. Dynamic Section Extraction: SKILLS / CORE COMPETENCIES / REQUIREMENTS
        section_pattern = r'(?:^|\n)\s*(?:TECHNICAL SKILLS|CORE COMPETENCIES|KEY COMPETENCIES|AREAS OF EXPERTISE|PROFICIENCIES|SKILLS|KEY SKILLS|REQUIREMENTS|QUALIFICATIONS)\b\s*[:\n]?(.*?)(?=(?:\n\s*(?:EXPERIENCE|WORK EXPERIENCE|EDUCATION|PROJECTS|CERTIFICATIONS|PUBLICATIONS|AWARDS|DECLARATION|RESPONSIBILITIES|BENEFITS|ABOUT US)\b)|\Z)'
        match = re.search(section_pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            raw_section = match.group(1)
            for line in raw_section.split('\n'):
                line = line.strip()
                if not line:
                    continue
                # If line has a category prefix (e.g. 'ML & AI: Python, PyTorch'), extract skills from prefix too
                if ':' in line:
                    prefix, rest = line.split(':', 1)
                    for word in re.findall(r'[A-Za-z\+]{2,}', prefix):
                        w_lower = word.lower()
                        if w_lower in search_skills or w_lower in ['ml', 'ai', 'devops', 'cloud']:
                            found_skills.add(w_lower)
                    line = rest
                # Split on delimiters: commas, bullets, vertical bars, semicolons
                items = re.split(r'[,|•;]', line)
                for item in items:
                    clean_item = re.sub(r'\(.*?\)', '', item).strip().lower()
                    clean_item = re.sub(r'^[•\-\*]\s*', '', clean_item).strip()
                    # Filter junk or headers
                    if 2 <= len(clean_item) <= 40 and not any(clean_item.startswith(x) for x in ['http', 'www', 'phone', 'email']):
                        # Split compound slashes like Git/GitHub -> Git, GitHub
                        if '/' in clean_item and not clean_item.startswith('ci/cd'):
                            for sub in clean_item.split('/'):
                                sub_clean = sub.strip()
                                if 2 <= len(sub_clean) <= 40:
                                    found_skills.add(sub_clean)
                        else:
                            found_skills.add(clean_item)

        return sorted(list(found_skills))

    def identify_missing_skills(self, candidate_skills: List[str], required_skills: List[str]) -> List[str]:
        cand_set = {s.lower().strip() for s in candidate_skills}
        return [s for s in required_skills if s.lower().strip() not in cand_set]

    def explain_match(self, matched_skills: List[str], required_skills: List[str]) -> str:
        if not required_skills:
            return "No specific required skills identified in the Job Description."
        
        pct = (len(matched_skills) / len(required_skills)) * 100 if required_skills else 0
        summary = f"Matched {len(matched_skills)} of {len(required_skills)} target skills ({pct:.0f}%)."
        if matched_skills:
            summary += f" Strongest matches: {', '.join(matched_skills[:4])}."
        return summary
