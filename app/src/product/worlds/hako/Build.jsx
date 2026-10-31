import {createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {L, useCaseLang} from '../../i18n';
import {draw, measure} from './sketch';

/* The page builds itself the way Hako builds. Each <Build> block arrives as a hand-drawn sketch of its own layout.
   When it comes into view a persimmon selection box is dragged around it (handles pop, the size tag reads its real
   size), ultraviolet agent cursors take its regions and show their dashed "thinking" frames, then a scan line turns
   the sketch into the finished block. The visitor can drag a box around any sketch (or tap one) to build it sooner,
   and "Build the rest" builds everything at once.

   It never holds content hostage: the real content is in the page from the start (screen readers and find-in-page
   read it at once; it is only moved out of sight by two transforms that cancel out), focus inside a sketch builds it
   instantly, every block above the one being built is finished instantly, and reduced motion or the plain reading
   mode (`still`) render everything built, with no sketch at all.
   Motion is transform and opacity only: the reveal is a window (translateY −100% → 0) around content counter-moved
   by the same amount, both on the compositor; the edges, handles, cursors and scan line are transforms. */

const PageBuild = createContext({still: true});

const T_SELECT = 820, T_BUILD = 800, T_FADE = 380;   // ms: draw the box and send the agents; scan; let the chrome go
const AGENT_NAMES = ['Layout', 'Copy', 'Media', 'Type'];

let seedCount = 1;

/** Holds every block on the page: one observer, the marquee and the "build the rest" chip. */
export function BuildProvider({still, root, children}) {
  const blocks = useRef(new Map());      // node -> {phase(), go(mode)}
  const io = useRef(null), seen = useRef(null), onScreen = useRef(new Set());
  const [left, setLeft] = useState(0);   // sketches on the screen right now (the chip shows only then)
  const [mark, setMark] = useState(null); // the marquee being dragged, in root coordinates
  const {t} = useCaseLang();

  const recount = useCallback(() => {
    let n = 0;
    blocks.current.forEach((b, node) => { if (b.phase() === 'sketch' && onScreen.current.has(node)) n++; });
    setLeft(n);
  }, []);

  const go = useCallback((node, mode) => {
    const b = blocks.current.get(node);
    if (!b || b.phase() !== 'sketch') return;
    b.go(mode);
    // never leave a sketch behind the reader: anything wholly above the screen is finished at once
    if (mode === 'animate') blocks.current.forEach((o, n) => { if (n !== node && o.phase() === 'sketch' && n.getBoundingClientRect().bottom < 0) o.go('instant'); });
    recount();
  }, [recount]);

  const api = useMemo(() => ({
    still,
    register(node, b) {
      blocks.current.set(node, b);
      io.current?.observe(node); seen.current?.observe(node);
      recount();
      return () => { blocks.current.delete(node); onScreen.current.delete(node); io.current?.unobserve(node); seen.current?.unobserve(node); recount(); };
    },
    built: recount,
    go,
  }), [still, go, recount]);

  useEffect(() => {
    if (still) return undefined;
    io.current = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) go(e.target, 'animate');
    }, {rootMargin: '0px 0px -14% 0px', threshold: 0});
    // which blocks are on the screen at all: the chip offers a shortcut only while a sketch is in sight
    seen.current = new IntersectionObserver(entries => {
      for (const e of entries) { if (e.isIntersecting) onScreen.current.add(e.target); else onScreen.current.delete(e.target); }
      recount();
    }, {threshold: 0});
    blocks.current.forEach((_, node) => { io.current.observe(node); seen.current.observe(node); });
    return () => { io.current?.disconnect(); io.current = null; seen.current?.disconnect(); seen.current = null; };
  }, [still, go, recount]);

  // drag a box around a sketch (mouse or pen; on touch a tap on a sketch builds it, and scrolling stays scrolling)
  useEffect(() => {
    const node = root.current;
    if (still || !node) return undefined;
    let start = null, id = null;
    const at = e => { const r = node.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; };
    const down = e => {
      if (e.pointerType === 'touch' || e.button !== 0 || !e.target.closest?.('.hw-b-sk')) return;
      e.preventDefault();
      start = at(e); id = e.pointerId;
      node.setPointerCapture?.(id);
      setMark({x: start.x, y: start.y, w: 0, h: 0});
    };
    const move = e => {
      if (!start || e.pointerId !== id) return;
      const p = at(e);
      setMark({x: Math.min(p.x, start.x), y: Math.min(p.y, start.y), w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y)});
    };
    const up = e => {
      if (!start || e.pointerId !== id) return;
      const p = at(e), r = node.getBoundingClientRect();
      const box = {l: Math.min(p.x, start.x) + r.left, t: Math.min(p.y, start.y) + r.top, r: Math.max(p.x, start.x) + r.left, b: Math.max(p.y, start.y) + r.top};
      const click = box.r - box.l < 6 && box.b - box.t < 6;
      start = null; setMark(null);
      blocks.current.forEach((b, n) => {
        if (b.phase() !== 'sketch') return;
        const q = n.getBoundingClientRect();
        const hit = click ? (box.l >= q.left && box.l <= q.right && box.t >= q.top && box.t <= q.bottom)
          : box.l < q.right && box.r > q.left && box.t < q.bottom && box.b > q.top;
        if (hit) go(n, 'animate');
      });
    };
    const tap = e => {
      if (e.pointerType !== 'touch') return;
      const b = e.target.closest?.('.hw-b');
      if (b && e.target.closest('.hw-b-sk')) go(b, 'animate');
    };
    node.addEventListener('pointerdown', down);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', up);
    node.addEventListener('pointerup', tap);
    return () => {
      node.removeEventListener('pointerdown', down); node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up); node.removeEventListener('pointercancel', up); node.removeEventListener('pointerup', tap);
    };
  }, [still, root, go]);

  const buildAll = () => { blocks.current.forEach(b => { if (b.phase() === 'sketch') b.go('instant'); }); recount(); };

  return <PageBuild.Provider value={api}>
    {children}
    {mark ? <div className="hw-marquee" aria-hidden="true" style={{transform: `translate3d(${mark.x}px, ${mark.y}px, 0)`, width: mark.w, height: mark.h}}>
      <span>{Math.round(mark.w)} × {Math.round(mark.h)}</span>
    </div> : null}
    {still ? null : <div className={`hw-hint${left ? '' : ' is-gone'}`}>
      <div className="hw-hint-chip">
        <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="4" width="12" height="12"/><rect className="h" x="2" y="2" width="4" height="4"/><rect className="h" x="14" y="2" width="4" height="4"/><rect className="h" x="2" y="14" width="4" height="4"/><rect className="h" x="14" y="14" width="4" height="4"/></svg>
        <span className="hw-hint-fine">{t(L('Drag a box around a sketch to build it now', '在草图外面拖一个框，可以马上把它做出来'))}</span>
        <span className="hw-hint-touch">{t(L('Tap a sketch to build it now', '点一下草图，可以马上把它做出来'))}</span>
        <button type="button" onClick={buildAll} tabIndex={left ? 0 : -1}>{t(L('Build the rest', '其余的全部做出来'))}</button>
      </div>
    </div>}
  </PageBuild.Provider>;
}

