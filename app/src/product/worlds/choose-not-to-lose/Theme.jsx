import {useCallback, useEffect, useRef, useState} from 'react';

/* Light or dark, for every case page: the choice is kept under one localStorage key the case pages share. In the
   receipt world, Light is a near-white desk and dark is a dark desk; the receipt stays paper-white in both, so every
   line on it reads the same and red still marks only money lost. */

export const THEME_KEY = 'jl-case-theme';
const read = () => { try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; } };

/** [theme, setTheme, fading]: `fading` is true for the 200 ms color crossfade after a change (never under reduced
    motion), so transitions only run while the theme is actually changing. */
export function useCaseTheme(reduced = false) {
  const [theme, setThemeState] = useState(read);
  const [fading, setFading] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  // another case page (or tab) changed it
  useEffect(() => {
    const sync = e => { if (e.key === THEME_KEY) setThemeState(read()); };
    addEventListener('storage', sync);
    return () => removeEventListener('storage', sync);
  }, []);
  const current = useRef(theme);
  current.current = theme;
  const setTheme = useCallback(next => {
    if (current.current === next) return;
    try { localStorage.setItem(THEME_KEY, next); } catch { /* storage blocked: the choice lasts this visit */ }
    if (!reduced) { setFading(true); clearTimeout(timer.current); timer.current = setTimeout(() => setFading(false), 260); }
    setThemeState(next);
  }, [reduced]);
  return [theme, setTheme, fading];
}

const Sun = () => <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.4 1.4M11.55 11.55l1.4 1.4M3.05 12.95l1.4-1.4M11.55 4.45l1.4-1.4"/></svg>;
const Moon = () => <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M13.5 9.6A5.6 5.6 0 0 1 6.4 2.5a5.6 5.6 0 1 0 7.1 7.1Z"/></svg>;

/** The pill: two buttons, sun and moon, the current one sitting on the thumb. */
export function ThemeToggle({theme, setTheme}) {
  return <div className={`cnr-theme is-${theme}`} role="group" aria-label="Color theme">
    <span className="cnr-theme-thumb" aria-hidden="true"/>
    <button type="button" aria-label="Light" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><Sun/></button>
    <button type="button" aria-label="Dark" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Moon/></button>
  </div>;
}
