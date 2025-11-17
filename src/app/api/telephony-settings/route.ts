import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Telephony settings interface
interface TelephonySettings {
  id?: string;
  provider: 'maqsam';
  auth_method: 'http_header' | 'websocket_token';
  auth_token: string;
  base_url: string;
  webhook_url: string;
  allowed_agents: string[];
  is_active: boolean;
  test_mode: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('telephony_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data || null });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch telephony settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings: TelephonySettings = await request.json();

    // Validate required fields
    if (!settings.provider || !settings.auth_method || !settings.auth_token || !settings.base_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Deactivate any existing active settings
    if (settings.is_active) {
      await supabase
        .from('telephony_settings')
        .update({ is_active: false })
        .eq('is_active', true);
    }

    // Insert new settings
    const { data, error } = await supabase
      .from('telephony_settings')
      .insert([{
        ...settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save telephony settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settings: Partial<TelephonySettings> & { id: string } = await request.json();

    // Deactivate any existing active settings if this one is being activated
    if (settings.is_active) {
      await supabase
        .from('telephony_settings')
        .update({ is_active: false })
        .neq('id', settings.id)
        .eq('is_active', true);
    }

    const { data, error } = await supabase
      .from('telephony_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', settings.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update telephony settings' }, { status: 500 });
  }
}
