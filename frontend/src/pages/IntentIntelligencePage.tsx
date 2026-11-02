import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Send,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { UserIntent, IntentEvaluation } from '../types';
import { intentService } from '../services';

export const IntentIntelligencePage: React.FC = () => {
  const [intents, setIntents] = useState<UserIntent[]>([]);
  const [selectedIntent, setSelectedIntent] = useState<UserIntent | null>(null);
  const [rawPrompt, setRawPrompt] = useState(
    "I need a laptop for college. Prioritize battery life and portability. Don't purchase gaming laptops. Budget under $1000."
  );

  // Proposal Test form
  const [itemName, setItemName] = useState('Asus ROG Zephyrus 14" RTX 4070 Gaming Laptop');
  const [merchant, setMerchant] = useState('BestBuy');
  const [price, setPrice] = useState('899');
  const [evaluation, setEvaluation] = useState<IntentEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Load existing user intents
  const fetchIntents = async () => {
    try {
      const data = await intentService.listIntents();
      setIntents(data);
      if (data.length > 0 && !selectedIntent) {
        setSelectedIntent(data[0]);
      }
    } catch (err) {
      console.error('Failed to load user intents', err);
    }
  };

  useEffect(() => {
    fetchIntents();
  }, []);

  const handleRegisterPrompt = async () => {
    try {
      const data = await intentService.createIntent({ raw_prompt: rawPrompt });
      fetchIntents();
      setSelectedIntent(data);
      alert('Master User Instruction registered in AGENTPASS intent memory!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to register intent');
    }
  };

  const handleEvaluatePurchase = async () => {
    if (!selectedIntent) return;
    setIsEvaluating(true);
    try {
      const data = await intentService.evaluateIntent({
        intent_id: selectedIntent.id,
        agent_id: 'ag_procurement_99',
        proposed_item_name: itemName,
        proposed_merchant: merchant,
        proposed_price: parseFloat(price) || 0,
        proposed_item_specs: { category: 'Gaming Laptops', gpu: 'RTX 4070' },
      });
      setEvaluation(data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Evaluation failed');
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
              >
                Save & Extract Intent Constraints
              </Button>

              {selectedIntent && (
                <div className="p-4 rounded-xl bg-surface/80 border border-surface-border space-y-3 text-xs">
                  <div className="font-semibold text-slate-300 flex items-center justify-between">
                    <span>Parsed Guardrails:</span>
                    <Badge variant="purple">Stored in Memory</Badge>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Positive Priorities:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedIntent.positive_constraints?.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          + {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Negative Constraints (Hard Blocks):</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedIntent.negative_constraints?.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 font-bold">
                          &times; {c}
                        </span>
                      ))}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Item Title / Description</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
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
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-48 px-3 py-2 bg-surface border border-surface-border rounded-lg text-white font-mono font-bold"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setItemName('Asus ROG Zephyrus 14" RTX 4070 Gaming Laptop')}
                      className="text-[11px] px-2.5 py-1 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20"
                    >
                      Preset: Gaming Laptop (Conflict)
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemName('Apple MacBook Air 13" M3 16GB 18-hr Battery')}
                      className="text-[11px] px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
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
                  : 'border-emerald-500/50 bg-emerald-950/15'
              }
            >
              <div className="space-y-4">
                {/* Score Gauge */}
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

                {/* Conflicting requirements */}
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

                {/* Detailed Natural Language Reasoning */}
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
