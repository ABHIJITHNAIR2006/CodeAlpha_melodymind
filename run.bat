@echo off
REM MelodyMind Startup Script for Windows
echo ======================================================
echo     MelodyMind - AI Music Generator Launcher
echo ======================================================

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js (v18+) is required to run MelodyMind.
    echo Please install from https://nodejs.org/
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install

echo Starting MelodyMind Full-Stack Server on http://localhost:3000
call npm run dev
pause
