import {useRef, useState} from 'react';
import {zoomable} from '../zoom';
import {Ask, Takeaway, useInputMode} from '../Try';
import {BASE, GARAGE_GATE, GATE, LEGS, STEPS, WAYPOINTS, feetBetween} from '../data/l100-route';
import './door.css';

/* D3, "Find the door": the complex's site plan (the prototype's own, plan-base.webp, in plan units from
   data/l100-route.js) with only what a delivery app gives you: the address pin, which lands on the residents-only
   garage gate. Tap where you'd walk in; then the real walk-in gate, how far off you were, and the resident's photo
   route drawn leg by leg, a photo popping at each turn (point at one to enlarge it, tap it for full size).
   Keyboard: focus the plan, move the crosshair with the arrows, Enter to choose. */

const VIEW = {x: -20, y: 40, w: 440, h: 510};     // the part of the plan the game shows
const pct = (p, axis) => (axis === 'x' ? (p.x - VIEW.x) / VIEW.w : (p.y - VIEW.y) / VIEW.h) * 100;
// where each photo sits beside its waypoint (in px), clear of the route
const THUMB = {park: [-62, 20], gate: [-66, -26], building: [44, 6], stairs: [-66, -10], door: [44, -30]};
const legTime = LEGS.map(l => 300 + l.feet * 2.6);          // the prototype's own pacing (SitePlan "sequence")
const legStart = legTime.reduce((acc, d, i) => [...acc, i ? acc[i - 1] + legTime[i - 1] + 40 : 300], []);

