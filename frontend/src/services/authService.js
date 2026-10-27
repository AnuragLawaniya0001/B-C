import api from './api';

export const authService = {
  sendOtp: (identifier, purpose) =>
    api.post('/auth/send-otp', { identifier, purpose }),

  verifyOtp: (identifier, otp, purpose) =>
    api.post('/auth/verify-otp', { identifier, otp, purpose }),

  register: (payload) =>
    api.post('/auth/register', payload),

  login: (identifier, password) =>
    api.post('/auth/login', { identifier, password }),

  refresh: (refresh_token) =>
    api.post('/auth/refresh', { refresh_token }),

  logout: () =>
    api.post('/auth/logout'),

  getMe: () =>
    api.get('/auth/me'),

  updateProfile: (data) =>
    api.patch('/users/me', data),

  resetPassword: (identifier, new_password, otp) =>
    api.post('/auth/reset-password', { identifier, new_password, otp }),
};

export default authService;
