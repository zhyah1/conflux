'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/');
      } else if (event === 'SIGNED_IN' && session) {
        // Try to get user profile
        let { data: profile, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        // If profile doesn't exist, create it.
        if (error && error.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert({
              id: session.user.id,
              full_name: session.user.email?.split('@')[0] || 'New User',
              // Default role is 'contractor', admin must be set manually
              role: 'contractor', 
            })
            .select('role')
            .single();
          
          if (insertError) {
             console.error('Failed to create user profile:', insertError);
          } else {
            // After creation, the profile is now available
            profile = newProfile;
          }
        }

        if (profile?.role === 'admin') {
          router.push('/dashboard');
        } else {
          // If not an admin, sign them out and show an error.
          await supabase.auth.signOut();
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have permission to access this application.',
          });
          // Redirect to login page with an error query param
          router.push('/?error=Access%20Denied');
        }
      }
    });

    const initializeSession = async () => {
      // This helps prevent a flash of the login page for already logged-in users on refresh.
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
         setIsInitialized(true);
      }
      // If there is a session, onAuthStateChange will fire and handle redirection.
      // We wait for that to avoid race conditions.
    };

    initializeSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, toast]);

  // Keep showing loading screen until session is processed.
  // The onAuthStateChange listener will set isInitialized for non-session cases.
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
