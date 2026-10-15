@echo off
title HR Manager API Automated Tests
chcp 65001 >nul
cd /d "%~dp0backend"
echo ===================================================
echo     Running Automated API Tests
echo ===================================================
npm test
pause
