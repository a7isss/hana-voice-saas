import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/lib/auth';

const authTokenSchema = z.object({
  action: z.literal('get-auth-token'),
  clientId: z.string().min(1, 'Client ID is required'),
  apiKey: z.string().min(1, 'API key is required')
});

// Voice service configuration
// Note: In Railway, use the internal service URL (e.g., http://voice-service.railway.internal:8000)
// for faster, secure communication between services.
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

    // All actions require authentication - validate and authenticate first
    let clientInfo;
    try {
      // Validate request has required auth fields
      const authData = authTokenSchema.parse(body);

      // Authenticate client
      clientInfo = await AuthService.authenticateClient({
        clientId: authData.clientId,
        apiKey: authData.apiKey
      });

      if (!clientInfo) {
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }

      // Check voice permissions
      if (!clientInfo.permissions.voice_calls) {
        return NextResponse.json(
          { error: 'Insufficient permissions for voice operations' },
          { status: 403 }
        );
      }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        // Zod validation error
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Now handle the action
    const action = body.action;
    switch (action) {
      case 'generate-test-audio':
        return await generateTestAudio(clientInfo);

      case 'get-auth-token':
        return await getAuthToken(clientInfo);

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

async function generateTestAudio(clientInfo: { id: string; name: string; permissions: { voice_calls: boolean } }) {
  try {
    if (!VOICE_SERVICE_SECRET) {
      throw new Error('Voice service secret not configured');
    }

    // Call Python Voice Service
    const response = await fetch(`${VOICE_SERVICE_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VOICE_SERVICE_SECRET}`
      },
      body: JSON.stringify({
        text: 'مرحباً، هذا اختبار لنظام الصوت الطبي', // "Hello, this is a test of the medical voice system"
        language: 'ar'
      })
    });

    if (!response.ok) {
      throw new Error(`Voice service TTS failed: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/wav;base64,${base64Audio}`;

    return NextResponse.json({
      success: true,
      audioUrl: audioUrl,
      clientId: clientInfo.id,
      clientName: clientInfo.name,
      message: 'Test audio generated successfully',
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

async function getAuthToken(clientInfo: { id: string; name: string; permissions: { voice_calls: boolean } }) {
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
      clientId: clientInfo.id,
      clientName: clientInfo.name,
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
