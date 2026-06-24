"""
Feature Extraction Service

Takes user context (location, department, severity) and a Hospital object,
and produces a numeric feature dict / vector for the ML classifier.
"""

import math
from typing import cast
from backend.models import Hospital
from backend.services.maps_service import get_route_details


DEPARTMENT_KEYWORDS: dict[str, list[str]] = {
    "cardiology": ["cardiac", "cardiology", "heart"],
    "emergency medicine": ["emergency", "trauma", "critical"],
    "general medicine": ["general", "medicine", "multispecialty"],
    "pediatrics": ["pediatric", "child"],
    "orthopedics": ["orthopedic", "bone", "fracture"],
}

# Severity → numeric score
SEVERITY_SCORES: dict[str, int] = {
    "critical": 3,
    "moderate": 2,
    "low": 1,
}





# ---------------------------------------------------------------------------
# Department-match logic
# ---------------------------------------------------------------------------
def _department_matches(department: str, hospital_specialty: str | None) -> bool:
    """Return True if the hospital's specialty text contains a keyword
    associated with the classified department."""
    if not hospital_specialty:
        return False
    dept_lower = department.lower()
    spec_lower = hospital_specialty.lower()
    keywords = DEPARTMENT_KEYWORDS.get(dept_lower, [])
    return any(kw in spec_lower for kw in keywords)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def extract_features(
    user_lat: float,
    user_lng: float,
    department: str,
    severity: str,
    hospital: Hospital,
) -> dict:
    """Return a rich feature dict for a single hospital.

    Keys returned:
        distance_km, travel_time_min, beds, icu_beds, wait_time,
        rating, doctor_availability, department_match, severity_score
    """
    # Get true route details from Google Maps API (with Haversine fallback built-in)
    route_info = get_route_details(
        user_lat, user_lng,
        cast(float, hospital.latitude) or 0.0,
        cast(float, hospital.longitude) or 0.0
    )
    
    # route_info returns strings like "7.1 km" and "12 mins", parse them to numeric
    dist_str = route_info.get("distance", "0").replace(" km", "").replace(",", "")
    time_str = route_info.get("travel_time", "0").replace(" mins", "").replace(" min", "").replace(",", "")
    
    try:
        distance = float(dist_str)
    except ValueError:
        distance = 0.0
        
    try:
        travel_time = int(time_str)
    except ValueError:
        travel_time = 0

    return {
        "distance_km": distance,
        "travel_time_min": travel_time,
        "beds": hospital.beds or 0,
        "icu_beds": hospital.icu_beds or 0,
        "wait_time": hospital.wait_time or 0,
        "rating": cast(float, hospital.rating) or 0.0,
        "doctor_availability": hospital.doctor_availability or 0,
        "department_match": int(_department_matches(department, cast(str, hospital.specialty))),
        "severity_score": SEVERITY_SCORES.get(severity.lower(), 1),
    }


def extract_feature_vector(
    user_lat: float,
    user_lng: float,
    department: str,
    severity: str,
    hospital: Hospital,
) -> list[float]:
    """Return just the 7-element numeric vector the ML classifier expects.

    Order: [distance, travel_time, beds, icu_beds, wait_time,
            rating, doctor_availability]
    """
    feats = extract_features(user_lat, user_lng, department, severity, hospital)
    return [
        feats["distance_km"],
        float(feats["travel_time_min"]),
        float(feats["beds"]),
        float(feats["icu_beds"]),
        float(feats["wait_time"]),
        feats["rating"],
        float(feats["doctor_availability"]),
    ]
