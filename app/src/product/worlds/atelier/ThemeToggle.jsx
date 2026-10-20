import {useCallback, useEffect, useRef, useState} from 'react';
import {L, UI, useCaseLang} from '../../i18n';

/* The case pages' light switch (the same control on all four case pages, each built in its own folder).
   Light is the default; the choice is remembered across case pages in localStorage `jl-case-theme`. A switch adds
   `is-theming` to the page for the length of the crossfade (the stylesheet transitions its color tokens, 200 ms, no
   movement); reduced motion switches at once. */
export const THEME_KEY = 'jl-case-theme';
const read = () => { try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; } };

export function useCaseTheme() {
  const [theme, setTheme] = useState(read);
  // another case page (or tab) changed it
  useEffect(() => {
    const sync = e => { if (e.key === THEME_KEY) setTheme(read()); };
    addEventListener('storage', sync);
    return () => removeEventListener('storage', sync);
  }, []);
  const choose = useCallback(next => {
    setTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* storage blocked: the choice lasts this visit */ }
  }, []);
  return [theme, choose];
}

/** A small pill under the nav bar, top right: sun and moon, the current one filled. Its accessible name is the
    current theme, "Light" or "Dark"; pressing it switches to the other. */
export default function ThemeToggle({theme, onChange, root, reduced}) {
  const {t} = useCaseLang();
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const flip = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const node = root?.current;
    if (node && !reduced) {
      clearTimeout(timer.current);
      node.classList.add('is-theming');
      timer.current = setTimeout(() => node.classList.remove('is-theming'), 260);
    }
    onChange(next);
  };
  const dark = theme === 'dark';
  return <button type="button" className="atw-theme" onClick={flip} aria-label={t(dark ? UI.dark : UI.light)}
    title={t(dark ? L('Dark gallery. Switch to light', '深色展厅，切换到浅色') : L('Light gallery. Switch to dark', '浅色展厅，切换到深色'))}>
    <i className={dark ? '' : 'is-on'} aria-hidden="true">
      <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.4"/><path d="M10 2.2v1.9M10 15.9v1.9M2.2 10h1.9M15.9 10h1.9M4.5 4.5l1.3 1.3M14.2 14.2l1.3 1.3M4.5 15.5l1.3-1.3M14.2 5.8l1.3-1.3"/></svg>
    </i>
    <i className={dark ? 'is-on' : ''} aria-hidden="true">
      <svg viewBox="0 0 20 20"><path d="M15.8 12.3A6.3 6.3 0 0 1 7.7 4.2a6.3 6.3 0 1 0 8.1 8.1Z"/></svg>
    </i>
  </button>;
}
