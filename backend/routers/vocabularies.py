from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas import PaginatedVocabularyResponse, VocabularyDetailDTO
from backend.services.vocabulary import get_vocabulary_detail, list_vocabularies

router = APIRouter(prefix="/api/vocabularies", tags=["vocabularies"])


@router.get("", response_model=PaginatedVocabularyResponse)
def get_vocabularies(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = None,
    part_of_speech: str | None = None,
    category: str | None = None,
    tag: str | None = None,
    sort: str = Query("lemma"),
    db: Session = Depends(get_db),
):
    return list_vocabularies(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        part_of_speech=part_of_speech,
        category=category,
        tag=tag,
        sort=sort,
    )


@router.get("/{vocabulary_id}", response_model=VocabularyDetailDTO)
def get_vocabulary(vocabulary_id: int, db: Session = Depends(get_db)):
    vocabulary = get_vocabulary_detail(db, vocabulary_id)
    if not vocabulary:
        raise HTTPException(status_code=404, detail="Vocabulary not found")
    return vocabulary
