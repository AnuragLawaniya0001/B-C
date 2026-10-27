import { create } from 'zustand';
import { translations } from '../i18n/translations';

const getInitialLanguage = () => {
  try {
    const saved = localStorage.getItem('bc_lang');
    if (saved && (saved === 'en' || saved === 'hi')) {
      return saved;
    }
  } catch (e) {
    // Ignore localStorage read errors
  }
  return 'en';
};

export const useLanguageStore = create((set, get) => ({
  language: getInitialLanguage(),

  setLanguage: (lang) => {
    if (lang !== 'en' && lang !== 'hi') return;
    try {
      localStorage.setItem('bc_lang', lang);
    } catch (e) {}
    set({ language: lang });
  },

  toggleLanguage: () => {
    const current = get().language;
    const next = current === 'en' ? 'hi' : 'en';
    get().setLanguage(next);
  },

  t: (path, fallback = '') => {
    const lang = get().language;
    const parts = path.split('.');
    
    // Attempt lookup in active language dictionary
    let curr = translations[lang];
    for (const p of parts) {
      if (curr && typeof curr === 'object' && p in curr) {
        curr = curr[p];
      } else {
        curr = null;
        break;
      }
    }
    if (curr && typeof curr === 'string') {
      return curr;
    }

    // Fallback to English dictionary
    let fallbackCurr = translations['en'];
    for (const p of parts) {
      if (fallbackCurr && typeof fallbackCurr === 'object' && p in fallbackCurr) {
        fallbackCurr = fallbackCurr[p];
      } else {
        fallbackCurr = null;
        break;
      }
    }
    if (fallbackCurr && typeof fallbackCurr === 'string') {
      return fallbackCurr;
    }

    return fallback || path;
  },
}));