/** The regions agents take: [data-region] children if the block marks them, else its largest direct children. */
function regionsOf(block, inner) {
  const base = block.getBoundingClientRect();
  let els = [...inner.querySelectorAll('[data-region]')];
  if (!els.length) {
    const top = inner.children.length === 1 ? inner.children[0] : inner;
    els = [...top.children].filter(el => el.getBoundingClientRect().height > 24);
  }
  const rects = els.map(el => ({el, r: el.getBoundingClientRect()})).filter(x => x.r.width > 30 && x.r.height > 20);
  const pick = rects.length > 3 ? [...rects].sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height).slice(0, 3).sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left) : rects;
  // each agent gets its own name: what the region holds, or the next free one
  const used = new Set();
  return pick.map(x => {
    let name = x.el.dataset.region || (x.el.matches('figure,img,video,[data-sk="media"]') || x.el.querySelector('img,video,[data-sk="media"]') ? 'Media' : /^H[1-4]$/.test(x.el.tagName) ? 'Type' : 'Copy');
    if (used.has(name)) name = AGENT_NAMES.find(n => !used.has(n)) || name;
    used.add(name);
    return {x: x.r.left - base.left, y: x.r.top - base.top, w: x.r.width, h: x.r.height, name};
  });
}

/** One block of the page that builds itself. `label` names its frame (shown above the sketch, like a canvas frame
    label); `as` picks the element. Everything else goes on the element. */
