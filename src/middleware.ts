import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './lib/auth';

// Routes that require authentication
const protectedRoutes = [
  '/',
  '/calling-robot',
  '/demo-test-call', 
  '/audio-conversion',
  '/reports',
  '/calendar',
  '/line-chart',
  '/bar-chart'
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = [
  '/signin',
  '/signup'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check authentication status
  const isAuthenticated = AuthService.isAuthenticated(request);
  
  // Redirect to login if trying to access protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/signin', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect to dashboard if trying to access auth route while already authenticated
  if (isAuthRoute && isAuthenticated) {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
