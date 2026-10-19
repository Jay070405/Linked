// Charts and diagrams drawn from the cases' own data, in the page's ink and one accent. Every chart also
// has a text equivalent in its figure (aria-label plus caption), and the numbers appear in the body or a table.

/* Roco: the 10 logged batches. x = share of throws made with the seasonal Fairy-tale Ball, y = clover sketches
   per 100 throws. Source: src/pages/roco-data.json (records TEST-01 to TEST-10). */
const BATCHES = [
  {id: 'TEST-01', fairy: 504, total: 504, sketches: 68},
  {id: 'TEST-02', fairy: 500, total: 500, sketches: 70},
  {id: 'TEST-03', fairy: 502, total: 502, sketches: 74},
  {id: 'TEST-04', fairy: 0, total: 1099, sketches: 47, ball: 'Net'},
  {id: 'TEST-05', fairy: 0, total: 1036, sketches: 41, ball: 'Advanced Gulu'},
  {id: 'TEST-06', fairy: 0, total: 1000, sketches: 33, ball: 'Advanced Gulu'},
  {id: 'TEST-07', fairy: 325, total: 945, sketches: 72},
  {id: 'TEST-08', fairy: 200, total: 301, sketches: 33},
  {id: 'TEST-09', fairy: 200, total: 520, sketches: 29},
  {id: 'TEST-10', fairy: 183, total: 225, sketches: 32},
];

export function RocoBatchChart() {
  const W = 640, H = 330, L = 52, R = 24, T = 26, B = 58;
  const x = share => L + share * (W - L - R);
  const y = rate => T + (1 - rate / 16) * (H - T - B);
  const ticksY = [0, 4, 8, 12, 16], ticksX = [0, .25, .5, .75, 1];
  return <svg viewBox={`0 0 ${W} ${H}`} className="pp-chart" style={{minWidth: 480}}>
    {ticksY.map(t => <g key={t}>
      <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className={t ? 's-stroke-rule' : 's-stroke-strong'}/>
      <text x={L - 10} y={y(t) + 4} textAnchor="end" className="s-text">{t}</text>
    </g>)}
    {ticksX.map(t => <text key={t} x={x(t)} y={H - B + 22} textAnchor={t === 0 ? 'start' : t === 1 ? 'end' : 'middle'} className="s-text">{Math.round(t * 100)}%</text>)}
    <text x={L} y={T - 10} className="s-text">Clover sketches per 100 throws</text>
    <text x={W - R} y={H - 8} textAnchor="end" className="s-text">Share of throws using the Fairy-tale Ball</text>
    {BATCHES.map(b => {
      const share = b.fairy / b.total, rate = b.sketches / b.total * 100, single = share === 0 || share === 1;
      return <circle key={b.id} cx={x(share)} cy={y(rate)} r={single ? 6 : 5.5} className={single ? 's-ink' : 's-hollow'}>
        <title>{`${b.id}: ${b.total} throws, ${Math.round(share * 100)}% Fairy-tale, ${rate.toFixed(1)} sketches per 100`}</title>
      </circle>;
    })}
    <text x={x(1) - 14} y={y(12.3)} textAnchor="end" className="s-text s-text-ink">Fairy-tale only, 3 batches</text>
    <text x={x(0) + 14} y={y(1.6)} className="s-text s-text-ink">Advanced Gulu or Net only, 3 batches</text>
    <text x={x(.42)} y={y(7.4)} className="s-text">Mixed, 4 batches</text>
  </svg>;
}

/* League: 20,000 simulated matches. Share of games by the gap between the two teams' average rating, in 5-point
   bins from 0 to 150. Source: public/assets/lol/gap-sim.json (85% of games with within-match SD 35, 15% long-queue
   games with SD 70, fixed seed). Not Riot data. */
const GAP_BINS = [16.675, 15.85, 14.51, 12.035, 10.295, 8.26, 6.44, 4.7, 3.27, 2.15, 1.56, 1.05, .745, .575, .405, .26, .295, .27, .16, .13, .085, .085, .05, .045, .025, .01, .025, .005, .005, .03];

