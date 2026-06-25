from fastapi import APIRouter
from backend.schemas import RecommendRequest, RecommendResponse
from backend.services.recommendation_engine import get_recommendations

router = APIRouter()


@router.post("/recommend", response_model=RecommendResponse)
def recommend(body: RecommendRequest):
    """Run the full ML recommendation pipeline and return ranked hospitals.

    Body:
        message: User's symptom description (e.g. "chest pain and dizziness")
        lat: User's current latitude
        lng: User's current longitude
        top_n: Number of top hospitals to return (default 3)
        max_distance_km: Search radius in km (default 20)

    Returns:
        Classification result + ranked list of recommended hospitals.
    """
    return get_recommendations(body.message, body.lat, body.lng, body.top_n, body.max_distance_km)
