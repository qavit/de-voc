# German Vocab Master

德文單字管理與複習系統。專案已從單表 MVP 升級為可擴充的本地端平台骨架，包含正規化詞條資料、SRS 狀態與作答事件紀錄、以及可重跑的 Excel 匯入流程。

## 系統架構

詳細架構規劃請參閱：[ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 目錄結構

```text
de-voc/
├── backend/        # FastAPI 後端伺服器與資料庫模型
├── frontend/       # React + Vite 前端介面
├── scripts/        # 資料轉換與檢測的輔助腳本
├── data/           # 原始資料與備份目錄（不追蹤於版控）
├── pyproject.toml  # 後端依賴套件配置
└── README.md       # 專案說明文件
```

## 開發環境啟動指南

本專案採前後端分離架構，需分別啟動服務。

### 1. 先建立或重建本地資料庫
匯入流程分成三步：
```bash
uv run python scripts/convert.py /path/to/German_voc.xlsx
uv run python scripts/anomaly_checker.py
uv run python backend/migrate_db.py --reset
```
第二步會輸出 `data/shift_review.csv`，可先人工調整 `review_status` 與 `review_note` 後再正式匯入。

### 2. 啟動後端 API
於專案根目錄下執行：
```bash
uv run uvicorn backend.main:app --reload
```
後端服務運行於 `http://127.0.0.1:8000`，API 文件位於 `http://127.0.0.1:8000/docs`。

### 3. 啟動前端介面
於 `frontend` 目錄下執行：
```bash
cd frontend
npm install
npm run dev
```
前端服務運行於 `http://localhost:5173`。

## 現階段能力
- 詞條主表 + meanings/examples/tags/german_detail/SRS state 的關聯式資料模型
- `review_events` 與 `study_sessions` 事件紀錄，可支援未來 heatmap 與 dashboard
- `GET /api/vocabularies` 列表查詢，支援搜尋、詞性篩選、標籤篩選、排序、分頁
- `GET /api/vocabularies/{id}` 詳情查詢，包含德文屬性與外部辭典連結
- `GET /api/review/due` 與 `POST /api/review/events` 的 session-oriented 複習流程
- `GET /api/stats/overview` 的基礎統計資料

## 驗證
```bash
uv run python -m unittest discover -s tests -p 'test_*.py'
cd frontend && npm run build
```
