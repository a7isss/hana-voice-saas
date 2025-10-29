import { NextResponse } from 'next/server';

// Note: Authentication is now handled at the API level using client API keys
// This middleware is disabled as the dashboard is accessed by authenticated healthcare staff
// Authentication checks are performed in the API routes for data protection

export function middleware() {
  // For now, allow all routes to pass through
  // Authentication is handled at the API level with client credentials
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
