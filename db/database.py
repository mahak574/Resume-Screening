import os
import json
import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional

class Database:
    """Handles SQLite (local fallback) and MongoDB operations."""
    
    def __init__(self):
        self.mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
        self.sqlite_path = os.path.join(os.path.dirname(__file__), "..", "data", "candidates.db")
        self.client = None
        self.db = None
        self.candidates_collection = None
        
        self._init_sqlite()
        self._connect_mongo()

    def _init_sqlite(self):
        os.makedirs(os.path.dirname(self.sqlite_path), exist_ok=True)
        with sqlite3.connect(self.sqlite_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS candidates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT,
                    match_score REAL NOT NULL,
                    extracted_skills TEXT,
                    missing_skills TEXT,
                    timestamp TEXT NOT NULL
                )
            """)
            conn.commit()

    def _connect_mongo(self):
        try:
            import pymongo
            self.client = pymongo.MongoClient(self.mongo_uri, serverSelectionTimeoutMS=1500)
            self.client.server_info()
            self.db = self.client["resume_screening_ats"]
            self.candidates_collection = self.db["candidates"]
        except Exception:
            self.client = None
            self.candidates_collection = None

    def save_candidate(self, name, email, match_score, extracted_skills, missing_skills):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        extracted_json = json.dumps(extracted_skills)
        missing_json = json.dumps(missing_skills)
        
        with sqlite3.connect(self.sqlite_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO candidates (name, email, match_score, extracted_skills, missing_skills, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (name, email, float(match_score), extracted_json, missing_json, timestamp))
            conn.commit()

        if self.candidates_collection is not None:
            try:
                self.candidates_collection.insert_one({
                    "name": name,
                    "email": email,
                    "match_score": float(match_score),
                    "extracted_skills": extracted_skills,
                    "missing_skills": missing_skills,
                    "timestamp": timestamp
                })
            except Exception:
                pass

    def get_all_candidates(self) -> list:
        with sqlite3.connect(self.sqlite_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM candidates ORDER BY id DESC")
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["extracted_skills"] = json.loads(item["extracted_skills"] or "[]")
                item["missing_skills"] = json.loads(item["missing_skills"] or "[]")
                results.append(item)
            return results

    def get_candidate_history(self, name: str) -> list:
        with sqlite3.connect(self.sqlite_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM candidates WHERE LOWER(name) LIKE LOWER(?) ORDER BY id DESC", (f"%{name}%",))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["extracted_skills"] = json.loads(item["extracted_skills"] or "[]")
                item["missing_skills"] = json.loads(item["missing_skills"] or "[]")
                results.append(item)
            return results
