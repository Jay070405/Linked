import {Vector3} from 'three';
import {jlStrokes2D, LOGO_C, LOGO_R, N} from './line.js';
import {PRODUCT_CASES} from '../product/content.js';

export const PRODUCT_START = 15.8;
export const DAWN_START = 29.3;
export const DAWN_SHIFT = DAWN_START - 21.3;
export const MARK_FACE_Z = 29; // half of the existing stone's 58-unit extrusion
export const PRODUCT_STATIONS = [
  {slug: 'atelier', hold: [16.4, 18.05], image: '/assets/product/atelier/screens/check.webp'},
  {slug: 'last-100-feet', hold: [18.55, 20.1], image: '/assets/product/last-100-feet/plan-base.webp'},
  {slug: 'ready-for-agents', hold: [20.65, 22.55], image: '/assets/product/ready-for-agents/tile.webp'},
  {slug: 'arden', hold: [23, 24.65], thumb: '/assets/product/arden/film/explode-m/036.webp'},
  {slug: 'choose-not-to-lose', hold: [25.1, 26.85], thumb: '/assets/product/choose-not-to-lose/tile.webp'},
// `image` is what the 3D scene shows; `thumb` is the static page's card (Arden's film and the chart have no single image there)
].map(s => ({...s, thumb: s.thumb || s.image, case: PRODUCT_CASES.find(p => p.slug === s.slug)}));
export const productCopy = (station, lang) => lang === 'en' ? station.case : {...station.case, ...station.case.zh};
export const ROUTE_PIXELS = [[428,745], [428,706], [465,706], [465,540], [503,502], [505,428], [507,290]];
export const TOKEN_LINES = ['--background: #F7F7F5;', '--text-primary: #1C1D21;', '--text-secondary: #6E6F78;', '--border: #E4E3DF;', '--space-20: 20px;', '--space-16: 16px;'];
export const TOKEN_CHIPS = ['#F7F7F5', '#1C1D21', '#6E6F78', '#E4E3DF', '20', '16'];
export const ARDEN_SIZE = [160, 160 * 1165 / 1200];
export const ARDEN_BOUNDS = [[.149,.414,.999,.769],[.048,.205,.952,.754],[.072,.182,.894,.715]];
export const CHART_ROWS = [309,321,333,345];
export const costX = cents => 308 + cents / 900000 * 101;

// Hold compositions use viewport fractions, keeping the same hierarchy on all
// three desktop widths. A front-on camera also keeps DOM and film in register.
export function productHoldCamera(layout, i, w=1440, h=900, scale=1) {
  let at, x, y, pixelsPerUnit;
  if(i===3) {
    pixelsPerUnit=.44*w/(ARDEN_SIZE[0]*(.894-.072)*scale);
    at=layout.centers[3].clone().add(new Vector3((.483-.5)*ARDEN_SIZE[0]*scale,(.5-.4485)*ARDEN_SIZE[1]*scale,0));
    x=.67*w; y=.45*h;
  } else {
    pixelsPerUnit=(.46*w-64)/(101*scale);
    at=layout.world([409,359]); x=w-100; y=h*652/900;
  }
  const distance=h/(2*Math.tan(12*Math.PI/180)*pixelsPerUnit);
  const look=at.clone().add(new Vector3((w/2-x)/pixelsPerUnit,(y-h/2)/pixelsPerUnit,0));
  return {look,pos:look.clone().add(new Vector3(0,0,distance))};
}

const unit = t => Math.max(0, Math.min(1, t));
export const productFold = s => {const t=unit((s-27.2)/.8);return t*t*(3-2*t);};
export const productFoldReturn = s => unit((s-27)/.2);
export function stationImageOpacity(i,s) {
  const exits=[[18.25,18.5],[20.35,20.6],[22.7,22.95],[24.75,25.05]];
  const exit=exits[i];
  return (1-productFold(s))*Math.max(exit?1-unit((s-exit[0])/(exit[1]-exit[0])):0,productFoldReturn(s));
}
export const productNavScrim = s => unit((s-15.8)/.15)*(1-unit((s-28.65)/.15));
export const productTubeOpacity = s => 1-unit((s-29.27)/.09);
// Retain the handover windows, with a quiet middle tenth between captions.
export function captionPose(i, s) {
  const joins = [[18.1,18.55],[20.1,20.5],[22.55,22.85],[24.65,24.95]];
  const incoming = i ? joins[i-1] : null, outgoing = joins[i];
  const enter = incoming ? unit(((s-incoming[0])/(incoming[1]-incoming[0])-.55)/.45) : unit((s-15.8)/.2);
  const exit = outgoing ? unit((s-outgoing[0])/((outgoing[1]-outgoing[0])*.45)) : unit((s-27)/.4);
  return {opacity:enter*(1-exit), y:12*(1-enter)-12*exit};
}
export const captionOpacity = (i,s) => captionPose(i,s).opacity;

// The pen lifts each detour (phone frame, route, Ready-for-agents frame) as its product leaves, with the same timing as
// the image, so an empty outline never lingers at the edge of the next station's frame.
export const productDetours = s => {const e=t=>t*t*(3-2*t);return {0:e(unit((s-18.25)/.25)),2:e(unit((s-20.35)/.25)),5:e(unit((s-22.7)/.25))};};

// Do not interpolate unlike paths: keep every sample fixed and lift the pen
// backwards over each detour. Original invisible gaps remain invisible.
export function retractProductOutlines(live, drawn, progress, detours = {}) {
  live.P.set(drawn.P); live.R.set(drawn.R); live.D.set(drawn.D);
  for (let i=0; i<N; i++) {
    const u=i/(N-1), stroke=drawn.ends.findIndex(end=>u<=end);
    if ([0,2,5].includes(stroke)) {
      const start=stroke ? drawn.ends[stroke-1] : 0, end=drawn.ends[stroke], lift=unit(Math.max(progress,detours[stroke]||0));
      if (lift>0) live.R[i]*=unit((start+(end-start)*(1-lift)-u)*N/2);
    } else live.R[i]=drawn.R[i]+(.5-drawn.R[i])*unit(progress);
  }
  return live;
}

// Smooth bloom into the match cut; cubic ease-out clears the stone first.
export function productWhite(s) {
  if(s<29.3) { const t=unit((s-29.05)/.25); return t*t*(3-2*t); }
  return (1-unit((s-29.3)/.5))**3;
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
  const centers = [offset(0, 0, 30, 0), offset(1, 0, -5, 42), offset(2, 0, 28.8, 0), offset(3, 87, 0, 5), offset(4, 0, 18, 0)];
  const route = ROUTE_PIXELS.map(([x, y]) => centers[1].clone().add(new Vector3((x / 808 - .5) * 75, .35, (y / 768 - .5) * 71).multiplyScalar(scale)));
  return {world, strokes, anchors, centers, route, bowlSplit: jlStrokes2D()[0].findIndex(p => p[1] === productAnchors2D()[1][1])};
}

// Each detour is a separate lifted stroke. At the fold only its visibility
// retracts; the source geometry and the JL strokes stay fixed.
export const DRAW_BEATS = [[15.92,16.18], [18.05,18.5], [18.85,19.65], [19.9,20.05], [20.05,20.3], [20.3,20.65], [22.55,23], [24.65,25.15]];
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
// pointer rotation). Both are projected by the same engine camera.
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
