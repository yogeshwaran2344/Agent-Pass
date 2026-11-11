import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { BrandMark } from '../components/common/BrandMark';
import { useAuthStore } from '../store/useAuthStore';
import api, { getErrorMessage } from '../services/api';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('agent_operator');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/register', {
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role,
      });

      const loginRes = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });
      const { access_token, refresh_token } = loginRes.data;

      const userRes = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      login(access_token, userRes.data, refresh_token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex">
      {/* Left Brand Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-[440px] xl:w-[480px] bg-[#0F1E36] text-white flex-col justify-between p-10 border-r border-[#1E3354]">
        <div>
          <Link to="/" className="inline-flex items-center gap-2.5">
            <BrandMark className="w-8 h-8" />
            <span className="font-bold text-lg tracking-tight">AgentPass</span>
          </Link>

          <h1 className="mt-12 text-3xl font-bold tracking-tight leading-snug">
            Launch autonomous agents with hard financial guardrails.
          </h1>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Issue scoped agent API keys, define natural-language purchase constraints, and settle verified orders over PayPal Sandbox.
          </p>

          <ul className="mt-8 space-y-3.5 text-xs text-slate-200">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Intent evaluation catches off-spec purchases before payment</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Human-in-the-loop override queue for edge cases</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Instant multi-scope Kill Switch protection</span>
            </li>
          </ul>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          PayPal Sandbox · Argon2id · Audit Chained
        </div>
      </div>

      {/* Right Sign-Up Form */}
      <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="lg:hidden mb-6 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <BrandMark className="w-8 h-8" />
              <span className="font-bold text-lg tracking-tight text-slate-900">AgentPass</span>
            </Link>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h2>
          <p className="mt-1 text-xs text-slate-500">Set up operator credentials and spending policies</p>

          <div className="mt-6 bg-white border border-slate-200 py-7 px-6 sm:px-8 rounded-lg shadow-card">
            {error && (
              <div className="mb-5 p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Work email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900"
                >
                  <option value="agent_operator">Agent Operator</option>
                  <option value="admin">Security Admin</option>
                  <option value="auditor">Auditor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Confirm password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Create account
              </Button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-700 hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
