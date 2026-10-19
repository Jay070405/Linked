import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {gsap, PHONE, ScrollTrigger, scrollerOf, useMedia} from './kit/motion';
import {Takeaway, Tween, useInputMode, useNear} from './kit/Try';
import {fullSrc, inches, INKS, px, thumbSrc, workOf, WORKS} from './data';
import {checkSentence, dimensions, largestSharp, printCheck, sizes} from './model';
import {composite, loadImage, separate} from './separations';

/* The press. The chosen painting is printed the way a print is built: four passes of a roller, cyan, magenta, yellow,
   then black, each laying its plate over the last (a plain RGB-to-CMYK split, multiplied on white paper). Scroll runs
   the press: the section pins and the roller sweeps across the sheet once per ink, back and forth. Then the print
   check by hand: pick any of the six sizes and a loupe shows one square inch of the print, drawn from the file's
   own pixels at that size's dpi; below 300 dpi the printer has to stretch the file and the inch goes soft.
   Reduced motion: no pinning; the four passes are shown side by side. */

// scroll progress windows for the four passes (the rest is a short hold before and after)
const PASSES = [[.05, .25], [.28, .48], [.51, .71], [.74, .94]];
const clamp01 = v => Math.min(1, Math.max(0, v));

/** Where the painting sits on its paper: the full image inside a quarter-inch white border, centered (percent). */
function placement(a, d) {
  const k = Math.min((d.w - .5) / a.originalWidth, (d.h - .5) / a.originalHeight);
  const iw = a.originalWidth * k, ih = a.originalHeight * k;
  return {iw, ih, x: (d.w - iw) / 2, y: (d.h - ih) / 2, style: {left: `${(d.w - iw) / 2 / d.w * 100}%`, top: `${(d.h - ih) / 2 / d.h * 100}%`, width: `${iw / d.w * 100}%`, height: `${ih / d.h * 100}%`}};
}

