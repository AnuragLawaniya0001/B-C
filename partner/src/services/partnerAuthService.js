import api from './api';

export const partnerAuthService = {
  login: async (email, password) => {
    const res = await api.post('/partner/auth/login', { email, password });
    return res.data || res;
  },

  getMe: async () => {
    const res = await api.get('/partner/auth/me');
    return res.data || res;
  },
};

export default partnerAuthService;
