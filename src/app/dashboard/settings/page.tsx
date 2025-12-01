'use client';

import { PageHeader } from '../components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        const { data: profile } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile) {
          setFullName(profile.full_name);
        }
      }
    };
    fetchUserData();
  }, []);
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('users').update({ full_name: fullName }).eq('id', user.id);
      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
      } else {
        toast({ title: 'Success', description: 'Profile updated successfully.' });
      }
    }
    setIsUpdatingProfile(false);
  };


  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <form onSubmit={handleProfileUpdate}>
            <CardHeader>
              <CardTitle className="font-headline">Profile</CardTitle>
              <CardDescription>
                This is how others will see you on the site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isUpdatingProfile} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} disabled />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isUpdatingProfile}>
                 {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
            <CardHeader>
              <CardTitle className="font-headline">Security</CardTitle>
              <CardDescription>
                Manage your account's security settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <h4 className="font-semibold">Password</h4>
                        <p className="text-sm text-muted-foreground">Change your password to keep your account secure.</p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/settings/reset-password">
                            <KeyRound className="mr-2 h-4 w-4"/>
                            Reset Password
                        </Link>
                    </Button>
               </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
