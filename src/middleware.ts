import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  // If the user is on the login/signup page but is already signed in
  if (user && (req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/signup'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // if user is not signed in and trying to access a protected route, redirect to login
  if (!user && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // if the user is signed in and navigates to the dashboard, check their role
  if (user && req.nextUrl.pathname === '/dashboard') {
     const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard/settings', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/signup'],
};
