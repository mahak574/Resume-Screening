import json
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from ..core.nlp_engine import NLPEngine
from ..core.pdf_processor import extract_text, parse_candidate_info
from ..core.skill_matcher import SkillMatcher
from ..db.database import Database
from ..schemas.candidate import (
    CandidateResult, 
    ScoreBreakdown, 
    EmailGenerationRequest, 
    EmailGenerationResponse
)

router = APIRouter()

# Global instances
nlp_engine = NLPEngine()
skill_matcher = SkillMatcher()
db = Database()

LEARNING_RESOURCES = {
    "python": "https://www.python.org/about/gettingstarted/",
    "java": "https://dev.java/learn/",
    "javascript": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    "typescript": "https://www.typescriptlang.org/docs/",
    "aws": "https://aws.amazon.com/training/",
    "docker": "https://docs.docker.com/get-started/",
    "kubernetes": "https://kubernetes.io/docs/tutorials/",
    "react": "https://react.dev/learn",
    "sql": "https://www.w3schools.com/sql/",
    "machine learning": "https://developers.google.com/machine-learning/crash-course",
    "nlp": "https://huggingface.co/learn/nlp-course/",
    "git": "https://git-scm.com/doc",
    "c++": "https://cplusplus.com/doc/tutorial/",
    "c#": "https://learn.microsoft.com/en-us/dotnet/csharp/",
    "azure": "https://learn.microsoft.com/en-us/training/azure/",
    "gcp": "https://cloud.google.com/training",
    "node.js": "https://nodejs.dev/learn",
    "fastapi": "https://fastapi.tiangolo.com/tutorial/",
    "django": "https://docs.djangoproject.com/en/stable/intro/tutorial01/",
    "spring": "https://spring.io/guides",
    "mongodb": "https://www.mongodb.com/basics",
    "redis": "https://redis.io/docs/latest/develop/get-started/",
    "devops": "https://roadmap.sh/devops",
    "xgboost": "https://xgboost.readthedocs.io/en/stable/",
    "pytorch": "https://pytorch.org/tutorials/",
    "pandas": "https://pandas.pydata.org/docs/",
    "scikit-learn": "https://scikit-learn.org/stable/tutorial/index.html",
    "shap": "https://shap.readthedocs.io/en/latest/",
    "sbert": "https://sbert.net/",
    "sentence-transformers": "https://sbert.net/",
    "lightgbm": "https://lightgbm.readthedocs.io/en/latest/",
    "catboost": "https://catboost.ai/docs/",
    "mlops": "https://ml-ops.org/",
    "mlflow": "https://mlflow.org/docs/latest/index.html",
    "airflow": "https://airflow.apache.org/docs/",
    "langchain": "https://python.langchain.com/docs/get_started/introduction"
}

