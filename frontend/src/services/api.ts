import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const resolveBaseUrl = (): string => {
  const raw = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (!raw) {
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('.onrender.com')) {
      return 'https://agentpass-backend.onrender.com/api/v1';
    }
    return '/api/v1';
  }

  let url = raw.replace(/\/+$/, '');
  if (!url.startsWith('/')) {
    const hasScheme = /^https?:\/\//i.test(url);
    const hostPart = (hasScheme ? url.replace(/^https?:\/\//i, '') : url).split('/')[0];
    const isLocal = hostPart.startsWith('localhost') || hostPart.startsWith('127.0.0.1');

    if (!hasScheme) {
      url = `${isLocal ? 'http' : 'https'}://${url}`;
    }

    // Render Blueprint `fromService.property: host` injects the internal DNS name (e.g. "agentpass-backend" or "agentpass-backend:10000")
    // without ".onrender.com", which is unreachable from browsers. Expand it to the public Render URL.
    const bareHost = hostPart.split(':')[0];
    if (!isLocal && !bareHost.includes('.')) {
      url = `https://${bareHost}.onrender.com`;
    }
  }

  return url.endsWith('/api/v1') ? url : `${url}/api/v1`;
};

export const API_BASE_URL = resolveBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
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

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: Handle 401 via silent token refresh before forcing logout
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const reqUrl = originalRequest?.url || '';
    const isAuthEndpoint =
      reqUrl.includes('/auth/login') ||
      reqUrl.includes('/auth/register') ||
      reqUrl.includes('/auth/refresh');

    if (error.response?.status === 401 && !isAuthEndpoint && originalRequest && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('agentpass_refresh_token');
      if (refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: nextRefresh } = refreshRes.data;
          localStorage.setItem('agentpass_token', access_token);
          if (nextRefresh) {
            localStorage.setItem('agentpass_refresh_token', nextRefresh);
          }
          processQueue(null, access_token);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
        } finally {
          isRefreshing = false;
        }
      }

      const isLoginOrRegister =
        window.location.pathname.includes('/login') ||
        window.location.pathname.includes('/register');

      if (!isLoginOrRegister) {
        localStorage.removeItem('agentpass_token');
        localStorage.removeItem('agentpass_refresh_token');
        localStorage.removeItem('agentpass_user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (
      error.response?.status === 404 &&
      API_BASE_URL === '/api/v1' &&
      !['localhost', '127.0.0.1'].includes(window.location.hostname)
    ) {
      return 'Backend API not reachable (404). Set VITE_API_BASE_URL on your frontend service to your backend URL (e.g. https://agentpass-backend.onrender.com) and redeploy.';
    }
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail))
      return detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred. Please try again.';
}

export default api;
