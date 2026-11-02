import React from 'react';
import clsx from 'clsx';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'purple'
  | 'match'
  | 'drift'
  | 'conflict';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className,
  dot = false,
}) => {
  const styles: Record<BadgeVariant, { bg: string; text: string; dotColor: string }> = {
    success: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', dotColor: 'bg-emerald-400' },
    warning: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', dotColor: 'bg-amber-400' },
    danger: { bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400', dotColor: 'bg-rose-400' },
    info: { bg: 'bg-sky-500/10 border-sky-500/30', text: 'text-sky-400', dotColor: 'bg-sky-400' },
    neutral: { bg: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-400', dotColor: 'bg-slate-400' },
    purple: { bg: 'bg-indigo-500/10 border-indigo-500/30', text: 'text-indigo-400', dotColor: 'bg-indigo-400' },
    match: { bg: 'bg-emerald-500/15 border-emerald-500/40', text: 'text-emerald-300 font-semibold', dotColor: 'bg-emerald-400' },
    drift: { bg: 'bg-amber-500/15 border-amber-500/40', text: 'text-amber-300 font-semibold', dotColor: 'bg-amber-400 animate-pulse' },
    conflict: { bg: 'bg-rose-500/20 border-rose-500/50', text: 'text-rose-300 font-bold', dotColor: 'bg-rose-500 animate-ping' },
  };

  const current = styles[variant];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        current.bg,
        current.text,
        className
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', current.dotColor)} />}
      {children}
    </span>
  );
};
