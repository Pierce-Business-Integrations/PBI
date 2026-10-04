import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabasePublicConfig } from "./config";

export function supabaseAdmin() {
  const { url } = supabasePublicConfig();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Supabase server configuration is required");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, options) =>
        fetch(input, {
          ...options,
          signal: options?.signal ?? AbortSignal.timeout(20_000),
        }),
    },
  });
}
