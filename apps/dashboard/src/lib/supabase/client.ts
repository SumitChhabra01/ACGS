"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client. Returns null when env is not yet configured so the
// UI can run in demo mode on a fresh clone.
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
