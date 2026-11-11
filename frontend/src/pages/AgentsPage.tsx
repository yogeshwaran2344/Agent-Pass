import React, { useState, useEffect } from 'react';
import { Bot, Plus, Copy, Check, Loader2, AlertTriangle } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Agent } from '../types';
import { agentService } from '../services';
import { getErrorMessage } from '../services/api';

export const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyGenerated, setNewKeyGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [framework, setFramework] = useState('crewai');
  const [modelName, setModelName] = useState('gemini-2.0-flash');

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const data = await agentService.listAgents();
      setAgents(data);
    } catch (err) {
      console.error('Failed to fetch agent list', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    try {
      const res = await agentService.registerAgent({
        name,
        description,
        framework,
        model_name: modelName,
        capabilities: [
          { capability_name: 'ecommerce:search', scope: 'browsing' },
          { capability_name: 'ecommerce:purchase', scope: 'financial' },
        ],
      });
      setNewKeyGenerated(res.api_key);
      setName('');
      setDescription('');
      fetchAgents();
    } catch (err) {
      setErrorBanner(getErrorMessage(err));
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    const nextStatus = agent.status === 'active' ? 'suspended' : 'active';
    const reason = nextStatus === 'suspended' ? 'Suspended by operator' : 'Reactivated by operator';
    setErrorBanner(null);
    try {
      await agentService.changeStatus(agent.id, nextStatus, reason);
      fetchAgents();
    } catch (err) {
      setErrorBanner(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Agent Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register autonomous agents, issue scoped `agp_live_` API keys, and manage status.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setNewKeyGenerated(null);
            setErrorBanner(null);
            setIsModalOpen(true);
          }}
        >
          Register Agent
        </Button>
      </div>

      {errorBanner && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {isLoading && agents.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          <p className="text-xs text-slate-500">Loading registered agents...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-md bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{agent.name}</h3>
                      <span className="text-[11px] font-mono text-slate-400 block truncate">{agent.id}</span>
                    </div>
                  </div>
                  <Badge
                    variant={agent.status === 'active' ? 'success' : agent.status === 'suspended' ? 'warning' : 'danger'}
                    dot
                  >
                    {agent.status.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                  {agent.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    {agent.framework}
                  </span>
                  <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    {agent.model_name}
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    Capabilities
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities?.map((cap, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200 font-mono"
                      >
                        {cap.capability_name}
                      </span>
                    ))}
                  </div>
                </div>

                {agent.reputation && (
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-xs mb-4">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Trust Tier</span>
                      <span className="font-medium text-emerald-700">{agent.reputation.trust_tier}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 text-[11px] block">Reliability</span>
                      <span className="font-semibold text-slate-900 font-mono tabular-nums">
                        {agent.reputation.reputation_score}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                  Tasks: {agent.reputation?.total_tasks_attempted || 0}
                </span>
                <Button
                  size="sm"
                  variant={agent.status === 'active' ? 'secondary' : 'primary'}
                  onClick={() => handleToggleStatus(agent)}
                >
                  {agent.status === 'active' ? 'Suspend' : 'Reactivate'}
                </Button>
              </div>
            </Card>
          ))}

          {agents.length === 0 && (
            <div className="col-span-full py-14 text-center p-8 border border-slate-200 rounded-lg bg-white shadow-subtle">
              <Bot className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-900">No agents registered</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Register an agent to issue API credentials and configure spending policies.
              </p>
              <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                Register First Agent
              </Button>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-lg p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900 mb-0.5">Register AI Agent</h3>
            <p className="text-xs text-slate-500 mb-5">
              Issue a scoped `agp_live_` credential for autonomous execution.
            </p>

            {newKeyGenerated ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <div className="font-semibold mb-0.5">Agent registered</div>
                  Copy this API key now. For security, it cannot be displayed again.
                </div>

                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={newKeyGenerated}
                    className="w-full font-mono text-xs px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-slate-900 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newKeyGenerated);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="absolute right-2 top-2 p-1 text-slate-500 hover:text-slate-900"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewKeyGenerated(null);
                  }}
                >
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateAgent} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Agent Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. ProcurementBot-Alpha"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Purpose and authorized workflows..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Framework</label>
                    <select
                      value={framework}
                      onChange={(e) => setFramework(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900"
                    >
                      <option value="crewai">CrewAI</option>
                      <option value="langchain">LangChain / LangGraph</option>
                      <option value="autogen">AutoGen</option>
                      <option value="custom">Custom SDK</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Model</label>
                    <select
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900"
                    >
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Create &amp; Issue Key
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
