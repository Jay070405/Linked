// The site language: Chinese or English. Shared by the full site (App.jsx) and the standalone product pages.
export const LANGUAGE_KEY = 'jay-lang';
const FORCED_KEY = 'jay-lang-forced';
const valid = value => (value === 'en' || value === 'zh' ? value : null);

/**
 * 1. ?lang=en or ?lang=zh forces a language for this visit (kept for the tab, never saved as a preference).
 * 2. A language the visitor chose with the toggle.
 * 3. The browser: Chinese for zh* browsers, English for everyone else.
 */
export function initialLanguage() {
  try {
    const forced = valid(new URLSearchParams(location.search).get('lang'));
    if (forced) { sessionStorage.setItem(FORCED_KEY, forced); return forced; }
  } catch { /* Storage is optional. */ }
  try { const forced = valid(sessionStorage.getItem(FORCED_KEY)); if (forced) return forced; } catch { /* Storage is optional. */ }
  try { const saved = valid(localStorage.getItem(LANGUAGE_KEY)); if (saved) return saved; } catch { /* Storage is optional. */ }
  return String(navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

/** Only an explicit choice is remembered, so the browser default keeps working until the visitor picks. */
export function saveLanguage(lang) {
  try { localStorage.setItem(LANGUAGE_KEY, lang); sessionStorage.removeItem(FORCED_KEY); } catch { /* The site works without storage. */ }
}
