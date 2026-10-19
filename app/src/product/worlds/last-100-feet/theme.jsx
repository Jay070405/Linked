import {createContext, useCallback, useEffect, useRef, useState} from 'react';

/* The case pages' shared light/dark choice: light by default, remembered in localStorage under "jl-case-theme" (every
   case page reads and writes the same key). Switching crossfades colors for 200ms (the page carries .is-theming for
   that long); with reduced motion it is instant. */

export const THEME_KEY = 'jl-case-theme';
export const ThemeContext = createContext('light');
const read = () => { try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; } };

export function useCaseTheme(reduced) {
  const [theme, setTheme] = useState(read);
  const [fading, setFading] = useState(false);
  const timer = useRef(0);
  // another case page (or tab) changed it
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

const Sun = () => <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
  <circle cx="10" cy="10" r="3.4"/><path d="M10 2.2v1.9M10 15.9v1.9M2.2 10h1.9M15.9 10h1.9M4.5 4.5l1.3 1.3M14.2 14.2l1.3 1.3M4.5 15.5l1.3-1.3M14.2 5.8l1.3-1.3"/>
</svg>;
const Moon = () => <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
  <path d="M15.6 12.6A6.4 6.4 0 0 1 7.4 4.4a6.4 6.4 0 1 0 8.2 8.2Z"/>
</svg>;

/** A small pill with a sun and a moon; the lit one is the current theme. Screen readers hear "Light" or "Dark". */
export function ThemeToggle({theme, onToggle}) {
  const dark = theme === 'dark';
  return <button type="button" className="w3-theme" onClick={onToggle} aria-label={dark ? 'Dark' : 'Light'} title={dark ? 'Switch to light' : 'Switch to dark'}>
    <span className="w3-theme-cell is-light"><Sun/></span>
    <span className="w3-theme-cell is-dark"><Moon/></span>
  </button>;
}
