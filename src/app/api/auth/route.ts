import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

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
    const { action, username, password } = body;

    switch (action) {
      case 'login':
        if (!username || !password) {
          return NextResponse.json(
            { error: 'Username and password are required' },
            { status: 400 }
          );
        }

        // Authenticate user
        const isAuthenticated = AuthService.authenticate(username, password);
        
        if (isAuthenticated) {
          // Generate JWT token
          const token = AuthService.generateJWTToken(username);

          // Create response with cookie
          const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            user: { username }
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
            { error: 'Invalid username or password' },
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
        // Validate current session
        const isLoggedIn = AuthService.isAuthenticated(request);
        const user = AuthService.getCurrentUser(request);

        return NextResponse.json({
          authenticated: isLoggedIn,
          user: user ? { username: user.username } : null
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
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
