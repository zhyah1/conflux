

'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function inviteUser(email: string, role: string) {
  const supabase = createServerActionClient({ cookies }, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile) return { error: 'Profile not found' };

  if (!['admin', 'owner'].includes(profile.role)) {
    return { error: 'You do not have permission to invite users.' };
  }

  // Invite the user using a magic link. This is more secure than sending passwords.
  const { data: inviteData, error } = await supabase.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        role: role,
        full_name: email.split('@')[0],
      },
      // This will redirect the user to your app after they click the magic link
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`, 
    }
  );

  if (error) {
    console.error('Error inviting user:', error);
    if (error.message.includes('unique constraint') || error.message.includes('already registered')) {
        return { error: 'A user with this email already exists.' };
    }
    return { error: `Invite User Error: ${error.message}` };
  }

  // The database trigger on auth.users will handle creating the public.users record.
  
  revalidatePath('/dashboard/users');
  
  return { data: inviteData, error: null };
}

export async function deleteUser(userId: string) {
  const supabase = createServerActionClient({ cookies }, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) return { error: 'Not authenticated' };

  const { data: adminProfile } = await supabase.from('users').select('role').eq('id', adminUser.id).single();
  if (!adminProfile) return { error: 'Admin profile not found' };

  if (!['admin', 'owner'].includes(adminProfile.role)) {
    return { error: 'You do not have permission to delete users.' };
  }

  if (adminUser.id === userId) {
    return { error: "You cannot delete your own account." };
  }

  // The 'public.users' table has a foreign key to 'auth.users', so we must delete from auth first.
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) {
    console.error('Error deleting user from Auth:', authError);
    // If this fails, we don't proceed to delete the profile record to avoid orphans.
    return { error: `Auth Error: ${authError.message}.` };
  }
  
  // The 'public.users' record should be deleted automatically by a database trigger.
  
  revalidatePath('/dashboard/users');
  return { success: true };
}