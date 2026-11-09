import "server-only";
import { combineChunks, stringFromBase64URL } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/**
 * Session handling for rendering. Server Components can't write cookies, so
 * they must never refresh the session: a refresh rotates the refresh token
 * and, if the new one can't be stored, the user gets logged out. Pages
 * therefore verify the access token from the cookie as is (locally, with
 * the project's public signing keys) and query the database with a client
 * bound to that token. The browser keeps the session fresh
 * (see components/session-refresher.tsx); Server Actions and Route
 * Handlers, which can write cookies, use the regular SSR client.
 */

type CookieLike = { name: string; value: string };

function storageKey(url: string) {
  return `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
}

/** The access token stored by @supabase/ssr in the auth cookie (possibly chunked). */
export async function readAccessToken(cookies: CookieLike[]): Promise<string | null> {
  const values = new Map(cookies.map((c) => [c.name, c.value]));
  const raw = await combineChunks(storageKey(supabaseEnv().url), (name) => values.get(name));
  if (!raw) return null;
  try {
    const json = raw.startsWith("base64-") ? stringFromBase64URL(raw.slice(7)) : raw;
    const session = JSON.parse(json) as { access_token?: unknown };
    return typeof session.access_token === "string" ? session.access_token : null;
  } catch {
    return null;
  }
}

let verifier: SupabaseClient | null = null;

/** Verifies a token without loading or refreshing a session; null if invalid or expired. */
export async function verifyAccessToken(token: string) {
  const { url, key } = supabaseEnv();
  verifier ??= createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await verifier.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return data.claims;
}

/** Database client acting as the user behind `token`; it never touches the session. */
export function createDbClient(token: string): SupabaseClient {
  const { url, key } = supabaseEnv();
  return createSupabaseClient(url, key, { accessToken: async () => token });
}
