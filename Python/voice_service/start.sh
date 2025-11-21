#!/bin/bash

echo "==========================================="
echo "Starting Python Voice Service on Railway"
echo "Port: ${PORT} | Health Check: /health"
echo "==========================================="
echo

# Set up environment
export LOG_LEVEL=${LOG_LEVEL:-"INFO"}
export MAX_CONCURRENT_SESSIONS=${MAX_CONCURRENT_SESSIONS:-"10"}
# Ensure PORT is set by Railway (should be automatic)
if [ -z "$PORT" ]; then
    export PORT=8000  # fallback if PORT is not set
    echo "⚠️  PORT not set by Railway, using fallback: $PORT"
else
    echo "✅ PORT set by Railway: $PORT"
fi

echo "Environment Configuration:"
echo "✓ LOG_LEVEL: ${LOG_LEVEL}"
echo "✓ MAX_CONCURRENT_SESSIONS: ${MAX_CONCURRENT_SESSIONS}"
echo "✓ PORT: ${PORT}"
echo

# The virtual environment should already be set up by nixpacks
if [ -d ".venv" ]; then
    source .venv/bin/activate
    echo "✓ Virtual environment activated"

    echo
    echo "Setting up voice models..."
    echo "==========================================="
    python setup_voice_models.py
    setup_exit_code=$?
    if [ $setup_exit_code -ne 0 ]; then
        echo "❌ Model setup failed with exit code $setup_exit_code"
        echo "Continuing anyway to avoid deployment failure..."
    else
        echo "✅ Model setup completed"
    fi
    echo "==========================================="
fi

echo
echo "Validating voice models..."
echo "==========================================="
# Quick check that at least the Vosk model is available
if [ -d "/data/models/stt/vosk-model-ar-0.22-linto-1.1.0" ]; then
    model_file_count=$(find "/data/models/stt/vosk-model-ar-0.22-linto-1.1.0" -type f | wc -l)
    echo "✅ Vosk model ready: $model_file_count files"
    if [ "$model_file_count" -lt 10 ]; then
        echo "⚠️  Warning: Vosk model has fewer files than expected ($model_file_count)"
    fi
elif [ -d "models/vosk-model-ar-0.22-linto-1.1.0" ]; then
    echo "✅ Using local Vosk model"
else
    echo "❌ ERROR: No Vosk model found! Service cannot start without voice models."
    echo "Check Railway volume mounting and model setup process."
    exit 1
fi

# Check TTS directory exists (will be auto-downloaded by library)
if [ -d "/data/models/tts" ]; then
    echo "✅ TTS model directory ready (library will download as needed)"
else
    echo "❌ ERROR: TTS model directory not found!"
    exit 1
fi
echo "==========================================="

echo
echo "Starting Python voice service..."
echo "==========================================="
echo "Health Check: http://localhost:${PORT}/health"
echo "WebSocket Endpoints: ws://localhost:${PORT}/ws"
echo "==========================================="
echo

# Start the service - PORT is automatically set by Railway/nixpacks
# Bind to IPv6 "::" as required for Railway internal networking
uv run uvicorn app.main:app --host "::" --port ${PORT} --log-level ${LOG_LEVEL}
