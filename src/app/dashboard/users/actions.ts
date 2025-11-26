
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

function generatePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
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
  
  // Create user with Supabase Auth
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: email,
    password: randomPassword,
    email_confirm: false, // Changed to false so we can send custom email
    user_metadata: {
      role: role,
      full_name: email.split('@')[0],
      temporary_password: randomPassword, // Store for email template
    }
  });

  if (createError) {
    console.error('Error creating user:', createError);
    if (createError.message.includes('unique constraint') || createError.message.includes('already registered')) {
        return { error: 'A user with this email already exists.' };
    }
    return { error: `Create User Error: ${createError.message}` };
  }

  // Send credentials email using Supabase's invite user with redirect
  // This will use the custom email template we set up in Supabase
  try {
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        role: role,
        password: randomPassword,
        full_name: email.split('@')[0],
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    });

    if (inviteError) {
      console.error('Error sending invite email:', inviteError);
      // User is still created, just log the error
    }
  } catch (emailError) {
    console.error('Error sending email:', emailError);
    // Continue anyway - user was created successfully
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
