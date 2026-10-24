import { create } from 'zustand';

const initialAccessToken = localStorage.getItem('bigchamp_partner_token') || null;
const initialRefreshToken = localStorage.getItem('bigchamp_partner_refresh_token') || null;

export const usePartnerAuthStore = create((set) => ({
  partnerUser: null,
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: !!initialAccessToken,

  setAuth: (partnerUser, tokens = {}) => {
    const { accessToken, refreshToken } = tokens;
    if (accessToken) {
      localStorage.setItem('bigchamp_partner_token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('bigchamp_partner_refresh_token', refreshToken);
    }
    set({
      partnerUser,
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      isAuthenticated: !!accessToken,
    });
  },

  clearAuth: () => {
    localStorage.removeItem('bigchamp_partner_token');
    localStorage.removeItem('bigchamp_partner_refresh_token');
    set({
      partnerUser: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));
