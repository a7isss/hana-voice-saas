import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a Supabase client for client-side and server-side use
export const createSupabaseClient = () => {
  return createClient(
    supabaseUrl,
    supabaseAnonKey
  );
};

// Export a default supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
