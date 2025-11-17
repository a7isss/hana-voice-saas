import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyJWTToken } from '@/lib/jwt';

// GET /api/hospital/appointments - Get appointments for authenticated hospital user
// Optional: ?type=[scheduled|completed|upcoming] & limit=N & offset=N
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
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get hospital_id from JWT token
    const hospitalId = payload.hospitalId;

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, scheduled, completed, upcoming
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build base query
    let query = supabase
      .from('scheduled_appointments')
      .select(`
        id,
        appointment_datetime,
        duration_minutes,
        appointment_type,
        assigned_doctor_id,
        department,
        room,
        location_details,
        status,
        confirmed_at,
        cancelled_at,
        cancel_reason,
        patient_notified,
        sms_reminder_sent,
        email_confirmation_sent,
        created_at,
        created_by,
        patient_id (
          id,
          first_name,
          last_name,
          full_name_ar,
          phone_number,
          department,
          current_condition,
          priority_level
        ),
        call_session_id (
          id,
          status,
          created_at
        )
      `)
      .eq('hospital_id', hospitalId);

    // Apply filters based on type
    const now = new Date().toISOString();

    switch (type) {
      case 'scheduled':
        query = query.eq('status', 'scheduled');
        break;
      case 'completed':
        query = query.eq('status', 'completed');
        break;
      case 'cancelled':
        query = query.in('status', ['cancelled', 'no_show']);
        break;
      case 'upcoming':
        query = query
          .eq('status', 'scheduled')
          .gte('appointment_datetime', now)
          .order('appointment_datetime', { ascending: true });
        break;
      default: // 'all' - no additional filters
        break;
    }

    // Apply pagination and sorting
    if (type !== 'upcoming') {
      query = query.order('appointment_datetime', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data: appointments, error: appointmentsError } = await query;

    if (appointmentsError) {
      console.error('Appointments fetch error:', appointmentsError);
      return NextResponse.json({
        error: 'خطأ في استرجاع بيانات المواعيد'
      }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('scheduled_appointments')
      .select('id', { count: 'exact' })
      .eq('hospital_id', hospitalId);

    // Apply same filters to count query
    if (type === 'scheduled') {
      countQuery = countQuery.eq('status', 'scheduled');
    } else if (type === 'completed') {
      countQuery = countQuery.eq('status', 'completed');
    } else if (type === 'cancelled') {
      countQuery = countQuery.in('status', ['cancelled', 'no_show']);
    } else if (type === 'upcoming') {
      countQuery = countQuery
        .eq('status', 'scheduled')
        .gte('appointment_datetime', now);
    }

    const { count: totalCount } = await countQuery;

    // Format appointment data for frontend
    const formattedAppointments = appointments?.map(appointment => ({
      id: appointment.id,
      appointment_datetime: appointment.appointment_datetime,
      duration_minutes: appointment.duration_minutes,
      appointment_type: appointment.appointment_type,
      department: appointment.department,
      room: appointment.room,
      location_details: appointment.location_details,
      status: appointment.status,

      // Status metadata
      confirmed_at: appointment.confirmed_at,
      cancelled_at: appointment.cancelled_at,
      cancel_reason: appointment.cancel_reason,

      // Communication status
      patient_notified: appointment.patient_notified,
      sms_reminder_sent: appointment.sms_reminder_sent,
      email_confirmation_sent: appointment.email_confirmation_sent,

      // Timing info
      is_past: new Date(appointment.appointment_datetime) < new Date(),
      is_today: new Date(appointment.appointment_datetime).toDateString() === new Date().toDateString(),

      // Patient information
      patient: appointment.patient_id ? {
        id: (appointment.patient_id as any)?.id,
        first_name: (appointment.patient_id as any)?.first_name,
        last_name: (appointment.patient_id as any)?.last_name,
        full_name_ar: (appointment.patient_id as any)?.full_name_ar,
        phone_number: (appointment.patient_id as any)?.phone_number,
        department: (appointment.patient_id as any)?.department,
        current_condition: (appointment.patient_id as any)?.current_condition,
        priority_level: (appointment.patient_id as any)?.priority_level,

        // Display name
        display_name: (appointment.patient_id as any)?.full_name_ar ||
                     `${(appointment.patient_id as any)?.first_name} ${(appointment.patient_id as any)?.last_name || ''}`.trim()
      } : null,

      // Call session info (for tracking survey results)
      call_session: appointment.call_session_id ? {
        id: (appointment.call_session_id as any)?.id,
        status: (appointment.call_session_id as any)?.status,
        created_at: (appointment.call_session_id as any)?.created_at
      } : null,

      // Assigned doctor - need separate query since it's not included in select
      assigned_doctor: null, // Will be populated if assigned_doctor_id is set

      // Metadata
      created_at: appointment.created_at,
      created_by: appointment.created_by
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        appointments: formattedAppointments,
        pagination: {
          total: totalCount || 0,
          limit,
          offset,
          has_more: ((offset + limit) < (totalCount || 0))
        },
        filters: {
          type: type
        },
        summary: {
          total_appointments: totalCount || 0,
          scheduled_today: formattedAppointments.filter(apt => apt.is_today && apt.status === 'scheduled').length,
          upcoming: formattedAppointments.filter(apt => !apt.is_past && apt.status === 'scheduled').length,
          completed_today: formattedAppointments.filter(apt => apt.is_today && apt.status === 'completed').length
        }
      }
    });

  } catch (error) {
    console.error('Hospital appointments API error:', error);
    return NextResponse.json({
      error: 'خطأ في الخادم'
    }, { status: 500 });
  }
}
