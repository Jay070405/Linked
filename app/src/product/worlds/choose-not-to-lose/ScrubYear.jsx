import {useMemo, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {L, useCaseLang} from '../../i18n';
import {cost, plans, premiumDifference} from '../../v2/data/cntl-model.js';
import {Ask, Rule, Takeaway, usd} from './bits';
import {Register, useKeyed} from './print';

/* "Scrub the year" (D4 world): the bills slider, printed on the receipt. Drag a year's covered bills from $0 to $40,000;
   every plan's line item (premiums, deductible, coinsurance, the year) re-prints from the prototype's tested cost
   model (v2/data/cntl-model.js) and its digits roll like a register. Beside it on the desk (inline on narrow screens),
   the same totals as a thermal-printed chart: Plan B's dashed line runs exactly $600 above Plan A's at every amount,
   and the strip between them, red because it is money lost, is that $600. The control is a real range input; the
   chart can be dragged too. (Re-skin of v2/modules/BillsSlider.jsx.) */

const MAX = 40000, STEP = 250, YMAX = 10000;
const fmt = v => `$${Math.round(v).toLocaleString('en-US')}`;
const WIDE = {W: 600, H: 340, L: 52, R: 26, T: 16, B: 36};
const NARROW = {W: 340, H: 260, L: 44, R: 20, T: 14, B: 34};
const GAP = premiumDifference(plans[1], plans[0]);

const T = {
  ask: L('Scrub the year: drag its covered bills.', '拖动这一年的承保医疗费用。'),
  amount: L('Covered bills this year', '今年的承保医疗费用'),
  valuetext: v => L(`${v} in covered bills`, `承保医疗费用 ${v}`),
  caption: v => L(`Yearly total per plan at ${v} in covered bills`, `承保医疗费用为 ${v} 时，各方案的全年总费用`),
  plan: L('Plan', '方案'), premiums: L('Premiums', '保费'), deductible: L('Deductible', '免赔额'), coinsurance: L('Coinsurance', '共同保险'), year: L('The year', '全年'),
  lowest: L('Lowest at this amount', '这个金额下最低'),
  overA: d => L(`+${d} vs A, same terms`, `比 A 多 ${d}，条款相同`),
  coinsToMax: L('Coinsurance, to the maximum', '共同保险（算到上限为止）'),
  takeaway: L('At every amount, Plan B costs exactly $600 more than Plan A.', '无论金额多少，Plan B 都正好比 Plan A 多花 $600。'),
  cap: L('Fictional plans, the prototype’s own cost model and its tests: covered, in-network bills only. Uncovered and out-of-network bills can add more.',
    '虚构方案，用原型自己的费用模型（测试过）来算：只算网络内的承保医疗费用。不在承保范围内或网络外的账单，可能还会更多。'),
  slip: L('Every plan’s year, $0 to $40,000 in covered bills', '承保医疗费用从 $0 到 $40,000 时，每个方案的全年费用'),
  chartLabel: (v, list) => L(`Yearly total per plan for covered bills from $0 to $40,000. At ${v}: ${list}. Plan B is $600 above Plan A everywhere.`,
    `承保医疗费用从 $0 到 $40,000 时各方案的全年总费用。在 ${v} 时：${list}。Plan B 在每个金额下都比 Plan A 高 $600。`),
  chartCap: L('Plan A solid, Plan B dashed, C and D in gray. Drag across the chart to scrub. The red strip is the $600 B costs over A.',
    'Plan A 是实线，Plan B 是虚线，C 和 D 是灰线。在图上左右拖动也能调整金额。红色带就是 B 比 A 多花的 $600。'),
};

export function useScrub(still = false, onBills) {
  const [bills, setBills] = useState(4000);
  const [touched, setTouched] = useState(false);
  const mode = useKeyed();
  const set = v => {
    const next = Math.max(0, Math.min(MAX, Math.round(v / STEP) * STEP));
    setBills(next); setTouched(true); onBills?.(next);
  };
  const now = plans.map(p => ({p, ...cost(p, bills * 100)}));
  return {bills, set, touched, mode, now, low: Math.min(...now.map(n => n.total)), instant: still || mode.keyed.current};
}

export function ScrubLines({s, compact = false, chart = null}) {
  const {t} = useCaseLang();
  const {bills, set, touched, mode, now, low, instant} = s;
  const a = now[0];
  return <div className={`cnr-s${instant ? ' is-instant' : ''}`} {...mode.bind}>
    <Ask>{t(T.ask)}</Ask>
    <p className="cnr-s-amount" data-print=""><span className="cnr-s-amount-l">{t(T.amount)}</span><Register text={fmt(bills)} instant={instant} className="cnr-s-amount-n"/></p>
    <div className="cnr-s-control" data-print="">
      <input className="cnr-range" type="range" min="0" max={MAX} step={STEP} value={bills} style={{'--fill': `${bills / MAX * 100}%`}}
        aria-label={t(T.amount)} aria-valuetext={t(T.valuetext(fmt(bills)))}
        onChange={e => set(Number(e.target.value))}/>
      <div className="cnr-s-scale" aria-hidden="true">{[0, 10000, 20000, 30000, 40000].map(v => <span key={v}>{fmt(v)}</span>)}</div>
    </div>
    <Rule/>
    <table className={`cnr-s-table${compact ? ' is-compact' : ''}`} data-print="">
      <caption className="cnr-sr">{t(T.caption(fmt(bills)))}</caption>
      <thead><tr>
        <th scope="col">{t(T.plan)}</th>
        {compact ? null : <><th scope="col">{t(T.premiums)}</th><th scope="col">{t(T.deductible)}</th><th scope="col">{t(T.coinsurance)}</th></>}
        <th scope="col">{t(T.year)}</th>
      </tr></thead>
      {now.map(n => <tbody key={n.p.id} className={`is-${n.p.id}${n.total === low ? ' is-low' : ''}`}>
        <tr>
          <th scope="row"><span className="cnr-s-key" aria-hidden="true"/>{n.p.name}</th>
          {compact ? null : <><td>{usd(n.premium)}</td><td>{usd(n.deductible)}</td><td>{usd(n.coinsurance)}</td></>}
          <td className="cnr-s-total"><Register text={usd(n.total)} instant={instant}/></td>
        </tr>
        <tr className="cnr-s-sub">
          <td colSpan={compact ? 2 : 5}>
            <span className="cnr-s-bar" aria-hidden="true">
              <i className="is-prem" style={{width: `${n.premium / 100 / YMAX * 100}%`}}/>
              <i className="is-ded" style={{width: `${n.deductible / 100 / YMAX * 100}%`}}/>
              <i className="is-coins" style={{width: `${n.coinsurance / 100 / YMAX * 100}%`}}/>
            </span>
            <span className="cnr-s-notes">
              {compact ? <span className="cnr-s-parts">{usd(n.premium)} + {usd(n.deductible)} + {usd(n.coinsurance)}</span> : null}
              {n.total === low ? <span className="cnr-s-note">{t(T.lowest)}</span>
                : n.p.id === 'b' ? <span className="cnr-s-note is-loss">{t(T.overA(usd(n.total - a.total)))}</span> : null}
            </span>
          </td>
        </tr>
      </tbody>)}
    </table>
    <p className="cnr-s-legend" aria-hidden="true" data-print=""><span><i className="is-prem"/>{t(T.premiums)}</span><span><i className="is-ded"/>{t(T.deductible)}</span><span><i className="is-coins"/>{t(T.coinsToMax)}</span></p>
    {chart}
    <Takeaway show={touched} instant={instant}>{t(T.takeaway)}</Takeaway>
    <p className="cnr-cap" data-print=""><Ev label="Simulated"/><span>{t(T.cap)}</span></p>
  </div>;
}

export function ScrubChart({s, compact = false, onDesk = false}) {
  const {t} = useCaseLang();
  const {bills, set, now, mode} = s;
  const G = compact ? NARROW : WIDE;
  const plot = useRef(null), drag = useRef(null);
  const x = v => G.L + (G.W - G.L - G.R) * v / MAX;
  const y = v => G.T + (G.H - G.T - G.B) * (1 - v / YMAX);
  // each plan's yearly total across the range: straight between the deductible and the cap, so a point every $250
  // draws it exactly
  const lines = useMemo(() => plans.map(p => {
    const pts = [];
    for (let v = 0; v <= MAX; v += STEP) pts.push([x(v), y(cost(p, v * 100).total / 100)]);
    return {p, pts, d: 'M' + pts.map(([a, b]) => `${a.toFixed(1)} ${b.toFixed(1)}`).join(' L')};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [compact]);
  const band = useMemo(() => `M${lines[1].pts.map(([a, b]) => `${a.toFixed(1)} ${b.toFixed(1)}`).join(' L')} L${[...lines[0].pts].reverse().map(([a, b]) => `${a.toFixed(1)} ${b.toFixed(1)}`).join(' L')} Z`, [lines]);
  const a = now[0], b = now[1];
  const flip = bills > MAX * .72;

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

  return <figure className={`cnr-s-chart${onDesk ? ' is-desk' : ''}`} data-print={onDesk ? undefined : ''}>
    {onDesk ? <p className="cnr-slip-title">{t(T.slip)}</p> : <Rule/>}
    <svg ref={plot} viewBox={`0 0 ${G.W} ${G.H}`} className="cnr-s-plot" role="img"
      aria-label={t(T.chartLabel(fmt(bills), now.map(n => `${n.p.name} ${usd(n.total)}`).join(', ')))}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; }}>
      {[0, 2000, 4000, 6000, 8000, 10000].map(v => <g key={v} className="cnr-s-grid"><path d={`M${G.L} ${y(v)} H${G.W - G.R}`}/><text x={G.L - 8} y={y(v) + 4}>{v ? `$${v / 1000}k` : '$0'}</text></g>)}
      {[0, 10000, 20000, 30000, 40000].map(v => <text key={v} className="cnr-s-xtick" x={x(v)} y={G.H - 10}>{v ? `$${v / 1000}k` : '$0'}</text>)}
      <path className="cnr-s-band" d={band}/>
      {lines.map(l => <path key={l.p.id} className={`cnr-s-line is-${l.p.id}`} d={l.d}/>)}
      {lines.map(l => <text key={l.p.id} className={`cnr-s-end is-${l.p.id}`} x={G.W - G.R + 6} y={y(cost(l.p, MAX * 100).total / 100) + ({a: 13, b: 10, c: -4, d: 4})[l.p.id]}>{l.p.id.toUpperCase()}</text>)}
      <g className="cnr-s-cursor" transform={`translate(${x(bills)} 0)`}>
        <path d={`M0 ${G.T - 4} V${G.H - G.B}`}/>
        {now.map(n => <rect key={n.p.id} className={`is-${n.p.id}`} x="-4" y={y(n.total / 100) - 4} width="8" height="8"/>)}
        <g className="cnr-s-gap" transform={`translate(${flip ? -10 : 10} 0)`}>
          <path d={`M0 ${y(b.total / 100)} h${flip ? -5 : 5} V${y(a.total / 100)} h${flip ? 5 : -5}`}/>
          <text x={flip ? -9 : 9} y={(y(a.total / 100) + y(b.total / 100)) / 2 + 4} textAnchor={flip ? 'end' : 'start'}>B − A = {usd(GAP)}</text>
        </g>
      </g>
    </svg>
    <figcaption className="cnr-s-chart-cap">{t(T.chartCap)}</figcaption>
  </figure>;
}
