'use client';

import { PageHeader } from '../components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type User = {
  id: string;
  full_name: string;
  role: string;
  email: string;
};

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    
    const { data, error } = await supabase.from('users').select('*');

    if (error) {
      console.error('Error fetching users:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch user data. Please ensure RLS policies are set correctly in Supabase.' });
      setUsers([]);
    } else {
      setUsers(data as User[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast({ variant: 'destructive', title: 'Error', description: 'Email is required.' });
      return;
    }
    
    // Invite a new user, setting their role to 'admin' by default in the metadata.
    // The handle_new_user trigger in Supabase will use this metadata.
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
      data: { role: 'admin' },
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to send invitation: ${error.message}` });
    } else {
      toast({ title: 'Success', description: `Invitation sent to ${inviteEmail}.` });
      setInviteEmail('');
      // The new user will appear after they accept the invite and sign up.
      // We can optionally refetch users here if we want to show pending invites,
      // but for now, we'll wait for them to accept.
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Manage your team members. All users are admins."
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Invite New Admin</CardTitle>
          <CardDescription>
            Send an invitation to a new team member. They will have full admin privileges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInviteUser} className="flex items-center gap-2 mb-6">
              <Input 
                type="email" 
                placeholder="new.user@example.com" 
                value={inviteEmail} 
                onChange={(e) => setInviteEmail(e.target.value)} 
                required 
                className="max-w-sm"
              />
              <Button type="submit">Invite User</Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.full_name || 'Invited User'}</div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" disabled={users.length <= 1}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem className="text-destructive">Remove User</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                 <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
