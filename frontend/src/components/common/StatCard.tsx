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
    indigo: {
      icon: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      topBorder: 'border-t-emerald-700',
    },
    emerald: {
      icon: 'bg-teal-50 text-teal-700 border-teal-200',
      topBorder: 'border-t-teal-600',
    },
    amber: {
      icon: 'bg-amber-50 text-amber-700 border-amber-200',
      topBorder: 'border-t-amber-600',
    },
    rose: {
      icon: 'bg-red-50 text-red-700 border-red-200',
      topBorder: 'border-t-red-600',
    },
    sky: {
      icon: 'bg-orange-50 text-orange-700 border-orange-200',
      topBorder: 'border-t-orange-600',
    },
  };

  const theme = accents[accentColor];

  return (
    <div
      className={clsx(
        'p-5 rounded-lg border border-[#E5E2D9] border-t-2 bg-white shadow-card',
        theme.topBorder,
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-stone-500">{title}</span>
        <div className={clsx('p-2 rounded-md border', theme.icon)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-2xl font-semibold text-stone-900 tracking-tight tabular-nums">{value}</div>
          {subtitle && <p className="text-xs text-stone-500 mt-1">{subtitle}</p>}
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
