"""
Recommendation Engine

Orchestrates the full hospital recommendation pipeline:
    User message + location
        → Symptom classification  (priority_engine)
        → Hospital retrieval      (DB query)
        → Feature extraction      (feature_extraction)
        → Scoring                 (ML classifier / weighted heuristic fallback)
        → Ranking                 (sort by score, return top N)
"""

from backend.database import SessionLocal
from backend.models import Hospital
from backend.services.priority_engine import calculate_priority
from backend.services.feature_extraction import extract_features, extract_feature_vector
from backend.services.maps_service import haversine_distance
from concurrent.futures import ThreadPoolExecutor
import os
import joblib

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "hospital_classifier.pkl")
classifier = None
try:
    classifier = joblib.load(MODEL_PATH)
except Exception as e:
    print(f"Warning: Could not load ML classifier from {MODEL_PATH}. Falling back to heuristic scoring. Error: {e}")


# ---------------------------------------------------------------------------
# Heuristic scoring (fallback when ML classifier fails)
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
    max_distance_km: float = 20.0,
) -> dict:
    """Run the full recommendation pipeline and return classified results.

    Args:
        message: User's symptom description.
        user_lat: User's latitude.
        user_lng: User's longitude.
        top_n: Number of top hospitals to return.
        max_distance_km: Only consider hospitals within this radius (default 20 km).

    Returns:
        {
            "classification": { "department", "severity", "priority_score" },
            "recommendations": [
                { "rank", "hospital_name", "suitability_score", ... },
                ...
            ]
        }
    """
    # Step 1 — Symptom classification (includes guardrail check)
    classification = calculate_priority(message)

    # Guardrail: off-topic input — return early with a helpful redirect
    if classification.get("off_topic"):
        return {
            "classification": classification,
            "recommendations": [],
            "message": classification.get("message", "Please describe your symptoms."),
        }

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

    # Step 2b — Proximity filter: only score hospitals within max_distance_km
    hospitals = [
        h for h in hospitals
        if haversine_distance(
            user_lat, user_lng,
            float(h.latitude or 0),  # type: ignore[arg-type]
            float(h.longitude or 0),  # type: ignore[arg-type]
        ) <= max_distance_km
    ]

    if not hospitals:
        return {
            "classification": classification,
            "recommendations": [],
            "message": f"No hospitals found within {max_distance_km} km of your location.",
        }

    # Step 3 + 4 — Extract features and score each hospital (parallel)
    def _score_one(hospital: Hospital) -> dict:
        features = extract_features(
            user_lat, user_lng, department, severity, hospital
        )
        score = 0.0
        if classifier is not None:
            vector = extract_feature_vector(user_lat, user_lng, department, severity, hospital)
            try:
                score = float(classifier.predict_proba([vector])[0][1])
            except Exception as e:
                print(f"ML scoring failed: {e}. Falling back to heuristic.")
                score = _score_hospital(features)
        else:
            score = _score_hospital(features)

        return {
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
        }

    with ThreadPoolExecutor(max_workers=min(10, len(hospitals))) as pool:
        scored: list[dict] = list(pool.map(_score_one, hospitals))

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
