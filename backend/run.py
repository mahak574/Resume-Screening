import uvicorn
import os
import sys

# Ensure current directory is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    # Support optional --reload flag for development; defaults to False for maximum performance
    should_reload = "--reload" in sys.argv or os.getenv("UVICORN_RELOAD", "").lower() in ("1", "true")
    
    uvicorn.run(
        "app.main:app", 
        host="127.0.0.1", 
        port=8000, 
        reload=should_reload,
        reload_dirs=["app"] if should_reload else None,
        reload_excludes=["*.db", "*.sqlite", "data/*", "*.log"] if should_reload else None
    )

