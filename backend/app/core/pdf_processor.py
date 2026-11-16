import pdfplumber
import docx
import io
import re
from datetime import datetime
from typing import Dict, Any

try:
    import pypdf
except ImportError:
    try:
        import PyPDF2 as pypdf
    except ImportError:
        pypdf = None


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from a PDF file using pdfplumber, with fallback to pypdf."""
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"pdfplumber failed: {e}. Trying fallback reader.")
        if pypdf:
            try:
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            except Exception as e2:
                print(f"Fallback PDF reader failed: {e2}")
    return text


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts text from a DOCX file using python-docx."""
    text = ""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        for para in doc.paragraphs:
            if para.text:
                text += para.text + "\n"
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text:
                        text += cell.text + " "
                text += "\n"
    except Exception as e:
        print(f"Failed to read DOCX: {e}")
    return text


def extract_text(filename: str, file_bytes: bytes) -> str:
    """Extracts text based on file extension."""
    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif lower_name.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    elif lower_name.endswith(".txt"):
        return file_bytes.decode("utf-8", errors="ignore")
    return ""


def parse_candidate_info(text: str, fallback_name: str = "Unknown") -> Dict[str, Any]:
    """
    Parses candidate text to extract:
    - Name (clean heuristics)
    - Email
    - Phone (including international formats)
    - LinkedIn & GitHub
    - Years of Experience (explicit mentions or year range calculations)
    """
    info = {
        "name": fallback_name,
        "email": "",
        "phone": "",
        "linkedin": "",
        "github": "",
        "years_experience": 0.0
    }

    if not text:
        return info

    lines = [line.strip() for line in text.split("\n") if line.strip()]

    # 1. Candidate Name Extraction
    ignore_patterns = [
        r'curriculum vitae', r'resume', r'profile', r'summary', r'experience',
        r'education', r'skills', r'contact', r'phone', r'email', r'address',
        r'developer', r'engineer', r'manager', r'analyst', r'architect'
    ]

    for line in lines[:8]:
        clean_line = line.strip()
        # Remove phone numbers, emails, URLs
        clean_line = re.sub(r'[\+0-9\(\)\-]{7,}', '', clean_line).strip()
        clean_line = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '', clean_line).strip()
        clean_line = re.sub(r'https?://\S+', '', clean_line).strip()

        # Handle letter-spaced names e.g. "J o h n  D o e"
        parts = clean_line.split()
        if len(parts) > 2 and all(len(p) == 1 for p in parts):
            clean_line = "".join(parts)

        lower = clean_line.lower()
        if any(re.search(pat, lower) for pat in ignore_patterns):
            continue

        words = clean_line.split()
        if 1 <= len(words) <= 4 and all(re.match(r'^[A-Za-z\.\'-]+$', w) for w in words):
            info["name"] = clean_line.title()
            break

    # 2. Email Extraction
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    if email_match:
        info["email"] = email_match.group(0).lower()

    # 3. Phone Extraction (Supports +91, +1, 10-digit, dashes, parentheses)
    phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}', text)
    if phone_match:
        cand_phone = phone_match.group(0).strip()
        if len(re.sub(r'\D', '', cand_phone)) >= 10:
            info["phone"] = cand_phone

    # 4. LinkedIn Extraction
    linkedin_match = re.search(r'(https?://)?(www\.)?linkedin\.com/in/[a-zA-Z0-9_\-\./]+', text)
    if linkedin_match:
        info["linkedin"] = linkedin_match.group(0)

    # 5. GitHub Extraction
    github_match = re.search(r'(https?://)?(www\.)?github\.com/[a-zA-Z0-9_\-\.]+', text)
    if github_match:
        info["github"] = github_match.group(0)

    # 6. Experience Extraction
    # Case A: Explicit phrase "X years of experience"
    exp_phrase_match = re.search(
        r'(\d+(?:\.\d+)?)\+?\s*(?:years? of experience|years? experience|yrs? of exp|yrs? exp)',
        text, re.IGNORECASE
    )
    if exp_phrase_match:
        try:
            info["years_experience"] = float(exp_phrase_match.group(1))
        except ValueError:
            pass

    # Case B: If explicit phrase not found, infer from date ranges (e.g. 2019 - 2024, 2021 - Present)
    if info["years_experience"] == 0.0:
        current_year = datetime.now().year
        year_ranges = re.findall(r'\b(20\d{2}|19\d{2})\s*(?:-|–|to)\s*(20\d{2}|present|current)\b', text, re.IGNORECASE)
        total_months = 0
        found_years = set()
        for start_str, end_str in year_ranges:
            try:
                start_yr = int(start_str)
                end_yr = current_year if end_str.lower() in ['present', 'current'] else int(end_str)
                if 1980 <= start_yr <= current_year and start_yr <= end_yr <= current_year + 1:
                    span = end_yr - start_yr
                    if span > 0:
                        found_years.add((start_yr, end_yr))
            except ValueError:
                continue

        if found_years:
            # Approximate total non-overlapping duration
            sorted_ranges = sorted(list(found_years), key=lambda x: x[0])
            merged = []
            for r in sorted_ranges:
                if not merged or merged[-1][1] < r[0]:
                    merged.append(r)
                else:
                    merged[-1] = (merged[-1][0], max(merged[-1][1], r[1]))
            total_yoe = sum(r[1] - r[0] for r in merged)
            info["years_experience"] = round(min(total_yoe, 35.0), 1)

    return info
