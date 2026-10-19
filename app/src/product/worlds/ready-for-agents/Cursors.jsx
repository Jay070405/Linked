import {useEffect, useRef} from 'react';
import {gsap} from '../../v2/motion';

/* Two multiplayer cursors on the canvas. They live in world coordinates (so they ride along when the camera moves)
   but are drawn in screen space at a constant size, as Figma draws collaborators' cursors.
   Jay moves like a person: loose, curved, slightly different timing on each axis, and selects what a frame is about
   (a 1px outline in Jay's color). The Agent moves like a reader: straight lines, steady speed, one layer at a time;
   each layer it reads gets an outline and its layer name in the Agent's color.
   Targets: [data-jay] and [data-agent="Layer name"] inside the active frame. A frame can take the Agent over with a
   root event: rfaw:agent {el, sweep} and rfaw:agent-release (the compile does). */

const ARROW = 'M1.5 1.5 1.5 17.1 6 12.8 8.9 19.4 11.7 18.2 8.9 11.7 14.9 11.7Z';

function Cursor({name, cls, refEl}) {
  return <div ref={refEl} className={`rfaw-cursor ${cls}`} aria-hidden="true">
    <svg viewBox="0 0 17 21" width="17" height="21"><path d={ARROW}/></svg>
    <span className="rfaw-cursor-name">{name}</span>
  </div>;
}

