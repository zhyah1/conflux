'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function inviteUser(email: string, role: string) {
  // We need to create a server client to securely use admin functions
  const supabase = createServerActionClient({ cookies });

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role: role },
  });

  if (error) {
    return { error: error.message };
  }

  return { data };
}
