import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {scrollRootOf} from './motion';

/* A phone and the prototype inside it.
   <Phone> is the hardware: a dark bezel around a 390 x 844 screen, scaled to whatever width the layout gives it.
   <ProtoScreen> is what the screen shows: a screenshot of the requested prototype screen, and, once the frame is
   near the viewport, the live prototype in an iframe underneath. Changing `screen` crossfades to the new screenshot
   (280 ms), drives the iframe to the same screen without reloading it, then lifts the screenshot off the live app.
   The screenshots are captures of this exact build, so the hand-over is invisible. */

export const PROTO_W = 390, PROTO_H = 844;
const PROTO = '/proto/atelier/index.html';
const SHOTS = '/assets/product/atelier/screens/';
export const shotSrc = screen => `${SHOTS}${screen}.webp`;
export const protoUrl = (screen, art) => `${PROTO}?screen=${encodeURIComponent(screen)}${art ? `&art=${encodeURIComponent(art)}` : ''}`;
// The prototype keeps its state in localStorage under these keys (same origin as this page).
const PROTO_KEYS = ['atelier-draft', 'atelier-purchases', 'atelier-onboarded'];
export const resetProtoState = () => { try { PROTO_KEYS.forEach(k => localStorage.removeItem(k)); } catch { /* storage blocked */ } };

/** Moves an already loaded prototype to another screen: the app listens for popstate and reads ?screen=. */
function drive(win, screen) {
  try {
    const url = new URL(win.location.href);
    url.searchParams.set('screen', screen);
    win.history.replaceState(win.history.state, '', url);
    win.dispatchEvent(new win.PopStateEvent('popstate'));
    return true;
  } catch { return false; }
}

/** island={false} when the screen draws its own (the round-2 prototype does). */
export function Phone({children, className = '', label, island = true}) {
  return <div className={`v2-phone ${className}`} role={label ? 'group' : undefined} aria-label={label}>
    <div className="v2-phone-shell">
      <div className="v2-phone-screen">{children}</div>
      {island ? <span className="v2-phone-island" aria-hidden="true"/> : null}
    </div>
  </div>;
}

/**
 * screen      prototype screen to show (?screen=)
 * art         artwork id for collector screens; applied when the iframe (re)loads
 * load        'near' (iframe once near the viewport), 'idle' (near, but not before `delay` ms), 'never' (screenshots only)
 * interactive the iframe takes pointer and keyboard input; otherwise it is inert and only illustrates
 * reload      change it to reload the iframe at the current screen and art (tasks, reset)
 */
export function ProtoScreen({screen, art, load = 'near', delay = 0, interactive = false, reduced = false, reload = 0, title = 'Atelier prototype', alt = ''}) {
  const host = useRef(null), frame = useRef(null), seq = useRef(0), timers = useRef([]);
  const [scale, setScale] = useState(.8);
  const [wanted, setWanted] = useState(false);     // iframe src set
  const [src, setSrc] = useState(null);
  const [ready, setReady] = useState(false);       // iframe loaded and showing `shown`
  const [layers, setLayers] = useState(() => [{k: 0, screen}]);
  const [covered, setCovered] = useState(true);    // a screenshot sits over the iframe
  const shown = useRef(screen);
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useLayoutEffect(() => {
    const el = host.current; if (!el) return undefined;
    const measure = () => setScale(el.clientWidth / PROTO_W || .8);
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
    setSrc(`${protoUrl(screen, art)}&v=${reload}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, reload]);

  const onLoad = async () => {
    const win = frame.current?.contentWindow;
    try { await win?.document.fonts?.ready; } catch { /* cross-origin or gone */ }
    if (shown.current !== new URL(win?.location.href || location.href).searchParams.get('screen')) drive(win, shown.current);
    setReady(true);
    // let the app finish its own entrance before lifting the screenshot off it
    later(() => setCovered(false), reduced ? 0 : 450);
  };

  // screen changes
  useEffect(() => {
    if (screen === shown.current) return;
    shown.current = screen;
    const win = frame.current?.contentWindow;
    if (reduced) {
      // instant swap
      setLayers([{k: ++seq.current, screen}]);
      if (ready && win && drive(win, screen)) setCovered(false);
      return;
    }
    const id = ++seq.current;
    setLayers(list => [...list.slice(-1), {k: id, screen}]);
    setCovered(true);
    later(() => {
      setLayers(list => list.filter(l => l.k === id || l.k > id));
      if (shown.current !== screen) return;
      if (ready && win && drive(win, screen)) later(() => { if (shown.current === screen) setCovered(false); }, 320);
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  return <div ref={host} className={`v2-screen${interactive ? ' is-interactive' : ''}`} style={{'--s': scale}}>
    {src ? <iframe ref={frame} src={src} title={title} width={PROTO_W} height={PROTO_H} onLoad={onLoad}
      tabIndex={interactive ? 0 : -1} aria-hidden={interactive ? undefined : true} inert={interactive ? undefined : true}/> : null}
    <div className={`v2-shots${covered || !ready ? '' : ' is-lifted'}`} aria-hidden={src && interactive ? true : undefined}>
      {layers.map((l, i) => <img key={l.k} className={`v2-shot${i ? ' is-new' : ''}`} src={shotSrc(l.screen)} width={PROTO_W * 2} height={PROTO_H * 2}
        alt={i === layers.length - 1 ? alt : ''} decoding="async" draggable="false"/>)}
    </div>
  </div>;
}
