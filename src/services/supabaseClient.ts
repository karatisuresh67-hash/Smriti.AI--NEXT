import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that both required environment variables are present
if (!supabaseUrl) {
  throw new Error('Missing Supabase environment variable: VITE_SUPABASE_URL is required.');
}

if (!supabasePublishableKey) {
  throw new Error('Missing Supabase environment variable: VITE_SUPABASE_PUBLISHABLE_KEY is required.');
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes('your-project-id') &&
  supabasePublishableKey &&
  !supabasePublishableKey.includes('your_supabase_anon')
);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;

