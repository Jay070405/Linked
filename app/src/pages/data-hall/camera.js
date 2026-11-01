// One continuous camera, as a rig: a target point, a distance (interpolated in log space, so the move from a 36 m
// sheet to a 3 cm die keeps an even pace), a yaw, an elevation and a field of view. Each channel is a monotone
// cubic through its keys, so the camera never overshoots a key and never eases to a stop at one (the slope is
// shared on both sides of every key). The only break is the match cut at T.swap, where the die's drawing and the
// hall's drawing fill the frame identically.
import * as THREE from 'three';
import {CENTER, ROW_X0, WALK_Z, PICK} from './plan';
import {T, seg, smoother} from './timeline';
import {DETAIL} from './detail';

const deg = Math.PI / 180;
// [progress, target x, y, z, distance, yaw°, elevation°, fov°]
const D = DETAIL;
const DIVE_END = [T.dive[1], D.gpu.x, D.gpu.y, D.gpu.z, 0.3, -1.5, 74, 32];
const LAND = [T.back[1], D.sheetCenter.x, D.sheetCenter.y, D.sheetCenter.z - 1.2 / D.matchScale, 106 / D.matchScale, 0, 89.9, 18];
// a key part way from a to b: time in step, every value along a quadratic ease-out (distance in log space)
const easeKey = (a, b, u) => {
  const e = 1 - (1 - u) * (1 - u);
  return a.map((v, i) => (i === 0 ? v + (b[0] - v) * u : i === 4 ? v * Math.pow(b[4] / v, e) : v + (b[i] - v) * e));
};
const KEYS_A = [
  // the opening is close enough to read the drawing; the whole sheet, title block and all, is the ending
  [0, CENTER.x, 0, CENTER.z - 1.2, 106, 0, 89.9, 18],
  [T.plan[1], CENTER.x + 0.1, 0, CENTER.z - 0.8, 99, -1.5, 87, 18.6],
  [T.walls[1], CENTER.x + 0.5, 0, CENTER.z - 3, 80, -14, 62, 24],
  [0.2, CENTER.x + 1, 1.5, CENTER.z + 0.5, 50, -28, 47, 30],
  [0.3, CENTER.x + 0.2, 1.4, CENTER.z - 1.4, 28, -48, 36, 34],
  // inside the hall above the rows (the walls are 6.5 m), then down into the west end of the aisle, west of the
  // busway and fibre trunks
  [0.375, ROW_X0 + 3.8, 2.3, WALK_Z - 1.7, 9.5, -66, 29, 41],
  [0.432, ROW_X0 + 0.5, 1.6, WALK_Z, 4.4, -88, 22, 50],
  [T.walk[0] + 0.035, ROW_X0 + 2.07, 1.5, WALK_Z, 3.2, -91.9, 6.56, 54],
  // from the walk through the power-on and the turn every channel keeps one direction, so the camera never stops
  // between them: it walks on down the aisle while it turns left to the rack, staying near the middle of the aisle.
  // (At the power-on it is still 0.4 m short of the rack and has turned less than half way, so the speed keeps rising
  // through the power-on into the turn, with no peak before it)
  [T.power[1], ROW_X0 + 5.3, 1.59, WALK_Z - 0.25, 2.3, -73, 4.8, 54],
  [0.655, PICK.x + 0.05, 1.62, D.frontZ + 0.097, 1.677, -40.66, 8.79, 54],
  // the cold aisle is 1.8 m wide: every pose here keeps the camera within 1.5 m of the rack front. The target turns
  // back east (toward the GPU) during the slow slide, not at the end of the fast turn
  // from the rack face to the die, the yaw only ever turns one way and the distance only ever closes. (The turn's
  // last key carries part of the slide's turn and tilt, so the camera doesn't speed up into the slide)
  [T.turn[1] + 0.006, PICK.x + 0.03, D.slotY + 0.07, D.frontZ + 0.07, 1.42, -26.5, 11.5, 52],
  [T.slide[1], PICK.x, D.outY, D.outZ + 0.05, 1.18, -14, 22, 46],
  // (already a fifth of the way to the dive, so the camera keeps one speed from the slide through the explode into the
  // dive: the tray comes apart no faster than the camera dives)
  [T.explode[1], PICK.x + 0.032 + (D.gpu.x - PICK.x - 0.032) * 0.1, D.outY + 0.06 + (D.gpu.y - D.outY - 0.06) * 0.226, D.outZ - 0.03 + (D.gpu.z - D.outZ + 0.03) * 0.226, 0.75, -4.988, 49.196, 38.174],
  DIVE_END,
  // on in to the opening's crop of the die's sheet, at the die's scale (the opening looks at the hall's sheet from
  // 106 m, 1.2 m south of its centre), slowing all the way: the keys between follow a quadratic ease, so the speed
  // falls in a straight line from the dive's to rest. Then held to the cut (a monotone curve has zero slope where it
  // turns flat; a last key alone would keep its slope and then clamp)
  ...[1 / 3, 2 / 3].map(u => easeKey(DIVE_END, LAND, u)),
  LAND,
  [T.swap[1], ...LAND.slice(1)],
];
// after the cut: the hall's sheet from where the opening saw it. The camera is at rest across the cut, so the only
// change is the labels, and the last frame is the first
const KEYS_B = [
  [T.swap[1], CENTER.x, 0, CENTER.z - 1.2, 106, 0, 89.9, 18],
  [1, CENTER.x, 0, CENTER.z - 1.2, 106, 0, 89.9, 18],
];

