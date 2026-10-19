import {memo} from 'react';

/* Jacaranda Court at dusk, from above: the prototype's site plan (d3-last-100-feet-prototype/src/components/
   SitePlan.tsx: the same lots, roads, walks, buildings, stairs, trees and curb paint, in plan units, about a foot
   each) repainted for the hour after sunset. The sky's last light comes from the west, so every roof and tree throws
   a long shadow east; sodium streetlights and porch lights pool warm on the walks. Static: it is painted once and the
   camera moves it as a layer. */

/** the rectangle of plan units this layer paints; outside it the page's own color is the land */
export const REGION = {x: -360, y: -200, w: 980, h: 860};

const C = {
  land: '#1b2030', lot: '#1f2537', neighbor: '#191d2b', road: '#151925', roadEdge: '#2b3146', lane: '#3a4055',
  sidewalk: '#262c3e', curb: '#3a4158', redCurb: '#c4473a', yellowCurb: '#b88d2f', lawn: '#1c2a2b', bed: '#203430',
  gravel: '#252b3d', walk: '#3c4359', walkEdge: '#2d3346', roofLit: '#3d4560', roofMid: '#333a52', roofShade: '#272c40',
  roofLine: '#4a5270', hip: '#4d5574', shadow: '#05070f', balcony: '#2d3349', stair: '#737a96', tree: '#1e3532',
  treeLit: '#2c4a44', agave: '#2b423f', pool: '#1b5361', poolEdge: '#3f8d9c', deck: '#2a3044', car: '#2b3142',
  carRoof: '#353c50', wall: '#3d445c', wallLine: '#545c7a', label: '#8e93ab', lamp: '#ffb25e',
};

const BUILDINGS = [
  {id: '1', x: 132, y: 300, w: 64, h: 114}, {id: '2', x: 256, y: 318, w: 70, h: 96}, {id: '3', x: 132, y: 150, w: 64, h: 134},
  {id: '4', x: 256, y: 150, w: 70, h: 152}, {id: '5', x: 80, y: 40, w: 314, h: 92},
];
const TREES = [[186, 444, 10], [108, 446, 9], [334, 446, 10], [384, 444, 8], [94, 196, 15], [110, 352, 13], [92, 268, 9],
  [208, 392, 8], [236, 190, 7], [204, 258, 6], [364, 336, 13], [356, 160, 10], [392, 380, 8]];
const AGAVES = [[72, 421], [96, 421], [150, 421], [196, 421], [254, 421], [276, 421], [318, 421], [352, 421], [388, 421],
  [205, 368], [244, 386], [204, 300], [236, 226], [118, 230], [80, 330], [340, 384], [394, 330]];
/** streetlights and porch lights: [x, y, glow radius, strength] */
const LAMPS = [[118, 446, 46, .9], [300, 446, 46, .9], [430, 446, 46, .8], [-6, 446, 40, .7], [52, 170, 40, .7], [52, 330, 40, .7],
  [70, 92, 26, .8], [212, 424, 22, 1], [222, 376, 30, .85], [222, 300, 28, .8], [218, 226, 28, .75], [244, 296, 18, .9],
  [258, 198, 16, 1], [252, 168, 12, .7], [252, 250, 12, .7], [200, 180, 12, .6], [200, 330, 12, .6], [252, 360, 12, .6],
  [366, 250, 34, .5]];
const SHADOW = {dx: 26, dy: 9};

function HipRoof({x, y, w, h, muted}) {
  const s = Math.min(w, h) / 2, horiz = w >= h;
  const lit = muted ? '#2a3044' : C.roofLit, mid = muted ? '#262c3e' : C.roofMid, shade = muted ? '#222738' : C.roofShade;
  const r1 = {x: x + s, y: y + s}, r2 = horiz ? {x: x + w - s, y: y + s} : {x: x + s, y: y + h - s};
  const tl = `${x},${y}`, tr = `${x + w},${y}`, br = `${x + w},${y + h}`, bl = `${x},${y + h}`;
  const a = `${r1.x},${r1.y}`, b = `${r2.x},${r2.y}`;
  // the west and north slopes catch the sky; east and south fall into shade
  return <g>
    {horiz ? <>
      <polygon points={`${tl} ${tr} ${b} ${a}`} fill={lit}/>
      <polygon points={`${bl} ${br} ${b} ${a}`} fill={shade}/>
      <polygon points={`${tl} ${bl} ${a}`} fill={lit}/>
      <polygon points={`${tr} ${br} ${b}`} fill={shade}/>
    </> : <>
      <polygon points={`${tl} ${bl} ${b} ${a}`} fill={lit}/>
      <polygon points={`${tr} ${br} ${b} ${a}`} fill={shade}/>
      <polygon points={`${tl} ${tr} ${a}`} fill={mid}/>
      <polygon points={`${bl} ${br} ${b}`} fill={shade}/>
    </>}
    <path d={`M${tl} L${a} L${tr} M${bl} L${b} L${br} M${a} L${b}`} stroke={muted ? '#30364a' : C.hip} strokeWidth=".5" fill="none"/>
    <rect x={x} y={y} width={w} height={h} fill="none" stroke={muted ? '#2c3245' : C.roofLine} strokeWidth=".6"/>
  </g>;
}

