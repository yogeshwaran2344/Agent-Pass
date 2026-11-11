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
  Loader2,
  Play,
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
      const intent = await intentService.createIntent({
        raw_prompt:
          "I need a laptop for college. Prioritize battery life and portability. Don't purchase gaming laptops. Budget under $1000.",
      });

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
        <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
        <p className="text-xs text-stone-500">Loading account metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Colored Overview Banner */}
      <div className="rounded-lg bg-[#0D2D24] text-white p-6 border border-[#1A473B] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-medium mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Policy &amp; Intent Firewall Active</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Governance Overview</h1>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
            Monitor registered autonomous agents, reserved 2-phase commitments, and live PayPal Sandbox settlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/intents">
            <Button
              variant="outline"
              size="sm"
              className="border-emerald-400/40 text-white hover:bg-white/10 hover:text-white"
              leftIcon={<BrainCircuit className="w-3.5 h-3.5" />}
            >
              Intent Rules
            </Button>
          </Link>
          <Link to="/security">
            <Button variant="danger" size="sm" leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}>
              Kill Switch
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Agents"
          value={stats?.total_agents || 0}
          subtitle={`${stats?.active_agents || 0} active · ${stats?.suspended_agents || 0} suspended`}
          icon={Bot}
          accentColor="indigo"
        />
        <StatCard
          title="Pending Approvals"
          value={stats?.pending_approvals_count || 0}
          subtitle="Awaiting operator decision"
          icon={CheckCircle2}
          accentColor="amber"
        />
        <StatCard
          title="Reserved Commitments"
          value={`$${(stats?.total_reserved_usd || 0).toFixed(2)}`}
          subtitle="Active 2-phase holds"
          icon={Lock}
          accentColor="sky"
        />
        <StatCard
          title="Settled via PayPal"
          value={`$${(stats?.total_settled_usd || 0).toFixed(2)}`}
          subtitle="Captured sandbox volume"
          icon={CreditCard}
          accentColor="emerald"
        />
      </div>

      {/* Live Intent Verification Test */}
      <Card
        accent="blue"
        title="Intent Conflict Check"
        subtitle="Test whether a proposed checkout conflicts with the user's saved prompt"
        action={
          <Button
            size="sm"
            onClick={runIntentSimulation}
            isLoading={isSimulating}
            leftIcon={<Play className="w-3.5 h-3.5" />}
          >
            Run Check
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-md bg-emerald-50/70 border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-900 mb-1">
              Master Instruction
            </div>
            <div className="font-mono text-xs text-stone-800">
              &quot;I need a laptop for college. Prioritize battery life and portability. Don&apos;t purchase gaming laptops. Budget under $1000.&quot;
            </div>
          </div>

          {simulationError && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{simulationError}</span>
            </div>
          )}

          {simulationResult && (
            <div className="p-4 rounded-md border border-red-200 bg-red-50/60 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="conflict" dot>
                    {simulationResult.decision}
                  </Badge>
                  <span className="text-xs text-red-700 font-medium">
                    Within budget, blocked on negative constraint
                  </span>
                </div>
                <span className="text-sm font-semibold text-amber-800 font-mono tabular-nums">
                  $999.00 USD
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-md bg-white border border-slate-200">
                  <span className="text-slate-500 block mb-0.5 text-[11px]">Proposed Item</span>
                  <span className="font-medium text-slate-900">{simulationResult.proposedItem}</span>
                </div>
                <div className="p-3 rounded-md bg-white border border-slate-200">
                  <span className="text-slate-500 block mb-0.5 text-[11px]">Violation Reason</span>
                  <span className="font-medium text-red-700">
                    {simulationResult.violations?.[0] || 'Negative constraint violated'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-md bg-white border border-slate-200 text-xs text-slate-700 font-mono">
                {simulationResult.reasoning}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-red-200">
                <p className="text-xs text-slate-700">
                  Checkout halted prior to PayPal order creation.
                </p>
                <Link to="/approvals">
                  <Button size="sm" variant="paypal">
                    Open Approval Queue
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Two Column Grid: Pending Approvals & Audit Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          accent="amber"
          title="Pending Approvals"
          subtitle="Flagged proposals awaiting review"
          action={
            <Link
              to="/approvals"
              className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-medium"
            >
              View all ({stats?.pending_approvals_count || 0}) <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-3">
            {stats?.pending_approvals && stats.pending_approvals.length > 0 ? (
              stats.pending_approvals.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-md border border-amber-200 bg-amber-50/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="warning" dot>Pending</Badge>
                      <span className="text-xs font-mono text-slate-500">{req.agent_id}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 font-mono tabular-nums">
                      ${req.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-900">{req.item_description}</div>
                  <div className="text-xs text-slate-600 line-clamp-2">{req.reason_for_approval}</div>
                  <div className="flex items-center justify-between pt-2 border-t border-amber-200/70">
                    <span className="text-[11px] text-slate-500">
                      {req.merchant_name} · PayPal Sandbox
                    </span>
                    <Link to="/approvals">
                      <Button size="sm" variant="paypal">Review</Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-md">
                No pending approval requests.
              </div>
            )}
          </div>
        </Card>

        <Card
          accent="teal"
          title="Recent Audit Events"
          subtitle="Latest recorded policy and settlement activity"
          action={
            <Link
              to="/audit"
              className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-medium"
            >
              Full log <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-2.5">
            {stats?.recent_audit_events && stats.recent_audit_events.length > 0 ? (
              stats.recent_audit_events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-md bg-slate-50 border border-slate-200 text-xs"
                >
                  <Badge variant="info">{event.action}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 truncate">{event.description || event.action}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {event.created_at ? new Date(event.created_at).toLocaleTimeString() : 'Recent'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-md">
                No audit events recorded yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
