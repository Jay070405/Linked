import {useCallback, useEffect, useRef, useState} from 'react';
import {PHONE, scrollerOf, useMedia} from '../../v2/motion';
import {ASSETS} from './media';
import {drawFit} from './film';
import {clampRow, ELEVATIONS, orbitGesture, orbitKey, orbitKeyStep, orbitRows, snapOrbit} from './orbit-model';

/** Keep compressed frames in memory; decode only the displayed frame, not 288 full-size bitmaps. */
export function useOrbit(kind, stage, canvas, {reduced, enabled = true}) {
  const phone = useMedia(PHONE);
  const info = ASSETS.orbits?.[`orbit-${kind}${phone ? '-m' : ''}`];
  const [target, setTarget] = useState({az: 0, row: 3});
  const [displayed, setDisplayed] = useState(null), [parts, setParts] = useState({});
  const [near, setNear] = useState(false), [grabbing, setGrabbing] = useState(false), [error, setError] = useState(false);
  const pos = useRef(target), velocity = useRef({az: 0, row: 0}), drag = useRef(null), raf = useRef(0);
  const loader = useRef(null), painted = useRef(null), current = useRef(target);
  current.current = target;
  const show = useCallback(p => {
    pos.current = {az: p.az, row: clampRow(p.row)};
    const next = snapOrbit(pos.current);
    setTarget(old => old.az === next.az && old.row === next.row ? old : next);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, {rootMargin: '800px'});
    if (stage.current) io.observe(stage.current);
    return () => io.disconnect();
  }, [stage]);

  useEffect(() => {
    if (!info || !near) return;
    const abort = new AbortController(), frames = new Map();
    let stopped = false, idleId;
    setDisplayed(null); setParts({}); setError(false);
    const load = key => {
      if (!frames.has(key)) frames.set(key, fetch(`${info.base}/${key}.webp`, {signal: abort.signal})
        .then(r => { if (!r.ok) throw new Error(`Orbit frame: ${r.status}`); return r.blob(); })
        .catch(e => { frames.delete(key); throw e; }));
      return frames.get(key);
    };
    loader.current = load;
    if (info.parts) fetch(info.parts, {signal: abort.signal}).then(r => {
      if (!r.ok) throw new Error('Orbit anchors unavailable');
      return r.json();
    }).then(data => { if (!stopped) setParts(Object.fromEntries(data.frames.map(f => [f.file.replace('.png', ''), f.parts]))); })
      .catch(() => { if (!stopped) setError(true); });
    const row = async r => {
      const az = current.current.az;
      const queue = Array.from({length: 36}, (_, i) => orbitKey({row: r, az: (az + i) % 36}));
      await Promise.all(Array.from({length: 3}, async () => {
        while (queue.length && !stopped) { try { await load(queue.shift()); } catch { /* an interactive request retries */ } }
      }));
    };
    const rest = async () => {
      for (const r of orbitRows(current.current.row).filter(r => !initial.includes(r))) {
        if (stopped) return;
        await row(r);
      }
    };
    const initial = orbitRows(current.current.row).filter(r => Math.abs(r - current.current.row) <= 1);
    (async () => {
      for (const r of initial) { if (stopped) return; await row(r); }
      if (!stopped) idleId = window.requestIdleCallback ? requestIdleCallback(rest) : setTimeout(rest, 200);
    })();
    return () => {
      stopped = true; abort.abort(); frames.clear(); loader.current = null;
      if (window.cancelIdleCallback) cancelIdleCallback(idleId); else clearTimeout(idleId);
    };
  }, [info, near]);

  useEffect(() => {
    if (!enabled || !near || !loader.current) return;
    let cancelled = false, url;
    const key = orbitKey(target);
    loader.current(key).then(async blob => {
      if (cancelled) return;
      const img = new Image(); url = URL.createObjectURL(blob); img.src = url;
      await img.decode();
      if (cancelled) return;
      if (drawFit(canvas.current, img)) {
        painted.current = img;
        setDisplayed({...target, key}); setError(false);
      }
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [target, info, near, enabled, canvas]);
  useEffect(() => {
    const ro = new ResizeObserver(() => { if (enabled && painted.current) drawFit(canvas.current, painted.current); });
    if (stage.current) ro.observe(stage.current);
    return () => ro.disconnect();
  }, [stage, canvas, enabled]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const release = cancelled => {
    const p = pos.current;
    if (cancelled || reduced) { show(snapOrbit(p)); return; }
    let last = performance.now();
    const step = now => {
      const dt = Math.min(32, now - last); last = now;
      const v = velocity.current, decay = Math.exp(-dt / 280);
      v.az *= decay; v.row *= decay;
      show({az: pos.current.az + v.az * dt, row: pos.current.row + v.row * dt});
      if (Math.hypot(v.az, v.row) < .001) { show(snapOrbit(pos.current)); return; }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  const handlers = {
    onPointerDown(e) {
      if (!enabled || drag.current || e.button > 0 || (e.target.closest('button') && !e.target.closest('.ar-xp-hotspot'))) return; // a drag may start on a part's dot
      cancelAnimationFrame(raf.current);
      const c = canvas.current, r = c?.getBoundingClientRect();
      let onObject = false;
      if (r?.width && r.height) {
        const x = Math.floor((e.clientX - r.left) / r.width * c.width), y = Math.floor((e.clientY - r.top) / r.height * c.height);
        if (x >= 0 && y >= 0 && x < c.width && y < c.height) onObject = c.getContext('2d').getImageData(x, y, 1, 1).data[3] > 32;
      }
      const now = performance.now();
      drag.current = {id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY,
        start: now, time: now, onObject, mode: e.pointerType === 'touch' ? 'pending' : 'rotate', rowPixels: e.pointerType === 'touch' ? 44 : 56};
      velocity.current = {az: 0, row: 0};
      e.currentTarget.setPointerCapture(e.pointerId);
      setGrabbing(e.pointerType !== 'touch');
    },
    onPointerMove(e) {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      const now = performance.now(), dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (d.mode === 'pending') d.mode = orbitGesture(e.clientX - d.sx, e.clientY - d.sy, d.onObject, now - d.start);
      if (d.mode === 'scroll') {
        const sc = scrollerOf(stage.current);
        sc.scrollBy({top: -dy, behavior: 'instant'});
      } else if (d.mode === 'rotate') {
        setGrabbing(true);
        const az = dx / 14, row = dy / d.rowPixels, dt = Math.max(1, now - d.time);
        velocity.current = {az: .65 * velocity.current.az + .35 * az / dt, row: .65 * velocity.current.row + .35 * row / dt};
        show({az: pos.current.az + az, row: pos.current.row + row});
      }
      d.x = e.clientX; d.y = e.clientY; d.time = now;
    },
    onPointerUp(e) {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      drag.current = null; setGrabbing(false);
      if (performance.now() - d.time > 90) velocity.current = {az: 0, row: 0};
      if (d.mode === 'rotate') release(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    },
    onPointerCancel() { drag.current = null; setGrabbing(false); cancelAnimationFrame(raf.current); release(true); },
    onLostPointerCapture() { if (drag.current) { drag.current = null; setGrabbing(false); release(true); } },
    onKeyDown(e) {
      if (!enabled || e.target !== e.currentTarget) return;
      const next = orbitKeyStep(pos.current, e.key);
      if (!next) return;
      e.preventDefault(); cancelAnimationFrame(raf.current); show(next);
    },
  };
  const frame = displayed || {...target, key: orbitKey(target)};
  return {info, frame, anchors: displayed ? parts[displayed.key] || {} : {}, ready: !!displayed, grabbing, error, handlers,
    description: `${frame.az * 10}° azimuth, ${ELEVATIONS[frame.row]}° elevation`};
}
