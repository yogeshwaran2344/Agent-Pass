import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Agent, AuditLogItem } from '../types';
import { agentService, auditService, emergencyService } from '../services';
import { getErrorMessage } from '../services/api';

export const SecurityCenterPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [killReason, setKillReason] = useState('Unusual autonomous spending anomaly detected');
  const [killScope, setKillScope] = useState<'agent' | 'delegation_tree' | 'global'>('global');
  const [targetAgentId, setTargetAgentId] = useState<string>('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditLogItem[]>([]);
  const [isTriggering, setIsTriggering] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [status, setStatus] = useState<any>({
    global_kill_active: false,
    suspended_agents_count: 0,
    revoked_agents_count: 0,
    pending_approvals_count: 0,
  });

  const fetchSecurityData = async () => {
    try {
      const [statusData, agentData, auditData] = await Promise.all([
        emergencyService.getStatus(),
        agentService.listAgents(),
        auditService.getAuditLogs(),
      ]);
      setStatus(statusData);
      setAgents(agentData);
      setAuditEvents(auditData.slice(0, 8));
      if (agentData.length > 0 && !targetAgentId) {
        setTargetAgentId(agentData[0].id);
      }
    } catch (err) {
      console.error('Failed to load security center data', err);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleTriggerKillSwitch = async () => {
    if (killScope !== 'global' && !targetAgentId) {
      setBanner({ type: 'error', text: 'Select a target AI agent for scoped revocation.' });
      return;
    }

    setIsTriggering(true);
    setBanner(null);
    try {
      const res = await emergencyService.triggerKillSwitch({
        scope: killScope,
        agent_id: killScope === 'global' ? undefined : targetAgentId,
        reason: killReason,
      });
      setBanner({
        type: 'success',
        text: `Kill switch triggered (${killScope.toUpperCase()}). ${res.terminated_agents_count} agent(s) terminated.`,
      });
      setIsModalOpen(false);
      await fetchSecurityData();
    } catch (err) {
      setBanner({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Kill Switch &amp; Circuit Breakers</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Revoke financial permissions across individual agents, delegation sub-trees, or the entire platform.
        </p>
      </div>

      {banner && (
        <div
          className={`p-3 rounded-md border text-xs flex items-center gap-2 ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{banner.text}</span>
        </div>
      )}

      <div className="p-6 rounded-lg border border-red-200 bg-white shadow-card space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Badge variant="danger" dot>EMERGENCY CIRCUIT BREAKER</Badge>
            <h2 className="text-lg font-semibold text-slate-900">Emergency Kill Switch</h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Immediately invalidates agent API credentials, halts active PayPal order creation, and freezes pending reservations.
            </p>
          </div>

          <Button
            variant="danger"
            size="lg"
            leftIcon={<ShieldAlert className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Trigger Kill Switch
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1">Suspended Agents</span>
            <span className="text-lg font-semibold text-amber-700 font-mono tabular-nums">
              {status.suspended_agents_count}
            </span>
          </div>
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1">Kill-Switched Agents</span>
            <span className="text-lg font-semibold text-red-700 font-mono tabular-nums">
              {status.revoked_agents_count}
            </span>
          </div>
          <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1">Pending Reviews</span>
            <span className="text-lg font-semibold text-slate-900 font-mono tabular-nums">
              {status.pending_approvals_count}
            </span>
          </div>
        </div>
      </div>

      <Card title="Recent Security Events" subtitle="Audit history of emergency and status actions">
        <div className="space-y-2.5">
          {auditEvents.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No security or circuit breaker events logged yet.
            </div>
          ) : (
            auditEvents.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200 text-xs gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge
                    variant={
                      ev.action.includes('KILL') || ev.action.includes('REVOK')
                        ? 'danger'
                        : ev.action.includes('SUSPEND')
                        ? 'warning'
                        : 'info'
                    }
                  >
                    {ev.action}
                  </Badge>
                  <span className="text-slate-700 truncate">{ev.description || ev.entity_id}</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px] shrink-0">
                  {ev.created_at ? new Date(ev.created_at).toLocaleString() : 'Recent'}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-lg p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Confirm Emergency Kill Switch</h3>
              <p className="text-xs text-red-700 mt-1">
                Active credentials for the selected scope will be revoked immediately.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Revocation Scope</label>
                <select
                  value={killScope}
                  onChange={(e: any) => setKillScope(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900"
                >
                  <option value="global">Global (All Registered Agents)</option>
                  <option value="delegation_tree">Delegation Tree (Parent &amp; Sub-Agents)</option>
                  <option value="agent">Single Agent</option>
                </select>
              </div>

              {killScope !== 'global' && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Target Agent</label>
                  {agents.length === 0 ? (
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-500">
                      No agents registered yet.
                    </div>
                  ) : (
                    <select
                      value={targetAgentId}
                      onChange={(e) => setTargetAgentId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900"
                    >
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.status})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1">Reason</label>
                <textarea
                  rows={2}
                  value={killReason}
                  onChange={(e) => setKillReason(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-md text-slate-900 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={isTriggering}
                onClick={handleTriggerKillSwitch}
              >
                Execute Revocation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
