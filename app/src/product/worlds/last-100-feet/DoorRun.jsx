import {useEffect, useRef, useState} from 'react';
import {PHONE, gsap, useMedia} from '../../v2/motion';
import {Ask, Takeaway, useInputMode} from '../../v2/Try';
import {GARAGE_GATE, GATE, STEPS, WAYPOINTS, feetBetween} from '../../v2/data/l100-route';
import {DuskPlan, REGION} from './DuskPlan';
import {CourierMark, MarkGlow} from './Courier';
import {useViewer} from './parts';
import {photoLarge, photoSmall} from './content';
import {AT_WAYPOINT, ROUTE_D, ROUTE_LEN, TOTAL_FEET, bag, walkAt} from './walk';

/* "Find the door", the before run. The complex at dusk with only what a delivery app gives a courier: the address
   pin, which lands on the residents-only garage gate on Cypress Ave. Choose where you'd walk in and the courier
   goes there first: to the garage and back along the sidewalks if that's where you sent them (the hot bag cools
   in the HUD), straight to the Elm St gate if you found it. From the gate the resident's photo route takes over,
   a photo at each turn. Keyboard: focus the plan, arrows move a crosshair, Enter chooses; keyboard and reduced
   motion show the end state at once. Plan geometry and distances: v2/data/l100-route.js, about a foot per unit. */

const VIEW = {x: -20, y: 40, w: 440, h: 510};
const pct = (p, axis) => (axis === 'x' ? (p.x - VIEW.x) / VIEW.w : (p.y - VIEW.y) / VIEW.h) * 100;
const THUMB = {park: [-62, 20], gate: [-66, -26], building: [44, 6], stairs: [-66, -10], door: [44, -30]};
const CURB = {x: 206, y: 452}, WALK_Y = 442, CYPRESS_X = 53;
const lens = pts => pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
const length = pts => lens(pts).reduce((a, b) => a + b, 0);
function along(pts, d) {
  const ls = lens(pts);
  for (let i = 0; i < ls.length; i++) {
    if (d <= ls[i] || i === ls.length - 1) {
      const t = ls[i] ? Math.min(1, d / ls[i]) : 0, a = pts[i], b = pts[i + 1];
      return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angle: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90};
    }
    d -= ls[i];
  }
  return {...pts.at(-1), angle: 0};
}

/** Where the courier walks before the photo route: out to the chosen spot and, if it wasn't the gate, on to it. */
function beforeRun(pick, kind) {
  if (kind === 'garage') {
    const g = {x: 72, y: GARAGE_GATE.y};
    return [CURB, {x: CURB.x, y: WALK_Y}, {x: CYPRESS_X, y: WALK_Y}, {x: CYPRESS_X, y: g.y}, g, {x: CYPRESS_X, y: g.y}, {x: CYPRESS_X, y: WALK_Y}, {x: GATE.x, y: WALK_Y}, GATE];
  }
  if (kind === 'found') return [CURB, {x: CURB.x, y: WALK_Y}, {x: GATE.x, y: WALK_Y}, GATE];
  return [CURB, pick, GATE];
}

