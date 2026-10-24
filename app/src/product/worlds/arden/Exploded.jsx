import PartSpecs from './PartSpecs';
import {useLayoutEffect, useRef, useState} from 'react';
import {useCaseLang} from '../../i18n';
import {scrollerOf} from '../../v2/motion';
import {ASSETS} from './media';
import {Pic} from './Pic';
import {INSIDE, INSIDE_X, PARTS} from './content';
import {filmInfo} from './film';
import ExplodedFilm from './ExplodedFilm';
import {partAnchorGroup} from './part-anchors.mjs';

/* The signature of "Inside": the exploded view separates as you scroll, pinned while it does. The render is one still;
   the build splits it into its backdrop and its parts, cut along an ID map of the same view taken from the Blender
   model (scripts/arden-exploded-map.py, scripts/build-arden-assets.mjs), so each layer knows how far it travels between
   closed and exploded. Once apart, dots appear; hover or focus reveals each part's number and name.
   Three chips reveal the numbers along the power path, light path and sensors.
   The full table sits behind "Show the numbers". Reduced motion: the finished view, not pinned. */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = u => u * u * (3 - 2 * u);
// which layers of the split each numbered part lives on
const LAYERS_OF = {
  front: ['front'], lens: ['lens-rxinsert', 'lens-innercover', 'lens-waveguide', 'lens-carrier', 'lens-ar', 'lens-hardcoat'],
  projector: ['projector', 'als'], camera: ['camera'], flex: ['front-flex', 'near-flex', 'far-flex'], pads: ['pads', 'accel'],
  board: ['far-core'], battery: ['near-core', 'far-core'], speaker: ['near-core', 'far-core'], spreader: ['far-outer'],
  temple: ['near-chassis', 'far-chassis', 'near-skin', 'far-skin', 'button'],
};

/** The parts' box and the badges' spots, with a little room: what a phone shows of the render (fractions). */
function cropOf(layers, callouts) {
  if (!layers.length) return null;
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (const l of layers) { x0 = Math.min(x0, l.x); y0 = Math.min(y0, l.y); x1 = Math.max(x1, l.x + l.w); y1 = Math.max(y1, l.y + l.h); }
  for (const {a} of callouts) {
    const bx = (a.at[0] + a.badge[0]) / 100, by = (a.at[1] + a.badge[1]) / 100;
    x0 = Math.min(x0, bx - .025); x1 = Math.max(x1, bx + .025); y0 = Math.min(y0, by - .04); y1 = Math.max(y1, by + .04);
  }
  x0 = Math.max(0, x0 - .015); y0 = Math.max(0, y0 - .02); x1 = Math.min(1, x1 + .015); y1 = Math.min(1, y1 + .02);
  return x1 > x0 && y1 > y0 ? {x: x0, y: y0, w: x1 - x0, h: y1 - y0} : null;
}

/** The rendered exploded film and its 360° turn once they exist (ExplodedFilm.jsx); until then the split still. */
export default function Exploded({reduced}) {
  return filmInfo('explode') && ASSETS.orbits?.['orbit-exploded'] ? <ExplodedFilm reduced={reduced}/> : <ExplodedLayers reduced={reduced}/>;
}

