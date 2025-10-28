import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_KEY environment variables."
    );
  }

  cachedClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });

  return cachedClient;
}
