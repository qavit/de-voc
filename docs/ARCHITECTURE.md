# 技術架構 (Architecture)

本專案採前後端分離架構建置，並以本地端 SQLite 作為唯一 source of truth。

## 後端 (Backend)
- **框架**: Python + FastAPI
- **套件管理**: [uv](https://github.com/astral-sh/uv)
- **資料庫**: SQLite + SQLAlchemy。資料儲存於本地。
- **模組分層**:
  - `routers/`: API 路由
  - `services/`: SRS、字典連結、匯入邏輯
  - `models.py`: 正規化資料模型
  - `schemas.py`: 對外 DTO
- **資料模型**:
  - `vocabularies`: 核心詞條
  - `vocabulary_meanings`, `vocabulary_examples`
  - `vocabulary_tags`, `vocabulary_tag_links`
  - `vocabulary_german_details`
  - `vocabulary_srs_states`
  - `review_events`, `study_sessions`
- **功能特性**:
  - 三段式匯入流程：Excel 抽取、異常審核、正式匯入
  - 德文專屬欄位：冠詞、複數、時態、比較級、動詞搭配
  - SM-2 風格的排程邏輯與 review event logging
  - Dashboard 預備統計 API

## 前端 (Frontend)
- **框架**: React + Vite + TypeScript
- **套件管理**: npm
- **模組分層**:
  - `components/ManagerView.tsx`
  - `components/ReviewView.tsx`
  - `lib/api.ts`
  - `types/api.ts`
- **功能特性**:
  - Manager 列表、搜尋、詞性篩選、排序、詳情側欄
  - Review session 流程與 session 指標顯示
  - 外部辭典 deterministic links
  - 已保留後續 Dashboard / AI Auto-fill 擴充空間
