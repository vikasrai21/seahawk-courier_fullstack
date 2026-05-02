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
if exist "backend\public" rmdir /s /q "backend\public"
xcopy /E /I /Y "frontend\dist" "backend\public\" >nul
if %errorlevel% neq 0 (
    echo.
    echo  Sync failed! Could not copy frontend\dist to backend\public.
    pause & exit /b 1
)

echo.
echo  Done! Frontend rebuilt and synced to backend\public.
echo  Restart start-seahawk.bat if server is already running.
echo.
pause
