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

  // if user is signed in and the current path is / or /signup, redirect to dashboard
  if (user && (req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/signup'))) {
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard/settings', req.url));
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // if user is not signed in and trying to access a protected route, redirect to /
  if (!user && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  // if user is not signed in and the current path is not / or signup or auth callback, allow it.
  if (!user && !['/', '/signup'].includes(req.nextUrl.pathname) && !req.nextUrl.pathname.startsWith('/auth/callback')) {
    return res;
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
