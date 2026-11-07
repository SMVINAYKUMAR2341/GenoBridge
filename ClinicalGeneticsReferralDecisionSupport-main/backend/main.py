"""
backend/main.py
Mirror of main.py for module execution.
"""
from main import app, EvaluationRequest, EvaluationResponse

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
