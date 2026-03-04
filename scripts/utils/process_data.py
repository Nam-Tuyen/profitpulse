"""
Data Processing Script
Converts Data.xlsx to JSON cache files for Vercel deployment
"""
import pandas as pd
import numpy as np
import json
import os
from pathlib import Path

def process_data_xlsx():
    """Process Data.xlsx and create JSON artifacts"""
    print("📊 Processing Data.xlsx...")
    
    # Read Excel file
    try:
        df = pd.read_excel('Data.xlsx')
        print(f"✓ Loaded data: {df.shape[0]} rows, {df.shape[1]} columns")
    except Exception as e:
        print(f"✗ Error loading Data.xlsx: {e}")
        return False
    
    # Get basic info
    firms = sorted(df['FIRM_ID'].unique().tolist()) if 'FIRM_ID' in df.columns else []
    years = sorted(df['year'].unique().tolist()) if 'year' in df.columns else []
    
    print(f"  - Firms: {len(firms)}")
    print(f"  - Years: {years}")
    
    # Identify feature columns
    feature_cols = [col for col in df.columns if col.startswith('X')]
    print(f"  - Features: {feature_cols}")
    
    # Create data_info
    data_info = {
        'firms': firms[:50],  # Limit to 50 for performance
        'firm_count': len(firms),
        'years': years,
        'year_min': int(min(years)) if years else 2018,
        'year_max': int(max(years)) if years else 2023,
        'record_count': len(df),
        'total_firms': len(firms),
        'high_risk_count': int(df[df.get('Label_t', 0) == 1].shape[0]) if 'Label_t' in df.columns else 0,
        'low_risk_count': int(df[df.get('Label_t', 0) == 0].shape[0]) if 'Label_t' in df.columns else 0
    }
    
    # Create features mapping
    features = {}
    feature_names = {
        'X1_ROA': 'Return on Assets',
        'X2_ROE': 'Return on Equity',
        'X3_ROC': 'Return on Capital',
        'X4_EPS': 'Earnings per Share',
        'X5_NPM': 'Net Profit Margin',
        'X6_OPM': 'Operating Profit Margin',
        'X7_GPM': 'Gross Profit Margin',
        'X8_ROS': 'Return on Sales',
        'X9_CR': 'Current Ratio',
        'X10_QR': 'Quick Ratio'
    }
    
    for col in feature_cols:
        features[col] = feature_names.get(col, col.replace('_', ' ').title())
    
    # Update methodology_snapshot.json
    methodology_path = 'artifacts_profitpulse/methodology_snapshot.json'
    
    # Load existing or create new
    if os.path.exists(methodology_path):
        with open(methodology_path, 'r', encoding='utf-8') as f:
            methodology = json.load(f)
    else:
        methodology = {'methodology': {}}
    
    # Update with new data
    methodology['data_info'] = data_info
    methodology['features'] = features
    
    # Save
    os.makedirs('artifacts_profitpulse', exist_ok=True)
    with open(methodology_path, 'w', encoding='utf-8') as f:
        json.dump(methodology, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Updated {methodology_path}")
    
    # Create company cache (sample data)
    print("\n📦 Creating company data cache...")
    company_cache = {}
    
    for firm in firms[:10]:  # Sample 10 companies
        firm_data = df[df['FIRM_ID'] == firm].sort_values('year')
        
        company_cache[firm] = {
            'FIRM_ID': firm,
            'years': firm_data['year'].tolist(),
            'records': []
        }
        
        for _, row in firm_data.iterrows():
            record = {
                'year': int(row['year']),
                'features': {}
            }
            
            # Add feature values
            for col in feature_cols:
                if col in row:
                    val = row[col]
                    record['features'][col] = float(val) if pd.notna(val) else None
            
            # Add label if exists
            if 'Label_t' in row:
                record['label'] = int(row['Label_t']) if pd.notna(row['Label_t']) else None
            
            company_cache[firm]['records'].append(record)
    
    # Save company cache
    cache_path = 'artifacts_profitpulse/company_cache.json'
    with open(cache_path, 'w', encoding='utf-8') as f:
        json.dump(company_cache, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Created {cache_path}")
    
    # Create summary stats
    print("\n📈 Creating summary statistics...")
    
    summary_stats = {
        'total_records': len(df),
        'total_firms': len(firms),
        'years_covered': years,
        'features': feature_cols,
        'label_distribution': {}
    }
    
    if 'Label_t' in df.columns:
        summary_stats['label_distribution'] = df['Label_t'].value_counts().to_dict()
    
    stats_path = 'artifacts_profitpulse/summary_stats.json'
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(summary_stats, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Created {stats_path}")
    
    print("\n✅ Data processing completed!")
    print("\nGenerated files:")
    print("  - artifacts_profitpulse/methodology_snapshot.json")
    print("  - artifacts_profitpulse/company_cache.json")
    print("  - artifacts_profitpulse/summary_stats.json")
    
    return True

if __name__ == '__main__':
    print("🚀 ProfitPulse Data Processor\n")
    success = process_data_xlsx()
    
    if success:
        print("\n✅ Ready to deploy! Run: git add . && git commit -m 'Update data cache' && git push")
    else:
        print("\n✗ Processing failed. Please check Data.xlsx exists and is valid.")
