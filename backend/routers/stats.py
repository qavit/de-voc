from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas import StatsOverviewDTO
from backend.services.vocabulary import get_overview_stats

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/overview", response_model=StatsOverviewDTO)
def get_stats_overview(db: Session = Depends(get_db)):
    return get_overview_stats(db)
