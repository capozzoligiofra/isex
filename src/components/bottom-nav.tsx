"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Sun, UserRound } from "lucide-react";
import { LinkPending } from "./link-pending";
import { cx } from "./ui";

const ITEMS = [
  { href: "/oggi", label: "Oggi", icon: Sun },
  { href: "/allenamenti", label: "Allenamenti", icon: CalendarDays },
  { href: "/profilo", label: "Profilo", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex max-w-xl">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            pathname.startsWith(`${href}/`) ||
            (href === "/oggi" && pathname.startsWith("/diario"));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition",
                  active ? "text-primary" : "text-muted hover:text-text",
                )}
              >
                <LinkPending>
                  <Icon className="h-5 w-5" aria-hidden />
                </LinkPending>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
