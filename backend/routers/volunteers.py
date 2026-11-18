from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.volunteer import Volunteer
from schemas.schemas import VolunteerCreate, VolunteerUpdate, VolunteerOut

router = APIRouter(prefix="/volunteers", tags=["Volunteers"])


@router.post("", response_model=VolunteerOut, status_code=201)
def create_volunteer(payload: VolunteerCreate, db: Session = Depends(get_db)):
    volunteer = Volunteer(
        name=payload.name,
        skills=",".join(payload.skills),
        location=payload.location,
        latitude=payload.latitude,
        longitude=payload.longitude,
        availability=payload.availability,
    )
    db.add(volunteer)
    db.commit()
    db.refresh(volunteer)
    return VolunteerOut.from_orm_obj(volunteer)


@router.get("", response_model=List[VolunteerOut])
def list_volunteers(available_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(Volunteer)
    if available_only:
        query = query.filter(Volunteer.availability == "Available")
    return [VolunteerOut.from_orm_obj(v) for v in query.order_by(Volunteer.id).all()]


@router.get("/{volunteer_id}", response_model=VolunteerOut)
def get_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return VolunteerOut.from_orm_obj(volunteer)


@router.put("/{volunteer_id}", response_model=VolunteerOut)
def update_volunteer(volunteer_id: int, payload: VolunteerUpdate, db: Session = Depends(get_db)):
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    if payload.name is not None: volunteer.name = payload.name
    if payload.skills is not None: volunteer.skills = ",".join(payload.skills)
    if payload.location is not None: volunteer.location = payload.location
    if payload.latitude is not None: volunteer.latitude = payload.latitude
    if payload.longitude is not None: volunteer.longitude = payload.longitude
    if payload.availability is not None: volunteer.availability = payload.availability

    db.commit()
    db.refresh(volunteer)
    return VolunteerOut.from_orm_obj(volunteer)


@router.delete("/{volunteer_id}", status_code=204)
def delete_volunteer(volunteer_id: int, db: Session = Depends(get_db)):
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    db.delete(volunteer)
    db.commit()
    return None