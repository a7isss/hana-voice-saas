import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Environment validation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !JWT_SECRET || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD');
}

// Initialize Supabase client
let supabase: SupabaseClient;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
  throw new Error(`Failed to initialize Supabase client: ${error}`);
}

export interface ClientCredentials {
  clientId: string;
  apiKey: string;
}

export interface ClientInfo {
  id: string;
  name: string;
  department: string;
  permissions: {
    voice_calls: boolean;
    data_export: boolean;
    analytics: boolean;
  };
}

export class AuthService {
  // Authenticate client credentials against database
  static async authenticateClient(credentials: ClientCredentials): Promise<ClientInfo | null> {
    try {
      // Check if clients table exists and has the required structure
      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', credentials.clientId)
        .eq('api_key', credentials.apiKey)
        .eq('is_active', true)
        .single();

      if (error || !client) {
        return null;
      }

      // Return client info in expected format
      return {
        id: client.id,
        name: client.name || 'Unknown Client',
        department: client.department || 'General',
        permissions: {
          voice_calls: client.voice_calls ?? true,
          data_export: client.data_export ?? true,
          analytics: client.analytics ?? true
        }
      };
    } catch (error) {
      console.error('Client authentication error:', error);
      return null;
    }
  }

  // Generate JWT token for authenticated client
  static generateJWTToken(clientId: string, clientName: string): string {
    const payload = {
      clientId,
      clientName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000) // 24 hours
    };

    return jwt.sign(payload, JWT_SECRET!);
  }

  // Validate JWT token and return client info
  static validateJWTToken(token: string): { clientId: string; clientName: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET!) as jwt.JwtPayload & { clientId: string; clientName: string; exp: number };

      // Check if token is expired
      if (Date.now() > decoded.exp * 1000) {
        return null;
      }

      return {
        clientId: decoded.clientId,
        clientName: decoded.clientName
      };
    } catch {
      return null;
    }
  }

  // Authenticate admin user
  static authenticate(username: string, password: string): boolean {
    return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
  }
}

