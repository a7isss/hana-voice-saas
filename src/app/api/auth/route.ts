import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Logger for debugging
const logger = {
  info: (message: string, data?: any) => console.log(`[AUTH-API] ${new Date().toISOString()} INFO: ${message}`, data),
  error: (message: string, error?: any) => console.error(`[AUTH-API] ${new Date().toISOString()} ERROR: ${message}`, error),
  warn: (message: string, data?: any) => console.warn(`[AUTH-API] ${new Date().toISOString()} WARN: ${message}`, data)
};

export async function GET(request: NextRequest) {
  try {
    // Health check endpoint
    const { data, error } = await supabase.from('clients').select('id').limit(1);
    
    if (error) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          service: 'hana-voice-api',
          database: 'disconnected',
          error: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'hana-voice-api',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        service: 'hana-voice-api',
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, clientId, apiKey } = body;

    switch (action) {
      case 'authenticate':
        // Authenticate client
        const { data: client, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .eq('api_key', apiKey)
          .single();

        if (error || !client) {
          return NextResponse.json(
            { error: 'Invalid client credentials' },
            { status: 401 }
          );
        }

        return NextResponse.json({
          authenticated: true,
          client: {
            id: client.id,
            name: client.name,
            department: client.department,
            permissions: client.permissions
          }
        });

      case 'validate_token':
        // Validate JWT token (simplified)
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
          return NextResponse.json(
            { error: 'No token provided' },
            { status: 401 }
          );
        }

        // In a real implementation, you would validate the JWT token
        return NextResponse.json({
          valid: true,
          message: 'Token is valid'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
