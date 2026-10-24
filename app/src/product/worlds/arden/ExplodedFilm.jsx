import {partAnchors} from './part-anchors.mjs';
import PartSpecs from './PartSpecs';
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {useCaseLang} from '../../i18n';
import {scrollerOf} from '../../v2/motion';
import {useOrbit} from './useOrbit';
import {drawFit, filmFor, filmInfo, useFilm} from './film';
import {INSIDE, INSIDE_X, PARTS} from './content';

/* The assembly film hands off to the two-axis orbit at elevation 12°, azimuth 0°.
   Pinned while it comes apart with the scroll; once apart, drag in either axis. Small dots ride on their
   per-frame anchors, hiding when a part is behind another. Hover or focus reveals numbers and a name;
   filter chips reveal their parts' numbers. The complete table waits behind "Show the numbers".
   Reduced motion: not pinned, already apart, turning without inertia. */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export default function ExplodedFilm({reduced}) {
  const {t, lang} = useCaseLang();
  const apartName = useMemo(() => filmFor('explode'), []);
  const apart = filmInfo(apartName);
  const run = useRef(null), pin = useRef(null), stage = useRef(null), canvas = useRef(null);
  const A = useFilm(apartName, run, {when: 'near', margin: '1500px 0px'});
  const [p, setP] = useState(reduced ? 1 : 0);
  const [active, setActive] = useState(null), [focused, setFocused] = useState(null), [chip, setChip] = useState(null);
  const [numbers, setNumbers] = useState(false);
  const [filmParts, setFilmParts] = useState({}), [paintedFrame, setPaintedFrame] = useState(null);
  const apartK = reduced ? 1 : clamp((p - .04) / .62);
  const spinning = apartK >= 1;
  const orbit = useOrbit('exploded', stage, canvas, {reduced, enabled: spinning});

  useEffect(() => {
    if (!apart.parts) return undefined;
    const abort = new AbortController();
    fetch(apart.parts, {signal: abort.signal}).then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !abort.signal.aborted) setFilmParts(Object.fromEntries(data.frames.map(f => [f.frame - 1, f.parts]))); })
      .catch(() => {});
    return () => abort.abort();
  }, [apart.parts]);

  // the pin: how far through it the page is
  useLayoutEffect(() => {
    const node = run.current, st = pin.current;
    if (!node || !st || reduced) return undefined;
    const sc = scrollerOf(node);
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = node.getBoundingClientRect(), top = parseFloat(getComputedStyle(st).top) || 0;
      setP(Math.round(clamp((top - r.top) / Math.max(1, r.height - st.offsetHeight)) * 400) / 400);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    sc.addEventListener('scroll', on, {passive: true});
    addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); sc.removeEventListener('scroll', on); removeEventListener('resize', on); };
  }, [reduced]);

  // The assembly film hands the same canvas to the orbit at e12_a000.
  const paint = useCallback(() => {
    if (spinning) return;
    const img = A.store?.nearest(Math.round(apartK * (apart.count - 1)));
    if (img && drawFit(canvas.current, img, 'contain')) setPaintedFrame(A.store.frames.indexOf(img));
  }, [spinning, apartK, A.store, apart.count]);
  useEffect(() => { paint(); }, [paint, A.loaded]);
  useEffect(() => {
    const ro = new ResizeObserver(paint);
    if (stage.current) ro.observe(stage.current);
    return () => ro.disconnect();
  }, [paint]);

  const lit = chip ? INSIDE_X.chipParts[chip] : null;
  const here = partAnchors(PARTS, spinning ? orbit.anchors : filmParts[paintedFrame]);
  const shown = here.length ? 1 : 0;
  return <div className="ar-xp-wrap">
    <div ref={run} className={`ar-xp-run is-film${reduced ? ' is-still' : ''}`}>
      <div ref={pin} className="ar-xp-pin">
        <div className="ar-xp-chips" role="group" aria-label={t(INSIDE.legendTitle)} style={{opacity: shown, visibility: shown ? 'visible' : 'hidden'}}>
          {['power', 'light', 'sensors'].map(c => <button key={c} type="button" className="ar-xp-chip" aria-pressed={chip === c} onClick={() => setChip(v => (v === c ? null : c))}>
            <span aria-hidden="true" className={`ar-xp-chip-dot is-${c}`}/>{t(INSIDE_X.chips[c])}</button>)}
          <span id="ar-xp-hint" className="ar-xp-spin" style={{visibility: spinning ? 'visible' : 'hidden'}}>↔ ↕ {lang === 'zh' ? '向任意方向拖动 · 方向键旋转 · 按住镜框后上下拖动' : 'Drag in any direction · Arrow keys rotate · Hold the frame to tilt on touch'}</span>
        </div>
        <div ref={stage} className={`ar-xp-stage ar-orbit${orbit.grabbing ? ' is-grabbing' : ''}${spinning ? ' is-spin' : ''}`}
          role="group" aria-roledescription="two-axis viewer" tabIndex={spinning ? 0 : -1}
          aria-label={`${t(INSIDE.alt)}. ${orbit.description}`} aria-describedby="ar-xp-hint"
          data-orbit="exploded" data-frame={orbit.frame.key} data-ready={orbit.ready} {...orbit.handlers}>
          <span className="ar-xp-in" style={{'--arn': ((orbit.info?.w || 1200) / (orbit.info?.h || 750)).toFixed(4)}}>
            <canvas ref={canvas} className="ar-xp-canvas ar-orbit-canvas" style={{touchAction: spinning ? 'none' : 'pan-y'}} aria-hidden="true"/>
            {here.map(a => {
              const x = a.part;
              const on = a.on, highlighted = active === x.id || focused === x.id;
              const numbered = highlighted || lit?.includes(x.id);
              return <button key={a.key} type="button" className="ar-xp-hotspot" data-numbered={numbered || undefined} data-highlighted={highlighted || undefined} aria-hidden={!on || undefined} aria-label={`${x.n}. ${t(x.name)}`}
                tabIndex={a.focusable ? 0 : -1} style={{left: `${a.x}%`, top: `${a.y}%`, opacity: on ? (lit && !numbered ? .35 : 1) : 0, pointerEvents: on ? 'auto' : 'none'}}
                onPointerEnter={e => { if (e.pointerType === 'mouse') setActive(x.id); }} onPointerLeave={e => { if (e.pointerType === 'mouse') setActive(null); }}
                onFocus={() => setFocused(x.id)} onBlur={() => setFocused(null)}>
                <span className="ar-xp-marker" aria-hidden="true">{numbered ? x.n : null}</span>
                {highlighted && a.focusable ? <span className={`ar-xp-label${a.x > 62 ? ' is-left' : ''}`} aria-hidden="true">{t(x.name)}</span> : null}
              </button>;
            })}
          </span>
        </div>
      </div>
    </div>
    {orbit.error ? <p className="ar-note" role="status">{lang === 'zh' ? '视图暂时无法加载，请再次旋转重试。' : 'This view could not load. Rotate again to retry.'}</p> : null}
    <div className="ar-xp-legend">
      <button type="button" className="ar-link ar-xp-more" aria-expanded={numbers} onClick={() => setNumbers(v => !v)}>{t(numbers ? INSIDE_X.hideNumbers : INSIDE_X.showNumbers)}</button>
      {numbers ? <>
        <p className="ar-small-head">{t(INSIDE.legendTitle)} <span className="ar-dim">· {t(INSIDE.sizeMass)}</span></p>
        <p className="ar-note">{t(INSIDE.partsNote)}</p>
        <ol>
          {PARTS.map(x => <li key={x.n} data-highlighted={active === x.id || focused === x.id || undefined}
            onPointerEnter={e => { if (e.pointerType === 'mouse') setActive(x.id); }} onPointerLeave={e => { if (e.pointerType === 'mouse') setActive(null); }}>
            <span className="ar-xp-n is-static" aria-hidden="true">{x.n}</span>
            <span className="ar-xp-name">{t(x.name)}</span>
            <PartSpecs part={x}/>
          </li>)}
        </ol>
      </> : null}
    </div>
  </div>;
}
