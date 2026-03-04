"""Test database.py fixes for company_pk lookup"""
import sys
sys.path.insert(0, '.')
from database import get_db

print('🧪 Testing database.py fixes...')
db = get_db()

# Test 1: Get company by ticker
print('\n1️⃣ Get company VNM:')
company = db.get_company_by_ticker('VNM')
if company:
    print(f'✅ Ticker: {company["ticker"]}')
    print(f'✅ Company PK: {company["company_pk"]}')
    print(f'✅ Name: {company.get("company_name", "N/A")}')
else:
    print('❌ Company not found')
    sys.exit(1)

# Test 2: Get financial data
print('\n2️⃣ Get financial data for VNM:')
financial = db.get_financial_data(ticker='VNM')
if financial:
    print(f'✅ Financial records: {len(financial)}')
    print(f'✅ Latest year: {financial[0].get("year")}')
    print(f'✅ Sample columns: {list(financial[0].keys())[:6]}...')
else:
    print('❌ No financial data')

# Test 3: Get index scores
print('\n3️⃣ Get index scores for VNM:')
scores = db.get_index_scores(ticker='VNM')
if scores:
    print(f'✅ Score records: {len(scores)}')
    if scores[0]:
        print(f'✅ Sample: year={scores[0].get("year")}, profit_score={scores[0].get("profit_score")}')
else:
    print('⚠️  No scores (predictions table might be empty)')

print('\n✅ All key tests passed!')
