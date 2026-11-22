import { createClient } from '@supabase/supabase-js';

// Publishable keys are designed for browser clients. RLS policies in the
// Supabase migration restrict admin changes to the allow-listed user IDs.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
  || 'https://htwztjbhzpmpiiujkltx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  || 'sb_publishable_SJJEyafGP2rsO2CVIuEBrA_TFep1zYg';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
