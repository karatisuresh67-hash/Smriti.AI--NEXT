import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  count: number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'violet' | 'blue' | 'rose' | 'emerald';
  onClick?: () => void;
}

export function MetricCard({ title, count, subtitle, icon: Icon, color = 'violet', onClick }: MetricCardProps) {
  const colorThemes = {
    violet: 'from-violet-500/10 to-indigo-500/10 text-violet-600 border-violet-100',
    blue: 'from-sky-500/10 to-blue-500/10 text-sky-600 border-sky-100',
    rose: 'from-rose-500/10 to-pink-500/10 text-rose-600 border-rose-100',
    emerald: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-100',
  };

  const theme = colorThemes[color] || colorThemes.violet;

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`p-5 rounded-2xl bg-white border border-slate-100 shadow-soft hover:shadow-soft-lg transition-all ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${theme} border`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline space-x-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          {count}
        </span>
        {subtitle && (
          <span className="text-xs text-slate-500 truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
