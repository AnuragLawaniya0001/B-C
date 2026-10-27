import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bigchamp_partner_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bigchamp_partner_token');
      localStorage.removeItem('bigchamp_partner_refresh_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const get = (url, config = {}) => api.get(url, config).then((res) => res.data);
export const post = (url, data = {}, config = {}) => api.post(url, data, config).then((res) => res.data);
export const put = (url, data = {}, config = {}) => api.put(url, data, config).then((res) => res.data);
export const patch = (url, data = {}, config = {}) => api.patch(url, data, config).then((res) => res.data);
export const del = (url, config = {}) => api.delete(url, config).then((res) => res.data);

export default api;
