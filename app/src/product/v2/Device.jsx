import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {scrollRootOf} from './motion';

/* Devices and the prototypes inside them.
   <Phone> and <Browser> are the hardware: a frame around a screen of the prototype's own size, scaled to whatever
   width the layout gives it. <ProtoScreen> is what the screen shows: a screenshot of the requested prototype state,
   and, once the frame is near the viewport, the live prototype in an iframe underneath. Changing `screen` crossfades
   to the new screenshot (280 ms), moves the iframe to the same state, then lifts the screenshot off the live app. The
   screenshots are captures of this exact build, so the hand-over is invisible.

   A kit describes one prototype: its size, how to address a state, where its screenshots are, and how to change state
   in place: 'popstate' (the app reads ?screen= on popstate, no reload) or 'reload' (the iframe loads the new URL). */

// ---------- Atelier (D2): a 390 x 844 phone app that follows ?screen= on popstate ----------
export const PROTO_W = 390, PROTO_H = 844;
const ATELIER_PAGE = '/proto/atelier/index.html';
export const shotSrc = screen => `/assets/product/atelier/screens/${screen}.webp`;
export const protoUrl = (screen, art) => `${ATELIER_PAGE}?screen=${encodeURIComponent(screen)}${art ? `&art=${encodeURIComponent(art)}` : ''}`;
// The prototype keeps its state in localStorage under these keys (same origin as this page).
const PROTO_KEYS = ['atelier-draft', 'atelier-purchases', 'atelier-onboarded'];
export const resetProtoState = () => { try { PROTO_KEYS.forEach(k => localStorage.removeItem(k)); } catch { /* storage blocked */ } };
export const ATELIER_KIT = {w: PROTO_W, h: PROTO_H, url: protoUrl, shot: shotSrc, shotW: 780, shotH: 1688, drive: 'popstate', param: 'screen'};

// ---------- Ready for agents (D1): a 1440 x 900 desktop editor that reads ?state= once, at load ----------
// Screen names match scripts/capture-ready-for-agents-screens.mjs (round 2 of the prototype).
export const RFA_STATES = {
  'row': 'state=row', 'review': 'state=review', 'hover': 'state=hover&row=c-white-frame',
  'details': 'state=details&row=c-white-frame', 'picker': 'state=picker&row=c-white-frame', 'choice': 'state=choice',
  'bound': 'state=bound', 'after': 'state=after', 'ready': 'state=ready', 'ready-review': 'state=ready-review',
  'agent': 'state=agent', 'outline': 'state=outline',
  'review-dark': 'state=review&theme=dark', 'picker-dark': 'state=picker&row=c-white-frame&theme=dark',
};
export const rfaUrl = screen => `/proto/ready-for-agents/index.html?embed=1&${RFA_STATES[screen] || `state=${screen}`}`;
export const rfaShot = screen => `/assets/product/ready-for-agents/screens/${screen}.webp`;
export const RFA_KIT = {w: 1440, h: 900, url: rfaUrl, shot: rfaShot, shotW: 1800, shotH: 1125, drive: 'reload'};

// ---------- Choose Not to Lose (D4): a 1440-wide benefits flow addressed by ?screen= plus a plan ----------
// Screen names match scripts/capture-choose-not-to-lose-screens.mjs. Two kits over the same build:
// CNTL_KIT is a browser window (1440 x 900) whose page scrolls inside it, for the hero and the live block;
// CNTL_PAGE_KIT renders the whole page (1440 x 2080) behind a 900-tall window, so a step's camera can pan down the
// page the way a reader would scroll it.
export const CNTL_STATES = {
  'baseline': 'screen=baseline', 'scenarios': 'screen=scenarios', 'compare': 'screen=compare', 'math': 'screen=math',
  'worst-year': 'screen=worst-year', 'review-b': 'screen=review&plan=b', 'confirmation': 'screen=confirmation&plan=a',
};
export const cntlUrl = screen => `/proto/choose-not-to-lose/index.html?${CNTL_STATES[screen] || `screen=${screen}`}`;
export const CNTL_KIT = {w: 1440, h: 900, url: cntlUrl, shot: s => `/assets/product/choose-not-to-lose/screens/${s}.webp`, shotW: 1800, shotH: 1125, drive: 'reload',
  address: 'Choose Not to Lose, concept prototype: fictional plans'};
