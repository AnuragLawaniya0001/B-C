import api from './api';

export const settingsService = {
  getPublicSettings: async () => {
    const res = await api.get('/settings/public');
    return res.data;
  },
};

export default settingsService;
