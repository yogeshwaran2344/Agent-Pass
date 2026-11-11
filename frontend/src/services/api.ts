import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const resolveBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) return '/api/v1';
  const trimmed = envUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
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
          const refreshRes = await axios.post(`${resolveBaseUrl()}/auth/refresh`, {
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
