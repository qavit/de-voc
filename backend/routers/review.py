from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas import DueReviewResponse, ReviewEventCreate, ReviewEventResultDTO
from backend.services.vocabulary import create_due_session, record_review_event

router = APIRouter(prefix="/api/review", tags=["review"])


@router.get("/due", response_model=DueReviewResponse)
def get_due_cards(limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    return create_due_session(db, limit=limit)


@router.post("/events", response_model=ReviewEventResultDTO)
def create_review_event(payload: ReviewEventCreate, db: Session = Depends(get_db)):
    try:
        return record_review_event(db, payload)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
