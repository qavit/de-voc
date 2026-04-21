from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Text
from .database import Base
from datetime import datetime

class Vocabulary(Base):
    __tablename__ = "vocabularies"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, index=True, nullable=False)
    variations = Column(String, nullable=True) # 單字及詞形變化 / 介系詞搭配
    is_strong_verb = Column(Boolean, default=False) # 強變化動詞
    
    # Translations
    chinese = Column(String, nullable=True)
    english = Column(String, nullable=True)
    taiwanese = Column(String, nullable=True)
    notes = Column(Text, nullable=True) # 補充筆記

    # Classification
    category = Column(String, index=True, nullable=True)
    sub_category = Column(String, index=True, nullable=True)
    context_tag = Column(String, index=True, nullable=True) # 原本的 Unnamed 德文標籤

    # Spaced Repetition System (SRS) - SM-2 Algorithm fields
    ease_factor = Column(Float, default=2.5)
    interval = Column(Integer, default=0)
    repetitions = Column(Integer, default=0)
    next_review_date = Column(DateTime, default=datetime.utcnow)
