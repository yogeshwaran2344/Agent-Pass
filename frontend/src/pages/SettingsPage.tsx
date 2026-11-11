import React, { useState, useEffect } from 'react';
import { Save, Key, CheckCircle2, AlertTriangle, LogOut } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../store/useAuthStore';
import api, { getErrorMessage } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
      setFeedback({ type: 'success', text: 'Profile updated successfully.' });
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your operator profile, password, and PayPal Sandbox connection.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
          onClick={() => logout()}
          className="text-red-700 hover:text-red-800"
        >
          Sign Out
        </Button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-md border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Operator Account" subtitle="Profile and role permissions">
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Email Address</label>
              <input
                type="email"
                readOnly
                value={user?.email || ''}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Role</label>
              <input
                type="text"
                readOnly
                value={user?.role?.toUpperCase() || 'AGENT_OPERATOR'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-mono font-semibold"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSavingProfile}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </form>
        </Card>

        <Card title="Change Password" subtitle="Argon2id credential rotation">
          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">New Password (min 8 chars)</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900"
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

        <Card title="PayPal Sandbox Rails" subtitle="Server-side gateway configuration" className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">API Environment</label>
              <input
                type="text"
                readOnly
                value="https://api-m.sandbox.paypal.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Webhook Receiver Path</label>
              <input
                type="text"
                readOnly
                value="/api/v1/paypal/webhook"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-mono text-[11px]"
              />
            </div>
            <div className="md:col-span-2 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              PayPal Sandbox client credentials are isolated in backend environment variables and are never sent to the browser.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
