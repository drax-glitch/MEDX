from fastapi import APIRouter
from services.maps_service import get_nearby_hospitals, get_route_details

router = APIRouter()

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
