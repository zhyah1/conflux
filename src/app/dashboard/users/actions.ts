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

// Helper function to send credentials email via Edge Function
async function sendCredentialsEmail(
  email: string, 
  password: string, 
  role: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-credentials`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          email,
          password,
          role,
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send credentials email:', errorText);
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    return { success: true };
    
  } catch (error) {
    console.error('Error calling email function:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function inviteUser(email: string, role: string) {
  const supabase = createServerActionClient({ cookies }, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  // Verify the current user has permission
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (!profile) return { error: 'Profile not found' };

  if (!['admin', 'owner'].includes(profile.role)) {
    return { error: 'You do not have permission to invite users.' };
  }
  
  // Generate a random password
  const randomPassword = generatePassword();
  
  // Create the user in Supabase Auth
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: email,
    password: randomPassword,
    email_confirm: true, // Auto-confirm so they can login immediately
    user_metadata: {
      role: role,
      full_name: email.split('@')[0],
    }
  });

  if (createError) {
    console.error('Error creating user:', createError);
    
    if (createError.message.includes('unique constraint') || 
        createError.message.includes('already registered')) {
      return { error: 'A user with this email already exists.' };
    }
    
    return { error: `Create User Error: ${createError.message}` };
  }

  // Send credentials email via Edge Function
  const emailResult = await sendCredentialsEmail(email, randomPassword, role);
  
  // Log email status but don't fail the user creation
  if (!emailResult.success) {
    console.error('Failed to send credentials email:', emailResult.error);
  }
  
  // Revalidate the users page
  revalidatePath('/dashboard/users');
  
  // Return the user data, password, and email status
  return { 
    data: { 
      user: newUser.user, 
      password: randomPassword,
      emailSent: emailResult.success
    }, 
    error: null 
  };
}

export async function deleteUser(userId: string) {
  const supabase = createServerActionClient({ cookies }, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  // Verify the current user has permission
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) return { error: 'Not authenticated' };

  const { data: adminProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', adminUser.id)
    .single();
    
  if (!adminProfile) return { error: 'Admin profile not found' };

  if (!['admin', 'owner'].includes(adminProfile.role)) {
    return { error: 'You do not have permission to delete users.' };
  }

  // Prevent self-deletion
  if (adminUser.id === userId) {
    return { error: "You cannot delete your own account." };
  }

  // Delete the user from Supabase Auth
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) {
    console.error('Error deleting user from Auth:', authError);
    return { error: `Auth Error: ${authError.message}` };
  }
  
  // Revalidate the users page
  revalidatePath('/dashboard/users');
  
  return { success: true };
}