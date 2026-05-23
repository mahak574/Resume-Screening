# AI-Powered Resume Screening & Candidate Ranking System

An intelligent Applicant Tracking System (ATS) that utilizes Natural Language Processing (NLP) and Machine Learning to screen resumes and rank candidates based on semantic similarity to a Job Description.

## 🌟 Features

- **Resume Upload System**: Supports both PDF and DOCX formats.
- **NLP Preprocessing**: Tokenization, lemmatization, stopword removal using SpaCy and NLTK.
- **Semantic Similarity Engine**: Uses Sentence-BERT (`all-MiniLM-L6-v2`) to generate embeddings and calculate cosine similarity.
- **Candidate Ranking**: Ranks candidates based on contextual relevance, not just exact keyword matching.
- **Missing Skills Detection**: Identifies required skills missing from the candidate's resume.
- **Explainable AI Output**: Explains why a candidate received their score based on matched skills.
- **Dashboard UI**: Clean and interactive frontend built with Streamlit.
- **Database Integration**: Stores candidate results using MongoDB (PyMongo).

## 🛠️ Tech Stack

- **Backend / Scripting**: Python
- **Frontend / Dashboard**: Streamlit
- **NLP / ML**: `sentence-transformers`, `scikit-learn`, `spacy`, `nltk`
- **Text Extraction**: `pdfplumber`, `PyPDF2`, `python-docx`
- **Database**: MongoDB (via `pymongo`)

## 📂 Project Structure

```text
Resume-Screening/
│
├── app.py                   # Main Streamlit application
├── requirements.txt         # Project dependencies
├── README.md                # Documentation
│
├── utils/
│   ├── __init__.py
│   ├── nlp_engine.py        # NLP pipeline, embeddings, similarity logic
│   └── pdf_processor.py     # Document text extraction (PDF, DOCX)
│
└── db/
    ├── __init__.py
    └── database.py          # MongoDB connection and schema
```

## 🚀 Setup Instructions

### 1. Prerequisites
- Python 3.8+
- MongoDB installed locally or an Atlas connection string.

### 2. Installation
Clone the repository (or create the directory), and install dependencies:
```bash
pip install -r requirements.txt
```

### 3. Download Language Models
You need to download the SpaCy and NLTK models required for preprocessing:
```bash
python -m spacy download en_core_web_sm
python -c "import nltk; nltk.download('stopwords'); nltk.download('wordnet')"
```

### 4. Run the Application
Start the Streamlit dashboard:
```bash
streamlit run app.py
```

### 5. Usage
1. Login using `admin` / `admin123`.
2. Paste the Job Description in the text area.
3. Upload candidate resumes (PDF or DOCX).
4. Click **Analyze & Rank Candidates** to see the AI-powered ranking!

## 💡 How It Works
1. **Text Extraction**: Extracts plain text from uploaded PDFs and DOCXs.
2. **Preprocessing**: Cleans text, removes stopwords, and lemmatizes words.
3. **Embeddings**: Converts the clean text into vector embeddings using SBERT.
4. **Similarity Calculation**: Calculates the Cosine Similarity between the Resume and JD embeddings to generate a match percentage.
5. **Insights**: Extracts recognized tech skills and identifies missing ones based on a predefined dictionary / NER concepts.
