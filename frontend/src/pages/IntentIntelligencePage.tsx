import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Agent, UserIntent, IntentEvaluation } from '../types';
import { agentService, intentService } from '../services';
import { getErrorMessage } from '../services/api';

export const IntentIntelligencePage: React.FC = () => {
  const [intents, setIntents] = useState<UserIntent[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedIntent, setSelectedIntent] = useState<UserIntent | null>(null);
  const [rawPrompt, setRawPrompt] = useState(
    "I need a laptop for college. Prioritize battery life and portability. Don't purchase gaming laptops. Budget under $1000."
  );

  // Proposal Test form
  const [itemName, setItemName] = useState('Asus ROG Zephyrus 14" RTX 4070 Gaming Laptop');
  const [merchant, setMerchant] = useState('BestBuy');
  const [price, setPrice] = useState('899');
  const [itemSpecs, setItemSpecs] = useState<Record<string, any>>({
    category: 'Gaming Laptops',
    gpu: 'RTX 4070',
  });
  const [evaluation, setEvaluation] = useState<IntentEvaluation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchInitialData = async () => {
    try {
      const [intentData, agentData] = await Promise.all([
        intentService.listIntents(),
        agentService.listAgents(),
      ]);
      setIntents(intentData);
      setAgents(agentData);
      if (intentData.length > 0 && !selectedIntent) {
        setSelectedIntent(intentData[0]);
      }
      if (agentData.length > 0 && !selectedAgentId) {
        setSelectedAgentId(agentData[0].id);
      }
    } catch (err) {
      console.error('Failed to load initial intent data', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleRegisterPrompt = async (): Promise<UserIntent | null> => {
    setStatusMessage(null);
    setIsSaving(true);
    try {
      const data = await intentService.createIntent({ raw_prompt: rawPrompt });
      const updated = await intentService.listIntents();
      setIntents(updated);
      setSelectedIntent(data);
      setStatusMessage({
        type: 'success',
        text: 'Master User Instruction registered and constraints extracted into AGENTPASS intent memory.',
      });
      return data;
    } catch (err) {
      setStatusMessage({ type: 'error', text: getErrorMessage(err) });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleEvaluatePurchase = async () => {
    setStatusMessage(null);
    setIsEvaluating(true);
    try {
      let targetIntent = selectedIntent;
      if (!targetIntent) {
        targetIntent = await handleRegisterPrompt();
        if (!targetIntent) {
          setIsEvaluating(false);
          return;
        }
      }

      const data = await intentService.evaluateIntent({
        intent_id: targetIntent.id,
        agent_id: selectedAgentId || 'simulator_agent',
        proposed_item_name: itemName,
        proposed_merchant: merchant,
        proposed_price: parseFloat(price) || 0,
        proposed_item_specs: itemSpecs,
      });
      setEvaluation(data);
    } catch (err) {
      setStatusMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-surface-card to-surface-card backdrop-blur-xl">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
          <BrainCircuit className="w-4 h-4" />
          <span>Intent Consistency Engine</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Semantic Financial Governance (Intent vs. Budget)
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
          Traditional payment systems only ask: <span className="text-amber-300 font-mono">"Is amount &le; budget limit?"</span>{' '}
          AGENTPASS continuously asks:{' '}
          <span className="text-indigo-300 font-mono font-semibold">
            "Does this purchase match the reason the human originally gave the agent?"
          </span>
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1: Register Master Intent */}
        <div className="lg:col-span-5 space-y-6">
          <Card
            title="1. Register Master Instruction"
            subtitle="The permanent intention logged in AGENTPASS"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Natural Language Prompt Given to AI Agent
                </label>
                <textarea
                  rows={4}
                  value={rawPrompt}
                  onChange={(e) => setRawPrompt(e.target.value)}
                  className="w-full p-3 bg-surface border border-surface-border rounded-xl text-sm text-indigo-100 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <Button
                variant="primary"
                className="w-full"
                leftIcon={<Sparkles className="w-4 h-4" />}
                onClick={handleRegisterPrompt}
                isLoading={isSaving}
              >
                Save & Extract Intent Constraints
              </Button>

              {intents.length > 0 && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Active Stored Master Intents ({intents.length})
                  </label>
                  <select
                    value={selectedIntent?.id || ''}
                    onChange={(e) => {
                      const found = intents.find((item) => item.id === e.target.value);
                      if (found) setSelectedIntent(found);
                    }}
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-xs text-white"
                  >
                    {intents.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.raw_prompt.slice(0, 70)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedIntent && (
                <div className="p-4 rounded-xl bg-surface/80 border border-surface-border space-y-3 text-xs">
                  <div className="font-semibold text-slate-300 flex items-center justify-between">
                    <span>Parsed Guardrails:</span>
                    <Badge variant="purple">Stored in Memory</Badge>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Positive Priorities:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedIntent.positive_constraints?.length ? (
                        selectedIntent.positive_constraints.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            + {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">None extracted</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Negative Constraints (Hard Blocks):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedIntent.negative_constraints?.length ? (
                        selectedIntent.negative_constraints.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold">
                            &times; {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 italic">None extracted</span>
                      )}
                    </div>
                  </div>
                  {selectedIntent.max_acceptable_budget && (
                    <div>
                      <span className="text-slate-400 text-[11px]">Stated Budget Ceiling:</span>
                      <span className="ml-2 font-mono text-white font-bold">
                        ${selectedIntent.max_acceptable_budget.toFixed(2)} USD
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Step 2: Propose Purchase & Evaluate Consistency */}
        <div className="lg:col-span-7 space-y-6">
          <Card
            title="2. Test Proposed Purchase"
            subtitle="Simulate what an autonomous agent chooses from an e-commerce catalog"
          >
            <div className="space-y-4">
              {agents.length > 0 && (
                <div className="text-xs">
                  <label className="block text-slate-400 font-medium mb-1">Target Agent</label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Item Title / Description</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => {
                      setItemName(e.target.value);
                      setItemSpecs({});
                    }}
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Merchant</label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white font-medium"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-slate-400 font-medium mb-1">Proposed Price ($ USD)</label>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-40 px-3 py-2 bg-surface border border-surface-border rounded-lg text-white font-mono font-bold"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setItemName('Asus ROG Zephyrus 14" RTX 4070 Gaming Laptop');
                        setMerchant('BestBuy');
                        setPrice('899');
                        setItemSpecs({ category: 'Gaming Laptops', gpu: 'RTX 4070' });
                      }}
                      className="text-[11px] px-2.5 py-1.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20"
                    >
                      Preset: Gaming Laptop (Conflict)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setItemName('Apple MacBook Air 13" M3 16GB 18-hr Battery');
                        setMerchant('Apple Store');
                        setPrice('949');
                        setItemSpecs({ category: 'Ultrabook', battery_hours: 18, weight: '2.7 lbs' });
                      }}
                      className="text-[11px] px-2.5 py-1.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                    >
                      Preset: Ultrabook (Match)
                    </button>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={handleEvaluatePurchase}
                isLoading={isEvaluating}
                leftIcon={<BrainCircuit className="w-4 h-4" />}
                className="w-full"
              >
                Evaluate Intent Consistency Against Stored Prompt
              </Button>
            </div>
          </Card>

          {/* Visual Intent Consistency Report */}
          {evaluation && (
            <Card
              title={
                <div className="flex items-center justify-between w-full">
                  <span className="text-base">Intent Evaluation Report</span>
                  <Badge
                    variant={
                      evaluation.decision === 'MATCH'
                        ? 'match'
                        : evaluation.decision === 'HARD_CONFLICT'
                        ? 'conflict'
                        : 'drift'
                    }
                    dot
                  >
                    {evaluation.decision}
                  </Badge>
                </div>
              }
              className={
                evaluation.decision === 'HARD_CONFLICT'
                  ? 'border-rose-500/50 bg-rose-950/15'
                  : evaluation.decision === 'DRIFT'
                  ? 'border-amber-500/50 bg-amber-950/15'
                  : 'border-emerald-500/50 bg-emerald-950/15'
              }
            >
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-surface/80 border border-surface-border flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Semantic Consistency Score</span>
                    <span className="text-2xl font-extrabold text-white font-mono">
                      {(evaluation.consistency_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Automated Checkout Status</span>
                    <span
                      className={`text-sm font-bold ${
                        evaluation.is_consistent ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {evaluation.is_consistent ? 'AUTHORIZED (MATCH)' : 'BLOCKED (CONFLICT)'}
                    </span>
                  </div>
                </div>

                {evaluation.conflicting_requirements?.length > 0 && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-2">
                    <div className="font-bold flex items-center gap-1.5 text-rose-400">
                      <AlertOctagon className="w-4 h-4 shrink-0" />
                      <span>Conflicting Intent Requirements:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      {evaluation.conflicting_requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-surface/80 border border-surface-border text-xs leading-relaxed">
                  <span className="font-semibold text-slate-300 block mb-1">Governance Engine Reasoning:</span>
                  <p className="text-slate-300 font-mono text-[11px]">{evaluation.reasoning}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
