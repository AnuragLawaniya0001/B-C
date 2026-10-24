import { create } from 'zustand';
import { adminAuthService } from '../services/adminAuthService';

const initialAccessToken = localStorage.getItem('bigchamp_admin_token') || null;
const initialRefreshToken = localStorage.getItem('bigchamp_admin_refresh_token') || null;
const initialUser = (() => {
  try {
    const raw = localStorage.getItem('bigchamp_admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
})();

export const useAdminAuthStore = create((set, get) => ({
  adminUser: initialUser,
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: !!initialAccessToken,
  isLoading: false,
  error: null,

  setAuth: (adminUser, tokens = {}) => {
    const accessToken = tokens.accessToken || tokens.access_token || null;
    const refreshToken = tokens.refreshToken || tokens.refresh_token || null;

    if (accessToken) {
      localStorage.setItem('bigchamp_admin_token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('bigchamp_admin_refresh_token', refreshToken);
    }
    if (adminUser) {
      localStorage.setItem('bigchamp_admin_user', JSON.stringify(adminUser));
    }
    set({
      adminUser,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken),
      error: null,
    });
  },

  clearAuth: () => {
    localStorage.removeItem('bigchamp_admin_token');
    localStorage.removeItem('bigchamp_admin_refresh_token');
    localStorage.removeItem('bigchamp_admin_user');
    set({
      adminUser: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminAuthService.login(email.trim(), password);
      const data = response.data || response;
      get().setAuth(data.user, {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      return { success: true, user: data.user };
    } catch (err) {
      get().clearAuth();
      const msg = err.response?.data?.detail || err.message || 'Invalid administrator credentials';
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
      const response = await adminAuthService.getMe();
      const user = response.data || response;
      localStorage.setItem('bigchamp_admin_user', JSON.stringify(user));
      set({ adminUser: user, isAuthenticated: true });
      return user;
    } catch (err) {
      get().clearAuth();
      return null;
    }
  },
}));

export default useAdminAuthStore;
