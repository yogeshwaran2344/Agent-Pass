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
        'rounded-xl border border-surface-border bg-surface-card/90 backdrop-blur-md transition-all duration-200',
        className
      )}
    >
      {(title || action) && (
        <div
          className={clsx(
            'px-5 py-4 flex items-center justify-between',
            headerBorder && 'border-b border-surface-border/60'
          )}
        >
          <div>
            {title && <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
