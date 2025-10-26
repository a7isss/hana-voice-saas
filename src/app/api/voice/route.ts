import { NextRequest, NextResponse } from 'next/server';

// Voice service configuration
const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || 'http://localhost:8000';
const VOICE_SERVICE_SECRET = process.env.VOICE_SERVICE_SECRET;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'health') {
      // Check voice service health
      try {
        const response = await fetch(`${VOICE_SERVICE_URL}/health`);
        if (response.ok) {
          const healthData = await response.json();
          return NextResponse.json({
            status: 'healthy',
            service: 'voice-service',
            voice_service: healthData,
            timestamp: new Date().toISOString()
          });
        } else {
          return NextResponse.json({
            status: 'degraded',
            service: 'voice-service',
            message: 'Voice service not responding properly',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        return NextResponse.json({
          status: 'error',
          service: 'voice-service',
          message: 'Voice service unreachable',
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'voice-api-proxy',
      message: 'Voice API proxy is running',
      voice_service_url: VOICE_SERVICE_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Voice API GET error:', error);
    return NextResponse.json(
      { error: 'Failed to process voice API request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'generate-test-audio':
        return await generateTestAudio();

      case 'get-auth-token':
        return await getAuthToken();

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Voice API POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process voice API request' },
      { status: 500 }
    );
  }
}

async function generateTestAudio() {
  try {
    // For now, return a mock response since the actual voice generation
    // would be handled by the Python service
    const mockAudioUrl = `https://example.com/generated-audio-${Date.now()}.wav`;

    return NextResponse.json({
      success: true,
      audioUrl: mockAudioUrl,
      message: 'Test audio generated successfully (mock response)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating test audio:', error);
    return NextResponse.json(
      { error: 'Failed to generate test audio' },
      { status: 500 }
    );
  }
}

async function getAuthToken() {
  try {
    if (!VOICE_SERVICE_SECRET) {
      return NextResponse.json(
        { error: 'Voice service secret not configured' },
        { status: 500 }
      );
    }

    // Get authentication token from voice service
    const response = await fetch(`${VOICE_SERVICE_URL}/auth/token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VOICE_SERVICE_SECRET}`
      }
    });

    if (!response.ok) {
      throw new Error(`Voice service auth failed: ${response.status}`);
    }

    const authData = await response.json();

    return NextResponse.json({
      success: true,
      token: authData.token,
      sessionId: authData.session_id,
      voiceServiceUrl: VOICE_SERVICE_URL,
      message: 'Authentication token obtained successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting auth token:', error);
    return NextResponse.json(
      { error: 'Failed to get authentication token' },
      { status: 500 }
    );
  }
}
