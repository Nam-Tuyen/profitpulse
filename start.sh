#!/bin/bash

# Quick Start Script
# Run both backend and frontend

echo "=================================="
echo "  ProfitScore - Quick Start"
echo "=================================="

# Check if backend cache exists
if [ ! -f "backend/cache/predictions.parquet" ]; then
    echo ""
    echo "⚠ Cache chưa được build. Chạy pipeline trước..."
    echo ""
    python3 backend/pipeline.py --data Data.xlsx --train-year 2020 --test-year 2021
    echo ""
    echo "✓ Pipeline hoàn tất!"
    echo ""
fi

# Start backend in background
echo "🚀 Starting Backend API Server..."
python3 backend/api_server.py &
BACKEND_PID=$!
echo "✓ Backend started (PID: $BACKEND_PID)"

# Wait for backend to start
sleep 3

# Start frontend
echo ""
echo "🚀 Starting Frontend Dev Server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "✓ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "=================================="
echo "  ✓ Setup Complete!"
echo "=================================="
echo ""
echo "Backend API:  http://localhost:5000"
echo "Frontend App: http://localhost:3000"
echo ""
echo "Press CTRL+C to stop both servers"
echo ""

# Wait for user to press CTRL+C
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
