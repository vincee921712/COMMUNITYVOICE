import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from classifier import ComplaintClassifier, ClassificationResult
from duplicate_detector import DuplicateDetector

load_dotenv()

app = FastAPI(
    title="CommunityVoice AI Microservice",
    description="Automated categorization, priority scoring, duplicate detection, and PII masking for Barangay Hibao-an Sur",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = ComplaintClassifier()
duplicate_detector = DuplicateDetector()

class ClassifyRequest(BaseModel):
    title: str = Field(..., example="Busted street light along Zone 3")
    description: str = Field(..., example="Streetlight has been flickering and is now dark near the corner.")
    resident_name: Optional[str] = Field(None, example="Juan Dela Cruz")

class CheckDuplicateRequest(BaseModel):
    text: str
    latitude: float
    longitude: float
    recent_complaints: List[Dict[str, Any]] = []
    max_distance_meters: float = 100.0
    similarity_threshold: float = 0.85

@app.get("/healthz")
def health_check():
    return {
        "status": "healthy",
        "service": "CommunityVoice AI Service",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
    }

@app.post("/api/ai/classify", response_model=ClassificationResult)
def classify_complaint(req: ClassifyRequest):
    try:
        return classifier.classify(
            title=req.title,
            description=req.description,
            resident_name=req.resident_name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/check-duplicate")
def check_duplicate(req: CheckDuplicateRequest):
    try:
        return duplicate_detector.check_duplicate(
            new_text=req.text,
            new_lat=req.latitude,
            new_lng=req.longitude,
            recent_complaints=req.recent_complaints,
            max_distance_meters=req.max_distance_meters,
            similarity_threshold=req.similarity_threshold
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

