from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
import os
import logging
from .api.routes import router as api_router
from .core.auth import auth_service
from .storage.supabase_client import supabase_client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Hana Voice SaaS API",
    description="Voice survey and analytics platform for healthcare institutions",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://hana-voice-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

# Security
security = HTTPBearer()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Hana Voice SaaS API Service")
    
    # Test database connection
    try:
        db_healthy = supabase_client.health_check()
        if db_healthy:
            logger.info("✅ Database connection established")
        else:
            logger.error("❌ Database connection failed")
    except Exception as e:
        logger.error(f"❌ Database connection error: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Hana Voice SaaS API Service")

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "message": "Hana Voice SaaS API Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        db_healthy = supabase_client.health_check()
        
        return {
            "status": "healthy" if db_healthy else "degraded",
            "service": "hana-voice-api",
            "database": "connected" if db_healthy else "disconnected",
            "timestamp": "2025-09-23T21:30:00Z"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "hana-voice-api",
            "error": str(e),
            "timestamp": "2025-09-23T21:30:00Z"
        }

@app.get("/api/v1/status")
async def api_status():
    """API status endpoint"""
    return {
        "api_version": "1.0.0",
        "status": "operational",
        "services": {
            "database": "connected",
            "authentication": "active",
            "voice_processing": "available",
            "data_export": "available"
        }
    }

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "error": "Resource not found",
        "path": request.url.path,
        "method": request.method
    }

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return {
        "error": "Internal server error",
        "message": "An unexpected error occurred"
    }

if __name__ == "__main__":
    # Run the application
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True if os.getenv("ENVIRONMENT") == "development" else False,
        log_level="info"
    )