@router.post("/screen")
async def screen_resumes(
    files: List[UploadFile] = File(...),
    jd_text: str = Form(...),
    role: Optional[str] = Form("Software Engineer"),
    req_skills: Optional[str] = Form(""),
    weights: Optional[str] = Form(None),
    threshold: Optional[float] = Form(60.0)
):
    if not jd_text.strip():
        raise HTTPException(status_code=400, detail="Job description is required.")
    if not files:
        raise HTTPException(status_code=400, detail="At least one resume file is required.")

    # Parse custom weights if provided
    custom_weights = None
    if weights:
        try:
            custom_weights = json.loads(weights)
        except Exception:
            pass

    # 1. Process Job Description
    clean_jd = nlp_engine.preprocess_text(jd_text)
    auto_jd_skills = nlp_engine.extract_skills(jd_text)
    
    # Optional manual override for required skills
    if req_skills and req_skills.strip():
        manual_skills = [s.strip().lower() for s in req_skills.split(",") if s.strip()]
        target_jd_skills = list(set(manual_skills + auto_jd_skills))
    else:
        target_jd_skills = auto_jd_skills

    # Precompute JD embedding once
    jd_embedding = skill_matcher.get_embedding(clean_jd)
    if target_jd_skills:
        skill_matcher.precache_skills(target_jd_skills)

    # 2. Extract and Preprocess all resumes in batch
    parsed_candidates = []
    clean_resumes = []

    for upload in files:
        try:
            file_bytes = await upload.read()
            raw_text = extract_text(upload.filename, file_bytes)
            if not raw_text.strip():
                continue

            fallback_name = upload.filename.rsplit('.', 1)[0].replace('_', ' ').replace('-', ' ').title()
            candidate_info = parse_candidate_info(raw_text, fallback_name=fallback_name)
            clean_resume = nlp_engine.preprocess_text(raw_text)
            cand_skills = nlp_engine.extract_skills(raw_text, additional_skills=target_jd_skills)

            parsed_candidates.append({
                "upload": upload,
                "raw_text": raw_text,
                "candidate_info": candidate_info,
                "clean_resume": clean_resume,
                "cand_skills": cand_skills
            })
            clean_resumes.append(clean_resume)
        except Exception as e:
            print(f"Error parsing {upload.filename}: {e}")

    if not parsed_candidates:
        return {
            "total_analyzed": 0,
            "shortlisted_count": 0,
            "target_jd_skills": target_jd_skills,
            "candidates": []
        }

    # Batch compute SBERT embeddings for all resumes in ONE single pass
    resume_embeddings = skill_matcher.get_embeddings(clean_resumes) if (skill_matcher.model and clean_resumes) else None

    candidates_results = []
    for idx, item in enumerate(parsed_candidates):
        candidate_info = item["candidate_info"]
        clean_resume = item["clean_resume"]
        cand_skills = item["cand_skills"]
        raw_text = item["raw_text"]

        # Calculate Semantic Similarity
        if jd_embedding is not None and resume_embeddings is not None:
            semantic_similarity = skill_matcher.calculate_similarity_from_embeddings(resume_embeddings[idx], jd_embedding)
        else:
            semantic_similarity = skill_matcher.calculate_similarity_texts(clean_resume, clean_jd)

        # Hybrid Skill Matching (ultra-fast cached lookup)
        match_res = skill_matcher.match_skills(cand_skills, target_jd_skills)
        matched_skills = [m["skill"] for m in match_res["matched"]]
        missing_skills = match_res["missing"]
        
        # If no specific skills detected in JD, align skill score with overall semantic fit
        if not target_jd_skills:
            skill_score = semantic_similarity
        else:
            skill_score = match_res["match_percentage"] / 100.0

        # Experience factor (capped at 10 years = 1.0)
        exp_factor = min(candidate_info["years_experience"], 10.0) / 10.0

        # Composite Score calculation
        components = {
            "semantic_similarity": semantic_similarity,
            "skill_match": skill_score,
            "experience_factor": exp_factor
        }
        score_data = skill_matcher.calculate_composite_score(components, custom_weights)
        final_score = score_data["total_score"]

        # Explanation
        explanation = nlp_engine.explain_match(matched_skills, target_jd_skills)

        # Categorize candidate skills
        categorized = skill_matcher.categorizer.categorize_skills(matched_skills)

        candidate_record = {
            "name": candidate_info["name"],
            "email": candidate_info["email"],
            "phone": candidate_info["phone"],
            "linkedin": candidate_info["linkedin"],
            "github": candidate_info["github"],
            "role": role,
            "years_experience": candidate_info["years_experience"],
            "match_score": final_score,
            "semantic_score": score_data["breakdown"]["semantic_score"],
            "skill_score": score_data["breakdown"]["skill_score"],
            "extracted_skills": cand_skills,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "explanation": explanation
        }

        # Save to Database
        rec_id = db.save_candidate(candidate_record)

        candidates_results.append({
            "id": rec_id,
            **candidate_record,
            "categorized_skills": categorized,
            "breakdown": score_data["breakdown"]
        })

    # Rank descending by match_score
    ranked_candidates = sorted(candidates_results, key=lambda c: c["match_score"], reverse=True)
    shortlisted = [c for c in ranked_candidates if c["match_score"] >= threshold]

    return {
        "total_analyzed": len(ranked_candidates),
        "shortlisted_count": len(shortlisted),
        "target_jd_skills": target_jd_skills,
        "candidates": ranked_candidates
    }

