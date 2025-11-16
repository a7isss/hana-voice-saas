import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import { generateJWTToken, generateRefreshToken } from '@/lib/jwt';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, password_hash, role, hospital_id, is_active, email_verified')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      );
    }

    // Check if user is approved (not pending admin approval)
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'حسابك في انتظار موافقة المشرف' },
        { status: 403 }
      );
    }

    // Verify email is verified (for production)
    if (!user.email_verified) {
      return NextResponse.json(
        { error: 'يرجى تأكيد البريد الإلكتروني أولاً' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      );
    }

    // Verify user is hospital staff (not super admin)
    if (user.role !== 'hospital_staff' && user.role !== 'hospital_admin') {
      return NextResponse.json(
        { error: 'هذا الحساب غير مصرح له بالدخول للنظام' },
        { status: 403 }
      );
    }

    // Check if hospital_id exists
    if (!user.hospital_id) {
      return NextResponse.json(
        { error: 'الحساب غير مرتبط بمؤسسة صحية' },
        { status: 403 }
      );
    }

    // Generate JWT and refresh tokens
    const jwtPayload = {
      userId: user.id,
      hospitalId: user.hospital_id,
      role: user.role,
      email: user.email,
      fullName: user.full_name
    };

    const accessToken = generateJWTToken(jwtPayload);
    const refreshToken = generateRefreshToken(user.id);

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Get user's hospital name for response
    const { data: hospital } = await supabase
      .from('hospitals')
      .select('name')
      .eq('id', user.hospital_id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          hospitalId: user.hospital_id,
          hospitalName: hospital?.name || 'مستشفى غير محدد'
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: 28800 // 8 hours in seconds
        }
      }
    });

  } catch (error) {
    console.error('Hospital login error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