export default function Press({reduced, artId, setArtId, sizeId, setSizeId}) {
  const phone = useMedia(PHONE);
  const a = workOf(artId), top = largestSharp(a), d = dimensions(a, top), r = printCheck(a, top);
  const root = useRef(null), pin = useRef(null), area = useRef(null), roller = useRef(null), plates = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const near = useNear(root, '900px 0px');
  const [img, setImg] = useState(null);
  const [sep, setSep] = useState(null);
  const [pass, setPass] = useState(-1);
  const progress = useRef(0), passRef = useRef(-1), areaW = useRef(0);

  // load the original file and split it into plates once the press comes near (and again for another painting)
  useEffect(() => {
    if (!near) return undefined;
    let live = true;
    setSep(null);
    loadImage(fullSrc(artId)).then(im => {
      if (!live) return;
      setImg(im);
      // let the browser paint first: the split takes a few frames on the largest file
      requestAnimationFrame(() => { if (live) setSep(separate(im, artId, phone ? 760 : 1100)); });
    }).catch(() => {});
    return () => { live = false; };
  }, [near, artId, phone]);

  const render = useCallback(p => {
    progress.current = p;
    let current = p >= PASSES[3][1] ? 4 : -1;
    PASSES.forEach(([s, e], i) => {
      const q = clamp01((p - s) / (e - s)), el = plates[i].current;
      if (el) el.style.clipPath = i % 2 ? `inset(0 0 0 ${(1 - q) * 100}%)` : `inset(0 ${(1 - q) * 100}% 0 0)`;
      if (p >= s && p < (PASSES[i + 1]?.[0] ?? 1)) current = q >= 1 && i === 3 ? 4 : i;
    });
    const ro = roller.current;
    if (ro) {
      const i = Math.max(0, Math.min(3, current === 4 ? 3 : current));
      const [s, e] = PASSES[i], q = clamp01((p - s) / (e - s)), x = i % 2 ? 1 - q : q;
      ro.style.transform = `translate3d(${x * areaW.current}px, 0, 0)`;
      ro.style.setProperty('--ink', INKS[i].color);
      ro.classList.toggle('is-off', current === 4);
    }
    if (current !== passRef.current) { passRef.current = current; setPass(current); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // copy the plates into the page's canvases, then redraw the current state
  useLayoutEffect(() => {
    if (!sep) return;
    plates.forEach((ref, i) => {
      const c = ref.current; if (!c) return;
      c.width = sep.w; c.height = sep.h;
      c.getContext('2d').drawImage(sep.plates[i], 0, 0);
    });
    render(reduced ? 1 : progress.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sep, reduced]);

  // the roller's travel is the image's width
  useLayoutEffect(() => {
    const el = area.current; if (!el) return undefined;
    const ro = new ResizeObserver(() => { areaW.current = el.clientWidth; render(progress.current); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [render, artId]);

  // scroll runs the press
  useLayoutEffect(() => {
    const node = pin.current;
    if (!node || reduced) return undefined;
    const ctx = gsap.context(() => {
      const state = {p: progress.current};
      gsap.to(state, {
        p: 1, ease: 'none', onUpdate: () => render(state.p),
        scrollTrigger: {trigger: node, scroller: scrollerOf(node), pin: true, start: 'top top', end: () => `+=${Math.round(innerHeight * (phone ? 2.4 : 2.8))}`, scrub: .35, invalidateOnRefresh: true, anticipatePin: 1},
      });
    }, node);
    return () => ctx.revert();
  }, [reduced, render, phone]);

  const place = placement(a, d);
  const imageInches = (a.originalWidth / (1 / Math.min((d.w - .5) / a.originalWidth, (d.h - .5) / a.originalHeight))).toFixed(1);

  return <section ref={root} id="at-press" className={`atw-press${reduced ? ' is-still' : ''}`} aria-labelledby="at-press-title">
    <div className="atw-room-head">
      <h2 id="at-press-title" className="atw-h2">The press</h2>
      <p className="atw-lede">The print check is the heart of Atelier, so here it is by hand. Choose a painting and keep scrolling: the press lays down its four inks one pass at a time, then the file’s pixels decide how big the print can go.</p>
    </div>
    {reduced || phone ? <Picker a={a} setArtId={setArtId} className="atw-press-picker"/> : null}
    {reduced ? <StillPasses a={a} d={d} sep={sep} place={place}/> : <div ref={pin} className="atw-press-pin">
      <div className="atw-press-stage">
        <div className="atw-bed">
          <div className="atw-sheet" style={{'--pa': d.w / d.h}} role="img"
            aria-label={`${a.title}, printing on a ${d.w} by ${d.h} inch sheet${pass >= 0 ? `: ${pass >= 4 ? 'all four inks down' : `${INKS[pass].name.toLowerCase()} pass`}` : ''}`}>
            <div ref={area} className="atw-sheet-image" style={place.style}>
              {plates.map((ref, i) => <canvas key={INKS[i].id} ref={ref} className="atw-plate"/>)}
              {sep ? null : <span className="atw-sheet-wait">Preparing the plates</span>}
              <span ref={roller} className="atw-roller" aria-hidden="true"><i/></span>
            </div>
          </div>
        </div>
        <ol className="atw-fountain" aria-hidden="true">
          {INKS.map((ink, i) => <li key={ink.id} className={pass > i ? 'is-done' : pass === i ? 'is-now' : ''} style={{'--ink': ink.color}}><i/>{ink.name}</li>)}
        </ol>
      </div>
      <div className="atw-press-text">
        {phone ? null : <Picker a={a} setArtId={setArtId}/>}
        <ol className={`atw-passes${pass >= 4 ? ' is-over' : ''}`}>
          {INKS.map((ink, i) => <li key={ink.id} className={pass > i ? 'is-done' : pass === i ? 'is-now' : ''} style={{'--ink': ink.color}} aria-current={pass === i ? 'step' : undefined}>
            <span className="atw-pass-n" aria-hidden="true">{i + 1}</span>
            <p><b>{ink.name}.</b> {ink.text}</p>
          </li>)}
        </ol>
        <div className={`atw-check-note${pass >= 4 ? ' is-on' : ''}`}>
          <p><b>Then the check.</b> {a.title} is {px(a.originalWidth)} pixels wide. On a {d.w} × {d.h} in sheet the image spans {imageInches} in, so every inch of paper gets {r.dpi} of the file’s pixels.</p>
          <p>A sharp print needs about 300. Fewer, and the printer has to stretch the file to fill the paper, and the print goes soft. Atelier does this arithmetic before an artist can offer a size.</p>
        </div>
        <p className="atw-caption">A plain RGB-to-CMYK split of the file, drawn as ink on paper: how a print is built, not a printer’s real plates.</p>
      </div>
    </div>}
    <SizeCheck a={a} img={img} sizeId={sizeId} setSizeId={setSizeId} reduced={reduced}/>
  </section>;
}

/** The eight paintings as a radio group (arrow keys move and choose). */
export function Picker({a, setArtId, className = ''}) {
  const group = useRef(null);
  const onKey = e => {
    const i = WORKS.findIndex(x => x.id === a.id);
    const step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[e.key];
    if (!step) return;
    e.preventDefault();
    const next = WORKS[(i + step + WORKS.length) % WORKS.length];
    setArtId(next.id);
    group.current?.querySelector(`[data-art="${next.id}"]`)?.focus();
  };
  return <div className={`atw-picker ${className}`}>
    <div ref={group} className="atw-picker-row" role="radiogroup" aria-label="Painting to print" onKeyDown={onKey}>
      {WORKS.map(x => <button key={x.id} type="button" role="radio" data-art={x.id} aria-checked={x.id === a.id} tabIndex={x.id === a.id ? 0 : -1}
        onClick={() => setArtId(x.id)} title={x.title}>
        <img src={thumbSrc(x.id)} alt={x.title} loading="lazy" decoding="async"/>
      </button>)}
    </div>
    <p className="atw-picker-name"><b>{a.title}</b><span>{px(a.originalWidth)} × {px(a.originalHeight)} px, the original file</span></p>
  </div>;
}

/** Reduced motion: the four passes side by side, each sheet with one more ink than the last. */
function StillPasses({a, d, sep, place}) {
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  useLayoutEffect(() => { if (sep) refs.forEach((ref, i) => ref.current && composite(ref.current, sep, i + 1)); }, [sep]);  // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="atw-still">
    <ol className="atw-still-row">
      {INKS.map((ink, i) => <li key={ink.id} style={{'--ink': ink.color}}>
        <div className="atw-sheet is-small" style={{'--pa': d.w / d.h}} role="img" aria-label={`${a.title} after the ${ink.name.toLowerCase()} pass`}>
          <div className="atw-sheet-image" style={place.style}><canvas ref={refs[i]} className="atw-plate is-flat"/></div>
        </div>
        <p><span className="atw-pass-n" aria-hidden="true">{i + 1}</span><span><b>{ink.name}.</b> {ink.text}</span></p>
      </li>)}
    </ol>
    <p className="atw-caption">A plain RGB-to-CMYK split of the file, drawn as ink on paper: how a print is built, not a printer’s real plates.</p>
  </div>;
}

/* ---------- the print check, by hand ---------- */
const LOUPE = 300;   // canvas px: one inch of paper at 300 dpi fills it exactly

function SizeCheck({a, img, sizeId, setSizeId, reduced}) {
  const w = workOf(a.id);
  const [focus, setFocus] = useState(w.focus);
  const [seen, setSeen] = useState(false);
  const mode = useInputMode();
  const canvas = useRef(null);
  useEffect(() => { setFocus(workOf(a.id).focus); }, [a.id]);
  const s = sizes.find(z => z.id === sizeId) || largestSharp(a), d = dimensions(a, s), r = printCheck(a, s), top = largestSharp(a);
  const exact = 1 / Math.min((d.w - .5) / a.originalWidth, (d.h - .5) / a.originalHeight);
  const zoomX = (LOUPE / exact);
  const instant = reduced || mode.keyed.current;

  // one square inch of paper, from the file's own pixels: `exact` source pixels squeezed (or stretched) into 300
  useEffect(() => {
    const c = canvas.current; if (!c || !img) return;
    c.width = LOUPE; c.height = LOUPE;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const side = Math.min(exact, a.originalWidth, a.originalHeight);
    const sx = Math.min(Math.max(0, focus[0] * a.originalWidth - side / 2), a.originalWidth - side);
    const sy = Math.min(Math.max(0, focus[1] * a.originalHeight - side / 2), a.originalHeight - side);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, LOUPE, LOUPE);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, LOUPE * side / exact, LOUPE * side / exact);
  }, [img, exact, focus, a]);

  const choose = id => { setSizeId(id); setSeen(true); };
  const onKey = e => {
    const i = sizes.findIndex(z => z.id === s.id);
    const step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[e.key];
    if (!step) return;
    e.preventDefault();
    const next = sizes[Math.min(sizes.length - 1, Math.max(0, i + step))];
    choose(next.id);
    e.currentTarget.querySelector(`[data-size="${next.id}"]`)?.focus();
  };

  // the sheets to scale: every size outlined, the chosen one printed, the loupe's inch marked
  const S = {w: 27, h: a.originalWidth >= a.originalHeight ? 20.6 : 26};
  const floor = S.h - .8, sx0 = 1.2, sy0 = floor - d.h;
  const pl = placement(a, d);
  const ix = sx0 + pl.x + focus[0] * pl.iw - .5, iy = sy0 + pl.y + focus[1] * pl.ih - .5;
  const pick = e => {
    const svg = e.currentTarget, pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const fx = (p.x - sx0 - pl.x) / pl.iw, fy = (p.y - sy0 - pl.y) / pl.ih;
    if (fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1) { setFocus([fx, fy]); setSeen(true); }
  };

  return <div className={`atw-check${r.ok ? '' : ' is-soft'}`} {...mode.bind}>
    <div className="atw-check-head">
      <h3 className="atw-h3">How big can it go?</h3>
      <p className="atw-check-ask">Pick a size. The loupe shows one square inch of the print, made from the file’s own pixels.</p>
    </div>
    <div className="atw-check-grid">
      <figure className="atw-loupe-fig">
        <div className="atw-loupe-lens">
          <canvas ref={canvas} className="atw-loupe-canvas" role="img"
            aria-label={`One square inch of ${a.title} printed at ${d.w} by ${d.h} inches: ${r.dpi} of the file’s pixels per inch${r.ok ? ', sharp' : ', soft'}`}/>
          {img ? null : <span className="atw-sheet-wait">Loading the original file</span>}
        </div>
        <figcaption className="atw-caption">One inch of paper, enlarged. Here {Math.round(exact)} pixels of the file fill it{zoomX > 1.05 ? `, each stretched about ${zoomX.toFixed(1)} times` : ''}.</figcaption>
      </figure>
      <div className="atw-check-read">
        <div className="atw-sizes" role="radiogroup" aria-label="Print size" onKeyDown={onKey}>
          {sizes.map(z => { const ok = printCheck(a, z).ok;
            return <button key={z.id} type="button" role="radio" data-size={z.id} aria-checked={z.id === s.id} tabIndex={z.id === s.id ? 0 : -1}
              className={ok ? '' : 'is-no'} onClick={() => choose(z.id)}>{inches(a, z)}<span className="atw-sr">{ok ? ' inches, sharp' : ' inches, below 300 dpi'}</span></button>; })}
        </div>
        <p className="atw-dpi"><Tween value={r.dpi} instant={instant}/><span>dpi</span></p>
        <p className="atw-sentence" aria-live="polite">{checkSentence(a, s)}</p>
        <p className="atw-offer">Atelier offers {a.title} up to {inches(a, top)} in.</p>
        <svg className="atw-scale" viewBox={`0 0 ${S.w} ${S.h}`} onClick={pick} role="img" aria-label={`The ${d.w} by ${d.h} inch sheet drawn to scale against the other sizes; the marked square is the loupe’s inch`}>
          <path className="atw-scale-floor" d={`M0 ${floor} H${S.w}`}/>
          {sizes.map(z => { const q = dimensions(a, z); return <rect key={z.id} className={`atw-scale-ghost${printCheck(a, z).ok ? '' : ' is-no'}`} x={sx0} y={floor - q.h} width={q.w} height={q.h}/>; })}
          <rect className="atw-scale-paper" x={sx0} y={sy0} width={d.w} height={d.h}/>
          <image href={fullSrc(a.id)} x={sx0 + pl.x} y={sy0 + pl.y} width={pl.iw} height={pl.ih} preserveAspectRatio="none"/>
          <rect className="atw-scale-inch" x={ix} y={iy} width="1" height="1"/>
        </svg>
        <p className="atw-caption">Drawn to scale: every size the app offers, outlined. Click the print to move the loupe.</p>
      </div>
    </div>
    <Takeaway show={seen} instant={instant}>The file sets the ceiling, and the artist sees it before anything is on sale.</Takeaway>
  </div>;
}
