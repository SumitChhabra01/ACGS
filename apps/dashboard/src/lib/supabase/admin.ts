import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for trusted server-side writes (API route handlers only).
// Bypasses RLS, so it must NEVER be imported into client components.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
