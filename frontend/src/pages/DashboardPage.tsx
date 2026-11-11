import React, { useState, useEffect } from 'react';
import {
  Bot,
  CheckCircle2,
  Lock,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  ShieldAlert,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';
import { dashboardService, DashboardStats } from '../services/dashboardService';
import { intentService } from '../services/intentService';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Live Intent simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const runIntentSimulation = async () => {
    setIsSimulating(true);
    setSimulationError(null);
    try {
      // 1. Create or retrieve intent
      const intent = await intentService.createIntent({
        raw_prompt: "I need a laptop for college. Prioritize battery life and portability. Don't purchase gaming laptops. Budget under $1000.",
      });

      // 2. Evaluate purchase proposal through backend Intent Engine
      const res = await intentService.evaluateIntent({
        intent_id: intent.id,
        agent_id: stats?.recent_transactions[0]?.agent_id || 'simulator_agent',
        proposed_item_name: 'Asus ROG Zephyrus 14" RTX 4070 Gaming Laptop',
        proposed_merchant: 'BestBuy',
        proposed_price: 999.0,
        proposed_item_specs: { category: 'Gaming Laptops', gpu: 'RTX 4070' },
      });

      setSimulationResult({
        prompt: intent.raw_prompt,
        proposedItem: 'Asus ROG Zephyrus 14" RTX 4070 Gaming Laptop',
        price: 999.0,
        decision: res.decision,
        isConsistent: res.is_consistent,
        score: res.consistency_score,
        violations: res.conflicting_requirements,
        reasoning: res.reasoning,
      });

      fetchDashboardStats();
    } catch (err: any) {
      setSimulationError(err.response?.data?.detail || 'Intent evaluation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs text-slate-400">Loading AGENTPASS live governance statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Banner / Global Alert Status */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-surface-card p-6 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Connected to FastAPI Backend & Database</span>
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

      {/* Primary KPI Metric Cards (Real backend data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total AI Agents"
          value={`${stats?.total_agents || 0} Registered`}
          subtitle={`${stats?.active_agents || 0} active, ${stats?.suspended_agents || 0} suspended`}
          icon={Bot}
          accentColor="indigo"
        />
        <StatCard
          title="Pending Approvals"
          value={`${stats?.pending_approvals_count || 0} Requests`}
          subtitle="Human review required"
          icon={CheckCircle2}
          accentColor="amber"
        />
        <StatCard
          title="Reserved Commitments"
          value={`$${(stats?.total_reserved_usd || 0).toFixed(2)}`}
          subtitle="2-phase lock preventing double-spend"
          icon={Lock}
          accentColor="sky"
        />
        <StatCard
          title="Settled via PayPal"
          value={`$${(stats?.total_settled_usd || 0).toFixed(2)}`}
          subtitle="Reconciled transactions"
          icon={CreditCard}
          accentColor="emerald"
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
              "I need a laptop for college. Prioritize battery life and portability. Don't purchase gaming laptops. Budget under $1000."
            </div>
          </div>

          {simulationError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{simulationError}</span>
            </div>
          )}

          {simulationResult && (
            <div className="p-5 rounded-xl border border-rose-500/40 bg-rose-950/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="conflict" dot>
                    INTENT MISMATCH DETECTED ({simulationResult.decision})
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
                    {simulationResult.violations?.[0] || 'Negative constraint violated'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface/80 border border-surface-border text-xs text-slate-300 font-mono">
                {simulationResult.reasoning}
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

      {/* Two Column Grid: Real Pending Human Approvals & Live System Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approval Widget */}
        <Card
          title="Context-Aware Human Approval"
          subtitle="Transactions requiring operator authorization"
          action={
            <Link to="/approvals" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
              View All ({stats?.pending_approvals_count || 0}) <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-3">
            {stats?.pending_approvals && stats.pending_approvals.length > 0 ? (
              stats.pending_approvals.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-amber-500/30 bg-surface-hover/60 hover:border-amber-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="warning" dot>Pending Review</Badge>
                      <span className="text-xs font-semibold text-slate-300 font-mono">{req.agent_id}</span>
                    </div>
                    <span className="text-sm font-bold text-white font-mono">${req.amount.toFixed(2)} USD</span>
                  </div>

                  <div className="text-sm font-medium text-white mb-1">
                    {req.item_description}
                  </div>

                  <div className="text-xs text-slate-400 mb-3 line-clamp-2">
                    {req.reason_for_approval}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-surface-border/60">
                    <span className="text-[11px] text-slate-500">Merchant: {req.merchant_name} · PayPal Sandbox</span>
                    <Link to="/approvals">
                      <Button size="sm" variant="paypal">Review Request</Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-surface-border rounded-xl">
                No pending approval requests. All transactions compliant.
              </div>
            )}
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
            {stats?.recent_audit_events && stats.recent_audit_events.length > 0 ? (
              stats.recent_audit_events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-surface/50 border border-surface-border/50 text-xs"
                >
                  <div className="mt-0.5">
                    <Badge variant="purple">{event.action}</Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 truncate">{event.description || event.action}</p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {event.created_at ? new Date(event.created_at).toLocaleTimeString() : 'Recent'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-surface-border rounded-xl">
                No security audit logs recorded yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
