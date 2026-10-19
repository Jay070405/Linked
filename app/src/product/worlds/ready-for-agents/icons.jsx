/* Editor glyphs, drawn on a 16 px grid at a 1 px optical weight with butt caps (the prototype's own set, after
   DESIGN-SYSTEMS.md §1.6), centred in the 24 px frames UI3 uses for its buttons. */
const P = {
  frame: <path d="M5.5 2.5v11m5-11v11m-8-8h11m-11 5h11"/>,
  section: <><rect x="2.5" y="4.5" width="11" height="9" rx="1"/><path d="M2.5 2.5h5"/></>,
  text: <path d="M3.75 4.75v-1h8.5v1M8 3.75v8.5m-1.75 0h3.5"/>,
  instance: <path d="M8 2.6 13.4 8 8 13.4 2.6 8z"/>,
  variable: <path d="M8 2 13.2 5v6L8 14l-5.2-3V5z"/>,
  'frame-v': <><rect x="3" y="2.75" width="10" height="4.25" rx="1"/><rect x="3" y="9" width="10" height="4.25" rx="1"/></>,
  code: <path d="M5.75 4.5 2.25 8l3.5 3.5m4.5-7 3.5 3.5-3.5 3.5"/>,
  play: <path d="M5.25 3.75v8.5L12 8z"/>,
  skip: <path d="M4.25 3.75v8.5L10 8zm7.5 0v8.5"/>,
  move: <path d="M4.25 2.75l8 4.6-3.6.95-1.6 3.45z"/>,
  hand: <path d="M5.5 8.5V4.25a.9.9 0 0 1 1.8 0V7.5m0-4.25a.9.9 0 0 1 1.8 0V7.5m0-3.25a.9.9 0 0 1 1.8 0v4m0-2.25a.9.9 0 0 1 1.8 0v3.4c0 2.6-1.7 4.35-4.2 4.35-1.6 0-2.6-.7-3.5-2L3.4 9.4a.95.95 0 0 1 1.5-1.1L5.5 9"/>,
  file: <path d="M8 2.5l5.5 3L8 8.5 2.5 5.5zM2.5 8 8 11l5.5-3M2.5 10.5 8 13.5l5.5-3"/>,
  agent: <><path d="M13.25 7.75a5.25 5 0 0 1-5.25 5 5.6 5.6 0 0 1-2.2-.45L2.75 13.25l.9-2.6a4.8 4.8 0 0 1-.9-2.9 5.25 5 0 0 1 10.5 0z"/><path d="M8 5.25c.2 1.3.95 2.05 2.25 2.25-1.3.2-2.05.95-2.25 2.25-.2-1.3-.95-2.05-2.25-2.25 1.3-.2 2.05-.95 2.25-2.25z"/></>,
  'chevron-down': <path d="M5.5 7 8 9.5 10.5 7"/>,
  'arrow-right': <path d="M3.5 8H12M9 5l3 3-3 3"/>,
  'arrow-down': <path d="M8 3.5V12M5 9l3 3 3-3"/>,
  'arrow-up-right': <path d="M5 11l6-6M6 5h5v5"/>,
  reset: <path d="M3.5 8a4.5 4.5 0 1 0 1.4-3.25M3.25 2.75v2.5h2.5"/>,
  story: <path d="M3 4.5h10M3 8h10M3 11.5h6"/>,
  page: <><rect x="3.5" y="2.5" width="9" height="11" rx="1"/><path d="M5.75 5.5h4.5M5.75 8h4.5M5.75 10.5h2.5"/></>,
  minus: <path d="M3.75 8h8.5"/>,
  plus: <path d="M8 3.75v8.5M3.75 8h8.5"/>,
  check: <path d="M4 8.25 6.6 10.85 12 5.25"/>,
};

export function FigIcon({name, size = 16, className = ''}) {
  return <svg className={`rfaw-icon ${className}`} viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" focusable="false">{P[name] || null}</svg>;
}