@router.post("/screen/multi-jd")
async def screen_multi_jd(
    file: UploadFile = File(...),
    jds_json: str = Form(...)
):
    try:
        jds = json.loads(jds_json) # Expects list of {"role": "...", "jd_text": "..."}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JDs JSON.")

    if not jds:
        raise HTTPException(status_code=400, detail="At least one Job Description is required.")

    file_bytes = await file.read()
    raw_text = extract_text(file.filename, file_bytes)
    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="Unable to extract text from resume.")

    fallback_name = file.filename.rsplit('.', 1)[0].replace('_', ' ').title()
    candidate_info = parse_candidate_info(raw_text, fallback_name=fallback_name)
    clean_resume = nlp_engine.preprocess_text(raw_text)
    resume_embedding = skill_matcher.get_embedding(clean_resume)
    # Filter and preprocess all valid JDs in batch
    valid_jds = []
    clean_jds = []
    for jd in jds:
        role_name = jd.get("role", "Untitled Role")
        jd_text = jd.get("jd_text", "").strip()
        if not jd_text:
            continue
        clean_text = nlp_engine.preprocess_text(jd_text)
        jd_skills = nlp_engine.extract_skills(jd_text)
        valid_jds.append({
            "role": role_name,
            "jd_text": jd_text,
            "clean_jd": clean_text,
            "jd_skills": jd_skills
        })
        clean_jds.append(clean_text)

    if not valid_jds:
        raise HTTPException(status_code=400, detail="No valid job descriptions provided.")

    all_target_skills = list(set([s for vjd in valid_jds for s in vjd['jd_skills']]))
    cand_skills = nlp_engine.extract_skills(raw_text, additional_skills=all_target_skills)

    # Batch compute embeddings for all JDs and skills in ONE single pass
    skill_matcher.precache_skills(cand_skills + all_target_skills)
    jd_embeddings = skill_matcher.get_embeddings(clean_jds) if (skill_matcher.model and clean_jds) else None

    role_evaluations = []
    exp_factor = min(candidate_info["years_experience"], 10.0) / 10.0

    for idx, vjd in enumerate(valid_jds):
        role_name = vjd["role"]
        clean_jd = vjd["clean_jd"]
        jd_skills = vjd["jd_skills"]

        if resume_embedding is not None and jd_embeddings is not None:
            sim = skill_matcher.calculate_similarity_from_embeddings(resume_embedding, jd_embeddings[idx])
        else:
            sim = skill_matcher.calculate_similarity_texts(clean_resume, clean_jd)

        match_res = skill_matcher.match_skills(cand_skills, jd_skills)
        matched_skills = [m["skill"] for m in match_res["matched"]]
        missing_skills = match_res["missing"]
        skill_score = sim if not jd_skills else (match_res["match_percentage"] / 100.0)

        score_data = skill_matcher.calculate_composite_score({
            "semantic_similarity": sim,
            "skill_match": skill_score,
            "experience_factor": exp_factor
        })

        role_evaluations.append({
            "role": role_name,
            "match_score": score_data["total_score"],
            "breakdown": score_data["breakdown"],
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "explanation": nlp_engine.explain_match(matched_skills, jd_skills)
        })

    # Sort descending
    role_evaluations = sorted(role_evaluations, key=lambda x: x["match_score"], reverse=True)

    return {
        "candidate": candidate_info,
        "best_role": role_evaluations[0] if role_evaluations else None,
        "roles": role_evaluations
    }

@router.get("/candidates")
def get_candidates(search: Optional[str] = None, limit: int = 100):
    return db.get_all_candidates(limit=limit, search=search)

@router.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: int):
    success = db.delete_candidate(candidate_id)
    if not success:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return {"message": "Candidate deleted successfully"}

@router.get("/analytics")
def get_analytics():
    return db.get_analytics()

@router.get("/skills")
def get_skills():
    return {
        "categories": skill_matcher.categorizer.skills_db,
        "learning_resources": LEARNING_RESOURCES
    }

@router.post("/generate-email", response_model=EmailGenerationResponse)
def generate_email(req: EmailGenerationRequest):
    if req.type == "interview":
        subject = f"Interview Invitation: {req.role} at our team"
        skills_highlight = f" We were particularly impressed by your experience with {', '.join(req.matched_skills[:3])}." if req.matched_skills else ""
        body = f"""Dear {req.candidate_name},

Thank you for your application for the {req.role} position.{skills_highlight}

Based on our review of your background, we would love to invite you to an initial interview to discuss this opportunity further.

Please let us know your availability over the next few business days.

Best regards,
Talent Acquisition Team"""
    else:
        subject = f"Update regarding your application for {req.role}"
        missing_text = ""
        if req.missing_skills:
            links = []
            for s in req.missing_skills[:3]:
                url = LEARNING_RESOURCES.get(s.lower(), f"https://www.google.com/search?q=learn+{s}")
                links.append(f"- {s.title()}: {url}")
            missing_text = "\n\nFor future roles, developing expertise in the following areas can help strengthen your profile:\n" + "\n".join(links)

        body = f"""Dear {req.candidate_name},

Thank you for taking the time to apply for the {req.role} position.

After careful consideration, we have decided to proceed with other candidates whose skill profiles more closely match our current requirements.{missing_text}

We encourage you to apply for future openings that match your qualifications. We wish you the best in your career pursuits.

Best regards,
Talent Acquisition Team"""

    return EmailGenerationResponse(subject=subject, body=body)

