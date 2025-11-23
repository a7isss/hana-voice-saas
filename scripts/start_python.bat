@echo off
echo ===========================================
echo Starting Python Voice Service
echo Port: 8000 ^| WebSocket Echo: ws://localhost:8000/ws/echo
echo ===========================================
echo.

cd "D:\0- Sites & services\2- voice robot\Python\voice_service"

echo Checking prerequisites...
echo.

echo Checking if uv is available...
uv --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: uv is not installed. Please install uv first.
    echo Install from: https://github.com/astral-sh/uv
    pause
    exit /b 1
) else (
    echo ✓ uv is available
)

echo Checking if ffmpeg is available...
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: ffmpeg not found in PATH. Service may not process WebM audio correctly.
    echo Install with: winget install Gyan.FFmpeg
    echo.
) else (
    echo ✓ ffmpeg is available
)

echo.
echo Starting Python voice service...
echo ===========================================
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level info

echo.
echo Voice service stopped.
pause
