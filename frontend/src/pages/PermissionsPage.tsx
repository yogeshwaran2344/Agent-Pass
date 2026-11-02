import React, { useState } from 'react';
import { Sliders, Shield, Save, Plus, X } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const PermissionsPage: React.FC = () => {
  const [maxPerTx, setMaxPerTx] = useState('100.00');
  const [dailyLimit, setDailyLimit] = useState('500.00');
  const [monthlyLimit, setMonthlyLimit] = useState('2000.00');
  const [humanApprovalAbove, setHumanApprovalAbove] = useState('50.00');
  const [allowedMerchants, setAllowedMerchants] = useState(['bestbuy.com', 'apple.com', 'github.com', 'amazon.com']);
  const [disallowedCategories, setDisallowedCategories] = useState(['Gambling', 'Gaming Hardware', 'Crypto', 'Gift Cards']);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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

            <Button variant="primary" leftIcon={<Save className="w-4 h-4" />}>
              Save Spending Policy
            </Button>
          </div>
        </Card>

        {/* Categorical & Merchant Firewalls */}
        <Card title="Merchant & Category Firewalls" subtitle="Domain and MCC code filtering">
          <div className="space-y-5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Approved Merchant Allowlists</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {allowedMerchants.map((m, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-slate-200 font-mono text-[11px] flex items-center gap-1.5">
                    {m}
                    <button className="text-slate-400 hover:text-rose-400"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Prohibited Purchase Categories</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {disallowedCategories.map((c, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-[11px] flex items-center gap-1.5 font-bold">
                    {c}
                    <button className="text-rose-400 hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
              <span className="font-bold block mb-1">Policy Invariance:</span>
              Child delegated agents can never exceed the boundaries set in this parent policy.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
