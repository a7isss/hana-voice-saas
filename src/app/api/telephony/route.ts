import { NextRequest, NextResponse } from 'next/server';

// Telephony service configuration
const TELEPHONY_SERVICE_URL = process.env.TELEPHONY_SERVICE_URL || 'http://localhost:8001';
const FREEPBX_HOST = process.env.FREEPBX_HOST;
const FREEPBX_USERNAME = process.env.FREEPBX_USERNAME;
const FREEPBX_PASSWORD = process.env.FREEPBX_PASSWORD;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'health') {
      // Check telephony service health
      const healthStatus = {
        status: 'healthy' as const,
        service: 'telephony-api-proxy',
        telephony_service: {
          configured: !!(FREEPBX_HOST && FREEPBX_USERNAME && FREEPBX_PASSWORD),
          host: FREEPBX_HOST || 'not configured'
        },
        timestamp: new Date().toISOString()
      };

      return NextResponse.json(healthStatus);
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'telephony-api-proxy',
      message: 'Telephony API proxy is running',
      telephony_service_url: TELEPHONY_SERVICE_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Telephony API GET error:', error);
    return NextResponse.json(
      { error: 'Failed to process telephony API request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'initiate-call':
        return await initiateCall(body);

      case 'check-call-status':
        return await checkCallStatus(body);

      case 'end-call':
        return await endCall(body);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Telephony API POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process telephony API request' },
      { status: 500 }
    );
  }
}

async function initiateCall(body: {
  phoneNumber: string;
  clientId: string;
  audioUrl?: string;
  surveyId?: string;
  language?: string;
}) {
  try {
    const {
      phoneNumber,
      clientId
    } = body;

    // Validate required parameters
    if (!phoneNumber || !clientId) {
      return NextResponse.json(
        { error: 'Phone number and client ID are required' },
        { status: 400 }
      );
    }

    // For now, return a mock response since the actual telephony integration
    // would require FreePBX or similar telephony service setup
    const mockCallId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      callId: mockCallId,
      phoneNumber,
      clientId,
      status: 'initiated',
      message: 'Call initiated successfully (mock response)',
      estimatedDuration: '2-3 minutes',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error initiating call:', error);
    return NextResponse.json(
      { error: 'Failed to initiate call' },
      { status: 500 }
    );
  }
}

async function checkCallStatus(body: {
  callId: string;
}) {
  try {
    const { callId } = body;

    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      );
    }

    // Mock call status - in real implementation, this would check with FreePBX
    const mockStatuses = ['ringing', 'answered', 'completed', 'failed', 'busy'];
    const mockStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];

    return NextResponse.json({
      success: true,
      callId,
      status: mockStatus,
      duration: Math.floor(Math.random() * 180) + 30, // 30-210 seconds
      message: `Call status: ${mockStatus}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking call status:', error);
    return NextResponse.json(
      { error: 'Failed to check call status' },
      { status: 500 }
    );
  }
}

async function endCall(body: {
  callId: string;
}) {
  try {
    const { callId } = body;

    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      callId,
      status: 'ended',
      message: 'Call ended successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error ending call:', error);
    return NextResponse.json(
      { error: 'Failed to end call' },
      { status: 500 }
    );
  }
}
