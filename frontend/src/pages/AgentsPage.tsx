import React, { useState, useEffect } from 'react';
import { Bot, Plus, Key, Shield, ShieldAlert, CheckCircle, RefreshCw, Sparkles, Copy, Check, Loader2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Agent } from '../types';
import { agentService } from '../services';

export const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyGenerated, setNewKeyGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states
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
      console.error('Failed to fetch agent list from backend', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
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
      fetchAgents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create agent');
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    const nextStatus = agent.status === 'active' ? 'suspended' : 'active';
    const reason = nextStatus === 'suspended' ? 'Suspended by operator via console' : 'Reactivated';
    try {
      await agentService.changeStatus(agent.id, nextStatus, reason);
      fetchAgents();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Agent Registry</h2>
          <p className="text-xs text-slate-400">
            Register and monitor autonomous buyer agents, issue scoped API keys, and enforce status boundaries.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setNewKeyGenerated(null);
            setIsModalOpen(true);
          }}
        >
          Register New Agent
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && agents.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <p className="text-xs text-slate-400">Retrieving registered AI agents from database...</p>
        </div>
      ) : (
        /* Agents Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent) => (
            <Card key={agent.id} className="relative flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{agent.name}</h3>
                      <span className="text-[10px] font-mono text-slate-500">{agent.id}</span>
                    </div>
                  </div>
                  <Badge
                    variant={agent.status === 'active' ? 'success' : agent.status === 'suspended' ? 'warning' : 'danger'}
                    dot
                  >
                    {agent.status.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  {agent.description || 'No description provided.'}
                </p>

                {/* Framework & Model Badges */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-semibold bg-surface px-2 py-0.5 rounded border border-surface-border text-slate-300">
                    {agent.framework}
                  </span>
                  <span className="text-[10px] font-semibold bg-surface px-2 py-0.5 rounded border border-surface-border text-slate-300">
                    {agent.model_name}
                  </span>
                </div>

                {/* Capabilities */}
                <div className="mb-4">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Declared Capabilities
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.capabilities?.map((cap, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/40 text-indigo-300 border border-indigo-800/40 font-mono"
                      >
                        {cap.capability_name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Reputation & Trust Tier */}
                {agent.reputation && (
                  <div className="p-3 rounded-lg bg-surface/80 border border-surface-border/60 flex items-center justify-between text-xs mb-4">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Trust Tier</span>
                      <span className="font-semibold text-emerald-400">{agent.reputation.trust_tier}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[11px] block">Reliability Score</span>
                      <span className="font-bold text-white font-mono">{agent.reputation.reputation_score}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  Tasks: {agent.reputation?.total_tasks_attempted || 0}
                </span>
                <Button
                  size="sm"
                  variant={agent.status === 'active' ? 'secondary' : 'primary'}
                  onClick={() => handleToggleStatus(agent)}
                >
                  {agent.status === 'active' ? 'Suspend Agent' : 'Reactivate'}
                </Button>
              </div>
            </Card>
          ))}

          {agents.length === 0 && (
            <div className="col-span-full py-16 text-center p-8 border border-surface-border rounded-2xl bg-surface-card/40">
              <Bot className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Registered AI Agents</h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Register your first agent to issue API keys and enforce spending boundaries.
              </p>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Register First Agent
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Register Agent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-card border border-surface-border w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-1">Register New AI Agent</h3>
            <p className="text-xs text-slate-400 mb-5">
              Issue cryptographic authorization credentials and establish an autonomous buyer.
            </p>

            {newKeyGenerated ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  <div className="font-bold mb-1">Agent Successfully Registered!</div>
                  Copy this API key now. It will not be shown again.
                </div>

                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={newKeyGenerated}
                    className="w-full font-mono text-xs px-3 py-2.5 bg-black/60 border border-surface-border rounded-lg text-emerald-400 pr-10"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newKeyGenerated);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="absolute right-2 top-2 p-1 text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <Button
                  variant="primary"
                  className="w-full mt-4"
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
                  <label className="block text-slate-300 font-medium mb-1">Agent Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. FlightBooker-Delta"
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Description & Purpose</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this agent is authorized to purchase..."
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Framework</label>
                    <select
                      value={framework}
                      onChange={(e) => setFramework(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white"
                    >
                      <option value="crewai">CrewAI</option>
                      <option value="langchain">LangChain / LangGraph</option>
                      <option value="autogen">AutoGen</option>
                      <option value="custom">Custom Agent SDK</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">AI Model</label>
                    <select
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white"
                    >
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Create & Generate Key
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
