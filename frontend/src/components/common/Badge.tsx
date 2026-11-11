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
    success: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dotColor: 'bg-emerald-600' },
    warning: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dotColor: 'bg-amber-600' },
    danger: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dotColor: 'bg-red-600' },
    info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dotColor: 'bg-blue-600' },
    neutral: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', dotColor: 'bg-slate-500' },
    purple: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-800', dotColor: 'bg-slate-700' },
    match: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800 font-semibold', dotColor: 'bg-emerald-600' },
    drift: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800 font-semibold', dotColor: 'bg-amber-600' },
    conflict: { bg: 'bg-red-50 border-red-200', text: 'text-red-800 font-semibold', dotColor: 'bg-red-600' },
  };

  const current = styles[variant];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border',
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
