import spacy
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import re
import os

# --- Initialization & Model Loading ---

# Ensure NLTK data is downloaded
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

# Ensure SpaCy model is loaded
    nlp = spacy.load("en_core_web_sm")

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

# --- Core NLP Functions ---

def preprocess_text(text):
    """
    Cleans and preprocesses the text.
    - Lowercasing
    - Removing special characters and numbers
    - Tokenization & Stopword removal
    - Lemmatization
    """
    # Lowercase
    text = text.lower()
    # Remove non-alphabet characters
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    
    # Tokenization and Lemmatization
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(word) for word in tokens if word not in stop_words]
    
    return " ".join(tokens)

# --- Skill Extraction & Analysis ---

def extract_skills(text):
    """
    Extracts skills using a predefined dictionary and SpaCy POS tagging.
    In a production ATS, this would be backed by a comprehensive skills ontology.
    """
    # A comprehensive but simple list of common tech/soft skills
    tech_skills = [
        "python", "java", "c++", "c#", "javascript", "typescript", "html", "css",
        "sql", "nosql", "mongodb", "mysql", "postgresql", "react", "angular", "vue",
        "node.js", "django", "flask", "spring boot", "aws", "azure", "gcp", "docker",
        "kubernetes", "machine learning", "nlp", "artificial intelligence", "data science",
        "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "git", "ci/cd",
        "agile", "scrum", "communication", "leadership", "problem solving"
    ]
    
    found_skills = set()
    text_lower = text.lower()
    
    # Keyword matching
    for skill in tech_skills:
        # Regex boundary to match exact words/phrases
        if re.search(rf'\b{re.escape(skill)}\b', text_lower):
            found_skills.add(skill)
            
    # SpaCy NLP Named Entity Recognition as fallback / additions
    doc = nlp(text)
    for ent in doc.ents:
        # Sometimes ORG or PRODUCT represents software/skills (e.g. 'Docker', 'Microsoft')
        if ent.label_ in ['ORG', 'PRODUCT'] and ent.text.lower() not in found_skills:
            # We filter it slightly to avoid long garbage entities
            if len(ent.text.split()) <= 2: 
                pass # Un-comment to enable broad NER capture: found_skills.add(ent.text.lower())
                
    return list(found_skills)

def identify_missing_skills(resume_skills, jd_skills):
    """Identifies skills present in JD but missing in the resume."""
    return list(set(jd_skills) - set(resume_skills))

def explain_match(matched_skills, jd_skills):
    """Provides a basic explainable AI output string based on pre-matched skills."""
    matched_skills = list(matched_skills) if matched_skills else []
    jd_skills = list(jd_skills) if jd_skills else []

    if not jd_skills or len(jd_skills) == 0:
        return "No specific skills detected in Job Description."
        
    skill_match_percentage = len(matched_skills) / len(jd_skills) * 100
    
    explanation = f"Matched {len(matched_skills)} out of {len(jd_skills)} key skills ({skill_match_percentage:.0f}%). "
    if matched_skills:
        explanation += f"Strong indicators: {', '.join(matched_skills[:3])}."
        
    return explanation
