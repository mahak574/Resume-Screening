import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.nlp_engine import NLPEngine
from backend.app.core.pdf_processor import parse_candidate_info
from backend.app.core.skill_matcher import SkillMatcher
from backend.app.db.database import Database

def test_nlp_engine():
    engine = NLPEngine()
    sample_text = """
    John Doe
    Full Stack Developer with 4 years of experience.
    Proficient in Python, C++, C#, .NET, FastAPI, React, Docker, Kubernetes, and PostgreSQL.
    """
    skills = engine.extract_skills(sample_text)
    print("Extracted Skills:", skills)
    
    assert "c++" in skills, "C++ should be detected"
    assert "c#" in skills, "C# should be detected"
    assert ".net" in skills, ".NET should be detected"
    assert "fastapi" in skills, "FastAPI should be detected"
    assert "react" in skills, "React should be detected"
    assert "docker" in skills, "Docker should be detected"
    print("NLP Engine test PASSED!")

def test_pdf_processor():
    sample_resume = """
    Priya Sharma
    Email: priya.sharma@example.com
    Phone: +91 9876543210
    LinkedIn: linkedin.com/in/priyasharma
    GitHub: github.com/priyasharma

    Professional Experience
    2020 - 2024: Senior Software Engineer at TechCorp
    """
    info = parse_candidate_info(sample_resume, fallback_name="Candidate")
    print("Parsed Info:", info)
    assert info["name"] == "Priya Sharma", f"Expected Priya Sharma, got {info['name']}"
    assert info["email"] == "priya.sharma@example.com"
    assert "9876543210" in info["phone"]
    assert info["years_experience"] == 4.0, f"Expected 4.0 years, got {info['years_experience']}"

    # Test student/intern resume (Mahak Singh)
    mahak_resume = """
    MAHAK SINGH
    Sonipat, Haryana | +91 8505972309 | mahaks2402@gmail.com | LinkedIn | GitHub
    SUMMARY
    Computer Science undergraduate with hands-on experience in machine learning.
    EDUCATION
    Deenbandhu Chhotu Ram University of Science and Technology 2023 – 2027
    B.Tech, Computer Science Engineering | Sonipat, Haryana
    Saraswati Shiksha Sansthan Senior Secondary School 2022 – 2023
    Class XII | 90% | Sonipat, Haryana
    EXPERIENCE
    Data Science & ML Intern | Centre for Railway Information Systems Jul 2026 – Present
    TECHNICAL SKILLS
    Python, FastAPI, React
    PROJECTS
    1. Aditya-L1 2026
    """
    mahak_info = parse_candidate_info(mahak_resume, fallback_name="Mahak")
    print("Mahak Parsed Info:", mahak_info)
    assert mahak_info["name"] == "Mahak Singh"
    assert mahak_info["years_experience"] < 1.0, f"Expected intern experience < 1.0 year, but got {mahak_info['years_experience']}"
    print("PDF Processor test PASSED!")

def test_skill_matcher():
    matcher = SkillMatcher()
    resume_skills = ["python", "fastapi", "react", "postgresql"]
    jd_skills = ["python", "fastapi", "docker", "aws"]
    
    match_result = matcher.match_skills(resume_skills, jd_skills)
    print("Match Result:", match_result)
    assert len(match_result["matched"]) == 2
    assert "docker" in match_result["missing"]
    
    composite = matcher.calculate_composite_score({
        "semantic_similarity": 0.8,
        "skill_match": 0.5,
        "experience_factor": 0.4
    })
    print("Composite Score:", composite)
    assert composite["total_score"] > 0
    print("Skill Matcher test PASSED!")

def test_database():
    db = Database()
    rec_id = db.save_candidate({
        "name": "Alex Mercer",
        "email": "alex@example.com",
        "role": "Backend Engineer",
        "match_score": 88.5,
        "semantic_score": 85.0,
        "skill_score": 90.0,
        "extracted_skills": ["python", "docker"],
        "matched_skills": ["python"],
        "missing_skills": ["kubernetes"],
        "years_experience": 3.5,
        "explanation": "High match score"
    })
    print(f"Saved Candidate with ID: {rec_id}")
    assert rec_id is not None

    candidates = db.get_all_candidates(search="Alex Mercer")
    assert len(candidates) > 0
    print("Database test PASSED!")

if __name__ == "__main__":
    test_nlp_engine()
    test_pdf_processor()
    test_skill_matcher()
    test_database()
    print("\nALL SYSTEM TESTS COMPLETED SUCCESSFULLY!")

