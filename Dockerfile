# Multi-service launcher for Hana Voice SaaS
# This Dockerfile runs all services in a single container for Render deployment

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy all service requirements
COPY api-service/requirements.txt /app/api-service/
COPY voice-service/requirements.txt /app/voice-service/
COPY data-service/requirements.txt /app/data-service/

# Install Python dependencies for all services
RUN pip install --no-cache-dir -r /app/api-service/requirements.txt
RUN pip install --no-cache-dir -r /app/voice-service/requirements.txt
RUN pip install --no-cache-dir -r /app/data-service/requirements.txt

# Copy all service code
COPY api-service/ /app/api-service/
COPY voice-service/ /app/voice-service/
COPY data-service/ /app/data-service/

# Copy environment configuration
COPY .env /app/.env

# Create startup script
RUN echo '#!/bin/bash' > /app/start.sh && \
    echo 'cd /app/api-service && python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 &\' >> /app/start.sh && \
    echo 'cd /app/voice-service && python -m uvicorn src.main:app --host 0.0.0.0 --port 8001 &\' >> /app/start.sh && \
    echo 'cd /app/data-service && python -m uvicorn src.main:app --host 0.0.0.0 --port 8002 &\' >> /app/start.sh && \
    echo 'wait' >> /app/start.sh && \
    chmod +x /app/start.sh

# Expose ports
EXPOSE 8000 8001 8002

# Health check for API service (main entry point)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start all services
CMD ["/app/start.sh"]
