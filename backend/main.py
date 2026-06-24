from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.chat import router as chat_router
from backend.routes.hospital import router as hospital_router
from backend.routes.recommend import router as recommend_router
from backend.database import engine
from backend.models import Base


app = FastAPI()

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(hospital_router)
app.include_router(recommend_router)

@app.get("/")
def home():
    return {
        "project": "MEDX",
        "status": "Backend Running"
    }


Base.metadata.create_all(bind=engine)