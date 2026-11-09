import { APP_NAME } from "@/lib/app";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <rect width="512" height="512" rx="112" fill="#13784a" />
      <path d="M335.5 383.2A150 150 0 0 1 163.7 374.2" stroke="#6aa5f2" strokeWidth="56" strokeLinecap="round" fill="none" />
      <path d="M123.6 326.4A150 150 0 0 1 137.8 163.7" stroke="#f0b543" strokeWidth="56" strokeLinecap="round" fill="none" />
      <path d="M185.6 123.6A150 150 0 0 1 335.5 128.8" stroke="#f27a64" strokeWidth="56" strokeLinecap="round" fill="none" />
      <circle cx="406" cy="256" r="30" fill="#c6ef4e" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
      <LogoMark />
      {APP_NAME}
    </span>
  );
}
