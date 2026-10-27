import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bc_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — auto-refresh on 401
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Do not retry refresh endpoint or auth endpoints to avoid infinite loops
    const skipRefresh = [
      '/auth/refresh',
      '/auth/login',
      '/auth/register',
      '/auth/send-otp',
      '/auth/verify-otp',
    ].some((p) => original?.url?.includes(p));

    if (status === 401 && !original._retry && !skipRefresh) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject, original });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refresh = localStorage.getItem('bc_refresh_token');
        if (!refresh) {
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refresh_token: refresh,
        });

        localStorage.setItem('bc_access_token', data.access_token);
        api.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;

        // Resolve queued requests
        refreshQueue.forEach(({ resolve, original }) => {
          original.headers.Authorization = `Bearer ${data.access_token}`;
          resolve(api(original));
        });
        refreshQueue = [];

        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (refreshErr) {
        refreshQueue.forEach(({ reject }) => reject(refreshErr));
        refreshQueue = [];

        // Clear auth credentials and redirect to login
        localStorage.removeItem('bc_access_token');
        localStorage.removeItem('bc_refresh_token');
        localStorage.removeItem('bc_user');

        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=1';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const get = (url, cfg) => api.get(url, cfg);
export const post = (url, data, cfg) => api.post(url, data, cfg);
export const patch = (url, data, cfg) => api.patch(url, data, cfg);
export const del = (url, cfg) => api.delete(url, cfg);

export default api;
