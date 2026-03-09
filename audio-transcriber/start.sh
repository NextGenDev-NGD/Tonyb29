#!/bin/bash
# Launch backend + frontend
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting backend on http://localhost:8000 ..."
cd "$ROOT/backend"
"$ROOT/venv/bin/uvicorn" main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:5173 ..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=== Audio Transcriber running ==="
echo "Open http://localhost:5173 in your browser"
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
