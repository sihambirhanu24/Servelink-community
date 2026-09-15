import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin routes ───────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('admin_token')?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return NextResponse.next();
  }

  // ── Verification routes — always accessible ────────────────────────────────
  if (
    pathname === '/verification-pending' ||
    pathname === '/verification-rejected' ||
    pathname === '/verification-setup'
  ) {
    return NextResponse.next();
  }

  // ── Auth routes — always accessible ───────────────────────────────────────
  if (pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  // ── Protected teacher routes ───────────────────────────────────────────────
  const protectedPaths = ['/dashboard', '/community', '/profile', '/chat'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
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
    '/verification-rejected',
    '/verification-setup',
    '/auth/:path*',
  ],
};
