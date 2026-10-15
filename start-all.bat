@echo off
title HR Manager System Launcher
chcp 65001 >nul
echo ========================================================
echo   🚀 Starting HR Manager ^& Salary Analytics System
echo   Student ID: 6730202041 ^| IP Final 2026
echo ========================================================
echo.

echo [1/3] Starting Backend Server (Port 5000)...
start "HR Backend (Port 5000)" cmd /k "cd /d %~dp0backend && npm start"

echo [2/3] Waiting for Backend to initialize...
timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend Web App (Expo)...
start "HR Frontend (Port 8081)" cmd /k "cd /d %~dp0frontend && npx expo start --web"

echo.
echo ========================================================
echo   ✅ System Launched Successfully!
echo   Opening Web Browser at http://localhost:8081 ...
echo   Login Credentials: admin / password123
echo ========================================================
timeout /t 3 /nobreak >nul
start http://localhost:8081
