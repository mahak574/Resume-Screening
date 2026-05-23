import json
from typing import Dict, List

class SkillCategorizer:
    def __init__(self, skills_db_path: str = "data/skills_db.json"):
        with open(skills_db_path, 'r') as f:
            self.skills_db = json.load(f)
        self.skill_categories = {}
        self._build_skill_index()
    
    def _build_skill_index(self):
        """Create searchable skill index"""
        for category, skills in self.skills_db.items():
            for skill in skills:
                self.skill_categories[skill] = category
    
    def categorize_skills(self, skills: List[str]) -> Dict[str, List[str]]:
        """Categorize extracted skills"""
        categorized = {cat: [] for cat in self.skills_db.keys()}
        
        for skill in skills:
            # Fuzzy matching (simple substring match)
            matched_category = None
            for known_skill, category in self.skill_categories.items():
                if known_skill in skill or skill in known_skill:
                    categorized[category].append(skill)
                    matched_category = category
                    break
            
            # If no exact match, try partial matching
            if not matched_category:
                for known_skill, category in self.skill_categories.items():
                    if any(word in skill for word in known_skill.split()):
                        categorized[category].append(skill)
                        break
        
        return {k: list(set(v)) for k, v in categorized.items() if v}