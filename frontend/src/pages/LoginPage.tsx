import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../store/useAuthStore';
import api, { getErrorMessage } from '../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const completeLogin = async (loginEmail: string, loginPassword: string) => {
    const res = await api.post('/auth/login', {
      email: loginEmail.trim(),
      password: loginPassword,
    });
    const { access_token, refresh_token } = res.data;

    const userRes = await api.get('/users/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    login(access_token, userRes.data, refresh_token);
    navigate(redirectTo, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await completeLogin(email, password);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError('');
    setIsDemoLoading(true);
    const demoEmail = 'demo@agentpass.ai';
    const demoPass = 'AgentPassDemo123!';

    try {
      try {
        await completeLogin(demoEmail, demoPass);
      } catch {
        // Auto-provision demo operator on fresh database
        await api.post('/auth/register', {
          email: demoEmail,
          password: demoPass,
          full_name: 'Demo Governance Operator',
          role: 'admin',
        });
        await completeLogin(demoEmail, demoPass);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 mx-auto mb-4 border border-indigo-400/30">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Sign in to AGENTPASS</h2>
        <p className="mt-1 text-xs text-slate-400">AI Agent Financial Governance Gateway</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface-card/90 border border-surface-border py-8 px-6 sm:px-10 rounded-2xl shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@enterprise.ai"
                  className="w-full pl-10 pr-4 py-2 bg-surface/80 border border-surface-border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2 bg-surface/80 border border-surface-border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
              Sign In to Console
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-surface-border/60">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleDemoSignIn}
              isLoading={isDemoLoading}
              leftIcon={<Sparkles className="w-4 h-4 text-indigo-400" />}
            >
              Quick Demo Operator Sign-In
            </Button>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
