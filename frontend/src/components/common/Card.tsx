import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  headerBorder?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  action,
  headerBorder = true,
}) => {
  return (
    <div
      className={clsx(
        'rounded-lg border border-slate-200 bg-white shadow-card',
        className
      )}
    >
      {(title || action) && (
        <div
          className={clsx(
            'px-5 py-4 flex items-center justify-between gap-4',
            headerBorder && 'border-b border-slate-100'
          )}
        >
          <div>
            {title && <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
