import { createClient } from '@supabase/supabase-js'

// Use Vite's specific syntax to access environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if the variables are loaded correctly
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Check your .env file or Vercel environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);