import {useEffect, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {gsap} from './kit/motion';
import {Takeaway, Tween, useInputMode} from './kit/Try';
import {fullSrc, inches, workOf} from './data';
import {dimensions, earnings, fees, largestSharp, money, papers, printCheck, sizes} from './model';

/* Hung, then priced. The print from the press goes on the prototype's wall: a 36-inch console in a fixed 48-inch view,
   so its width is to scale, now in the evening under a picture light. Only sizes the file prints sharp at can hang
   (collectors are never offered the others). Beside it, the gallery's price card is the prototype's price screen:
   drag the price and the card shows the print and paper, the 8% + $0.30 fee, and what the artist keeps. */

/** Animates a {w, h, y} box toward `to` (300 ms, the kit's ease-out), or jumps there when `instant`. */
function useBox(to, instant) {
  const [box, setBox] = useState(to);
  const cur = useRef(to), tween = useRef(null);
  useEffect(() => {
    tween.current?.kill();
    if (instant) { cur.current = {...to}; setBox(to); return; }
    const o = {...cur.current};
    tween.current = gsap.to(o, {...to, duration: .3, ease: 'atwout', onUpdate: () => { cur.current = {...o}; setBox({...o}); }});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to.w, to.h, to.y, instant]);
  useEffect(() => () => tween.current?.kill(), []);
  return box;
}

const ROOM = {w: 390, h: 340, crop: 30, inches: 48, consoleTop: 250};
const UNIT = ROOM.w / ROOM.inches;   // 8.125 viewBox units per inch

export default function WallPrice({artId, sizeId, setSizeId, reduced}) {
  const a = workOf(artId);
  const offered = sizes.filter(z => printCheck(a, z).ok), missing = sizes.filter(z => !printCheck(a, z).ok);
  const asked = sizes.find(z => z.id === sizeId);
  const s = offered.find(z => z.id === sizeId) || largestSharp(a), d = dimensions(a, s);
  const [paperId, setPaperId] = useState('matte');
  const [price, setPrice] = useState(38);
  const [seen, setSeen] = useState(false);
  const mode = useInputMode();
  const instant = reduced || mode.keyed.current;
  const paper = papers.find(p => p.id === paperId), e = earnings(price, s, paper);
  const pct = v => `${Math.max(0, Math.min(100, v / price * 100))}%`;

  // the print, hung about 6 inches above the console, lower only when a tall print would leave the wall
  const w = d.w * UNIT, h = d.h * UNIT;
  const bottom = Math.max(ROOM.consoleTop - 6 * UNIT, Math.min(ROOM.consoleTop - 1.5 * UNIT, ROOM.crop + 18 + h));
  const box = useBox({w, h, y: bottom}, instant);
  const frame = .9 * UNIT * Math.min(1, box.w / (10 * UNIT)) + 1.2, mat = .35 * UNIT;
  const x0 = 195 - box.w / 2, y0 = box.y - box.h;
  const iw = box.w - 2 * mat, ih = box.h - 2 * mat, k = Math.min(iw / a.originalWidth, ih / a.originalHeight);
  const lampY = y0 - frame - 9;

  return <section id="at-wall" className="atw-wallroom" aria-labelledby="at-wall-title" {...mode.bind}>
    <div className="atw-room-head">
      <h2 id="at-wall-title" className="atw-h2">Hung, then priced</h2>
      <p className="atw-lede">The print from the press goes on the prototype’s wall, at its physical size beside a 36-inch console. Its label is the price screen: drag the price and see what the artist keeps.</p>
    </div>
    <div className="atw-wall-grid">
      <figure className="atw-room">
        <svg viewBox={`0 ${ROOM.crop} ${ROOM.w} ${ROOM.h - ROOM.crop}`} role="img" aria-label={`${a.title}, ${d.w} by ${d.h} inches, framed above a 36-inch console, to scale`}>
          <defs>
            <radialGradient id="atw-room-light" cx="50%" cy="20%" r="70%"><stop stopColor="#f2dcc0"/><stop offset=".45" stopColor="#bda78d"/><stop offset="1" stopColor="#5e4f42"/></radialGradient>
            <linearGradient id="atw-room-floor" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#4a3a2d"/><stop offset="1" stopColor="#7a6450"/></linearGradient>
            <radialGradient id="atw-room-pool" cx="50%" cy="0%" r="100%"><stop stopColor="#fff2dc" stopOpacity=".55"/><stop offset="1" stopColor="#fff2dc" stopOpacity="0"/></radialGradient>
            <filter id="atw-room-soft"><feGaussianBlur stdDeviation="3"/></filter>
          </defs>
          {/* the prototype's room (d2-atelier-prototype, Room), in the evening: wall, floor, a 36-inch console, a plant and books */}
          <path d="M0 0h390v267H0Z" fill="url(#atw-room-light)"/><path d="M0 267h390v73H0Z" fill="url(#atw-room-floor)"/>
          <path d="M0 263h390" stroke="#3e3128" strokeWidth="6"/>
          <ellipse cx={195} cy={y0 + box.h * .45} rx={Math.max(60, box.w * .9)} ry={Math.max(48, box.h * 1.05)} fill="url(#atw-room-pool)"/>
          <ellipse cx="197" cy="311" rx="150" ry="9" fill="#1a130e" opacity=".35" filter="url(#atw-room-soft)"/>
          <path d="M49 251h292v15H49Z" fill="#6e5a43"/><path d="M59 266h11v49H59Zm261 0h11v49h-11Z" fill="#4f4031"/><path d="M49 250h292" stroke="#8b7457" strokeWidth="3"/>
          <path d="M298 243c-3-16-4-28-2-41M296 219c-18-6-15-19-15-19 15 1 16 16 15 19Zm1-9c15-3 17-16 17-16-15 0-17 12-17 16Z" fill="#4c5a44"/>
          <path d="M282 232h28l-4 18h-20Z" fill="#9b968b"/><path d="M82 242h57v8H82Z" fill="#3f4a5c"/><path d="M88 235h48v7H88Z" fill="#b9b2a4"/>
          {/* the print: a soft shadow, a thin dark frame, the white border, the painting; a picture light above it */}
          <g className="atw-room-print">
            <rect x={x0 - frame + 1.5} y={y0 - frame + 3} width={box.w + 2 * frame} height={box.h + 2 * frame} fill="#1a130e" opacity=".35" filter="url(#atw-room-soft)"/>
            <rect x={x0 - frame} y={y0 - frame} width={box.w + 2 * frame} height={box.h + 2 * frame} fill="#231b16"/>
            <rect x={x0} y={y0} width={box.w} height={box.h} fill="#fbf9f4"/>
            <image href={fullSrc(a.id)} x={x0 + (box.w - a.originalWidth * k) / 2} y={y0 + (box.h - a.originalHeight * k) / 2} width={a.originalWidth * k} height={a.originalHeight * k} preserveAspectRatio="none"/>
          </g>
          <g className="atw-room-lamp">
            <path d={`M195 ${lampY - 6}v6`} stroke="#6b5636" strokeWidth="1.6"/>
            <rect x={195 - Math.max(16, box.w * .22)} y={lampY} width={2 * Math.max(16, box.w * .22)} height="3.4" rx="1.7" fill="#b08a52"/>
          </g>
        </svg>
        <figcaption className="atw-caption">36 in console, to scale. {asked && !printCheck(a, asked).ok ? `${inches(a, asked)} in can’t hang here: below 300 dpi, collectors are never offered it, so the largest sharp size hangs instead.` : `${a.title} at ${d.w} × ${d.h} in.`}</figcaption>
      </figure>
      <div className="atw-pricecard">
        <p className="atw-pc-title">{a.title}</p>
        <p className="atw-pc-by">Jay Lin</p>
        <div className="atw-pc-sizes" role="group" aria-label="Print size">
          {offered.map(z => <button key={z.id} type="button" aria-pressed={z.id === s.id} onClick={() => { setSizeId(z.id); setSeen(true); }}>{inches(a, z)} in</button>)}
        </div>
        {missing.length ? <p className="atw-pc-missing">{missing.map(z => `${inches(a, z)} in`).join(', ')}: not offered, the file needs more pixels.</p> : null}
        <div className="atw-pc-papers" role="group" aria-label="Paper">
          {papers.map(p => <button key={p.id} type="button" aria-pressed={p.id === paperId} onClick={() => { setPaperId(p.id); setSeen(true); }}>{p.name}{p.extra ? ` +${money(p.extra)}` : ''}</button>)}
        </div>
        <div className="atw-pc-price">
          <p className="atw-pc-big"><Tween value={price} format={v => money(Math.round(v))} instant={instant}/></p>
          <div className="atw-pc-steps">
            <button type="button" aria-label="Lower the price by $1" onClick={() => { setPrice(p => Math.max(5, p - 1)); setSeen(true); }} disabled={price <= 5}>−</button>
            <button type="button" aria-label="Raise the price by $1" onClick={() => { setPrice(p => Math.min(120, p + 1)); setSeen(true); }} disabled={price >= 120}>+</button>
          </div>
        </div>
        <input className="atw-range" type="range" min="5" max="120" step="1" value={price} style={{'--fill': `${(price - 5) / 115 * 100}%`}}
          aria-label="Price" aria-valuetext={`${money(price)}; the artist keeps ${money(e.keep)}`}
          onChange={ev => { setPrice(Number(ev.target.value)); setSeen(true); }}/>
        <div className={`atw-pc-bar${instant ? ' is-instant' : ''}`} aria-hidden="true">
          <i className="is-cost" style={{width: pct(e.printCost)}}/><i className="is-fee" style={{width: pct(e.fee)}}/><i className="is-keep" style={{width: pct(e.keep)}}/>
        </div>
        <dl className="atw-pc-lines">
          <div><dt><i className="is-cost" aria-hidden="true"/>Print and paper</dt><dd>−<Tween value={e.printCost} format={money} instant={instant}/></dd></div>
          <div><dt><i className="is-fee" aria-hidden="true"/>Atelier fee <small>8% + $0.30</small></dt><dd>−<Tween value={e.fee} format={money} instant={instant}/></dd></div>
          <div className="atw-pc-keep"><dt><i className="is-keep" aria-hidden="true"/>The artist keeps</dt><dd><Tween value={e.keep} format={money} instant={instant}/></dd></div>
        </dl>
        {e.keep <= 0 ? <p className="atw-pc-error" role="alert">Choose a price above {money(e.printCost + fees(price))} to cover making this print.</p> : null}
      </div>
    </div>
    <Takeaway show={seen} instant={instant}>The artist sees what they keep before publishing, not after the first sale. Next to a 36-inch console, a size stops being a number.</Takeaway>
    <p className="atw-caption atw-wall-note"><Ev label="Estimated"/><span>The 8% + $0.30 fee is a concept number and the print costs are assumptions, not a vendor quote. The arithmetic is the prototype’s, to the cent.</span></p>
  </section>;
}
