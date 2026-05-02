@echo off
title Seahawk v2.0 — Production Server
color 1F
cls

echo.
echo  ================================================
echo   SEAHAWK COURIER ^& CARGO v2.0
echo  ================================================
echo.

:: ── Check Node.js ───────────────────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 4F
    echo  ERROR: Node.js not installed!
    echo  Download from: https://nodejs.org
    pause
    exit /b 1
)

:: ── Install backend dependencies if missing ──────────────────────────────────
if not exist "backend\node_modules\" (
    echo  [1/4] Installing backend dependencies...
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo  ERROR: npm install failed.
        pause & exit /b 1
    )
    call npx prisma generate
    cd ..
    echo        Done.
    echo.
)

:: ── Install frontend dependencies if missing ─────────────────────────────────
if not exist "frontend\node_modules\" (
    echo  [2/4] Installing frontend dependencies...
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo  ERROR: Frontend npm install failed.
        pause & exit /b 1
    )
    cd ..
    echo        Done.
    echo.
)

:: ── Build React frontend and sync backend/public ─────────────────────────────
echo  [3/4] Building frontend - please wait 30-60 seconds...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Frontend build failed!
    echo  Try: delete frontend\node_modules and run again.
    pause & exit /b 1
)
cd ..
if exist "backend\public" rmdir /s /q "backend\public"
xcopy /E /I /Y "frontend\dist" "backend\public\" >nul
if %errorlevel% neq 0 (
    echo.
    echo  ERROR: Failed to sync frontend build to backend\public.
    pause & exit /b 1
)
echo        Frontend built and synced.
echo.

:: ── Check .env ───────────────────────────────────────────────────────────────
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
    )
    echo  ================================================
    echo   ACTION REQUIRED: Edit backend\.env and set:
    echo     DATABASE_URL  your postgres password
    echo     JWT_SECRET    any long random string
    echo  ================================================
    start notepad "backend\.env"
    pause
    exit /b 0
)

:: ── Run migrations ───────────────────────────────────────────────────────────
echo  [4/4] Running database migrations...
cd backend
call npx prisma migrate deploy 2>nul
if %errorlevel% neq 0 (
    call npx prisma db push
)
echo        Database ready.
echo.

:: ── Start server ─────────────────────────────────────────────────────────────
echo  Starting Seahawk...
echo.
call node server.js
cd ..

echo.
echo  Server stopped. Press any key to exit.
pause >nul
