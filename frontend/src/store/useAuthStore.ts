import { create } from 'zustand';
import { User } from '../types';
import api from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('agentpass_user') || 'null'),
  token: localStorage.getItem('agentpass_token'),
  isAuthenticated: !!localStorage.getItem('agentpass_token'),
  isLoading: false,

  login: (token: string, user: User) => {
    localStorage.setItem('agentpass_token', token);
    localStorage.setItem('agentpass_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('agentpass_token');
      localStorage.removeItem('agentpass_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('agentpass_token');
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    try {
      const res = await api.get('/users/me');
      set({ user: res.data, isAuthenticated: true });
      localStorage.setItem('agentpass_user', JSON.stringify(res.data));
    } catch {
      localStorage.removeItem('agentpass_token');
      localStorage.removeItem('agentpass_user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
