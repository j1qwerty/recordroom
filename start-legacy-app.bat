@echo off
REM Double-click starter for the legacy PHP app (runs in WSL).
REM Contains the WSL sudo password in plain text by your request - keep this file private.
set SUDO_PASS=2106
set WSLENV=SUDO_PASS
wsl --exec bash /mnt/e/fusion/recordroom/scripts/legacy-wsl-start.sh
echo.
echo Open http://localhost:8000/ and login with admin / admin123
start http://localhost:8000/
pause
