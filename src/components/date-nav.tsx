import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LinkPending } from "./link-pending";
import { buttonClass, cx } from "./ui";

export function DateNav({
  label,
  prevHref,
  nextHref,
  todayHref,
}: {
  label: string;
  prevHref: string;
  nextHref: string;
  todayHref?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Link href={prevHref} prefetch={false} className={cx(buttonClass.secondary, "px-2.5")} aria-label="Precedente">
        <LinkPending>
          <ChevronLeft className="h-5 w-5" />
        </LinkPending>
      </Link>
      <div className="flex-1 text-center text-sm font-semibold">{label}</div>
      {todayHref && (
        <Link href={todayHref} prefetch={false} className={cx(buttonClass.ghost, "text-xs")}>
          Oggi
        </Link>
      )}
      <Link href={nextHref} prefetch={false} className={cx(buttonClass.secondary, "px-2.5")} aria-label="Successivo">
        <LinkPending>
          <ChevronRight className="h-5 w-5" />
        </LinkPending>
      </Link>
    </div>
  );
}
