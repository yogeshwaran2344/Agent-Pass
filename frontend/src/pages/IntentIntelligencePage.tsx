import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
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
        text: 'Instruction saved and constraints extracted.',
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Intent Verification</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Store user instructions and compare proposed purchases against positive priorities and negative constraints.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-md border text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <Card
            title="1. Master Instruction"
            subtitle="Original user intent stored in policy memory"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Instruction Prompt
                </label>
                <textarea
                  rows={4}
                  value={rawPrompt}
                  onChange={(e) => setRawPrompt(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-md text-xs text-slate-900 font-mono"
                />
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={handleRegisterPrompt}
                isLoading={isSaving}
              >
                Save &amp; Extract Constraints
              </Button>

              {intents.length > 0 && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Stored Intents ({intents.length})
                  </label>
                  <select
                    value={selectedIntent?.id || ''}
                    onChange={(e) => {
                      const found = intents.find((item) => item.id === e.target.value);
                      if (found) setSelectedIntent(found);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-900"
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
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="font-medium text-slate-800 flex items-center justify-between">
                    <span>Extracted Constraints</span>
                    <Badge variant="neutral">Active</Badge>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Positive Priorities</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedIntent.positive_constraints?.length ? (
                        selectedIntent.positive_constraints.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[11px]">
                            + {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">None extracted</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Negative Constraints (Hard Block)</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedIntent.negative_constraints?.length ? (
                        selectedIntent.negative_constraints.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-mono text-[11px] font-medium">
                            &times; {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">None extracted</span>
                      )}
                    </div>
                  </div>
                  {selectedIntent.max_acceptable_budget && (
                    <div>
                      <span className="text-slate-500 text-[11px]">Budget Ceiling:</span>
                      <span className="ml-2 font-mono text-slate-900 font-semibold tabular-nums">
                        ${selectedIntent.max_acceptable_budget.toFixed(2)} USD
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <Card
            title="2. Test Proposed Purchase"
            subtitle="Simulate a product proposal from an autonomous agent"
          >
            <div className="space-y-4">
              {agents.length > 0 && (
                <div className="text-xs">
                  <label className="block text-slate-700 font-medium mb-1">Target Agent</label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900"
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
                  <label className="block text-slate-700 font-medium mb-1">Item Title</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => {
                      setItemName(e.target.value);
                      setItemSpecs({});
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Merchant</label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-slate-700 font-medium mb-1">Price ($ USD)</label>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-36 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-mono font-semibold tabular-nums"
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
                      className="text-[11px] px-2.5 py-1.5 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-medium"
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
                      className="text-[11px] px-2.5 py-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium"
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
                Evaluate Intent Consistency
              </Button>
            </div>
          </Card>

          {evaluation && (
            <Card
              title={
                <div className="flex items-center justify-between w-full">
                  <span>Evaluation Output</span>
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
                  ? 'border-red-200'
                  : evaluation.decision === 'DRIFT'
                  ? 'border-amber-200'
                  : 'border-emerald-200'
              }
            >
              <div className="space-y-4">
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Consistency Score</span>
                    <span className="text-2xl font-semibold text-slate-900 font-mono tabular-nums">
                      {(evaluation.consistency_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">Authorization Gate</span>
                    <span
                      className={`text-xs font-semibold ${
                        evaluation.is_consistent ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {evaluation.is_consistent ? 'AUTHORIZED (MATCH)' : 'BLOCKED (CONFLICT)'}
                    </span>
                  </div>
                </div>

                {evaluation.conflicting_requirements?.length > 0 && (
                  <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-800 space-y-1.5">
                    <div className="font-semibold flex items-center gap-1.5 text-red-700">
                      <AlertOctagon className="w-4 h-4 shrink-0" />
                      <span>Conflicting Requirements</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      {evaluation.conflicting_requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs leading-relaxed">
                  <span className="font-medium text-slate-700 block mb-1">Reasoning</span>
                  <p className="text-slate-700 font-mono text-[11px]">{evaluation.reasoning}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
