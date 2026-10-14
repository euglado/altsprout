@echo off
cd /d "%~dp0"
call npm ci --ignore-scripts
if errorlevel 1 goto failed
call npm run check
if errorlevel 1 goto failed
call npm run setup
if errorlevel 1 goto failed
call npm run register
if errorlevel 1 goto failed
echo Ready. Run start.cmd to keep the bot online.
pause
exit /b 0
:failed
echo Setup stopped. Read the error above. Never share your token.
pause
exit /b 1
