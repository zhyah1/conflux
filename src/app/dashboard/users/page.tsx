

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
import { MoreHorizontal, Loader2, Copy, Check } from 'lucide-react';
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
import { inviteUser, deleteUser } from './actions';
import { useUser } from '@/app/user-provider';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


type User = {
  id: string;
  full_name: string;
  role: string;
  email: string;
};

const roles = ['admin', 'pmc', 'contractor', 'consultant', 'subcontractor', 'client'];

function PasswordDisplay({ password }: { password: any }) {
    const [hasCopied, setHasCopied] = useState(false);
    const { toast } = useToast();

    const copyToClipboard = () => {
        navigator.clipboard.writeText(password);
        setHasCopied(true);
        toast({ title: 'Password Copied!' });
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <div className="mt-2 flex items-center justify-between rounded-md bg-muted p-2">
            <code className="text-sm font-mono">{password}</code>
            <Button onClick={copyToClipboard} size="icon" variant="ghost" className="h-7 w-7">
                {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
        </div>
    );
}

export default function UsersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { profile } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('contractor');
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isInviting, setIsInviting] = useState(false);


  const canManageUsers = profile?.role === 'admin' || profile?.role === 'owner';

  const fetchUsers = async () => {
    if (!profile) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, role, email');

    if (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: `Failed to fetch users: ${error.message}` 
      });
      setUsers([]);
    } else {
      setUsers(data || []);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (profile) { // Wait for profile to be loaded
        if (!canManageUsers) {
            router.push('/dashboard');
        } else {
            fetchUsers();
        }
    }
  }, [profile]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    
    if (!inviteEmail) {
      toast({ variant: 'destructive', title: 'Error', description: 'Email is required.' });
      setIsInviting(false);
      return;
    }
    
    const result = await inviteUser(inviteEmail, selectedRole);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to create user: ${result.error}` });
    } else {
      toast({ 
          title: 'User Created Successfully!', 
          description: (
              <div>
                <p>Share this temporary password with {inviteEmail}:</p>
                <PasswordDisplay password={result.password} />
              </div>
          ),
          duration: 15000,
      });
      setInviteEmail('');
      await fetchUsers();
    }
     setIsInviting(false);
  };
  
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    const result = await deleteUser(userToDelete.id);

    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to remove user: ${result.error}` });
    } else {
      toast({ title: 'Success', description: `User ${userToDelete.full_name} has been removed.` });
      setUserToDelete(null);
      await fetchUsers();
    }
    setIsDeleting(false);
  }

  if (!profile && !loading) {
    // If still no profile and not loading, redirect
    router.push('/dashboard');
    return null;
  }

  if (loading) {
     return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Users"
          description="Manage your team members and their roles."
        />
        <Card>
            <CardContent className="py-8">
                <div className="text-center text-muted-foreground">Loading users...</div>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManageUsers) {
    return (
       <div className="flex flex-col gap-6">
        <PageHeader
          title="Access Denied"
          description="You do not have permission to view this page."
        />
      </div>
    )
  }


  return (
    <>
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Manage your team members and their roles."
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Invite New User</CardTitle>
          <CardDescription>
            Create an account for a new team member and assign them a role.
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
                       <SelectItem key={role} value={role} className="capitalize" disabled={role === 'owner'}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isInviting}>
                {isInviting ? <Loader2 className="animate-spin" /> : 'Create User'}
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
                      <Badge variant={user.role === 'admin' || user.role === 'owner' ? 'default' : 'secondary'} className="capitalize">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" disabled={user.id === profile?.id}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                           <DropdownMenuItem onSelect={() => setUserToDelete(user)} className="text-destructive">
                                Remove User
                            </DropdownMenuItem>
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

    <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user <span className="font-semibold">{userToDelete?.full_name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="animate-spin" /> : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
