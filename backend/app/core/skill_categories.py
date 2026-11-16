import json
import os
from typing import Dict, List
from ..config import SKILLS_DB_PATH

class SkillCategorizer:
    def __init__(self, skills_db_path: str = SKILLS_DB_PATH):
        self.skills_db_path = skills_db_path
        self.skills_db: Dict[str, List[str]] = {}
        self.skill_to_category: Dict[str, str] = {}
        self._load_and_index()

    def _load_and_index(self):
        if os.path.exists(self.skills_db_path):
            try:
                with open(self.skills_db_path, "r", encoding="utf-8") as f:
                    self.skills_db = json.load(f)
                    for category, skills in self.skills_db.items():
                        for skill in skills:
                            self.skill_to_category[skill.lower().strip()] = category
            except Exception as e:
                print(f"Error indexing skills_db: {e}")

    def categorize_skills(self, skills: List[str]) -> Dict[str, List[str]]:
        """Groups a list of skills into their categories, universally supporting dynamic domain skills."""
        categorized: Dict[str, List[str]] = {cat: [] for cat in self.skills_db.keys()}
        categorized["domain_competencies"] = []

        for skill in skills:
            s_clean = skill.lower().strip()
            # 1. Exact match in index
            if s_clean in self.skill_to_category:
                cat = self.skill_to_category[s_clean]
                categorized[cat].append(skill)
                continue

            # 2. Substring match
            matched = False
            for known_skill, cat in self.skill_to_category.items():
                if known_skill in s_clean or s_clean in known_skill:
                    categorized[cat].append(skill)
                    matched = True
                    break

            if not matched:
                categorized["domain_competencies"].append(skill)

        # Return only categories that have skills
        return {cat: sorted(list(set(items))) for cat, items in categorized.items() if items}

