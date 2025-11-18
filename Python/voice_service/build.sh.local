#!/bin/bash

echo "==========================================="
echo "Building Python Voice Service for Railway"
echo "==========================================="
echo

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo "ERROR: uv is not available"
    echo "Please ensure uv is installed in the build environment"
    exit 1
else
    echo "✓ uv is available: $(uv --version)"
fi

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    uv venv
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
uv sync --frozen --no-dev

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed successfully"
else
    echo "✗ Failed to install dependencies"
    exit 1
fi

echo
echo "Setting up voice models..."
echo "This will copy local models or download them if needed"

# Run the smart voice model setup script
python setup_voice_models.py

echo
echo "Build completed successfully!"
echo "Ready for Railway deployment"
echo "==========================================="

exit 0
