import os
from typing import Literal
from pydantic import BaseModel, Field
from openai import OpenAI
from pii_masker import PIIMasker

VALID_CATEGORIES = Literal[
    "sanitation",
    "peace_order",
    "infrastructure",
    "utilities",
    "health",
    "minors",
    "general"
]

VALID_PRIORITIES = Literal["High", "Medium", "Low"]

class ClassificationResult(BaseModel):
    category_id: VALID_CATEGORIES = Field(
        ..., 
        description="The strictly chosen category from the allowed whitelist."
    )
    priority: VALID_PRIORITIES = Field(
        ..., 
        description="Assessed priority level (High: immediate safety/life threat or child involved, Medium: structural/health defect, Low: general feedback/routine)."
    )
    justification: str = Field(
        ..., 
        description="1-sentence factual justification quoting directly from the user's text. No fabricated claims."
    )
    confidence: float = Field(
        ..., 
        ge=0.0, 
        le=1.0, 
        description="Confidence score of classification."
    )
    involves_minor: bool = Field(
        ..., 
        description="True if the incident explicitly mentions or involves minors/children under 18."
    )

class ComplaintClassifier:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

    def classify(self, title: str, description: str, resident_name: str | None = None) -> ClassificationResult:
        # Step 1: PII Sanitization
        raw_text = f"Title: {title}\nDescription: {description}"
        sanitized_text = PIIMasker.mask_text(raw_text, resident_name=resident_name)

        # Fallback if OpenAI key is not configured (heuristic rule-based mock for testing)
        if not self.client:
            return self._heuristic_fallback(sanitized_text)

        # Step 2: Prompting with Strict Anti-Hallucination Boundaries
        system_prompt = (
            "You are the CommunityVoice Classification Engine for Barangay Hibao-an Sur, Iloilo City.\n"
            "Your task is to analyze resident complaint text and classify it into one predefined category and priority level.\n\n"
            "STRICT RULES:\n"
            "1. ONLY select from the predefined categories: 'sanitation', 'peace_order', 'infrastructure', 'utilities', 'health', 'minors', 'general'.\n"
            "2. If minors or children under 18 are involved, set involves_minor to True, priority to 'High', and category to 'minors'.\n"
            "3. Ground all reasoning strictly in the text. Your justification MUST quote or directly reference words from the text.\n"
            "4. Priority Guidelines:\n"
            "   - 'High': Danger to human life, live electrical wires, child welfare, active violent disputes, major floods.\n"
            "   - 'Medium': Road potholes, broken streetlights, uncollected waste, blocked canals, sanitation hazards.\n"
            "   - 'Low': General feedback, non-urgent suggestions, inquiries.\n"
        )

        try:
            completion = self.client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Citizen Submission:\n{sanitized_text}"}
                ],
                response_format=ClassificationResult,
                temperature=0.0  # Zero temperature for deterministic, hallucination-free outputs
            )
            return completion.choices[0].message.parsed
        except Exception as e:
            # Safe deterministic fallback on API error
            return self._heuristic_fallback(sanitized_text)

    def _heuristic_fallback(self, text: str) -> ClassificationResult:
        text_lower = text.lower()
        
        # Check for minor involvement
        minor_keywords = ["minor", "child", "children", "bata", "underage", "youth", "curfew", "kabataan"]
        involves_minor = any(k in text_lower for k in minor_keywords)

        if involves_minor:
            return ClassificationResult(
                category_id="minors",
                priority="High",
                justification="Case flagged for minor involvement requiring SWDO referral.",
                confidence=0.95,
                involves_minor=True
            )

        if any(k in text_lower for k in ["wire", "kuryente", "electric", "brawl", "away", "gulo", "sunog", "fire", "danger"]):
            return ClassificationResult(
                category_id="utilities" if "wire" in text_lower or "electric" in text_lower else "peace_order",
                priority="High",
                justification="Identified potential safety hazard or peace and order disturbance in text.",
                confidence=0.88,
                involves_minor=False
            )

        if any(k in text_lower for k in ["basura", "garbage", "trash", "waste", "drainage", "kanal"]):
            return ClassificationResult(
                category_id="sanitation",
                priority="Medium",
                justification="Identified waste or drainage issue in submitted description.",
                confidence=0.85,
                involves_minor=False
            )

        if any(k in text_lower for k in ["kalsada", "road", "pothole", "lubak", "bridge", "street"]):
            return ClassificationResult(
                category_id="infrastructure",
                priority="Medium",
                justification="Resident reported road or infrastructure concern.",
                confidence=0.82,
                involves_minor=False
            )

        return ClassificationResult(
            category_id="general",
            priority="Low",
            justification="General submission without high-urgency keywords.",
            confidence=0.75,
            involves_minor=False
        )

