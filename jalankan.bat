@echo off
REM Klik 2x file ini untuk menjalankan Nusantara Space Explorer
cd /d "%~dp0"
echo ============================================
echo  Nusantara Space Explorer
echo  Membuka http://localhost:8080 ...
echo  Tutup window ini untuk mematikan server.
echo ============================================
start "" "http://localhost:8080"
py -m http.server 8080
if errorlevel 1 python -m http.server 8080
pause
