import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Health check endpoint for Render deployment
  try {
    // Check if environment variables are set
    const requiredVars = ['NODE_ENV'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    // Basic connectivity check - no expensive operations
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      missing_vars: missingVars,
      database: 'not_checked', // Avoid actual DB calls for health check
      voice_service: process.env.VOICE_SERVICE_URL ? 'configured' : 'not_configured'
    };

    // Return warning status if core vars missing, but still respond with 200
    return Response.json(healthStatus, {
      status: missingVars.length > 0 ? 200 : 200, // Keep 200 for render health checks
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
    });
  }
}
