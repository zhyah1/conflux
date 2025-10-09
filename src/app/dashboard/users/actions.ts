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

  if (!['admin'].includes(profile.role)) {
    return { error: 'You do not have permission to invite users.' };
  }
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { 
      role: role,
      full_name: email.split('@')[0]
    },
  });

  if (authError) {
    console.error('Error creating user in Auth:', authError);
    return { error: `Auth Error: ${authError.message}` };
  }

  const userId = authData.user.id;

  const { error: profileError } = await supabase.from('users').insert({
    id: userId,
    email: email,
    role: role,
    full_name: email.split('@')[0],
  });

  if (profileError) {
      console.error('Error inserting user profile (might be a duplicate, which is okay):', profileError);
      
       const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
       if (resetError) {
           console.error('Error sending password reset email:', resetError);
           return { error: `User created, but failed to send password reset email: ${resetError.message}` };
       }
  }


  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

  if (resetError) {
    console.error('Error sending password reset email:', resetError);
    return { error: `User created, but failed to send password reset email: ${resetError.message}` };
  }

  revalidatePath('/dashboard/users');
  return { data: authData };
}
