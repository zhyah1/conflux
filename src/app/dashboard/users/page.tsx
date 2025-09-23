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
  email: string;
};

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('contractor');

  const fetchUsersAndRole = async () => {
    // Fetch current user's data first to determine role
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setCurrentUserRole(profile.role);

        // If user is admin, fetch all other users
        if (profile.role === 'admin') {
          const { data: allUsersData, error: allUsersError } = await supabase.from('users').select('id, full_name, role');
          
          if (allUsersError) {
            console.error('Error fetching users:', allUsersError);
            return;
          }
        
          const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
          if (authError) {
            console.error('Error fetching auth users:', authError);
            return;
          }
      
          const combinedUsers = allUsersData.map(profile => {
            const authUser = authUsers.users.find(u => u.id === profile.id);
            return {
              ...profile,
              email: authUser?.email || 'N/A',
            };
          });
          setUsers(combinedUsers);
        }
      }
    }
  };

  useEffect(() => {
    fetchUsersAndRole();
  }, []);
  
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast({ variant: 'destructive', title: 'Error', description: 'Email is required.' });
      return;
    }
    
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
      data: { role: inviteRole, full_name: 'Invited User' },
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Success', description: `Invitation sent to ${inviteEmail}.` });
      setInviteEmail('');
      fetchUsersAndRole(); // Refresh user list
    }
  };
  
  const isAdmin = currentUserRole === 'admin';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Manage your team members and their roles."
      />
      
      <Card>
        {isAdmin && (
          <CardHeader>
            <CardTitle className="font-headline">Invite New User</CardTitle>
            <CardDescription>
              Send an invitation to a new team member.
            </CardDescription>
          </CardHeader>
        )}
        <CardContent>
          {isAdmin && (
            <form onSubmit={handleInviteUser} className="flex items-center gap-2 mb-6">
                <Input 
                  type="email" 
                  placeholder="new.user@example.com" 
                  value={inviteEmail} 
                  onChange={(e) => setInviteEmail(e.target.value)} 
                  required 
                  className="max-w-sm"
                />
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
              {isAdmin && users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.full_name || 'Invited User'}</div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Edit Role</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Remove User</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!isAdmin && (
             <div className="text-center text-muted-foreground pt-4">You do not have permission to view users.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
