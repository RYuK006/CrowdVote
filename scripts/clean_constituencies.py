import csv
import os

input_file = 'server/data/master_data.csv'
output_file = 'server/data/master_data_cleaned.csv'

# Party to Symbol mapping
symbol_map = {
    'BJP': 'bjp.svg',
    'CPI': 'cpi.svg',
    'CPI(M)': 'cpim.png',
    'INC': 'inc.svg',
    'INL': 'inl.png',
    'IUML': 'iuml.svg',
    'Kerala Congress (M)': 'kcm.svg',
    'RMPI': 'rmpi.jpg',
    # Support variants
    'Independent (CPI(M) support)': 'cpim.png',
    'Independent (CPI support)': 'cpi.svg',
    'Independent (INC Support)': 'inc.svg',
    'Independent (INL Support)': 'inl.png',
    'Independent (INL support)': 'inl.png',
    'Independent (IUML Support)': 'iuml.svg'
}

with open(input_file, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

for row in rows:
    ldf_party = row['2026_LDF_Party']
    udf_party = row['2026_UDF_Party']
    nda_party = row['2026_NDA_Party']
    
    symbols = []
    
    # Try to find symbols for each party
    # LDF
    if ldf_party in symbol_map:
        symbols.append(f"/symbols/{symbol_map[ldf_party]}")
    # UDF
    if udf_party in symbol_map:
        symbols.append(f"/symbols/{symbol_map[udf_party]}")
    # NDA
    if nda_party in symbol_map:
        symbols.append(f"/symbols/{symbol_map[nda_party]}")
        
    # Join symbols with pipe, as used in the original CSV
    # User said: "if no party symbol is in the files, then leave it blank"
    # This logic naturally omits parties that aren't in the mapping.
    row['Local_Images'] = " | ".join(symbols)

with open(output_file, mode='w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"Cleaned {len(rows)} constituencies. Saved to {output_file}")
