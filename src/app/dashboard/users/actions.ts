'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';


export async function inviteUser(email: string, role: string) {
  const supabase = createServerActionClient({ cookies }, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  });
  
  // Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true, // Auto-confirm email for simplicity in this app
    user_metadata: { 
      role: role,
      full_name: email.split('@')[0] // Default name
    },
  });

  if (authError) {
    console.error('Error creating user in Auth:', authError);
    return { error: `Auth Error: ${authError.message}` };
  }

  const userId = authData.user.id;

  // Insert the user profile into the public 'users' table
  // This step is often handled by a database trigger, but we do it manually here
  // to ensure it's created. Your trigger might be failing or non-existent.
  const { error: profileError } = await supabase.from('users').insert({
    id: userId,
    email: email,
    role: role,
    full_name: email.split('@')[0], // Default name
  });

  if (profileError) {
      // If the user already exists in the profiles table, this might fail.
      // We can choose to ignore it or handle it, but for now, we'll log it.
      console.error('Error inserting user profile (might be a duplicate, which is okay):', profileError);
      
       // Attempt to send password reset even if profile insert fails
       const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
       if (resetError) {
           console.error('Error sending password reset email:', resetError);
           return { error: `User created, but failed to send password reset email: ${resetError.message}` };
       }
  }


  // Send a password reset email so the user can set their own password
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

  if (resetError) {
    console.error('Error sending password reset email:', resetError);
    // Even if this fails, the user is created. We should probably inform the admin.
    return { error: `User created, but failed to send password reset email: ${resetError.message}` };
  }

  revalidatePath('/dashboard/users');
  return { data: authData };
}
