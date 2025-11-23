import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        // Fetch users with their hospital details
        const { data: users, error } = await supabase
            .from('users')
            .select(`
        id,
        email,
        full_name,
        role,
        is_active,
        email_verified,
        last_login,
        created_at,
        hospital_id,
        hospitals (
          id,
          name,
          token_balance
        )
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform data to match frontend interface
        const formattedUsers = users.map((user: any) => ({
            id: user.id,
            username: user.email.split('@')[0], // Fallback username
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            status: user.is_active ? 'active' : 'inactive',
            email_verified: user.email_verified,
            hospital_id: user.hospital_id,
            hospital_name: user.hospitals?.name,
            token_balance: user.hospitals?.token_balance,
            last_login: user.last_login || user.created_at,
            created_at: user.created_at
        }));

        return NextResponse.json({ users: formattedUsers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, is_active, email_verified } = body;

        if (!id) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const updates: any = {};
        if (is_active !== undefined) updates.is_active = is_active;
        if (email_verified !== undefined) updates.email_verified = email_verified;

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ user: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
