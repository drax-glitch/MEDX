"""
Recommendation Engine

Orchestrates the full hospital recommendation pipeline:
    User message + location
        → Symptom classification  (priority_engine)
        → Hospital retrieval      (DB query)
        → Feature extraction      (feature_extraction)
        → Scoring                 (weighted heuristic — will be replaced by ML in Task 4)
        → Ranking                 (sort by score, return top N)
"""

from backend.database import SessionLocal
from backend.models import Hospital
from backend.services.priority_engine import calculate_priority
from backend.services.feature_extraction import extract_features


# ---------------------------------------------------------------------------
# Heuristic scoring (placeholder until ML classifier in Task 4)
# ---------------------------------------------------------------------------
# Weights for the scoring formula — higher weight = more influence
WEIGHTS = {
    "distance_km": -0.15,        # closer is better (negative)
    "travel_time_min": -0.10,    # shorter travel is better (negative)
    "beds": 0.12,                # more beds is better
    "icu_beds": 0.15,            # more ICU beds is better
    "wait_time": -0.12,          # shorter wait is better (negative)
    "rating": 0.20,              # higher rating is better
    "doctor_availability": 0.10, # more doctors is better
    "department_match": 0.25,    # specialty match bonus
    "severity_score": 0.05,      # severity context multiplier
}

# Reference ranges for normalisation (min-max from our seed data + margins)
RANGES = {
    "distance_km": (0, 15),
    "travel_time_min": (0, 30),
    "beds": (0, 20),
    "icu_beds": (0, 10),
    "wait_time": (0, 60),
    "rating": (0, 5),
    "doctor_availability": (0, 15),
    "department_match": (0, 1),
    "severity_score": (1, 3),
}


def _normalise(value: float, low: float, high: float) -> float:
    """Min-max normalise a value to [0, 1]."""
    if high == low:
        return 0.5
    return max(0.0, min(1.0, (value - low) / (high - low)))


def _score_hospital(features: dict) -> float:
    """Compute a weighted suitability score in [0, 1] from a feature dict."""
    total = 0.0
    for key, weight in WEIGHTS.items():
        raw = float(features.get(key, 0))
        low, high = RANGES[key]
        norm = _normalise(raw, low, high)
        total += weight * norm

    # Shift and clamp to [0, 1] — raw total can range from -sum(neg) to +sum(pos)
    # Approximate range: ~ -0.37 to +0.87, so shift by 0.37 then scale
    score = (total + 0.37) / (0.37 + 0.87)
    return max(0.0, min(1.0, round(score, 4)))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def get_recommendations(
    message: str,
    user_lat: float,
    user_lng: float,
    top_n: int = 3,
) -> dict:
    """Run the full recommendation pipeline and return classified results.

    Returns:
        {
            "classification": { "department", "severity", "priority_score" },
            "recommendations": [
                { "rank", "hospital_name", "suitability_score", ... },
                ...
            ]
        }
    """
    # Step 1 — Symptom classification
    classification = calculate_priority(message)
    department = str(classification["department"])
    severity = str(classification["severity"])

    # Step 2 — Retrieve all hospitals from DB
    db = SessionLocal()
    try:
        hospitals = db.query(Hospital).all()
    finally:
        db.close()

    if not hospitals:
        return {
            "classification": classification,
            "recommendations": [],
            "message": "No hospitals found in database. Please seed the database first.",
        }

    # Step 3 + 4 — Extract features and score each hospital
    scored: list[dict] = []
    for hospital in hospitals:
        features = extract_features(
            user_lat, user_lng, department, severity, hospital
        )
        score = _score_hospital(features)

        scored.append({
            "hospital_id": hospital.id,
            "hospital_name": hospital.name,
            "suitability_score": score,
            "distance_km": features["distance_km"],
            "travel_time_min": features["travel_time_min"],
            "beds": features["beds"],
            "icu_beds": features["icu_beds"],
            "wait_time": features["wait_time"],
            "rating": features["rating"],
            "doctor_availability": features["doctor_availability"],
            "department_match": bool(features["department_match"]),
            "specialty": hospital.specialty,
        })

    # Step 5 — Rank by suitability score (descending)
    scored.sort(key=lambda h: h["suitability_score"], reverse=True)
    top = scored[:top_n]

    # Add rank numbers
    for idx, entry in enumerate(top, start=1):
        entry["rank"] = idx

    return {
        "classification": classification,
        "recommendations": top,
    }
