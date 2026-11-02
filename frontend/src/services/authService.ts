import api from './api';
import { User } from '../types';

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export const authService = {
  async register(data: RegisterPayload): Promise<User> {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async login(data: LoginPayload): Promise<TokenResponse> {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<User> {
    const res = await api.get('/users/me');
    return res.data;
  },

  async updateProfile(data: { full_name?: string; email?: string }): Promise<User> {
    const res = await api.patch('/users/me', data);
    return res.data;
  },

  async changePassword(current_password: string, new_password: string): Promise<{ message: string }> {
    const res = await api.post('/users/me/change-password', { current_password, new_password });
    return res.data;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const res = await api.post('/auth/verify-email', { token });
    return res.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token: string, new_password: string): Promise<{ message: string }> {
    const res = await api.post('/auth/reset-password', { token, new_password });
    return res.data;
  },
};
