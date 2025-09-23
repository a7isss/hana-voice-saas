FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for telephony and audio processing
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    libsndfile1 \
    libasound2 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install debugpy for debugging
RUN pip install debugpy

# Copy application code
COPY . .

# Create service account volume mount point (if using Google services)
RUN mkdir -p /app/config && mkdir -p /app/service_account

# Expose ports for API and debugging
EXPOSE 8000 5678

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Default command with debugging enabled
CMD ["python", "-m", "debugpy", "--listen", "0.0.0.0:5678", "main.py"]
