"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

let client: SupabaseClient | null = null;

function browserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createBrowserClient(url, key);
  return client;
}

const SIGNED_OUT_PAGES = new Set(["/", "/login", "/registrati"]);

function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/oggi";
}

/**
 * Keeps the Supabase session fresh from the browser. The server only reads
 * the access token (it can't store a refreshed one while rendering), so:
 * - while a page is open, the browser client refreshes the token before it
 *   expires and writes the new cookies; the page then re-renders;
 * - when someone comes back after it expired, the server sends them to the
 *   login page, where the refresh token gets them straight back in.
 */
export function SessionRefresher() {
  const router = useRouter();

  useEffect(() => {
    const supabase = browserClient();
    if (!supabase) return;
    let active = true;

    // Refreshes an expired session from the refresh-token cookie, if any.
    supabase.auth.getSession().then(({ data }) => {
      if (!active || !data.session) return;
      if (SIGNED_OUT_PAGES.has(window.location.pathname)) {
        router.replace(safeNext(new URLSearchParams(window.location.search).get("next")));
      }
    });

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED") router.refresh();
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
