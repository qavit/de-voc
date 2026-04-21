import pandas as pd
import json

df = pd.read_excel('German_voc 🇩🇪.xlsx')
df = df.dropna(how='all') # drop completely empty rows
# Forward fill or clean if necessary, but let's just dump as records for now
# Replace NaN with equivalent empty strings or None
df = df.where(pd.notnull(df), None)

# Convert everything to string to avoid datetime mapping errors
df = df.astype(str)
records = df.to_dict(orient='records')

with open('vocab.json', 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

print(f"Exported {len(records)} records to vocab.json")
print("Columns:", df.columns.tolist())
try:
    print("Sample:", records[0])
except IndexError:
    pass
