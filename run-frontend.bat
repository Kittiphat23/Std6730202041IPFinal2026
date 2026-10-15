@echo off
title HR Manager Frontend (Expo)
chcp 65001 >nul
cd /d "%~dp0frontend"
echo ===================================================
echo     Starting Frontend Expo Server
echo ===================================================
npx expo start --web
pause
