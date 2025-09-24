import { createClient } from '@supabase/supabase-js';

// This client is for server-side operations (e.g., in Server Actions)
// and uses the service_role key for admin-level privileges.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
