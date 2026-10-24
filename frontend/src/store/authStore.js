import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('bc_user') || 'null'),
  accessToken: localStorage.getItem('bc_access_token') || null,
  refreshToken: localStorage.getItem('bc_refresh_token') || null,
  isAuthenticated: !!localStorage.getItem('bc_access_token'),
  isLoading: false,
  error: null,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('bc_user', JSON.stringify(user));
    localStorage.setItem('bc_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('bc_refresh_token', refreshToken);
    }
    set({
      user,
      accessToken,
      refreshToken: refreshToken || get().refreshToken,
      isAuthenticated: true,
      error: null,
    });
  },

  setUser: (user) => {
    localStorage.setItem('bc_user', JSON.stringify(user));
    set({ user });
  },

  clearAuth: () => {
    localStorage.removeItem('bc_user');
    localStorage.removeItem('bc_access_token');
    localStorage.removeItem('bc_refresh_token');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  login: async (identifier, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authService.login(identifier, password);
      get().setAuth(data.user, data.access_token, data.refresh_token);
      return { success: true, user: data.user };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed';
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
    try {
      const { data } = await authService.getMe();
      // Backend /auth/me returns user object directly
      get().setUser(data);
      return data;
    } catch (err) {
      get().clearAuth();
      return null;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (_) {
      // Ignore network errors on logout
    }
    get().clearAuth();
  },

  // Computed helper for feature gating
  hasMembership: () => get().user?.has_membership === true,
}));

export default useAuthStore;
