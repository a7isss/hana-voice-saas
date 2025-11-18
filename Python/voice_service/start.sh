#!/bin/bash

echo "==========================================="
echo "Starting Python Voice Service on Railway"
echo "Port: \$PORT | Health Check: /health"
echo "==========================================="
echo

# Set up environment
export LOG_LEVEL=${LOG_LEVEL:-"INFO"}
export MAX_CONCURRENT_SESSIONS=${MAX_CONCURRENT_SESSIONS:-"10"}

echo "Environment Configuration:"
echo "✓ LOG_LEVEL: \$LOG_LEVEL"
echo "✓ MAX_CONCURRENT_SESSIONS: \$MAX_CONCURRENT_SESSIONS"
echo "✓ PORT: \$PORT"
echo

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo "ERROR: uv is not available"
    exit 1
else
    echo "✓ uv is available"
fi

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    uv venv
    source .venv/bin/activate
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
source .venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
uv sync --frozen --no-dev
echo "✓ Dependencies installed"

echo
echo "Starting Python voice service..."
echo "==========================================="
echo "Health Check: http://localhost:\$PORT/health"
echo "WebSocket Endpoints: ws://localhost:\$PORT/ws"
echo "==========================================="
echo

# Start the service
uv run uvicorn app.main:app --host 0.0.0.0 --port \$PORT --log-level \$LOG_LEVEL
