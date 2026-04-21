# 輔助腳本 (Scripts)

此目錄存放專案初期使用的資料清洗與轉換腳本。

- `convert.py`: 將原始 `German_voc.xlsx` 萃取並轉為 JSON 格式，作為建庫前置作業。
- `anomaly_checker.py`: 掃描原始檔案中因未對齊產生的錯位資料（如 `Unnamed: 7` 與 `Unnamed: 9` 欄位），並產生 CSV 報告供人工審查。
