import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });

  // Allow access to demo routes without authentication
  if (req.nextUrl.pathname === '/api/analyze-prayer/demo' || 
      req.nextUrl.pathname === '/api/chat-history/demo' ||
      req.nextUrl.pathname === '/api/prayers/demo') {
    return NextResponse.next();
  }

  // Add this new condition for prayer guidance
  if (!token && req.nextUrl.pathname === '/prayer-guidance/spiritual-guidance') {
    const redirectUrl = new URL('/prayer-guidance/demo', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Protected API routes that require authentication
  if (!token && (
    req.nextUrl.pathname.startsWith('/api/discussions') ||
    (req.nextUrl.pathname.startsWith('/api/prayers') && !req.nextUrl.pathname.includes('/demo')) ||
    req.nextUrl.pathname.startsWith('/api/groups') ||
    req.nextUrl.pathname.startsWith('/api/user')
  )) {
    return new NextResponse(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  // Protected actions that require authentication (creating/editing content)
  if (!token && (
    (req.nextUrl.pathname.startsWith('/community/discussions') && req.nextUrl.pathname.includes('/create')) ||
    (req.nextUrl.pathname.startsWith('/community/prayers') && req.nextUrl.pathname.includes('/create')) ||
    (req.nextUrl.pathname.startsWith('/community/groups') && req.nextUrl.pathname.includes('/create')) ||
    req.nextUrl.pathname.startsWith('/account')
  )) {
    const redirectUrl = new URL('/auth/access-required', req.url);
    redirectUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing admin console and not signed in, redirect to Log In
  if (!token && req.nextUrl.pathname.startsWith('/admin-console')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing admin console and not a super admin, redirect to Log In
  if (req.nextUrl.pathname.startsWith('/admin-console') && !token?.is_super_admin) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/prayer-guidance/spiritual-guidance',
    '/admin-console/:path*',
    '/api/admin-console/:path*',
    '/api/discussions/:path*',
    '/api/prayers/:path*',
    '/api/analyze-prayer/:path*',
    '/api/chat-history/:path*',
    '/api/groups/:path*',
    '/api/user/:path*',
    '/account/:path*',
    '/community/discussions/create/:path*',
    '/community/prayers/create/:path*',
    '/community/groups/create/:path*'
  ],
}; 