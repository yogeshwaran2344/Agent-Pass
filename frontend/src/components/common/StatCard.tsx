import React from 'react';
import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'indigo',
  className,
}) => {
  const accents = {
    indigo: 'bg-slate-100 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-red-50 text-red-700 border-red-200',
    sky: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div
      className={clsx(
        'p-5 rounded-lg border border-slate-200 bg-white shadow-card',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500">{title}</span>
        <div className={clsx('p-2 rounded-md border', accents[accentColor])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-2xl font-semibold text-slate-900 tracking-tight tabular-nums">{value}</div>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {trend && (
          <span
            className={clsx(
              'text-xs font-medium px-2 py-0.5 rounded-md',
              trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
