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

/* The index thumbnail for "where players break": the same simulation, drawn large enough to read at card size
   (0 to 100 points; the bins above 100 hold under 0.3% of games). */
export function GapThumb() {
  const W = 800, H = 500, L = 56, R = 40, T = 130, B = 74, bins = GAP_BINS.slice(0, 20), max = 18;
  const bw = (W - L - R) / bins.length;
  const y = v => T + (1 - v / max) * (H - T - B);
  return <svg viewBox={`0 0 ${W} ${H}`} className="pp-thumb-chart" aria-hidden="true">
    <path d={`M${L + 3} ${T - 30} H${L + bw * 5 - 3} M${L + 3} ${T - 38} V${T - 22} M${L + bw * 5 - 3} ${T - 38} V${T - 22}`} className="s-stroke-red"/>
    <text x={L} y={T - 56} className="s-thumb-text"><tspan className="s-text-red s-text-strong">69.4% of games</tspan> have team averages within 25 points</text>
    {bins.map((v, i) => <rect key={i} x={L + i * bw + 3} y={y(v)} width={bw - 6} height={Math.max(1.5, y(0) - y(v))} className={i < 5 ? 's-red' : 's-ink'}/>)}
    <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} className="s-stroke-strong"/>
    {[0, 25, 50, 75, 100].map(t => <text key={t} x={L + t / 5 * bw} y={H - B + 38} textAnchor={t ? 'middle' : 'start'} className="s-thumb-text s-thumb-axis">{t}</text>)}
  </svg>;
}

/* Design-to-code, exploratory measures (not pre-registered): median per level, whisker = min-max, n = 6 each.
   Source: p2-benchmark/results/results.md (harness/summarize.js, 24 runs). The harness's own chart
   (results/figures/exploratory-coherence.svg) has the same numbers but its text is too small for this column. */
const LEVELS = [['L0', 'Raw'], ['L0V', 'Raw + variables'], ['L1', 'Structured'], ['L2', 'Systematized']];
const COHERENCE = [
  {title: 'Design-system names used', values: [[28, 23, 33], [100, 100, 100], [33, 19, 50], [100, 100, 100]]},
  {title: 'Follows a token change (4 tokens)', values: [[50, 25, 67], [100, 100, 100], [37, 25, 67], [100, 100, 100]]},
];
function CoherencePanel({title, values}) {
  const W = 440, H = 310, L = 50, R = 8, T = 52, B = 58, band = (W - L - R) / LEVELS.length, bar = 46;
  const y = p => T + (1 - p / 100) * (H - T - B);
  return <svg viewBox={`0 0 ${W} ${H}`} className="pp-chart">
    <text x={0} y={16} className="s-text s-text-ink s-text-strong" style={{fontSize: 15}}>{title}</text>
    {[0, 50, 100].map(t => <g key={t}>
      <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className={t ? 's-stroke-rule' : 's-stroke-strong'}/>
      <text x={L - 8} y={y(t) + 4} textAnchor="end" className="s-text">{t}%</text>
    </g>)}
    {values.map(([median, min, max], i) => {
      const cx = L + band * i + band / 2;
      return <g key={LEVELS[i][0]}>
        <rect x={cx - bar / 2} y={y(median)} width={bar} height={y(0) - y(median)} className={i === 1 ? 's-red' : 's-ink'}/>
        {max > min && <line x1={cx} x2={cx} y1={y(max)} y2={y(min)} className="s-stroke-whisker"/>}
        <text x={cx} y={y(Math.max(median, max)) - 8} textAnchor="middle" className="s-text s-text-ink s-text-strong">{median}%</text>
        <text x={cx} y={H - B + 20} textAnchor="middle" className="s-text s-text-ink s-text-strong">{LEVELS[i][0]}</text>
        <text x={cx} y={H - B + 38} textAnchor="middle" className="s-text" style={{fontSize: 12}}>{LEVELS[i][1]}</text>
      </g>;
    })}
  </svg>;
}
export const CoherenceCharts = () => <div className="pp-chart-pair">{COHERENCE.map(panel => <CoherencePanel key={panel.title} {...panel}/>)}</div>;

/* Design-to-code: the same pricing screen (S2) built from L0 and from L0V, before and after one injected token change.
   Source: p2-benchmark/runs/S2-L0-r1 and S2-L0V-r1 (render.png, render-themed.png), cropped to the top 640px. */
const WIRING = [
  {src: 'design-to-code-s2-before', wide: 'L0 Raw: as built', narrow: 'Before the change: the L0 and L0V builds look the same', alt: 'The pricing screen built from the L0 file: indigo buttons, grey page, dark text.'},
  {src: 'design-to-code-s2-l0v-before', wide: 'L0V Raw + variables: as built', alt: 'The pricing screen built from the L0V file, identical to the L0 build.', wideOnly: true},
  {src: 'design-to-code-s2-l0-themed', wide: 'L0 Raw: after a token change', alt: 'The L0 build after the change: buttons and borders turned magenta and cyan, but the text stayed dark and the page stayed grey.'},
  {src: 'design-to-code-s2-l0v-themed', wide: 'L0V Raw + variables: after the same token change', alt: 'The L0V build after the change: magenta buttons, cyan borders, green text and a yellow page.'},
];
export const WiringGrid = () => <div className="pp-wiring">
  {WIRING.map(cell => <div key={cell.src} className={`pp-wiring-cell${cell.wideOnly ? ' is-wide-only' : ''}`}>
    <div className="pp-figure-media"><img src={`/assets/product/${cell.src}.webp`} alt={cell.alt} width={1080} height={480} loading="lazy" decoding="async"/></div>
    <p className="pp-wiring-label">{cell.narrow ? <><span className="pp-wiring-wide">{cell.wide}</span><span className="pp-wiring-narrow">{cell.narrow}</span></> : cell.wide}</p>
  </div>)}
</div>;

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
