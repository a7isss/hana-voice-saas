#!/bin/bash

# Local Railway Deployment Test Script
# This script tests your application locally using Docker to replicate Railway's environment

set -e

echo "🚀 Starting Local Railway Deployment Test"
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from example..."
    cp .env.local.example .env.local
    echo "📝 Please edit .env.local with your actual values before continuing."
    echo "   Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    read -p "Press Enter when you've updated .env.local..."
fi

echo "📦 Building and testing services..."
echo ""

# Build and test individual services first
echo "1️⃣ Testing Next.js Frontend Build"
echo "==================================="
cd .
npm ci --only=production
npm run build
echo "✅ Next.js build successful"

echo ""
echo "2️⃣ Testing Python Voice Service Build"
echo "======================================="
cd Python/voice_service
if command -v uv >/dev/null 2>&1; then
    echo "Using UV package manager..."
    uv pip install --no-cache-dir -e .
else
    echo "Using pip package manager..."
    pip install --no-cache-dir -e .
fi
echo "✅ Python service dependencies installed"
cd ../..

echo ""
echo "3️⃣ Testing Docker Build Process"
echo "================================="

# Test Next.js Docker build
echo "Building Next.js Docker image..."
docker build -f Dockerfile.nextjs -t hana-voice-saas:test .
echo "✅ Next.js Docker image built successfully"

# Test Python service Docker build
echo "Building Python Voice Service Docker image..."
docker build -f Python/voice_service/Dockerfile -t hana-voice-service:test Python/voice_service/
echo "✅ Python Voice Service Docker image built successfully"

echo ""
echo "4️⃣ Testing Complete Docker Stack"
echo "================================="

# Start services with docker-compose
echo "Starting complete stack..."
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose up -d --build

echo "⏳ Waiting for services to be ready..."

# Wait for services to be healthy
echo "Checking Next.js health..."
timeout 120 bash -c 'until curl -f http://localhost:3000/api/health; do echo "Waiting for Next.js..."; sleep 2; done' || {
    echo "❌ Next.js service failed to start"
    docker-compose logs hana-voice-saas
    exit 1
}
echo "✅ Next.js service is healthy"

echo "Checking Python Voice Service health..."
timeout 120 bash -c 'until curl -f http://localhost:8000/health; do echo "Waiting for Python service..."; sleep 2; done' || {
    echo "❌ Python Voice Service failed to start"
    docker-compose logs hana-voice-service
    exit 1
}
echo "✅ Python Voice Service is healthy"

echo ""
echo "🎉 All services are running successfully!"
echo "=========================================="
echo ""
echo "📋 Service URLs:"
echo "   • Next.js Frontend: http://localhost:3000"
echo "   • Python Voice Service: http://localhost:8000"
echo "   • Voice Service Health: http://localhost:8000/health"
echo ""
echo "📖 To view logs: docker-compose logs -f [service-name]"
echo "🛑 To stop: docker-compose down"
echo "🔄 To restart: docker-compose restart"
echo ""
echo "✨ Your local Railway test environment is ready!"

# Optional: Open browser
if command -v open >/dev/null 2>&1; then
    read -p "🌐 Open application in browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open http://localhost:3000
    fi
elif command -v xdg-open >/dev/null 2>&1; then
    read -p "🌐 Open application in browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open http://localhost:3000
    fi
fi
