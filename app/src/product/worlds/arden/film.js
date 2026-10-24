import {useEffect, useRef, useState} from 'react';
import {ASSETS} from './media';
import {PHONE} from '../../v2/motion';
import {scrollRootOf} from '../../v2/motion';

/* The two scroll-scrubbed films: the opening (120 frames) and "Put them on" (60 frames, transparent). Each has a wide
   set (about 1440 px) and a phone crop (-m, about 900 px), WebP at about quality 70 (scripts/build-arden-assets.mjs).
   Loading: the first frame with the page; then, depending on the film, the next frames in order (the opening preloads
   30 so the first scrub is smooth) and the rest at idle time, coarse to fine, so a fast scrub always has a nearby frame
   and sharpens as the rest arrive. A canvas draws them. */

const idle = cb => (typeof requestIdleCallback === 'function' ? requestIdleCallback(cb, {timeout: 800}) : setTimeout(cb, 150));
const cancelIdle = id => (typeof cancelIdleCallback === 'function' ? cancelIdleCallback(id) : clearTimeout(id));

export const filmInfo = name => ASSETS.films?.[name] || null;
export const filmSrc = (info, i) => `${info.base}/${String(i + 1).padStart(3, '0')}.webp`;
/** The set for this screen: the phone crop on phones, when it exists. */
export function filmFor(name) {
  const phone = typeof window !== 'undefined' && matchMedia(PHONE).matches;
  return (phone && filmInfo(`${name}-m`)) ? `${name}-m` : filmInfo(name) ? name : null;
}

/** First `ahead` frames in order, then every 8th, 4th, 2nd frame, then the rest. */
function order(count, ahead) {
  const seen = new Set(), out = [];
  const add = i => { if (i >= 0 && i < count && !seen.has(i)) { seen.add(i); out.push(i); } };
  for (let i = 0; i <= ahead; i++) add(i);
  add(count - 1);
  for (const step of [8, 4, 2, 1]) for (let i = 0; i < count; i += step) add(i);
  return out;
}

const STORES = new Map();
function storeFor(name) {
  let s = STORES.get(name);
  if (!s) {
    const info = filmInfo(name);
    s = {name, info, frames: new Array(info.count).fill(null), started: false, done: 0, listeners: new Set(),
      nearest(i) {
        const f = this.frames;
        if (f[i]) return f[i];
        for (let k = 1; k < f.length; k++) { if (f[i - k]) return f[i - k]; if (f[i + k]) return f[i + k]; }
        return null;
      }};
    STORES.set(name, s);
  }
  return s;
}

/** Loads film `name` (already the screen's set). `when`: 'now' (the opening, on screen at load: frame 1 first, then
    `ahead` frames, the rest at idle), or 'near' (start when `boxRef` comes within `margin` of the viewport). */
export function useFilm(name, boxRef, {when = 'near', ahead = 0, margin = '1200px 0px', enabled = true} = {}) {
  const store = useRef(null);
  if (name && (!store.current || store.current.name !== name)) store.current = storeFor(name);
  const [loaded, setLoaded] = useState(0);
  useEffect(() => {
    const s = store.current;
    if (!s) return undefined;
    s.listeners.add(setLoaded);
    setLoaded(s.done);
    return () => { s.listeners.delete(setLoaded); };
  }, [name]);

  useEffect(() => {
    const s = store.current, box = boxRef.current;
    if (!s || !box || !enabled || s.started) return undefined;
    let cancelled = false, io = null, idleId = 0;
    const load = i => {
      const img = new Image();
      img.decoding = 'async';
      img.src = filmSrc(s.info, i);
      return (img.decode ? img.decode() : new Promise((res, rej) => { img.onload = res; img.onerror = rej; }))
        .then(() => { if (!s.frames[i]) { s.frames[i] = img; s.done++; } s.listeners.forEach(fn => fn(s.done)); })
        .catch(() => {});
    };
    const run = (queue, conc, then) => {
      let active = 0;
      const pump = () => {
        if (cancelled) return;
        if (!queue.length && !active) { then?.(); return; }
        while (active < conc && queue.length) { active++; load(queue.shift()).finally(() => { active--; pump(); }); }
      };
      pump();
    };
    const begin = () => {
      if (s.started) return;
      s.started = true;
      const all = order(s.info.count, ahead).filter(i => !s.frames[i]);
      // the opening: frame 1 and the next `ahead` right away, the rest when the browser is idle
      if (when === 'now') run(all.filter(i => i <= ahead), 4, () => { idleId = idle(() => run(all.filter(i => i > ahead), 3)); });
      else run(all, 4);
    };
    if (when === 'now') { begin(); return () => { cancelled = true; cancelIdle(idleId); if (s.done < s.info.count) s.started = false; }; }
    if (typeof IntersectionObserver !== 'function') { idleId = idle(begin); return () => { cancelled = true; cancelIdle(idleId); }; }
    io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); begin(); } }, {root: scrollRootOf(box), rootMargin: margin});
    io.observe(box);
    return () => { cancelled = true; io?.disconnect(); cancelIdle(idleId); if (s.done < s.info.count) s.started = false; };
  }, [boxRef, name, when, ahead, margin, enabled]);

  return {store: store.current, loaded, info: store.current?.info || null};
}

/** Draws `img` into `canvas` to fit its box: 'contain' (letterboxed; the films' own background or transparency makes
    the bars invisible) or 'cover'. Sized for this screen's density, never above the image's own size. */
export function drawFit(canvas, img, fit = 'contain') {
  if (!canvas || !img) return false;
  const r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
  if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
  const k = fit === 'cover' ? Math.max(W / img.naturalWidth, H / img.naturalHeight) : Math.min(W / img.naturalWidth, H / img.naturalHeight);
  const w = img.naturalWidth * k, h = img.naturalHeight * k;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  return true;
}
