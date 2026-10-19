import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';

const MIN = 1, MAX = 5;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** The figure viewer CaseChrome opens. A modal <dialog> (the page behind is inert and focus stays inside), the image
    fitted to the screen, then pan and zoom: wheel or pinch to zoom toward the pointer, drag to pan, double-click to
    toggle 2.5x, +/- and 0 on the keyboard. Arrow keys and the side buttons step through the figures of the same section;
    a sideways swipe does too while the image isn't zoomed. Esc closes and focus returns to the figure that opened it.
    Opening from the keyboard, and reduced motion, skip the entrance. */
export default function Lightbox({items, index: start, keyboard, opener, reduced, onClose}) {
  const dialog = useRef(null), stage = useRef(null), img = useRef(null);
  const [index, setIndex] = useState(start);
  const [scale, setScale] = useState(1);
  const [instant, setInstant] = useState(keyboard || reduced);
  const view = useRef({s: 1, x: 0, y: 0});
  const item = items[index];
  const many = items.length > 1;

  const apply = useCallback((animate = false) => {
    const el = img.current; if (!el) return;
    const {s, x, y} = view.current;
    el.style.transition = animate && !reduced ? 'transform 220ms cubic-bezier(.23,1,.32,1)' : 'none';
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
    setScale(s);
  }, [reduced]);
  /** Keep the zoomed image covering the stage: no panning past its edges. */
  const bound = useCallback(() => {
    const el = img.current, st = stage.current; if (!el || !st) return;
    const v = view.current, w = el.offsetWidth * v.s, h = el.offsetHeight * v.s;
    const mx = Math.max(0, (w - st.clientWidth) / 2), my = Math.max(0, (h - st.clientHeight) / 2);
    v.x = clamp(v.x, -mx, mx); v.y = clamp(v.y, -my, my);
  }, []);
  /** Zoom to `s`, keeping the stage point (px, py), relative to the stage's center, where it is. */
  const zoomTo = useCallback((s, px = 0, py = 0, animate = false) => {
    const v = view.current, next = clamp(s, MIN, MAX), k = next / v.s;
    v.x = px - (px - v.x) * k; v.y = py - (py - v.y) * k; v.s = next;
    if (next === 1) { v.x = 0; v.y = 0; }
    bound(); apply(animate);
  }, [apply, bound]);
  const reset = useCallback(() => { view.current = {s: 1, x: 0, y: 0}; apply(false); }, [apply]);

  const close = useCallback(() => {
    dialog.current?.close();
  }, []);
  const go = useCallback((d, viaKeys) => {
    if (!many) return;
    setInstant(viaKeys || reduced);
    setIndex(i => (i + d + items.length) % items.length);
  }, [many, items.length, reduced]);
  useLayoutEffect(() => { reset(); }, [index, reset]);

  // open as a modal; on close, unmount and give focus back
  useEffect(() => {
    const d = dialog.current;
    d.showModal();
    d.querySelector('.atw-lb-close')?.focus();
    const html = document.documentElement, prev = html.style.overflow;
    html.style.overflow = 'hidden';
    const done = () => { html.style.overflow = prev; onClose(); opener?.focus?.({preventScroll: true}); };
    d.addEventListener('close', done);
    return () => { d.removeEventListener('close', done); html.style.overflow = prev; };
  }, [onClose, opener]);

  const onKey = e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1, true); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomTo(view.current.s * 1.5); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomTo(view.current.s / 1.5); }
    else if (e.key === '0') { e.preventDefault(); reset(); }
    else if (e.key === 'Tab') {
      // keep Tab inside the dialog's own controls
      const f = [...dialog.current.querySelectorAll('button:not([disabled])')];
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  };

  // pointers: pan, pinch, swipe, double-click; the wheel zooms
  useEffect(() => {
    const st = stage.current; if (!st) return undefined;
    const pts = new Map();
    let start = null, pinch = null, swipe = null, lastTap = 0;
    const rel = e => { const r = st.getBoundingClientRect(); return {x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2}; };
    const down = e => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      st.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, rel(e));
      if (pts.size === 1) {
        start = {p: rel(e), x: view.current.x, y: view.current.y, t: performance.now()};
        swipe = view.current.s === 1 ? {x: e.clientX, y: e.clientY} : null;
      } else if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = {d: Math.hypot(a.x - b.x, a.y - b.y), s: view.current.s, c: {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}};
        swipe = null;
      }
    };
    const move = e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, rel(e));
      if (pinch && pts.size >= 2) {
        const [a, b] = [...pts.values()];
        zoomTo(pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, pinch.c.x, pinch.c.y);
      } else if (start && view.current.s > 1) {
        const p = rel(e), v = view.current;
        v.x = start.x + p.x - start.p.x; v.y = start.y + p.y - start.p.y;
        bound(); apply(false);
      }
    };
    const up = e => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (pts.size) return;
      const p = rel(e);
      if (swipe && view.current.s === 1) {
        const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y, dt = performance.now() - start.t;
        if (Math.abs(dx) > Math.abs(dy) && (Math.abs(dx) > 70 || Math.abs(dx) / dt > .5)) { go(dx < 0 ? 1 : -1, false); start = null; return; }
      }
      const moved = start ? Math.hypot(p.x - start.p.x, p.y - start.p.y) : 99;
      if (moved < 6) {
        const now = performance.now();
        if (now - lastTap < 320) { zoomTo(view.current.s > 1 ? 1 : 2.5, p.x, p.y, true); lastTap = 0; }
        else lastTap = now;
      }
      start = null; swipe = null;
    };
    const wheel = e => {
      e.preventDefault();
      const p = rel(e);
      zoomTo(view.current.s * Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0022)), p.x, p.y);
    };
    st.addEventListener('pointerdown', down);
    st.addEventListener('pointermove', move);
    st.addEventListener('pointerup', up);
    st.addEventListener('pointercancel', up);
    st.addEventListener('wheel', wheel, {passive: false});
    return () => {
      st.removeEventListener('pointerdown', down); st.removeEventListener('pointermove', move);
      st.removeEventListener('pointerup', up); st.removeEventListener('pointercancel', up); st.removeEventListener('wheel', wheel);
    };
  }, [apply, bound, go, zoomTo]);

  return createPortal(<dialog ref={dialog} className={`atw-lb${instant ? ' is-instant' : ''}`} aria-label="Figure viewer" onKeyDown={onKey}
    onCancel={e => { e.preventDefault(); close(); }}>
    <div className="atw-lb-top">
      <p className="atw-lb-count" aria-live="polite">{many ? `${index + 1} of ${items.length}` : ''}</p>
      <div className="atw-lb-tools">
        <button type="button" onClick={() => zoomTo(view.current.s / 1.5, 0, 0, true)} disabled={scale <= MIN} aria-label="Zoom out"><Minus/></button>
        <button type="button" className="atw-lb-pct" onClick={() => (view.current.s > 1 ? zoomTo(1, 0, 0, true) : zoomTo(2, 0, 0, true))} aria-label={scale > 1 ? 'Fit to screen' : 'Zoom to 200%'}>{Math.round(scale * 100)}%</button>
        <button type="button" onClick={() => zoomTo(view.current.s * 1.5, 0, 0, true)} disabled={scale >= MAX} aria-label="Zoom in"><Plus/></button>
        <button type="button" className="atw-lb-close" onClick={close} aria-label="Close"><Cross/></button>
      </div>
    </div>
    <div ref={stage} className="atw-lb-stage">
      <img key={item.src} ref={img} className="atw-lb-img" src={item.src} alt={item.alt} width={item.w || undefined} height={item.h || undefined} draggable="false"/>
    </div>
    {many ? <>
      <button type="button" className="atw-lb-nav is-prev" onClick={e => go(-1, e.detail === 0)} aria-label="Previous figure"><Chevron/></button>
      <button type="button" className="atw-lb-nav is-next" onClick={e => go(1, e.detail === 0)} aria-label="Next figure"><Chevron/></button>
    </> : null}
    <p className="atw-lb-caption">{item.alt}</p>
  </dialog>, document.body);
}

const icon = {viewBox: '0 0 20 20', width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', 'aria-hidden': true};
const Plus = () => <svg {...icon}><path d="M10 4.5v11M4.5 10h11"/></svg>;
const Minus = () => <svg {...icon}><path d="M4.5 10h11"/></svg>;
const Cross = () => <svg {...icon}><path d="m5 5 10 10M15 5 5 15"/></svg>;
const Chevron = () => <svg {...icon}><path d="m8 4.5 5.5 5.5L8 15.5"/></svg>;
