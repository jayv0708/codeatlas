import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  actionIcon?: LucideIcon;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
  actionIcon: ActionIcon,
}: EmptyStateProps) {
  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'rgba(170,48,0,0.1)' }}
      >
        <Icon className="h-8 w-8" style={{ color: '#ffb59e' }} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm max-w-md mx-auto mb-6" style={{ color: '#8b949e' }}>
        {description}
      </p>
      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all"
        style={{
          background: '#aa3000',
          color: 'white',
          boxShadow: '0 0 20px rgba(170,48,0,0.3)',
        }}
      >
        {ActionIcon && <ActionIcon className="h-4 w-4" />}
        {actionLabel}
      </Link>
    </div>
  );
}
