# Root Dockerfile for Hana Voice SaaS - Multi-service deployment
# This Dockerfile is used by Render for service discovery and routing

FROM alpine:latest

# Install curl for health checks
RUN apk add --no-cache curl

# Create a simple health check script
RUN echo '#!/bin/sh' > /health.sh && \
    echo 'curl -f http://localhost:8000/health > /dev/null 2>&1 || exit 1' >> /health.sh && \
    chmod +x /health.sh

# This Dockerfile is primarily for Render service detection
# Each microservice has its own Dockerfile in its respective directory:
# - api-service/Dockerfile
# - voice-service/Dockerfile  
# - data-service/Dockerfile
# - frontend/ (Next.js auto-detected by Render)

# Expose default port (Render will override with $PORT)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /health.sh

# Simple startup script that indicates this is a multi-service project
CMD echo "Hana Voice SaaS - Multi-service project detected by Render" && \
    echo "Services:" && \
    echo "- API Service: api-service/" && \
    echo "- Voice Service: voice-service/" && \
    echo "- Data Service: data-service/" && \
    echo "- Frontend: frontend/" && \
    echo "Render will deploy each service individually based on render.yaml" && \
    tail -f /dev/null
