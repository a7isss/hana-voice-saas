@echo off
echo ===========================================
echo Starting Next.js Voice Tester UI
echo Port: 3002 ^| URL: http://localhost:3002/voice-tester
echo ===========================================
echo.

cd "D:\0- Sites & services\2- voice robot"

echo Checking prerequisites...
echo.

echo Checking if Node.js is available...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js first.
    echo Install from: https://nodejs.org
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✓ Node.js is available: %NODE_VERSION%
)

echo Checking if npm is available...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available. Please install Node.js which includes npm.
    echo Install from: https://nodejs.org
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✓ npm is available: %NPM_VERSION%
)

echo.
echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo Installing dependencies (this may take a few minutes)...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✓ Dependencies installed successfully
) else (
    echo ✓ Dependencies already installed
)

echo.
echo Starting Next.js development server on port 3002...
echo ===========================================
echo Public URLs:
echo - Voice Tester: http://localhost:3002/voice-tester
echo - Admin Panel: http://localhost:3002/admin
echo - Home: http://localhost:3002
echo ===========================================
echo.

call npx next dev --port 3002

echo.
echo Next.js development server stopped.
pause
