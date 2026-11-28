import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function loginRedirect(request: NextRequest, reason: string, response?: NextResponse) {
  const url = new URL('/login', request.url);
  url.searchParams.set('error', reason);
  const redirectResponse = NextResponse.redirect(url);
  response?.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith('/admin');
  const isMapRoute = pathname.startsWith('/map');
  const isResidentRoute = pathname.startsWith('/resident');
  if (!isAdminRoute && !isMapRoute && !isResidentRoute) return NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'development') {
      const demoRole = request.cookies.get('cv_user_role')?.value;
      const isStaff = ['staff', 'official', 'admin'].includes(demoRole || '');
      if ((isAdminRoute || isMapRoute) && isStaff) return NextResponse.next();
      if (isResidentRoute && demoRole === 'resident') return NextResponse.next();
    }
    return loginRedirect(request, 'authentication_required');
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return loginRedirect(request, 'authentication_required', response);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError || !profile) return loginRedirect(request, 'profile_required', response);

  const isStaff = ['staff', 'official', 'admin'].includes(profile.role);
  if ((isAdminRoute || isMapRoute) && !isStaff) {
    const redirectResponse = NextResponse.redirect(new URL('/resident/dashboard', request.url));
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }
  if (isResidentRoute && profile.role !== 'resident') {
    const redirectResponse = NextResponse.redirect(new URL('/admin/dashboard', request.url));
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/map/:path*', '/resident/:path*'],
};
