import {lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {FINE, gsap, ScrollTrigger, scrollerOf, useMedia} from './kit/motion';
import {fullSrc, inches, NUMBERS, px, wallSrc, WORKS} from './data';
import {money} from './model';

const Lightbox = lazy(() => import('./kit/Lightbox'));

/* The gallery walk. Eight of Jay's paintings hang along one wall at their true proportions, each with the label a
   collector would see in Atelier. Vertical scroll walks you along the wall (the track is pinned and moves sideways);
   the work in front of you has its light on. A fine pointer carries a soft light: over a painting it shows the original
   file, magnified, under the light. Touch: tap a painting to light it, tap again to enlarge. Keyboard: each painting is
   a button; focus lights it, Enter enlarges it. Reduced motion: no pinning, the wall scrolls sideways on its own and
   every light is on. */

// Every painting gets about the same wall area (a balanced hang); tall ones are capped.
const AREA = .29;
const hangHeight = r => Math.min(50, Math.sqrt(AREA / r) * 100);
const zoomFor = (w, cw) => Math.min(3.4, Math.max(1.6, w.originalWidth / Math.max(1, cw)));

export default function Gallery({reduced}) {
  const fine = useMedia(FINE);
  const pin = useRef(null), track = useRef(null), torch = useRef(null), walkST = useRef(null);
  const [zoom, setZoom] = useState(null);
  const [tapped, setTapped] = useState(null);

  useLayoutEffect(() => {
    const node = pin.current, rail = track.current;
    if (!node || !rail || reduced) return undefined;
    const ctx = gsap.context(() => {
      const scroller = scrollerOf(node);
      const dist = () => Math.max(0, rail.scrollWidth - node.clientWidth);
      const walk = gsap.to(rail, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {trigger: node, scroller, pin: true, start: 'top top', end: () => `+=${Math.round(dist() * .8)}`, scrub: .45, invalidateOnRefresh: true, anticipatePin: 1},
      });
      walkST.current = {st: walk.scrollTrigger, dist};
      rail.querySelectorAll('.atw-work').forEach(el => ScrollTrigger.create({
        trigger: el, containerAnimation: walk, start: 'left 68%', end: 'right 32%',
        // an attribute, not a class: React owns the class list and re-renders it while you look
        onToggle: self => el.toggleAttribute('data-lit', self.isActive),
      }));
    }, node);
    // the hang depends on fonts and the images' boxes: measure again once they settle
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh).catch(() => {});
    return () => { ctx.revert(); walkST.current = null; };
  }, [reduced]);

  // Tabbing onto a painting walks you to it: the page scrolls to where the walk puts that painting in the middle (the
  // browser would otherwise scroll the clipped wall sideways and break the walk).
  const onFocusIn = e => {
    const node = pin.current, w = walkST.current, el = e.target.closest?.('.atw-work, .atw-intro, .atw-outro');
    if (node) node.scrollLeft = 0;
    if (!w || !el || !track.current) return;
    const d = w.dist(); if (!d) return;
    const x = Math.min(d, Math.max(0, el.offsetLeft + el.offsetWidth / 2 - node.clientWidth / 2));
    const y = w.st.start + (w.st.end - w.st.start) * (x / d);
    const scroller = scrollerOf(node);
    if (scroller === window) scrollTo({top: y, behavior: 'auto'}); else scroller.scrollTop = y;
  };

  // the light you carry: a warm pool that follows a fine pointer across the wall
  useEffect(() => {
    const node = pin.current, el = torch.current;
    if (!node || !el || !fine) return undefined;
    const lag = reduced ? .001 : .5;
    const x = gsap.quickTo(el, 'x', {duration: lag, ease: 'power3'}), y = gsap.quickTo(el, 'y', {duration: lag, ease: 'power3'});
    let placed = false;
    const move = e => {
      const r = node.getBoundingClientRect();
      if (!placed) { gsap.set(el, {x: e.clientX - r.left, y: e.clientY - r.top}); placed = true; }
      x(e.clientX - r.left); y(e.clientY - r.top);
      el.classList.add('is-on');
    };
    const leave = () => { el.classList.remove('is-on'); placed = false; };
    node.addEventListener('pointermove', move, {passive: true});
    node.addEventListener('pointerleave', leave);
    return () => { node.removeEventListener('pointermove', move); node.removeEventListener('pointerleave', leave); };
  }, [fine, reduced]);

  const open = useCallback((index, keyboard, opener) => setZoom({index, keyboard, opener}), []);
  const items = WORKS.map(w => ({src: fullSrc(w.id), alt: `${w.title}. ${w.about}`, w: w.originalWidth, h: w.originalHeight}));

  return <section id="at-gallery" className={`atw-gallery${reduced ? ' is-still' : ''}`} aria-labelledby="at-gallery-title">
    <div ref={pin} className="atw-walk">
      <div className="atw-ceiling" aria-hidden="true"/>
      <div className="atw-floor" aria-hidden="true"/>
      <div ref={track} className="atw-track" onFocus={onFocusIn} tabIndex={reduced ? 0 : undefined} aria-label={reduced ? 'The collection, scroll sideways' : undefined}>
        <div className="atw-intro">
          <h2 id="at-gallery-title" className="atw-h2">The collection</h2>
          <p className="atw-walltext">Atelier’s catalog is eight of my own paintings. They hang here with the label a collector would see: the original file’s size, the largest print it makes sharp, and its price.</p>
          <p className="atw-hint">{fine ? 'Move the light across a painting to see the original file up close. Click to enlarge.' : 'Tap a painting to light it, and tap again to enlarge it.'}</p>
          <dl className="atw-facts">
            {NUMBERS.map(n => <div key={n.label}>
              <dt>{n.label}</dt>
              <dd className="atw-fact-n">{n.value}{n.unit ? <small> {n.unit}</small> : null}</dd>
              <dd className="atw-fact-note">{n.note}</dd>
            </div>)}
          </dl>
        </div>
        {WORKS.map((w, i) => <Work key={w.id} w={w} index={i} fine={fine} tapped={tapped === w.id} lit={reduced}
          onTap={() => setTapped(w.id)} onOpen={open}/>)}
        <div className="atw-outro">
          <p className="atw-walltext">Seven of these eight files top out at a 5 × 3 inch print. Only <em>The Blue Hour</em>, at 4,096 pixels across, reaches 10 × 8.</p>
          <p className="atw-walltext is-quiet">That limit is the check Atelier runs before a size can go on sale. The press, further down, runs it by hand.</p>
        </div>
      </div>
      {fine ? <div ref={torch} className="atw-torch" aria-hidden="true"/> : null}
    </div>
    <p className="atw-caption atw-gallery-note">Labels: the prototype’s own numbers. A size is listed only if the whole painting prints at 300 dpi or more inside a quarter-inch white border; $38 is the prototype’s default price for the largest size.</p>
    {zoom ? <Suspense fallback={null}><Lightbox items={items} index={zoom.index} keyboard={zoom.keyboard} opener={zoom.opener} reduced={reduced} onClose={() => setZoom(null)}/></Suspense> : null}
  </section>;
}

