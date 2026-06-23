from fastapi import APIRouter
from services.priority_engine import calculate_priority

router = APIRouter()

@router.post("/chat")
def chat(message: str):

    result = calculate_priority(message)

    return result
