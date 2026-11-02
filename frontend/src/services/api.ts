import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: Automatically attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agentpass_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 session expiry and token invalidation
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isLoginOrRegister =
      window.location.pathname.includes('/login') ||
      window.location.pathname.includes('/register');

    if (error.response?.status === 401 && !isLoginOrRegister) {
      localStorage.removeItem('agentpass_token');
      localStorage.removeItem('agentpass_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred. Please try again.';
}

export default api;
