import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/notes/types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export { isSupabaseConfigured } from "@/lib/supabase/env";

let anon: SupabaseClient<Database> | null | undefined;

export function createClient(): SupabaseClient<Database> | null {
  if (anon !== undefined) return anon;
  const env = getSupabasePublicEnv();
  if (!env) {
    anon = null;
    return null;
  }
  anon = createSupabaseClient<Database>(env.url, env.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });
  return anon;
}