function monotone(ts, vs) {
  const n = ts.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d[i] = (vs[i + 1] - vs[i]) / (ts[i + 1] - ts[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {m[i] = 0; m[i + 1] = 0; continue;}
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) {const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i];}
  }
  return t => {
    if (t <= ts[0]) return vs[0];
    if (t >= ts[n - 1]) return vs[n - 1];
    let i = 0; while (t > ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i], u = (t - ts[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * vs[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * vs[i + 1] + (u3 - u2) * h * m[i + 1];
  };
}
const rig = keys => {
  const ts = keys.map(k => k[0]);
  const ch = [1, 2, 3, 4, 5, 6, 7].map(c => monotone(ts, keys.map(k => c === 4 ? Math.log(k[c]) : k[c])));
  return p => ({x: ch[0](p), y: ch[1](p), z: ch[2](p), dist: Math.exp(ch[3](p)), yaw: ch[4](p) * deg, el: ch[5](p) * deg, fov: ch[6](p)});
};
const A = rig(KEYS_A), B = rig(KEYS_B);

// The rig's speed, as the probe measures it: travel over the distance to the target, turn, tilt and zoom
// a ramp at a constant rate, eased over its first and last 15%
const ramp = (p, w) => {const t = seg(p, w), e = 0.15, k = 1 / (1 - e); return t < e ? k * t * t / (2 * e) : t > 1 - e ? 1 - k * (1 - t) ** 2 / (2 * e) : k * (t - e / 2);};
const posOf = c => [c.x + c.dist * Math.cos(c.el) * Math.sin(c.yaw), c.y + c.dist * Math.sin(c.el), c.z + c.dist * Math.cos(c.el) * Math.cos(c.yaw)];
export const rigStep = (a, b) => {
  const pa = posOf(a), pb = posOf(b);
  return Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]) / ((a.dist + b.dist) / 2) + Math.abs(b.yaw - a.yaw) + Math.abs(b.el - a.el) + Math.abs(Math.log(Math.tan(b.fov * deg / 2) / Math.tan(a.fov * deg / 2)));
};

