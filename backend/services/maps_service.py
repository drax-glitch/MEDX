import os
import math
import json
import urllib.request
from dotenv import load_dotenv
from typing import Any, cast

from backend.database import SessionLocal
from backend.models import Hospital

# Load env variables
load_dotenv()

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "AIzaSyD_tf28l-kmyVBjCa3IW_fudfISpbnnXfo")

def _get_db_hospital_lookup() -> dict[str, Hospital]:
    """Load all hospitals from DB into a name-keyed lookup dict (case-insensitive)."""
    db = SessionLocal()
    try:
        rows = db.query(Hospital).all()
        return {str(h.name).lower(): h for h in rows}
    finally:
        db.close()

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def estimate_travel_time_min(distance_km: float) -> int:
    # Estimate travel time: ~1.5 mins per km + 2 minutes baseline delay (traffic, signals)
    return int(distance_km * 1.5) + 2

def fetch_json(url: str, headers: dict[str, str]) -> Any:
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))


def get_hospitals_from_db() -> list[dict[str, Any]]:
    """Load hospitals from the SQLite database and return them in API format."""
    db = SessionLocal()
    try:
        rows = db.query(Hospital).all()
        if not rows:
            return []

        hospitals = []
        for h in rows:
            h_rating = cast(Any, h.rating)
            priority_score = int(h_rating * 20) if h_rating else 70
            is_best = priority_score > 85
            hospitals.append({
                "id": h.id,
                "name": h.name,
                "coordinate": {"lat": h.latitude, "lng": h.longitude},
                "address": "Bhubaneswar, Odisha",
                "rating": h.rating,
                "specialty": h.specialty,
                "beds": h.beds,
                "icu_beds": h.icu_beds,
                "waitTime": f"{h.wait_time} mins",
                "doctor_availability": h.doctor_availability,
                "priorityScore": priority_score,
                "isBestForEmergency": is_best,
                "color": "#ef4444" if is_best else "#3b82f6",
            })
        return hospitals
    finally:
        db.close()


def get_fallback_hospitals(lat: float, lng: float) -> list[dict[str, Any]]:
    """Return hospitals from the database with distance/duration calculated."""
    db_hospitals = get_hospitals_from_db()
    if not db_hospitals:
        print("WARNING: No hospitals found in the database. Run seed_hospitals.py first.")
        return []

    results: list[dict[str, Any]] = []
    for h in db_hospitals:
        coordinate = h["coordinate"]
        dist = haversine_distance(lat, lng, coordinate["lat"], coordinate["lng"])
        duration = estimate_travel_time_min(dist)

        hospital_data = h.copy()
        hospital_data["distance"] = f"{dist:.1f} km"
        hospital_data["duration"] = f"{duration} mins"
        results.append(hospital_data)

    results.sort(key=lambda x: x["id"])
    return results

def get_nearby_hospitals(lat: float, lng: float, radius: int = 5000) -> list[dict[str, Any]]:
    """
    Search nearby hospitals using Google Places API.
    Falls back to local Bhubaneswar hospital list if the API key is restricted.
    """
    url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius={radius}&type=hospital&key={API_KEY}"
    headers = {
        "Referer": "http://localhost:5173/"
    }
    
    try:
        data = fetch_json(url, headers)
        
        if data.get("status") == "OK":
            results = []
            google_results = data.get("results", [])
            db_lookup = _get_db_hospital_lookup()

            for idx, p in enumerate(google_results):
                loc = p["geometry"]["location"]
                p_lat = loc["lat"]
                p_lng = loc["lng"]

                # Calculate distance & ETA locally
                dist = haversine_distance(lat, lng, p_lat, p_lng)
                duration = estimate_travel_time_min(dist)

                name = p.get("name", "Hospital")
                address = p.get("vicinity", "Bhubaneswar, Odisha")
                rating = p.get("rating", 4.0)

                # Enrich with DB data if this hospital exists in our database
                db_match = db_lookup.get(name.lower())
                if db_match:
                    specialty = db_match.specialty or "General Emergency Services"
                    beds = db_match.beds or 5
                    icu_beds = db_match.icu_beds or 2
                    wait_time = db_match.wait_time or 30
                    doctor_availability = db_match.doctor_availability or 5
                    rating = db_match.rating or rating
                    priority_score = int(cast(Any, rating) * 20)
                    hospital_id = db_match.id
                else:
                    # Defaults for hospitals not in our DB
                    specialty = "General Emergency Services"
                    beds = 5
                    icu_beds = 2
                    wait_time = 30
                    doctor_availability = 5
                    priority_score = int(rating * 20)
                    hospital_id = idx + 100

                is_best = priority_score > 85
                color = "#ef4444" if is_best else "#3b82f6"

                results.append({
                    "id": hospital_id,
                    "name": name,
                    "coordinate": {"lat": p_lat, "lng": p_lng},
                    "address": address,
                    "rating": rating,
                    "specialty": specialty,
                    "beds": beds,
                    "icu_beds": icu_beds,
                    "waitTime": f"{wait_time} mins",
                    "doctor_availability": doctor_availability,
                    "priorityScore": priority_score,
                    "isBestForEmergency": is_best,
                    "distance": f"{dist:.1f} km",
                    "duration": f"{duration} mins",
                    "color": color,
                })
            return results
        else:
            # If request is denied or other status (e.g. referrer restriction), fall back
            return get_fallback_hospitals(lat, lng)
            
    except Exception:
        # Catch connection errors, timeouts, etc.
        return get_fallback_hospitals(lat, lng)

def get_route_details(origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float) -> dict[str, str]:
    """
    Get route distance and travel time from Google Directions API.
    Falls back to Haversine calculation if API is denied.
    """
    url = f"https://maps.googleapis.com/maps/api/directions/json?origin={origin_lat},{origin_lng}&destination={dest_lat},{dest_lng}&key={API_KEY}"
    headers = {
        "Referer": "http://localhost:5173/"
    }
    
    try:
        data = fetch_json(url, headers)
        
        if data.get("status") == "OK" and data.get("routes"):
            leg = data["routes"][0]["legs"][0]
            return {
                "distance": leg["distance"]["text"],
                "travel_time": leg["duration"]["text"],
                "route": "Google Routes API"
            }
        else:
            # Fallback estimation
            dist = haversine_distance(origin_lat, origin_lng, dest_lat, dest_lng)
            duration = estimate_travel_time_min(dist)
            return {
                "distance": f"{dist:.1f} km",
                "travel_time": f"{duration} mins",
                "route": "Estimated Fallback Route"
            }
            
    except Exception:
        dist = haversine_distance(origin_lat, origin_lng, dest_lat, dest_lng)
        duration = estimate_travel_time_min(dist)
        return {
            "distance": f"{dist:.1f} km",
            "travel_time": f"{duration} mins",
            "route": "Estimated Fallback Route"
        }
