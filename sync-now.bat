@echo off
:: ============================================================
::  SEAHAWK MANUAL SYNC — Run this once to sync your Excel now
:: ============================================================

:: Set your Excel file path here:
set EXCEL_FILE=C:\Users\%USERNAME%\Documents\seahawk-entries.xlsx

echo.
echo  Seahawk Manual Sync
echo  -------------------
echo  File: %EXCEL_FILE%
echo.

if not exist "%EXCEL_FILE%" (
    echo ERROR: File not found: %EXCEL_FILE%
    echo.
    echo Edit this file and set EXCEL_FILE to your Excel path.
    pause
    exit /b 1
)

node "%~dp0sync-worker.js" "%EXCEL_FILE%" "http://localhost:3001"

echo.
pause
