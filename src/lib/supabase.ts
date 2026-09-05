import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://felqveyqlcmhbdzuaxaf.supabase.co';
const defaultSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbHF2ZXlxbGNtaGJkenVheGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTYxNTYsImV4cCI6MjEwNDA3MjE1Nn0.XGKLX5q-foaQJbnIKHbPYdUFmiEQuRGATdNIDHCjYsI';

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || defaultSupabaseUrl).trim();
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || defaultSupabaseAnonKey).trim();

// Validate whether a real, non-placeholder Supabase URL and key are supplied
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project') &&
    supabaseAnonKey !== 'your-anon-publishable-key'
  );
};

// Create the authoritative Supabase client
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder-instance.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);
