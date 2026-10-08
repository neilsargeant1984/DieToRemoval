import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl = (rawUrl && !rawUrl.includes('zrgiktlhoivxmcyvvwnk'))
  ? rawUrl
  : 'https://argiktllhoivxmcyvwnk.supabase.co';

const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseAnonKey = (rawKey && !rawKey.startsWith('placeholder') && rawKey !== 'your-anon-key-here')
  ? rawKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyZ2lrdGxsaG9pdnhtY3l2d25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4ODM4NTYsImV4cCI6MjEwNjQ1OTg1Nn0.UJPuGBo17jILGzar3CfEXxTTNHRSToOb591MKW9l5b8';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'your-anon-key-here' &&
  !supabaseAnonKey.startsWith('placeholder')
);

// Fallback dummy/noop client if keys aren't set yet, avoiding crash
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
