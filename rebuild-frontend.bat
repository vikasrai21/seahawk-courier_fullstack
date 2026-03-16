@echo off
title Seahawk - Rebuild Frontend
color 1F
cls
echo.
echo  Rebuilding frontend...
echo  (Run this after updating any frontend code)
echo.

cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo  Build failed! See error above.
    pause & exit /b 1
)
cd ..

echo.
echo  Done! Restart start-seahawk.bat to apply changes.
echo.
pause
