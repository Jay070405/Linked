// The site language: Chinese or English. Shared by the full site (App.jsx) and the standalone product pages.
export const LANGUAGE_KEY = 'jay-lang';

export function initialLanguage() {
  try { return localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'zh'; } catch { return 'zh'; }
}

export function saveLanguage(lang) {
  try { localStorage.setItem(LANGUAGE_KEY, lang); } catch { /* The site works without storage. */ }
}
