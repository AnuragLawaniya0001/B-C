import api from './api';

export const partnerAuthService = {
  login: async (email, password) => {
    return api.post('/partner/auth/login', { email, password });
  },

  getMe: async () => {
    return api.get('/partner/auth/me');
  },
};

export default partnerAuthService;
