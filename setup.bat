@echo off
REM Shop Manager Setup Script for Windows

echo ==========================================
echo Shop Manager - Setup Script
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js is installed: 
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed.
    echo npm should be installed with Node.js.
    pause
    exit /b 1
)

echo [OK] npm is installed: 
npm --version
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed successfully!
echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo To start the application:
echo   npm start              - Start the server
echo   npm run dev            - Start with auto-reload (requires nodemon)
echo.
echo Application will be available at:
echo   http://localhost:3000
echo.
echo To access the app:
echo   1. Open http://localhost:3000 in your browser
echo   2. Register a new account
echo   3. Log in with your credentials
echo.
pause
