import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

// This client is for client-side (browser) operations
// and uses the public anonymous key.
export const supabase = createPagesBrowserClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
