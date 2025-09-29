'use server';

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// This server action now uses the service_role key to create a special admin client.
// This is the correct and secure way to perform admin-level operations.
export async function inviteUser(email: string, role: string) {
  // Note: We are not using the helper here, but creating a new client
  // with the service role key to grant admin privileges.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Generate a secure random password
  const temporaryPassword = randomBytes(16).toString('hex');

  // Create the user directly with the temporary password
  const { data: createUserData, error: createUserError } = await supabase.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true, // Auto-confirm the email
    user_metadata: { role: role, full_name: 'Invited User' },
  });

  if (createUserError) {
    console.error('Error creating user:', createUserError);
    return { error: createUserError.message };
  }
  
  // Immediately send a password reset email so the user can set their own password
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

  if (resetError) {
    console.error('Error sending password reset email:', resetError);
    // Even if this fails, the user is created. We should probably inform the admin.
    return { error: `User created, but failed to send password reset email: ${resetError.message}` };
  }


  return { data: createUserData };
}