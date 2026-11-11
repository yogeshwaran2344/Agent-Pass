import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  headerBorder?: boolean;
  accent?: 'none' | 'blue' | 'emerald' | 'amber' | 'red' | 'teal';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  action,
  headerBorder = true,
  accent = 'none',
}) => {
  const accentStyles = {
    none: '',
    blue: 'border-t-2 border-t-blue-600',
    emerald: 'border-t-2 border-t-emerald-600',
    amber: 'border-t-2 border-t-amber-500',
    red: 'border-t-2 border-t-red-600',
    teal: 'border-t-2 border-t-teal-600',
  };

  return (
    <div
      className={clsx(
        'rounded-lg border border-slate-200 bg-white shadow-card overflow-hidden',
        accentStyles[accent],
        className
      )}
    >
      {(title || action) && (
        <div
          className={clsx(
            'px-5 py-3.5 flex items-center justify-between gap-4 bg-[#F8FAFE]',
            headerBorder && 'border-b border-slate-200/80'
          )}
        >
          <div>
            {title && <h3 className="text-sm font-semibold text-[#0F1E36] tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
