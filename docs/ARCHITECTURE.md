# 技術架構 (Architecture)

本專案採前後端分離架構建置。

## 後端 (Backend)
- **框架**: Python + FastAPI
- **套件管理**: [uv](https://github.com/astral-sh/uv)
- **資料庫**: SQLite + SQLAlchemy。資料儲存於本地。
- **功能特性**: 
  - 資料清理與遷移。
  - 將原始混合標籤解析為獨立的情境與次類別欄位。
  - 支援單字之詞性與強變化動詞 (Strong Verb) 記錄。
  - 實作 SM-2 間隔重複演算法 (SRS) API。

## 前端 (Frontend)
- **框架**: React + Vite + TypeScript
- **套件管理**: npm
- **功能特性**:
  - 單字瀏覽與管理介面，實作防抖 (Debounce) 機制的輸入檢索。
  - 實作翻轉字卡測驗模式，與後端 API 結合以更新單字學習間隔。
  - 客製深色主題 (Dark Mode) 排版。
