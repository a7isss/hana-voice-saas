// Authentication utilities for Hana Voice SaaS
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Secure credentials from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET_KEY;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !JWT_SECRET) {
  throw new Error('Missing required authentication environment variables: ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET_KEY');
}

// Session management
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthSession {
  username: string;
  loggedInAt: number;
  expiresAt: number;
}

export interface JWTUser {
  username: string;
  iat: number;
  exp: number;
}

export class AuthService {
  // Generate JWT token for authenticated user
  static generateJWTToken(username: string): string {
    const payload: JWTUser = {
      username,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + SESSION_DURATION) / 1000)
    };

    return jwt.sign(payload, JWT_SECRET!);
  }

  // Validate JWT token
  static validateJWTToken(token: string): JWTUser | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET!) as JWTUser;

      // Check if token is expired
      if (Date.now() > decoded.exp * 1000) {
        return null;
      }

      return decoded;
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

    const user = this.validateJWTToken(token);
    return user !== null;
  }

  // Get current user from request
  static getCurrentUser(request: NextRequest): JWTUser | null {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;

    return this.validateJWTToken(token);
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
