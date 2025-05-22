// src/lib/supabase/server.ts

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Add debug logging
// console.log('[DEBUG] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
// console.log('[DEBUG] Supabase Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

export const createClient = () => {
  // Add debug logging for the client creation
  // console.log('[DEBUG] Creating Supabase client...');
  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  // console.log('[DEBUG] Supabase client created successfully');
  return client;
}; 