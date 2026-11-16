export function supabaseEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Local email/password auth is for development and automated tests only.
 * In production it must be switched on explicitly (KENTE_ALLOW_LOCAL_AUTH=1),
 * which the Playwright suite does against its own test database.
 */
export function assertLocalAuthAllowed() {
  if (process.env.NODE_ENV === "production" && process.env.KENTE_ALLOW_LOCAL_AUTH !== "1") {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}
