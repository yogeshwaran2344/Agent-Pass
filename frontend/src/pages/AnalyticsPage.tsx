import React, { useState, useEffect } from 'react';
import {
  LineChart as LineChartIcon,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Play,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { dashboardService, transactionService, riskService } from '../services';
import { RiskEvaluationResult, Transaction } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Risk Simulator State
  const [testAmount, setTestAmount] = useState('450.00');
  const [testMerchant, setTestMerchant] = useState('BestBuy');
  const [testVelocity, setTestVelocity] = useState('2');
  const [riskResult, setRiskResult] = useState<RiskEvaluationResult | null>(null);
  const [isEvaluatingRisk, setIsEvaluatingRisk] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, txData] = await Promise.all([
          dashboardService.getStats(),
          transactionService.listTransactions(),
        ]);
        setStats(statsData);
        setTransactions(txData);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRunRiskEvaluation = async () => {
    try {
      setIsEvaluatingRisk(true);
      const res = await riskService.evaluateRisk({
        agent_id: 'simulator-agent',
        amount: parseFloat(testAmount) || 100,
        merchant: testMerchant,
        velocity_tx_count_last_hour: parseInt(testVelocity) || 1,
      });
      setRiskResult(res);
    } catch (err) {
      console.error('Risk test failed', err);
    } finally {
      setIsEvaluatingRisk(false);
    }
  };

  // Mocked/Derived chart dataset
  const velocityData = [
    { date: 'Mon', settled: 120, reserved: 200 },
    { date: 'Tue', settled: 310, reserved: 450 },
    { date: 'Wed', settled: 190, reserved: 210 },
    { date: 'Thu', settled: 420, reserved: 500 },
    { date: 'Fri', settled: 280, reserved: 390 },
    { date: 'Sat', settled: 540, reserved: 610 },
    { date: 'Sun', settled: 380, reserved: 430 },
  ];

  const policyEnforcementData = [
    { category: 'Autonomous Approved', count: 42 },
    { category: 'Intent Conflict Blocked', count: 14 },
    { category: 'Budget Limit Blocked', count: 9 },
    { category: 'Human Review Approved', count: 18 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <LineChartIcon className="w-4 h-4" />
          <span>Intelligence Reports</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Spending & Risk Analytics</h2>
        <p className="text-xs text-slate-400">
          Monitor velocity trends, policy enforcement distributions, and real-time risk scores.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Intent Match Rate"
          value="95.4%"
          subtitle="Proposals strictly aligned with master user prompt"
          icon={ShieldCheck}
          accentColor="emerald"
        />
        <StatCard
          title="Human Approval Latency"
          value="1.8 min"
          subtitle="Average review turnaround time"
          icon={TrendingUp}
          accentColor="indigo"
        />
        <StatCard
          title="Total Settled Spend"
          value={`$${stats?.spending?.total_spend_today?.toFixed(2) || '0.00'}`}
          subtitle={`Across ${stats?.spending?.active_agents_spending_today || 0} active agents`}
          icon={BarChart3}
          accentColor="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Velocity Area Chart */}
        <Card
          title="Autonomous Spending Velocity"
          subtitle="Settled transactions vs 2-phase reserved commitments"
        >
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSettled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReserved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="$" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="settled"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorSettled)"
                  name="Settled Spend"
                />
                <Area
                  type="monotone"
                  dataKey="reserved"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorReserved)"
                  name="Reserved (2-Phase)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Policy Enforcement Bar Chart */}
        <Card
          title="Enforcement & Interception Breakdown"
          subtitle="Deterministic policy interceptions vs semantic intent divergence"
        >
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={policyEnforcementData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Interceptions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Live Risk Scoring Engine Simulator */}
      <Card
        title="Live Risk Engine & Fraud Scoring Simulator"
        subtitle="Simulate real-time multi-signal scoring before authorizing agent transactions"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Transaction Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Merchant</label>
              <input
                type="text"
                value={testMerchant}
                onChange={(e) => setTestMerchant(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                1-Hour Velocity Count
              </label>
              <input
                type="number"
                value={testVelocity}
                onChange={(e) => setTestVelocity(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white text-xs font-mono"
              />
            </div>
            <Button
              onClick={handleRunRiskEvaluation}
              disabled={isEvaluatingRisk}
              className="w-full flex items-center justify-center gap-2"
            >
              {isEvaluatingRisk ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Signals...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Evaluate Risk Score</span>
                </>
              )}
            </Button>
          </div>

          <div className="md:col-span-2 p-5 rounded-xl border border-surface-border bg-surface/50 min-h-[220px] flex flex-col justify-center">
            {riskResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">Calculated Risk Score:</span>
                    <span className="text-2xl font-bold font-mono text-white">
                      {(riskResult.overall_risk_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Badge
                    variant={
                      riskResult.risk_level === 'CRITICAL' || riskResult.risk_level === 'HIGH'
                        ? 'danger'
                        : riskResult.risk_level === 'MEDIUM'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {riskResult.risk_level} RISK
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">Triggered Rules:</span>
                  {riskResult.triggered_rules.length === 0 ? (
                    <div className="text-xs text-emerald-400 font-mono">
                      No anomalous risk rules triggered. Normal behavioral pattern.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {riskResult.triggered_rules.map((rule, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-center gap-2"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-surface border border-surface-border text-xs text-slate-400">
                  {riskResult.explanation}
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500">
                Configure amounts and velocity above, then click <strong>Evaluate Risk Score</strong> to run live heuristic risk calculation.
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
