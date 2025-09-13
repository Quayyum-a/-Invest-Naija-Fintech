import { createClient } from "@supabase/supabase-js";

// Use environment variables set via DevServerControl; do not hardcode secrets
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase not configured. Set SUPABASE_URL and SUPABASE_KEY to enable Supabase features.");
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })
  : (null as any);

export const isSupabaseEnabled = !!(supabaseUrl && supabaseKey);
