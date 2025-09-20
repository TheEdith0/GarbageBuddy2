import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL'; // Paste your URL here
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Paste your Anon Key here

export const supabase = createClient(supabaseUrl, supabaseAnonKey);