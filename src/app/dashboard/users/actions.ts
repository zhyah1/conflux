

'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Function to generate a random password
function generatePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  // The 'crypto' module is not available in this environment, so we use a simpler method.
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export async function inviteUser(email: string, role: string) {
  const supabase = createServerActionClient({ cookies }, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated', password: null };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile) return { error: 'Profile not found', password: null };

  if (!['admin', 'owner'].includes(profile.role)) {
    return { error: 'You do not have permission to invite users.', password: null };
  }
  
  const randomPassword = generatePassword();

  const { data: newUserData, error } = await supabase.auth.admin.createUser({
    email,
    password: randomPassword,
    email_confirm: true, // We assume the email is valid and bypass confirmation email
    user_metadata: {
        role: role,
        full_name: email.split('@')[0],
    }
  });

  if (error) {
    console.error('Error creating user:', error);
    if (error.message.includes('unique constraint') || error.message.includes('already registered')) {
        return { error: 'A user with this email already exists.', password: null };
    }
    return { error: `Create User Error: ${error.message}`, password: null };
  }

  // The database trigger on auth.users should handle creating the public.users record.
  // No manual insertion is needed.

  revalidatePath('/dashboard/users');
  
  // Return the generated password so it can be displayed in the UI.
  return { data: newUserData, password: randomPassword, error: null };
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
