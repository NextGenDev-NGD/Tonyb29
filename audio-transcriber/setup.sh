#!/bin/bash
# Run once to install all dependencies
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=== Creating Python virtual environment ==="
python3 -m venv "$ROOT/venv"

echo "=== Installing Python backend dependencies ==="
"$ROOT/venv/bin/pip" install -r "$ROOT/backend/requirements.txt"

echo ""
echo "=== Installing frontend dependencies ==="
cd "$ROOT/frontend"
npm install

echo ""
echo "=== Setup complete. Run ./start.sh to launch the app ==="
