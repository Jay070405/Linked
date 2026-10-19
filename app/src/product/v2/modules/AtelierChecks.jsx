import {useEffect, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {gsap} from '../motion';
import {Ask, Takeaway, Tween, useInputMode} from '../Try';
import {art, artSrc, checkSentence, dimensions, earnings, fees, largestSharp, money, papers, printCheck, sizes} from '../data/atelier-model';
import './atelier-checks.css';

/* D2: three checks from the Atelier prototype, by hand, with its own numbers (data/atelier-model.js, copied from the
   prototype's model.ts and artworks.json). Pick one of Jay's eight paintings once; the print check, the earnings and
   the wall all follow it.
   1. Print check: drag across the six sizes the app offers; the effective dpi and the app's own sentence update, and
      the sheet is drawn at its physical size against the others.
   2. What you keep: drag the price; the breakdown is the price screen's (print and paper, 8% + $0.30, you keep).
   3. On the wall: the sizes this file prints sharp at, framed on the prototype's wall: a 36-inch console in a 48-inch
      view, so the print's width is to scale. */

const thumb = id => `/assets/product/atelier/thumbs/${id}.webp`;
const dims = (a, s) => { const d = dimensions(a, s); return `${d.w} × ${d.h}`; };

export default function AtelierChecks({reduced = false}) {
  const [artId, setArtId] = useState('blue-hour');
  const a = art.find(x => x.id === artId);
  return <div className="ac">
    <PrintCheck a={a} setArtId={setArtId} reduced={reduced}/>
    <Earnings a={a} reduced={reduced}/>
    <OnTheWall a={a} reduced={reduced}/>
  </div>;
}

/** Animates a {w, h} box toward `to` (250 ms, the kit's ease-out), or jumps there when `instant`. */
function useBox(to, instant) {
  const [box, setBox] = useState(to);
  const cur = useRef(to), tween = useRef(null);
  useEffect(() => {
    tween.current?.kill();
    if (instant) { cur.current = {...to}; setBox(to); return; }
    const o = {...cur.current};
    tween.current = gsap.to(o, {...to, duration: .3, ease: 'v2out', onUpdate: () => { cur.current = {...o}; setBox({...o}); }});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to.w, to.h, to.y, instant]);
  useEffect(() => () => tween.current?.kill(), []);
  return box;
}

/* ---------- 1. print check ---------- */
const STAGE = {w: 27, x: 1.2};   // inches; sheets stand on the floor line, left-aligned
// a landscape painting's tallest sheet is 18 in, a portrait one's 24 in: the wall is as tall as this painting needs
const stageFor = a => { const h = a.originalWidth >= a.originalHeight ? 20.6 : 26; return {...STAGE, h, floor: h - .8}; };

function PrintCheck({a, setArtId, reduced}) {
  const [si, setSi] = useState(3);
  const [seen, setSeen] = useState(false);
  const mode = useInputMode();
  const group = useRef(null);
  const s = sizes[si], r = printCheck(a, s), d = dimensions(a, s), top = largestSharp(a);
  const instant = reduced || mode.keyed.current;
  const box = useBox({w: d.w, h: d.h, y: 0}, instant);
  const choose = id => { setArtId(id); setSeen(true); };
  const onKey = e => {
    const i = art.findIndex(x => x.id === a.id);
    const step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[e.key];
    if (!step) return;
    e.preventDefault();
    const next = art[(i + step + art.length) % art.length];
    choose(next.id);
    group.current?.querySelector(`[data-art="${next.id}"]`)?.focus();
  };
  // the full artwork inside a 1/4-inch white border, centered: what the app prints
  const inner = {w: box.w - .5, h: box.h - .5}, k = Math.min(inner.w / a.originalWidth, inner.h / a.originalHeight);
  const iw = a.originalWidth * k, ih = a.originalHeight * k;
  const S = stageFor(a), sx = S.x, sy = S.floor - box.h;

  return <section className="ac-module pc" aria-labelledby="pc-title" {...mode.bind}>
    <div className="ac-head">
      <h3 id="pc-title" className="v2-h3">Print check</h3>
      <Ask>Pick a painting, then drag the size.</Ask>
    </div>
    <div className="pc-grid">
      <div className="pc-stage" aria-hidden="true">
        <svg viewBox={`0 0 ${S.w} ${S.h}`}>
          <path className="pc-floor" d={`M0 ${S.floor} H${S.w}`}/>
          {sizes.map(z => { const q = dimensions(a, z), ok = printCheck(a, z).ok;
            return <rect key={z.id} className={`pc-ghost${ok ? '' : ' is-no'}`} x={S.x} y={S.floor - q.h} width={q.w} height={q.h}/>; })}
          <g className={`pc-sheet${r.ok ? '' : ' is-no'}`}>
            <rect className="pc-paper" x={sx} y={sy} width={box.w} height={box.h}/>
            <image href={artSrc(a.id)} x={sx + (box.w - iw) / 2} y={sy + (box.h - ih) / 2} width={iw} height={ih} preserveAspectRatio="none"/>
          </g>
          <text className="pc-label" x={sx} y={sy - .45}>{d.w} × {d.h} in</text>
        </svg>
        <p className="pc-scale">Drawn to scale: every size the app offers, outlined</p>
      </div>
      <div className="pc-panel">
        <div ref={group} className="pc-art" role="radiogroup" aria-label="Painting" onKeyDown={onKey}>
          {art.map(x => <button key={x.id} type="button" role="radio" data-art={x.id} aria-checked={x.id === a.id} tabIndex={x.id === a.id ? 0 : -1}
            onClick={() => choose(x.id)} title={x.title}>
            <img src={thumb(x.id)} alt={x.title} loading="lazy" decoding="async"/>
          </button>)}
        </div>
        <p className="pc-name"><b>{a.title}</b><span>{a.originalWidth.toLocaleString('en-US')} × {a.originalHeight.toLocaleString('en-US')} px, the original file</span></p>
        <div className="pc-size">
          <label htmlFor="pc-range" className="pc-size-label">Print size</label>
          <input id="pc-range" className="v2-range" type="range" min="0" max={sizes.length - 1} step="1" value={si} style={{'--fill': `${si / (sizes.length - 1) * 100}%`}}
            aria-valuetext={`${d.w} by ${d.h} inches, ${r.dpi} dpi, ${r.ok ? 'sharp' : 'below 300 dpi'}`}
            onChange={e => { setSi(Number(e.target.value)); setSeen(true); }}/>
          <div className="pc-ticks" aria-hidden="true">{sizes.map((z, i) => <button key={z.id} type="button" tabIndex={-1} className={`${i === si ? 'is-on' : ''}${printCheck(a, z).ok ? '' : ' is-no'}`}
            onClick={() => { setSi(i); setSeen(true); }}>{dims(a, z)}</button>)}</div>
        </div>
        <div className={`pc-read${r.ok ? ' is-ok' : ' is-no'}`}>
          <p className="pc-dpi"><Tween value={r.dpi} instant={instant}/><span>dpi</span></p>
          <p className="pc-sentence" aria-live="polite">{checkSentence(a, s)}</p>
        </div>
        <p className="pc-offer"><Mark ok/>Offer prints up to {dims(a, top)} inches. Full artwork, sharp at 300 dpi.</p>
      </div>
    </div>
    <Takeaway show={seen} instant={instant}>The file sets the ceiling, and the artist sees it before anything is on sale.</Takeaway>
  </section>;
}

/* ---------- 2. what you keep ---------- */
function Earnings({a, reduced}) {
  const offered = sizes.filter(z => printCheck(a, z).ok);
  const [sizeId, setSizeId] = useState(largestSharp(a).id);
  const [paperId, setPaperId] = useState('matte');
  const [price, setPrice] = useState(38);
  const [seen, setSeen] = useState(false);
  const mode = useInputMode();
  useEffect(() => { setSizeId(largestSharp(a).id); }, [a]);
  const size = offered.find(z => z.id === sizeId) || offered.at(-1), paper = papers.find(p => p.id === paperId);
  const e = earnings(price, size, paper);
  const instant = reduced || mode.keyed.current;
  const pct = v => `${Math.max(0, Math.min(100, v / price * 100))}%`;
  const touch = () => setSeen(true);

  return <section className="ac-module ea" aria-labelledby="ea-title" {...mode.bind}>
    <div className="ac-head">
      <h3 id="ea-title" className="v2-h3">What you keep</h3>
      <Ask>Drag the price.</Ask>
    </div>
    <div className="ea-grid">
      <div className="ea-price">
        <p className="ea-big"><Tween value={price} format={v => money(Math.round(v))} instant={instant}/><span>for a {dims(a, size)} in print of {a.title}</span></p>
        <input className="v2-range" type="range" min="5" max="120" step="1" value={price} style={{'--fill': `${(price - 5) / 115 * 100}%`}}
          aria-label="Your price" aria-valuetext={`${money(price)}; you keep ${money(e.keep)}`}
          onChange={ev => { setPrice(Number(ev.target.value)); touch(); }}/>
        <div className="ea-options">
          <div className="v2-seg" role="group" aria-label="Size">
            {offered.map(z => <button key={z.id} type="button" aria-pressed={z.id === size.id} onClick={() => { setSizeId(z.id); touch(); }}>{dims(a, z)}</button>)}
          </div>
          <div className="v2-seg" role="group" aria-label="Paper">
            {papers.map(p => <button key={p.id} type="button" aria-pressed={p.id === paperId} onClick={() => { setPaperId(p.id); touch(); }}>{p.name}{p.extra ? ` +${money(p.extra)}` : ''}</button>)}
          </div>
        </div>
      </div>
      <div className="ea-sheet">
        <div className={`ea-bar${instant ? ' is-instant' : ''}`} aria-hidden="true">
          <i className="is-cost" style={{width: pct(e.printCost)}}/>
          <i className="is-fee" style={{width: pct(e.fee)}}/>
          <i className="is-keep" style={{width: pct(e.keep)}}/>
        </div>
        <dl className="ea-lines">
          <div><dt>Your price</dt><dd><Tween value={price} format={money} instant={instant}/></dd></div>
          <div><dt><i className="is-cost" aria-hidden="true"/>Print &amp; paper</dt><dd>−<Tween value={e.printCost} format={money} instant={instant}/></dd></div>
          <div><dt><i className="is-fee" aria-hidden="true"/>Atelier fee <small>8% + $0.30</small></dt><dd>−<Tween value={e.fee} format={money} instant={instant}/></dd></div>
          <div className="ea-keep"><dt><i className="is-keep" aria-hidden="true"/>You keep<small>For every {dims(a, size)} in print</small></dt><dd><Tween value={e.keep} format={money} instant={instant}/></dd></div>
        </dl>
        {e.keep <= 0 ? <p className="ea-error" role="alert">Choose a price above {money(e.printCost + fees(price))} to cover making this print.</p> : null}
      </div>
    </div>
    <Takeaway show={seen} instant={instant}>The artist sees what they keep before publishing, not after the first sale.</Takeaway>
    <p className="v2-caption"><Ev label="Estimated"/><span>The 8% + $0.30 fee is a concept number and the print costs are assumptions, not a vendor quote. The arithmetic is the prototype’s, to the cent.</span></p>
  </section>;
}

/* ---------- 3. on the wall ---------- */
const ROOM = {w: 390, h: 340, crop: 30, inches: 48, console: [49, 341], consoleTop: 250};
const UNIT = ROOM.w / ROOM.inches;   // 8.125 viewBox units per inch

function OnTheWall({a, reduced}) {
  const offered = sizes.filter(z => printCheck(a, z).ok), missing = sizes.filter(z => !printCheck(a, z).ok);
  const [sizeId, setSizeId] = useState(largestSharp(a).id);
  const [seen, setSeen] = useState(false);
  const mode = useInputMode();
  useEffect(() => { setSizeId(largestSharp(a).id); }, [a]);
  const s = offered.find(z => z.id === sizeId) || offered.at(-1), d = dimensions(a, s);
  const instant = reduced || mode.keyed.current;
  const w = d.w * UNIT, h = d.h * UNIT;
  // hung about 6 inches above the console, lower only when a tall print would leave the wall
  const bottom = Math.max(ROOM.consoleTop - 6 * UNIT, Math.min(ROOM.consoleTop - 1.5 * UNIT, ROOM.crop + 10 + h));
  const box = useBox({w, h, y: bottom}, instant);
  const frame = .9 * UNIT * Math.min(1, box.w / (10 * UNIT)) + 1.2, mat = .35 * UNIT;
  const x0 = 195 - box.w / 2, y0 = box.y - box.h;
  const iw = box.w - 2 * mat, ih = box.h - 2 * mat, k = Math.min(iw / a.originalWidth, ih / a.originalHeight);

  return <section className="ac-module wl" aria-labelledby="wl-title" {...mode.bind}>
    <div className="ac-head">
      <h3 id="wl-title" className="v2-h3">On the wall</h3>
      <Ask>Pick a size.</Ask>
    </div>
    <div className="wl-grid">
      <figure className="wl-room">
        <svg viewBox={`0 ${ROOM.crop} ${ROOM.w} ${ROOM.h - ROOM.crop}`} role="img" aria-label={`${a.title}, ${d.w} by ${d.h} inches, framed above a 36-inch console, to scale`}>
          <defs>
            <linearGradient id="wl-wall" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f5f0e8"/><stop offset=".55" stopColor="#e4ddd2"/><stop offset="1" stopColor="#c8bfb1"/></linearGradient>
            <linearGradient id="wl-floor" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#b5a28b"/><stop offset="1" stopColor="#ded0bc"/></linearGradient>
            <filter id="wl-soft"><feGaussianBlur stdDeviation="3"/></filter>
          </defs>
          {/* the prototype's room (d2-atelier-prototype, Room): wall, floor, a 36-inch console, a plant and books */}
          <path d="M0 0h390v267H0Z" fill="url(#wl-wall)"/><path d="M0 267h390v73H0Z" fill="url(#wl-floor)"/>
          <path d="M0 263h390" stroke="#c6cbc1" strokeWidth="6"/><path d="m0 40 137-40h42L0 160Z" fill="#fff" opacity=".24"/>
          <ellipse cx="197" cy="311" rx="150" ry="9" fill="#5f6556" opacity=".12" filter="url(#wl-soft)"/>
          <path d="M49 251h292v15H49Z" fill="#a18b6b"/><path d="M59 266h11v49H59Zm261 0h11v49h-11Z" fill="#7e6d56"/><path d="M49 250h292" stroke="#c3af90" strokeWidth="3"/>
          <path d="M298 243c-3-16-4-28-2-41M296 219c-18-6-15-19-15-19 15 1 16 16 15 19Zm1-9c15-3 17-16 17-16-15 0-17 12-17 16Z" fill="#6f7e65"/>
          <path d="M282 232h28l-4 18h-20Z" fill="#c8c4b8"/><path d="M82 242h57v8H82Z" fill="#667387"/><path d="M88 235h48v7H88Z" fill="#e6e1d5"/>
          {/* the print: a thin dark frame, a white border, the painting */}
          <g className="wl-print">
            <rect x={x0 - frame} y={y0 - frame} width={box.w + 2 * frame} height={box.h + 2 * frame} fill="#2b2622"/>
            <rect x={x0} y={y0} width={box.w} height={box.h} fill="#fffdf7"/>
            <image href={artSrc(a.id)} x={x0 + (box.w - a.originalWidth * k) / 2} y={y0 + (box.h - a.originalHeight * k) / 2} width={a.originalWidth * k} height={a.originalHeight * k} preserveAspectRatio="none"/>
          </g>
        </svg>
        <figcaption className="wl-caption">36 in console, to scale</figcaption>
      </figure>
      <div className="wl-panel">
        <p className="wl-name"><b>{a.title}</b><span>{d.w} × {d.h} in, framed</span></p>
        <div className="v2-seg wl-sizes" role="group" aria-label="Print size">
          {offered.map(z => <button key={z.id} type="button" aria-pressed={z.id === s.id} onClick={() => { setSizeId(z.id); setSeen(true); }}>{dims(a, z)} in</button>)}
        </div>
        {missing.length ? <p className="wl-missing">{missing.map(z => `${dims(a, z)} in`).join(', ')}: the file needs more pixels for a sharp print, so collectors aren’t offered {missing.length > 1 ? 'them' : 'it'}.</p> : null}
      </div>
    </div>
    <Takeaway show={seen} instant={instant}>Next to a 36-inch console, a size stops being a number.</Takeaway>
  </section>;
}

function Mark({ok}) {
  return <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ok ? <path d="m3.5 8.5 3 3 6-7"/> : <path d="m4.5 4.5 7 7m0-7-7 7"/>}
  </svg>;
}
