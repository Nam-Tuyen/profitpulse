#!/bin/bash
# Quick Start Script for ProfitScore Demo
# Usage: ./demo.sh

set -e

echo "🚀 ProfitScore - Quick Demo"
echo "================================="
echo ""

# Check if in correct directory
if [ ! -f "Data.xlsx" ]; then
    echo "❌ Error: Data.xlsx not found!"
    echo "Please run this script from project root:"
    echo "  cd /Users/namtuyen/Downloads/Project_code/final_thesis"
    echo "  ./demo.sh"
    exit 1
fi

# Activate venv
if [ ! -d ".venv" ]; then
    echo "❌ Error: .venv not found!"
    echo "Please create virtual environment first:"
    echo "  python -m venv .venv"
    echo "  source .venv/bin/activate"
    echo "  pip install -r requirements.txt"
    exit 1
fi

echo "✅ Activating virtual environment..."
source .venv/bin/activate

# Check dependencies
echo "✅ Checking dependencies..."
python -c "import flask; import pandas; import sklearn; import xgboost" 2>/dev/null || {
    echo "⚠️  Installing dependencies..."
    pip install -r requirements.txt -q
}

# Run pipeline
echo ""
echo "📊 Running ML Pipeline..."
echo "================================="
python backend/main.py pipeline \
    --use-profitpulse \
    --data Data.xlsx \
    --train-year 2019 \
    --test-year 2020

echo ""
echo "✅ Pipeline complete! Artifacts in: artifacts_profitpulse/"
echo ""

# Show metrics
if [ -f "artifacts_profitpulse/model_metrics.json" ]; then
    echo "📈 Model Performance:"
    echo "================================="
    python -m json.tool artifacts_profitpulse/model_metrics.json | grep -A 6 '"XGBoost"'
    echo ""
fi

# Ask to start server
echo "🌐 Start API server? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "Starting API server on port 5001..."
    echo "Press Ctrl+C to stop"
    echo ""
    echo "API endpoints:"
    echo "  - Health: http://localhost:5001/health"
    echo "  - Screener: http://localhost:5001/api/screener"
    echo "  - Company: http://localhost:5001/api/company/<ticker>"
    echo ""
    python backend/main.py serve --port 5001
else
    echo ""
    echo "✅ Demo complete!"
    echo ""
    echo "To start API server later:"
    echo "  source .venv/bin/activate"
    echo "  python backend/main.py serve --port 5001"
    echo ""
    echo "To start frontend:"
    echo "  cd frontend"
    echo "  npm run dev"
fi
