import {Vector3} from 'three';
import {jlStrokes2D, LOGO_C, LOGO_R, N} from './line.js';
import {PRODUCT_CASES} from '../product/content.js';
import {plans, scenarioCost, money} from '../product/v2/data/cntl-model.js';

export const PRODUCT_START = 15.8;
export const DAWN_START = 29.3;
export const DAWN_SHIFT = DAWN_START - 21.3;
export const MARK_FACE_Z = 29; // half of the existing stone's 58-unit extrusion
export const PRODUCT_STATIONS = [
  {slug: 'atelier', hold: [16.4, 18.05], image: '/assets/product/atelier/screens/check.webp'},
  {slug: 'last-100-feet', hold: [18.55, 20.1], image: '/assets/product/last-100-feet/plan-base.webp'},
  {slug: 'ready-for-agents', hold: [20.65, 22.55], image: '/assets/product/ready-for-agents/tile.webp'},
  {slug: 'arden', hold: [23, 24.65], image: '/assets/home/product/arden-dark.webp'},
  {slug: 'choose-not-to-lose', hold: [25.1, 26.85], image: '/assets/product/choose-not-to-lose/tile.webp'},
].map(s => ({...s, case: PRODUCT_CASES.find(p => p.slug === s.slug)}));
export const productCopy = (station, lang) => lang === 'en' ? station.case : {...station.case, ...station.case.zh};
export const COST_BARS = ['a', 'd', 'b', 'c'].map(id => {
  const plan = plans.find(p => p.id === id), cost = scenarioCost(plan, 'typical');
  return {...cost, id, name: plan.name, label: `${plan.name} ${money(cost.total)}`};
});
export const COST_DIFFERENCE = COST_BARS[2].total - COST_BARS[0].total;
export const ROUTE_PIXELS = [[428,745], [428,706], [465,706], [465,540], [503,502], [505,428], [507,290]];
export const TOKEN_LINES = ['--background: #F7F7F5;', '--text-primary: #1C1D21;', '--text-secondary: #6E6F78;', '--border: #E4E3DF;', '--space-20: 20px;', '--space-16: 16px;'];
export const TOKEN_CHIPS = ['#F7F7F5', '#1C1D21', '#6E6F78', '#E4E3DF', '20', '16'];

const unit = t => Math.max(0, Math.min(1, t));
// Retain the handover windows, with a quiet middle tenth between captions.
export function captionPose(i, s) {
  const joins = [[18.1,18.55],[20.1,20.5],[22.55,22.85],[24.65,24.95]];
  const incoming = i ? joins[i-1] : null, outgoing = joins[i];
  const enter = incoming ? unit(((s-incoming[0])/(incoming[1]-incoming[0])-.55)/.45) : unit((s-15.8)/.2);
  const exit = outgoing ? unit((s-outgoing[0])/((outgoing[1]-outgoing[0])*.45)) : unit((s-27)/.4);
  return {opacity:enter*(1-exit), y:12*(1-enter)-12*exit};
}
export const captionOpacity = (i,s) => captionPose(i,s).opacity;

// Do not interpolate unlike paths: keep every sample fixed and lift the pen
// backwards over each detour. Original invisible gaps remain invisible.
export function retractProductOutlines(live, drawn, progress) {
  live.P.set(drawn.P); live.R.set(drawn.R); live.D.set(drawn.D);
  for (let i=0; i<N; i++) {
    const u=i/(N-1), stroke=drawn.ends.findIndex(end=>u<=end);
    if ([0,2,5,8].includes(stroke)) {
      const start=stroke ? drawn.ends[stroke-1] : 0, end=drawn.ends[stroke];
      const head=start+(end-start)*(1-unit(progress));
      live.R[i]*=unit((head-u)*N/2);
    } else live.R[i]=drawn.R[i]+(.5-drawn.R[i])*unit(progress);
  }
  return live;
}

// A narrow peak, followed immediately by thinning mist. Linear decay avoids
// the old ease-in plateau against an already pale dawn background.
export function productWhite(s) {
  if(s<29.3) return unit((s-29.12)/.18)**2;
  return .68 * (1-unit((s-29.3)/.16)) + .32 * (1-unit((s-29.3)/.04));
}

// Derive anchors from the actual polylines, including the bowl's sampled low point.
export function productAnchors2D() {
  const [bowl, stem, l] = jlStrokes2D();
  const bottom = bowl.reduce((a, p) => p[1] > a[1] ? p : a);
  return [bowl[0], bottom, stem.at(-1), l[20], l[86]].map(p => [...p]);
}
export function productLayout(center, scale = 1) {
  const world = ([x, y]) => new Vector3(center.x + (x - LOGO_C[0]) * scale, center.y - (y - LOGO_C[1]) * scale, center.z);
  const strokes = jlStrokes2D().map(s => s.map(world)), anchors = productAnchors2D().map(world);
  const offset = (i, x, y, z) => anchors[i].clone().add(new Vector3(x, y, z).multiplyScalar(scale));
  const centers = [offset(0, 0, 30, 0), offset(1, 0, -5, 42), offset(2, 0, 28.8, 0), offset(3, 58, 0, 5), offset(4, 0, 18, 0)];
  const route = ROUTE_PIXELS.map(([x, y]) => centers[1].clone().add(new Vector3((x / 808 - .5) * 75, .35, (y / 768 - .5) * 71).multiplyScalar(scale)));
  return {strokes, anchors, centers, route, bowlSplit: jlStrokes2D()[0].findIndex(p => p[1] === productAnchors2D()[1][1])};
}

// Each detour is a separate lifted stroke. At the fold only its visibility
// retracts; the source geometry and the JL strokes stay fixed.
export const DRAW_BEATS = [[15.92,16.18], [18.05,18.5], [18.85,19.65], [19.9,20.05], [20.05,20.3], [20.3,20.65], [22.55,23], [24.65,25.15], [26,26.4]];
export function strokeReveal(s, ends) {
  let previous = 0;
  for (let i = 0; i < DRAW_BEATS.length; i++) {
    const [a, b] = DRAW_BEATS[i];
    if (s < a) return previous;
    if (s <= b) return previous + (ends[i] - previous) * Math.max(0, Math.min(1, (s - a) / (b - a)));
    previous = ends[i];
  }
  return 1;
}

// The outgoing line inherits the incoming stone's live transform (including bob,
// pointer rotation and rise). Both are projected by the same engine camera.
export function alignProductMark(live, clean, center, stone, s, scale = 1) {
  const t = Math.max(0, Math.min(1, (s - 28.8) / .5)), match = t*t*(3-2*t), v = new Vector3();
  for (let i=0; i<N; i++) {
    v.fromArray(clean.P,i*3).sub(center);v.z+=MARK_FACE_Z*scale;v.applyQuaternion(stone.quaternion).add(stone.position);
    live.P[i*3] = clean.P[i*3] + (v.x-clean.P[i*3])*match;
    live.P[i*3+1] = clean.P[i*3+1] + (v.y-clean.P[i*3+1])*match;
    live.P[i*3+2] = clean.P[i*3+2] + (v.z-clean.P[i*3+2])*match;
    live.R[i] = .5 + (LOGO_R*scale-.5)*match;
  }
  return live;
}
