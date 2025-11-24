
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up a new user, who will become an 'owner' of a new organization.
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
           options: {
            data: {
              full_name: email.split('@')[0], 
              // The role is set to 'owner' by a database trigger upon new user creation.
            },
          },
        });
        
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Sign Up Error',
            description: error.message
          });
        } else {
          toast({
            title: 'Success',
            description: 'Account created successfully! Please check your email for verification.'
          });
          // Don't redirect immediately, let them verify email.
          setIsSignUp(false); // Switch back to login view
        }
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Sign In Error',
            description: error.message
          });
        } else {
          toast({
            title: 'Success',
            description: 'Signed in successfully!'
          });
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred'
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
           <Logo className="h-10 w-10 text-primary mx-auto mb-2" />
          <CardTitle className="font-headline">{isSignUp ? 'Create Your Workspace' : 'Welcome back to Construx'}</CardTitle>
          <CardDescription>
            {isSignUp 
              ? 'Create an account to start managing your projects.' 
              : 'Sign in to your account to continue'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                minLength={6}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
            
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : 'Need an account? Sign up'
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
