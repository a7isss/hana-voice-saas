# Local Railway Deployment Test Script (PowerShell Version)
# This script tests your application locally using Docker to replicate Railway's environment

param(
    [switch]$SkipBrowserPrompt
)

# Check if Docker is running
Write-Host "🚀 Starting Local Railway Deployment Test" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local not found. Creating from example..." -ForegroundColor Yellow
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "📝 Please edit .env.local with your actual values before continuing." -ForegroundColor Yellow
    Write-Host "   Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Yellow
    Read-Host "Press Enter when you've updated .env.local"
}

Write-Host "📦 Building and testing services..." -ForegroundColor Blue
Write-Host ""

# Build and test individual services first
Write-Host "1️⃣ Testing Next.js Frontend Build" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

npm ci --only=production
npm run build
Write-Host "✅ Next.js build successful" -ForegroundColor Green

Write-Host ""
Write-Host "2️⃣ Testing Python Voice Service Build" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

Set-Location "Python/voice_service"

# Check if uv is available
$uvAvailable = Get-Command "uv" -ErrorAction SilentlyContinue
if ($uvAvailable) {
    Write-Host "Using UV package manager..." -ForegroundColor Blue
    uv pip install --no-cache-dir -e .
} else {
    Write-Host "Using pip package manager..." -ForegroundColor Blue
    pip install --no-cache-dir -e .
}

Write-Host "✅ Python service dependencies installed" -ForegroundColor Green
Set-Location "../.."

Write-Host ""
Write-Host "3️⃣ Testing Docker Build Process" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Test Next.js Docker build
Write-Host "Building Next.js Docker image..." -ForegroundColor Blue
docker build -f Dockerfile.nextjs -t hana-voice-saas:test .
Write-Host "✅ Next.js Docker image built successfully" -ForegroundColor Green

# Test Python service Docker build
Write-Host "Building Python Voice Service Docker image..." -ForegroundColor Blue
docker build -f Python/voice_service/Dockerfile -t hana-voice-service:test Python/voice_service/
Write-Host "✅ Python Voice Service Docker image built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "4️⃣ Testing Complete Docker Stack" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Start services with docker-compose
Write-Host "Starting complete stack..." -ForegroundColor Blue
docker-compose down --remove-orphans 2>$null
docker-compose up -d --build

Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow

# Wait for Next.js to be healthy
Write-Host "Checking Next.js health..." -ForegroundColor Blue
$nextjsReady = $false
$timeout = 120
$elapsed = 0

while (-not $nextjsReady -and $elapsed -lt $timeout) {
    try {
        Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing | Out-Null
        $nextjsReady = $true
    } catch {
        Write-Host "Waiting for Next.js... ($elapsed/$timeout seconds)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
}

if (-not $nextjsReady) {
    Write-Host "❌ Next.js service failed to start" -ForegroundColor Red
    docker-compose logs hana-voice-saas
    exit 1
}
Write-Host "✅ Next.js service is healthy" -ForegroundColor Green

# Wait for Python service to be healthy
Write-Host "Checking Python Voice Service health..." -ForegroundColor Blue
$pythonReady = $false
$elapsed = 0

while (-not $pythonReady -and $elapsed -lt $timeout) {
    try {
        Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing | Out-Null
        $pythonReady = $true
    } catch {
        Write-Host "Waiting for Python service... ($elapsed/$timeout seconds)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
}

if (-not $pythonReady) {
    Write-Host "❌ Python Voice Service failed to start" -ForegroundColor Red
    docker-compose logs hana-voice-service
    exit 1
}
Write-Host "✅ Python Voice Service is healthy" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 All services are running successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Service URLs:" -ForegroundColor Blue
Write-Host "   • Next.js Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   • Python Voice Service: http://localhost:8000" -ForegroundColor White
Write-Host "   • Voice Service Health: http://localhost:8000/health" -ForegroundColor White
Write-Host ""
Write-Host "📖 To view logs: docker-compose logs -f [service-name]" -ForegroundColor Blue
Write-Host "🛑 To stop: docker-compose down" -ForegroundColor Blue
Write-Host "🔄 To restart: docker-compose restart" -ForegroundColor Blue
Write-Host ""
Write-Host "✨ Your local Railway test environment is ready!" -ForegroundColor Green

# Optional: Open browser (skip if requested)
if (-not $SkipBrowserPrompt) {
    $openBrowser = Read-Host "🌐 Open application in browser? (y/N)"
    if ($openBrowser -match "^[Yy]") {
        Start-Process "http://localhost:3000"
    }
}
