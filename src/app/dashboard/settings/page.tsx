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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const ROLES = ['admin', 'pmc', 'owner', 'contractor', 'subcontractor'];

type User = {
  id: string;
  full_name: string;
  role: string;
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('contractor');

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');

        // Fetch current user's profile to get name and role
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, role')
          .eq('id', user.id)
          .single();
        if (profile) {
          setFullName(profile.full_name);
          setCurrentUserRole(profile.role);
        }

        // Fetch all users if admin
        if (profile?.role === 'admin') {
          const { data: allUsers } = await supabase.from('users').select('id, full_name, role');
          if (allUsers) {
            setUsers(allUsers);
          }
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

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
      data: { role: inviteRole },
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Success', description: `Invitation sent to ${inviteEmail}.` });
      setInviteEmail('');
      // Optionally refresh user list
      const { data: allUsers } = await supabase.from('users').select('id, full_name, role');
      if (allUsers) {
        setUsers(allUsers);
      }
    }
  };
  
  const isAdmin = currentUserRole === 'admin';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings, users, and system configurations."
      />
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
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
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Users</CardTitle>
              <CardDescription>
                Manage your team members and their roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAdmin && (
                <form onSubmit={handleInviteUser} className="flex items-center gap-2 mb-4">
                    <Input type="email" placeholder="new.user@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                     <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map(role => (
                            <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    <Button type="submit">Invite User</Button>
                </form>
              )}
              {isAdmin ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium">{user.full_name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Remove</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">You do not have permission to manage users.</p>
              )}
            </CardContent>
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