'use client';

import { PageHeader } from '../../components/page-header';
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
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
        toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match.' });
        return;
    }
    if (newPassword.length < 6) {
        toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 6 characters long.' });
        return;
    }

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
        toast({ title: 'Success', description: 'Password updated successfully.' });
        setNewPassword('');
        setConfirmPassword('');
        router.push('/dashboard/settings');
    }
    setIsUpdatingPassword(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reset Password"
        description="Create a new secure password for your account."
      >
        <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4"/>
            Back to Settings
        </Button>
      </PageHeader>
       <Card className="max-w-2xl">
          <form onSubmit={handlePasswordUpdate}>
            <CardHeader>
              <CardTitle className="font-headline">Enter New Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isUpdatingPassword} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isUpdatingPassword} />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isUpdatingPassword}>
                 {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Set New Password
              </Button>
            </CardFooter>
          </form>
        </Card>
    </div>
  );
}
