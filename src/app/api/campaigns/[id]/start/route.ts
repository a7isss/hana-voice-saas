/**
 * Campaign Start API Endpoint
 * POST /api/campaigns/[id]/start
 * 
 * Initiates a campaign by queuing all calls
 * Error Handling: [CAMPAIGN] prefix in logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWTToken } from '@/lib/jwt';
import { getCallOrchestrator } from '@/lib/services/callOrchestrator';
import { CallOrchestratorError } from '@/lib/types/campaign';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const campaignId = params.id;
  
  console.log(`[CAMPAIGN] start: Starting campaign ${campaignId}`);
  
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      console.warn(`[CAMPAIGN] start: Missing auth token for campaign ${campaignId}`);
      return NextResponse.json(
        { error: 'رمز المصادقة مطلوب' },
        { status: 401 }
      );
    }

    const payload = verifyJWTToken(token);
    if (!payload || !payload.userId || !payload.hospitalId) {
      console.warn(`[CAMPAIGN] start: Invalid token for campaign ${campaignId}`);
      return NextResponse.json(
        { error: 'رمز المصادقة غير صالح' },
        { status: 401 }
      );
    }

    // Verify user is hospital admin
    if (payload.role !== 'hospital_admin') {
      console.warn(`[CAMPAIGN] start: Insufficient permissions for user ${payload.userId}`);
      return NextResponse.json(
        { error: 'يجب أن تكون مسؤول المستشفى لبدء الحملة' },
        { status: 403 }
      );
    }

    // Get orchestrator instance
    const orchestrator = getCallOrchestrator();

    // Queue campaign calls
    console.log(`[CAMPAIGN] start: Queuing calls for campaign ${campaignId}`);
    const result = await orchestrator.queueCampaignCalls(campaignId);

    if (!result.success) {
      console.error(`[CAMPAIGN] start: Failed to queue calls for campaign ${campaignId}`, result.errors);
      return NextResponse.json(
        {
          error: 'فشل في جدولة المكالمات',
          details: result.errors
        },
        { status: 500 }
      );
    }

    console.log(`[CAMPAIGN] start: Successfully queued ${result.queued_count} calls for campaign ${campaignId}`);

    return NextResponse.json({
      success: true,
      message: 'تم بدء الحملة بنجاح',
      data: {
        campaign_id: campaignId,
        queued_count: result.queued_count,
        failed_count: result.failed_count,
        total_count: result.total_count,
        status: 'scheduled'
      }
    });

  } catch (error) {
    console.error(`[CAMPAIGN] start: Error starting campaign ${campaignId}:`, error);

    // Handle specific error types
    if (error instanceof CallOrchestratorError) {
      const statusCode = error.code === 'CAMPAIGN_NOT_FOUND' ? 404 :
                        error.code === 'QUEUE_FULL' ? 429 :
                        500;

      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          context: error.context
        },
        { status: statusCode }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'حدث خطأ أثناء بدء الحملة',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
