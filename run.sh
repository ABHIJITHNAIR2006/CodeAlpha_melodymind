#!/usr/bin/env bash
# MelodyMind Startup Script (Linux / macOS)
set -e

echo "======================================================"
echo "    MelodyMind – AI Music Generator Launcher"
echo "======================================================"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js (v18+) is required to run MelodyMind."
    exit 1
fi

# Check for Python (optional for standalone python backend)
if command -v python3 &> /dev/null; then
    echo "Python 3 detected: $(python3 --version)"
fi

echo "Installing frontend/server dependencies if needed..."
npm install

echo "Starting MelodyMind Full-Stack Development Server..."
echo "Accessible at: http://localhost:3000"
npm run dev
