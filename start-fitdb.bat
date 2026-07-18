@echo off
title FitDB App Launcher
echo ===================================
echo   Starting FitDB (FitAI Coach)
echo ===================================

echo [1/2] Starting Backend Server...
start "FitDB Backend" cmd /k "cd /d E:\exercises-dataset && node backend/server.js"

echo [2/2] Starting Frontend Server...
start "FitDB Frontend" cmd /k "cd /d E:\exercises-dataset\frontend && npm run dev"

echo Waiting for services to initialize...
timeout /t 3 /nobreak > NUL

echo Opening Browser...
start http://localhost:5173

exit