function ExplodedLayers({reduced}) {
  const {t} = useCaseLang();
  const run = useRef(null), pin = useRef(null), fig = useRef(null);
  const [drawn, setDrawn] = useState(reduced ? 1 : 0);
  const [active, setActive] = useState(null);
  const [focused, setFocused] = useState(null);
  const [chip, setChip] = useState(null);         // 'power' | 'light' | 'sensors'
  const [numbers, setNumbers] = useState(false);
  const s = ASSETS.stills.exploded;
  const layers = s?.layers || [];
  const [w, h] = s?.sizes?.[1600] || [1600, 960];
  const callouts = PARTS.map(p => ({...p, a: partAnchorGroup(p, s?.anchors)})).filter(p => p.a);
  const crop = cropOf(layers, callouts);

  useLayoutEffect(() => {
    const node = run.current, st = pin.current, f = fig.current;
    if (!node || !st || !f) return undefined;
    if (reduced) { f.style.setProperty('--s', '1'); setDrawn(1); return undefined; }
    const sc = scrollerOf(node);
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = node.getBoundingClientRect(), top = parseFloat(getComputedStyle(st).top) || 0, vh = sc === window ? innerHeight : sc.clientHeight;
      // the figure comes up closed, separates while pinned, and the callouts follow
      const p = clamp((top - r.top + vh * .45) / Math.max(1, r.height - st.offsetHeight + vh * .45));
      f.style.setProperty('--s', smooth(clamp((p - .05) / .55)).toFixed(4));
      setDrawn(clamp((p - .62) / .2));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    sc.addEventListener('scroll', on, {passive: true});
    addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); sc.removeEventListener('scroll', on); removeEventListener('resize', on); };
  }, [reduced]);

  const lit = chip ? INSIDE_X.chipParts[chip] : null;
  const litLayers = lit ? new Set(lit.flatMap(id => LAYERS_OF[id] || [])) : null;
  const ready = drawn > .98;
  if (!s) return null;
  return <div className="ar-xp-wrap">
    <div ref={run} className={`ar-xp-run${reduced ? ' is-still' : ''}`}>
    <div ref={pin} className="ar-xp-pin">
      <div className="ar-xp-chips" role="group" aria-label={t(INSIDE.legendTitle)} style={{opacity: drawn, visibility: drawn > .02 ? 'visible' : 'hidden'}}>
        {['power', 'light', 'sensors'].map(c => <button key={c} type="button" className="ar-xp-chip" aria-pressed={chip === c} onClick={() => setChip(v => (v === c ? null : c))}>
          <span aria-hidden="true" className={`ar-xp-chip-dot is-${c}`}/>{t(INSIDE_X.chips[c])}</button>)}
      </div>
      <figure ref={fig} className={`ar-xp${s.split && crop ? ' is-cropped' : ''}${lit ? ' is-lit' : ''}`} style={{'--ar': `${w} / ${h}`, '--arn': (w / h).toFixed(4),
        ...(crop ? {'--cx': crop.x.toFixed(4), '--cy': crop.y.toFixed(4), '--cw': crop.w.toFixed(4), '--ch': crop.h.toFixed(4), '--car': (w * crop.w / (h * crop.h)).toFixed(4)} : {})}}>
        <div className="ar-xp-in">
          {s.split && layers.length
            ? <div className="ar-xp-pieces" role="img" aria-label={t(INSIDE.alt)}>
              {layers.map((l, i) => <img key={i} src={l.src} alt="" loading="lazy" decoding="async" draggable={false} data-dim={(litLayers && !litLayers.has(l.kind)) || undefined}
                style={{left: `${l.x * 100}%`, top: `${l.y * 100}%`, width: `${l.w * 100}%`, height: `${l.h * 100}%`, '--dx': (l.dx / l.w).toFixed(4), '--dy': (l.dy / l.h).toFixed(4)}}/>)}
            </div>
            : <Pic name="exploded" alt={t(INSIDE.alt)}/>}
          {callouts.map((p, i) => { const [x, y] = p.a.at, k = clamp(drawn * 1.8 - i * .07);
            const highlighted = active === p.id || focused === p.id;
            const numbered = highlighted || lit?.includes(p.id);
            return <button key={p.n} type="button" className="ar-xp-hotspot" data-numbered={numbered || undefined} data-highlighted={highlighted || undefined} aria-label={`${p.n}. ${t(p.name)}`}
                tabIndex={ready ? 0 : -1} style={{left: `${x}%`, top: `${y}%`, opacity: k * (lit && !numbered ? .35 : 1), pointerEvents: ready ? 'auto' : 'none'}}
                onPointerEnter={e => { if (e.pointerType === 'mouse') setActive(p.id); }} onPointerLeave={e => { if (e.pointerType === 'mouse') setActive(null); }}
                onFocus={() => setFocused(p.id)} onBlur={() => setFocused(null)}>
                <span className="ar-xp-marker" aria-hidden="true">{numbered ? p.n : null}</span>
                {highlighted ? <span className={`ar-xp-label${x > 62 ? ' is-left' : ''}`} aria-hidden="true">{t(p.name)}</span> : null}
              </button>; })}
        </div>
      </figure>
    </div>
    </div>
    <div className="ar-xp-legend">
      <button type="button" className="ar-link ar-xp-more" aria-expanded={numbers} onClick={() => setNumbers(v => !v)}>{t(numbers ? INSIDE_X.hideNumbers : INSIDE_X.showNumbers)}</button>
      {numbers ? <>
        <p className="ar-small-head">{t(INSIDE.legendTitle)} <span className="ar-dim">· {t(INSIDE.sizeMass)}</span></p>
        <p className="ar-note">{t(INSIDE.partsNote)}</p>
        <ol>
          {PARTS.map(p => <li key={p.n} data-highlighted={active === p.id || focused === p.id || undefined}
            onPointerEnter={e => { if (e.pointerType === 'mouse') setActive(p.id); }} onPointerLeave={e => { if (e.pointerType === 'mouse') setActive(null); }}>
            <span className="ar-xp-n is-static" aria-hidden="true">{p.n}</span>
            <span className="ar-xp-name">{t(p.name)}</span>
            <PartSpecs part={p}/>
          </li>)}
        </ol>
      </> : null}
    </div>
  </div>;
}
