import os
import math
import json
import urllib.request
import urllib.error
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
from typing import Any, cast

from backend.database import SessionLocal
from backend.models import Hospital

# Load env variables from backend/.env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

# ---------------------------------------------------------------------------
# Haversine — straight-line distance (used as fallback and for proximity filter)
# ---------------------------------------------------------------------------
def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return straight-line distance between two coordinates in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def estimate_travel_time_min(distance_km: float) -> int:
    """Rough ETA: ~1.5 min/km + 2 min baseline (traffic, signals)."""
    return int(distance_km * 1.5) + 2


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------
def _get_db_hospital_lookup() -> dict[str, Hospital]:
    """Load all hospitals from DB into a name-keyed lookup dict (case-insensitive)."""
    db = SessionLocal()
    try:
        rows = db.query(Hospital).all()
        return {str(h.name).lower(): h for h in rows}
    finally:
        db.close()


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


# ---------------------------------------------------------------------------
# OSRM — free, open-source routing (road distance + ETA)
# No API key required. Uses the public OSRM demo server.
# Docs: https://project-osrm.org/docs/v5.24.0/api/
# ---------------------------------------------------------------------------
_OSRM_BASE = "https://router.project-osrm.org/route/v1/driving"

def _osrm_route(origin_lat: float, origin_lng: float,
                dest_lat: float, dest_lng: float) -> dict[str, Any] | None:
    """
    Call the OSRM public API for road distance and travel time.
    Returns {"distance_km": float, "duration_min": int} or None on failure.
    """
    url = (
        f"{_OSRM_BASE}/{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
        f"?overview=false&alternatives=false"
    )
    headers = {"User-Agent": "MEDX-HealthApp/1.0"}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=2) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        if data.get("code") == "Ok" and data.get("routes"):
            route = data["routes"][0]
            distance_km = round(route["distance"] / 1000, 2)   # metres → km
            duration_min = max(1, round(route["duration"] / 60))  # seconds → min
            return {"distance_km": distance_km, "duration_min": duration_min}
    except (urllib.error.URLError, json.JSONDecodeError, KeyError, TypeError,
            TimeoutError, OSError):
        # TimeoutError / OSError are raised directly in Python 3.11+ on timeouts
        pass
    return None


def get_route_details(origin_lat: float, origin_lng: float,
                      dest_lat: float, dest_lng: float) -> dict[str, str]:
    """
    Get road distance and travel time using OSRM (free, no API key).
    Falls back to Haversine estimation if OSRM is unreachable.
    """
    result = _osrm_route(origin_lat, origin_lng, dest_lat, dest_lng)
    if result:
        return {
            "distance": f"{result['distance_km']:.1f} km",
            "travel_time": f"{result['duration_min']} mins",
            "route": "OSRM (OpenStreetMap Routing)",
        }

    # Fallback: straight-line estimate
    dist = haversine_distance(origin_lat, origin_lng, dest_lat, dest_lng)
    duration = estimate_travel_time_min(dist)
    return {
        "distance": f"{dist:.1f} km",
        "travel_time": f"{duration} mins",
        "route": "Estimated (Haversine Fallback)",
    }


