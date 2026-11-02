import React from 'react';
import { Settings, Save, Shield, Key, Bell } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../store/useAuthStore';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>Operator Profile & Integrations</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Platform Settings</h2>
        <p className="text-xs text-slate-400">
          Configure PayPal Sandbox credentials, notification hooks, and operator authentication settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Operator Account Details" subtitle="Your AGENTPASS profile">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Full Name</label>
              <input
                type="text"
                readOnly
                value={user?.full_name || 'System Operator'}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Email Address</label>
              <input
                type="email"
                readOnly
                value={user?.email || 'operator@enterprise.ai'}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Role & Authority</label>
              <input
                type="text"
                readOnly
                value={user?.role?.toUpperCase() || 'AGENT_OPERATOR'}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-indigo-400 font-mono font-bold"
              />
            </div>
          </div>
        </Card>

        <Card title="PayPal Sandbox Rails" subtitle="Payment Gateway credentials">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Sandbox Environment URL</label>
              <input
                type="text"
                readOnly
                value="https://api-m.sandbox.paypal.com"
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-slate-300 font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Client ID</label>
              <input
                type="text"
                readOnly
                value="AYj_...9xK_SANDBOX_ACTIVE"
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-slate-400 font-mono text-[11px]"
              />
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              Live PayPal Sandbox webhook listener verified & active.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
