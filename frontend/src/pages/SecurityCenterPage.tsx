import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Lock,
  RotateCcw,
  Shield,
  Activity,
  History,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import api from '../services/api';

export const SecurityCenterPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [killReason, setKillReason] = useState('Unusual autonomous spending anomaly detected');
  const [killScope, setKillScope] = useState<'agent' | 'delegation_tree' | 'global'>('global');
  const [isTriggering, setIsTriggering] = useState(false);
  const [status, setStatus] = useState<any>({
    global_kill_active: false,
    suspended_agents_count: 0,
    revoked_agents_count: 0,
    pending_approvals_count: 1,
  });

  const fetchStatus = async () => {
    try {
      const res = await api.get('/emergency/status');
      setStatus(res.data);
    } catch {
      // Mock status if offline
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTriggerKillSwitch = async () => {
    setIsTriggering(true);
    try {
      await api.post('/emergency/kill-switch', {
        scope: killScope,
        reason: killReason,
      });
      alert(`EMERGENCY KILL SWITCH TRIGGERED: Scope [${killScope.toUpperCase()}]. Financial permissions revoked.`);
      setIsModalOpen(false);
      fetchStatus();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to trigger kill switch');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>Active Defenses & Circuit Breakers</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Security Center & Emergency Kill Switch</h2>
        <p className="text-xs text-slate-400">
          Immediate zero-latency revocation of financial authorization across rogue agents, delegation sub-trees, or global platform.
        </p>
      </div>

      {/* Main Red Alert Card: Emergency Kill Switch */}
      <div className="p-8 rounded-2xl border-2 border-rose-500/50 bg-gradient-to-r from-rose-950/40 via-surface-card to-surface-card shadow-alert backdrop-blur-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>CIRCUIT BREAKER CONTROL</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              Emergency Kill Switch
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              If an AI agent displays unexpected behavior, prompt injection compromise, or runaway loops, triggering the Kill Switch instantly invalidates its API tokens, freezes reserved budget commitments, and halts PayPal order creation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="danger"
              size="lg"
              className="text-base font-bold shadow-2xl shadow-rose-600/50 hover:scale-105"
              leftIcon={<ShieldAlert className="w-5 h-5" />}
              onClick={() => setIsModalOpen(true)}
            >
              Trigger Kill Switch
            </Button>
          </div>
        </div>

        {/* Security Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-rose-500/20 text-xs">
          <div className="p-3.5 rounded-xl bg-surface/70 border border-surface-border">
            <span className="text-slate-400 block mb-1">Suspended Agents:</span>
            <span className="text-lg font-bold text-amber-400 font-mono">
              {status.suspended_agents_count} Agents
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-surface/70 border border-surface-border">
            <span className="text-slate-400 block mb-1">Terminated via Kill Switch:</span>
            <span className="text-lg font-bold text-rose-400 font-mono">
              {status.revoked_agents_count} Agents
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-surface/70 border border-surface-border">
            <span className="text-slate-400 block mb-1">Pending Human Reviews:</span>
            <span className="text-lg font-bold text-white font-mono">
              {status.pending_approvals_count} Requests
            </span>
          </div>
        </div>
      </div>

      {/* Incident History & Security Logs */}
      <Card title="Security Incidents & Circuit Breaker Events" subtitle="Forensic audit trail of all emergency actions">
        <div className="space-y-3">
          {[
            {
              time: '10 min ago',
              type: 'INTENT_ANOMALY',
              severity: 'HIGH',
              detail: 'Gaming laptop selected on college budget prompt. Blocked automatically.',
            },
            {
              time: 'Yesterday',
              type: 'VELOCITY_BURST_FLAG',
              severity: 'MEDIUM',
              detail: 'Agent attempted 4 transactions in 3 minutes. Throttled to 1 tx/hr.',
            },
            {
              time: '3 days ago',
              type: 'KEY_ROTATION',
              severity: 'LOW',
              detail: 'Operator regenerated primary API key for ProcurementBot-Alpha.',
            },
          ].map((inc, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-surface-border text-xs">
              <div className="flex items-center gap-3">
                <Badge variant={inc.severity === 'HIGH' ? 'danger' : inc.severity === 'MEDIUM' ? 'warning' : 'info'}>
                  {inc.type}
                </Badge>
                <span className="text-slate-200">{inc.detail}</span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">{inc.time}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-card border-2 border-rose-500/60 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Confirm Emergency Kill Switch Execution</h3>
              <p className="text-xs text-rose-300 mt-1">
                This action is immediate. Active tokens will be revoked and pending commitments purged.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Revocation Scope</label>
                <select
                  value={killScope}
                  onChange={(e: any) => setKillScope(e.target.value)}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white"
                >
                  <option value="global">Global (Terminate All AI Agents)</option>
                  <option value="delegation_tree">Delegation Tree (Target Agent & Downstream Children)</option>
                  <option value="agent">Single Rogue Agent</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reason for Emergency Halt</label>
                <textarea
                  rows={2}
                  value={killReason}
                  onChange={(e) => setKillReason(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-surface-border rounded-lg text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={isTriggering}
                onClick={handleTriggerKillSwitch}
              >
                Execute Emergency Revocation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
