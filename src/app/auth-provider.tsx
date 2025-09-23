'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const handleAuthChange = async (event: string, session: any) => {
      if (!isMounted) return;

      console.log('AuthProvider - Auth event:', event);
      console.log('AuthProvider - Session user:', session?.user);

      if (event === 'SIGNED_IN' && session) {
        try {
          console.log('AuthProvider - Fetching profile for user:', session.user.id);
          
          // First, let's check if the user exists in auth.users
          const { data: authUser } = await supabase.auth.getUser();
          console.log('AuthProvider - Auth user check:', authUser);

          const { data: profile, error } = await supabase
            .from('users')
            .select('*') // Select all fields for debugging
            .eq('id', session.user.id)
            .single();

          console.log('AuthProvider - Profile query result:', { profile, error });
          console.log('AuthProvider - Error details:', {
            message: error?.message,
            code: error?.code,
            details: error?.details,
            hint: error?.hint
          });

          if (error) {
            // Check if it's a "no rows" error (user doesn't exist in users table)
            if (error.code === 'PGRST116') {
              console.log('AuthProvider - User profile not found, creating...');
              
              // Try to create the user profile
              const { data: newProfile, error: insertError } = await supabase
                .from('users')
                .insert({
                  id: session.user.id,
                  full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                  avatar_url: session.user.user_metadata?.avatar_url || null,
                  role: 'contractor' // Default role
                })
                .select()
                .single();

              if (insertError) {
                console.error('AuthProvider - Failed to create profile:', insertError);
                router.push('/dashboard'); // Default redirect even if profile creation fails
              } else {
                console.log('AuthProvider - Created new profile:', newProfile);
                if (newProfile.role === 'admin') {
                  router.push('/dashboard/settings');
                } else {
                  router.push('/dashboard');
                }
              }
            } else {
              console.error('AuthProvider - Profile fetch error:', error);
              router.push('/dashboard'); // Default to dashboard if profile fetch fails
            }
          } else {
            console.log('AuthProvider - User profile found:', profile);
            if (profile?.role === 'admin') {
              console.log('AuthProvider - Redirecting admin to settings');
              router.push('/dashboard/settings');
            } else {
              console.log('AuthProvider - Redirecting user to dashboard');
              router.push('/dashboard');
            }
          }
        } catch (error) {
          console.error('AuthProvider - Unexpected error:', error);
          router.push('/dashboard'); // Default to dashboard on error
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('AuthProvider - User signed out, redirecting to login');
        router.push('/');
      }
    };

    const initializeAuth = async () => {
      try {
        console.log('AuthProvider - Initializing auth state');
        // Check initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider - Session error:', error);
        }
        
        console.log('AuthProvider - Initial session:', session?.user?.id || 'No session');
        
        if (session) {
          await handleAuthChange('SIGNED_IN', session);
        }
      } catch (error) {
        console.error('AuthProvider - Initialization error:', error);
      } finally {
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    // Set up auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Initialize auth state
    initializeAuth();

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  // Show loading state until auth is initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
