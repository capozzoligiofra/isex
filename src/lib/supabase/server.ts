import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/** Supabase client bound to the current request's cookies. Create one per request. */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * Client built from a snapshot of the request cookies, for work that runs
 * after the response (`after()`), where `cookies()` can no longer be called.
 * It can't write cookies; the proxy has already refreshed the session.
 */
export function createClientFromSnapshot(snapshot: { name: string; value: string }[]) {
  const { url, key } = supabaseEnv();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return snapshot;
      },
      setAll() {},
    },
  });
}