export const CNTL_PAGE_KIT = {...CNTL_KIT, h: 2080, viewH: 900, shot: s => `/assets/product/choose-not-to-lose/pages/${s}.webp`, shotH: 2600};

// ---------- Last 100 Feet (D3): a 390 x 844 phone, resident and courier, as the bare screen (?shot) ----------
// The bare screen reads ?screen= once, at load, so the iframe reloads to change state. Screen ids match the
// prototype's README and scripts/capture-last-100-feet-screens.mjs.
export const l100Url = screen => `/proto/last-100-feet/index.html?shot&screen=${encodeURIComponent(screen)}`;
export const l100Shot = screen => `/assets/product/last-100-feet/screens/${screen}.webp`;
export const L100_KIT = {w: 390, h: 844, url: l100Url, shot: l100Shot, shotW: 780, shotH: 1688, drive: 'reload'};

/** Moves an already loaded popstate-kit prototype to another screen. */
function drive(win, screen, param) {
  try {
    const url = new URL(win.location.href);
    url.searchParams.set(param, screen);
    win.history.replaceState(win.history.state, '', url);
    win.dispatchEvent(new win.PopStateEvent('popstate'));
    return true;
  } catch { return false; }
}

/** island: draw the frame's own Dynamic Island. Off by default: the round-2 Atelier prototype draws its own status bar
    and island inside the screen. */
export function Phone({children, className = '', label, island = false}) {
  return <div className={`v2-phone ${className}`} role={label ? 'group' : undefined} aria-label={label}>
    <div className="v2-phone-shell">
      <div className="v2-phone-screen">{children}</div>
      {island ? <span className="v2-phone-island" aria-hidden="true"/> : null}
    </div>
  </div>;
}

/** A plain desktop browser window. The address pill names the concept, never a real product's domain. */
export function Browser({children, className = '', label, address = 'Ready for agents, concept prototype', ratio = '1440 / 900'}) {
  return <div className={`v2-browser ${className}`} role={label ? 'group' : undefined} aria-label={label}>
    <div className="v2-browser-shell">
      <div className="v2-browser-bar" aria-hidden="true"><i/><i/><i/><span>{address}</span></div>
      <div className="v2-browser-screen" style={{aspectRatio: ratio}}>{children}</div>
    </div>
  </div>;
}

/** Transform that frames `camera` ({x, y, w} in prototype pixels) in a host `hostW` px wide, or the whole screen.
    The host shows kit.w x (kit.viewH || kit.h); a taller kit (a whole page) is clipped below that, so the camera's y
    can reach anywhere down the page. */
function frameFor(kit, camera, hostW) {
  const s = hostW / kit.w;
  if (!camera) return `scale(${s})`;
  const z = Math.max(1, kit.w / camera.w), vh = (kit.viewH || kit.h) / z;
  const x = Math.min(Math.max(0, camera.x), kit.w - kit.w / z), y = Math.min(Math.max(0, camera.y), kit.h - vh);
  return `scale(${s * z}) translate(${-x}px, ${-y}px)`;
}

/**
 * kit         which prototype (ATELIER_KIT by default, RFA_KIT)
 * screen      prototype screen or state to show
 * art         artwork id (Atelier); applied when the iframe (re)loads
 * camera      optional {x, y, w}: frame part of the screen, in prototype pixels; moves are animated
 * load        'near' (iframe once near the viewport), 'idle' (near, but not before `delay` ms), 'never' (screenshots only)
 * interactive the iframe takes pointer and keyboard input; otherwise it is inert and only illustrates
 * reload      change it to reload the iframe at the current screen and art (tasks, reset)
 */
