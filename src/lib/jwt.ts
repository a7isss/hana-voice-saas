import jwt from 'jsonwebtoken';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface HospitalJWTPayload {
  userId: string;
  hospitalId: string;
  role: 'hospital_staff' | 'hospital_admin' | 'super_admin';
  email: string;
  fullName: string;
  iat?: number;
  exp?: number;
}

// Generate JWT token for hospital users
export function generateJWTToken(payload: Omit<HospitalJWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '8h' // Hospital sessions: 8 hours
  });
}

// Generate refresh token (longer expiry)
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: '7d' // Refresh tokens: 7 days
  });
}

// Verify JWT token from Authorization header
export function verifyJWTToken(token: string): HospitalJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as HospitalJWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}

// Extract token from Authorization header (Bearer token)
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}
