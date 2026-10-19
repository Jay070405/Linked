import {useMemo, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {PHONE, useMedia} from '../motion';
import {Ask, Takeaway, Tween, useInputMode} from '../Try';
import {cost, money, plans, premiumDifference} from '../data/cntl-model';
import './bills.css';

/* D4, the bills slider: drag a year's covered bills from $0 to $40,000 and every plan's yearly total (premiums plus
   what you pay under its deductible, coinsurance and out-of-pocket maximum) follows, from the prototype's tested cost
   model (data/cntl-model.js). Plan B's line runs exactly $600 above Plan A's everywhere; the bracket at the cursor says
   so. The slider is a real range input; the chart can be dragged too. */

const MAX = 40000, STEP = 250, YMAX = 10000;
const STYLE = {a: 'is-a', b: 'is-b', c: 'is-c', d: 'is-d'};
const dollars = c => money(Math.round(c / 100) * 100);
const fmt = v => `$${Math.round(v).toLocaleString('en-US')}`;
const WIDE = {W: 1120, H: 420, L: 64, R: 76, T: 18, B: 40};
const NARROW = {W: 400, H: 300, L: 50, R: 18, T: 18, B: 40};

export default function BillsSlider({reduced = false}) {
  const [bills, setBills] = useState(4000);
  const [touched, setTouched] = useState(false);
  const mode = useInputMode();
  const compact = useMedia(PHONE);
  const G = compact ? NARROW : WIDE;
  const plot = useRef(null), drag = useRef(null);
  const x = v => G.L + (G.W - G.L - G.R) * v / MAX;
  const y = v => G.T + (G.H - G.T - G.B) * (1 - v / YMAX);
  const set = v => { setBills(Math.max(0, Math.min(MAX, Math.round(v / STEP) * STEP))); setTouched(true); };
  const instant = reduced || mode.keyed.current;

  // each plan's yearly total across the range: straight between the deductible and the out-of-pocket cap, so a point
  // every $250 draws it exactly
  const lines = useMemo(() => plans.map(p => {
    const pts = [];
    for (let v = 0; v <= MAX; v += STEP) pts.push([x(v), y(cost(p, v * 100).total / 100)]);
    return {p, d: 'M' + pts.map(([a, b]) => `${a.toFixed(1)} ${b.toFixed(1)}`).join(' L')};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [compact]);
  const now = plans.map(p => ({p, ...cost(p, bills * 100)}));
  const low = Math.min(...now.map(n => n.total));
  const a = now[0], b = now[1];
  const gap = premiumDifference(plans[1], plans[0]);

  // dragging across the plot sets the bills; a vertical swipe still scrolls the page
  const at = e => { const r = plot.current.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * G.W; return (px - G.L) / (G.W - G.L - G.R) * MAX; };
  const down = e => { if (e.button !== 0) return; drag.current = {x: e.clientX, y: e.clientY, id: e.pointerId, moved: false}; mode.keyed.current = false; };
  const move = e => {
    const d = drag.current; if (!d || d.id !== e.pointerId) return;
    if (!d.moved) {
      const dx = Math.abs(e.clientX - d.x), dy = Math.abs(e.clientY - d.y);
      if (dy > dx && dy > 6) { drag.current = null; return; }
      if (dx < 4) return;
      d.moved = true; plot.current.setPointerCapture(e.pointerId);
    }
    set(at(e));
  };
  const up = e => { const d = drag.current; drag.current = null; if (d && !d.moved && d.id === e.pointerId) set(at(e)); };

  return <div className={`cb${instant ? ' is-instant' : ''}`} {...mode.bind}>
    <div className="cb-top">
      <Ask>Drag the year’s covered bills.</Ask>
      <p className="cb-amount"><Tween value={bills} format={fmt} instant={instant}/><span>in covered bills this year</span></p>
    </div>
    <input className="v2-range cb-range" type="range" min="0" max={MAX} step={STEP} value={bills} style={{'--fill': `${bills / MAX * 100}%`}}
      aria-label="Covered bills this year" aria-valuetext={`${fmt(bills)} in covered bills`}
      onChange={e => set(Number(e.target.value))}/>
    <div className="cb-scale" aria-hidden="true"><span>$0</span><span>$10,000</span><span>$20,000</span><span>$30,000</span><span>$40,000</span></div>

    <figure className="cb-chart">
      <svg ref={plot} viewBox={`0 0 ${G.W} ${G.H}`} className="cb-plot" role="img" aria-label={`Yearly total per plan for covered bills from $0 to $40,000. At ${fmt(bills)}: ${now.map(n => `${n.p.name} ${dollars(n.total)}`).join(', ')}. Plan B is $600 above Plan A everywhere.`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; }}>
        {[0, 2000, 4000, 6000, 8000, 10000].map(v => <g key={v} className="cb-grid"><path d={`M${G.L} ${y(v)} H${G.W - G.R + 6}`}/><text x={G.L - 10} y={y(v) + 4}>{v ? `$${v / 1000}k` : '$0'}</text></g>)}
        {[0, 10000, 20000, 30000, 40000].map(v => <text key={v} className="cb-xtick" x={x(v)} y={G.H - 14}>{v ? `$${v / 1000}k` : '$0'}</text>)}
        {/* the gap between A and B, the whole way */}
        <path className="cb-band" d={`${lines[1].d} L${lines[0].d.slice(1).split(' L').reverse().join(' L')} Z`}/>
        {lines.map(l => <path key={l.p.id} className={`cb-line ${STYLE[l.p.id]}`} d={l.d}/>)}
        {!compact ? lines.map(l => <text key={l.p.id} className={`cb-end ${STYLE[l.p.id]}`} x={G.W - G.R + 10} y={y(cost(l.p, MAX * 100).total / 100) + (l.p.id === 'c' ? -6 : l.p.id === 'b' ? 10 : 4)}>{l.p.name}</text>) : null}
        <g className="cb-cursor" transform={`translate(${x(bills)} 0)`}>
          <path d={`M0 ${G.T - 6} V${G.H - G.B}`}/>
          {now.map(n => <circle key={n.p.id} className={STYLE[n.p.id]} cy={y(n.total / 100)} r="4.5"/>)}
          <g className="cb-gap" transform={`translate(${bills > MAX * .8 ? -12 : 12} 0)`}>
            <path d={`M0 ${y(b.total / 100)} h${bills > MAX * .8 ? -6 : 6} V${y(a.total / 100)} h${bills > MAX * .8 ? 6 : -6}`}/>
            <text x={bills > MAX * .8 ? -10 : 10} y={(y(a.total / 100) + y(b.total / 100)) / 2 + 4} textAnchor={bills > MAX * .8 ? 'end' : 'start'}>B − A = {dollars(gap)}</text>
          </g>
        </g>
      </svg>
    </figure>

    <ul className="cb-rows" aria-label={`Yearly total at ${fmt(bills)} in covered bills`}>
      {now.map(n => <li key={n.p.id} className={`${STYLE[n.p.id]}${n.total === low ? ' is-low' : ''}`}>
        <span className="cb-key" aria-hidden="true"/>
        <span className="cb-name">{n.p.name}{n.total === low ? <small>Lowest at this amount</small> : n.p.id === 'b' ? <small>Same terms as A, higher premium</small> : null}</span>
        <span className="cb-bar" aria-hidden="true">
          <i className="is-prem" style={{width: `${n.premium / 100 / YMAX * 100}%`}}/>
          <i className="is-ded" style={{width: `${n.deductible / 100 / YMAX * 100}%`}}/>
          <i className="is-coins" style={{width: `${n.coinsurance / 100 / YMAX * 100}%`}}/>
        </span>
        <span className="cb-total"><Tween value={n.total / 100} format={fmt} instant={instant}/></span>
      </li>)}
    </ul>
    <p className="cb-legend" aria-hidden="true"><span><i className="is-prem"/>Premiums</span><span><i className="is-ded"/>Deductible</span><span><i className="is-coins"/>Coinsurance, to the maximum</span></p>

    <Takeaway show={touched} instant={instant}>At every amount, Plan B costs exactly $600 more than Plan A.</Takeaway>
    <p className="v2-caption"><Ev label="Simulated"/><span>Fictional plans, the prototype’s own cost model and its tests: covered, in-network bills only. Uncovered and out-of-network bills can add more.</span></p>
  </div>;
}
