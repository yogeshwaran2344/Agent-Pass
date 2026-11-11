import React, { useState, useEffect } from 'react';
import { Settings, Save, Key, CheckCircle2, AlertTriangle, LogOut } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../store/useAuthStore';
import api, { getErrorMessage } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSavingProfile(true);
    try {
      const res = await api.patch('/users/me', { full_name: fullName.trim() });
      setUser(res.data);
      setFeedback({ type: 'success', text: 'Operator profile updated successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsChangingPassword(true);
    try {
      await api.post('/users/me/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setFeedback({ type: 'success', text: 'Password updated successfully.' });
    } catch (err) {
      setFeedback({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" />
            <span>Operator Profile & Integrations</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Platform Settings</h2>
          <p className="text-xs text-slate-400">
            Manage operator credentials, security preferences, and view PayPal Sandbox gateway configuration.
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          leftIcon={<LogOut className="w-4 h-4" />}
          onClick={() => logout()}
        >
          Sign Out & Revoke Token
        </Button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Operator Account Details" subtitle="Your AGENTPASS profile">
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Email Address</label>
              <input
                type="email"
                readOnly
                value={user?.email || 'operator@enterprise.ai'}
                className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-slate-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Role & Authority</label>
              <input
                type="text"
                readOnly
                value={user?.role?.toUpperCase() || 'AGENT_OPERATOR'}
                className="w-full px-3 py-2 bg-surface/60 border border-surface-border rounded-lg text-indigo-400 font-mono font-bold"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSavingProfile}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>
          </form>
        </Card>

        <Card title="Security & Password Rotation" subtitle="Update your Argon2id-hashed operator password">
          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">New Password (min 8 chars)</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter strong new password"
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              isLoading={isChangingPassword}
              leftIcon={<Key className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </form>
        </Card>

        <Card title="PayPal Sandbox Rails" subtitle="Payment Gateway credentials (isolated on backend)" className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
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
              <label className="block text-slate-400 font-medium mb-1">Webhook Verification Endpoint</label>
              <input
                type="text"
                readOnly
                value="/api/v1/paypal/webhook (Idempotent)"
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg text-slate-400 font-mono text-[11px]"
              />
            </div>
            <div className="md:col-span-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              PayPal Sandbox OAuth2 credentials are kept strictly in backend environment variables and are never exposed to the browser.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
