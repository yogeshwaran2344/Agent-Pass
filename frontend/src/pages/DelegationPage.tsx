import React, { useState, useEffect } from 'react';
import {
  GitFork,
  ArrowDown,
  Bot,
  Plus,
  Shield,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Agent, Delegation } from '../types';
import { agentService, delegationService } from '../services';
import { getErrorMessage } from '../services/api';

export const DelegationPage: React.FC = () => {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [parentAgentId, setParentAgentId] = useState('');
  const [childAgentId, setChildAgentId] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('50.00');
  const [allowedCategories, setAllowedCategories] = useState('Electronics, Hardware');
  const [expiryHours, setExpiryHours] = useState('24');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [delegationData, agentData] = await Promise.all([
        delegationService.listDelegations(),
        agentService.listAgents(),
      ]);
      setDelegations(delegationData);
      setAgents(agentData);

      if (agentData.length >= 2) {
        setParentAgentId(agentData[0].id);
        setChildAgentId(agentData[1].id);
      } else if (agentData.length === 1) {
        setParentAgentId(agentData[0].id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentAgentId || !childAgentId) {
      setModalError('Please select both parent and child agents.');
      return;
    }
    if (parentAgentId === childAgentId) {
      setModalError('Parent and child agents must be different.');
      return;
    }

    try {
      setIsSubmitting(true);
      setModalError(null);
      await delegationService.createDelegation({
        parent_agent_id: parentAgentId,
        child_agent_id: childAgentId,
        task_description: taskDescription,
        delegated_budget_limit: parseFloat(budgetLimit) || 50.0,
        allowed_categories: allowedCategories.split(',').map((c) => c.trim()).filter(Boolean),
        expires_in_hours: parseInt(expiryHours) || 24,
      });
      setIsModalOpen(false);
      setTaskDescription('');
      await loadData();
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (delegationId: string) => {
    if (!confirm('Are you sure you want to revoke this delegation authority? The child agent will immediately lose delegated spending rights.')) {
      return;
    }
    try {
      await delegationService.revokeDelegation(delegationId);
      await loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <GitFork className="w-4 h-4" />
            <span>Multi-Agent RBAC Hierarchy</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Delegation Chain Management</h2>
          <p className="text-xs text-slate-400">
            Enforce authority subsets: Child delegated agents cannot exceed parent budget limits or bypass category constraints.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Delegate Authority</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Visual Hierarchy Tree */}
      <Card
        title="Live Agent Delegation Tree"
        subtitle="Cryptographically verified hierarchy: Root Authority ──> Parent Agent ──> Delegated Sub-Agents"
      >
        {isLoading ? (
          <div className="py-12 flex justify-center items-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading delegation network...</span>
          </div>
        ) : delegations.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-surface border border-surface-border flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white">No active delegations established</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Delegate authority from a primary agent to a specialized sub-agent (e.g. price researcher, checkout worker).
            </p>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="mt-4"
            >
              Establish First Delegation
            </Button>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center space-y-4 max-w-2xl mx-auto">
            {/* Level 0: Master Authority */}
            <div className="w-full p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                  H
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Master User Authority</div>
                  <div className="text-xs text-slate-400 font-mono">
                    Deterministic root limits & master intent rules
                  </div>
                </div>
              </div>
              <Badge variant="purple">Root Authority</Badge>
            </div>

            <ArrowDown className="w-5 h-5 text-indigo-400 animate-bounce" />

            {/* Render Delegations */}
            {delegations.map((del) => (
              <React.Fragment key={del.id}>
                <div className="w-full p-4 rounded-xl border border-surface-border bg-surface-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center text-sky-400 mt-0.5">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {del.parent_agent_name || del.parent_agent_id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-slate-500">──►</span>
                        <span className="text-sm font-bold text-sky-400">
                          {del.child_agent_name || del.child_agent_id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">
                        Ceiling: ${del.delegated_budget_limit.toFixed(2)} · Depth {del.delegation_depth}
                      </div>
                      {del.task_description && (
                        <div className="text-xs text-slate-300 mt-1 italic">
                          "{del.task_description}"
                        </div>
                      )}
                      {del.allowed_categories && del.allowed_categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {del.allowed_categories.map((cat, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-surface-border"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Badge variant={del.is_active ? 'success' : 'danger'}>
                      {del.is_active ? 'Active' : 'Revoked'}
                    </Badge>
                    {del.is_active && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRevoke(del.id)}
                        className="px-2.5 py-1 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
                <ArrowDown className="w-4 h-4 text-slate-600" />
              </React.Fragment>
            ))}

            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Invariance enforced: Sub-agents automatically inherit all parent negative constraints
            </div>
          </div>
        )}
      </Card>

      {/* Delegation History Table */}
      <Card title="Delegation Authority Records" subtitle="Full audit list of granted and revoked authority delegations">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface border-b border-surface-border text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3">Delegation ID</th>
                <th className="px-4 py-3">Parent Agent</th>
                <th className="px-4 py-3">Child Agent</th>
                <th className="px-4 py-3">Ceiling</th>
                <th className="px-4 py-3">Depth</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {delegations.map((del) => (
                <tr key={del.id} className="hover:bg-surface/50">
                  <td className="px-4 py-3 font-mono text-slate-400">{del.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 font-semibold text-white">
                    {del.parent_agent_name || del.parent_agent_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-sky-400">
                    {del.child_agent_name || del.child_agent_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-400">
                    ${del.delegated_budget_limit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">Level {del.delegation_depth}</td>
                  <td className="px-4 py-3">
                    <Badge variant={del.is_active ? 'success' : 'danger'}>
                      {del.is_active ? 'Active' : 'Revoked'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(del.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {del.is_active ? (
                      <button
                        onClick={() => handleRevoke(del.id)}
                        className="text-rose-400 hover:text-rose-300 font-medium"
                      >
                        Revoke
                      </button>
                    ) : (
                      <span className="text-slate-500 italic">Terminated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Delegate Authority */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Delegate Authority to Child Agent"
      >
        <form onSubmit={handleCreateDelegation} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Parent Agent (Grantor)
            </label>
            <select
              value={parentAgentId}
              onChange={(e) => setParentAgentId(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white text-xs"
              required
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.agent_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Child Agent (Recipient)
            </label>
            <select
              value={childAgentId}
              onChange={(e) => setChildAgentId(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white text-xs"
              required
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id} disabled={a.id === parentAgentId}>
                  {a.name} {a.id === parentAgentId ? '(Cannot self-delegate)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Task Description & Purpose
            </label>
            <input
              type="text"
              placeholder="e.g. Price comparison across verified vendors"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Delegated Budget Limit ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white text-xs font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Expiry (Hours)
              </label>
              <input
                type="number"
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white text-xs font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Allowed Categories (Comma separated)
            </label>
            <input
              type="text"
              value={allowedCategories}
              onChange={(e) => setAllowedCategories(e.target.value)}
              placeholder="Electronics, Computers, Office"
              className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white text-xs"
            />
          </div>

          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] leading-relaxed">
            <strong>Policy Invariance Guarantee:</strong> If the parent agent is suspended or revoked, all delegated child authorities are immediately invalidated.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Granting Authority...' : 'Confirm Delegation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
