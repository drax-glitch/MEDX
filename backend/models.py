from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Float

from backend.database import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True)

    name = Column(String)

    specialty = Column(String)

    beds = Column(Integer)

    wait_time = Column(Integer)

    rating = Column(Float)

    latitude = Column(Float)

    longitude = Column(Float)

    doctor_availability = Column(Integer)

    icu_beds = Column(Integer)