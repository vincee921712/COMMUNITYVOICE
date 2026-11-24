import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin/* routes
  if (pathname.startsWith('/admin')) {
    const roleCookie = request.cookies.get('cv_user_role')?.value;

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

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
