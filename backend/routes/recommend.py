from fastapi import APIRouter
from backend.services.recommendation_engine import get_recommendations

router = APIRouter()


@router.post("/recommend")
def recommend(message: str, lat: float, lng: float, top_n: int = 3):
    """Run the full recommendation pipeline.

    Args:
        message: User's symptom description (e.g. "chest pain and dizziness")
        lat: User's current latitude
        lng: User's current longitude
        top_n: Number of top hospitals to return (default 3)

    Returns:
        Classification result + ranked list of recommended hospitals.
    """
    return get_recommendations(message, lat, lng, top_n)
