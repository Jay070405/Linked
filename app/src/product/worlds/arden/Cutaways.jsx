import {useEffect, useRef, useState} from 'react';
import {useCaseLang} from '../../i18n';
import {has} from './media';
import {Pic} from './Pic';
import {HOTSPOTS, INSIDE, INSIDE_X} from './content';

/* The temple cutaways with hotspots. A switch picks the left or right temple; each hotspot is a button: hover or focus
   shows its card, a tap pins it (tap again, Escape, or a tap elsewhere closes it). The same lines are listed under the
   figure for phones and screen readers.
   "Press the capture control" sends a pulse of light along the signal's path in the right temple: from the control,
   through the flex to the mainboard, out along the flex through the hinge toward the front; then the camera's end-piece
   lights up beside it, with the one sentence on the interlock. Reduced motion: the path and the lit end-piece at once. */

// the signal's path over cutaway-temple-right (the figure is 2:1, so 200 × 100): control, mainboard, hinge, out
const PATH = 'M154 43.5 L150 47.5 L124 51 L148 49.5 L170 49 L186 49.5 L200 49.5';

export default function Cutaways({reduced}) {
  const {t} = useCaseLang();
  const [side, setSide] = useState('right');
  const [open, setOpen] = useState(null);       // pinned hotspot index
  const [hover, setHover] = useState(null);
  const [signal, setSignal] = useState('idle'); // idle | firing | done
  const box = useRef(null), timer = useRef(0);
  useEffect(() => {
    if (open == null) return undefined;
    const away = e => { if (!box.current?.contains(e.target)) setOpen(null); };
    const esc = e => { if (e.key === 'Escape') setOpen(null); };
    addEventListener('pointerdown', away); addEventListener('keydown', esc);
    return () => { removeEventListener('pointerdown', away); removeEventListener('keydown', esc); };
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const fire = () => {
    clearTimeout(timer.current);
    setSide('right'); setOpen(null); setHover(null);
    if (reduced) { setSignal('done'); return; }
    setSignal('idle');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setSignal('firing');
      timer.current = setTimeout(() => setSignal('done'), 1500);
    }));
  };
  const spots = HOTSPOTS[side];
  const name = `cutaway-temple-${side}`;
  if (!has('cutaway-temple-left') && !has('cutaway-temple-right')) return null;
  const shown = open ?? hover;
  const pathOn = side === 'right' && signal !== 'idle';
  return <div className="ar-cut">
    <div className="ar-cut-bar">
      <div className="ar-seg" role="group" aria-label={t(INSIDE.cutHeading)}>
        {['left', 'right'].map(s => <button key={s} type="button" className="ar-seg-opt" aria-pressed={side === s} onClick={() => { setSide(s); setOpen(null); setHover(null); setSignal('idle'); }}>{t(INSIDE.sides[s])}</button>)}
      </div>
      <button type="button" className="ar-btn is-small ar-cut-fire" onClick={fire}>
        <span className="ar-cut-gem" aria-hidden="true"/>{t(signal === 'done' ? INSIDE_X.signalAgain : INSIDE_X.signal)}
      </button>
    </div>
    <figure ref={box} className="ar-cut-fig" data-signal={pathOn ? signal : undefined}>
      <Pic key={name} name={name} alt=""/>
      {pathOn ? <svg className="ar-sig" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true">
        <path d={PATH} pathLength="100" className="ar-sig-track"/>
        <path d={PATH} pathLength="100" className="ar-sig-pulse"/>
      </svg> : null}
      {spots.map((p, i) => <button key={`${side}-${i}`} type="button" className="ar-spot" style={{left: `${p.at[0]}%`, top: `${p.at[1]}%`}}
        aria-expanded={shown === i} aria-describedby={`ar-spot-${side}-${i}`}
        onPointerEnter={e => { if (e.pointerType === 'mouse') setHover(i); }} onPointerLeave={e => { if (e.pointerType === 'mouse') setHover(null); }}
        onFocus={() => setHover(i)} onBlur={() => setHover(null)} onClick={() => setOpen(o => (o === i ? null : i))}>
        <span className="ar-sr">{t(p.name)}</span>
      </button>)}
      {spots.map((p, i) => <span key={`c-${side}-${i}`} id={`ar-spot-${side}-${i}`} role="tooltip" className={`ar-spot-card${shown === i ? ' is-on' : ''}${p.at[0] > 60 ? ' is-left' : ''}${p.at[1] < 38 ? ' is-below' : ''}`}
        style={{left: `${p.at[0]}%`, top: `${p.at[1]}%`}}>
        <b>{t(p.name)}</b><span>{t(p.text)}</span>
      </span>)}
      {side === 'right' && has('detail-camera-on') ? <figure className="ar-sig-end" data-on={signal === 'done' || undefined} aria-hidden={signal === 'done' ? undefined : 'true'}>
        <span className="ar-sig-end-img"><Pic name="detail-camera-on" alt={t(INSIDE_X.signalAlt)}/></span>
        <figcaption>{t(INSIDE_X.camera)}</figcaption>
      </figure> : null}
    </figure>
    <p className="ar-sig-text" data-on={signal === 'done' || undefined} aria-live="polite">{signal === 'done' ? t(INSIDE_X.signalText) : ''}</p>
    <ul className="ar-cut-list">
      {spots.map((p, i) => <li key={i}><b>{t(p.name)}</b> <span>{t(p.text)}</span></li>)}
    </ul>
  </div>;
}
