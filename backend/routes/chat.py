from fastapi import APIRouter
from backend.services.recommendation_engine import get_recommendations

router = APIRouter()


@router.post("/chat")
def chat(message: str, lat: float = 20.2960, lng: float = 85.8245):
    """Process a user chat message and return hospital recommendations.

    Args:
        message: User's symptom description
        lat: User latitude (defaults to central Bhubaneswar)
        lng: User longitude (defaults to central Bhubaneswar)
    """
    return get_recommendations(message, lat, lng)
