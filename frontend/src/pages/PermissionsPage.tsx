import React, { useState, useEffect } from 'react';
import { Save, X, Check, AlertTriangle } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Agent } from '../types';
import { agentService, permissionService } from '../services';
import { getErrorMessage } from '../services/api';

export const PermissionsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [maxPerTx, setMaxPerTx] = useState('100.00');
  const [dailyLimit, setDailyLimit] = useState('500.00');
  const [monthlyLimit, setMonthlyLimit] = useState('2000.00');
  const [humanApprovalAbove, setHumanApprovalAbove] = useState('50.00');
  const [allowedMerchants, setAllowedMerchants] = useState<string[]>(['bestbuy', 'apple', 'github', 'amazon']);
  const [newMerchant, setNewMerchant] = useState('');
  const [disallowedCategories, setDisallowedCategories] = useState<string[]>(['Gambling', 'Gaming Hardware', 'Crypto', 'Gift Cards']);
  const [newCategory, setNewCategory] = useState('');

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
      }
    };
    loadAgents();
  }, []);

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
      setErrorBanner('Register and select an agent first before saving spending limits.');
      return;
    }
    setIsSaving(true);
    setSavedSuccess(false);
    setErrorBanner(null);

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
    } catch (err) {
      setErrorBanner(getErrorMessage(err));
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Permissions &amp; Spend Controls</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hard transaction limits, merchant allowlists, and category blocks evaluated before authorization.
          </p>
        </div>

        {agents.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Target agent:</span>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 font-mono text-xs"
            >
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Spending policy saved to database.</span>
        </div>
      )}

      {errorBanner && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>{errorBanner}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Spending Thresholds" subtitle="Deterministic limits enforced per agent">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Max Per-Transaction ($ USD)</label>
              <input
                type="number"
                value={maxPerTx}
                onChange={(e) => setMaxPerTx(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-mono text-sm tabular-nums"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Daily Spend Ceiling ($ USD)</label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-mono text-sm tabular-nums"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Monthly Budget ($ USD)</label>
              <input
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-mono text-sm tabular-nums"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Human Approval Threshold ($ USD)</label>
              <input
                type="number"
                value={humanApprovalAbove}
                onChange={(e) => setHumanApprovalAbove(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 font-mono text-sm tabular-nums"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Orders exceeding this amount pause for operator approval before PayPal dispatch.
              </span>
            </div>

            <Button
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              isLoading={isSaving}
              onClick={handleSavePolicy}
            >
              Save Policy
            </Button>
          </div>
        </Card>

        <Card title="Merchant & Category Rules" subtitle="Allowlists and prohibited categories">
          <div className="space-y-5 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1.5">Approved Merchants</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. target.com"
                  value={newMerchant}
                  onChange={(e) => setNewMerchant(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMerchant()}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 text-xs flex-1"
                />
                <Button size="sm" variant="secondary" onClick={handleAddMerchant}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allowedMerchants.map((m, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px] flex items-center gap-1.5"
                  >
                    {m}
                    <button
                      onClick={() => handleRemoveMerchant(m)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1.5">Blocked Categories</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. Luxury Goods"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-900 text-xs flex-1"
                />
                <Button size="sm" variant="secondary" onClick={handleAddCategory}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {disallowedCategories.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 font-mono text-[11px] flex items-center gap-1.5 font-medium"
                  >
                    {c}
                    <button
                      onClick={() => handleRemoveCategory(c)}
                      className="text-red-400 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-xs">
              <span className="font-semibold text-slate-900 block mb-0.5">Strict Policy Gate</span>
              Transactions violating limits or blocked categories are deterministically rejected on the backend.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