export default function FindTheDoor({reduced = false}) {
  const [pick, setPick] = useState(null);
  const [cross, setCross] = useState(null);     // keyboard crosshair, plan units
  const [hover, setHover] = useState(null);
  const [round, setRound] = useState(0);
  const mode = useInputMode();
  const svg = useRef(null);
  const instant = reduced || mode.keyed.current;

  const toPlan = e => {
    const m = svg.current.getScreenCTM();
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return {x: Math.round(p.x), y: Math.round(p.y)};
  };
  const choose = p => { if (!pick) setPick(p); };
  const onKey = e => {
    if (pick) return;
    const c = cross || {x: GARAGE_GATE.x + 30, y: GARAGE_GATE.y + 40};
    const d = e.shiftKey ? 40 : 10;
    const move = {ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d]}[e.key];
    if (move) {
      e.preventDefault();
      setCross({x: Math.min(VIEW.x + VIEW.w - 4, Math.max(VIEW.x + 4, c.x + move[0])), y: Math.min(VIEW.y + VIEW.h - 4, Math.max(VIEW.y + 4, c.y + move[1]))});
    } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(c); }
  };
  const reset = () => { setPick(null); setCross(null); setHover(null); setRound(r => r + 1); };

  const off = pick ? Math.round(feetBetween(pick, GATE) / 5) * 5 : 0;
  const atGarage = pick && feetBetween(pick, GARAGE_GATE) < 45;
  const found = pick && off <= 30;
  const pinToGate = Math.round(feetBetween(GARAGE_GATE, GATE) / 5) * 5;
  const verdict = !pick ? null
    : found ? `You found the walk-in gate on Elm St. The pin sits on the garage, ${pinToGate} ft away.`
    : atGarage ? `That’s the garage gate: residents only, with a card reader. The walk-in gate is around the corner on Elm St, ${pinToGate} ft from the pin.`
    : `The walk-in gate is on Elm St, about ${off} ft from where you chose.`;

  return <div className={`fd${pick ? ' is-picked' : ''}${instant ? ' is-instant' : ''}`} {...mode.bind}>
    <div className="fd-top">
      <Ask>Choose where you’d walk in.</Ask>
      {pick ? <button type="button" className="fd-again" onClick={reset}>Try again</button> : null}
    </div>
    <div className="fd-map" data-zoom-group="">
      <svg key={round} ref={svg} viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className="fd-plan"
        role="application" aria-label="Site plan of a fictional garden-style complex, 1450 Elm St. A map pin marks the address on the garage gate, on Cypress Ave. Choose where you would walk in: arrow keys move a crosshair, Enter chooses."
        tabIndex={pick ? -1 : 0} onKeyDown={onKey} onFocus={() => !pick && !cross && setCross({x: GARAGE_GATE.x + 30, y: GARAGE_GATE.y + 40})}
        onClick={e => { if (e.detail) choose(toPlan(e)); }}>
        <image href="/assets/product/last-100-feet/plan-base.webp" x={BASE.x} y={BASE.y} width={BASE.w} height={BASE.h}/>
        {pick ? <>
          {/* the walk from the curb to door 214, leg by leg */}
          {LEGS.map((l, i) => <path key={i} className="fd-leg" d={l.d} pathLength="1" style={{'--dur': `${legTime[i]}ms`, '--delay': `${legStart[i] + 700}ms`}}/>)}
          {!found ? <path className="fd-miss" d={`M${pick.x} ${pick.y} L${GATE.x} ${GATE.y}`}/> : null}
          <g className="fd-gate" style={{'--delay': '120ms'}}><circle cx={GATE.x} cy={GATE.y} r="11"/><path d={`M${GATE.x - 4} ${GATE.y + 4} V${GATE.y - 4} M${GATE.x + 4} ${GATE.y + 4} V${GATE.y - 4} M${GATE.x - 4} ${GATE.y - 1.5} H${GATE.x + 4}`}/></g>
          <g className="fd-you"><circle cx={pick.x} cy={pick.y} r="7"/><circle cx={pick.x} cy={pick.y} r="2.4"/></g>
        </> : null}
        {cross && !pick ? <g className="fd-cross" aria-hidden="true"><circle cx={cross.x} cy={cross.y} r="9"/><path d={`M${cross.x - 15} ${cross.y} H${cross.x - 5} M${cross.x + 5} ${cross.y} H${cross.x + 15} M${cross.x} ${cross.y - 15} V${cross.y - 5} M${cross.x} ${cross.y + 5} V${cross.y + 15}`}/></g> : null}
        {/* the address pin a map app drops on this complex */}
        <g className="fd-pin"><ellipse cx={GARAGE_GATE.x} cy={GARAGE_GATE.y} rx="5" ry="2"/>
          <path d={`M${GARAGE_GATE.x} ${GARAGE_GATE.y} C${GARAGE_GATE.x - 2} ${GARAGE_GATE.y - 11} ${GARAGE_GATE.x - 9} ${GARAGE_GATE.y - 15} ${GARAGE_GATE.x - 9} ${GARAGE_GATE.y - 21} A9 9 0 1 1 ${GARAGE_GATE.x + 9} ${GARAGE_GATE.y - 21} C${GARAGE_GATE.x + 9} ${GARAGE_GATE.y - 15} ${GARAGE_GATE.x + 2} ${GARAGE_GATE.y - 11} ${GARAGE_GATE.x} ${GARAGE_GATE.y} Z`}/>
          <circle cx={GARAGE_GATE.x} cy={GARAGE_GATE.y - 21} r="3.4"/></g>
      </svg>
      <span className="fd-pin-label" style={{left: `${pct(GARAGE_GATE, 'x')}%`, top: `${pct(GARAGE_GATE, 'y')}%`}} aria-hidden="true">1450 Elm St</span>
      {pick ? <span className="fd-you-label" style={{left: `${pct(pick, 'x')}%`, top: `${pct(pick, 'y')}%`}} aria-hidden="true">You</span> : null}
      {pick ? <span className="fd-gate-label" style={{left: `${pct(GATE, 'x')}%`, top: `${pct(GATE, 'y')}%`}} aria-hidden="true">Walk-in gate</span> : null}
      {pick ? STEPS.map((s, i) => {
        const w = WAYPOINTS[i].at, [dx, dy] = THUMB[s.key];
        return <button key={s.key} type="button" className={`fd-photo${hover === i ? ' is-open' : ''}`} style={{left: `${pct(w, 'x')}%`, top: `${pct(w, 'y')}%`, '--dx': `${dx}px`, '--dy': `${dy}px`, '--delay': `${(i ? legStart[i - 1] + legTime[i - 1] : 0) + 700}ms`}}
          {...zoomable(`${s.title}: ${s.alt}. AI-generated illustrative image.`, {src: s.photo, w: 1280, h: 960})}
          onPointerEnter={e => e.pointerType === 'mouse' && setHover(i)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
          <img src={`/assets/product/last-100-feet/photos/${s.photo.split('/').pop()}`} alt="" style={{objectPosition: s.focus}} decoding="async"/>
          <span className="fd-photo-n" aria-hidden="true">{i + 1}</span>
          <span className="fd-photo-card" aria-hidden="true"><img src={`/assets/product/last-100-feet/photos/${s.photo.split('/').pop()}`} alt="" decoding="async"/><b>{i + 1}. {s.title}</b><span>{s.instr}</span></span>
        </button>;
      }) : null}
    </div>
    <p className="fd-status" aria-live="polite">{verdict || 'Map apps route to the address. This is where its pin lands.'}</p>
    <Takeaway show={!!pick} instant={instant}>With a pin you guessed. With the route you’d have walked straight in.</Takeaway>
    <p className="v2-caption"><span>A fictional complex drawn by the prototype, about a foot per plan unit. The photos are AI-generated illustrative images, not a real location.</span></p>
  </div>;
}
