@echo off
title FitDB App Launcher
echo ===================================
echo   Starting FitDB (FitAI Coach)
echo ===================================

echo Starting Backend and Frontend Servers together...
start "FitDB" cmd /k "cd /d E:\exercises-dataset && npm start"

echo Waiting for services to initialize...
timeout /t 5 /nobreak > NUL

echo Opening Browser...
start http://localhost:5173

exit
