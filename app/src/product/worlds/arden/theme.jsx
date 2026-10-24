import {useCallback, useEffect, useRef, useState} from 'react';
import {L, UI, useCaseLang} from '../../i18n';

/* The case pages' shared light/dark choice: light by default, remembered in localStorage under "jl-case-theme" (every
   case page reads and writes the same key). Switching crossfades colors for 200 ms (the page carries .is-theming for
   that long); with reduced motion it is instant. */

export const THEME_KEY = 'jl-case-theme';
const read = () => { try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; } };

export function useCaseTheme(reduced) {
  const [theme, setTheme] = useState(read);
  const [fading, setFading] = useState(false);
  const timer = useRef(0);
  useEffect(() => {
    const sync = e => { if (e.key === THEME_KEY) setTheme(read()); };
    addEventListener('storage', sync);
    return () => { removeEventListener('storage', sync); clearTimeout(timer.current); };
  }, []);
  const toggle = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(THEME_KEY, next); } catch { /* storage blocked: the choice lasts this visit */ }
      return next;
    });
    if (reduced) return;
    setFading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFading(false), 240);
  }, [reduced]);
  return {theme, toggle, fading};
}

/** Two cells, a sun and a moon; the lit one is the current theme. Screen readers hear "Light" or "Dark". */
export function ThemeToggle({theme, onToggle}) {
  const dark = theme === 'dark';
  const {t} = useCaseLang();
  return <button type="button" className="ar-theme" onClick={onToggle} aria-label={t(dark ? UI.dark : UI.light)}
    title={t(dark ? L('Dark. Switch to light', '深色，切换到浅色') : L('Light. Switch to dark', '浅色，切换到深色'))}>
    <span className={`ar-theme-cell${dark ? '' : ' is-on'}`} aria-hidden="true">
      <svg viewBox="0 0 20 20" width="16" height="16"><circle cx="10" cy="10" r="3.3"/><path d="M10 2.4v1.8M10 15.8v1.8M2.4 10h1.8M15.8 10h1.8M4.6 4.6l1.3 1.3M14.1 14.1l1.3 1.3M4.6 15.4l1.3-1.3M14.1 5.9l1.3-1.3"/></svg>
    </span>
    <span className={`ar-theme-cell${dark ? ' is-on' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 20 20" width="16" height="16"><path d="M15.6 12.6A6.4 6.4 0 0 1 7.4 4.4a6.4 6.4 0 1 0 8.2 8.2Z"/></svg>
    </span>
  </button>;
}
