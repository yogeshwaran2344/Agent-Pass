import React, { useState, useEffect } from 'react';
import {
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
} from 'recharts';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { dashboardService, riskService } from '../services';
import { RiskEvaluationResult } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);

  const [testAmount, setTestAmount] = useState('450.00');
  const [testMerchant, setTestMerchant] = useState('BestBuy');
  const [testVelocity, setTestVelocity] = useState('2');
  const [riskResult, setRiskResult] = useState<RiskEvaluationResult | null>(null);
  const [isEvaluatingRisk, setIsEvaluatingRisk] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await dashboardService.getStats();
        setStats(statsData);
      } catch (err) {
        console.error('Failed to load analytics', err);
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
    { category: 'Approved', count: 42 },
    { category: 'Intent Conflict', count: 14 },
    { category: 'Limit Blocked', count: 9 },
    { category: 'Human Review', count: 18 },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Spend &amp; Risk Analytics</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Velocity patterns, policy block rates, and heuristic transaction risk scoring.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Intent Match Rate"
          value="95.4%"
          subtitle="Proposals matching stored user instructions"
          icon={ShieldCheck}
          accentColor="emerald"
        />
        <StatCard
          title="Mean Review Time"
          value="1.8 min"
          subtitle="Operator approval turnaround"
          icon={TrendingUp}
          accentColor="indigo"
        />
        <StatCard
          title="Settled Today"
          value={`$${stats?.total_settled_usd?.toFixed(2) || '0.00'}`}
          subtitle={`${stats?.active_agents || 0} active agents`}
          icon={BarChart3}
          accentColor="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Spending Velocity"
          subtitle="Settled PayPal captures vs. 2-phase reservations"
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSettled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReserved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E2D9" />
                <XAxis dataKey="date" stroke="#78716C" tick={{ fontSize: 11 }} />
                <YAxis stroke="#78716C" tick={{ fontSize: 11 }} unit="$" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E2D9',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#1C1917',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="settled"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSettled)"
                  name="Settled"
                />
                <Area
                  type="monotone"
                  dataKey="reserved"
                  stroke="#D97706"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReserved)"
                  name="Reserved"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Enforcement Breakdown"
          subtitle="Deterministic rule checks vs. intent interceptions"
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={policyEnforcementData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="category" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#0F172A',
                  }}
                />
                <Bar dataKey="count" fill="#047857" radius={[4, 4, 0, 0]} name="Events" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card
        title="Risk Score Simulator"
        subtitle="Test real-time multi-signal risk scoring before authorizing transactions"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Amount ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Merchant</label>
              <input
                type="text"
                value={testMerchant}
                onChange={(e) => setTestMerchant(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                1-Hour Velocity Count
              </label>
              <input
                type="number"
                value={testVelocity}
                onChange={(e) => setTestVelocity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs font-mono"
              />
            </div>
            <Button
              onClick={handleRunRiskEvaluation}
              disabled={isEvaluatingRisk}
              className="w-full"
              leftIcon={isEvaluatingRisk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            >
              {isEvaluatingRisk ? 'Evaluating...' : 'Evaluate Risk Score'}
            </Button>
          </div>

          <div className="md:col-span-2 p-5 rounded-md border border-slate-200 bg-slate-50 min-h-[210px] flex flex-col justify-center">
            {riskResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Risk Score:</span>
                    <span className="text-2xl font-semibold font-mono text-slate-900 tabular-nums">
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
                  <span className="text-xs font-medium text-slate-700">Triggered Signals</span>
                  {riskResult.triggered_rules.length === 0 ? (
                    <div className="text-xs text-emerald-700 font-mono">
                      No anomalous signals detected.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {riskResult.triggered_rules.map((rule, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-md bg-white border border-slate-200 text-xs text-slate-600">
                  {riskResult.explanation}
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500">
                Enter an amount and hourly velocity, then click <strong>Evaluate Risk Score</strong>.
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
