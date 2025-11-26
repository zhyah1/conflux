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
import { MoreHorizontal, Loader2, Mail, CheckCircle2, XCircle, Copy } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type User = {
  id: string;
  full_name: string;
  role: string;
  email: string;
};

const roles = ['admin', 'pmc', 'contractor', 'consultant', 'subcontractor', 'client'];

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
  const [credentialsDialog, setCredentialsDialog] = useState<{
    open: boolean;
    email: string;
    password: string;
    emailSent: boolean;
  }>({
    open: false,
    email: '',
    password: '',
    emailSent: false,
  });

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
    if (profile) {
      if (!canManageUsers) {
        router.push('/dashboard');
      } else {
        fetchUsers();
      }
    }
  }, [profile]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
      duration: 2000,
    });
  };

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
      toast({ 
        variant: 'destructive', 
        title: 'Error Creating User', 
        description: result.error 
      });
    } else {
      // Show credentials dialog instead of toast
      setCredentialsDialog({
        open: true,
        email: result.data.user.email,
        password: result.data.password,
        emailSent: result.data.emailSent,
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
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: `Failed to remove user: ${result.error}` 
      });
    } else {
      toast({ 
        title: 'Success', 
        description: `User ${userToDelete.full_name} has been removed.` 
      });
      setUserToDelete(null);
      await fetchUsers();
    }
    setIsDeleting(false);
  };

  if (!profile && !loading) {
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
    );
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
              Create a new user account. Credentials will be sent via email automatically.
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
                      <SelectItem 
                        key={role} 
                        value={role} 
                        className="capitalize" 
                        disabled={role === 'owner'}
                      >
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isInviting}>
                {isInviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Create User
                  </>
                )}
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
                        <div className="font-medium">
                          {user.full_name || 'Invited User'}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            user.role === 'admin' || user.role === 'owner' 
                              ? 'default' 
                              : 'secondary'
                          } 
                          className="capitalize"
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              disabled={user.id === profile?.id}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem 
                              onSelect={() => setUserToDelete(user)} 
                              className="text-destructive"
                            >
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

      {/* Credentials Dialog */}
      <Dialog 
        open={credentialsDialog.open} 
        onOpenChange={(open) => setCredentialsDialog({ ...credentialsDialog, open })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {credentialsDialog.emailSent ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  User Created Successfully
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-yellow-500" />
                  User Created (Email Failed)
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {credentialsDialog.emailSent ? (
                <>
                  An email with login credentials has been sent to{' '}
                  <strong>{credentialsDialog.email}</strong>. 
                  Below is a backup copy of the credentials.
                </>
              ) : (
                <>
                  The user was created but the email failed to send. 
                  Please share these credentials manually with the user.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={credentialsDialog.email} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(credentialsDialog.email, 'Email')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Temporary Password</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={credentialsDialog.password} 
                  readOnly 
                  className="font-mono text-sm font-semibold"
                  type="text"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyToClipboard(credentialsDialog.password, 'Password')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Important:</strong> Save these credentials now. 
                For security reasons, they won't be shown again.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={() => setCredentialsDialog({ ...credentialsDialog, open: false })}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!userToDelete} 
        onOpenChange={() => setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user{' '}
              <span className="font-semibold">{userToDelete?.full_name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}