@echo off
title Seahawk v2.0 — First Time Setup
color 1F
cls
echo.
echo  ================================================
echo   SEAHAWK v2.0 — FIRST TIME SETUP
echo  ================================================
echo.

:: ─── Node.js ─────────────────────────────────────────────────────────────────
echo  [1/5] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo        NOT FOUND — opening download page...
    start https://nodejs.org/en/download
    echo  Install Node.js LTS, then run this file again.
    pause & exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo        OK — Node.js %%i

:: ─── PostgreSQL ──────────────────────────────────────────────────────────────
echo  [2/5] Checking PostgreSQL...
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo        NOT FOUND — opening download page...
    start https://www.postgresql.org/download/windows/
    echo  Install PostgreSQL, then run this file again.
    echo  IMPORTANT: Remember your postgres password!
    pause & exit /b 1
)
echo        OK — PostgreSQL found

:: ─── Create database ─────────────────────────────────────────────────────────
echo  [3/5] Creating seahawk_v6 database...
psql -U postgres -c "CREATE DATABASE seahawk_v6;" 2>nul
echo        Done (may already exist, that is OK)

:: ─── .env setup ──────────────────────────────────────────────────────────────
echo  [4/5] Setting up configuration...
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    echo        Created backend\.env
    echo.
    echo  ==================================================
    echo   IMPORTANT: Set these values in backend\.env:
    echo.
    echo   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD
    echo                 @localhost:5432/seahawk_v6"
    echo.
    echo   JWT_SECRET="any-long-random-string-here"
    echo  ==================================================
    echo.
    start notepad "backend\.env"
    echo  Save the file, then run this setup again.
    pause & exit /b 0
)
echo        OK — backend\.env exists

:: ─── npm install ─────────────────────────────────────────────────────────────
echo  [5/5] Installing dependencies...
cd backend && call npm install
if %errorlevel% neq 0 (
    echo  ERROR: npm install failed.
    pause & exit /b 1
)
echo.
echo  Running Prisma migration...
call npx prisma migrate deploy 2>nul
if %errorlevel% neq 0 (
    echo  Running prisma db push instead...
    call npx prisma db push
)
echo  Running Prisma generate...
call npx prisma generate
echo.
echo  Creating default admin user...
call node src/utils/seed.js
cd ..

echo.
echo  ================================================
echo   SETUP COMPLETE!
echo.
echo   Default login:
echo     Email:    admin@seahawk.com
echo     Password: admin123
echo.
echo   IMPORTANT: Change this password after login!
echo.
echo   Now run: start-seahawk.bat
echo  ================================================
echo.
pause
