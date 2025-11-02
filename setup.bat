@echo off
REM Brand Guardian AI - Windows Setup Script

echo.
echo ========================================================
echo          Brand Guardian AI - Setup Wizard
echo                    Version 2.1.0
echo ========================================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detected: 
node -v
echo.

REM Setup .env
if exist .env (
    echo [WARNING] .env file already exists.
    set /p OVERWRITE="Do you want to overwrite it? (y/N): "
    if /i not "%OVERWRITE%"=="y" (
        echo Keeping existing .env file.
        goto SKIP_ENV
    )
)

echo Creating .env file...
copy .env.example .env >nul
echo [OK] Created .env file
echo.

echo ========================================================
echo  Configuration Required
echo ========================================================
echo.
echo You need at least ONE AI provider API key:
echo   - Google Gemini: https://makersuite.google.com/app/apikey
echo   - OpenAI:        https://platform.openai.com/api-keys
echo   - xAI Grok:      https://console.x.ai/
echo.
echo Please edit the .env file and add your API keys.
echo.

:SKIP_ENV

REM Install dependencies
echo Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed
echo.

REM Create data directory
if not exist data mkdir data
echo [OK] Data directory ready
echo.

echo ========================================================
echo                   Setup Complete!
echo ========================================================
echo.
echo Next steps:
echo.
echo   1. Edit .env file and add your API key:
echo      notepad .env
echo.
echo   2. Start development server:
echo      npm run dev
echo.
echo   3. Open browser to:
echo      http://localhost:5173
echo.
echo Documentation: README.md
echo.
pause

