/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { z } from 'zod';

// Validation schemas
const authenticateSchema = z.object({
  action: z.literal('authenticate'),
  clientId: z.string().min(1, 'Client ID is required'),
  apiKey: z.string().min(1, 'API key is required')
});

const loginSchema = z.object({
  action: z.literal('login'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

const logoutSchema = z.object({
  action: z.literal('logout')
});

const validateSchema = z.object({
  action: z.literal('validate')
});

export async function GET() {
  // Simple health check
  return NextResponse.json({
    status: 'healthy',
    service: 'hana-voice-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    message: 'Application is running successfully'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Determine which schema to use based on action
    let validatedData;
    try {
      const action = body.action;

      switch (action) {
        case 'authenticate':
          validatedData = authenticateSchema.parse(body);
          break;
        case 'login':
          validatedData = loginSchema.parse(body);
          break;
        case 'logout':
          validatedData = logoutSchema.parse(body);
          break;
        case 'validate':
          validatedData = validateSchema.parse(body);
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          );
      }
    } catch (validationError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: (validationError as any).errors },
        { status: 400 }
      );
    }

    switch (validatedData.action) {
      case 'authenticate':
        // Client-based authentication using API key
        const clientInfo = await AuthService.authenticateClient({
          clientId: validatedData.clientId,
          apiKey: validatedData.apiKey
        });

        if (clientInfo) {
          // Generate JWT token for authenticated client
          const token = AuthService.generateJWTToken(clientInfo.id, clientInfo.name);

          return NextResponse.json({
            authenticated: true,
            client: clientInfo,
            message: 'Client authentication successful'
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } else {
          return NextResponse.json(
            { error: 'Invalid client credentials' },
            { status: 401 }
          );
        }

      case 'login':
        // Legacy admin login for backward compatibility
        const isAuthenticated = AuthService.authenticate(validatedData.username, validatedData.password);

        if (isAuthenticated) {
          // Generate JWT token for admin user
          const token = AuthService.generateJWTToken(validatedData.username, 'Admin');

          // Create response with cookie
          const response = NextResponse.json({
            success: true,
            message: 'Admin login successful',
            user: { username: validatedData.username }
          });

          // Set HTTP-only cookie for session
          response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60, // 24 hours
            path: '/'
          });

          return response;
        } else {
          return NextResponse.json(
            { error: 'Invalid admin credentials' },
            { status: 401 }
          );
        }

      case 'logout':
        // Clear the auth cookie
        const logoutResponse = NextResponse.json({
          success: true,
          message: 'Logout successful'
        });

        logoutResponse.cookies.set('auth-token', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 0, // Expire immediately
          path: '/'
        });

        return logoutResponse;

      case 'validate':
        // Validate current admin session from cookie
        const authCookie = request.cookies.get('auth-token')?.value;
        if (!authCookie) {
          return NextResponse.json({
            authenticated: false,
            user: null
          });
        }

        const userInfo = AuthService.validateJWTToken(authCookie);
        return NextResponse.json({
          authenticated: !!userInfo,
          user: userInfo ? { username: userInfo.clientId } : null
        });

      default:
        return NextResponse.json(
          { error: 'Unsupported action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
