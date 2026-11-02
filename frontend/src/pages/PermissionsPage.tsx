import React, { useState, useEffect } from 'react';
import { Sliders, Shield, Save, Plus, X, Loader2, Check } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Agent } from '../types';
import { agentService, permissionService } from '../services';

export const PermissionsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Policy Form states
  const [maxPerTx, setMaxPerTx] = useState('100.00');
  const [dailyLimit, setDailyLimit] = useState('500.00');
  const [monthlyLimit, setMonthlyLimit] = useState('2000.00');
  const [humanApprovalAbove, setHumanApprovalAbove] = useState('50.00');
  const [allowedMerchants, setAllowedMerchants] = useState<string[]>(['bestbuy', 'apple', 'github', 'amazon']);
  const [newMerchant, setNewMerchant] = useState('');
  const [disallowedCategories, setDisallowedCategories] = useState<string[]>(['Gambling', 'Gaming Hardware', 'Crypto', 'Gift Cards']);
  const [newCategory, setNewCategory] = useState('');

  // Fetch agents
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const data = await agentService.listAgents();
        setAgents(data);
        if (data.length > 0) {
          setSelectedAgentId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load agents for policy configuration', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAgents();
  }, []);

  // Fetch policies when selected agent changes
  useEffect(() => {
    if (!selectedAgentId) return;
    const loadPolicy = async () => {
      try {
        const policies = await permissionService.getAgentPermissions(selectedAgentId);
        if (policies.length > 0) {
          const current = policies[0];
          setMaxPerTx(current.max_amount_per_tx.toString());
          setDailyLimit(current.daily_spend_limit.toString());
          setMonthlyLimit(current.monthly_spend_limit.toString());
          setHumanApprovalAbove(current.require_human_approval_above.toString());
          if (current.allowed_merchants) setAllowedMerchants(current.allowed_merchants);
          if (current.disallowed_categories) setDisallowedCategories(current.disallowed_categories);
        }
      } catch (err) {
        console.error('Failed to load policy for agent', err);
      }
    };
    loadPolicy();
  }, [selectedAgentId]);

  const handleSavePolicy = async () => {
    if (!selectedAgentId) {
      alert('Please select or register an agent first.');
      return;
    }
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await permissionService.createPolicy({
        agent_id: selectedAgentId,
        max_amount_per_tx: parseFloat(maxPerTx) || 100,
        daily_spend_limit: parseFloat(dailyLimit) || 500,
        monthly_spend_limit: parseFloat(monthlyLimit) || 2000,
        require_human_approval_above: parseFloat(humanApprovalAbove) || 50,
        allowed_merchants: allowedMerchants,
        disallowed_merchants: [],
        allowed_categories: [],
        disallowed_categories: disallowedCategories,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save policy');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMerchant = () => {
    if (newMerchant.trim() && !allowedMerchants.includes(newMerchant.trim().toLowerCase())) {
      setAllowedMerchants([...allowedMerchants, newMerchant.trim().toLowerCase()]);
      setNewMerchant('');
    }
  };

  const handleRemoveMerchant = (m: string) => {
    setAllowedMerchants(allowedMerchants.filter((item) => item !== m));
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !disallowedCategories.includes(newCategory.trim())) {
      setDisallowedCategories([...disallowedCategories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (c: string) => {
    setDisallowedCategories(disallowedCategories.filter((item) => item !== c));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Deterministic Policy Rules</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Smart Permission & Policy Engine</h2>
          <p className="text-xs text-slate-400">
            Hard spending limits, merchant allowlists, and category firewalls evaluated before payment authorization.
          </p>
        </div>

        {/* Agent Selector Dropdown */}
        {agents.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Target Agent:</span>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="px-3 py-1.5 bg-surface-card border border-surface-border rounded-lg text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            >
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} ({ag.id})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Spending policy and deterministic guardrails updated in database successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Thresholds */}
        <Card title="Financial Spending Thresholds" subtitle="Microsecond deterministic limits">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Max Per-Transaction Limit ($ USD)</label>
              <input
                type="number"
                value={maxPerTx}
                onChange={(e) => setMaxPerTx(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Daily Spend Velocity Ceiling ($ USD)</label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Monthly Budget Limit ($ USD)</label>
              <input
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Require Human Approval Above ($ USD)</label>
              <input
                type="number"
                value={humanApprovalAbove}
                onChange={(e) => setHumanApprovalAbove(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white font-mono text-sm"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Transactions above this amount require human operator sign-off before dispatching to PayPal.
              </span>
            </div>

            <Button
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              isLoading={isSaving}
              onClick={handleSavePolicy}
            >
              Save Policy to Backend
            </Button>
          </div>
        </Card>

        {/* Categorical & Merchant Firewalls */}
        <Card title="Merchant & Category Firewalls" subtitle="Domain and MCC code filtering">
          <div className="space-y-5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Approved Merchant Allowlists</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. target.com"
                  value={newMerchant}
                  onChange={(e) => setNewMerchant(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMerchant()}
                  className="px-3 py-1.5 bg-surface border border-surface-border rounded-lg text-white text-xs flex-1"
                />
                <Button size="sm" variant="secondary" onClick={handleAddMerchant}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allowedMerchants.map((m, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-slate-200 font-mono text-[11px] flex items-center gap-1.5"
                  >
                    {m}
                    <button
                      onClick={() => handleRemoveMerchant(m)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Prohibited Purchase Categories</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. Luxury Goods"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  className="px-3 py-1.5 bg-surface border border-surface-border rounded-lg text-white text-xs flex-1"
                />
                <Button size="sm" variant="secondary" onClick={handleAddCategory}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {disallowedCategories.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-[11px] flex items-center gap-1.5 font-bold"
                  >
                    {c}
                    <button
                      onClick={() => handleRemoveCategory(c)}
                      className="text-rose-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
              <span className="font-bold block mb-1">Backend Enforced:</span>
              Any agent transaction exceeding limits or falling into prohibited categories is deterministically halted by the FastAPI policy engine.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
