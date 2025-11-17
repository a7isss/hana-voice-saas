import { createClient } from '@supabase/supabase-js';

// Use fallback values for development if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kycsfssbmeiwlxkaeyum.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5Y3Nmc3NibWVpd2x4a2FleXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNzE3MDksImV4cCI6MjA3ODk0NzcwOX0.LuhtKOxxb7A1EIV__T8ydHvWCdh4FF31V_pDS3CS3No';

// Create a Supabase client for client-side and server-side use
export const createSupabaseClient = () => {
  return createClient(
    supabaseUrl,
    supabaseAnonKey
  );
};

// Export a default supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
