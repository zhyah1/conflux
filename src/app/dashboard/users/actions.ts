

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
  if (!user) return { error: 'Not authenticated', password: null };

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (!profile) return { error: 'Profile not found', password: null };

  if (!['admin', 'owner'].includes(profile.role)) {
    return { error: 'You do not have permission to invite users.', password: null };
  }
  
  // Generate a random password
  const generatePassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    // Note: crypto.getRandomValues is not available in server actions in this environment.
    // Using a simpler random generation method.
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  const randomPassword = generatePassword();

  const { data: newUserData, error } = await supabase.auth.admin.createUser({
    email,
    password: randomPassword,
    email_confirm: true, // Mark email as confirmed since we are creating the user directly
    user_metadata: { 
        role: role, 
        full_name: email.split('@')[0] 
    },
  });

  if (error) {
    console.error('Error creating user:', error);
    if (error.message.includes('unique constraint')) {
        return { error: 'A user with this email already exists.', password: null };
    }
    return { error: `Create User Error: ${error.message}`, password: null };
  }

  // The user is created in auth.users, but we need to create the profile in public.users
  // This is usually handled by a database trigger, but we'll do it explicitly here to be safe.
  if (newUserData.user) {
    const { error: profileError } = await supabase.from('users').insert({
        id: newUserData.user.id,
        email: newUserData.user.email,
        full_name: newUserData.user.user_metadata.full_name,
        role: newUserData.user.user_metadata.role
    });

    if (profileError) {
        console.error("Error creating user profile:", profileError);
        // If profile creation fails, we should probably delete the auth user to avoid orphans
        await supabase.auth.admin.deleteUser(newUserData.user.id);
        return { error: `Failed to create user profile: ${profileError.message}`, password: null };
    }
  }


  revalidatePath('/dashboard/users');
  // Return the generated password so the admin can share it.
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
