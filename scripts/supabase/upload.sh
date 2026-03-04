#!/bin/bash

# ProfitPulse - Upload Data to Supabase
# This script uploads all data from data/exports/ to Supabase

set -e  # Exit on error

echo "🚀 ProfitPulse Data Upload Script"
echo "=================================="
echo ""

# Navigate to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Check if .env exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo "❌ Error: .env file not found in project root"
    echo "   Please create .env with your Supabase credentials"
    echo ""
    echo "   Required variables:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SECRET_KEY"
    echo "   - SUPABASE_PUBLISHABLE_KEY"
    exit 1
fi

# Check if data/exports exists
if [ ! -d "$PROJECT_ROOT/data/exports" ]; then
    echo "❌ Error: data/exports directory not found"
    echo "   Please ensure data files are in data/exports/"
    exit 1
fi

# Check if load_order.xlsx exists
if [ ! -f "$PROJECT_ROOT/data/exports/load_order.xlsx" ]; then
    echo "❌ Error: load_order.xlsx not found in data/exports/"
    exit 1
fi

# Check Python dependencies
echo "📦 Checking Python dependencies..."
pip list | grep -q "supabase" || {
    echo "⚠️  Installing missing dependencies..."
    pip install supabase python-dotenv pandas openpyxl
}

echo "✅ All dependencies installed"
echo ""

# Run upload script
echo "📤 Starting data upload to Supabase..."
echo ""
cd "$SCRIPT_DIR"
python upload_data.py

echo ""
echo "=================================="
echo "✅ Upload process completed!"
echo ""
