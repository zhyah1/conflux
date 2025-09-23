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
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    const checkUserRole = async () => {
      if (session) {
        let { data: profile, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // This can happen on the very first login if the DB trigger is slow.
          // We'll just wait a moment and let the next check handle it.
          console.warn('Profile not found, waiting for creation...');
          return;
        }

        if (profile?.role === 'admin') {
          // Only redirect if not already on a dashboard page
          if (!window.location.pathname.startsWith('/dashboard')) {
            router.push('/dashboard');
          }
        } else {
          await supabase.auth.signOut();
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have permission to access this application.',
          });
          // Only redirect if not already on the home page
          if (window.location.pathname !== '/') {
            router.push('/?error=Access%20Denied');
          }
        }
      }
    };
    
    if(!loading){
        if (session) {
            checkUserRole();
        } 
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
