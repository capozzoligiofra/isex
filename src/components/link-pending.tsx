"use client";

import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";

/**
 * Inside a <Link>: dims and pulses its content while the navigation is in
 * flight. Links to dynamic pages don't prefetch (each prefetch would start a
 * separate cold serverless function), so this is the instant feedback.
 */
export function LinkPending({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();
  return (
    <span className={pending ? "animate-pulse opacity-60" : undefined} aria-hidden={pending || undefined}>
      {children}
    </span>
  );
}
