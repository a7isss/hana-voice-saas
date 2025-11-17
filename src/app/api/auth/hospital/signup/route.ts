import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import { generateJWTToken } from '@/lib/jwt';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, organizationName } = await request.json();

    // Validation
    if (!email || !fullName || !organizationName) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني والاسم الكامل واسم المؤسسة مطلوبة' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مسجل بالفعل' },
        { status: 409 }
      );
    }

    // Generate secure password (temporary - user will reset via email)
    const tempPassword = Math.random().toString(36).slice(-10) + 'Aa1!';
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Check if organization exists, create if not
    let { data: organization } = await supabase
      .from('hospitals')
      .select('id')
      .eq('name', organizationName)
      .single();

    if (!organization) {
      // Create new organization
      const { data: newOrg, error: orgError } = await supabase
        .from('hospitals')
        .insert([{
          name: organizationName,
          name_ar: organizationName, // Same for now, can be updated later
          hospital_type: 'private', // Default
          api_key: `hana_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          contract_status: 'trial'
        }])
        .select('id')
        .single();

      if (orgError) {
        console.error('Organization creation error:', orgError);
        return NextResponse.json(
          { error: 'خطأ في إنشاء المؤسسة' },
          { status: 500 }
        );
      }

      organization = newOrg;
    }

    // Create user account
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        email,
        full_name: fullName,
        password_hash: passwordHash,
        role: 'hospital_staff',
        hospital_id: organization.id,
        is_active: false, // Requires admin approval
        email_verified: false
      }])
      .select('id, email, full_name, role, hospital_id')
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return NextResponse.json(
        { error: 'خطأ في إنشاء الحساب' },
        { status: 500 }
      );
    }

    // Create signup request record for admin approval
    const { error: requestError } = await supabase
      .from('hospital_signup_requests')
      .insert([{
        user_id: user.id,
        hospital_id: organization.id,
        status: 'pending',
        requested_at: new Date().toISOString()
      }]);

    if (requestError) {
      console.error('Signup request creation error:', requestError);
      // Don't fail the whole request, just log it
    }

    // Send verification email (placeholder - implement later)
    console.log(`Verification email would be sent to ${email} with temp password: ${tempPassword}`);

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء حسابك بنجاح. يرجى انتظار موافقة المشرف',
      data: {
        user_id: user.id,
        email: user.email,
        organization: organizationName,
        requires_approval: true
      }
    });

  } catch (error) {
    console.error('Hospital signup error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
