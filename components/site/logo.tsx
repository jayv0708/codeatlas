import { useId } from "react";

import { cn } from "@/lib/utils";

/** CodeAtlas mark: a code path branching through a graph of nodes. */
export function LogoMark({ className }: { className?: string }) {
  const id = useId();
  const gradientId = `logo-gradient-${id}`;
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn("h-8 w-8", className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <path
        d="M9 12h7.5a3 3 0 0 1 0 6H14"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m20 14 2.2 2.2L20 18.4"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="12" r="2" fill="white" />
      <circle cx="8" cy="20" r="2" fill="white" />
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWordmark ? (
        <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          CodeAtlas
        </span>
      ) : null}
    </span>
  );
}
