# German Vocab Master

德文單字管理與複習系統。將基於 Excel 的單字清單轉移至具備關聯式資料庫與網頁介面的全端應用，並支援間隔重複（Spaced Repetition System, SRS）與 LLM 輔助學習功能。

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

### 1. 啟動後端 API
於專案根目錄下執行：
```bash
uv run uvicorn backend.main:app --reload
```
後端服務運行於 `http://127.0.0.1:8000`。
API 文件：`http://127.0.0.1:8000/docs`

### 2. 啟動前端介面
於 `frontend` 目錄下執行：
```bash
cd frontend
npm install
npm run dev
```
前端服務運行於 `http://localhost:5173`。

## 功能藍圖 (Roadmap)
- [x] **Phase 1: 資料遷移**：建立 SQLite 正規化資料庫，匯入並清理 Excel 原始資料。
- [x] **Phase 2: 管理介面**：實作具備條件檢索及標籤篩選功能的前端介面。
- [x] **Phase 3: 複習系統 (SRS)**：基於 SM-2 演算法開發學習測驗功能，記錄並運算複習間隔。
- [ ] **Phase 4: LLM 整合**：串接 LLM API 自動生成德文情境例句與動詞不規則變化標記。
- [ ] **Phase 5: 數據儀表板**：實作使用者學習紀錄圖表。
