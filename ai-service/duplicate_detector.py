import math
import os
from typing import List, Dict, Any, Optional
import numpy as np
from openai import OpenAI

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth (in meters).
    """
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) *
         math.sin(delta_lambda / 2.0) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class DuplicateDetector:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

    def get_embedding(self, text: str) -> Optional[List[float]]:
        if not self.client or not text.strip():
            return None
        try:
            response = self.client.embeddings.create(
                model="text-embedding-3-small",
                input=text[:2000]
            )
            return response.data[0].embedding
        except Exception:
            return None

    def check_duplicate(
        self,
        new_text: str,
        new_lat: float,
        new_lng: float,
        recent_complaints: List[Dict[str, Any]],
        max_distance_meters: float = 100.0,
        similarity_threshold: float = 0.85
    ) -> Dict[str, Any]:
        """
        Compares new submission against recent active complaints within max_distance_meters.
        """
        new_embedding = self.get_embedding(new_text)

        best_match_id = None
        highest_similarity = 0.0
        nearest_distance = float('inf')

        for item in recent_complaints:
            item_id = item.get("id")
            item_lat = item.get("latitude")
            item_lng = item.get("longitude")
            item_text = item.get("text", "")

            if item_lat is None or item_lng is None:
                continue

            dist = haversine_distance(new_lat, new_lng, item_lat, item_lng)
            if dist > max_distance_meters:
                continue

            # Calculate content similarity
            sim = 0.0
            if new_embedding and item.get("embedding"):
                vec_a = np.array(new_embedding)
                vec_b = np.array(item["embedding"])
                norm_a = np.linalg.norm(vec_a)
                norm_b = np.linalg.norm(vec_b)
                if norm_a > 0 and norm_b > 0:
                    sim = float(np.dot(vec_a, vec_b) / (norm_a * norm_b))
            else:
                # Jaccard word-set similarity fallback
                words_new = set(new_text.lower().split())
                words_old = set(item_text.lower().split())
                if words_new and words_old:
                    sim = len(words_new & words_old) / len(words_new | words_old)

            if sim > highest_similarity:
                highest_similarity = sim
                best_match_id = item_id
                nearest_distance = dist

        is_duplicate = highest_similarity >= similarity_threshold and nearest_distance <= max_distance_meters

        return {
            "is_duplicate": is_duplicate,
            "duplicate_of_id": best_match_id if is_duplicate else None,
            "similarity_score": round(highest_similarity, 3),
            "distance_meters": round(nearest_distance, 1) if nearest_distance != float('inf') else None
        }

