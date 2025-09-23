import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    const pathname = req.nextUrl.pathname;

    // Debug logging (remove in production)
    console.log('Middleware - User:', user ? 'authenticated' : 'not authenticated');
    console.log('Middleware - Path:', pathname);

    // If the user is on the login page but is already signed in
    if (user && pathname === '/') {
      console.log('Redirecting authenticated user from login to dashboard');
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // If the user is on the signup page but is already signed in
    if (user && pathname.startsWith('/signup')) {
      console.log('Redirecting authenticated user from signup to dashboard');
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // If user is not signed in and trying to access a protected route, redirect to login
    if (!user && pathname.startsWith('/dashboard')) {
      console.log('Redirecting unauthenticated user to login');
      return NextResponse.redirect(new URL('/', req.url));
    }

    // If the user is signed in and navigates to the dashboard, check their role
    if (user && pathname === '/dashboard') {
      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          // Continue to dashboard even if profile fetch fails
        } else if (profile?.role === 'admin') {
          console.log('Redirecting admin user to settings');
          return NextResponse.redirect(new URL('/dashboard/settings', req.url));
        }
      } catch (error) {
        console.error('Error in role check:', error);
        // Continue to dashboard even if role check fails
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // In case of any error, allow the request to proceed
    return res;
  }
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/signup'],
};
