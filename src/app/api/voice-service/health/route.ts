import { NextRequest, NextResponse } from 'next/server';

interface VoiceServiceHealth {
  status: 'healthy' | 'degraded' | 'error';
  voice_service: string;
  models: {
    vosk_arabic: boolean;
    coqui_xtts: boolean;
    last_check: number;
  };
  version: string;
  timestamp: number;
  connection_status: 'connected' | 'disconnected' | 'checking';
  response_time_ms?: number;
}

export async function GET(request: NextRequest) {
  try {
    const voiceServiceUrl = process.env.VOICE_SERVICE_URL || process.env.NEXT_PUBLIC_VOICE_SERVICE_URL;

    if (!voiceServiceUrl) {
      return NextResponse.json({
        status: 'error',
        voice_service: 'not_configured',
        models: { vosk_arabic: false, coqui_xtts: false, last_check: Date.now() },
        version: '0.0.0',
        timestamp: Date.now(),
        connection_status: 'disconnected',
        error: 'VOICE_SERVICE_URL environment variable not configured'
      } as VoiceServiceHealth);
    }

    const startTime = Date.now();

    // Clean the URL (remove trailing slashes)
    const cleanUrl = voiceServiceUrl.replace(/\/$/, '');
    const healthUrl = `${cleanUrl}/health`;

    console.log('Checking voice service health at:', healthUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.ok) {
        const healthData: VoiceServiceHealth = await response.json();

        // Add connection status and response time to the returned data
        const enhancedHealth: VoiceServiceHealth = {
          ...healthData,
          connection_status: 'connected',
          response_time_ms: responseTime,
        };

        console.log('Voice service health check successful:', {
          status: enhancedHealth.status,
          responseTime: `${responseTime}ms`
        });

        return NextResponse.json(enhancedHealth);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Voice service health check timed out');

        return NextResponse.json({
          status: 'error',
          voice_service: 'timeout',
          models: { vosk_arabic: false, coqui_xtts: false, last_check: Date.now() },
          version: '0.0.0',
          timestamp: Date.now(),
          connection_status: 'disconnected',
          error: 'Connection timeout after 10 seconds'
        } as VoiceServiceHealth, { status: 408 });
      }

      console.error('Voice service health check failed:', fetchError);

      return NextResponse.json({
        status: 'error',
        voice_service: 'connection_failed',
        models: { vosk_arabic: false, coqui_xtts: false, last_check: Date.now() },
        version: '0.0.0',
        timestamp: Date.now(),
        connection_status: 'disconnected',
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      } as VoiceServiceHealth, { status: 503 });

    }

  } catch (error) {
    console.error('Unexpected error in voice service health check:', error);

    return NextResponse.json({
      status: 'error',
      voice_service: 'internal_error',
      models: { vosk_arabic: false, coqui_xtts: false, last_check: Date.now() },
      version: '0.0.0',
      timestamp: Date.now(),
      connection_status: 'checking',
      error: error instanceof Error ? error.message : 'Internal server error'
    } as VoiceServiceHealth, { status: 500 });
  }
}
