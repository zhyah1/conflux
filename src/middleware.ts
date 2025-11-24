
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
  const pathname = req.nextUrl.pathname;

  // If user is signed in and on the landing or login page, redirect to dashboard
  if (user && (pathname === '/' || pathname === '/login')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is not signed in and trying to access a protected route, redirect to login page
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
};
