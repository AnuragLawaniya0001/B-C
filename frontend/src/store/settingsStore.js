import { create } from 'zustand';
import { settingsService } from '../services/settingsService';

export const useSettingsStore = create((set, get) => ({
  settings: null,
  loading: false,
  error: null,

  fetchSettings: async () => {
    // If settings already loaded, don't re-trigger unless requested
    if (get().settings && !get().error) return get().settings;
    set({ loading: true, error: null });
    try {
      const data = await settingsService.getPublicSettings();
      set({ settings: data, loading: false });
      return data;
    } catch (err) {
      set({ error: err.message || 'Failed to load settings', loading: false });
      return null;
    }
  },

  getBusinessRules: () => {
    const s = get().settings;
    return s?.business_rules || {
      card_fee_paise: 10000,
      card_validity_days: 334,
      joining_cashback_percent: 10,
      cookey_price_paise: 10000,
      cookey_cooldown_days: 7,
      cookey_max_per_week: 1,
      army_extra_discount_percent: 10,
      lucky_draw_prize_paise: 50000,
      free_delivery_threshold_paise: 50000,
      default_member_discount_percent: 10,
    };
  },

  getSiteContact: () => {
    const s = get().settings;
    return s?.site_contact || {
      phone: '+91 98765 43210',
      email: 'support@bigchamp.in',
      address: 'BIGCHAMP Sports Arena, Bengaluru, India',
    };
  },

  getMembershipSettings: () => {
    const s = get().settings;
    return s?.membership_settings || null;
  },
}));

export default useSettingsStore;
