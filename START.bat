@echo off
echo ============================================
echo   Hybrid College Recommendation System
echo ============================================
echo.
echo [1/2] Starting Backend (FastAPI)...
start "Backend" cmd /k "cd /d %~dp0backend && python main.py"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (React)...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo   App is starting up!
echo   Backend: http://localhost:8000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo ============================================
echo.
echo IMPORTANT: Make sure your API key is set in backend/.env
pause
