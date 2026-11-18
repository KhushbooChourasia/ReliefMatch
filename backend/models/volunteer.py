from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func

from database import Base


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    skills = Column(String, nullable=False, default="")
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    availability = Column(String, nullable=False, default="Available")  # Available / Assigned / Unavailable

    created_at = Column(DateTime(timezone=True), server_default=func.now())