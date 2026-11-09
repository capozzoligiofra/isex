import Link from "next/link";
import { Logo } from "@/components/logo";
import { SetupNotice } from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-10">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        {isSupabaseConfigured() ? children : <SetupNotice />}
      </div>
    </div>
  );
}
