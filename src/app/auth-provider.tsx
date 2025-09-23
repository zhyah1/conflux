'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        // When auth state changes (login/logout), we might need to re-route.
        if (_event === 'SIGNED_IN' && newSession) {
            // The check below will handle redirection.
        } else if (_event === 'SIGNED_OUT') {
            router.push('/');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);
  
  useEffect(() => {
    const checkUserRole = async () => {
      if (session) {
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
          await supabase.auth.signOut();
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have permission to access this application.',
          });
          router.push('/?error=Access%20Denied');
        }
      }
    };
    
    if(!loading && session){
        checkUserRole();
    }
  }, [session, loading, router, toast]);

  if (loading) {
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
