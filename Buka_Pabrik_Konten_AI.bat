@echo off
title Pabrik Konten AI & Facebook Planner
echo ========================================================
echo   PABRIK KONTEN AI & FACEBOOK PLANNER MULTI-PRODUK
echo ========================================================
echo Membuka browser ke http://localhost:3300 ...
cd /d "%~dp0"
timeout /t 1 >nul
start http://localhost:3300
node scripts/dashboard_server.js
pause
