"""
Seed script to populate the hospitals table with Bhubaneswar hospital data.
Run once: python -m backend.seed_hospitals
"""

from backend.database import SessionLocal, engine
from backend.models import Base, Hospital


# Ensure tables exist
Base.metadata.create_all(bind=engine)


SEED_DATA = [
    {
        "name": "AIIMS Bhubaneswar",
        "latitude": 20.2510,
        "longitude": 85.7766,
        "specialty": "Trauma & Cardiac Care (Level 1)",
        "beds": 15,
        "icu_beds": 8,
        "wait_time": 15,
        "rating": 4.8,
        "doctor_availability": 12,
    },
    {
        "name": "Apollo Hospitals",
        "latitude": 20.3090,
        "longitude": 85.8327,
        "specialty": "Multispecialty & General ER",
        "beds": 10,
        "icu_beds": 5,
        "wait_time": 30,
        "rating": 4.6,
        "doctor_availability": 8,
    },
    {
        "name": "Kalinga Hospital",
        "latitude": 20.3228,
        "longitude": 85.8160,
        "specialty": "Pediatrics & Orthopedic Emergencies",
        "beds": 3,
        "icu_beds": 3,
        "wait_time": 40,
        "rating": 4.2,
        "doctor_availability": 5,
    },
    {
        "name": "SUM Hospital",
        "latitude": 20.2789,
        "longitude": 85.7872,
        "specialty": "Trauma & Critical Care",
        "beds": 8,
        "icu_beds": 6,
        "wait_time": 25,
        "rating": 4.4,
        "doctor_availability": 10,
    },
    {
        "name": "AMRI Hospitals",
        "latitude": 20.2644,
        "longitude": 85.8016,
        "specialty": "General Medicine & Emergency",
        "beds": 6,
        "icu_beds": 4,
        "wait_time": 35,
        "rating": 4.3,
        "doctor_availability": 7,
    },
]


def seed():
    db = SessionLocal()
    try:
        existing_count = db.query(Hospital).count()
        if existing_count > 0:
            print(f"Database already has {existing_count} hospitals. Skipping seed.")
            return

        for entry in SEED_DATA:
            hospital = Hospital(**entry)
            db.add(hospital)

        db.commit()
        print(f"Seeded {len(SEED_DATA)} hospitals into the database.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
