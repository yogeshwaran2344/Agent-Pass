import React from 'react';
import { GitFork, ArrowDown, Bot, Shield, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

export const DelegationPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <GitFork className="w-4 h-4" />
          <span>Multi-Agent RBAC Hierarchy</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Delegation Chain Management</h2>
        <p className="text-xs text-slate-400">
          Track inherited permissions and verify that delegated child agents cannot exceed their parent agent's authority.
        </p>
      </div>

      <Card title="Live Agent Delegation Tree" subtitle="Root Agent ──> Procurement Sub-Agent ──> Checkout Worker">
        <div className="py-6 flex flex-col items-center space-y-4 max-w-xl mx-auto">
          {/* Level 0: Human Master */}
          <div className="w-full p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                H
              </div>
              <div>
                <div className="text-sm font-bold text-white">Human Master User</div>
                <div className="text-xs text-slate-400 font-mono">Master Intent: $1,000.00 College Laptop</div>
              </div>
            </div>
            <Badge variant="purple">Root Authority</Badge>
          </div>

          <ArrowDown className="w-5 h-5 text-indigo-400 animate-bounce" />

          {/* Level 1: Parent Agent */}
          <div className="w-full p-4 rounded-xl border border-surface-border bg-surface-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center text-indigo-400">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">ProcurementBot-Alpha (Parent)</div>
                <div className="text-xs text-slate-400 font-mono">Max Daily: $500.00 · Max Tx: $100.00</div>
              </div>
            </div>
            <Badge variant="success">Depth 1</Badge>
          </div>

          <ArrowDown className="w-5 h-5 text-slate-500" />

          {/* Level 2: Delegated Child Agent */}
          <div className="w-full p-4 rounded-xl border border-surface-border bg-surface-card/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center text-sky-400">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">PriceComparisonWorker (Child)</div>
                <div className="text-xs text-slate-400 font-mono">Delegated Ceiling: $50.00 (Strict Subset)</div>
              </div>
            </div>
            <Badge variant="info">Depth 2</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
