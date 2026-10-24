import { create } from 'zustand';

const initialAccessToken = localStorage.getItem('bigchamp_admin_token') || null;
const initialRefreshToken = localStorage.getItem('bigchamp_admin_refresh_token') || null;

export const useAdminAuthStore = create((set) => ({
  adminUser: null,
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: !!initialAccessToken,

  setAuth: (adminUser, tokens = {}) => {
    const { accessToken, refreshToken } = tokens;
    if (accessToken) {
      localStorage.setItem('bigchamp_admin_token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('bigchamp_admin_refresh_token', refreshToken);
    }
    set({
      adminUser,
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      isAuthenticated: !!accessToken,
    });
  },

  clearAuth: () => {
    localStorage.removeItem('bigchamp_admin_token');
    localStorage.removeItem('bigchamp_admin_refresh_token');
    set({
      adminUser: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));
