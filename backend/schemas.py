"""
Pydantic schemas for MEDX API request bodies and response payloads.
"""

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str = Field(..., description="User's symptom description")
    lat: float = Field(20.2960, description="User latitude (defaults to central Bhubaneswar)")
    lng: float = Field(85.8245, description="User longitude (defaults to central Bhubaneswar)")
    top_n: int = Field(3, ge=1, le=10, description="Number of top hospitals to return")


class RecommendRequest(BaseModel):
    message: str = Field(..., description="User's symptom description")
    lat: float = Field(20.2960, description="User latitude")
    lng: float = Field(85.8245, description="User longitude")
    top_n: int = Field(3, ge=1, le=10, description="Number of top hospitals to return")
    max_distance_km: float = Field(20.0, ge=1.0, description="Max search radius in km")


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class ClassificationResult(BaseModel):
    department: str
    severity: str
    priority_score: int


class HospitalRecommendation(BaseModel):
    rank: int
    hospital_id: int
    hospital_name: str
    suitability_score: float
    distance_km: float
    travel_time_min: int
    beds: int
    icu_beds: int
    wait_time: int
    rating: float
    doctor_availability: int
    department_match: bool
    specialty: str | None


class ChatResponse(BaseModel):
    classification: ClassificationResult
    recommendations: list[HospitalRecommendation]
    response: str
    message: str | None = None


class RecommendResponse(BaseModel):
    classification: ClassificationResult
    recommendations: list[HospitalRecommendation]
    message: str | None = None
