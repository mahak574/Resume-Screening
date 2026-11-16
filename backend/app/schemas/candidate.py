from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class CandidateBase(BaseModel):
    name: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    linkedin: Optional[str] = ""
    github: Optional[str] = ""
    role: Optional[str] = "General"
    years_experience: Optional[float] = 0.0

class ScoreBreakdown(BaseModel):
    semantic_score: float
    skill_score: float
    experience_score: float

class CandidateResult(CandidateBase):
    id: Optional[int] = None
    match_score: float
    breakdown: Optional[ScoreBreakdown] = None
    extracted_skills: List[str] = []
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    explanation: Optional[str] = ""
    categorized_skills: Optional[Dict[str, List[str]]] = None
    timestamp: Optional[str] = None

class ScreenRequestWeights(BaseModel):
    semantic_similarity: Optional[float] = 0.25
    skill_match: Optional[float] = 0.60
    experience_factor: Optional[float] = 0.15

class EmailGenerationRequest(BaseModel):
    candidate_name: str
    role: str
    type: str = Field(..., description="'interview' or 'rejection'")
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    custom_notes: Optional[str] = ""

class EmailGenerationResponse(BaseModel):
    subject: str
    body: str
