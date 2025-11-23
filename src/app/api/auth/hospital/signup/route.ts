import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, organizationName, password } = await request.json();

    // Validation
    if (!email || !fullName || !organizationName || !password) {
      return NextResponse.json(
        { error: 'Email, full name, organization name, and password are required' },
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
        { error: 'Email is already registered' },
        { status: 409 }
      );
    }

    // Hash the user-provided password
    const passwordHash = await bcrypt.hash(password, 12);

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
          { error: 'Failed to create organization' },
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
        role: 'hospital_admin',
        hospital_id: organization.id,
        is_active: false, // Requires admin approval
        email_verified: false
      }])
      .select('id, email, full_name, role, hospital_id')
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
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

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please wait for admin approval.',
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

