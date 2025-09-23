from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import os
import logging
from .core.data_exporter import data_exporter

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Hana Data Export Service",
    description="Excel report generation and data export service for healthcare analytics",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://hana-voice-api.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting Hana Data Export Service")
    
    # Test data exporter health
    try:
        health = data_exporter.health_check()
        if health["status"] == "healthy":
            logger.info("✅ Data exporter initialized successfully")
        else:
            logger.warning("⚠️ Data exporter has limited functionality")
    except Exception as e:
        logger.error(f"❌ Data exporter initialization error: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Hana Data Export Service")

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "message": "Hana Data Export Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        health = data_exporter.health_check()
        return {
            "status": health["status"],
            "service": "hana-data-service",
            "database_connected": health["database_connected"],
            "excel_generation": health["excel_generation"],
            "pandas_available": health["pandas_available"],
            "timestamp": "2025-09-23T21:30:00Z"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "hana-data-service",
            "error": str(e),
            "timestamp": "2025-09-23T21:30:00Z"
        }

@app.get("/api/v1/export/survey-responses")
async def export_survey_responses(client_id: str, start_date: str = None, end_date: str = None, language: str = "ar"):
    """Export survey responses to Excel"""
    try:
        excel_bytes = data_exporter.export_survey_responses(client_id, start_date, end_date, language)
        if not excel_bytes:
            raise HTTPException(status_code=404, detail="No survey responses found")
        
        filename = f"survey_responses_{client_id}_{language}.xlsx"
        
        return StreamingResponse(
            iter([excel_bytes]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        logger.error(f"Export survey responses error: {e}")
        raise HTTPException(status_code=500, detail="Failed to export survey responses")

@app.get("/api/v1/export/call-analytics")
async def export_call_analytics(client_id: str, start_date: str = None, end_date: str = None, language: str = "ar"):
    """Export call analytics to Excel"""
    try:
        excel_bytes = data_exporter.export_call_analytics(client_id, start_date, end_date, language)
        if not excel_bytes:
            raise HTTPException(status_code=404, detail="No call analytics found")
        
        filename = f"call_analytics_{client_id}_{language}.xlsx"
        
        return StreamingResponse(
            iter([excel_bytes]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        logger.error(f"Export call analytics error: {e}")
        raise HTTPException(status_code=500, detail="Failed to export call analytics")

@app.get("/api/v1/export/customer-list")
async def export_customer_list(client_id: str, language: str = "ar"):
    """Export customer list to Excel"""
    try:
        excel_bytes = data_exporter.export_customer_list(client_id, language)
        if not excel_bytes:
            raise HTTPException(status_code=404, detail="No customers found")
        
        filename = f"customer_list_{client_id}_{language}.xlsx"
        
        return StreamingResponse(
            iter([excel_bytes]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        logger.error(f"Export customer list error: {e}")
        raise HTTPException(status_code=500, detail="Failed to export customer list")

@app.get("/api/v1/analytics/summary")
async def get_summary_report(client_id: str, language: str = "ar"):
    """Get summary statistics for a client"""
    try:
        summary = data_exporter.generate_summary_report(client_id, language)
        if not summary:
            raise HTTPException(status_code=404, detail="No data found for client")
        
        return {"summary": summary}
    except Exception as e:
        logger.error(f"Get summary report error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate summary report")

@app.get("/api/v1/export/formats")
async def get_export_formats():
    """Get available export formats and languages"""
    try:
        formats = [
            {
                "format": "excel",
                "extensions": [".xlsx"],
                "languages": ["ar", "en"],
                "features": ["RTL support", "Arabic formatting", "Auto-column width"]
            }
        ]
        
        return {"formats": formats}
    except Exception as e:
        logger.error(f"Get export formats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get export formats")

@app.get("/api/v1/stats/export-usage")
async def get_export_usage_stats():
    """Get export usage statistics"""
    try:
        # This would typically query the database for export usage
        # For now, return mock data
        return {
            "total_exports": 234,
            "exports_today": 12,
            "most_exported_type": "survey_responses",
            "top_language": "ar",
            "average_file_size_mb": 2.3
        }
    except Exception as e:
        logger.error(f"Get export usage stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get export usage statistics")

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
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=True if os.getenv("ENVIRONMENT") == "development" else False,
        log_level="info"
    )