export default function Cursors({camera, root, active, arrived, intro}) {
  const jayEl = useRef(null), agentEl = useRef(null), jaySel = useRef(null), agentSel = useRef(null), tag = useRef(null);
  const st = useRef(null);
  if (!st.current) st.current = {jay: {x: 0, y: 0}, agent: {x: 0, y: 0}, jayTarget: null, agentTarget: null, read: new Set(), queue: [], busy: false, held: false, tweens: [], timer: 0, placed: false};

  // draw: project world positions through the camera
  useEffect(() => {
    if (!camera) return undefined;
    const s = st.current;
    const box = (el, target, pad) => {
      if (!el) return;
      const r = target && camera.worldRect(target);
      if (!r) { el.style.opacity = '0'; return; }
      const a = camera.project(r.x - pad, r.y - pad), c = camera.cam;
      el.style.opacity = '1';
      el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0)`;
      el.style.width = `${((r.w + pad * 2) * c.s).toFixed(1)}px`;
      el.style.height = `${((r.h + pad * 2) * c.s).toFixed(1)}px`;
    };
    const draw = () => {
      const j = camera.project(s.jay.x, s.jay.y), a = camera.project(s.agent.x, s.agent.y);
      if (jayEl.current) jayEl.current.style.transform = `translate3d(${j.x.toFixed(1)}px, ${j.y.toFixed(1)}px, 0)`;
      if (agentEl.current) agentEl.current.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0)`;
      box(jaySel.current, s.jayTarget, 6);
      box(agentSel.current, s.agentTarget, 3);
    };
    s.draw = draw;
    const off = camera.subscribe(draw);
    return () => { off(); s.draw = null; };
  }, [camera]);

  // first placement: both come in from the canvas edges a moment after the page opens
  useEffect(() => {
    if (!camera || st.current.placed) return;
    const s = st.current, c = camera.cam, vp = camera.vp;
    if (!vp) return;
    s.placed = true;
    s.jay.x = c.x + (vp.w + 40) / c.s; s.jay.y = c.y + (vp.h * .82) / c.s;
    s.agent.x = c.x + (vp.w + 40) / c.s; s.agent.y = c.y + (vp.h * .22) / c.s;
    s.draw?.();
  }, [camera, intro]);

  // per frame: Jay goes to what it's about, the Agent starts reading its layers
  useEffect(() => {
    if (!camera || active < 0) return undefined;
    const s = st.current;
    const frame = camera.rects[active]?.el;
    if (!frame) return undefined;
    const kill = () => { s.tweens.forEach(t => t.kill()); s.tweens = []; clearTimeout(s.timer); };
    const redraw = () => s.draw?.();
    const moveJay = (target, delay = 0) => {
      if (!target || target === s.jayTarget) return;
      const r = camera.worldRect(target);
      if (!r) return;
      const [ax, ay] = (target.dataset.jay || '').split(',').map(Number);
      const x = r.x + r.w * (Number.isFinite(ax) ? ax : .92), y = r.y + r.h * (Number.isFinite(ay) ? ay : .12);
      const d = Math.min(1.3, .55 + Math.hypot(x - s.jay.x, y - s.jay.y) / 2400);
      s.tweens.push(gsap.to(s.jay, {x, duration: d, delay, ease: 'power2.inOut', onUpdate: redraw}));
      s.tweens.push(gsap.to(s.jay, {y, duration: d * .86, delay: delay + d * .08, ease: 'power3.inOut', onUpdate: redraw,
        onComplete: () => { s.jayTarget = target; redraw(); }}));
      s.jayTarget = null; redraw();
    };
    // the Jay target nearest to the middle of the stage
    const pickJay = () => {
      // what the frame says it's about; failing that, its heading
      let list = [...frame.querySelectorAll('[data-jay]')].filter(el => el.getClientRects().length);
      if (!list.length) list = [...frame.querySelectorAll('h1, h2, h3')].slice(0, 1);
      if (!list.length) return null;
      const vp = camera.vp, c = camera.cam, mid = c.y + vp.h * .45 / c.s;
      return list.map(el => ({el, r: camera.worldRect(el)})).filter(o => o.r)
        .sort((a, b) => Math.abs(a.r.y + a.r.h / 2 - mid) - Math.abs(b.r.y + b.r.h / 2 - mid))[0]?.el || null;
    };
    // Agent: read the visible, unread layers top to bottom
    const visibleUnread = () => {
      const vp = camera.vp, c = camera.cam, top = c.y + 60 / c.s, bottom = c.y + (vp.h - 90) / c.s;
      return [...frame.querySelectorAll('[data-agent]')].filter(el => !s.read.has(el) && el.getClientRects().length)
        .map(el => ({el, r: camera.worldRect(el)})).filter(o => o.r && o.r.y >= top - 20 && o.r.y + Math.min(o.r.h, 40) <= bottom)
        .sort((a, b) => a.r.y - b.r.y || a.r.x - b.r.x).map(o => o.el);
    };
    const readNext = () => {
      if (s.held) return;
      const el = visibleUnread()[0];
      if (!el) { s.busy = false; return; }
      s.busy = true;
      readOne(el, () => { s.timer = setTimeout(readNext, 380); });
    };
    const readOne = (el, done, sweep = true) => {
      const r = camera.worldRect(el);
      if (!r) { done?.(); return; }
      s.read.add(el);
      const sx = r.x + 4, sy = r.y + Math.min(r.h * .5, 14);
      const d = Math.min(.9, .3 + Math.hypot(sx - s.agent.x, sy - s.agent.y) / 2600);
      // straight line, same ease on both axes: a machine's move
      s.tweens.push(gsap.to(s.agent, {x: sx, y: sy, duration: d, ease: 'power1.inOut', onUpdate: redraw, onComplete: () => {
        s.agentTarget = el;
        if (tag.current) tag.current.textContent = el.dataset.agent || 'Layer';
        redraw();
        if (!sweep) { done?.(); return; }
        const w = Math.min(r.w - 8, 560);
        s.tweens.push(gsap.to(s.agent, {x: sx + w, duration: Math.min(1.5, Math.max(.45, w / 430)), ease: 'none', onUpdate: redraw, onComplete: done}));
      }}));
    };

    kill();
    s.read = new Set(); s.held = false;
    const start = setTimeout(() => {
      moveJay(pickJay());
      s.timer = setTimeout(readNext, 260);
    }, arrived === active ? 120 : 420);

    // within a tall frame: as the camera pans, Jay follows the part on screen and the Agent picks up new layers
    let last = 0;
    const off = camera.subscribe(() => {
      const now = performance.now();
      if (now - last < 300) return;
      last = now;
      if (camera.free) return;
      const next = pickJay();
      if (next && next !== s.jayTarget && !s.tweens.some(t => t.isActive() && t.targets()[0] === s.jay)) moveJay(next);
      if (!s.busy && !s.held) readNext();
    });

    // a frame can direct the Agent itself
    const take = e => {
      const {el, sweep = false} = e.detail || {};
      s.held = true; clearTimeout(s.timer);
      s.tweens.filter(t => t.targets()[0] === s.agent).forEach(t => t.kill());
      if (!el) return;
      // the outline moves with the frame's own highlight; the cursor catches up
      s.agentTarget = el;
      if (tag.current) tag.current.textContent = el.dataset.agent || 'Layer';
      redraw();
      readOne(el, null, sweep);
    };
    const release = () => { s.held = false; s.agentTarget = null; redraw(); readNext(); };
    root.addEventListener('rfaw:agent', take);
    root.addEventListener('rfaw:agent-release', release);
    return () => { clearTimeout(start); kill(); off(); root.removeEventListener('rfaw:agent', take); root.removeEventListener('rfaw:agent-release', release); s.agentTarget = null; s.jayTarget = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, active]);

  return <div className="rfaw-cursors" aria-hidden="true">
    <div ref={jaySel} className="rfaw-sel is-jay"/>
    <div ref={agentSel} className="rfaw-sel is-agent"><span ref={tag} className="rfaw-sel-tag">Layer</span></div>
    <Cursor name="Jay" cls="is-jay" refEl={jayEl}/>
    <Cursor name="Agent" cls="is-agent" refEl={agentEl}/>
  </div>;
}
