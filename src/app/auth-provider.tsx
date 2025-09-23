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

      console.log('AuthProvider - Auth event:', event, session?.user?.id);

      if (event === 'SIGNED_IN' && session) {
        try {
          const { data: profile, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('AuthProvider - Profile fetch error:', error);
            router.push('/dashboard'); // Default to dashboard if profile fetch fails
          } else {
            console.log('AuthProvider - User profile:', profile);
            if (profile?.role === 'admin') {
              router.push('/dashboard/settings');
            } else {
              router.push('/dashboard');
            }
          }
        } catch (error) {
          console.error('AuthProvider - Unexpected error:', error);
          router.push('/dashboard'); // Default to dashboard on error
        }
      } else if (event === 'SIGNED_OUT') {
        router.push('/');
      }
    };

    const initializeAuth = async () => {
      try {
        // Check initial session
        const { data: { session } } = await supabase.auth.getSession();
        if (session && isMounted) {
          await handleAuthChange('INITIAL_SESSION', session);
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
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            await handleAuthChange(event, session);
        } else if (event === 'SIGNED_OUT') {
            await handleAuthChange(event, null);
        }
    });

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
