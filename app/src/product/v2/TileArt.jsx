import {Phone, PROTO_H, PROTO_W, shotSrc} from './Device';

/* Pictures for the /product tiles. All decorative (the tile's text names the project). Layers marked [data-depth]
   lean toward the pointer; the in-progress drawings animate on hover only, and are complete without it. */

/** D2: a print of one painting on the studio wall, the app's home in front. Screenshots only: no iframe here. */
export function AtelierTileArt() {
  return <span className="pt-atelier">
    <span className="pt-atelier-print" data-depth="8"><img src="/proto/atelier/art/blue-hour.webp" width={1600} height={844} alt="" loading="lazy" decoding="async"/></span>
    <span className="pt-atelier-phone" data-depth="20">
      <Phone><img className="v2-shot" src={shotSrc('home')} width={PROTO_W * 2} height={PROTO_H * 2} alt="" loading="lazy" decoding="async"/></Phone>
    </span>
  </span>;
}

/** D3, in progress: a garden-style complex seen from above, and the photo-step route from the curb to one door. */
export function RouteTileArt() {
  const path = 'M115 300 C115 262 180 246 276 240 L276 206 C276 196 286 193 298 195 L392 200 C420 201 438 198 446 188';
  return <span className="pt-plan" data-depth="10">
    {/* meet + scenery drawn past the viewBox: any tile shape shows the whole route with the street running on */}
    <svg viewBox="0 0 560 420" preserveAspectRatio="xMidYMid meet" focusable="false" overflow="visible">
      <rect className="pt-plan-street" x="-800" y="352" width="2160" height="600"/>
      <path className="pt-plan-lane" d="M-800 392 H1360"/>
      <g className="pt-plan-lot">
        <rect x="40" y="232" width="150" height="96" rx="6"/>
        {[0, 1, 2, 3].map(i => <path key={i} d={`M${64 + i * 34} 232 v30 M${64 + i * 34} 298 v30`}/>)}
      </g>
      <path className="pt-plan-fence" d="M-800 212 H250 M302 212 H1360"/>
      <g className="pt-plan-bldg">
        <rect x="48" y="60" width="130" height="110" rx="4"/>
        <rect x="214" y="52" width="110" height="118" rx="4"/>
        <rect x="372" y="70" width="150" height="118" rx="4"/>
        <rect x="-190" y="64" width="200" height="104" rx="4"/>
        <rect x="560" y="58" width="190" height="116" rx="4"/>
      </g>
      <g className="pt-plan-labels">
        <text x="113" y="122">1</text><text x="269" y="118">2</text><text x="447" y="136">4</text>
        <text x="240" y="234" className="is-small">Gate B</text>
      </g>
      <path className="pt-plan-route" pathLength="1" d={path}/>
      <path className="pt-plan-route is-ink" pathLength="1" d={path}/>
      <g className="pt-plan-stops">
        <g style={{'--n': 0}}><circle cx="115" cy="300" r="13"/><text x="115" y="305">P</text></g>
        <g style={{'--n': 1}}><circle cx="276" cy="226" r="13"/><text x="276" y="231">1</text></g>
        <g style={{'--n': 2}}><circle cx="392" cy="200" r="13"/><text x="392" y="205">2</text></g>
        <g style={{'--n': 3}}><circle cx="452" cy="182" r="13" className="is-door"/><text x="452" y="187">3</text></g>
      </g>
    </svg>
  </span>;
}

// Fictional yearly totals ($k) for three plans in three kinds of year. Plan B costs more than Plan A in every one.
const PLANS = [
  {name: 'Plan A', costs: [3.1, 4.0, 7.4]},
  {name: 'Plan B', costs: [3.9, 4.9, 8.6], dominated: true},
  {name: 'Plan C', costs: [1.9, 3.6, 9.4]},
];
const X = v => 120 + (v - 1) * 52;

/** D4, in progress: the scenario range chart. Each plan is a row, each kind of year a dot; the plan that loses in
    every scenario sits to the right and is flagged. On hover the dots slide out from a common start. */
export function ScenarioTileArt() {
  return <span className="pt-chart" data-depth="10">
    <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid meet" focusable="false">
      <g className="pt-chart-axis">
        {[2, 4, 6, 8, 10].map(v => <g key={v}><path d={`M${X(v)} 70 V318`}/><text x={X(v)} y="344">${v}k</text></g>)}
      </g>
      {PLANS.map((plan, r) => {
        const y = 118 + r * 82;
        return <g key={plan.name} className={`pt-chart-row${plan.dominated ? ' is-dominated' : ''}`} style={{'--r': r}}>
          <text className="pt-chart-name" x="36" y={y + 5}>{plan.name}</text>
          <path className="pt-chart-range" d={`M${X(plan.costs[0])} ${y} H${X(plan.costs[2])}`}/>
          {plan.costs.map((c, k) => <circle key={k} cx={X(c)} cy={y} r={k === 1 ? 9 : 7} style={{'--k': k, '--from': `${X(1.5) - X(c)}px`}}/>)}
          {plan.dominated ? <g className="pt-chart-flag"><rect x={X(plan.costs[0]) - 8} y={y + 17} width="184" height="30" rx="15"/><text x={X(plan.costs[0]) + 84} y={y + 37}>More in every case</text></g> : null}
        </g>;
      })}
    </svg>
  </span>;
}
