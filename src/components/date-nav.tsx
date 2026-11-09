import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      <Link href={prevHref} className={cx(buttonClass.secondary, "px-2.5")} aria-label="Precedente">
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <div className="flex-1 text-center text-sm font-semibold">{label}</div>
      {todayHref && (
        <Link href={todayHref} className={cx(buttonClass.ghost, "text-xs")}>
          Oggi
        </Link>
      )}
      <Link href={nextHref} className={cx(buttonClass.secondary, "px-2.5")} aria-label="Successivo">
        <ChevronRight className="h-5 w-5" />
      </Link>
    </div>
  );
}
