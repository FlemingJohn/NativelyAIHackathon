from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import StartupProfile
from app.schemas import StartupProfileCreate, StartupProfileOut, StartupProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])


@router.post("", response_model=StartupProfileOut)
def create_profile(payload: StartupProfileCreate, db: Session = Depends(get_db)):
    profile = StartupProfile(**payload.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/{profile_id}", response_model=StartupProfileOut)
def get_profile(profile_id: str, db: Session = Depends(get_db)):
    profile = db.get(StartupProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")
    return profile


@router.patch("/{profile_id}", response_model=StartupProfileOut)
def update_profile(profile_id: str, payload: StartupProfileUpdate, db: Session = Depends(get_db)):
    profile = db.get(StartupProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
