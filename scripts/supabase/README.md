# Supabase Data Management

## Overview
This directory contains scripts for managing ProfitPulse data in Supabase.

## Scripts

### upload_data.py
Uploads all data files to Supabase following the sequence defined in `load_order.xlsx`.

**Usage:**
```bash
cd profitpulse/scripts/supabase
python upload_data.py
```

**Features:**
- Batch upload (500 rows per batch for optimal performance)
- Upsert functionality (insert or update based on conflict keys)
- Automatic NULL value handling
- JSON column parsing for JSONB fields
- Progress tracking and error reporting

**Configuration:**
- Data files location: `profitpulse/data/exports/`
- Environment variables: `profitpulse/.env`
- Upload sequence: `profitpulse/data/exports/load_order.xlsx`

## Data Files

The following files are uploaded in order:

1. **Dimension Tables** (Reference data)
   - `dim_exchange.xlsx` - Stock exchange information
   - `dim_gics_industry.xlsx` - GICS industry classifications
   - `dim_gics_sub_industry.xlsx` - GICS sub-industry classifications
   - `dim_trbc_industry.xlsx` - TRBC industry classifications
   - `dim_auditor.xlsx` - Auditor information

2. **Company Data**
   - `companies.xlsx` - Company master data

3. **Financial Data**
   - `financial_raw.xlsx` - Raw financial metrics
   - `proxies_raw.xlsx` - Raw proxy variables
   - `proxies_winsor.xlsx` - Winsorized proxy variables
   - `winsor_bounds.xlsx` - Winsorization boundaries

4. **Model Results**
   - `forecast_dataset.xlsx` - Dataset used for forecasting
   - `predictions.xlsx` - Model predictions
   - `index_scores.xlsx` - Calculated index scores

5. **Metadata & Quality**
   - `pca_summary.xlsx` - PCA analysis summary
   - `pca_artifacts_k3.json` - PCA artifacts (K=3)
   - `model_performance.xlsx` - Model performance metrics
   - `robustness_summary.xlsx` - Robustness test results
   - `missing_company_symbols.xlsx` - Quality check for missing data

## Environment Setup

1. Ensure `.env` file exists in project root with:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_secret_key
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

2. Install required packages:
```bash
pip install pandas openpyxl python-dotenv supabase
```

## Troubleshooting

### Missing Files
- Check that all files listed in `load_order.xlsx` exist in `data/exports/`
- Script will skip missing files and continue

### Upload Errors
- Verify Supabase credentials in `.env`
- Check table schemas match data structure
- Ensure conflict keys (upsert_key) are defined correctly

### Performance Issues
- Adjust `BATCH_SIZE` in upload_data.py (default: 500)
- For large datasets, consider increasing batch size to 1000
- For unstable connections, decrease to 200

## Data Maintenance

### Updating Data
1. Process new data using backend pipeline
2. Export to `data/exports/` directory
3. Run upload script to sync with Supabase

### Adding New Tables
1. Add entry to `load_order.xlsx` with:
   - `order`: Upload sequence number
   - `table`: Supabase table name
   - `file`: Excel filename
   - `upsert_key`: Conflict resolution columns
2. Run upload script

### Monitoring
- Check console output for upload progress
- Verify row counts in Supabase dashboard
- Review any skipped or failed uploads
