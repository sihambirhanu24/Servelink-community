import { NextRequest, NextResponse } from 'next/server';

/**
 * Protects /admin/** routes.
 * - /admin/login is always public (the login page itself).
 * - All other /admin/** routes require a valid admin_token in localStorage.
 *   Since middleware runs on the server (no localStorage access), we use a
 *   cookie instead. The admin login page sets 'admin_token' cookie after login.
 * - If no token, redirect to /admin/login.
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
