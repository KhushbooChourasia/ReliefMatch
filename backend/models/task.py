from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func

from database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)

    task_type = Column(String, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    severity = Column(Integer, nullable=False)
    population_affected = Column(Integer, nullable=False, default=0)
    required_skills = Column(String, nullable=True, default="")  # comma-separated; empty = any skill works
    disaster_datetime = Column(DateTime, nullable=True)  # when the disaster/task was reported

    description = Column(String, nullable=True)
    urgency_score = Column(Float, nullable=True)

    status = Column(String, nullable=False, default="Pending")  # Pending / Assigned / Completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())