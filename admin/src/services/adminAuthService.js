import api from './api';

export const adminAuthService = {
  login: async (email, password) => {
    const res = await api.post('/admin/auth/login', { email, password });
    return res.data || res;
  },

  getMe: async () => {
    const res = await api.get('/admin/auth/me');
    return res.data || res;
  },
};

export default adminAuthService;
