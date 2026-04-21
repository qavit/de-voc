from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.database import SessionLocal, engine, Base
from backend.models import Vocabulary

Base.metadata.create_all(bind=engine)

app = FastAPI(title="German Vocab Master API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

@app.get("/")
def read_root():
    return {"message": "Welcome to German Vocab Master API"}

@app.get("/api/vocabularies")
def get_vocabularies(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
):
    query = db.query(Vocabulary)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Vocabulary.word.like(search_filter)) |
            (Vocabulary.chinese.like(search_filter)) |
            (Vocabulary.notes.like(search_filter))
        )

    total = query.count()
    results = query.offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": results
    }

class ReviewRequest(BaseModel):
    grade: int = Field(..., ge=0, le=3)  # 0: 忘記(Again), 1: 困難(Hard), 2: 普通(Good), 3: 簡單(Easy)

@app.get("/api/vocabularies/due")
def get_due_vocabularies(
    db: Session = Depends(get_db),
    limit: int = 50
):
    now = utcnow()
    query = db.query(Vocabulary).filter(
        or_(
            Vocabulary.next_review_date == None,
            Vocabulary.next_review_date <= now,
        )
    ).order_by(Vocabulary.next_review_date.asc())

    total = query.count()
    results = query.limit(limit).all()

    return {
        "total_due": total,
        "limit": limit,
        "data": results
    }

@app.put("/api/vocabularies/{voc_id}/review")
def review_vocabulary(
    voc_id: int,
    req: ReviewRequest,
    db: Session = Depends(get_db)
):
    voc = db.query(Vocabulary).filter(Vocabulary.id == voc_id).first()
    if not voc:
        raise HTTPException(status_code=404, detail="Vocabulary not found")

    grade = req.grade

    # SM-2 Algorithm (0–3 scale approximating original 0–5)
    if grade == 0:  # Again — restart from scratch
        voc.repetitions = 0
        voc.interval = 1
        voc.ease_factor = max(1.3, voc.ease_factor - 0.2)
    elif grade == 1:  # Hard — keep progress, shorten interval
        voc.interval = max(1, int(voc.interval * 0.5))
        voc.ease_factor = max(1.3, voc.ease_factor - 0.15)
    elif grade == 2:  # Good
        if voc.repetitions == 0:
            voc.interval = 1
        elif voc.repetitions == 1:
            voc.interval = 6
        else:
            voc.interval = max(1, round(voc.interval * voc.ease_factor))
        voc.repetitions += 1
    elif grade == 3:  # Easy
        if voc.repetitions == 0:
            voc.interval = 4
        elif voc.repetitions == 1:
            voc.interval = 10
        else:
            voc.interval = max(1, round(voc.interval * voc.ease_factor * 1.3))
        voc.repetitions += 1
        voc.ease_factor += 0.15

    voc.next_review_date = utcnow() + timedelta(days=voc.interval)

    db.commit()
    db.refresh(voc)
    return {"message": "Review recorded", "data": voc}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
