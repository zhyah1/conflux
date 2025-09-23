'use server';

import { createClient } from '@supabase/supabase-js';

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

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role: role, full_name: 'Invited User' },
  });

  if (error) {
    console.error('Error inviting user:', error);
    return { error: error.message };
  }

  return { data };
}
