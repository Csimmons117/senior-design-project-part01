@echo off
echo ========================================
echo Starting AI Fitness Helper
echo ========================================
echo.
echo This will start both the backend server and frontend app
echo.
echo Backend Server: http://localhost:4000
echo Frontend App:   http://localhost:5173
echo.
echo Press Ctrl+C in each window to stop the servers
echo ========================================
echo.

echo Starting Backend Server...
start "AI Backend Server" cmd /k "cd ai-personal-trainer\server && npm start"

timeout /t 3 /nobreak > nul

echo Starting Frontend App...
start "AI Frontend App" cmd /k "cd ai-personal-trainer && npm run dev"

echo.
echo ========================================
echo Both servers are starting in separate windows
echo ========================================
echo.
echo Once both servers are running, you can:
echo 1. Open index.html in your browser
echo 2. Click "AI Fitness Helper" in the navigation
echo.
echo Press any key to exit this window...
pause > nul

