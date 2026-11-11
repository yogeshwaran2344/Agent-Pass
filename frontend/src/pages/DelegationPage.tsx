import React, { useState, useEffect } from 'react';
import {
  ArrowDown,
  Bot,
  Plus,
  Shield,
  Trash2,
  Loader2,
  AlertCircle,
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
      setModalError('Select both parent and child agents.');
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
    if (!confirm('Revoke this delegation? The child agent will immediately lose delegated spending access.')) {
      return;
    }
    try {
      await delegationService.revokeDelegation(delegationId);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Delegations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enforce subset limits across multi-agent hierarchies with cycle detection and instant revocation.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Delegate Authority
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <Card
        title="Delegation Hierarchy"
        subtitle="Parent-to-child authorization graph (max depth 5)"
      >
        {isLoading ? (
          <div className="py-12 flex justify-center items-center text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span>Loading delegation tree...</span>
          </div>
        ) : delegations.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">No active delegations</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Delegate scoped budget subsets from a primary agent to specialized worker agents.
            </p>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="mt-4"
            >
              Create Delegation
            </Button>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center space-y-3 max-w-2xl mx-auto">
            <div className="w-full p-3.5 rounded-md border border-slate-300 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                  R
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Root Operator Policy</div>
                  <div className="text-xs text-slate-500 font-mono">
                    Master intent &amp; spending bounds
                  </div>
                </div>
              </div>
              <Badge variant="neutral">Root</Badge>
            </div>

            <ArrowDown className="w-4 h-4 text-slate-400" />

            {delegations.map((del) => (
              <React.Fragment key={del.id}>
                <div className="w-full p-4 rounded-md border border-slate-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold">
                        <span className="text-slate-900">
                          {del.parent_agent_name || del.parent_agent_id.slice(0, 8)}
                        </span>
                        <span className="text-slate-400">&rarr;</span>
                        <span className="text-emerald-700">
                          {del.child_agent_name || del.child_agent_id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                        Ceiling: ${del.delegated_budget_limit.toFixed(2)} · Depth {del.delegation_depth}
                      </div>
                      {del.task_description && (
                        <div className="text-xs text-slate-600 mt-1">
                          {del.task_description}
                        </div>
                      )}
                      {del.allowed_categories && del.allowed_categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {del.allowed_categories.map((cat, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-mono"
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
                        variant="secondary"
                        onClick={() => handleRevoke(del.id)}
                        className="text-red-700 hover:text-red-800"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
                <ArrowDown className="w-4 h-4 text-slate-300" />
              </React.Fragment>
            ))}

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono pt-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Child allocations cannot exceed parent daily ceilings
            </div>
          </div>
        )}
      </Card>

      <Card title="Delegation Records" subtitle="Granted and revoked delegation links">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-2.5">ID</th>
                <th className="px-4 py-2.5">Parent</th>
                <th className="px-4 py-2.5">Child</th>
                <th className="px-4 py-2.5">Ceiling</th>
                <th className="px-4 py-2.5">Depth</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Created</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {delegations.map((del) => (
                <tr key={del.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono text-slate-500">{del.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {del.parent_agent_name || del.parent_agent_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-medium text-emerald-700">
                    {del.child_agent_name || del.child_agent_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-900 tabular-nums">
                    ${del.delegated_budget_limit.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">Level {del.delegation_depth}</td>
                  <td className="px-4 py-3">
                    <Badge variant={del.is_active ? 'success' : 'danger'}>
                      {del.is_active ? 'Active' : 'Revoked'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(del.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {del.is_active ? (
                      <button
                        onClick={() => handleRevoke(del.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Revoke
                      </button>
                    ) : (
                      <span className="text-slate-400">Revoked</span>
                    )}
                  </td>
                </tr>
              ))}
              {delegations.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No delegation records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Delegate Authority to Child Agent"
      >
        <form onSubmit={handleCreateDelegation} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Parent Agent (Grantor)
            </label>
            <select
              value={parentAgentId}
              onChange={(e) => setParentAgentId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs"
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
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Child Agent (Recipient)
            </label>
            <select
              value={childAgentId}
              onChange={(e) => setChildAgentId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs"
              required
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id} disabled={a.id === parentAgentId}>
                  {a.name} {a.id === parentAgentId ? '(Same agent)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Task Description
            </label>
            <input
              type="text"
              placeholder="e.g. Price comparison across verified vendors"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Budget Ceiling ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Expiry (Hours)
              </label>
              <input
                type="number"
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Allowed Categories (Comma separated)
            </label>
            <input
              type="text"
              value={allowedCategories}
              onChange={(e) => setAllowedCategories(e.target.value)}
              placeholder="Electronics, Computers, Office"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-xs"
            />
          </div>

          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
            <strong>Invariance:</strong> Suspending or revoking a parent agent automatically invalidates delegated child authorities.
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
              {isSubmitting ? 'Granting...' : 'Confirm Delegation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
