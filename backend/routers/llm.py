from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.services.llm_service import (
    autofill_german_detail,
    generate_examples,
    validate_vocabulary,
)

router = APIRouter(prefix="/api/llm", tags=["llm"])


def _handle(exc: Exception) -> None:
    if isinstance(exc, LookupError):
        raise HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, ValueError):
        raise HTTPException(status_code=422, detail=str(exc))
    raise HTTPException(status_code=502, detail=f"LLM provider error: {exc}")


@router.post("/vocabularies/{vocabulary_id}/autofill")
async def autofill(vocabulary_id: int, db: Session = Depends(get_db)):
    try:
        return await autofill_german_detail(db, vocabulary_id)
    except Exception as exc:
        _handle(exc)


@router.post("/vocabularies/{vocabulary_id}/examples")
async def examples(vocabulary_id: int, db: Session = Depends(get_db)):
    try:
        return await generate_examples(db, vocabulary_id)
    except Exception as exc:
        _handle(exc)


@router.post("/vocabularies/{vocabulary_id}/validate")
async def validate(vocabulary_id: int, db: Session = Depends(get_db)):
    try:
        return await validate_vocabulary(db, vocabulary_id)
    except Exception as exc:
        _handle(exc)
