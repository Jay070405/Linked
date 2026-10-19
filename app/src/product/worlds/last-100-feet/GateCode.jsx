import {useEffect, useRef, useState} from 'react';
import {Ask, Takeaway, useInputMode} from '../../v2/Try';
import {ADDRESS, GATE, GEOFENCE_FT, HOLD_MS, REVEAL_SECONDS, WAYPOINTS, courierAt} from '../../v2/data/l100-route';
import {DuskPlan, REGION} from './DuskPlan';

/* The gate code with distance (v2/modules/GateCode.jsx, re-skinned for the dusk world): drag the courier toward the
   Elm St gate. Outside the 160 ft geofence the code is locked and says how far is left; inside, hold the button for
   0.9 s (or tap, with "Tap instead of hold") and the code shows in keypad order, hides after 20 seconds, and comes
   back with one tap. The order authorizes the code; being near only reveals it. */

const VIEW = {x: -30, y: 250, w: 450, h: 300};
const MAX_FT = 240;
const Lock = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>;

export default function GateCode({reduced = false}) {
  const [ft, setFt] = useState(220);
  const [mode, setMode] = useState('locked');     // locked | near | revealed
  const [seen, setSeen] = useState(false);
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

  useEffect(() => { setMode(m => (inside ? (m === 'locked' ? 'near' : m) : 'locked')); }, [inside]);
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
  const start = () => { if (holding) return; setHolding(true); timer.current = setTimeout(() => { setHolding(false); reveal(); }, HOLD_MS); };
  const cancel = () => { clearTimeout(timer.current); setHolding(false); };
  const quick = tap || seen;
  const label = seen ? 'Show code again' : tap ? 'Show gate code' : 'Hold to show gate code';
  const pct = (p, axis) => (axis === 'x' ? (p.x - VIEW.x) / VIEW.w : (p.y - VIEW.y) / VIEW.h) * 100;

  return <div className={`w3-gc${instant ? ' is-instant' : ''}`} {...input.bind}>
    <Ask>Drag the courier to the gate, then hold the red button.</Ask>
    <div className="w3-gc-grid">
      <div className="w3-gc-map">
        <svg viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} role="img" aria-label={`Site plan around the Elm St gate. The courier is ${ft} feet from the gate, ${inside ? 'inside' : 'outside'} the ${GEOFENCE_FT}-foot circle where the code can show.`}>
          <DuskPlan x={REGION.x} y={REGION.y} width={REGION.w} height={REGION.h} ids="w3gc" labels={false} palette="day"/>
          <DuskPlan x={REGION.x} y={REGION.y} width={REGION.w} height={REGION.h} ids="w3gc" labels={false} palette="dusk"/>
          <circle className={`w3-gc-fence${inside ? ' is-in' : ''}`} cx={GATE.x} cy={GATE.y} r={GEOFENCE_FT}/>
          <g className="w3-gc-gate"><rect x={GATE.x - 10} y={GATE.y - 10} width="20" height="20" rx="5.5"/><path d={`M${GATE.x - 5} ${GATE.y + 5} V${GATE.y - 5} M${GATE.x + 5} ${GATE.y + 5} V${GATE.y - 5} M${GATE.x - 5} ${GATE.y - 2.5} H${GATE.x + 5} M${GATE.x - 1.7} ${GATE.y - 2.5} V${GATE.y + 5} M${GATE.x + 1.7} ${GATE.y - 2.5} V${GATE.y + 5}`}/></g>
          <g className="w3-gc-dot" transform={`translate(${dot.x} ${dot.y})`}><circle r="14"/><circle r="8"/><circle r="5.5"/></g>
        </svg>
        <span className="w3-gc-ring" style={{left: `${pct({x: GATE.x - GEOFENCE_FT * .72, y: 0}, 'x')}%`, top: `${pct({x: 0, y: GATE.y - GEOFENCE_FT * .66}, 'y')}%`}} aria-hidden="true">{GEOFENCE_FT} ft</span>
        <span className="w3-gc-gatelabel" style={{left: `${pct(GATE, 'x')}%`, top: `${pct(GATE, 'y')}%`}} aria-hidden="true">{WAYPOINTS[1].name}</span>
      </div>

      <div className="w3-gc-side">
        <div className="w3-gc-dist">
          <label htmlFor="w3-gc-range">Distance to the gate</label>
          <output htmlFor="w3-gc-range">{ft} ft</output>
        </div>
        <input id="w3-gc-range" className="w3-range" type="range" min="0" max={MAX_FT} step="5" value={MAX_FT - ft}
          style={{'--fill': `${(MAX_FT - ft) / MAX_FT * 100}%`}} aria-valuetext={`${ft} feet from the gate`}
          onChange={e => { setFt(MAX_FT - Number(e.target.value)); setUsed(true); }}/>
        <div className="w3-gc-scale" aria-hidden="true"><span>{MAX_FT} ft away</span><span>At the gate</span></div>

        <div className="w3-gc-card" aria-live="polite">
          {mode === 'revealed' ? <div className="w3-code" data-hiding={hiding || undefined}>
            <p className="w3-code-label">Enter on the call box</p>
            <div className="w3-keys" role="img" aria-label={`Gate code ${ADDRESS.code.split('').join(' ')}, then pound`}>
              {[...ADDRESS.code, '#'].map((d, i) => <span key={i} className="w3-key" data-pound={d === '#' || undefined} style={{'--i': i}} aria-hidden="true">{d}</span>)}
            </div>
            <div className="w3-timer">
              <span className="w3-bar" aria-hidden="true"><span style={{animationDuration: `${REVEAL_SECONDS}s`}}/></span>
              <span className="w3-left">Hides in {left} s, tap to show again</span>
            </div>
          </div> : mode === 'near' ? <button type="button" className={`w3-hold${holding ? ' is-holding' : ''}`} style={{'--hold': `${HOLD_MS}ms`}}
            aria-label={quick ? label : `${label}. Press and hold.`}
            onClick={quick ? reveal : undefined}
            onPointerDown={quick ? undefined : e => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* released */ } start(); }}
            onPointerUp={quick ? undefined : cancel} onPointerCancel={quick ? undefined : cancel} onContextMenu={e => e.preventDefault()}
            onKeyDown={quick ? undefined : e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } }}
            onKeyUp={quick ? undefined : e => { if (e.key === ' ' || e.key === 'Enter') cancel(); }} onBlur={cancel}>
            <span className="w3-hold-face"><Lock/>{label}</span>
            {quick ? null : <span className="w3-hold-fill" aria-hidden="true"><Lock/>{label}</span>}
          </button> : <div className="w3-gc-lock" role="status">
            <Lock/><span><strong>Code shows at the gate</strong><span>Within {GEOFENCE_FT} ft. {toGo} ft to go</span></span>
          </div>}
        </div>
        <label className="w3-tap"><input type="checkbox" checked={tap} onChange={e => setTap(e.target.checked)}/>Tap instead of hold <small>for gloves or switch control</small></label>
      </div>
    </div>
    <Takeaway show={used} instant={instant}>The order grants the code. Being at the gate only reveals it.</Takeaway>
    <p className="w3-small">The prototype’s gate step: a 160 ft circle (about 50 m), a 0.9-second hold, a code that hides after 20 seconds. The radius is a placeholder until a field test measures GPS error at a real gate.</p>
  </div>;
}
