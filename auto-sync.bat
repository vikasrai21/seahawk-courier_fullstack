@echo off
setlocal enabledelayedexpansion
title Seahawk Auto-Sync

:: ============================================================
::  SEAHAWK EXCEL AUTO-SYNC
::  Edit the two lines below, then double-click this file.
:: ============================================================

:: 1. Full path to YOUR Excel file (the one you do entries in)
set EXCEL_FILE=C:\Users\%USERNAME%\Documents\seahawk-entries.xlsx

:: 2. How often to check for changes (in seconds). Default: 300 = every 5 minutes
set INTERVAL=300

:: 3. Dashboard URL (Railway production backend)
set DASHBOARD=https://seahawk-courierfullstack-production.up.railway.app

:: ============================================================
::  DO NOT EDIT BELOW THIS LINE
:: ============================================================

echo.
echo  ===================================================
echo   SEAHAWK EXCEL AUTO-SYNC
echo  ===================================================
echo.
echo  Watching: %EXCEL_FILE%
echo  Syncing to: %DASHBOARD%
echo  Interval: every %INTERVAL% seconds
echo.
echo  Keep this window open. Press Ctrl+C to stop.
echo  ===================================================
echo.

:: Check Node.js available
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Check xlsx-to-json script
set SYNC_SCRIPT=%~dp0sync-worker.js
if not exist "%SYNC_SCRIPT%" (
    echo ERROR: sync-worker.js not found in %~dp0
    echo Please extract the full seahawk zip again.
    pause
    exit /b 1
)

:: Check Excel file exists
if not exist "%EXCEL_FILE%" (
    echo WARNING: Excel file not found at:
    echo   %EXCEL_FILE%
    echo.
    echo Edit this .bat file and set EXCEL_FILE to the correct path.
    echo Example: set EXCEL_FILE=C:\Users\YourName\Desktop\entries.xlsx
    echo.
    pause
    exit /b 1
)

set LAST_MODIFIED=0

:loop
    :: Get last modified time of Excel file
    for %%f in ("%EXCEL_FILE%") do set CURRENT_MODIFIED=%%~tf

    if "!CURRENT_MODIFIED!" neq "!LAST_MODIFIED!" (
        echo [%time%] Change detected — syncing...
        node "%SYNC_SCRIPT%" "%EXCEL_FILE%" "%DASHBOARD%"
        if !ERRORLEVEL! equ 0 (
            echo [%time%] Sync complete.
        ) else (
            echo [%time%] Sync had errors — check above.
        )
        set LAST_MODIFIED=!CURRENT_MODIFIED!
    )

    :: Wait INTERVAL seconds before checking again
    timeout /t %INTERVAL% /nobreak >nul
goto loop
