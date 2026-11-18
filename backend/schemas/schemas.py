from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator


# ---------- Task ----------

class TaskCreate(BaseModel):
    type: str
    location: str
    severity: int = Field(..., ge=1, le=10)
    population_affected: int = Field(0, ge=0)
    required_skills: List[str] = Field(default_factory=list)
    disaster_datetime: Optional[datetime] = None
    status: str = "Pending"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None

    @field_validator("disaster_datetime", mode="before")
    @classmethod
    def _blank_datetime_to_none(cls, v):
        # The frontend sends '' when the date field is left empty.
        return None if v in ("", None) else v


class TaskUpdate(BaseModel):
    type: Optional[str] = None
    location: Optional[str] = None
    severity: Optional[int] = Field(None, ge=1, le=10)
    population_affected: Optional[int] = Field(None, ge=0)
    required_skills: Optional[List[str]] = None
    disaster_datetime: Optional[datetime] = None
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None

    @field_validator("disaster_datetime", mode="before")
    @classmethod
    def _blank_datetime_to_none(cls, v):
        # The frontend sends '' when the date field is left empty.
        return None if v in ("", None) else v


class TaskOut(BaseModel):
    id: int
    type: str
    location: str
    severity: int
    population_affected: int
    required_skills: List[str]
    disaster_datetime: Optional[datetime] = None
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    urgency_score: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @staticmethod
    def from_orm_obj(t):
        return TaskOut(
            id=t.id,
            type=t.task_type,
            location=t.location,
            severity=t.severity,
            population_affected=t.population_affected,
            required_skills=[s.strip() for s in (t.required_skills or "").split(",") if s.strip()],
            disaster_datetime=t.disaster_datetime,
            status=t.status,
            latitude=t.latitude,
            longitude=t.longitude,
            description=t.description,
            urgency_score=t.urgency_score,
            created_at=t.created_at,
        )


# ---------- Volunteer ----------

class VolunteerCreate(BaseModel):
    name: str
    skills: List[str] = Field(default_factory=list)
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    availability: str = "Available"


class VolunteerUpdate(BaseModel):
    name: Optional[str] = None
    skills: Optional[List[str]] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    availability: Optional[str] = None


class VolunteerOut(BaseModel):
    id: int
    name: str
    skills: List[str]
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    availability: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @staticmethod
    def from_orm_obj(v):
        return VolunteerOut(
            id=v.id,
            name=v.name,
            skills=[s.strip() for s in v.skills.split(",") if s.strip()],
            location=v.location,
            latitude=v.latitude,
            longitude=v.longitude,
            availability=v.availability,
            created_at=v.created_at,
        )


# ---------- Assignment ----------

class AssignmentEntry(BaseModel):
    volunteer_id: int
    volunteer_name: str
    task_id: int
    task_location: str
    fit_score: float
    method: str


class SolverSummary(BaseModel):
    fit_score_total: float
    tasks_covered: int
    solve_time_ms: float


class ComparisonBlock(BaseModel):
    quantum: SolverSummary
    classical: SolverSummary


class AssignmentResponse(BaseModel):
    assignments: List[AssignmentEntry]
    comparison: ComparisonBlock
    urgency_scores: Dict[int, float] = Field(default_factory=dict)  # task_id -> AI urgency score
    total_tasks: int = 0
    total_volunteers: int = 0
    solved_tasks: int = 0        # how many tasks both solvers actually received
    solved_volunteers: int = 0
    capped: bool = False         # True if the problem was shrunk to fit the quantum simulator
    note: Optional[str] = None