export default function DoorRun({reduced = false}) {
  const [pick, setPick] = useState(null);
  const [cross, setCross] = useState(null);
  const [phase, setPhase] = useState('idle');     // idle | run | route | done
  const [reached, setReached] = useState(-1);     // photos shown up to this waypoint
  const [hover, setHover] = useState(null);
  const [arrived, setArrived] = useState(false);   // the courier has reached the spot you chose
  const [round, setRound] = useState(0);
  const mode = useInputMode();
  const svg = useRef(null), mark = useRef(null), trail = useRef(null), route = useRef(null), tl = useRef(null);
  const view = useViewer();
  const phone = useMedia(PHONE);
  const instant = reduced || mode.keyed.current;

  const atGarage = pick && feetBetween(pick, GARAGE_GATE) < 45;
  const off = pick ? Math.round(feetBetween(pick, GATE) / 5) * 5 : 0;
  const found = pick && off <= 30;
  const kind = !pick ? null : found ? 'found' : atGarage ? 'garage' : 'miss';
  const run = pick ? beforeRun(pick, kind) : null;
  const extra = run ? Math.round((length(run) - length(beforeRun(null, 'found'))) / 10) * 10 : 0;
  const pinToGate = Math.round(feetBetween(GARAGE_GATE, GATE) / 5) * 5;

  // the courier's walk: the before run, a beat at the garage, then the photo route to door 214
  useEffect(() => {
    if (!pick) return undefined;
    const g = mark.current, m = g?.querySelector('.w3-courier-mark'), body = m?.lastElementChild;
    const place = (p, frame) => {
      if (!g || !m) return;
      g.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
      body?.setAttribute('transform', `rotate(${p.angle.toFixed(1)}) scale(1.15)`);
      m.dataset.frame = frame;
    };
    const runLen = length(run);
    const draw = d => { if (trail.current) trail.current.style.strokeDashoffset = String(Math.max(0, runLen - d)); };
    const routeTo = feet => { if (route.current) route.current.style.strokeDashoffset = String(Math.max(0, ROUTE_LEN - walkAt(feet).drawn)); };
    const wpFor = feet => AT_WAYPOINT.reduce((w, at, i) => (feet >= at - .5 ? i : w), 0);
    const arrive = () => { setArrived(true); if (kind !== 'found') bag.cool(kind === 'garage' ? .3 : Math.min(.25, extra / 1400 + .06), kind === 'garage' ? 'Garage detour' : 'Wrong turn'); };
    if (instant) {
      draw(runLen); routeTo(TOTAL_FEET);
      const w = walkAt(TOTAL_FEET); place({...w, angle: 90}, 'stand');
      arrive(); setReached(4); setPhase('done');
      return undefined;
    }
    setPhase('run'); setReached(-1); setArrived(false);
    const o = {d: 0, f: AT_WAYPOINT[1]};
    const t = gsap.timeline({onComplete: () => setPhase('done')});
    const out = kind === 'garage' ? length(run.slice(0, 5)) : runLen;
    const stepFrame = d => String(Math.floor(d / 2.6) % 4);
    t.to(o, {d: out, duration: Math.max(.6, out * .0032), ease: 'none', onUpdate: () => { place(along(run, o.d), stepFrame(o.d)); draw(o.d); }, onStart: () => setReached(0)});
    if (kind === 'garage') {
      t.add(() => { place(along(run, o.d), 'stand'); arrive(); }).to({}, {duration: .9});
      t.to(o, {d: runLen, duration: (runLen - out) * .0026, ease: 'none', onUpdate: () => { place(along(run, o.d), stepFrame(o.d)); draw(o.d); }});
    }
    if (kind !== 'garage') t.add(arrive);
    t.add(() => { setPhase('route'); routeTo(AT_WAYPOINT[1]); setReached(1); });
    t.to(o, {f: TOTAL_FEET, duration: (TOTAL_FEET - AT_WAYPOINT[1]) * .011, ease: 'none', onUpdate: () => {
      const w = walkAt(o.f); place(w, stepFrame(o.f * 1.2)); routeTo(o.f);
      const now = wpFor(o.f + .01); setReached(r => (r < now ? now : r));
    }});
    t.add(() => { const w = walkAt(TOTAL_FEET); place({...w, angle: 90}, 'stand'); });
    tl.current = t;
    return () => t.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pick, round]);

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
  const reset = () => { tl.current?.kill(); setPick(null); setCross(null); setHover(null); setPhase('idle'); setReached(-1); setArrived(false); setRound(r => r + 1); };

  const verdict = !pick ? null
    : !arrived ? (kind === 'garage' ? 'Your courier follows the pin around the block to Cypress Ave…' : 'Your courier walks to the spot you chose…')
    : found ? `You found the walk-in gate on Elm St. The pin sits on the garage, ${pinToGate} ft away.`
    : atGarage ? `That’s the garage gate: residents only, with a card reader. The walk-in gate is around the corner on Elm St, ${pinToGate} ft from the pin. Your courier walked about ${extra.toLocaleString('en-US')} ft more to find out.`
    : `The walk-in gate is on Elm St, about ${off} ft from where you chose.`;
  const start = walkAt(0);

  return <div className={`w3-fd${pick ? ' is-picked' : ''}${instant ? ' is-instant' : ''}`} data-phase={phase} {...mode.bind}>
    <div className="w3-fd-top">
      <Ask>Choose where you’d walk in.</Ask>
      {pick ? <button type="button" className="w3-pill" onClick={reset}>Try again</button> : null}
    </div>
    <p className="w3-fd-status" aria-live="polite">{verdict || 'Map apps route to the address. This is where its pin lands.'}</p>
    <Takeaway show={phase === 'done'} instant={instant} className="w3-fd-take">With a pin you guessed. With the route you’d have walked straight in.</Takeaway>
    <p className="w3-small w3-fd-note">A fictional complex drawn by the prototype, about a foot per plan unit. The photos are AI-generated illustrative images, not a real location. Watch the hot bag in the corner.</p>
    <div className="w3-fd-map">
      <svg key={round} ref={svg} viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} className="w3-fd-plan"
        role="application" aria-label="Site plan of a fictional garden-style complex, 1450 Elm St, at dusk. A map pin marks the address on the garage gate, on Cypress Ave. Choose where you would walk in: arrow keys move a crosshair, Enter chooses."
        tabIndex={pick ? -1 : 0} onKeyDown={onKey} onFocus={() => !pick && !cross && setCross({x: GARAGE_GATE.x + 30, y: GARAGE_GATE.y + 40})}
        onClick={e => { if (e.detail) choose(toPlan(e)); }}>
        <defs><MarkGlow/></defs>
        <DuskPlan x={REGION.x} y={REGION.y} width={REGION.w} height={REGION.h} ids="w3fd" labels={!phone}/>
        {pick ? <>
          <polyline ref={trail} className={`w3-fd-trail is-${kind}`} points={run.map(p => `${p.x},${p.y}`).join(' ')}
            style={{strokeDasharray: length(run), strokeDashoffset: length(run)}}/>
          <path ref={route} className="w3-fd-route" d={ROUTE_D} style={{strokeDasharray: ROUTE_LEN, strokeDashoffset: ROUTE_LEN}}/>
          <g className="w3-fd-gate"><circle cx={GATE.x} cy={GATE.y} r="9"/><path d={`M${GATE.x - 3.4} ${GATE.y + 3.4} V${GATE.y - 3.4} M${GATE.x + 3.4} ${GATE.y + 3.4} V${GATE.y - 3.4} M${GATE.x - 3.4} ${GATE.y - 1.2} H${GATE.x + 3.4}`}/></g>
          <g className="w3-fd-you"><circle cx={pick.x} cy={pick.y} r="6"/><circle cx={pick.x} cy={pick.y} r="2"/></g>
        </> : null}
        {cross && !pick ? <g className="w3-fd-cross" aria-hidden="true"><circle cx={cross.x} cy={cross.y} r="9"/><path d={`M${cross.x - 15} ${cross.y} H${cross.x - 5} M${cross.x + 5} ${cross.y} H${cross.x + 15} M${cross.x} ${cross.y - 15} V${cross.y - 5} M${cross.x} ${cross.y + 5} V${cross.y + 15}`}/></g> : null}
        <g className="w3-fd-pin"><ellipse cx={GARAGE_GATE.x} cy={GARAGE_GATE.y} rx="5" ry="2"/>
          <path d={`M${GARAGE_GATE.x} ${GARAGE_GATE.y} C${GARAGE_GATE.x - 2} ${GARAGE_GATE.y - 11} ${GARAGE_GATE.x - 9} ${GARAGE_GATE.y - 15} ${GARAGE_GATE.x - 9} ${GARAGE_GATE.y - 21} A9 9 0 1 1 ${GARAGE_GATE.x + 9} ${GARAGE_GATE.y - 21} C${GARAGE_GATE.x + 9} ${GARAGE_GATE.y - 15} ${GARAGE_GATE.x + 2} ${GARAGE_GATE.y - 11} ${GARAGE_GATE.x} ${GARAGE_GATE.y} Z`}/>
          <circle cx={GARAGE_GATE.x} cy={GARAGE_GATE.y - 21} r="3.4"/></g>
        <g ref={mark} transform={`translate(${start.x} ${start.y})`}><CourierMark x={0} y={0} scale={1.15}/></g>
      </svg>
      <span className="w3-fd-label is-pin" style={{left: `${pct(GARAGE_GATE, 'x')}%`, top: `${pct(GARAGE_GATE, 'y')}%`}} aria-hidden="true">1450 Elm St</span>
      {pick ? <span className="w3-fd-label is-you" style={{left: `${pct(pick, 'x')}%`, top: `${pct(pick, 'y')}%`}} aria-hidden="true">You</span> : null}
      {pick && phase !== 'run' ? <span className="w3-fd-label is-gate" style={{left: `${pct(GATE, 'x')}%`, top: `${pct(GATE, 'y')}%`}} aria-hidden="true">Walk-in gate</span> : null}
      {kind === 'garage' && arrived ? <span className="w3-fd-label is-garage" style={{left: `${pct(GARAGE_GATE, 'x')}%`, top: `${pct(GARAGE_GATE, 'y')}%`}} aria-hidden="true">Residents only</span> : null}
      {pick ? STEPS.map((s, i) => {
        if (i > reached) return null;
        const w = WAYPOINTS[i].at, [dx, dy] = THUMB[s.key], name = s.photo.split('/').pop().replace('.webp', '');
        return <button key={s.key} type="button" className={`w3-fd-photo${hover === i ? ' is-open' : ''}`} style={{left: `${pct(w, 'x')}%`, top: `${pct(w, 'y')}%`, '--dx': `${dx}px`, '--dy': `${dy}px`}}
          aria-label={`Photo ${i + 1}, ${s.title}: ${s.instr}`}
          onClick={e => view({src: photoLarge(name), alt: s.alt, title: `Step ${i + 1}, ${s.title}`, text: s.instr}, e.currentTarget)}
          onPointerEnter={e => e.pointerType === 'mouse' && setHover(i)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
          <img src={photoSmall(name)} alt="" style={{objectPosition: s.focus}} decoding="async"/>
          <span className="w3-fd-n" aria-hidden="true">{i + 1}</span>
          <span className="w3-fd-card" aria-hidden="true"><img src={photoSmall(name)} alt="" decoding="async"/><b>{i + 1}. {s.title}</b><span>{s.instr}</span></span>
        </button>;
      }) : null}
    </div>
  </div>;
}
