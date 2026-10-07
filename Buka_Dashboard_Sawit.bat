@echo off
title Dashboard Facebook - Solusi Sawit Nusantara
echo ========================================================
echo   SOLUSI SAWIT NUSANTARA - FACEBOOK AUTO-SCHEDULER
echo ========================================================
echo Membuka browser ke http://localhost:3300 ...
cd /d "%~dp0"
timeout /t 1 >nul
start http://localhost:3300
node scripts/dashboard_server.js
pause
