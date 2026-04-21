from fastapi import FastAPI, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

from backend.database import SessionLocal, engine, Base
from backend.models import Vocabulary

# 雖然在 migrate 時已建立，確保在 server 啟動時表存在
Base.metadata.create_all(bind=engine)

app = FastAPI(title="German Vocab Master API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
