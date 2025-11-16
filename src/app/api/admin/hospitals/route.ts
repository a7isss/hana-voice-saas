import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyJWTToken, HospitalJWTPayload } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

// GET: Get all hospitals (super admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyJWTToken(token);

    if (!payload || payload.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // Get all hospitals with stats
    const { data: hospitals, error } = await supabase
      .from('hospitals')
      .select(`
        *,
        _count: {
          patients: patients(hospital_id),
          campaigns: campaigns(hospital_id),
          appointments: scheduled_appointments(hospital_id)
        }
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching hospitals:', error);
      return NextResponse.json({ error: 'Failed to fetch hospitals' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        hospitals: hospitals.map((hospital: any) => ({
          id: hospital.id,
          name: hospital.name,
          name_ar: hospital.name_ar,
          description: hospital.description,
          city: hospital.city,
          region: hospital.region,
          phone_number: hospital.phone_number,
          email_domain: hospital.email_domain,
          status: hospital.status,
          subscription_level: hospital.subscription_level,
          created_at: hospital.created_at,
          updated_at: hospital.updated_at,
          stats: {
            total_patients: hospital._count?.patients?.length || 0,
            total_campaigns: hospital._count?.campaigns?.length || 0,
            total_appointments: hospital._count?.appointments?.length || 0
          }
        }))
      }
    });
  } catch (error) {
    console.error('Super admin hospital fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new hospital (super admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify super admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyJWTToken(token);

    if (!payload || payload.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      name_ar,
      description,
      city,
      region,
      phone_number,
      email_domain,
      subscription_level = 'starter',
      admin_email,
      admin_name,
      admin_phone
    } = body;

    // Validate required fields
    if (!name || !name_ar || !city || !region || !admin_email || !admin_name || !admin_phone) {
      return NextResponse.json({
        error: 'تطلب الأسم والاسم العربي والمدينة والمنطقة ورقم الهاتف، الإيميل والاسم للمدير'
      }, { status: 400 });
    }

    // Generate secure password for admin account
    const tempPassword = await bcrypt.hash(Math.random().toString(), 12);

    // Begin transaction - create hospital, then user
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .insert({
        name,
        name_ar,
        description,
        city,
        region,
        phone_number,
        email_domain,
        status: 'active',
        subscription_level,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (hospitalError) {
      console.error('Error creating hospital:', hospitalError);
      return NextResponse.json({ error: 'Failed to create hospital organization' }, { status: 500 });
    }

    // Create hospital admin user account
    const { data: hospitalUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: admin_email,
        name: admin_name,
        phone_number: admin_phone,
        role: 'hospital_admin',
        hospital_id: hospital.id,
        password_hash: tempPassword, // Temporary password - should be changed on first login
        status: 'active',
        email_verified: true, // Super admin created, so trust email
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      // Cleanup: delete hospital if user creation fails
      await supabase.from('hospitals').delete().eq('id', hospital.id);
      console.error('Error creating hospital admin user:', userError);
      return NextResponse.json({ error: 'Failed to create hospital admin account' }, { status: 500 });
    }

    // TODO: Send email with temporary password and login instructions
    console.log(`Hospital created: ${name} (${admin_email}) - TEMP PASSWORD: ${tempPassword}`);

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء المستشفى والحساب الإداري بنجاح',
      data: {
        hospital: {
          id: hospital.id,
          name: hospital.name,
          name_ar: hospital.name_ar,
          status: hospital.status,
          admin_email: hospitalUser.email,
          admin_name: hospitalUser.name,
          temp_password: tempPassword // NOTE: In production, this should NEVER be sent to frontend
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Super admin hospital creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