/** a long shadow cast east from a box */
const boxShadow = ({x, y, w, h}, k = 1) => {
  const dx = SHADOW.dx * k, dy = SHADOW.dy * k;
  return `${x + w},${y} ${x + w + dx},${y + dy} ${x + w + dx},${y + h + dy} ${x + dx},${y + h + dy} ${x},${y + h}`;
};

function Car({x, y, w, h, vertical, lit}) {
  const glass = '#9fb4dc2e';
  return <g>
    <rect x={x + 6} y={y + 3} width={w} height={h} rx="4" fill={C.shadow} opacity=".4"/>
    <rect x={x} y={y} width={w} height={h} rx="4" fill={lit ? '#3b4256' : C.car}/>
    {vertical ? <>
      <rect x={x + 2.5} y={y + h * .22} width={w - 5} height={h * .18} rx="1.5" fill={glass}/>
      <rect x={x + 2.5} y={y + h * .66} width={w - 5} height={h * .13} rx="1.5" fill={glass}/>
    </> : <>
      <rect x={x + w * .62} y={y + 2.5} width={w * .17} height={h - 5} rx="1.5" fill={glass}/>
      <rect x={x + w * .2} y={y + 2.5} width={w * .12} height={h - 5} rx="1.5" fill={glass}/>
    </>}
  </g>;
}

function Stairs({x, y, w, h}) {
  const treads = Math.floor(h / 3);
  return <g>
    <rect x={x} y={y} width={w} height={h} fill="#2f3549" stroke={C.stair} strokeWidth=".5"/>
    {Array.from({length: treads - 1}, (_, i) => <line key={i} x1={x} x2={x + w} y1={y + (i + 1) * (h / treads)} y2={y + (i + 1) * (h / treads)} stroke={C.stair} strokeWidth=".35" opacity=".8"/>)}
  </g>;
}

