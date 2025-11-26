

'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// This function is not used by Supabase's crypto but is kept for reference
// on how a password could be generated if needed outside of this flow.
function generatePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  // This is a server-side polyfill for crypto.getRandomValues
  // In a Node.js environment, `crypto` is available globally.
  const crypto = require('crypto');
  const array = new Uint32Array(length);
  const randomBytes = crypto.randomBytes(length * 4);
  for (let i = 0; i < length; i++) {
    array[i] = randomBytes.readUInt32LE(i * 4);
  }
  
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
}

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
  
  const randomPassword = generatePassword();
  
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: email,
    password: randomPassword,
    email_confirm: true, // Auto-confirm user
    user_metadata: {
      role: role,
      full_name: email.split('@')[0],
    }
  });

  if (createError) {
    console.error('Error creating user:', createError);
    if (createError.message.includes('unique constraint') || createError.message.includes('already registered')) {
        return { error: 'A user with this email already exists.' };
    }
    return { error: `Create User Error: ${createError.message}` };
  }
  
  revalidatePath('/dashboard/users');
  
  // Return the user and the generated password so the UI can display it.
  return { data: { user: newUser.user, password: randomPassword }, error: null };
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

  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) {
    console.error('Error deleting user from Auth:', authError);
    return { error: `Auth Error: ${authError.message}.` };
  }
  
  revalidatePath('/dashboard/users');
  return { success: true };
}
