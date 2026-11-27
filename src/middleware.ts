import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const roleCookie = request.cookies.get('cv_user_role')?.value;

  // Protect all /admin/* routes
  if (pathname.startsWith('/admin')) {
    // Allowed official roles for staff administration
    const authorizedRoles = ['staff', 'official', 'admin'];

    if (!roleCookie || !authorizedRoles.includes(roleCookie)) {
      // Unauthorized or resident: redirect to login with access_denied query parameter
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'access_denied');
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith('/map')) {
    if (!roleCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'authentication_required');
      return NextResponse.redirect(loginUrl);
    }
    if (roleCookie === 'resident') {
      return NextResponse.redirect(new URL('/resident/dashboard', request.url));
    }
  }

  if (pathname.startsWith('/resident')) {
    if (!roleCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'authentication_required');
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (roleCookie !== 'resident') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/map/:path*', '/resident/:path*'],
};
