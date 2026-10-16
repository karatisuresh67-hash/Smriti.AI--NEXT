import React from 'react';
import type { ReminderPriority, ReminderStatus } from '../../types';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'violet';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string; border: string }> = {
  success: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  error: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    border: 'border-rose-200',
  },
  neutral: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    border: 'border-slate-200',
  },
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    dot: 'bg-violet-500',
    border: 'border-violet-200',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  dot = false,
}) => {
  const styles = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles.bg} ${styles.text} ${styles.border} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${styles.dot} animate-pulse`} aria-hidden="true" />}
      {children}
    </span>
  );
};

export function CategoryBadge({ category }: { category?: string }) {
  const styles: Record<string, string> = {
    Birthday: 'bg-rose-50 text-rose-700 border-rose-200',
    People: 'bg-violet-50 text-violet-700 border-violet-200',
    'Personal Goal': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Important Event': 'bg-amber-50 text-amber-700 border-amber-200',
    Preference: 'bg-sky-50 text-sky-700 border-sky-200',
    Academic: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Project: 'bg-purple-50 text-purple-700 border-purple-200',
    Personal: 'bg-teal-50 text-teal-700 border-teal-200',
    Other: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const currentStyle = (category && styles[category]) || styles.Other;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle}`}>
      {category || 'General'}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: ReminderPriority | string }) {
  const styles: Record<string, string> = {
    High: 'bg-red-50 text-red-700 border-red-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const currentStyle = styles[priority] || styles.Medium;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${currentStyle}`}>
      {priority} Priority
    </span>
  );
}

export function StatusBadge({ status }: { status: ReminderStatus | string }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
        Completed
      </span>
    );
  }
  if (status === 'overdue') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 animate-pulse">
        Overdue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
      Upcoming
    </span>
  );
}
