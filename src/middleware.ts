import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authSessionCookieName, useSecureAuthCookies } from '@/lib/auth-cookie-security';

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: authSessionCookieName(),
    secureCookie: useSecureAuthCookies(),
  });

  if (!token && req.nextUrl.pathname.startsWith('/api/user')) {
    return new NextResponse(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }

  if (!token && req.nextUrl.pathname.startsWith('/account')) {
    const redirectUrl = new URL('/api/auth/hub-signin', req.url);
    redirectUrl.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (!token && req.nextUrl.pathname.startsWith('/admin-console')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/api/auth/hub-signin';
    redirectUrl.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (req.nextUrl.pathname.startsWith('/admin-console') && !token?.is_super_admin) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/api/auth/hub-signin';
    redirectUrl.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin-console/:path*',
    '/api/admin-console/:path*',
    '/api/user/:path*',
    '/account/:path*',
  ],
};
