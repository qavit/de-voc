import json
import pandas as pd

def clean_val(val):
    if pd.isna(val) or val in ('nan', 'None', '', None):
        return None
    return str(val).strip()

def analyze_and_propose():
    # Load JSON
    with open('vocab.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    df = pd.DataFrame(data)
    
    # We only care about rows where either Unnamed: 7 or Unnamed: 9 are populated
    cols_to_check = ['Unnamed: 7', 'Unnamed: 9']
    
    # Clean the columns to have None instead of 'nan' / 'None'
    for c in cols_to_check:
        if c in df.columns:
            df[c] = df[c].apply(clean_val)
            
    # Also clean the neighboring columns
    df['次類別'] = df['次類別'].apply(clean_val)
    df['中文釋義'] = df['中文釋義'].apply(clean_val)
    
    # Filter anomalous rows
    mask = df['Unnamed: 7'].notnull() | df['Unnamed: 9'].notnull()
    anomalies = df[mask].copy()
    
    print(f"Found {len(anomalies)} rows with data in Unnamed: 7 or Unnamed: 9.")
    
    # Apply rule-based correction
    # Proposed_次類別: If Unnamed: 7 has value, perhaps it's a shifted Subcategory. 
    # If the original Subcategory is empty, we just take it. If not, we merge them (maybe one of them is the tag).
    def rule_subcategory(row):
        u7 = row.get('Unnamed: 7')
        sub = row.get('次類別')
        if not u7:
            return sub
        if not sub:
            return f"[{u7}]" # Indicating it was filled by Unnamed: 7
        return f"{sub} | Tag: {u7}"
        
    # Proposed_中文釋義: If Unnamed: 9 has value, perhaps it's a shifted meaning or notes.
    def rule_meaning(row):
        u9 = row.get('Unnamed: 9')
        ch = row.get('中文釋義')
        if not u9:
            return ch
        if not ch:
            return f"[{u9}]" # Indicating it was filled by Unnamed: 9
        return f"{ch} (Note: {u9})"

    anomalies['Proposed_次類別'] = anomalies.apply(rule_subcategory, axis=1)
    anomalies['Proposed_中文釋義'] = anomalies.apply(rule_meaning, axis=1)
    
    # Select specific columns for export to make it easy for human review
    output_cols = ['單字', '類別', '次類別', 'Unnamed: 7', 'Proposed_次類別', 
                   '中文釋義', 'Unnamed: 9', 'Proposed_中文釋義']
    
    review_df = anomalies[output_cols]
    
    export_path = 'shift_review.csv'
    review_df.to_csv(export_path, index=False, encoding='utf-8-sig') # utf-8-sig for Excel opening smoothly
    
    print(f"Successfully exported {len(anomalies)} rows to {export_path}")
    print("Please review the 'Proposed_*' columns.")

if __name__ == "__main__":
    analyze_and_propose()
