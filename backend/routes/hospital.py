from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.services.maps_service import get_nearby_hospitals, get_route_details
from backend.database import SessionLocal
from backend.models import Hospital

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/hospitals")
def search_hospitals(lat: float, lng: float):
    # Returns the list of nearby hospitals
    return get_nearby_hospitals(lat, lng)

@router.get("/route")
def get_hospital_route(origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float, hospital_name: str = ""):
    # Calculates the route details between user's current location and the hospital
    route_info = get_route_details(origin_lat, origin_lng, dest_lat, dest_lng)
    
    return {
        "hospital": hospital_name,
        "distance": route_info["distance"],
        "travel_time": route_info["travel_time"]
    }

@router.get("/hospitals/db")
def get_all_hospitals_from_db(db: Session = Depends(get_db)):
    """Return all hospitals stored in the database."""
    hospitals = db.query(Hospital).all()
    return [
        {
            "id": h.id,
            "name": h.name,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "specialty": h.specialty,
            "beds": h.beds,
            "icu_beds": h.icu_beds,
            "wait_time": h.wait_time,
            "rating": h.rating,
            "doctor_availability": h.doctor_availability,
        }
        for h in hospitals
    ]
