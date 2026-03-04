#!/bin/bash
# Test Backend API - Quick Script
# Usage: ./test_backend.sh

BASE_URL="http://localhost:5000"

echo ""
echo "=========================================="
echo "  ProfitPulse Backend API Test Script"
echo "=========================================="
echo ""

# Check if backend is running
echo "🔍 Step 1: Testing backend connection..."
if curl -s "${BASE_URL}/health" > /dev/null 2>&1; then
    echo "✅ Backend is running on ${BASE_URL}"
else
    echo "❌ Backend is not running!"
    echo ""
    echo "Please start the backend first:"
    echo "  cd backend"
    echo "  python app.py"
    echo ""
    exit 1
fi

echo ""
echo "🔍 Step 2: Testing /health endpoint..."
HEALTH=$(curl -s "${BASE_URL}/health")
echo "$HEALTH" | jq '.'
if echo "$HEALTH" | grep -q '"status": "ok"'; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

echo ""
echo "🔍 Step 3: Testing /api/meta endpoint..."
META=$(curl -s "${BASE_URL}/api/meta")
echo "$META" | jq '.total_companies, .total_financial_records, .years'
if echo "$META" | grep -q 'total_companies'; then
    COMPANIES=$(echo "$META" | jq '.total_companies')
    RECORDS=$(echo "$META" | jq '.total_financial_records')
    echo "✅ Metadata: $COMPANIES companies, $RECORDS financial records"
else
    echo "❌ Metadata fetch failed"
    exit 1
fi

echo ""
echo "🔍 Step 4: Testing /api/companies endpoint..."
COMPANIES=$(curl -s "${BASE_URL}/api/companies?limit=5")
echo "$COMPANIES" | jq '.count, .companies[0]'
if echo "$COMPANIES" | grep -q 'ticker'; then
    COUNT=$(echo "$COMPANIES" | jq '.count')
    TICKER=$(echo "$COMPANIES" | jq -r '.companies[0].ticker')
    echo "✅ Companies: Retrieved $COUNT companies (first: $TICKER)"
    
    # Save first ticker for next test
    FIRST_TICKER=$TICKER
else
    echo "❌ Companies fetch failed"
    exit 1
fi

echo ""
echo "🔍 Step 5: Testing /api/company/<ticker> endpoint..."
COMPANY=$(curl -s "${BASE_URL}/api/company/${FIRST_TICKER}")
echo "$COMPANY" | jq '.company, .total_years'
if echo "$COMPANY" | grep -q 'financial_data'; then
    YEARS=$(echo "$COMPANY" | jq '.total_years')
    echo "✅ Company details: $FIRST_TICKER has $YEARS years of data"
else
    echo "❌ Company details fetch failed"
    exit 1
fi

echo ""
echo "🔍 Step 6: Testing /api/screener endpoint..."
SCREENER=$(curl -s "${BASE_URL}/api/screener?limit=5")
echo "$SCREENER" | jq '.count, .year'
if echo "$SCREENER" | grep -q 'results'; then
    COUNT=$(echo "$SCREENER" | jq '.count')
    YEAR=$(echo "$SCREENER" | jq '.year')
    echo "✅ Screener: Found $COUNT companies for year $YEAR"
else
    echo "❌ Screener fetch failed"
    exit 1
fi

echo ""
echo "🔍 Step 7: Testing /api/summary endpoint..."
SUMMARY=$(curl -s "${BASE_URL}/api/summary")
echo "$SUMMARY" | jq '.year, .total_companies, .avg_profit_score'
if echo "$SUMMARY" | grep -q 'total_companies'; then
    TOTAL=$(echo "$SUMMARY" | jq '.total_companies')
    AVG=$(echo "$SUMMARY" | jq '.avg_profit_score')
    echo "✅ Summary: $TOTAL companies, avg score: $AVG"
else
    echo "❌ Summary fetch failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "  ✅ ALL TESTS PASSED!"
echo "=========================================="
echo ""
echo "Backend API is working correctly!"
echo "You can now deploy to Render."
echo ""
