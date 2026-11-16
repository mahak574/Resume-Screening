import os
import json
import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional
from ..config import SQLITE_DB_PATH, MONGO_URI, MONGO_DB_NAME

class Database:
    """
    Dual-mode Database:
    - Automatically initializes SQLite for zero-config persistence.
    - Connects to MongoDB if available and replicates records.
    """
    def __init__(self, sqlite_path: str = SQLITE_DB_PATH, mongo_uri: str = MONGO_URI):
        self.sqlite_path = sqlite_path
        self.mongo_uri = mongo_uri
        self.mongo_client = None
        self.mongo_collection = None
        
        # Initialize SQLite
        self._init_sqlite()
        
        # Attempt MongoDB connection
        self._init_mongo()

    def _init_sqlite(self):
        os.makedirs(os.path.dirname(self.sqlite_path), exist_ok=True)
        with sqlite3.connect(self.sqlite_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS candidates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT,
                    phone TEXT,
                    linkedin TEXT,
                    github TEXT,
                    role TEXT,
                    years_experience REAL DEFAULT 0.0,
                    match_score REAL NOT NULL,
                    semantic_score REAL DEFAULT 0.0,
                    skill_score REAL DEFAULT 0.0,
                    extracted_skills TEXT,
                    matched_skills TEXT,
                    missing_skills TEXT,
                    explanation TEXT,
                    timestamp TEXT NOT NULL
                )
            """)
            conn.commit()

    def _init_mongo(self):
        try:
            import importlib
            pymongo = importlib.import_module("pymongo")
            self.mongo_client = pymongo.MongoClient(self.mongo_uri, serverSelectionTimeoutMS=1500)
            self.mongo_client.server_info()
            db = self.mongo_client[MONGO_DB_NAME]
            self.mongo_collection = db["candidates"]
            print("MongoDB connected successfully.")
        except Exception:
            self.mongo_client = None
            self.mongo_collection = None
            print("MongoDB unavailable; operating in SQLite mode.")

    def save_candidate(self, candidate_data: Dict[str, Any]) -> int:
        timestamp = candidate_data.get("timestamp") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        extracted_skills_json = json.dumps(candidate_data.get("extracted_skills", []))
        matched_skills_json = json.dumps(candidate_data.get("matched_skills", []))
        missing_skills_json = json.dumps(candidate_data.get("missing_skills", []))
        
        record_id = None
        with sqlite3.connect(self.sqlite_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO candidates (
                    name, email, phone, linkedin, github, role, years_experience,
                    match_score, semantic_score, skill_score,
                    extracted_skills, matched_skills, missing_skills, explanation, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                candidate_data.get("name", "Unknown"),
                candidate_data.get("email", ""),
                candidate_data.get("phone", ""),
                candidate_data.get("linkedin", ""),
                candidate_data.get("github", ""),
                candidate_data.get("role", "General"),
                candidate_data.get("years_experience", 0.0),
                float(candidate_data.get("match_score", 0.0)),
                float(candidate_data.get("semantic_score", 0.0)),
                float(candidate_data.get("skill_score", 0.0)),
                extracted_skills_json,
                matched_skills_json,
                missing_skills_json,
                candidate_data.get("explanation", ""),
                timestamp
            ))
            conn.commit()
            record_id = cursor.lastrowid

        # Also push to MongoDB if available
        if self.mongo_collection is not None:
            try:
                mongo_doc = {**candidate_data, "sqlite_id": record_id, "timestamp": timestamp}
                self.mongo_collection.insert_one(mongo_doc)
            except Exception as e:
                print(f"MongoDB insert error: {e}")

        return record_id

    def get_all_candidates(self, limit: int = 100, search: Optional[str] = None) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.sqlite_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            if search:
                cursor.execute("""
                    SELECT * FROM candidates 
                    WHERE name LIKE ? OR email LIKE ? OR role LIKE ?
                    ORDER BY id DESC LIMIT ?
                """, (f"%{search}%", f"%{search}%", f"%{search}%", limit))
            else:
                cursor.execute("SELECT * FROM candidates ORDER BY id DESC LIMIT ?", (limit,))
            
            rows = cursor.fetchall()
            results = []
            for row in rows:
                item = dict(row)
                item["extracted_skills"] = json.loads(item["extracted_skills"] or "[]")
                item["matched_skills"] = json.loads(item["matched_skills"] or "[]")
                item["missing_skills"] = json.loads(item["missing_skills"] or "[]")
                results.append(item)
            return results

    def get_candidate_history(self, name: str) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.sqlite_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM candidates 
                WHERE LOWER(name) LIKE LOWER(?)
                ORDER BY id DESC
            """, (f"%{name}%",))
            rows = cursor.fetchall()
            results = []
            for row in rows:
                item = dict(row)
                item["extracted_skills"] = json.loads(item["extracted_skills"] or "[]")
                item["matched_skills"] = json.loads(item["matched_skills"] or "[]")
                item["missing_skills"] = json.loads(item["missing_skills"] or "[]")
                results.append(item)
            return results

    def delete_candidate(self, candidate_id: int) -> bool:
        with sqlite3.connect(self.sqlite_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM candidates WHERE id = ?", (candidate_id,))
            conn.commit()
            return cursor.rowcount > 0

    def get_analytics(self) -> Dict[str, Any]:
        with sqlite3.connect(self.sqlite_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as total, AVG(match_score) as avg_score FROM candidates")
            row = cursor.fetchone()
            total = row["total"] if row else 0
            avg_score = round(row["avg_score"] or 0.0, 1) if row else 0.0

            cursor.execute("SELECT matched_skills FROM candidates")
            skill_rows = cursor.fetchall()
            
            skill_freq = {}
            for r in skill_rows:
                skills = json.loads(r["matched_skills"] or "[]")
                for s in skills:
                    skill_freq[s] = skill_freq.get(s, 0) + 1

            top_skills = sorted([{"skill": k, "count": v} for k, v in skill_freq.items()], key=lambda x: x["count"], reverse=True)[:10]

            return {
                "total_candidates_screened": total,
                "average_match_score": avg_score,
                "top_matched_skills": top_skills,
                "db_engine": "MongoDB + SQLite" if self.mongo_collection is not None else "SQLite (Local)"
            }