function Agave({x, y, r = 3.6}) {
  const pts = Array.from({length: 16}, (_, i) => { const a = i / 16 * Math.PI * 2, rr = i % 2 ? r * .38 : r; return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`; });
  return <polygon points={pts.join(' ')} fill={C.agave}/>;
}

function DuskPlanSvg({width, height, x, y, labels = true, ids = "w3"}) {
  const R = REGION;
  const id = n => `${ids}-${n}`;
  return <svg className="w3-plan" viewBox={`${R.x} ${R.y} ${R.w} ${R.h}`} x={x} y={y} width={width} height={height} aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id={id("lamp")}>
        <stop offset="0" stopColor={C.lamp} stopOpacity=".55"/>
        <stop offset=".35" stopColor={C.lamp} stopOpacity=".2"/>
        <stop offset="1" stopColor={C.lamp} stopOpacity="0"/>
      </radialGradient>
      <radialGradient id={id("pool")}>
        <stop offset="0" stopColor="#5fd0dc" stopOpacity=".55"/>
        <stop offset="1" stopColor="#5fd0dc" stopOpacity="0"/>
      </radialGradient>
      <linearGradient id={id("sky")} x1="0" y1="0" x2="1" y2=".2">
        <stop offset="0" stopColor="#8a5a7a" stopOpacity=".22"/>
        <stop offset=".45" stopColor="#4a4a7a" stopOpacity=".06"/>
        <stop offset="1" stopColor="#0c1020" stopOpacity=".3"/>
      </linearGradient>
    </defs>

    {/* ground, the lot, the neighbors */}
    <rect x={R.x} y={R.y} width={R.w} height={R.h} fill={C.land}/>
    <rect x={62} y={0} width={342} height={432} fill={C.lot}/>
    <rect x={404} y={10} width={180} height={418} fill={C.neighbor}/>
    <rect x={62} y={-60} width={360} height={62} fill={C.neighbor}/>
    <polygon points={boxShadow({x: 418, y: 60, w: 120, h: 150}, .8)} fill={C.shadow} opacity=".35"/>
    <polygon points={boxShadow({x: 418, y: 250, w: 120, h: 150}, .8)} fill={C.shadow} opacity=".35"/>
    <HipRoof x={418} y={60} w={120} h={150} muted/>
    <HipRoof x={418} y={250} w={120} h={150} muted/>
    <line x1={62} y1={6} x2={404} y2={6} stroke={C.wallLine} strokeWidth=".4" strokeDasharray="1 1.5"/>

    {/* Elm St along the bottom, Cypress Ave on the left */}
    <rect x={R.x} y={452} width={R.w} height={80} fill={C.road}/>
    <rect x={-120} y={R.y} width={164} height={652} fill={C.road}/>
    <line x1={R.x} y1={532} x2={R.x + R.w} y2={532} stroke={C.roadEdge} strokeWidth=".5"/>
    <line x1={-120} y1={R.y} x2={-120} y2={452} stroke={C.roadEdge} strokeWidth=".5"/>
    <rect x={R.x} y={532} width={R.w} height={22} fill={C.sidewalk}/>
    <rect x={44} y={432} width={R.x + R.w - 44} height={20} fill={C.sidewalk}/>
    <rect x={44} y={R.y} width={18} height={652} fill={C.sidewalk}/>
    <rect x={44} y={72} width={36} height={28} fill="#2a3043"/>
    <path d={`M44 ${R.y} V444 Q44 452 52 452 H${R.x + R.w}`} fill="none" stroke={C.curb} strokeWidth=".7"/>
    <rect x={238} y={450.2} width={62} height={3.6} rx=".8" fill={C.redCurb}/>
    <rect x={300} y={450.2} width={48} height={3.6} rx=".8" fill={C.yellowCurb}/>
    <line x1={R.x} y1={492} x2={R.x + R.w} y2={492} stroke={C.lane} strokeWidth=".7" strokeDasharray="12 8"/>
    <line x1={-38} y1={R.y} x2={-38} y2={452} stroke={C.lane} strokeWidth=".7" strokeDasharray="12 8"/>
    {Array.from({length: 9}, (_, i) => <rect key={`cw${i}`} x={46} y={456 + i * 8} width={16} height={4} fill={C.lane}/>)}
    {Array.from({length: 8}, (_, i) => <rect key={`cv${i}`} x={-12 + i * 7} y={434} width={3.6} height={15} fill={C.lane}/>)}
    <Car x={92} y={455} w={40} h={17}/>
    <Car x={356} y={455} w={42} h={17}/>
    <Car x={22} y={176} w={17} h={40} vertical/>
    <Car x={22} y={262} w={17} h={38} vertical/>

    {/* lawns, the courtyard, the pool, the walks */}
    <rect x={62} y={412} width={342} height={17} fill={C.lawn}/>
    <rect x={66} y={136} width={66} height={278} fill={C.lawn}/>
    <rect x={326} y={136} width={78} height={278} fill={C.lawn}/>
    <rect x={196} y={136} width={60} height={278} fill={C.gravel}/>
    <path d="M198 404 Q198 356 214 350 V404 Z" fill={C.bed}/>
    <path d="M240 404 V354 Q254 350 254 336 V404 Z" fill={C.bed}/>
    <rect x={198} y={150} width={14} height={180} rx="4" fill={C.bed}/>
    <rect x={232} y={206} width={8} height={40} rx="3" fill={C.bed}/>
    <rect x={336} y={188} width={60} height={112} rx="6" fill={C.deck}/>
    <circle cx={366} cy={244} r={70} fill={`url(#${id("pool")})`}/>
    <rect x={344} y={196} width={44} height={96} rx="8" fill={C.pool} stroke={C.poolEdge} strokeWidth=".6"/>
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M226 431 V346 L248 324 V318 M226 346 L218 338 V150 M66 300 H132 M326 310 H400" stroke={C.walkEdge} strokeWidth="13"/>
      <path d="M226 431 V346 L248 324 V318 M226 346 L218 338 V150 M66 300 H132 M326 310 H400" stroke={C.walk} strokeWidth="11"/>
    </g>
    <path d="M62 430.5 H213 M239 430.5 H404 M63.5 430 V100 M63.5 72 V2" stroke={C.wall} strokeWidth="3" fill="none"/>
    <path d="M62 430.5 H213 M239 430.5 H404 M63.5 430 V100 M63.5 72 V2" stroke={C.wallLine} strokeWidth=".4" fill="none"/>
    <rect x={209} y={426} width={4} height={4} fill="#8a8fa8"/>
    <rect x={62} y={72} width={18} height={28} fill="#2a3043"/>
    <rect x={76.5} y={71} width={3.5} height={30} fill="#5a6078"/>

    {/* long shadows east, then the buildings */}
    <g fill={C.shadow} opacity=".42">
      {BUILDINGS.map(b => <polygon key={b.id} points={boxShadow(b)}/>)}
      {TREES.map(([x, y, r], i) => <ellipse key={i} cx={x + r * .9} cy={y + r * .35} rx={r * 1.7} ry={r * .8}/>)}
    </g>
    {BUILDINGS.map(b => <HipRoof key={b.id} {...b}/>)}
    <rect x={196} y={154} width={8} height={126} fill={C.balcony}/><line x1={204} y1={154} x2={204} y2={280} stroke="#7d84a0" strokeWidth=".4"/>
    <rect x={196} y={304} width={8} height={106} fill={C.balcony}/><line x1={204} y1={304} x2={204} y2={410} stroke="#7d84a0" strokeWidth=".4"/>
    <rect x={248} y={154} width={8} height={144} fill={C.balcony}/><line x1={248} y1={154} x2={248} y2={298} stroke="#7d84a0" strokeWidth=".4"/>
    <rect x={248} y={322} width={8} height={88} fill={C.balcony}/><line x1={248} y1={322} x2={248} y2={410} stroke="#7d84a0" strokeWidth=".4"/>
    <Stairs x={241} y={258} w={14} h={34}/>
    <Stairs x={241} y={160} w={14} h={30}/>
    <Stairs x={197} y={236} w={14} h={30}/>
    <Stairs x={197} y={344} w={14} h={30}/>
    <Stairs x={241} y={366} w={14} h={30}/>

    {/* trees and agaves, with the last light on their west side */}
    {AGAVES.map(([x, y], i) => <Agave key={i} x={x} y={y}/>)}
    {TREES.map(([x, y, r], i) => <g key={i}>
      <circle cx={x - r * .35} cy={y + r * .1} r={r * .68} fill={C.tree}/>
      <circle cx={x + r * .32} cy={y - r * .12} r={r * .72} fill={C.tree}/>
      <circle cx={x} cy={y + r * .32} r={r * .62} fill={C.tree}/>
      <circle cx={x - r * .3} cy={y - r * .25} r={r * .42} fill={C.treeLit}/>
    </g>)}

    {/* the light: sky wash, then lamps */}
    <rect x={R.x} y={R.y} width={R.w} height={R.h} fill={`url(#${id("sky")})`}/>
    <g style={{mixBlendMode: 'screen'}}>
      {LAMPS.map(([x, y, r, k], i) => <circle key={i} cx={x} cy={y} r={r} fill={`url(#${id("lamp")})`} opacity={k}/>)}
    </g>
    <g fill="#ffe2b0">
      {LAMPS.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r > 30 ? 1.6 : 1.1}/>)}
    </g>

    {labels ? <g className="w3-plan-text" fill={C.label} fontWeight="650">
      <text x={104} y={516} fontSize="11">Elm St</text>
      <text x={0} y={0} fontSize="11" transform="translate(-6 300) rotate(-90)">Cypress Ave</text>
      <text x={86} y={124} fontSize="10">Garage</text>
      {BUILDINGS.map(b => <text key={b.id} x={b.id === '5' ? b.x + b.w * .62 : b.x + b.w / 2} y={b.y + b.h / 2} fontSize="15" fontWeight="750" textAnchor="middle" dominantBaseline="central" fill="#9aa0bb">{b.id}</text>)}
    </g> : null}
  </svg>;
}

export const DuskPlan = memo(DuskPlanSvg);
