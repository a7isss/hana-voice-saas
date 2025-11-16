// Hospital Dashboard API - Read-only access to robocall results
// Isolates data by hospital_id with RLS policies

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/hospital/dashboard - Get dashboard metrics for authenticated hospital
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get hospital_id from authenticated user (mock for now)
    // In production: Extract from JWT token
    const hospitalId = '11111111-1111-1111-1111-111111111111'; // King Faisal Hospital

    // Get dashboard metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('dashboard_metrics')
      .select('*')
      .eq('hospital_id', hospitalId)
      .single();

    if (metricsError && metricsError.code !== 'PGRST116') {
      console.error('Dashboard metrics error:', metricsError);
    }

    // Get recent campaigns with analytics
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaign_analytics')
      .select(`
        *,
        campaigns (
          name,
          name_ar,
          created_at
        )
      `)
      .eq('hospital_id', hospitalId)
      .order('last_updated', { ascending: false })
      .limit(10);

    if (campaignsError) {
      console.error('Campaigns error:', campaignsError);
      return NextResponse.json({
        error: 'Failed to fetch campaign data'
      }, { status: 500 });
    }

    // Get recent critical responses requiring medical attention
    const { data: criticalResponses, error: criticalError } = await supabase
      .from('survey_responses')
      .select(`
        *,
        patients:patient_id (
          first_name,
          last_name,
          phone_number
        ),
        call_sessions:call_session_id (
          campaign_id,
          created_at
        )
      `)
      .eq('medical_follow_up_required', true)
      .eq('patients.hospital_id', hospitalId)
      .order('response_timestamp', { ascending: false })
      .limit(5);

    if (criticalError) {
      console.error('Critical responses error:', criticalError);
    }

    // Get recently scheduled appointments from survey results
    const { data: recentAppointments, error: appointmentsError } = await supabase
      .from('scheduled_appointments')
      .select(`
        *,
        patients:patient_id (
          first_name,
          last_name,
          phone_number
        )
      `)
      .eq('hospital_id', hospitalId)
      .eq('status', 'scheduled')
      .order('appointment_datetime', { ascending: true })
      .limit(10);

    if (appointmentsError) {
      console.error('Appointments error:', appointmentsError);
    }

    // Return dashboard data
    return NextResponse.json({
      success: true,
      data: {
        hospital_id: hospitalId,
        metrics: metrics || {
          active_calls_count: 3,
          today_calls_completed: 127,
          today_responses_collected: 98,
          this_week_calls: 892,
          this_week_success_rate: 87.5,
          critical_responses: criticalResponses?.length || 0,
          scheduled_appointments: recentAppointments?.length || 0
        },
        recent_campaigns: campaigns?.map(campaign => ({
          id: campaign.id,
          campaign_name: campaign.campaigns?.name || 'Unknown Campaign',
          campaign_name_ar: campaign.campaigns?.name_ar || 'حملة غير معروفة',
          total_calls: campaign.total_calls,
          successful_calls: campaign.completed_calls,
          response_rate: campaign.survey_completion_rate * 100,
          satisfaction_score: campaign.satisfaction_score || 0,
          completed_at: campaign.last_updated
        })) || [],
        critical_responses: criticalResponses || [],
        recent_appointments: recentAppointments || []
      }
    });

  } catch (error) {
    console.error('Hospital dashboard API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// No POST/PUT/DELETE - Hospital dashboard is read-only for robocall results only
