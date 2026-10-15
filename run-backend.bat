@echo off
title HR Manager Backend Server
chcp 65001 >nul
cd /d "%~dp0backend"
echo ===================================================
echo     Starting HR Manager Backend Server (Port 5000)
echo ===================================================
npm start
pause
