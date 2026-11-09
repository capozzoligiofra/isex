function readEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

/** True when the Supabase URL and public key are set. */
export function isSupabaseConfigured(): boolean {
  return readEnv() !== null;
}

export function supabaseEnv() {
  const env = readEnv();
  if (!env) {
    throw new Error(
      "Supabase non configurato: imposta NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (vedi .env.example).",
    );
  }
  return env;
}