function Work({w, index, fine, tapped, lit, onTap, onOpen}) {
  const canvas = useRef(null), loupe = useRef(null), hi = useRef(null), lastType = useRef('mouse');
  const [wantHi, setWantHi] = useState(false);
  const [look, setLook] = useState(false);
  const r = w.originalWidth / w.originalHeight;
  const {w: pw, h: ph} = (() => { const [a, b] = inches(w, w.top).split(' × '); return {w: a, h: b}; })();

  /** Puts the light at (x, y), in px inside the painting. */
  const place = useCallback((x, y) => {
    const c = canvas.current, l = loupe.current, h = hi.current;
    if (!c || !l || !h) return;
    const cw = c.clientWidth, ch = c.clientHeight, z = zoomFor(w, cw);
    h.style.width = `${cw * z}px`; h.style.height = `${ch * z}px`;
    h.style.transform = `translate3d(${x - x * z}px, ${y - y * z}px, 0)`;
    l.style.setProperty('--x', `${x}px`); l.style.setProperty('--y', `${y}px`);
  }, [w]);
  const placeAt = (cx, cy) => { const b = canvas.current.getBoundingClientRect(); place(cx - b.left, cy - b.top); };
  const placeFocus = () => { const c = canvas.current; place(c.clientWidth * w.focus[0], c.clientHeight * w.focus[1]); };

  useEffect(() => { if (tapped) setWantHi(true); else if (lastType.current === 'touch') setLook(false); }, [tapped]);

  return <article className={`atw-work${look ? ' is-looking' : ''}`} data-lit={lit ? '' : undefined} style={{'--r': r, '--hv': hangHeight(r)}} aria-labelledby={`atw-w-${w.id}`}>
    <div className="atw-hang">
      <span className="atw-cone" aria-hidden="true"/>
      <span className="atw-pool" aria-hidden="true"/>
      <button type="button" className="atw-frame" aria-label={`${w.title}: enlarge`}
        onPointerDown={e => { lastType.current = e.pointerType; }}
        onPointerEnter={e => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') { setWantHi(true); setLook(true); placeAt(e.clientX, e.clientY); } }}
        onPointerMove={e => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') placeAt(e.clientX, e.clientY); }}
        onPointerLeave={e => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') setLook(false); }}
        onFocus={e => { if (e.target.matches(':focus-visible')) { setWantHi(true); setLook(true); placeFocus(); } }}
        onBlur={() => { if (lastType.current !== 'touch') setLook(false); }}
        onClick={e => {
          const keyboard = e.detail === 0;
          if (!keyboard && lastType.current === 'touch' && !tapped) { onTap(); setLook(true); placeAt(e.clientX, e.clientY); return; }
          onOpen(index, keyboard, e.currentTarget);
        }}>
        <span className="atw-mat">
          <span ref={canvas} className="atw-canvas">
            <img className="atw-base" src={wallSrc(w.id)} width={w.originalWidth} height={w.originalHeight} alt="" loading={index < 2 ? 'eager' : 'lazy'} decoding="async" draggable="false"/>
            <span ref={loupe} className="atw-loupe" aria-hidden="true">
              <img ref={hi} className="atw-hires" src={wantHi ? fullSrc(w.id) : wallSrc(w.id)} alt="" decoding="async" draggable="false"/>
            </span>
          </span>
        </span>
      </button>
    </div>
    <div className="atw-label">
      <h3 id={`atw-w-${w.id}`} className="atw-label-title">{w.title}</h3>
      <p className="atw-label-by">Jay Lin</p>
      <p className="atw-label-about">{w.about}</p>
      <dl className="atw-label-dl">
        <div><dt>Original file</dt><dd>{px(w.originalWidth)} × {px(w.originalHeight)} px</dd></div>
        <div><dt>Prints sharp up to</dt><dd>{pw} × {ph} in</dd></div>
      </dl>
      <p className="atw-label-price">{money(38)}</p>
    </div>
  </article>;
}
