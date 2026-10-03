import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublicConfig } from "./config";
export { configuredSupabase } from "./config";

export async function supabaseServer() {
  const store = await cookies();
  const { url, key } = supabasePublicConfig();
  return createServerClient(url, key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          /* Server Components cannot write cookies; proxy refreshes the session. */
        }
      },
    },
  });
}
