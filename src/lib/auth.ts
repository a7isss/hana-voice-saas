// Authentication utilities for Hana Voice SaaS
import { NextRequest } from 'next/server';

// Secure credentials from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Session management
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthSession {
  username: string;
  loggedInAt: number;
  expiresAt: number;
}

export class AuthService {
  // Generate a simple session token (in production, use JWT)
  static generateSessionToken(username: string): string {
    const session: AuthSession = {
      username,
      loggedInAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION
    };
    return Buffer.from(JSON.stringify(session)).toString('base64');
  }

  // Validate session token
  static validateSessionToken(token: string): AuthSession | null {
    try {
      const session: AuthSession = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        return null;
      }
      
      return session;
    } catch {
      return null;
    }
  }

  // Authenticate user credentials
  static authenticate(username: string, password: string): boolean {
    return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
  }

  // Check if user is authenticated from request
  static isAuthenticated(request: NextRequest): boolean {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return false;

    const session = this.validateSessionToken(token);
    return session !== null;
  }

  // Get current user from request
  static getCurrentUser(request: NextRequest): AuthSession | null {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;

    return this.validateSessionToken(token);
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
