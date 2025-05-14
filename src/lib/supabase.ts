import { createClient } from '@supabase/supabase-js';

// Hardcoded values for production (temporary fix)
const supabaseUrl = 'https://oovwvznxynyzqwjkvoxn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnd2em54eW55enF3amt2b3huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4Nzk3MjUsImV4cCI6MjA2MTQ1NTcyNX0.wBtJm5I8-TUyTbcWsx0tG4IDIsnmzyV_afKMNCm-oVM';

// Forçar persistência em localStorage (SPA)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Note: This is a temporary fix. In production, you should use environment variables.
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
