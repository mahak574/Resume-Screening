import pdfplumber
import io
import re
import importlib
from datetime import datetime

pypdf = None
try:
    import pypdf
except ImportError:
    try:
        pypdf = importlib.import_module("PyPDF2")
    except ImportError:
        pypdf = None

MONTH_MAP = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
    'january': 1, 'february': 2, 'march': 3, 'april': 4, 'june': 6,
    'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
}

def extract_text_from_pdf(file_bytes):
    """Extracts text from a PDF file using fast pypdf, fallback to pdfplumber."""
    text = ""
    if pypdf:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            if len(text.strip()) > 30:
                return text
        except Exception:
            pass

    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Failed to read PDF: {e}")
    return text

def extract_text_from_docx(file_bytes):
    """Extracts text from a DOCX file using python-docx."""
    text = ""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        for para in doc.paragraphs:
            text += para.text + "\n"
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text += cell.text + " "
                text += "\n"
    except Exception as e:
        print(f"Failed to read DOCX: {e}")
    return text

def extract_text(file_upload):
    """Main extraction routing based on file extension."""
    file_name = file_upload.name.lower()
    file_bytes = file_upload.getvalue()
    
    if file_name.endswith('.pdf'):
        return extract_text_from_pdf(file_bytes)
    elif file_name.endswith('.docx'):
        return extract_text_from_docx(file_bytes)
    return ""

def parse_experience_years(text: str) -> float:
    now = datetime.now()
    current_year = now.year
    current_month = now.month

    # 1. Explicit phrase
    exp_phrase_match = re.search(r'(\d+(?:\.\d+)?)\+?\s*(?:years? of experience|years? experience|yrs? of exp|yrs? exp)', text, re.IGNORECASE)
    if exp_phrase_match:
        try:
            return float(exp_phrase_match.group(1))
        except ValueError:
            pass

    # 2. Extract ONLY Experience section (ignore Education & Projects)
    section_headers = r'(?:EDUCATION|ACADEMIC|TECHNICAL SKILLS|SKILLS|PROJECTS|CERTIFICATIONS|ACHIEVEMENTS|PUBLICATIONS|AWARDS|DECLARATION)'
    exp_pattern = rf'(?:^|\n)\s*(?:EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT HISTORY|INTERNSHIP EXPERIENCE)\b\s*[:\n]?(.*?)(?=(?:\n\s*{section_headers}\b)|\Z)'
    match = re.search(exp_pattern, text, re.IGNORECASE | re.DOTALL)

    target_text = match.group(1) if match else ''
    if not target_text.strip():
        return 0.0

    month_regex = r'(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
    date_ranges = []

    month_year_pattern = rf'({month_regex})\.?\s+(20\d{{2}}|19\d{{2}})\s*(?:-|–|to)\s*(?:({month_regex})\.?\s+)?(20\d{{2}}|present|current)\b'
    for m in re.finditer(month_year_pattern, target_text, re.IGNORECASE):
        start_m_str, start_y_str, end_m_str, end_y_str = m.groups()
        start_m = MONTH_MAP.get(start_m_str.lower(), 1)
        start_y = int(start_y_str)

        if end_y_str.lower() in ['present', 'current']:
            end_y = current_year
            end_m = current_month
        else:
            end_y = int(end_y_str)
            end_m = MONTH_MAP.get(end_m_str.lower(), 12) if end_m_str else 12

        start_val = start_y + (start_m - 1) / 12.0
        end_val = end_y + end_m / 12.0
        if end_val >= start_val:
            date_ranges.append((start_val, end_val))

    if not date_ranges:
        year_pattern = r'\b(20\d{2}|19\d{2})\s*(?:-|–|to)\s*(20\d{2}|present|current)\b'
        for m in re.finditer(year_pattern, target_text, re.IGNORECASE):
            start_y = int(m.group(1))
            end_val_str = m.group(2).lower()
            end_y = current_year if end_val_str in ['present', 'current'] else int(end_val_str)
            if start_y <= end_y <= current_year + 1:
                date_ranges.append((float(start_y), float(end_y)))

    if not date_ranges:
        return 0.0

    sorted_ranges = sorted(date_ranges, key=lambda x: x[0])
    merged = []
    for r in sorted_ranges:
        if not merged or merged[-1][1] < r[0]:
            merged.append(r)
        else:
            merged[-1] = (merged[-1][0], max(merged[-1][1], r[1]))

    total_years = sum(r[1] - r[0] for r in merged)
    return round(max(0.0, min(total_years, 35.0)), 1)

def parse_candidate_info(text: str, fallback_name: str = "Unknown") -> dict:
    """Parses text to extract name, email, phone, linkedin, and years of experience."""
    info = {
        "name": fallback_name,
        "email": "Not found",
        "phone": "Not found",
        "linkedin": "Not found",
        "years_experience": 0.0
    }
    
    if not text:
        return info
        
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    ignore_patterns = [
        r'curriculum vitae', r'resume', r'profile', r'summary', r'experience',
        r'education', r'skills', r'contact', r'phone', r'email', r'address',
        r'developer', r'engineer', r'manager', r'analyst', r'architect'
    ]

    for line in lines[:8]:
        clean_line = line.strip()
        clean_line = re.sub(r'[\+0-9\(\)\-]{7,}', '', clean_line).strip()
        clean_line = re.sub(r'[\w\.-]+@[\w\.-]+\.\w+', '', clean_line).strip()
        clean_line = re.sub(r'https?://\S+', '', clean_line).strip()

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
        
    # Email extraction
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    if email_match:
        info["email"] = email_match.group(0).lower()
        
    # Phone extraction
    phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5}', text)
    if phone_match:
        cand_phone = phone_match.group(0).strip()
        if len(re.sub(r'\D', '', cand_phone)) >= 10:
            info["phone"] = cand_phone
        
    # LinkedIn extraction
    linkedin_match = re.search(r'(https?://)?(www\.)?linkedin\.com/in/[a-zA-Z0-9_\-\./]+', text)
    if linkedin_match:
        info["linkedin"] = linkedin_match.group(0)
        
    # Experience Extraction (Section-Aware)
    info["years_experience"] = parse_experience_years(text)
            
    return info
