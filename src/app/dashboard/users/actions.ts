
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';


export async function inviteUser(email: string, role: string) {
  // Use service_role key to perform admin actions
  const supabase = createServerActionClient({ cookies }, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Fetch the inviting user's profile to get their org_id
  const { data: profile } = await supabase.from('users').select('role, org_id').eq('id', user.id).single();
  if (!profile) return { error: 'Profile not found' };

  if (!['admin', 'owner'].includes(profile.role)) {
    return { error: 'You do not have permission to invite users.' };
  }

  // Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true, // User will receive a confirmation email
    user_metadata: { 
      role: role,
      full_name: email.split('@')[0],
      // We will set org_id in the profiles table, not here.
    },
  });

  if (authError) {
    console.error('Error creating user in Auth:', authError);
    return { error: `Auth Error: ${authError.message}` };
  }

  const userId = authData.user.id;

  // Create the user's profile, associating them with the admin's organization
  const { error: profileError } = await supabase.from('users').insert({
    id: userId,
    email: email,
    role: role,
    full_name: email.split('@')[0],
    org_id: profile.org_id, // Associate new user with the admin's org
  });

  if (profileError) {
      // If the profile already exists, we can ignore the error and proceed.
      // This can happen if a user is re-invited.
      console.warn('Error inserting user profile (might be a duplicate, which is okay):', profileError);
  }

  // Send a password reset email so the user can set their password.
  // This serves as the invitation email.
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/login`,
  });

  if (resetError) {
    console.error('Error sending password reset email:', resetError);
    return { error: `User account created, but failed to send invitation email: ${resetError.message}` };
  }

  revalidatePath('/dashboard/users');
  return { data: authData };
}

export async function deleteUser(userId: string) {
  const supabase = createServerActionClient({ cookies }, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) return { error: 'Not authenticated' };

  const { data: adminProfile } = await supabase.from('users').select('role, org_id').eq('id', adminUser.id).single();
  if (!adminProfile) return { error: 'Admin profile not found' };

  if (!['admin', 'owner'].includes(adminProfile.role)) {
    return { error: 'You do not have permission to delete users.' };
  }

  if (adminUser.id === userId) {
    return { error: "You cannot delete your own account." };
  }

  // Verify the user to be deleted is in the same organization
  const { data: userToDeleteProfile } = await supabase.from('users').select('org_id').eq('id', userId).single();
  if (!userToDeleteProfile || userToDeleteProfile.org_id !== adminProfile.org_id) {
    return { error: "You can only delete users within your own organization." };
  }

  // First delete from the public.users table (due to foreign key on auth.users)
  const { error: profileError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (profileError) {
     console.error('Error deleting user from profiles:', profileError);
     return { error: `DB Error: ${profileError.message}` };
  }

  // Then delete the user from auth.users
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) {
    console.error('Error deleting user from Auth:', authError);
    // If this fails, the user might be left in a dangling state. The profile was deleted though.
    return { error: `Auth Error: ${authError.message}. The user's profile was removed, but the auth user could not be.` };
  }
  
  revalidatePath('/dashboard/users');
  return { success: true };
}
