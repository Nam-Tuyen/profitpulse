"""
Test script to verify API endpoints work correctly
"""
import json
import os
import sys

# Add api directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from index import app, data_loader

def test_data_loader():
    """Test data loader"""
    print("=" * 50)
    print("Testing Data Loader...")
    print("=" * 50)
    
    # Test metadata
    try:
        metadata = data_loader.get_metadata()
        print("\n✓ get_metadata() works!")
        print(f"  - Firms: {metadata.get('firms_count', 0)}")
        print(f"  - Years: {metadata.get('years', [])}")
        print(f"  - Features: {len(metadata.get('feature_cols', []))}")
    except Exception as e:
        print(f"\n✗ get_metadata() failed: {e}")
    
    # Test summary
    try:
        summary = data_loader.get_summary()
        print("\n✓ get_summary() works!")
        print(f"  - Model metrics available: {bool(summary.get('model_metrics'))}")
        print(f"  - Data info available: {bool(summary.get('data_info'))}")
    except Exception as e:
        print(f"\n✗ get_summary() failed: {e}")

def test_api_endpoints():
    """Test API endpoints"""
    print("\n" + "=" * 50)
    print("Testing API Endpoints...")
    print("=" * 50)
    
    with app.test_client() as client:
        # Test root
        response = client.get('/')
        print(f"\n✓ GET / - Status: {response.status_code}")
        
        # Test /api/meta
        response = client.get('/api/meta')
        print(f"✓ GET /api/meta - Status: {response.status_code}")
        if response.status_code == 200:
            data = json.loads(response.data)
            print(f"  - Response has {len(data)} keys")
        
        # Test /api/summary
        response = client.get('/api/summary')
        print(f"✓ GET /api/summary - Status: {response.status_code}")
        if response.status_code == 200:
            data = json.loads(response.data)
            print(f"  - Response has {len(data)} keys")
        
        # Test /api/health
        response = client.get('/api/health')
        print(f"✓ GET /api/health - Status: {response.status_code}")
        
        # Test /api/alerts/top-risk
        response = client.get('/api/alerts/top-risk')
        print(f"✓ GET /api/alerts/top-risk - Status: {response.status_code}")

if __name__ == '__main__':
    print("\n🚀 ProfitPulse API Test Suite\n")
    test_data_loader()
    test_api_endpoints()
    print("\n" + "=" * 50)
    print("✅ All tests completed!")
    print("=" * 50 + "\n")