export function Build({children, label = null, as: Tag = 'div', className = '', ...rest}) {
  const page = useContext(PageBuild);
  const {t, zh} = useCaseLang();
  const ref = useRef(null), inner = useRef(null), timers = useRef([]);
  const seed = useRef(seedCount++);
  const [phase, setPhase] = useState(page.still ? 'done' : 'sketch');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [sk, setSk] = useState(null);
  const [fx, setFx] = useState(null);

  const later = (ms, fn) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // reduced motion or the plain mode, switched on later: finish now
  useEffect(() => { if (page.still) { timers.current.forEach(clearTimeout); setPhase('done'); setFx(null); } }, [page.still]);

  const go = useCallback(mode => {
    if (phaseRef.current !== 'sketch') return;
    if (mode === 'instant') { phaseRef.current = 'done'; setPhase('done'); return; }
    const block = ref.current, box = block.getBoundingClientRect();
    phaseRef.current = 'select';
    setFx({w: box.width, h: box.height, regions: regionsOf(block, inner.current)});
    setPhase('select');
    later(T_SELECT, () => { phaseRef.current = 'build'; setPhase('build'); });
    later(T_SELECT + T_BUILD, () => { phaseRef.current = 'done'; setPhase('done'); page.built?.(); });
    later(T_SELECT + T_BUILD + T_FADE, () => setFx(null));
  }, [page]);

  useLayoutEffect(() => {
    if (page.still || !ref.current) return undefined;
    return page.register(ref.current, {phase: () => phaseRef.current, go});
  }, [page, go]);

  // the sketch: measured from the real layout, again when the block changes size (fonts arriving, a resize)
  useLayoutEffect(() => {
    if (phase !== 'sketch' || !ref.current) return undefined;
    let raf = 0;
    const take = () => { raf = 0; if (ref.current && inner.current && phaseRef.current === 'sketch') setSk(measure(ref.current, inner.current)); };
    take();
    const ro = new ResizeObserver(() => { if (!raf) raf = requestAnimationFrame(take); });
    ro.observe(ref.current);
    document.fonts?.ready?.then(() => { if (!raf) raf = requestAnimationFrame(take); });
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [phase, zh]);

  const paths = useMemo(() => (sk ? draw(sk, seed.current * 97) : null), [sk]);
  const building = phase === 'select' || phase === 'build';

  return <Tag ref={ref} className={`hw-b is-${phase}${className ? ` ${className}` : ''}`}
    onFocusCapture={phase === 'done' ? undefined : () => page.go?.(ref.current, 'instant')} {...rest}>
    <div className="hw-b-win"><div ref={inner} className="hw-b-in">{children}</div></div>
    {phase !== 'done' && paths ? <div className="hw-b-sk" aria-hidden="true"><div className="hw-b-skin">
      <svg width={sk.w} height={sk.h} viewBox={`0 0 ${Math.max(1, sk.w)} ${Math.max(1, sk.h)}`}>
        <path className="hw-sk-thin" d={paths.thin}/>
        {paths.heavy.map((p, i) => <path key={i} className="hw-sk-heavy" d={p.d} style={{strokeWidth: p.w}}/>)}
      </svg>
    </div></div> : null}
    {phase !== 'done' && label ? <span className="hw-sk-label" aria-hidden="true">{t(label)} <span>· sketch v0</span></span> : null}
    {fx ? <div className={`hw-fx is-${phase}`} aria-hidden="true" style={{'--w': `${fx.w + 16}px`, '--h': `${fx.h + 16}px`}}>
      <div className="hw-fx-sel">
        <i className="hw-e is-t"/><i className="hw-e is-l"/><i className="hw-e is-b"/><i className="hw-e is-r"/>
        {['tl', 'tc', 'tr', 'ml', 'mr', 'bl', 'bc', 'br'].map(h => <i key={h} className={`hw-h is-${h}`}/>)}
        <span className="hw-fx-dim">{Math.round(fx.w)} × {Math.round(fx.h)}</span>
        <svg className="hw-fx-me" viewBox="0 0 14 18"><path d="M1 1 L13 9.5 L7.6 10.6 L5 16.5 Z"/></svg>
      </div>
      {fx.regions.map((r, i) => <div key={`f${i}`} className="hw-fx-frame" style={{left: r.x + 8 - 4, top: r.y + 8 - 4, width: r.w + 8, height: r.h + 8, '--d': `${i * 70}ms`}}>
        <span className="hw-fx-chip">✦ {r.name} · {building && phase === 'build' ? 'building' : 'thinking'}</span>
      </div>)}
      {fx.regions.map((r, i) => <div key={`a${i}`} className="hw-fx-agent" style={{'--x0': `${fx.w + 8}px`, '--y0': `${fx.h + 8}px`, '--x1': `${r.x + 8 + Math.min(r.w * 0.66, r.w - 40)}px`, '--y1': `${r.y + 8 + Math.min(r.h * 0.5, 90)}px`, '--d': `${330 + i * 90}ms`}}>
        <svg viewBox="0 0 14 18"><path d="M1 1 L13 9.5 L7.6 10.6 L5 16.5 Z"/></svg><span>Hako · {r.name}</span>
      </div>)}
      <div className="hw-fx-scanclip"><i className="hw-fx-scan"/></div>
    </div> : null}
  </Tag>;
}
