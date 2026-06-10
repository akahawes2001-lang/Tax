@echo off
echo =============================================
echo   Запуск Tax Calculator (Backend + Frontend)
echo =============================================
echo.
echo Запускаю Backend API...
start "Tax Backend API" cmd /k "cd /d %~dp0tax-api && call venv\Scripts\activate && uvicorn app.main:app --reload"
timeout /t 4 /nobreak >nul
echo Запускаю Frontend...
start "Tax Frontend" cmd /k "cd /d %~dp0tax-frontend && npm run dev"
echo.
echo Ожидайте запуск серверов...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
pause