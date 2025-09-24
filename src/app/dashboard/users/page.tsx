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
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  full_name: string;
  role: string;
  email: string;
};

const roles = ['admin', 'pmc', 'owner', 'contractor', 'subcontractor'];

export default function UsersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('contractor');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthentication = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('Session check:', session);
      console.log('Session error:', error);
      
      if (error) {
        console.error('Auth session error:', error);
        return false;
      }
      
      if (!session || !session.user) {
        console.log('No active session found');
        return false;
      }
      
      console.log('Authenticated user:', session.user);
      return true;
    } catch (err) {
      console.error('Authentication check failed:', err);
      return false;
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    
    try {
      // First check authentication
      const authCheck = await checkAuthentication();
      
      if (!authCheck) {
        console.log('User not authenticated, redirecting to login');
        toast({ 
          variant: 'destructive', 
          title: 'Authentication Required', 
          description: 'Please log in to access the users page.' 
        });
        router.push('/'); 
        return;
      }
      
      setIsAuthenticated(true);

      // Now try to fetch users
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role, email');
      
      console.log('Supabase query result:', { data, error });

      if (error) {
        console.error('Error fetching users:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: `Failed to fetch users: ${error.message}` 
        });
        setUsers([]);
      } else {
        console.log('Successfully fetched users:', data);
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'An unexpected error occurred while fetching users.' 
      });
      setUsers([]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        if (event === 'SIGNED_IN') {
          setIsAuthenticated(true);
          fetchUsers();
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUsers([]);
          router.push('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({ 
        variant: 'destructive', 
        title: 'Authentication Required', 
        description: 'Please log in to invite users.' 
      });
      return;
    }
    
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
      fetchUsers();
    }
  };

  // Show login prompt if not authenticated
  if (!loading && !isAuthenticated) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Users"
          description="Please log in to manage your team members."
        />
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                You need to be logged in to access the users page.
              </p>
              <Button onClick={() => router.push('/')}>
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Manage your team members and their roles."
      />
      
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
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="role-select">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
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
              <Button type="submit" disabled={loading || !isAuthenticated}>
                Invite User
              </Button>
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
                          <Button size="icon" variant="ghost">
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
                    No users found. Invite the first user to get started.
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