// The curves above are smooth in speed but not in acceleration: it jumps at every key. So the rig is re-timed along
// its own path: the camera covers the same path at the speed worked out below. Same path, the same total, the same
// rest at the end; only the timing along the path changes, a few thousandths of the scroll at most.
// (how long this takes at module load is reported with the page's start-up)
export let retimeMs = 0;
const retime = (() => {
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  const N = 12000, end = T.back[1], s = new Float64Array(N + 1);
  let prev = A(0);
  for (let i = 1; i <= N; i++) {const c = A(end * i / N); s[i] = s[i - 1] + rigStep(prev, c); prev = c;}
  // its speed, smoothed with a Gaussian (1.2% of the scroll), eased to zero over the last 8% before the camera rests
  const v = new Float64Array(N), sigma = 0.012 / end * N, R = Math.ceil(3 * sigma), want = new Float64Array(N + 1);
  for (let i = 0; i < N; i++) v[i] = s[i + 1] - s[i];
  const gw = new Float64Array(2 * R + 1);
  for (let k = -R; k <= R; k++) gw[k + R] = Math.exp(-0.5 * (k / sigma) ** 2);
  for (let i = 0; i < N; i++) {
    let sum = 0, wsum = 0;
    for (let k = Math.max(0, i - R); k <= Math.min(N - 1, i + R); k++) {const w = gw[k - i + R]; sum += v[k] * w; wsum += w;}
    const u = Math.min(1, Math.max(0, (end - end * (i + 0.5) / N) / 0.08));
    want[i + 1] = want[i] + sum / wsum * (u * u * u * (u * (u * 6 - 15) + 10));
  }
  const scale = s[N] / want[N];
  // for each progress, the parameter at which the rig has covered the wanted share of its path
  const q = new Float64Array(N + 1);
  for (let i = 0, j = 0; i <= N; i++) {
    const target = want[i] * scale;
    while (j < N && s[j + 1] < target) j++;
    q[i] = j >= N ? end : end * (j + (s[j + 1] > s[j] ? (target - s[j]) / (s[j + 1] - s[j]) : 0)) / N;
  }
  retimeMs = typeof performance !== 'undefined' ? performance.now() - t0 : 0;
  return p => {
    if (p >= end) return p;
    const x = Math.max(0, p) / end * N, i = Math.min(N - 1, Math.floor(x)), f = x - i;
    return q[i] + (q[i + 1] - q[i]) * f;
  };
})();
export const cameraAt = p => (p < T.swap[1] ? A(retime(p)) : B(p));

// Scroll and progress. Everything runs on progress (0–1), but where the camera moves faster than the film's typical pace
// it gets more scroll per unit of progress, in proportion (up to 1.5×), so nothing passes much faster under the wheel
// than the walk. The weight follows the camera's own speed (as rigStep measures it), smoothed over 3% of the film, so
// it rises and falls with the speed and never ramps against a steady camera. SCROLL_LENGTH is the film's scroll in
// those units (1 = as if evenly spread)
const SCROLL = (() => {
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  const N = 2000, v = new Float64Array(N);
  let prev = cameraAt(0);
  for (let i = 1; i <= N; i++) {const c = cameraAt(i / N); v[i - 1] = rigStep(prev, c) * N; prev = c;}
  const blur = (x, sigma) => {
    const R = Math.ceil(3 * sigma), g = Array.from({length: 2 * R + 1}, (_, k) => Math.exp(-0.5 * ((k - R) / sigma) ** 2)), out = new Float64Array(x.length);
    for (let i = 0; i < x.length; i++) {let s = 0, w = 0; for (let k = -R; k <= R; k++) {const j = i + k; if (j >= 0 && j < x.length) {s += x[j] * g[k + R]; w += g[k + R];}} out[i] = s / w;}
    return out;
  };
  const sm = blur(v, 0.03 * N);
  // the typical pace: the 40th percentile of the moving film's speed, from the plan to the cut
  const moving = [...sm.slice(Math.round(T.plan[1] * N), Math.round(T.swap[0] * N))].sort((a, b) => a - b), ref = moving[Math.floor(moving.length * 0.4)];
  const w = blur(sm.map(x => Math.min(1.5, Math.max(1, x / ref))), 0.015 * N);
  const S = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) S[i] = S[i - 1] + w[i - 1] / N;
  retimeMs += typeof performance !== 'undefined' ? performance.now() - t0 : 0;
  return {N, w, S};
})();
export const scrollWeight = p => SCROLL.w[Math.min(SCROLL.N - 1, Math.max(0, Math.floor(p * SCROLL.N)))];
export const SCROLL_LENGTH = SCROLL.S[SCROLL.N];
// progress → the fraction of the film's scroll, and back
export const pToScroll = p => {const {N, S} = SCROLL, x = Math.min(1, Math.max(0, p)) * N, i = Math.min(N - 1, Math.floor(x)); return (S[i] + (S[i + 1] - S[i]) * (x - i)) / S[N];};
export const scrollToP = f => {
  const {N, S} = SCROLL, t = Math.min(1, Math.max(0, f)) * S[N];
  let lo = 0, hi = N;
  while (hi - lo > 1) {const mid = (lo + hi) >> 1; if (S[mid] <= t) lo = mid; else hi = mid;}
  return (lo + (S[hi] > S[lo] ? (t - S[lo]) / (S[hi] - S[lo]) : 0)) / N;
};
export const CAMERA_KEYS = [...KEYS_A, ...KEYS_B];

