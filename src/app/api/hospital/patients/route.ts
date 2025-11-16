import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyJWTToken } from '@/lib/jwt';

// GET /api/hospital/patients - Get patients for authenticated hospital user
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

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const department = searchParams.get('department');
    const priorityLevel = searchParams.get('priority_level');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query with filters
    let query = supabase
      .from('patients')
      .select(`
        id,
        first_name,
        last_name,
        full_name_ar,
        national_id,
        date_of_birth,
        gender,
        phone_number,
        department,
        current_condition,
        priority_level,
        status,
        last_visit_date,
        next_appointment_date,
        created_at
      `)
      .eq('hospital_id', hospitalId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      // Search in name, phone, and national_id
      const searchTerm = `%${search}%`;
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},phone_number.ilike.${searchTerm},national_id.ilike.${searchTerm}`);
    }

    if (department && department !== 'all') {
      query = query.eq('department', department);
    }

    if (priorityLevel && priorityLevel !== 'all') {
      query = query.eq('priority_level', priorityLevel);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: patients, error: patientsError } = await query;

    if (patientsError) {
      console.error('Patients fetch error:', patientsError);
      return NextResponse.json({
        error: 'خطأ في استرجاع بيانات المرضى'
      }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('patients')
      .select('id', { count: 'exact' })
      .eq('hospital_id', hospitalId);

    // Apply same filters to count query
    if (search) {
      const searchTerm = `%${search}%`;
      countQuery = countQuery.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},phone_number.ilike.${searchTerm},national_id.ilike.${searchTerm}`);
    }

    if (department && department !== 'all') {
      countQuery = countQuery.eq('department', department);
    }

    if (priorityLevel && priorityLevel !== 'all') {
      countQuery = countQuery.eq('priority_level', priorityLevel);
    }

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count: totalCount } = await countQuery;

    // Format patient data for frontend
    const formattedPatients = patients?.map(patient => ({
      id: patient.id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      full_name_ar: patient.full_name_ar,
      national_id: patient.national_id,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      phone_number: patient.phone_number,
      department: patient.department,
      current_condition: patient.current_condition,
      priority_level: patient.priority_level,
      status: patient.status,
      last_visit_date: patient.last_visit_date,
      next_appointment_date: patient.next_appointment_date,
      age: patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : null,
      created_at: patient.created_at,

      // Display name (Arabic first, then English)
      display_name: patient.full_name_ar || `${patient.first_name} ${patient.last_name || ''}`.trim()
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        patients: formattedPatients,
        pagination: {
          total: totalCount || 0,
          limit,
          offset,
          has_more: ((offset + limit) < (totalCount || 0))
        },
        filters: {
          search: search || null,
          department: department || null,
          priority_level: priorityLevel || null,
          status: status || null
        }
      }
    });

  } catch (error) {
    console.error('Hospital patients API error:', error);
    return NextResponse.json({
      error: 'خطأ في الخادم'
    }, { status: 500 });
  }
}
