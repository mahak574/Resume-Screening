import pymongo
import os
from datetime import datetime

class Database:
    """Handles MongoDB connection and operations."""
    
    def __init__(self):
        # Defaulting to localhost. Can be overridden via environment variables.
        self.mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
        self.client = None
        self.db = None
        self.candidates_collection = None
        
        self._connect()

    def _connect(self):
        try:
            # Short timeout to not block the UI if DB isn't running
            self.client = pymongo.MongoClient(self.mongo_uri, serverSelectionTimeoutMS=2000)
            # Test connection
            self.client.server_info()
            
            self.db = self.client["resume_screening_ats"]
            self.candidates_collection = self.db["candidates"]
        except Exception as e:
            # If MongoDB is not running, we fail gracefully. The app will still work in-memory.
            print(f"Warning: Could not connect to MongoDB. Data will not be saved persistently. Error: {e}")
            self.client = None

    def save_candidate(self, name, email, match_score, extracted_skills, missing_skills):
        """Saves candidate screening results to the database."""
        if self.candidates_collection is not None:
            data = {
                "name": name,
                "email": email,
                "match_score": float(match_score),
                "extracted_skills": extracted_skills,
                "missing_skills": missing_skills,
                "timestamp": datetime.now()
            }
            try:
                self.candidates_collection.insert_one(data)
            except Exception as e:
                print(f"Failed to insert record into MongoDB: {e}")
        else:
            # Optionally log that DB is unavailable
            pass

    def get_all_candidates(self) -> list:
        """Returns all stored records sorted by timestamp descending."""
        if self.candidates_collection is not None:
            try:
                records = list(self.candidates_collection.find({}, {"_id": 0}).sort("timestamp", pymongo.DESCENDING))
                return records
            except Exception as e:
                print(f"Failed to fetch records from MongoDB: {e}")
        return []

    def get_candidate_history(self, name: str) -> list:
        """Returns all records for that name sorted by timestamp descending."""
        if self.candidates_collection is not None:
            try:
                # Use case-insensitive search or exact match depending on needs
                # exact match is simple
                records = list(self.candidates_collection.find({"name": {"$regex": f"^{name}$", "$options": "i"}}, {"_id": 0}).sort("timestamp", pymongo.DESCENDING))
                return records
            except Exception as e:
                print(f"Failed to fetch candidate history from MongoDB: {e}")
        return []
