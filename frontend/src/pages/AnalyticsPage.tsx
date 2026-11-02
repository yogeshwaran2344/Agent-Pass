import React from 'react';
import { LineChart, BarChart3, TrendingUp, ShieldCheck } from 'lucide-react';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <LineChart className="w-4 h-4" />
          <span>Intelligence Reports</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Spending & Risk Analytics</h2>
        <p className="text-xs text-slate-400">
          Monitor velocity trends, intent mismatch rates, and autonomous buyer efficiency.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Intent Match Rate"
          value="94.2%"
          subtitle="Proposals strictly aligned with user prompt"
          icon={ShieldCheck}
          accentColor="emerald"
        />
        <StatCard
          title="Average Approval Latency"
          value="3.2 min"
          subtitle="Human-in-the-loop turnaround"
          icon={TrendingUp}
          accentColor="indigo"
        />
        <StatCard
          title="Prevented Overdrafts"
          value="$3,120.00"
          subtitle="Blocked by 2-phase commitment reservations"
          icon={BarChart3}
          accentColor="amber"
        />
      </div>

      <Card title="Autonomous Spending Velocity" subtitle="Settled transactions vs reserved commitments">
        <div className="h-64 flex items-center justify-center text-xs text-slate-500 font-mono border border-dashed border-surface-border rounded-xl">
          [Interactive Chart: Weekly Autonomous Spend & Intent Match Frequency]
        </div>
      </Card>
    </div>
  );
};