export function GapChart() {
  const W = 960, H = 350, L = 52, R = 20, T = 70, B = 52, step = 5, max = 150;
  const x = v => L + v / max * (W - L - R);
  const y = pct => T + (1 - pct / 20) * (H - T - B);
  const zones = [[0, 25, 'Even: under 25', '69.4% of games'], [25, 75, 'Slight gap: 25–75', '29.2%'], [75, 150, 'Large gap: 75 and over', '1.5%']];
  return <svg viewBox={`0 0 ${W} ${H}`} className="pp-chart" style={{minWidth: 640}}>
    {zones.map(([a, b, name, share], i) => <g key={name}>
      {i === 1 && <rect x={x(a)} y={T} width={x(b) - x(a)} height={H - T - B} className="s-surface"/>}
      <line x1={x(a)} x2={x(a)} y1={T - 48} y2={H - B} className="s-stroke-strong"/>
      <text x={x(a) + 8} y={T - 34} className="s-text s-text-ink s-text-strong">{name}</text>
      <text x={x(a) + 8} y={T - 15} className="s-text">{share}</text>
    </g>)}
    {[0, 5, 10, 15, 20].map(t => <g key={t}>
      <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className={t ? 's-stroke-rule' : 's-stroke-strong'}/>
      <text x={L - 10} y={y(t) + 4} textAnchor="end" className="s-text">{t}%</text>
    </g>)}
    {GAP_BINS.map((v, i) => <rect key={i} x={x(i * step) + 2} y={y(v)} width={x(step) - x(0) - 4} height={Math.max(.5, y(0) - y(v))} className={i * step < 25 ? 's-red' : 's-ink'}/>)}
    {[0, 25, 50, 75, 100, 125, 150].map(t => <text key={t} x={x(t)} y={H - B + 20} textAnchor={t ? 'middle' : 'start'} className="s-text">{t}</text>)}
    <text x={W - R} y={H - 6} textAnchor="end" className="s-text">Gap between the two teams’ average rating, in points</text>
  </svg>;
}

/* Design-to-code: the chart the benchmark will fill. Empty frames on purpose. */
export function DesignToCodeChartSlot() {
  const W = 960, H = 340, L = 64, R = 30, T = 36, B = 50;
  const y = p => T + (1 - p) * (H - T - B);
  const cols = ['Raw', 'Structured', 'Systematized'], band = (W - L - R) / cols.length;
  return <svg viewBox={`0 0 ${W} ${H}`} className="pp-chart" style={{minWidth: 600}}>
    <text x={L} y={18} className="s-text">Responsive checks passed, median of 12 generations (placeholder: results pending)</text>
    {[0, .5, 1].map(p => <g key={p}>
      <line x1={L} x2={W - R} y1={y(p)} y2={y(p)} className={p ? 's-stroke-rule' : 's-stroke-strong'}/>
      <text x={L - 12} y={y(p) + 4} textAnchor="end" className="s-text">{p * 100}%</text>
    </g>)}
    {cols.map((c, i) => {
      const cx = L + band * i + band / 2;
      return <g key={c}>
        <rect x={cx - 70} y={y(1)} width={140} height={y(0) - y(1)} className="s-stroke-strong s-dash"/>
        <text x={cx} y={(y(0) + y(1)) / 2} textAnchor="middle" className="s-text" style={{fontSize: 15}}>[N]%</text>
        <text x={cx} y={H - B + 26} textAnchor="middle" className="s-text s-text-ink">{c}</text>
      </g>;
    })}
  </svg>;
}

/* League: the year as a chain, with the three places the information goes missing. Redrawn in English from
   Jay's annotated diagram (public/assets/lol/c0-system-annotated.webp). */
const CHAIN = [
  {name: 'Season content', job: 'Brings players back', gap: null},
  {name: 'Battle pass', job: 'Gives them a goal', gap: 'Shows your level, not how much longer a reward will take'},
  {name: 'Ranked', job: 'The daily core', gap: 'Shows only rank, so after a loss it’s easy to blame a teammate or the matchmaker'},
  {name: 'Worlds', job: 'The peak of attention', gap: 'Fearless Draft can be watched, but not played'},
];

export function YearChain() {
  let gap = 0;
  return <ol className="pp-chain">
    {CHAIN.map(step => <li key={step.name}>
      <p className="pp-chain-name">{step.name}</p>
      <p className="pp-chain-job">{step.job}</p>
      {step.gap ? <p className="pp-chain-gap"><span className="pp-chain-mark" aria-label={`Problem ${++gap}`}>{gap}</span>{step.gap}</p> : <p className="pp-chain-gap is-empty" aria-hidden="true"/>}
    </li>)}
  </ol>;
}
