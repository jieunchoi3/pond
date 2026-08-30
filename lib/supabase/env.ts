export function getSupabasePublicEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "https://myvzlzdsktnudgxqdbxv.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15dnpsemRza3RudWRneHFkYnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTI1NzcsImV4cCI6MjA5ODQ4ODU3N30.xmF5P1d-0Qd_1I0qWpDlF_E8YBzEIdVi3RHWyOs2280";
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured() {
  return getSupabasePublicEnv() !== null;
}
