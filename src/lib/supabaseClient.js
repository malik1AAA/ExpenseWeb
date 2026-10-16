import { createClient } from '@supabase/supabase-js';

// Read environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate that environment variables are set
if (!supabaseUrl) {
  console.error(
    'Missing VITE_SUPABASE_URL environment variable. ' +
    'Please create a .env.local file with your Supabase URL.'
  );
}

if (!supabaseAnonKey) {
  console.error(
    'Missing VITE_SUPABASE_PUBLISHABLE_KEY environment variable. ' +
    'Please create a .env.local file with your Supabase publishable key.'
  );
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Export helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};
