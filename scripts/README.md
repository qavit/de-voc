# 德文單字庫處理腳本 (Scripts)

這裡存放專案初期的「一次性」資料清理與轉接腳本。未來如果獲得新的原始 Excel 檔，可利用這些工具進行預處理：

- `convert.py`: 將第一版的 `German_voc.xlsx` 萃取所有效資料（略去空行），轉存為 JSON 格式，為後續的資料庫處理做準備。
- `anomaly_checker.py`: 用來掃描並標記在原始 Excel 裡因為沒有對齊導致錯位到 `Unnamed: 7` 與 `Unnamed: 9` 的欄位資料，並能自動產出待審核的 CSV 檔案。
