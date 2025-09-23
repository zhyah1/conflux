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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { inviteUser } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

type User = {
  id: string;
  full_name: string;
  role: string;
  email: string;
};

const roles = ['pmc', 'owner', 'contractor', 'subcontractor'];

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('contractor');
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);

    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (currentUser) {
      // Fetch the current user's role from the public.users table
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single();
      
      if (currentUserProfile) {
        setCurrentUserRole(currentUserProfile.role);
      }
    }

    // Fetch all users. The RLS policy will allow this for any authenticated user.
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
    
    const result = await inviteUser(inviteEmail, selectedRole);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to send invitation: ${result.error}` });
    } else {
      toast({ title: 'Success', description: `Invitation sent to ${inviteEmail}.` });
      setInviteEmail('');
    }
  };
  
  const isCurrentUserAdmin = currentUserRole === 'admin';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Manage your team members and their roles."
      />
      
      {!isCurrentUserAdmin && !loading && (
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Non-Admin View</AlertTitle>
          <AlertDescription>
            You are viewing this page as a non-administrator. You can see the list of users, but you cannot invite new users or manage existing ones.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Invite New User</CardTitle>
          <CardDescription>
            Send an invitation to a new team member and assign them a role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInviteUser} className="grid md:grid-cols-3 gap-4 items-end mb-6">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input 
                  id="invite-email"
                  type="email" 
                  placeholder="new.user@example.com" 
                  value={inviteEmail} 
                  onChange={(e) => setInviteEmail(e.target.value)} 
                  required
                  disabled={!isCurrentUserAdmin}
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="role-select">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole} disabled={!isCurrentUserAdmin}>
                  <SelectTrigger id="role-select">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                       <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={!isCurrentUserAdmin || loading}>Invite User</Button>
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
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" disabled={!isCurrentUserAdmin}>
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
                    No users found. You can invite the first user if you are an administrator.
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