export function ProtoScreen({kit = ATELIER_KIT, screen, art, camera, load = 'near', delay = 0, interactive = false, reduced = false, reload = 0, title = 'Prototype', alt = ''}) {
  const host = useRef(null), frame = useRef(null), seq = useRef(0), timers = useRef([]), loadedFor = useRef(null);
  const [hostW, setHostW] = useState(0);
  const [wanted, setWanted] = useState(false);     // iframe src set
  const [src, setSrc] = useState(null);
  const [ready, setReady] = useState(false);       // iframe loaded and showing `shown`
  const [layers, setLayers] = useState(() => [{k: 0, screen}]);
  const [covered, setCovered] = useState(true);    // a screenshot sits over the iframe
  const shown = useRef(screen);
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  // Re-pointing a loaded iframe replaces its document instead of navigating it: a src change would add a history
  // entry, and the reader's Back button would step through prototype states instead of leaving the page.
  const point = (name, v) => {
    loadedFor.current = name;
    const url = `${kit.url(name, art)}&v=${v}`, win = frame.current?.contentWindow;
    if (win) { try { win.location.replace(url); return; } catch { /* fall back to src */ } }
    setSrc(url);
  };

  useLayoutEffect(() => {
    const el = host.current; if (!el) return undefined;
    const measure = () => setHostW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // load the live app when the frame comes near (never on 'never')
  useEffect(() => {
    if (load === 'never' || wanted) return undefined;
    const el = host.current;
    let go = load !== 'idle', timer = 0, near = false;
    const start = () => { if (go && near) setWanted(true); };
    if (load === 'idle') timer = setTimeout(() => { go = true; start(); }, delay);
    const io = new IntersectionObserver(([entry]) => { near = entry.isIntersecting; start(); }, {root: scrollRootOf(el), rootMargin: '60% 0px'});
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(timer); };
  }, [load, delay, wanted]);

  // (re)load: cover with the target screenshot, point the iframe at the current screen
  // (runs before the screen-change effect below, so a reload that also changes screen loads straight into it)
  useEffect(() => {
    if (!wanted) return;
    shown.current = screen;
    setReady(false); setCovered(true);
    setLayers(list => list.at(-1)?.screen === screen ? list : [{k: ++seq.current, screen}]);
    point(screen, `r${reload}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, reload]);

  const onLoad = async () => {
    const win = frame.current?.contentWindow;
    try { await win?.document.fonts?.ready; } catch { /* gone */ }
    if (kit.drive === 'popstate') {
      if (shown.current !== new URL(win?.location.href || location.href).searchParams.get(kit.param)) drive(win, shown.current, kit.param);
    } else if (loadedFor.current !== shown.current) return;  // a newer state is already on its way
    setReady(true);
    // let the app finish its own entrance before lifting the screenshot off it
    later(() => { if (kit.drive === 'popstate' || loadedFor.current === shown.current) setCovered(false); }, reduced ? 0 : 450);
  };

  // screen changes
  useEffect(() => {
    if (screen === shown.current) return;
    shown.current = screen;
    const win = frame.current?.contentWindow;
    const id = ++seq.current;
    if (kit.drive === 'reload') {
      // the new screenshot covers the old state while the iframe loads the new one
      setLayers(list => reduced ? [{k: id, screen}] : [...list.slice(-1), {k: id, screen}]);
      setCovered(true); setReady(false);
      later(() => {
        setLayers(list => list.filter(l => l.k >= id));
        if (shown.current === screen && wanted) point(screen, id);
      }, reduced ? 0 : 300);
      return;
    }
    if (reduced) {
      // instant swap
      setLayers([{k: id, screen}]);
      if (ready && win && drive(win, screen, kit.param)) setCovered(false);
      return;
    }
    setLayers(list => [...list.slice(-1), {k: id, screen}]);
    setCovered(true);
    later(() => {
      setLayers(list => list.filter(l => l.k >= id));
      if (shown.current !== screen) return;
      if (ready && win && drive(win, screen, kit.param)) later(() => { if (shown.current === screen) setCovered(false); }, 320);
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const transform = hostW ? frameFor(kit, camera, hostW) : undefined;
  return <div ref={host} className={`v2-screen${interactive ? ' is-interactive' : ''}${camera ? ' has-camera' : ''}`}>
    <div className="v2-stage" style={{width: kit.w, height: kit.h, transform, visibility: hostW ? undefined : 'hidden'}}>
      {src ? <iframe ref={frame} src={src} title={title} width={kit.w} height={kit.h} onLoad={onLoad}
        tabIndex={interactive ? 0 : -1} aria-hidden={interactive ? undefined : true} inert={interactive ? undefined : true}/> : null}
      <div className={`v2-shots${covered || !ready ? '' : ' is-lifted'}`} aria-hidden={src && interactive ? true : undefined}>
        {layers.map((l, i) => <img key={l.k} className={`v2-shot${i ? ' is-new' : ''}`} src={kit.shot(l.screen)} width={kit.shotW} height={kit.shotH}
          alt={i === layers.length - 1 ? alt : ''} decoding="async" draggable="false"/>)}
      </div>
    </div>
  </div>;
}