const r = new THREE.Vector3(), u = new THREE.Vector3(), o = new THREE.Vector3(), f = new THREE.Vector3(), v = new THREE.Vector3(), m = new THREE.Matrix4();
// on wide screens the sheet sits right of centre, clear of the captions (the probe counts this as motion too)
// on portrait screens the tray sits right of centre as it comes out: the lens slides, at an even rate from the end of the
// walk until the tray has opened (so its front stays in frame as it slides out: the probe checks its corners) (so the tray doesn't settle and set off again, and the camera doesn't ease off
// through the explode), and back at an even rate over the dive
// on a phone the sheet is framed from x −17.2 m (the section mark) to 12.8 m (the rule before the notes column,
// drawing.js), so no notes are cut into slivers at the edge: 30 m across, centred 2.2 m west of the target
const PHONE_SHEET = {half: 15 / 106, shift: 2.2 / 30};
// how much of the opening (and closing) framing of the sheet applies
const sheetView = p => Math.max(1 - smoother(seg(p, [T.plan[1] - 0.005, T.rooms[1]])), smoother(seg(p, [T.paper[0], T.back[1]])));
// (on a phone the crop hands over to the aerial framing more slowly, through the whole build)
const phoneSheetView = p => Math.max(1 - smoother(seg(p, [T.plan[1] - 0.005, T.racks[0]])), smoother(seg(p, [T.paper[0], T.back[1]])));
export const lensShift = (p, aspect) => (aspect > 1.25 ? 0.085 * sheetView(p)
  : aspect < 0.9 ? -0.31 * ramp(p, [T.walk[1], T.explode[0] + 0.03]) * (1 - ramp(p, [T.explode[1], T.dive[1] + 0.03]))
    // and on the sheet the lens slides so the frame runs from the section mark to the rule before the notes
    + PHONE_SHEET.shift * phoneSheetView(p) : 0);

// position, aim and lens for a progress, without the lens shifts
// On a portrait screen the frame is narrow and the locate tray would stay off its left edge for most of the turn: the
// phone's camera aims a little further round, toward the row it will turn to, from the start of the walk, and comes
// back slowly from the end of the slide through the explode and the dive (aim only: it turns in place), so the near racks and then the tray are
// in frame
const phoneLead = (p, aspect) => (aspect < 0.9 ? 14 * deg * smoother(seg(p, [T.walk[0] - 0.005, 0.6])) * (1 - smoother(seg(p, [T.slide[1], T.dive[1]]))) : 0);
function pose(camera, p, aspect) {
  const c = cameraAt(p), yaw = c.yaw + phoneLead(p, aspect);
  // the camera stands where the rig puts it; on a phone only its aim leads (it turns in place, it doesn't orbit)
  o.set(Math.cos(c.el) * Math.sin(c.yaw), Math.sin(c.el), Math.cos(c.el) * Math.cos(c.yaw));
  camera.position.set(c.x, c.y, c.z).addScaledVector(o, c.dist);
  o.set(Math.cos(c.el) * Math.sin(yaw), Math.sin(c.el), Math.cos(c.el) * Math.cos(yaw));
  r.set(Math.cos(yaw), 0, -Math.sin(yaw));
  f.copy(o).negate();
  u.crossVectors(r, f).normalize();
  camera.quaternion.setFromRotationMatrix(m.makeBasis(r, u, o));
  // keep the whole sheet in a portrait window: widen the vertical view when the window is narrow (fully from 100 m
  // away, easing out by 4 m, so the lens narrows gently through the build and the descent)
  const wide = smoother(Math.min(1, Math.max(0, Math.log(c.dist / 4) / Math.log(25))));
  // on portrait screens the lens widens once more, at an even rate from the end of the plan to the start of the descent
  // (over the aerial shots, which are wide anyway: it is never narrowed and widened again, and it holds from the
  // aisle floor on, so the walk is no zoom and the camera's own zoom onto the tray isn't cancelled), so the tray
  // fits across the frame, and
  // stays that wide through the dive and the cut (the hall's sheet needs the same width), so it never narrows and
  // widens again: no zoom out on the way in, and the sheet is the same size either side of the cut
  const tray = aspect < 0.9 ? ramp(p, [T.plan[1], T.descend[0] + 0.05]) : 0;
  let fit = aspect < 1.2 ? 1 + (Math.min(2.2, 1.2 / aspect) - 1) * (wide + (1 - wide) * tray) : 1;
  if (aspect < 0.9) fit = THREE.MathUtils.lerp(fit, PHONE_SHEET.half / aspect / Math.tan(c.fov * deg / 2), phoneSheetView(p));
  camera.fov = 2 * Math.atan(Math.tan(c.fov * deg / 2) * fit) / deg;
  camera.near = Math.max(0.0004, c.dist * 0.02);
  camera.far = Math.max(160, c.dist * 60);
  camera.aspect = aspect;
  return c;
}

