import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Environment validation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const JWT_SECRET = process.env.JWT_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !JWT_SECRET) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, JWT_SECRET_KEY');
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

  // Legacy method for backward compatibility (admin access)
  static authenticate(username: string, password: string): boolean {
    const adminUsername = process.env.ADMIN_USERNAME || 'hana_admin';
    const adminPassword = process.env.ADMIN_PASSWORD;

    return username === adminUsername && password === adminPassword;
  }

  // Generate secure credentials for environment variables (for initial setup)
  static generateSecureCredentials() {
    const username = 'hana_admin_' + Math.random().toString(36).substring(2, 10);
    const password = this.generateSecurePassword();

    return {
      username,
      password,
      envVariables: `ADMIN_USERNAME=${username}\nADMIN_PASSWORD=${password}`
    };
  }

  private static generateSecurePassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  }
}

// Generate secure credentials for environment variables
export function generateSecureCredentials() {
  const username = 'hana_admin_' + Math.random().toString(36).substring(2, 10);
  const password = generateSecurePassword();
  
  return {
    username,
    password,
    envVariables: `ADMIN_USERNAME=${username}\nADMIN_PASSWORD=${password}`
  };
}

function generateSecurePassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}
