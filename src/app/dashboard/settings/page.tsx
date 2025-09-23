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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const ROLES = ['admin', 'pmc', 'owner', 'contractor', 'subcontractor'];

export default function SettingsPage() {
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, role')
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
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('users').update({ full_name: fullName }).eq('id', user.id);
      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
      } else {
        toast({ title: 'Success', description: 'Profile updated successfully.' });
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage your account and system configurations."
      />
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
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
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} disabled />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit">Save Changes</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Roles & Permissions</CardTitle>
              <CardDescription>
                Define roles for your team members.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-2">
                {ROLES.map(role => (
                    <div key={role} className="flex items-center justify-between p-2 border rounded-md">
                        <span className="capitalize font-medium">{role}</span>
                        <Badge variant="secondary">
                            {role === 'admin' && 'Full Access'}
                            {role === 'pmc' && 'Project Management'}
                            {role === 'owner' && 'Project Ownership'}
                            {role === 'contractor' && 'General Access'}
                            {role === 'subcontractor' && 'Limited Access'}
                        </Badge>
                    </div>
                ))}
            </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
