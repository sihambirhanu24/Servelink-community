import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    const adminToken = request.cookies.get('admin_token')?.value;
    if (!adminToken) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // Handle teacher verification routes - these should be accessible
  if (pathname === '/verification-pending' || pathname === '/verification-rejected') {
    return NextResponse.next();
  }

  // For protected teacher routes, check token and verification status
  const protectedPaths = ['/dashboard', '/community', '/profile', '/chat'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  if (isProtectedPath) {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      // No token, redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Note: We can't decode JWT in middleware without adding crypto libraries,
    // so the verification status check happens in the login hook and in page components
    // If a non-approved teacher tries to access protected pages, they'll be redirected client-side
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/community/:path*',
    '/profile/:path*',
    '/chat/:path*',
    '/verification-pending',
    '/verification-rejected'
  ],
};
