import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/notes/types";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export { isSupabaseConfigured } from "@/lib/supabase/env";

export function createClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  return createBrowserClient<Database>(env.url, env.key);
}
