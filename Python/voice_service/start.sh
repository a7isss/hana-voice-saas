#!/bin/bash

echo "==========================================="
echo "Starting Python Voice Service on Railway"
echo "Port: ${PORT} | Health Check: /health"
echo "==========================================="
echo

# Set up environment
export LOG_LEVEL=${LOG_LEVEL:-"INFO"}
export MAX_CONCURRENT_SESSIONS=${MAX_CONCURRENT_SESSIONS:-"10"}

echo "Environment Configuration:"
echo "✓ LOG_LEVEL: ${LOG_LEVEL}"
echo "✓ MAX_CONCURRENT_SESSIONS: ${MAX_CONCURRENT_SESSIONS}"
echo "✓ PORT: ${PORT}"
echo

# The virtual environment should already be set up by nixpacks
if [ -d ".venv" ]; then
    source .venv/bin/activate
    echo "✓ Virtual environment activated"
fi

echo
echo "Starting Python voice service..."
echo "==========================================="
echo "Health Check: http://localhost:${PORT}/health"
echo "WebSocket Endpoints: ws://localhost:${PORT}/ws"
echo "==========================================="
echo

# Start the service - PORT is automatically set by Railway/nixpacks
uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --log-level ${LOG_LEVEL}
