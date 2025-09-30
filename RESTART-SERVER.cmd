@echo off
echo ========================================
echo    RESTART DEV SERVER - FIX PRINT VIEW
echo ========================================
echo.
echo Dang dung server hien tai...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Clearing cache...
if exist .next (
    rmdir /s /q .next
    echo Cache cleared!
)
echo.
echo Starting server...
echo.
start cmd /k "npm run dev"
echo.
echo ========================================
echo Server dang khoi dong lai...
echo Vui long doi 10-15 giay roi refresh browser
echo ========================================
echo.
pause
