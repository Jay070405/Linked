import {useEffect, useRef, useState} from 'react';
import {Ask, Takeaway, useInputMode} from '../Try';
import {ADDRESS, BASE, GATE, GEOFENCE_FT, HOLD_MS, REVEAL_SECONDS, WAYPOINTS, courierAt} from '../data/l100-route';
import './gate.css';

/* D3, the gate code inline: the prototype's reveal (StepCard GateBody, HoldButton, CodeReveal) as a small widget.
   Drag the courier toward the Elm St gate: outside the 160 ft geofence the code is locked and says how far is left;
   inside, hold the button for 0.9 s (or tap, with "Tap instead of hold") and the code shows in keypad order, hides
   after 20 seconds, and comes back with one tap. The order authorizes the code; being near only reveals it. */

const VIEW = {x: -30, y: 250, w: 450, h: 300};
const MAX_FT = 240;

export default function GateCode({reduced = false}) {
  const [ft, setFt] = useState(220);
  const [mode, setMode] = useState('locked');     // locked | near | revealed
  const [seen, setSeen] = useState(false);        // the code has been shown once: showing it again is a tap
  const [tap, setTap] = useState(false);
  const [holding, setHolding] = useState(false);
  const [left, setLeft] = useState(REVEAL_SECONDS);
  const [hiding, setHiding] = useState(false);
  const [used, setUsed] = useState(false);
  const input = useInputMode();
  const timer = useRef(0);
  const instant = reduced || input.keyed.current;
  const inside = ft <= GEOFENCE_FT;
  const dot = courierAt(ft);
  const toGo = Math.max(0, Math.round((ft - GEOFENCE_FT) / 10) * 10);

  // crossing the geofence locks or unlocks; leaving it hides a shown code
  useEffect(() => { setMode(m => (inside ? (m === 'locked' ? 'near' : m) : 'locked')); }, [inside]);
  // the 20-second countdown, then the code hides (220 ms fade, as in the app)
  useEffect(() => {
    if (mode !== 'revealed') return undefined;
    setLeft(REVEAL_SECONDS); setHiding(false);
    const t = setInterval(() => setLeft(v => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [mode]);
  useEffect(() => {
    if (mode !== 'revealed' || left > 0) return undefined;
    setHiding(true);
    const t = setTimeout(() => setMode('near'), instant ? 0 : 220);
    return () => clearTimeout(t);
  }, [left, mode, instant]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const reveal = () => { setMode('revealed'); setSeen(true); setUsed(true); };
  const start = () => {
    if (holding) return;
    setHolding(true);
    timer.current = setTimeout(() => { setHolding(false); reveal(); }, HOLD_MS);
  };
  const cancel = () => { clearTimeout(timer.current); setHolding(false); };
  const quick = tap || seen;
  const label = seen ? 'Show code again' : tap ? 'Show gate code' : 'Hold to show gate code';
  const pct = (p, axis) => (axis === 'x' ? (p.x - VIEW.x) / VIEW.w : (p.y - VIEW.y) / VIEW.h) * 100;

  return <div className={`gc${instant ? ' is-instant' : ''}`} {...input.bind}>
    <Ask>Drag the courier to the gate, then hold the red button.</Ask>
    <div className="gc-grid">
      <div className="gc-map">
        <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} role="img" aria-label={`Site plan around the Elm St gate. The courier is ${ft} feet from the gate, ${inside ? 'inside' : 'outside'} the ${GEOFENCE_FT}-foot circle where the code can show.`}>
          <image href="/assets/product/last-100-feet/plan-base.webp" x={BASE.x} y={BASE.y} width={BASE.w} height={BASE.h}/>
          <circle className={`gc-fence${inside ? ' is-in' : ''}`} cx={GATE.x} cy={GATE.y} r={GEOFENCE_FT}/>
          <g className="gc-gate"><rect x={GATE.x - 10} y={GATE.y - 10} width="20" height="20" rx="5.5"/><path d={`M${GATE.x - 5} ${GATE.y + 5} V${GATE.y - 5} M${GATE.x + 5} ${GATE.y + 5} V${GATE.y - 5} M${GATE.x - 5} ${GATE.y - 2.5} H${GATE.x + 5} M${GATE.x - 1.7} ${GATE.y - 2.5} V${GATE.y + 5} M${GATE.x + 1.7} ${GATE.y - 2.5} V${GATE.y + 5}`}/></g>
          <g className="gc-dot" transform={`translate(${dot.x} ${dot.y})`}><circle r="14"/><circle r="8"/><circle r="5.5"/></g>
        </svg>
        <span className="gc-ring-label" style={{left: `${pct({x: GATE.x - GEOFENCE_FT * .72, y: 0}, 'x')}%`, top: `${pct({x: 0, y: GATE.y - GEOFENCE_FT * .66}, 'y')}%`}} aria-hidden="true">{GEOFENCE_FT} ft</span>
        <span className="gc-gate-label" style={{left: `${pct(GATE, 'x')}%`, top: `${pct(GATE, 'y')}%`}} aria-hidden="true">{WAYPOINTS[1].name}</span>
      </div>

      <div className="gc-side">
        <div className="gc-dist">
          <label htmlFor="gc-range">Distance to the gate</label>
          <output htmlFor="gc-range">{ft} ft</output>
        </div>
        <input id="gc-range" className="v2-range gc-range" type="range" min="0" max={MAX_FT} step="5" value={MAX_FT - ft}
          style={{'--fill': `${(MAX_FT - ft) / MAX_FT * 100}%`}} aria-valuetext={`${ft} feet from the gate`}
          onChange={e => { setFt(MAX_FT - Number(e.target.value)); setUsed(true); }}/>
        <div className="gc-scale" aria-hidden="true"><span>{MAX_FT} ft away</span><span>At the gate</span></div>

        <div className="gc-card" aria-live="polite">
          {mode === 'revealed' ? <div className="gc-code" data-hiding={hiding || undefined}>
            <p className="gc-code-label">Enter on the call box</p>
            <div className="gc-keys" role="img" aria-label={`Gate code ${ADDRESS.code.split('').join(' ')}, then pound`}>
              {[...ADDRESS.code, '#'].map((d, i) => <span key={i} className="gc-key" data-pound={d === '#' || undefined} style={{'--i': i}} aria-hidden="true">{d}</span>)}
            </div>
            <div className="gc-timer">
              <span className="gc-bar" aria-hidden="true"><span style={{animationDuration: `${REVEAL_SECONDS}s`}}/></span>
              <span className="gc-left">Hides in {left} s, tap to show again</span>
            </div>
          </div> : mode === 'near' ? <button type="button" className={`gc-hold${holding ? ' is-holding' : ''}`} style={{'--hold': `${HOLD_MS}ms`}}
            aria-label={quick ? label : `${label}. Press and hold.`}
            onClick={quick ? reveal : undefined}
            onPointerDown={quick ? undefined : e => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* released */ } start(); }}
            onPointerUp={quick ? undefined : cancel} onPointerCancel={quick ? undefined : cancel} onContextMenu={e => e.preventDefault()}
            onKeyDown={quick ? undefined : e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } }}
            onKeyUp={quick ? undefined : e => { if (e.key === ' ' || e.key === 'Enter') cancel(); }} onBlur={cancel}>
            <span className="gc-hold-face"><Lock/>{label}</span>
            {quick ? null : <span className="gc-hold-fill" aria-hidden="true"><Lock/>{label}</span>}
          </button> : <div className="gc-lock" role="status">
            <Lock/><span><strong>Code shows at the gate</strong><span>Within {GEOFENCE_FT} ft. {toGo} ft to go</span></span>
          </div>}
        </div>
        <label className="gc-tap"><input type="checkbox" checked={tap} onChange={e => setTap(e.target.checked)}/>Tap instead of hold <small>for gloves or switch control</small></label>
      </div>
    </div>
    <Takeaway show={used} instant={instant}>The order grants the code. Being at the gate only reveals it.</Takeaway>
    <p className="v2-caption"><span>The prototype’s gate step: a 160 ft circle (about 50 m), a 0.9-second hold, a code that hides after 20 seconds. The radius is a placeholder until a field test measures GPS error at a real gate.</span></p>
  </div>;
}

const Lock = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>;
