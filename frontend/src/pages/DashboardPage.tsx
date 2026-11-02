import React, { useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Lock,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  BrainCircuit,
  ShieldAlert,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Quick simulation trigger for the college laptop demo
  const runIntentSimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);

    // Simulate intent consistency evaluation
    setTimeout(() => {
      setSimulationResult({
        prompt: "I need a laptop for college. Prioritize battery life and portability. Don't purchase gaming laptops.",
        proposedItem: "Razer Blade 16 Gaming Laptop (RTX 4080)",
        price: 999.0,
        budgetLimit: 1000.0,
        decision: "HARD_CONFLICT",
        isConsistent: false,
        score: 0.2,
        violations: ["Negative constraint violated: 'gaming laptops' detected in item specs"],
        requiresApproval: true,
      });
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Banner / Global Alert Status */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-surface-card p-6 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autonomous Intent-Based Financial Governance</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              AGENTPASS Protection Gateway
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Continuously verifying whether your autonomous AI agents spend money for the{' '}
              <span className="text-white font-semibold underline decoration-indigo-400">reasons you authorized</span>,
              backed by deterministic velocity firewalls and PayPal Sandbox rails.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/intents">
              <Button variant="primary" leftIcon={<BrainCircuit className="w-4 h-4" />}>
                Intent Console
              </Button>
            </Link>
            <Link to="/security">
              <Button variant="danger" leftIcon={<ShieldAlert className="w-4 h-4" />}>
                Emergency Switch
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Registered AI Agents"
          value="4 Active"
          subtitle="All agents operating within limits"
          icon={Bot}
          accentColor="indigo"
          trend={{ value: "+1 this week", isPositive: true }}
        />
        <StatCard
          title="Pending Approvals"
          value="1 Request"
          subtitle="Context-aware intent mismatch"
          icon={CheckCircle2}
          accentColor="amber"
        />
        <StatCard
          title="Reserved Commitments"
          value="$899.00"
          subtitle="2-phase lock preventing double-spend"
          icon={Lock}
          accentColor="sky"
        />
        <StatCard
          title="Settled via PayPal"
          value="$1,450.00"
          subtitle="12 transactions authorized"
          icon={CreditCard}
          accentColor="emerald"
          trend={{ value: "100% policy compliance", isPositive: true }}
        />
      </div>

      {/* Featured Core Demonstration: Live Intent Consistency Engine Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            <span>Interactive Intent Engine Demonstration</span>
          </div>
        }
        subtitle="Simulate an autonomous agent proposing a purchase against your master prompt"
        action={
          <Button
            size="sm"
            onClick={runIntentSimulation}
            isLoading={isSimulating}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Run Intent Mismatch Simulation
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface/80 border border-surface-border">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              User Master Prompt Registered
            </div>
            <div className="font-mono text-sm text-indigo-200 bg-indigo-950/40 p-3 rounded-lg border border-indigo-800/40">
              "I need a laptop for college. Prioritize battery life and portability. Don't purchase gaming laptops."
            </div>
          </div>

          {simulationResult && (
            <div className="p-5 rounded-xl border border-rose-500/40 bg-rose-950/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="conflict" dot>
                    INTENT MISMATCH DETECTED
                  </Badge>
                  <span className="text-xs text-rose-300 font-medium">
                    Within Budget, but Violates User Instruction
                  </span>
                </div>
                <span className="text-sm font-bold text-white font-mono">$999.00 USD</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-surface/60 border border-surface-border">
                  <span className="text-slate-400 block mb-1">Agent Proposed Item:</span>
                  <span className="font-semibold text-white text-sm">
                    {simulationResult.proposedItem}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface/60 border border-surface-border">
                  <span className="text-slate-400 block mb-1">Root Cause of Violation:</span>
                  <span className="font-medium text-rose-400">
                    {simulationResult.violations[0]}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-rose-500/20">
                <p className="text-xs text-slate-300">
                  AGENTPASS halted automated checkout. Escalate to Context-Aware Human Approval?
                </p>
                <div className="flex items-center gap-2">
                  <Link to="/approvals">
                    <Button size="sm" variant="paypal">
                      Review in Approval Center
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Two Column Grid: Pending Human Approvals & Live System Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approval Widget */}
        <Card
          title="Context-Aware Human Approval"
          subtitle="Transactions requiring operator authorization"
          action={
            <Link to="/approvals" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-amber-500/30 bg-surface-hover/60 hover:border-amber-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="warning" dot>Pending Review</Badge>
                  <span className="text-xs font-semibold text-slate-300">ProcurementBot-Alpha</span>
                </div>
                <span className="text-sm font-bold text-white font-mono">$899.00 USD</span>
              </div>

              <div className="text-sm font-medium text-white mb-1">
                Asus ROG Zephyrus 14" Portable Gaming
              </div>

              <div className="text-xs text-slate-400 mb-3 line-clamp-2">
                Reason: Transaction satisfies budget ceiling ($1,000), but triggers negative constraint "no gaming laptops" from master prompt.
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-surface-border/60">
                <span className="text-[11px] text-slate-500">Merchant: BestBuy · PayPal Sandbox</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary">Reject</Button>
                  <Button size="sm" variant="primary">Approve</Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Live Immutable Audit & Security Activity */}
        <Card
          title="Live Security & Governance Feed"
          subtitle="Deterministic policy rule evaluations"
          action={
            <Link to="/audit" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
              Full Audit Trail <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-3">
            {[
              {
                time: 'Just now',
                action: 'INTENT_CONSISTENCY_EVALUATED',
                detail: 'Flagged gaming hardware mismatch against prompt #int_8f32',
                badge: 'drift',
              },
              {
                time: '12 min ago',
                action: 'BUDGET_RESERVATION_PLACED',
                detail: 'Held $899.00 on agent ag_8417 (Hold expires in 15m)',
                badge: 'info',
              },
              {
                time: '1 hour ago',
                action: 'PAYPAL_ORDER_CAPTURED',
                detail: 'Captured order PAYPAL-MOCK-ORDER-A7F9 for $45.00 at GitHub',
                badge: 'success',
              },
              {
                time: '3 hours ago',
                action: 'AGENT_CREDENTIAL_ISSUED',
                detail: 'Issued live API key agp_live_9f8... for ProcurementBot',
                badge: 'purple',
              },
            ].map((event, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-surface/50 border border-surface-border/50 text-xs">
                <div className="mt-0.5">
                  <Badge variant={event.badge as any}>{event.action}</Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 truncate">{event.detail}</p>
                  <span className="text-[10px] text-slate-500">{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
