# German Vocab Master 🇩🇪

一個專為德文學習者打造的現代化單字管理與複習系統。從原本粗糙的 Excel 單字本，全面升級為擁有獨立資料庫、Web UI、模糊搜尋，以及未來準備整合「艾賓浩斯記憶模型 (Spaced Repetition System)」與「LLM AI 自動補全例句」的全端系統。

---

## 🛠️ 技術架構

請參閱獨立技術說明文件：[ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 📂 目錄結構與導覽

```text
de-voc/
├── backend/        # FastAPI 伺服器程式碼、資料庫連線與 SQLAlchemy 抽象模型
├── frontend/       # Vite + React 網頁介面 (App.tsx / App.css)
├── scripts/        # 早期用來清洗 Excel、偵測欄位偏移的工具腳本 (僅供備用)
├── data/           # 放置你的私密 Excel 原始母檔、舊版 JSON 備份檔 (已設定 Git 忽略)
├── pyproject.toml  # python 後端套件配置 (使用 uv 生成)
└── README.md       # 本專案說明文件
```

---

## 🚀 入門指南 (如何啟動開發環境)

本軟體採用前後端分離，因此在執行時需要開啟兩個終端機視窗。

### 1. 啟動後端 API
請在專案**根目錄 (`de-voc`)** 下執行：
```bash
# uv 會自動確保你的虛擬環境與套件都是準備好的狀態
uv run uvicorn backend.main:app --reload
```
啟動後，API 預設運行於 `http://127.0.0.1:8000`。
*(小提示：你可以前往 `http://127.0.0.1:8000/docs` 查看由 FastAPI 自動生成的 Swagger 互動式 API 文件！)*

### 2. 啟動前端介面
請打開全新的終端機視窗，進入 `frontend` 資料夾並啟動本地開發伺服器：
```bash
cd frontend
npm install    # 若為初次下載專案需執行
npm run dev
```
啟動後，打開瀏覽器前往 👉 `http://localhost:5173` 即可開始管理你的專屬單字庫！

---

## 🗺️ 未來發展藍圖 (Roadmap)
- [x] **Phase 1: 資料清洗**：無痛將破萬字的 Excel 遷移成 SQLite 正規化資料庫。
- [x] **Phase 2: 基礎管理**：搭建 FastAPI 後台與 React 搜索管理介面。
- [ ] **Phase 3: SRS 記憶引擎**：實作單字複習測驗畫面，加入「簡單、普通、困難」按鈕並記錄熟練度。
- [ ] **Phase 4: LLM AI 擴充**：串接自動化 API 生成德文單字的「實用情境例句」與「動詞變位」。
- [ ] **Phase 5: 視覺化儀表板**：顯示類似 GitHub 的每日熱力圖學習紀錄。
