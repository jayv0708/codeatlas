import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  hint: string;
  color: string;
}

export function StatCard({ label, value, icon: Icon, hint, color }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden group transition-colors"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-30"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: '#8b949e' }}>
            {label}
          </p>
          <h3 className="text-3xl font-bold text-white">{value.toLocaleString()}</h3>
          <p className="text-xs mt-2" style={{ color: '#8b949e' }}>{hint}</p>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}
