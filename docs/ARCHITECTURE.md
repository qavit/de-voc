# 技術架構 (Architecture)

本專案採用前後端分離架構，並完全以現代化、極速的開發工具搭建：

## Backend (後端)
- **Framework**: Python + FastAPI
- **Package Manager**: [uv](https://github.com/astral-sh/uv) (採用 Rust 開發的極速 Python 套件管理器)
- **Database**: SQLite + SQLAlchemy (本地儲存，確保完全離線可用且保護私人筆記隱私)
- **特色功能**: 自動化資料清洗、解決欄位錯位、標籤分離（將情境分類與中文釋義拆開）、德文強變化動詞與詞性標記。

## Frontend (前端)
- **Framework**: React + Vite + TypeScript (使用 `npm` 管理)
- **UI/UX**: 高質感的 Dark Mode 深色介面表單、採用防抖 (Debounce) 技術實現極速模糊搜尋（過濾字義、拼字或標籤）。
