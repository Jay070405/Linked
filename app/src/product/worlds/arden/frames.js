import {useEffect, useRef, useState} from 'react';
import {frameSrc, pickWidth, seqInfo} from './media';
import {scrollRootOf} from '../../v2/motion';

/* Image sequences (Apple-style): a turntable, the lid closing on the hero's face, the temple folding. Each is a folder of
   WebP frames. The first frame is an ordinary <img> in the page (loaded with it); the rest start loading only when the
   section comes within ~1.5 screens, at idle time, coarse to fine (every 8th frame, then every 4th, …), so a scrub works
   early with the nearest loaded frame and sharpens as the rest arrive. A canvas draws the frames. */

const idle = cb => (typeof requestIdleCallback === 'function' ? requestIdleCallback(cb, {timeout: 600}) : setTimeout(cb, 120));
const cancelIdle = id => (typeof cancelIdleCallback === 'function' ? cancelIdleCallback(id) : clearTimeout(id));

/** Coarse-to-fine order: the first and last frames, then every 8th, 4th, 2nd, then the rest. */
export function loadOrder(count) {
  const seen = new Set([0, count - 1]), order = count > 1 ? [0, count - 1] : [0];
  for (const step of [count, 8, 4, 2, 1]) for (let i = 0; i < count; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
  return order;
}

/** Loads sequence `name` for the box `boxRef` (its width picks the 1600 or 800 set). Returns the store (stable) and a
    counter that bumps as frames arrive. `start` false holds loading back (reduced motion); 'intent' (the hero, already on
    screen) waits for the first sign of scrolling (wheel, touch, a key, a scroll) or 6 s of quiet, whichever comes first, so
    a visitor who never scrolls downloads one frame. */
// one store per sequence, shared by every module that shows it (the hero and the lid slider's inset draw the same frames)
const STORES = new Map();
function storeFor(name, info) {
  let s = STORES.get(name);
  if (!s) {
    s = {name, info, count: info.count, set: 1600, frames: new Array(info.count).fill(null), started: false, done: 0, listeners: new Set(),
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

export function useFrames(name, boxRef, {start = true, margin = '1500px 0px'} = {}) {
  const info = seqInfo(name);
  const store = useRef(null);
  if (!store.current && info) store.current = storeFor(name, info);
  const [loaded, setLoaded] = useState(() => store.current?.done || 0);
  useEffect(() => {
    const s = store.current;
    if (!s) return undefined;
    s.listeners.add(setLoaded);
    setLoaded(s.done);
    return () => { s.listeners.delete(setLoaded); };
  }, []);

  useEffect(() => {
    const s = store.current, box = boxRef.current;
    if (!s || !box || !start || s.started) return undefined;
    let cancelled = false, io = null, idleId = 0;
    const begin = () => {
      if (s.started) return;
      s.started = true;
      s.set = pickWidth(box.getBoundingClientRect().width || 800);
      const queue = loadOrder(s.count).filter(i => !s.frames[i]);
      let active = 0;
      const pump = () => {
        while (!cancelled && active < 4 && queue.length) {
          const i = queue.shift();
          active++;
          const img = new Image();
          img.decoding = 'async';
          img.src = frameSrc(s.name, s.set, i);
          (img.decode ? img.decode() : new Promise((res, rej) => { img.onload = res; img.onerror = rej; }))
            .then(() => { s.frames[i] = img; s.done++; if (s.done % 4 === 0 || s.done === s.count) s.listeners.forEach(f => f(s.done)); })
            .catch(() => {})
            .finally(() => { active--; if (!cancelled) pump(); });
        }
      };
      pump();
    };
    if (start === 'intent') {
      const sc = scrollRootOf(box) || window, events = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
      const go = () => { stop(); begin(); };
      const timer = setTimeout(() => { idleId = idle(go); }, 6000);
      const stop = () => { clearTimeout(timer); events.forEach(ev => removeEventListener(ev, go, true)); sc.removeEventListener('scroll', go); };
      events.forEach(ev => addEventListener(ev, go, {capture: true, passive: true}));
      sc.addEventListener('scroll', go, {passive: true});
      return () => { cancelled = true; stop(); cancelIdle(idleId); if (s.done < s.count) s.started = false; };
    }
    if (typeof IntersectionObserver !== 'function') { idleId = idle(begin); return () => { cancelled = true; cancelIdle(idleId); }; }
    io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); idleId = idle(begin); } }, {root: scrollRootOf(box), rootMargin: margin});
    io.observe(box);
    return () => { cancelled = true; io?.disconnect(); cancelIdle(idleId); if (s.done < s.count) s.started = false; };
  }, [boxRef, start, margin]);

  return {store: store.current, loaded, info};
}

/** Draws `img` into `canvas`, sized to the canvas's box at this screen's density (never above the image's own size). */
export function draw(canvas, img) {
  if (!canvas || !img) return false;
  const r = canvas.getBoundingClientRect();
  if (!r.width) return false;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.min(img.naturalWidth, Math.round(r.width * dpr)), h = Math.round(w * r.height / r.width);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return true;
}
