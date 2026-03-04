"""
Test Supabase connection and check data integrity
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
load_dotenv(os.path.join(project_root, ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

def test_connection():
    """Test basic connection to Supabase"""
    print("🔍 Testing Supabase Connection...")
    print("=" * 60)
    
    if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
        print("❌ ERROR: Missing Supabase credentials in .env file")
        return False
    
    print(f"✅ Supabase URL: {SUPABASE_URL}")
    print(f"✅ API Key configured: {'Yes' if SUPABASE_SECRET_KEY else 'No'}")
    
    try:
        sb = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
        print("✅ Supabase client created successfully\n")
        return sb
    except Exception as e:
        print(f"❌ ERROR creating Supabase client: {e}\n")
        return None

def check_tables(sb):
    """Check which tables exist and have data"""
    print("\n📊 Checking Tables...")
    print("=" * 60)
    
    tables_to_check = [
        'dim_exchange',
        'dim_gics_industry', 
        'dim_gics_sub_industry',
        'dim_trbc_industry',
        'dim_auditor',
        'companies',
        'financial_raw',
        'proxies_raw',
        'proxies_winsor',
        'winsor_bounds',
        'index_scores',
        'forecast_dataset',
        'predictions',
        'pca_summary',
        'model_performance',
        'robustness_summary'
    ]
    
    table_status = {}
    
    for table in tables_to_check:
        try:
            result = sb.table(table).select("*", count="exact").limit(1).execute()
            count = result.count if hasattr(result, 'count') else 'Unknown'
            table_status[table] = {'exists': True, 'count': count, 'error': None}
            print(f"✅ {table:30s} - {count:>8} rows")
        except Exception as e:
            table_status[table] = {'exists': False, 'count': 0, 'error': str(e)}
            error_msg = str(e)[:50]
            print(f"❌ {table:30s} - Error: {error_msg}")
    
    return table_status

def test_data_integrity(sb):
    """Test data integrity with sample queries"""
    print("\n🔍 Testing Data Integrity...")
    print("=" * 60)
    
    tests_passed = 0
    tests_total = 0
    
    # Test 1: Companies table
    try:
        tests_total += 1
        result = sb.table('companies').select('symbol, company_name').limit(3).execute()
        if result.data and len(result.data) > 0:
            print(f"✅ Test 1: Companies table has data")
            print(f"   Sample: {result.data[0]['symbol']} - {result.data[0]['company_name']}")
            tests_passed += 1
        else:
            print(f"❌ Test 1: Companies table is empty")
    except Exception as e:
        print(f"❌ Test 1 FAILED: {e}")
    
    # Test 2: Financial data
    try:
        tests_total += 1
        result = sb.table('financial_raw').select('firm_id, year, ni_at').limit(3).execute()
        if result.data and len(result.data) > 0:
            print(f"✅ Test 2: Financial data available")
            print(f"   Sample: {result.data[0]['firm_id']} ({result.data[0]['year']})")
            tests_passed += 1
        else:
            print(f"❌ Test 2: Financial table is empty")
    except Exception as e:
        print(f"❌ Test 2 FAILED: {e}")
    
    # Test 3: Foreign key relationships
    try:
        tests_total += 1
        result = sb.table('financial_raw').select('company_pk').limit(1).execute()
        if result.data and len(result.data) > 0:
            company_pk = result.data[0]['company_pk']
            company = sb.table('companies').select('company_name').eq('company_pk', company_pk).execute()
            if company.data:
                print(f"✅ Test 3: Foreign key relationships working")
                tests_passed += 1
            else:
                print(f"❌ Test 3: FK relationship broken")
        else:
            print(f"❌ Test 3: No data to test FK")
    except Exception as e:
        print(f"❌ Test 3 FAILED: {e}")
    
    print(f"\n📈 Tests Passed: {tests_passed}/{tests_total}")
    return tests_passed == tests_total

def main():
    """Main test function"""
    print("\n" + "="*60)
    print("   SUPABASE CONNECTION & DATA INTEGRITY TEST")
    print("="*60 + "\n")
    
    # Test connection
    sb = test_connection()
    if not sb:
        print("\n❌ Cannot proceed without valid connection")
        sys.exit(1)
    
    # Check tables
    table_status = check_tables(sb)
    
    # Count successful tables
    success_count = sum(1 for t in table_status.values() if t['exists'])
    total_count = len(table_status)
    
    # Test data integrity
    integrity_ok = test_data_integrity(sb)
    
    # Final summary
    print("\n" + "="*60)
    print("   SUMMARY")
    print("="*60)
    print(f"📊 Tables Available: {success_count}/{total_count}")
    print(f"✅ Data Integrity: {'PASSED' if integrity_ok else 'FAILED'}")
    print(f"🔗 Connection Status: {'HEALTHY' if sb else 'FAILED'}")
    
    if success_count >= 10 and integrity_ok:
        print("\n✅ Supabase is working normally!")
        return 0
    else:
        print("\n⚠️  Some issues detected. Review errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
