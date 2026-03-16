@echo off
:: seahawk-backup.bat
:: Run daily via Windows Task Scheduler for automatic backups

set BACKUP_DIR=%~dp0..\backups
set DATE_STR=%date:~10,4%-%date:~4,2%-%date:~7,2%
set BACKUP_FILE=%BACKUP_DIR%\seahawk_%DATE_STR%.sql

:: Create backups folder if it doesn't exist
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Run pg_dump (adjust password and path as needed)
set PGPASSWORD=YOUR_DB_PASSWORD
pg_dump -U postgres seahawk_v6 > "%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo [%date% %time%] Backup created: %BACKUP_FILE% >> "%BACKUP_DIR%\backup.log"
    echo Backup successful: %BACKUP_FILE%
) else (
    echo [%date% %time%] Backup FAILED >> "%BACKUP_DIR%\backup.log"
    echo ERROR: Backup failed!
)

:: Keep only last 30 days of backups
forfiles /p "%BACKUP_DIR%" /s /m *.sql /d -30 /c "cmd /c del @path" 2>nul

set PGPASSWORD=
