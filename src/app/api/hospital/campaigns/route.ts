import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyJWTToken } from '@/lib/jwt';

// GET /api/hospital/campaigns - Get campaigns for authenticated hospital user
export async function GET(request: NextRequest) {
  try {
    // Verify JWT authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'رمز المصادقة مطلوب' }, { status: 401 });
    }

    const payload = verifyJWTToken(token);
    if (!payload || !payload.userId || !payload.hospitalId) {
      return NextResponse.json({ error: 'رمز المصادقة غير صالح' }, { status: 401 });
    }

    // Verify user is hospital staff/admin
    if (!['hospital_staff', 'hospital_admin'].includes(payload.role)) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول' }, { status: 403 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get hospital_id from JWT token
    const hospitalId = payload.hospitalId;

    // Get campaigns with analytics data
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        name_ar,
        description,
        description_ar,
        status,
        created_at,
        scheduled_start,
        scheduled_end,
        total_calls_scheduled,
        total_calls_completed,
        success_rate_target,
        campaign_analytics (
          total_calls,
          answered_calls,
          completed_calls,
          failed_calls,
          average_call_duration_seconds,
          survey_completion_rate,
          success_rate,
          appointments_scheduled,
          cost_per_call,
          last_updated
        ),
        hospital_surveys:hospital_surveys (
          name,
          name_ar
        )
      `)
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false });

    if (campaignsError) {
      console.error('Campaigns fetch error:', campaignsError);
      return NextResponse.json({
        error: 'Erro ao buscar campanhas'
      }, { status: 500 });
    }

    // Transform data for frontend
    const formattedCampaigns = campaigns?.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      name_ar: campaign.name_ar,
      description: campaign.description_ar || campaign.description,
      status: campaign.status,
      created_at: campaign.created_at,
      scheduled_start: campaign.scheduled_start,
      scheduled_end: campaign.scheduled_end,

      // Campaign statistics
      total_calls_scheduled: campaign.total_calls_scheduled || 0,
      total_calls_completed: campaign.total_calls_completed || 0,
      survey_name: campaign.hospital_surveys?.[0]?.name || 'Survey not found',

      // Analytics data (latest available)
      total_calls: campaign.campaign_analytics?.[0]?.total_calls || 0,
      answered_calls: campaign.campaign_analytics?.[0]?.answered_calls || 0,
      completed_calls: campaign.campaign_analytics?.[0]?.completed_calls || 0,
      failed_calls: campaign.campaign_analytics?.[0]?.failed_calls || 0,
      average_call_duration: campaign.campaign_analytics?.[0]?.average_call_duration_seconds || 0,
      survey_completion_rate: (campaign.campaign_analytics?.[0]?.survey_completion_rate * 100) || 0,
      success_rate: (campaign.campaign_analytics?.[0]?.success_rate * 100) || 0,
      appointments_scheduled: campaign.campaign_analytics?.[0]?.appointments_scheduled || 0,
      cost_per_call: campaign.campaign_analytics?.[0]?.cost_per_call || 0,
      last_updated: campaign.campaign_analytics?.[0]?.last_updated || null
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        campaigns: formattedCampaigns,
        total_count: formattedCampaigns.length
      }
    });

  } catch (error) {
    console.error('Hospital campaigns API error:', error);
    return NextResponse.json({
      error: 'خطأ في الخادم'
    }, { status: 500 });
  }
}