// where the locate tray's front is across the frame (0 left, 1 right) with no lens shift, or null behind the camera
const scratch = new THREE.PerspectiveCamera();
function subjectAt(p, aspect) {
  pose(scratch, p, aspect); scratch.clearViewOffset(); scratch.updateProjectionMatrix(); scratch.updateMatrixWorld();
  v.set(PICK.x, D.slotY + 0.022, D.frontZ).project(scratch);
  return v.z < 1 ? (v.x + 1) / 2 : null;
}
// Through the turn the camera's yaw speeds up near the end, which would sweep the tray into place. A lens shift
// re-times where the tray sits: it follows a cubic from its position as the turn starts to its position as it ends,
// with the same speed as the camera gives it at both ends, so it glides across at an even rate and the shift is zero
// at both ends of the window. (Per window shape: the ends are measured once and kept.)
const TURN = [T.power[1] - 0.03, T.turn[1] + 0.012], ends = new Map();
function turnShift(p, aspect) {
  if (p <= TURN[0] || p >= TURN[1]) return 0;
  const key = aspect.toFixed(3);
  if (!ends.has(key)) {
    const [a, b] = TURN, h = 0.002, xa = subjectAt(a, aspect), xb = subjectAt(b, aspect);
    const ma = (subjectAt(a + h, aspect) - xa) / h * (b - a), mb = (xb - subjectAt(b - h, aspect)) / h * (b - a);
    ends.set(key, [xa, xb, ma, mb].some(x => x == null || !isFinite(x)) ? null : [xa, xb, ma, mb]);
  }
  const e = ends.get(key), now = e && subjectAt(p, aspect);
  if (!e || now == null) return 0;
  const [xa, xb, ma, mb] = e, t = (p - TURN[0]) / (TURN[1] - TURN[0]), t2 = t * t, t3 = t2 * t;
  const want = (2 * t3 - 3 * t2 + 1) * xa + (t3 - 2 * t2 + t) * ma + (-2 * t3 + 3 * t2) * xb + (t3 - t2) * mb;
  // eased in and out over the window's first and last quarter, so the shift starts and ends with no change in speed
  const ramp = Math.min(smoother(Math.min(1, t * 4)), smoother(Math.min(1, (1 - t) * 4)));
  return (want - now) * ramp;
}
// every horizontal lens shift at a progress, as a fraction of the frame's width (the probe counts it as motion)
export const frameShift = (p, aspect) => lensShift(p, aspect) + turnShift(p, aspect);

export function placeCamera(camera, p, aspect) {
  const c = pose(camera, p, aspect);
  // on wide screens the sheet sits right of centre, clear of the captions: a lens shift, so the perspective is
  // unchanged. Through the turn the tray's place on screen is re-timed (above)
  const shift = frameShift(p, aspect);
  const lift = aspect < 0.9 ? 0.12 * ramp(p, [T.walk[1], T.explode[1]]) * (1 - smoother(seg(p, [T.dive[1], T.swap[0]]))) : 0;
  if (shift !== 0 || lift > 0) camera.setViewOffset(1000 * aspect, 1000, -shift * 1000 * aspect, lift * 1000, 1000 * aspect, 1000); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return c;
}
