import json
import os
import re
from sqlalchemy.orm import Session
from backend.database import engine, Base, SessionLocal
from backend.models import Vocabulary

def is_chinese(text):
    if not text: return False
    # Check if there's any CJK character in the string
    return bool(re.search(r'[\u4e00-\u9fff]', text))

def clean(val):
    if val in (None, "", "nan", "None"):
        return None
    return str(val).strip()

def run_migration():
    # 建立資料表
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 載入原始資料
    json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'vocab.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    print(f"Loaded {len(data)} records. Starting migration...")
    
    vocab_objects = []
    
    for row in data:
        word = clean(row.get('單字'))
        if not word:
            continue
            
        variations = clean(row.get('單字及詞形變化'))
        ch = clean(row.get('中文釋義'))
        eng = clean(row.get('英文釋義'))
        tw = clean(row.get('台文釋義'))
        cat = clean(row.get('類別'))
        sub_cat = clean(row.get('次類別'))
        
        u7 = clean(row.get('Unnamed: 7'))
        u9 = clean(row.get('Unnamed: 9'))
        
        context_tags = []
        notes = []
        
        # 處理 Unnamed: 7 和 Unnamed: 9 錯位與標籤邏輯
        for u_val in [u7, u9]:
            if not u_val:
                continue
            if is_chinese(u_val):
                # 判斷如果是中文且原本無中文釋義，填補進去，否則放進筆記
                if not ch:
                    ch = u_val
                elif u_val not in ch:
                    notes.append(u_val)
            else:
                # 判斷是德文 / 情境標籤
                context_tags.append(u_val)
                
        # 強變化動詞判斷：如果變化欄位裡有 (i, a, o) 或類似標記，未來可由 LLM 標註。現在預設為 False。
        is_strong = False
        
        v = Vocabulary(
            word=word,
            variations=variations,
            is_strong_verb=is_strong,
            chinese=ch,
            english=eng,
            taiwanese=tw,
            category=cat,
            sub_category=sub_cat,
            context_tag=", ".join(context_tags) if context_tags else None,
            notes="; ".join(notes) if notes else None
        )
        vocab_objects.append(v)
        
    db.add_all(vocab_objects)
    db.commit()
    db.close()
    print(f"Migration completed! Inserted {len(vocab_objects)} rows into vocab_master.db.")

if __name__ == "__main__":
    run_migration()
