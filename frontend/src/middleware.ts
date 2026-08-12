import { NextRequest, NextResponse } from 'next/server';

/**
 * Protects /admin/** routes using server-side middleware.
 * 
 * This protects admin routes by checking for the admin_token cookie on every request.
 * This cannot be replaced with client-side checks or redirects because:
 * - Cookies are only available on the server during middleware execution
 * - Client-side checks would allow brief UI exposure before redirects
 * - This ensures all routes are protected before reaching the app
 * 
 * Route Protection:
 * - /admin/login is public (the login page itself)
 * - All other /admin/** routes require a valid admin_token cookie
 * - If no token, redirects to /admin/login
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow the admin login page itself — no redirect loop
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Check for admin session cookie (set by the admin login page)
  const adminToken = request.cookies.get('admin_token')?.value;

  if (!adminToken) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

