import api from './api';

export const adminAuthService = {
  login: async (email, password) => {
    // raw axios post via api.post helper returns res.data
    return api.post('/admin/auth/login', { email, password });
  },

  getMe: async () => {
    return api.get('/admin/auth/me');
  },
};

export default adminAuthService;