# ---------------------------------------------------------------------------
# Overpass API — free OSM hospital search (replaces Google Places)
# No API key required.
# Docs: https://overpass-api.de/
# ---------------------------------------------------------------------------
_OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def _overpass_nearby_hospitals(lat: float, lng: float, radius_m: int = 5000) -> list[dict[str, Any]]:
    """
    Query OpenStreetMap Overpass API for hospitals within radius_m metres.
    Returns a list of raw OSM elements with name, lat, lon.
    """
    query = f"""
[out:json][timeout:10];
(
  node["amenity"="hospital"](around:{radius_m},{lat},{lng});
  way["amenity"="hospital"](around:{radius_m},{lat},{lng});
  relation["amenity"="hospital"](around:{radius_m},{lat},{lng});
);
out center;
"""
    try:
        encoded = urllib.parse.urlencode({"data": query}).encode("utf-8")
        req = urllib.request.Request(
            _OVERPASS_URL,
            data=encoded,
            headers={"User-Agent": "MEDX-HealthApp/1.0", "Content-Type": "application/x-www-form-urlencoded"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data.get("elements", [])
    except Exception:
        return []


def get_nearby_hospitals(lat: float, lng: float, radius: int = 5000) -> list[dict[str, Any]]:
    """
    Search for nearby hospitals using the Overpass (OpenStreetMap) API.
    Enriches results with DB data where available.
    Falls back to the local DB list if Overpass is unreachable.
    OSRM route calls are parallelized across all hospitals.
    """
    elements = _overpass_nearby_hospitals(lat, lng, radius_m=radius)

    if not elements:
        return get_fallback_hospitals(lat, lng)

    db_lookup = _get_db_hospital_lookup()

    # Pre-filter elements with valid coordinates
    valid_elements: list[tuple[int, dict, str, float, float]] = []
    for idx, el in enumerate(elements):
        tags = el.get("tags", {})
        name = tags.get("name") or tags.get("name:en") or "Hospital"
        if "lat" in el and "lon" in el:
            h_lat, h_lng = el["lat"], el["lon"]
        elif "center" in el:
            h_lat, h_lng = el["center"]["lat"], el["center"]["lon"]
        else:
            continue
        valid_elements.append((idx, el, name, h_lat, h_lng))

    # Fetch all OSRM routes in parallel
    def _fetch_route(args: tuple) -> tuple[int, dict | None]:
        idx, _, _, h_lat, h_lng = args
        return idx, _osrm_route(lat, lng, h_lat, h_lng)

    route_map: dict[int, dict | None] = {}
    with ThreadPoolExecutor(max_workers=min(10, len(valid_elements) or 1)) as pool:
        futures = {pool.submit(_fetch_route, item): item[0] for item in valid_elements}
        for future in as_completed(futures):
            idx, osrm = future.result()
            route_map[idx] = osrm

    results: list[dict[str, Any]] = []
    for idx, el, name, h_lat, h_lng in valid_elements:
        tags = el.get("tags", {})
        osrm = route_map.get(idx)
        if osrm:
            dist_km = osrm["distance_km"]
            duration_min = osrm["duration_min"]
        else:
            dist_km = haversine_distance(lat, lng, h_lat, h_lng)
            duration_min = estimate_travel_time_min(dist_km)

        # Enrich with DB data if this hospital exists in our database
        db_match = db_lookup.get(name.lower())
        if db_match:
            specialty         = db_match.specialty or "General Emergency Services"
            beds              = db_match.beds or 5
            icu_beds          = db_match.icu_beds or 2
            wait_time         = db_match.wait_time or 30
            doctor_avail      = db_match.doctor_availability or 5
            rating            = float(cast(Any, db_match.rating) or 4.0)
            priority_score    = int(rating * 20)
            hospital_id       = db_match.id
        else:
            specialty         = tags.get("healthcare:speciality", "General Emergency Services")
            beds              = 5
            icu_beds          = 2
            wait_time         = 30
            doctor_avail      = 5
            rating            = 4.0
            priority_score    = 70
            hospital_id       = idx + 100

        is_best = priority_score > 85
        results.append({
            "id":                  hospital_id,
            "name":                name,
            "coordinate":          {"lat": h_lat, "lng": h_lng},
            "address":             tags.get("addr:full") or tags.get("addr:street") or "Bhubaneswar, Odisha",
            "rating":              rating,
            "specialty":           specialty,
            "beds":                beds,
            "icu_beds":            icu_beds,
            "waitTime":            f"{wait_time} mins",
            "doctor_availability": doctor_avail,
            "priorityScore":       priority_score,
            "isBestForEmergency":  is_best,
            "distance":            f"{dist_km:.1f} km",
            "duration":            f"{duration_min} mins",
            "color":               "#ef4444" if is_best else "#3b82f6",
        })

    if not results:
        return get_fallback_hospitals(lat, lng)

    results.sort(key=lambda x: x["distance"])
    return results


def get_fallback_hospitals(lat: float, lng: float) -> list[dict[str, Any]]:
    """Return hospitals from the database with OSRM distance/ETA (haversine if OSRM fails).
    OSRM route calls are parallelized across all hospitals.
    """
    db_hospitals = get_hospitals_from_db()
    if not db_hospitals:
        print("WARNING: No hospitals found in the database. Run seed_hospitals.py first.")
        return []

    def _fetch(h: dict) -> dict:
        coordinate = h["coordinate"]
        h_lat = float(coordinate["lat"] or 0)
        h_lng = float(coordinate["lng"] or 0)
        osrm = _osrm_route(lat, lng, h_lat, h_lng)
        hospital_data = h.copy()
        if osrm:
            hospital_data["distance"] = f"{osrm['distance_km']:.1f} km"
            hospital_data["duration"] = f"{osrm['duration_min']} mins"
        else:
            dist_km = haversine_distance(lat, lng, h_lat, h_lng)
            hospital_data["distance"] = f"{dist_km:.1f} km"
            hospital_data["duration"] = f"{estimate_travel_time_min(dist_km)} mins"
        return hospital_data

    with ThreadPoolExecutor(max_workers=min(10, len(db_hospitals))) as pool:
        results = list(pool.map(_fetch, db_hospitals))

    results.sort(key=lambda x: x["id"])
    return results
