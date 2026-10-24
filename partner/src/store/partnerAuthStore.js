import { create } from 'zustand';
import { partnerAuthService } from '../services/partnerAuthService';

const initialAccessToken = localStorage.getItem('bigchamp_partner_token') || null;
const initialRefreshToken = localStorage.getItem('bigchamp_partner_refresh_token') || null;
const initialUser = (() => {
  try {
    const raw = localStorage.getItem('bigchamp_partner_user');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
})();

export const usePartnerAuthStore = create((set, get) => ({
  partnerUser: initialUser,
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: !!initialAccessToken,
  isLoading: false,
  error: null,

  setAuth: (partnerUser, tokens = {}) => {
    const accessToken = tokens.accessToken || tokens.access_token || null;
    const refreshToken = tokens.refreshToken || tokens.refresh_token || null;

    if (accessToken) {
      localStorage.setItem('bigchamp_partner_token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('bigchamp_partner_refresh_token', refreshToken);
    }
    if (partnerUser) {
      localStorage.setItem('bigchamp_partner_user', JSON.stringify(partnerUser));
    }
    set({
      partnerUser,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken),
      error: null,
    });
  },

  clearAuth: () => {
    localStorage.removeItem('bigchamp_partner_token');
    localStorage.removeItem('bigchamp_partner_refresh_token');
    localStorage.removeItem('bigchamp_partner_user');
    set({
      partnerUser: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await partnerAuthService.login(email.trim(), password);
      const data = response.data || response;
      get().setAuth(data.user, {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      return { success: true, user: data.user };
    } catch (err) {
      get().clearAuth();
      const msg = err.response?.data?.detail || err.message || 'Invalid partner credentials';
      set({ error: msg });
      return {
        success: false,
        error: msg,
        status: err.response?.status,
      };
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMe: async () => {
    const token = get().accessToken;
    if (!token) return null;
    try {
      const response = await partnerAuthService.getMe();
      const user = response.data || response;
      localStorage.setItem('bigchamp_partner_user', JSON.stringify(user));
      set({ partnerUser: user, isAuthenticated: true });
      return user;
    } catch (err) {
      get().clearAuth();
      return null;
    }
  },
}));

export default usePartnerAuthStore;
