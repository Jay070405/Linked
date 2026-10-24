import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {useCaseLang} from '../../i18n';
import {Pic} from './Pic';
import {drawFit, filmFor, filmInfo, useFilm} from './film';
import {SUN, sunMix} from './sun';
import {DESIGN, VISION} from './content';

/* Three small things to do in the Design chapter:
   - Fold: the 48-frame fold (renders/seq/fold). Drag a temple (sideways, anywhere on the stage) to scrub it, or press
     the button; let go and it snaps to the nearer end with a little settle. Keys: arrows step, Home / End.
   - Sun mode: clear to tinted over renders/sun/hero-tint-0, -50, -85, crossfaded by a slider.
   - Your vision: a near/far focus illustration, beside Sun mode.
   Rendered tiles appear once assets exist. Reduced motion: no settle, instant ends. */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export function DesignTiles({reduced}) {
  const fold = !!filmInfo('fold'), sun = SUN.length > 1;
  return <div className="ar-sub ar-tiles is-vision">
    {fold ? <Fold reduced={reduced}/> : null}
    {sun ? <SunTile/> : null}
    <VisionTile/>
  </div>;
}

export function VisionCopy({compact = false}) {
  const {t} = useCaseLang();
  return <div className="ar-vision-copy">
    {compact ? <>
      <p>{t(VISION.tileLens)}</p>
      <p>{t(VISION.tileFocus)} <Ev label="Estimated"/></p>
    </> : <>
      <p><b>{t(VISION.prescriptionTitle)}</b> {t(VISION.prescription)}</p>
      <p><b>{t(VISION.focusTitle)}</b> {t(VISION.focus)} <Ev label="Estimated"/></p>
      <p>{t(VISION.limit)}</p>
      <p className="ar-note">{t(VISION.precedent)} <Ev label="Sourced"/></p>
    </>}
    <p className="ar-vision-sources">{VISION.sources.map(s => <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer">{s.name} ↗</a>)}</p>
  </div>;
}

function VisionTile() {
  const {t} = useCaseLang();
  const [near, setNear] = useState(false);
  return <figure className="ar-tile ar-vision" data-focus={near ? 'near' : 'far'}>
    <div className="ar-vision-stage">
      <div className="ar-vision-card"><small>ARDEN / 01</small><strong>{t(VISION.cardTitle)}</strong></div>
      <span className="ar-vision-hud" role="status">{t(near ? VISION.hudNear : VISION.hudFar)}</span>
    </div>
    <figcaption className="ar-tile-cap is-col">
      <div className="ar-vision-bar"><b>{t(VISION.title)}</b>
        <div className="ar-seg" role="group" aria-label={t(VISION.title)}>
          {[true, false].map(value => <button key={String(value)} type="button" className="ar-seg-opt" data-focus-to={value ? 'near' : 'far'} aria-pressed={near === value} onClick={() => setNear(value)}>{t(value ? VISION.near : VISION.far)}</button>)}
        </div>
      </div>
      <span className="ar-note">{t(VISION.demo)}</span>
      <VisionCopy compact/>
    </figcaption>
  </figure>;
}

function Fold({reduced}) {
  const {t} = useCaseLang();
  const name = useMemo(() => filmFor('fold'), []);
  const info = filmInfo(name);
  const box = useRef(null), canvas = useRef(null), anim = useRef(0), drag = useRef(null), kRef = useRef(0);
  const {store, loaded} = useFilm(name, box, {when: 'near'});
  const [k, setK] = useState(0);                    // 0 open, 1 folded
  kRef.current = k;
  const paint = useCallback(v => {
    const img = store?.nearest(Math.round(clamp(v) * (info.count - 1)));
    if (img) drawFit(canvas.current, img, 'contain');
  }, [store, info]);
  useEffect(() => { paint(k); }, [k, loaded, paint]);
  useEffect(() => {
    if (!box.current || typeof ResizeObserver !== 'function') return undefined;
    const ro = new ResizeObserver(() => paint(kRef.current));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, [paint]);
  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  /** To an end, easing out, then a small settle back and forth (none with reduced motion). */
  const go = useCallback(to => {
    cancelAnimationFrame(anim.current);
    if (reduced) { setK(to); return; }
    const from = kRef.current, t0 = performance.now(), dur = 520 + 380 * Math.abs(to - from);
    const step = now => {
      const u = clamp((now - t0) / dur);
      const e = 1 - (1 - u) ** 3;
      // the settle: a 3% give at the end that dies away
      const give = u > .55 ? .03 * Math.sin((u - .55) / .45 * Math.PI * 2) * (1 - u) * 2.2 : 0;
      setK(clamp(from + (to - from) * e - (to ? give : -give)));
      if (u < 1) anim.current = requestAnimationFrame(step); else setK(to);
    };
    anim.current = requestAnimationFrame(step);
  }, [reduced]);

  const onDown = e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    cancelAnimationFrame(anim.current);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = {id: e.pointerId, x: e.clientX, k: kRef.current, w: e.currentTarget.getBoundingClientRect().width};
  };
  const onMove = e => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    // pulling a temple in (towards the middle, leftwards from its tip on the right) folds it
    setK(clamp(d.k - (e.clientX - d.x) / (d.w * .42)));
  };
  const onUp = e => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    go(kRef.current > .5 ? 1 : 0);
  };
  const onKey = e => {
    const step = 1 / (info.count - 1);
    const next = {ArrowRight: k + step, ArrowUp: k + step, ArrowLeft: k - step, ArrowDown: k - step, Home: 0, End: 1}[e.key];
    if (next == null) return;
    e.preventDefault();
    cancelAnimationFrame(anim.current);
    setK(clamp(next));
  };
  const folded = k > .5;
  return <figure className="ar-tile ar-fold">
    <div ref={box} className="ar-fold-stage" role="slider" tabIndex={0} aria-label={t(DESIGN.foldTitle)} aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={Math.round(k * 100)} aria-valuetext={t(folded ? DESIGN.fold : DESIGN.unfold)}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}>
      <canvas ref={canvas} className="ar-fold-canvas" role="img" aria-label={t(DESIGN.foldAlt)}/>
    </div>
    <figcaption className="ar-tile-cap">
      <span><b>{t(DESIGN.foldTitle)}</b> {t(DESIGN.foldText)}</span>
      <button type="button" className="ar-btn is-small" aria-pressed={folded} onClick={() => go(folded ? 0 : 1)}>{t(folded ? DESIGN.unfold : DESIGN.fold)}</button>
    </figcaption>
  </figure>;
}

function SunTile() {
  const {t} = useCaseLang();
  const max = SUN[SUN.length - 1].tint;
  const [v, setV] = useState(0);
  return <figure className="ar-tile ar-suntile">
    <div className="ar-suntile-stage">
      {SUN.map((x, i) => <Pic key={x.name} name={x.name} alt={i ? '' : t(DESIGN.sunAlt(Math.round(v)))} className="ar-suntile-img" style={{opacity: sunMix(SUN, v, i)}}/>)}
    </div>
    <figcaption className="ar-tile-cap is-col">
      <span><b>{t(DESIGN.sunTitle)}</b> {t(DESIGN.sunText)} <Ev label="Estimated"/></span>
      <label className="ar-suntile-range">
        <span className="ar-sr">{t(DESIGN.sunSlider)}</span>
        <input type="range" min={0} max={max} value={v} onChange={e => setV(+e.target.value)} aria-valuetext={`${Math.round(v)}%`}/>
        <span className="ar-suntile-ends" aria-hidden="true"><span>{t(DESIGN.sunClear)}</span><b className="ar-num">{Math.round(v)}%</b><span>{t(DESIGN.sunTinted)}</span></span>
      </label>
    </figcaption>
  </figure>;
}
