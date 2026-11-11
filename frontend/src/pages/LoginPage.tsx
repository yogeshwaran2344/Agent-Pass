import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/common/Button';
import { BrandMark } from '../components/common/BrandMark';
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
        await api.post('/auth/register', {
          email: demoEmail,
          password: demoPass,
          full_name: 'Demo Operator',
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-5">
          <BrandMark className="w-8 h-8" />
          <span className="font-bold text-lg tracking-tight text-slate-900">AgentPass</span>
        </Link>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Sign in to your account</h2>
        <p className="mt-1 text-xs text-slate-500">Access agent spending controls and PayPal settlements</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200 py-7 px-6 sm:px-8 rounded-lg shadow-card">
          {error && (
            <div className="mb-5 p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email address</label>
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Sign in
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleDemoSignIn}
              isLoading={isDemoLoading}
            >
              Continue with Demo Account
            </Button>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-slate-900 hover:underline">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
