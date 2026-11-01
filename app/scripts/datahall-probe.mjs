// Measures Data Hall's camera, from the same code the page runs (camera.js, bundled for Node by esbuild):
//   node scripts/datahall-probe.mjs [out.json]
// 1. Visual speed per unit of scroll: travel relative to the camera's distance to its target, turn (with any sideways
//    lens shift), tilt and zoom (camera.js rigStep). Reported per chapter as mean, peak and peak/mean.
// 2. Jerk: the change in visual speed between samples, to catch stops-and-starts and lurches.
// 3. Clearance: the camera's distance to the nearest rack, wall or column from the descent on, so it never
//    passes through anything.
// Writes the per-sample curve to out.json for the case page and the review rounds.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), app = path.resolve(here, '..');
const tmp = path.join(os.tmpdir(), 'datahall-probe.mjs');
fs.writeFileSync(path.join(os.tmpdir(), 'datahall-probe-entry.js'), `export * from ${JSON.stringify(path.join(app, 'src/pages/data-hall/camera.js').replaceAll('\\', '/'))};\nexport * as PLAN from ${JSON.stringify(path.join(app, 'src/pages/data-hall/plan.js').replaceAll('\\', '/'))};\nexport {T, CAPTIONS} from ${JSON.stringify(path.join(app, 'src/pages/data-hall/timeline.js').replaceAll('\\', '/'))};`);
fs.appendFileSync(path.join(os.tmpdir(), 'datahall-probe-entry.js'), `\nexport {DETAIL, TRAY} from ${JSON.stringify(path.join(app, 'src/pages/data-hall/detail.js').replaceAll('\\', '/'))};\nexport * as THREE from 'three';`);
execFileSync(process.execPath, [path.join(app, 'node_modules/esbuild/bin/esbuild'), path.join(os.tmpdir(), 'datahall-probe-entry.js'), '--bundle', '--format=esm', '--platform=node', '--outfile=' + tmp, '--log-level=error', '--external:three'], {cwd: app});
// three and its addons resolve from the app
const three = pathToFileURL(path.join(app, 'node_modules/three')).href;
fs.writeFileSync(tmp, fs.readFileSync(tmp, 'utf8')
  .replace(/from\s*"three"/g, `from "${three}/build/three.module.js"`)
  .replace(/from\s*"three\/addons\//g, `from "${three}/examples/jsm/`));
const {cameraAt, frameShift, placeCamera, rigStep, PLAN, T, DETAIL, TRAY, THREE, CAPTIONS, scrollWeight, SCROLL_LENGTH, pToScroll} = await import(pathToFileURL(tmp).href);
const CAPTION_LOCATE = CAPTIONS.find(c => c.title.en === 'Locate light').at[0];

// a phone's stage: the canvas fills the whole screen (100dvh, behind the navigation), 390 × 844
const PHONE = 390 / 844;
const N = 4000, deg = Math.PI / 180, camA = new THREE.PerspectiveCamera(), camB = new THREE.PerspectiveCamera();
const pos = c => [c.x + c.dist * Math.cos(c.el) * Math.sin(c.yaw), c.y + c.dist * Math.sin(c.el), c.z + c.dist * Math.cos(c.el) * Math.cos(c.yaw)];
const samples = [];
let prev = null;
for (let i = 0; i <= N; i++) {
  const p = i / N, c = cameraAt(p), q = pos(c);
  if (prev) {
    const d = Math.hypot(q[0] - prev.q[0], q[1] - prev.q[1], q[2] - prev.q[2]);
    // translation in units of the viewing distance, plus rotation (yaw, elevation) and the lens's zoom (log of tan fov/2)
    // plus the lens shift on a 16:9 screen, as a fraction of the frame's width
    // the rig's speed (camera.js rigStep: travel over distance, turn, tilt, zoom), with the horizontal lens shift added
    // to the turn with its sign, as the angle it moves the picture by (one frame width = the horizontal field of view)
    const hfov = 2 * Math.atan(Math.tan(c.fov * deg / 2) * 16 / 9), dShift = (frameShift(p, 16 / 9) - frameShift((i - 1) / N, 16 / 9)) * hfov;
    const v = (rigStep(prev.c, c) - Math.abs(c.yaw - prev.c.yaw) + Math.abs(c.yaw - prev.c.yaw + dShift)) * N;
    samples.push({p, v, q, dist: c.dist});
  }
  prev = {c, q};
}
// the match cut is designed: it is the one sample allowed to jump
const cut = samples.findIndex(s => s.p >= T.swap[1]);
const curve = samples.map((s, i) => (i === cut ? {...s, v: samples[i - 1].v, cut: true} : s));
const chapters = [['plan', 0, T.slab[0]], ['build', T.slab[0], T.connect[1]], ['descend', T.descend[0], T.descend[1]], ['walk', ...T.walk], ['power', ...T.power], ['turn', ...T.turn], ['tray', T.slide[0], T.explode[1]], ['dive', ...T.dive], ['back', T.back[0], T.back[1] - 0.05]];
// (the approach ends by easing to rest on the opening view over its last 5%, which the arrival rules below check)
const report = chapters.map(([name, a, b]) => {
  const s = curve.filter(x => x.p > a && x.p <= b), vs = s.map(x => x.v);
  const mean = vs.reduce((m, v) => m + v, 0) / vs.length, peak = Math.max(...vs), low = Math.min(...vs);
  let jerk = 0;
  for (let i = 1; i < s.length; i++) jerk = Math.max(jerk, Math.abs(s[i].v - s[i - 1].v) * N);
  // (and per unit of scroll, what the wheel feels: progress runs slower under the wheel where the scroll is stretched)
  const perScroll = s.reduce((m, x) => m + x.v / scrollWeight(x.p), 0) / s.length;
  return {name, mean: +mean.toFixed(2), peak: +peak.toFixed(2), low: +low.toFixed(2), peakOverMean: +(peak / mean).toFixed(2), maxJerk: +jerk.toFixed(0), perScroll};
});
// whole-film pace: each chapter's mean against the film's
const all = curve.map(s => s.v), filmMean = all.reduce((m, v) => m + v, 0) / all.length;

// clearance from the descent to the dive, against everything solid: racks, columns, walls and the overhead services
// (busway, fibre trays, coolant headers, containment roof and ducts) and the plant. The camera's near plane is
// subtracted, so a pass means nothing is ever clipped either.
const {RACKS, RACK, COLUMNS, WALL, ROWS, HOT_AISLES, OVERHEAD: O, ROW_X0, ROW_X1, CDUS, FANWALLS, ROOMS} = PLAN;
const bx = (x0, x1, y0, y1, z0, z1, what) => ({x0, x1, y0, y1, z0, z1, what});
const boxes = [
  ...RACKS.map(r => bx(r.x - RACK.w / 2, r.x + RACK.w / 2, 0, RACK.h, r.z - RACK.d / 2, r.z + RACK.d / 2, `rack R${r.row + 1}-${r.i + 1}`)),
  ...COLUMNS.map(c => bx(c.x - 0.25, c.x + 0.25, 0, WALL.h, c.z - 0.25, c.z + 0.25, 'column')),
  ...ROWS.flatMap(row => {
    const zc = (row.z0 + row.z1) / 2, zb = zc - row.face * 0.3, zt = zc + row.face * 0.32;
    return [bx(ROW_X0 - 0.2, ROW_X1 + 0.9, O.busway, O.busway + 0.2, zb - 0.065, zb + 0.065, 'busway'), bx(ROW_X0 - 0.2, ROW_X1 + 1.3, O.tray, O.tray + 0.08, zt - 0.15, zt + 0.15, 'fibre tray')];
  }),
  bx(ROW_X1 + 0.835, ROW_X1 + 0.965, O.busway, O.busway + 0.2, ROOMS.hall.z0, ROWS.at(-1).z1, 'busway trunk'),
  bx(ROW_X1 + 1.1, ROW_X1 + 1.5, O.tray, O.tray + 0.1, ROOMS.hall.z0, ROWS.at(-1).z1, 'fibre trunk'),
  ...HOT_AISLES.flatMap(h => {
    const zc = (h.z0 + h.z1) / 2;
    return [bx(ROW_X0 - 0.3, CDUS[0].x, O.supply, O.supply + 0.16, zc - 0.33, zc - 0.17, 'supply header'), bx(ROW_X0 - 0.3, CDUS[0].x, O.ret, O.ret + 0.16, zc + 0.17, zc + 0.33, 'return header'),
      bx(ROW_X0, ROW_X1, RACK.h, O.ceiling, h.z0 - 0.02, h.z1 + 0.02, 'containment'),
      bx(ROW_X0 - 0.1, ROW_X1 + 0.1, O.busway - 0.05, O.ret + 0.25, ROWS[HOT_AISLES.indexOf(h) * 2].z0, ROWS[HOT_AISLES.indexOf(h) * 2 + 1].z1, 'frame and services')];
  }),
  ...[...CDUS, ...FANWALLS].map(e => bx(e.x - e.w / 2, e.x + e.w / 2, 0, e.h, e.z - e.d / 2, e.z + e.d / 2, 'plant')),
];
const wallDist = (q, w) => {
  const dx = w.x1 - w.x0, dz = w.z1 - w.z0, L2 = dx * dx + dz * dz, t = Math.max(0, Math.min(1, ((q[0] - w.x0) * dx + (q[2] - w.z0) * dz) / L2));
  const h = Math.hypot(q[0] - (w.x0 + t * dx), q[2] - (w.z0 + t * dz)) - 0.2;
  return q[1] > WALL.h ? Math.hypot(Math.max(0, h), q[1] - WALL.h) : h;
};
const boxDist = (q, b) => Math.hypot(Math.max(b.x0 - q[0], 0, q[0] - b.x1), Math.max(b.y0 - q[1], 0, q[1] - b.y1), Math.max(b.z0 - q[2], 0, q[2] - b.z1));
let worst = {d: Infinity};
for (const s of curve) {
  if (s.p < T.descend[0] - 0.05 || s.p > T.dive[0]) continue;
  const near = Math.max(0.0004, s.dist * 0.02);
  for (const b of boxes) {const d = boxDist(s.q, b) - near; if (d < worst.d) worst = {d, p: s.p, what: b.what};}
  for (const w of PLAN.WALLS) {const d = wallDist(s.q, w) - near; if (d < worst.d) worst = {d, p: s.p, what: 'wall'};}
}
const scrollMean = curve.reduce((m, x) => m + x.v / scrollWeight(x.p), 0) / curve.length;
const result = {filmMean: +filmMean.toFixed(2), chapters: report.map(({perScroll, ...r}) => ({...r, paceVsFilm: +(r.mean / filmMean).toFixed(2), paceVsFilmPerScroll: +(perScroll / scrollMean).toFixed(2)})), clearance: {metres: +worst.d.toFixed(3), at: +worst.p.toFixed(4), nearest: worst.what}};
console.table(result.chapters);
console.log('film mean', result.filmMean, '· nearest approach', result.clearance);
// pass or fail: nothing closer than 0.25 m (near plane included); no chapter's peak above 2.5 times its own mean; and
// no stop inside a moving chapter (its slowest sample at least 15% of its mean). The plan is a held view while the
// drawing draws itself, so only the clearance and the peak apply to it.
const fails = [];
if (result.clearance.metres < 0.25) fails.push('clearance ' + result.clearance.metres + ' m at p ' + result.clearance.at);
for (const c of result.chapters) {
  if (c.peakOverMean > 2.5) fails.push(c.name + ': peak ' + c.peakOverMean + '× its mean');
  if (c.name !== 'plan' && c.low < 0.15 * c.mean) fails.push(c.name + ': slows to ' + c.low + ' (mean ' + c.mean + ')');
}
// and no lurch: the mean speed of two neighbouring 1% windows of scroll differs by at most 1.5 times. The plan's
// opening hold, the cut itself and the final settle are left out.
// (while the camera moves: windows slower than a third of the film’s mean are left out, and the approach to the last
// frame, from the dive’s end, is a deliberate ease to rest, checked by the arrival rules below)
const moving = v => v > filmMean / 3;
const easing = p => p > T.dive[1];
const win = [];
for (let w = 0; w < 100; w++) {
  const a = w / 100, b = (w + 1) / 100;
  if (b <= T.plan[1] || easing(b)) {win.push(null); continue;}
  const s = curve.filter(x => x.p > a && x.p <= b);
  win.push(s.reduce((m, x) => m + x.v, 0) / s.length);
}
const lurches = [];
for (let w = 1; w < 100; w++) if (win[w] && win[w - 1] && moving(win[w]) && moving(win[w - 1])) {
  const r = Math.max(win[w], win[w - 1]) / Math.min(win[w], win[w - 1]);
  if (r > 1.5) lurches.push(`p ${(w / 100).toFixed(2)}: ${win[w - 1].toFixed(1)} → ${win[w].toFixed(1)} (${r.toFixed(2)}×)`);
}
// and no surge: neighbouring 5% windows differ by at most 1.6 times
const w5 = [];
for (let w = 0; w < 20; w++) {const a = w / 20, b = (w + 1) / 20, s = curve.filter(x => x.p > a && x.p <= b && x.p > T.plan[1] && !easing(x.p)); w5.push(s.length ? s.reduce((m, x) => m + x.v, 0) / s.length : null);}
for (let w = 1; w < 20; w++) if (w5[w] && w5[w - 1] && moving(w5[w]) && moving(w5[w - 1])) {const r = Math.max(w5[w], w5[w - 1]) / Math.min(w5[w], w5[w - 1]); if (r > 1.6) lurches.push(`5% windows at p ${(w / 20).toFixed(2)}: ${w5[w - 1].toFixed(1)} → ${w5[w].toFixed(1)} (${r.toFixed(2)}×)`);}
// and no ramp: neighbouring 2% windows differ by at most 1.3 times, and no step: two neighbouring samples (1/4000 of
// the scroll apart) differ by at most 1.15 times, while the camera moves (the opening hold and the final settle aside)
const w2 = [];
for (let w = 0; w < 50; w++) {const a = w / 50, b = (w + 1) / 50, s = curve.filter(x => x.p > a && x.p <= b && x.p > T.plan[1] + 0.005 && !easing(x.p)); w2.push(s.length > 20 ? s.reduce((m, x) => m + x.v, 0) / s.length : null);}
for (let w = 1; w < 50; w++) if (w2[w] && w2[w - 1] && moving(w2[w]) && moving(w2[w - 1])) {const r = Math.max(w2[w], w2[w - 1]) / Math.min(w2[w], w2[w - 1]); if (r > 1.3) lurches.push(`2% windows at p ${(w / 50).toFixed(2)}: ${w2[w - 1].toFixed(1)} → ${w2[w].toFixed(1)} (${r.toFixed(2)}×)`);}
let steps = 0, step = null;
for (let i = 1; i < curve.length; i++) {
  const a = curve[i - 1], b = curve[i];
  if (a.cut || b.cut || b.p <= T.plan[1] || easing(b.p) || !moving(a.v) || !moving(b.v)) continue;
  const r = Math.max(a.v, b.v) / Math.max(1e-6, Math.min(a.v, b.v));
  if (r > 1.15) {steps++; if (!step || r > step.r) step = {p: b.p, r, from: a.v, to: b.v};}
}
if (step) lurches.push(`${steps} steps between neighbouring samples; worst at p ${step.p.toFixed(4)}: ${step.from.toFixed(1)} → ${step.to.toFixed(1)} (${step.r.toFixed(2)}×)`);
// the arrival: from the dive's end to the last frame the speed only ever falls, it never brakes harder than the
// camera changes speed anywhere else in the film (speed averaged over 0.5% of scroll), and it reaches rest (under 1%
// of the film's mean) at the key, so the camera eases to a stop instead of being clamped
const arrive = curve.filter(x => x.p > T.dive[1] + 0.002 && x.p <= T.back[1] + 0.002);
const halves = [];
for (let w = 0; w < 200; w++) {const q = curve.filter(x => x.p > w / 200 && x.p <= (w + 1) / 200 && !x.cut); halves.push({p: (w + 0.5) / 200, v: q.reduce((m, x) => m + x.v, 0) / q.length});}
let harshest = 0, braking = 0;
for (let w = 1; w < 200; w++) {
  const a = halves[w - 1], b = halves[w], rate = Math.abs(b.v - a.v) * 200;
  if (b.p <= T.plan[1] || b.p > T.back[1] + 0.003) continue;
  if (easing(b.p)) braking = Math.max(braking, rate); else if (moving(a.v) && moving(b.v)) harshest = Math.max(harshest, rate);
}
result.arrival0 = {braking: +braking.toFixed(0), harshestElsewhere: +harshest.toFixed(0)};
if (braking > harshest) fails.push(`arrival: brakes at ${braking.toFixed(0)}, harder than anywhere else in the film (${harshest.toFixed(0)})`);
// (rises counted on the 0.5% windows, so sampling noise in a single sample doesn’t count)
const eased = halves.filter(h => h.p > T.dive[1] + 0.005 && h.p < T.back[1]);
let rises = 0; for (let i = 1; i < eased.length; i++) if (eased[i].v > eased[i - 1].v * 1.01) rises++;
const atRest = arrive.at(-1).v;
result.arrival = {...result.arrival0, rises, endSpeed: +atRest.toFixed(3)}; delete result.arrival0;
console.log('arrival: braking', braking.toFixed(0), '(harshest change elsewhere', harshest.toFixed(0) + '), speed rises', rises, 'times, at rest', atRest.toFixed(3));
if (rises) fails.push(`arrival: the speed rises ${rises} times while easing to the last frame`);
if (atRest > filmMean * 0.01) fails.push(`arrival: still moving at ${atRest.toFixed(2)} when the camera reaches the last frame`);
// and no V: a 1% window that dips below 0.8 times the faster of the windows within 4% on either side of it
// (whichever side is slower) is a brake and relaunch, however gradual
for (let w = 4; w < 96; w++) {
  if (!win[w] || !moving(win[w])) continue;
  const left = win.slice(w - 4, w).filter(Boolean), right = win.slice(w + 1, w + 5).filter(Boolean);
  if (left.length < 2 || right.length < 2) continue;
  const rim = Math.min(Math.max(...left), Math.max(...right));
  if (win[w] < 0.8 * rim) lurches.push(`a dip at p ${(w / 100).toFixed(2)}: ${win[w].toFixed(1)} between ${Math.max(...left).toFixed(1)} and ${Math.max(...right).toFixed(1)}`);
}
// the same 4% rule on the 16:9 screen, from the power-on to the dive's end
for (let w = Math.round(T.power[1] * 100) + 4; w < Math.round(T.dive[1] * 100); w++) if (win[w] && win[w - 4] && moving(win[w]) && moving(win[w - 4]) && Math.max(win[w], win[w - 4]) / Math.min(win[w], win[w - 4]) > 1.2) lurches.push(`over 4% at p ${(w / 100).toFixed(2)}: ${win[w - 4].toFixed(1)} → ${win[w].toFixed(1)}`);
// and the same rules on what the wheel feels: speed per unit of scroll (the speed per unit of progress over the
// scroll weight), in 1% windows of progress: neighbouring windows within 1.5×, and (as per unit of progress) from the
// power-on to the dive's end no window more than 1.2× (or under 1 / 1.2 of) the one 4% before it
{
  const ws = [];
  for (let w = 0; w < 100; w++) {const x = curve.filter(q => q.p > w / 100 && q.p <= (w + 1) / 100 && !q.cut); ws.push(x.reduce((m, q) => m + q.v / scrollWeight(q.p), 0) / Math.max(1, x.length));}
  result.perScroll = ws.map((v, w) => [w / 100, +v.toFixed(2)]);
  for (let w = Math.round(T.plan[1] * 100) + 4; w < Math.round(T.dive[1] * 100); w++) {
    const a = ws[w - 1], b = ws[w], c = ws[w - 4];
    if (moving(a) && moving(b) && Math.max(a, b) / Math.min(a, b) > 1.5) lurches.push(`per scroll at p ${(w / 100).toFixed(2)}: ${a.toFixed(1)} → ${b.toFixed(1)}`);
    if (w >= Math.round(T.power[1] * 100) + 4 && moving(b) && moving(c) && Math.max(b, c) / Math.min(b, c) > 1.2) lurches.push(`per scroll, over 4% at p ${(w / 100).toFixed(2)}: ${c.toFixed(1)} → ${b.toFixed(1)}`);
  }
  // and the curve by scroll, for the making-of's chart
  result.curveScroll = curve.filter((_, i) => i % 8 === 0).map(q => [+pToScroll(q.p).toFixed(4), +(q.v / scrollWeight(q.p)).toFixed(2)]);
  result.scrollLength = +SCROLL_LENGTH.toFixed(3);
  console.log('scroll length', SCROLL_LENGTH.toFixed(3), '(film', Math.round(1100 * SCROLL_LENGTH), 'vh)');
  console.log('per scroll, 1% windows 0.30–0.86:', ws.slice(30, 86).map(v => v.toFixed(0)).join(' '));
}
// the phone's camera as it really is (placeCamera at 390 × 844: its aim, its wider lens and its shifts), with the same
// rules for its 1% and 2% windows and its dips from the build to the dive's end
{
  const M = 2000, pa = new THREE.PerspectiveCamera(), pb = new THREE.PerspectiveCamera(), asp = PHONE, vph = [];
  const offs = cam => cam.view && cam.view.enabled ? [cam.view.offsetX / cam.view.fullWidth, cam.view.offsetY / cam.view.fullHeight] : [0, 0];
  for (let i = 1; i <= M; i++) {
    const p0 = (i - 1) / M, p1 = i / M, c0 = placeCamera(pa, p0, asp), c1 = placeCamera(pb, p1, asp);
    if (p1 >= T.swap[1]) {vph.push({p: p1, v: 0}); continue;}
    const turn = 2 * Math.acos(Math.min(1, Math.abs(pa.quaternion.dot(pb.quaternion))));
    const vf0 = pa.fov * deg, vf1 = pb.fov * deg, hf = 2 * Math.atan(Math.tan(vf1 / 2) * asp), [sx0, sy0] = offs(pa), [sx1, sy1] = offs(pb);
    const v = pa.position.distanceTo(pb.position) / ((c0.dist + c1.dist) / 2) + turn + Math.abs(Math.log(Math.tan(vf1 / 2) / Math.tan(vf0 / 2))) + Math.abs(sx1 - sx0) * hf + Math.abs(sy1 - sy0) * vf1;
    vph.push({p: p1, v: v * M});
  }
  const pw = [];
  // (windows start after the opening hold, as the 16:9 ones do)
  for (let w = 0; w < 100; w++) {const s = vph.filter(x => x.p > w / 100 && x.p <= (w + 1) / 100 && x.p > T.plan[1] + 0.005); pw.push(s.reduce((m, x) => m + x.v, 0) / Math.max(1, s.length));}
  const pmean = pw.slice(5, 82).reduce((m, x) => m + x, 0) / 77, pmoving = v => v > pmean / 3;
  result.phone = pw.map((v, w) => [w / 100, +v.toFixed(2)]);
  console.log('phone camera, 1% windows 0.55–0.80:', pw.slice(55, 80).map(v => v.toFixed(0)).join(' '));
  for (let w = Math.round(T.plan[1] * 100) + 1; w < Math.round(T.dive[1] * 100); w++) {
    const a = pw[w - 1], b = pw[w];
    if (a && b && pmoving(a) && pmoving(b) && Math.max(a, b) / Math.min(a, b) > 1.5) lurches.push(`phone camera at p ${(w / 100).toFixed(2)}: ${a.toFixed(1)} → ${b.toFixed(1)}`);
  }
  // (from the end of the ease out of the opening hold, the first 3% after it, as the arrival's ease is left out at the end)
  for (let w = Math.round((T.plan[1] + 0.03) * 50) + 1; w < Math.round(T.dive[1] * 50); w++) {
    const a = (pw[2 * w - 2] || pw[2 * w - 1]) && (pw[2 * w - 2] ? (pw[2 * w - 2] + pw[2 * w - 1]) / 2 : pw[2 * w - 1]), b = (pw[2 * w] + pw[2 * w + 1]) / 2;
    if (pmoving(a) && pmoving(b) && Math.max(a, b) / Math.min(a, b) > 1.3) lurches.push(`phone camera, 2% windows at p ${(w / 50).toFixed(2)}: ${a.toFixed(1)} → ${b.toFixed(1)}`);
  }
  // and from the power-on to the dive's end no 4% change on the phone: a 1% window more than 1.2 times the one 4%
  // before it, or under 1 / 1.2 of it
  for (let w = Math.round(T.power[1] * 100) + 4; w < Math.round(T.dive[1] * 100); w++) if (pmoving(pw[w]) && pmoving(pw[w - 4]) && Math.max(pw[w], pw[w - 4]) / Math.min(pw[w], pw[w - 4]) > 1.2) lurches.push(`phone camera, over 4% at p ${(w / 100).toFixed(2)}: ${pw[w - 4].toFixed(1)} → ${pw[w].toFixed(1)}`);
  // and no V on the phone either
  for (let w = Math.round(T.plan[1] * 100) + 4; w < Math.round(T.dive[1] * 100); w++) {
    if (!pmoving(pw[w])) continue;
    const left = pw.slice(w - 4, w), right = pw.slice(w + 1, w + 5), rim = Math.min(Math.max(...left), Math.max(...right));
    if (pw[w] < 0.8 * rim) lurches.push(`phone camera, a dip at p ${(w / 100).toFixed(2)}: ${pw[w].toFixed(1)} between ${Math.max(...left).toFixed(1)} and ${Math.max(...right).toFixed(1)}`);
  }
}
if (lurches.length) fails.push('lurches between neighbouring windows:\n    ' + lurches.join('\n    '));
// the cut: the zoom leaves at the rate it arrived (mean speed over the 0.6% of scroll either side within 1.25×), and
// the sheet is the same size on screen on both sides of it, on a 16:9 screen and on a phone (390 × 844 less the
// navigation), within 2%. Size on screen: the sheet's width over the distance, over tan(fov / 2) as the lens sees it.
const side = (a, b) => {const x = curve.filter(q => q.p > a && q.p <= b && !q.cut); return x.reduce((m, q) => m + q.v, 0) / x.length;};
const into = side(T.swap[1] - 0.006, T.swap[1] - 0.0005), leave = side(T.swap[1] + 0.0005, T.swap[1] + 0.006), cutRatio = Math.max(into, leave) / Math.min(into, leave);
const lens = new THREE.PerspectiveCamera(), onScreen = (p, aspect, sheet) => {const c = placeCamera(lens, p, aspect); return sheet / c.dist / Math.tan(lens.fov * deg / 2);};
const jumps = [16 / 9, PHONE].map(aspect => ({aspect: +aspect.toFixed(3), change: +(onScreen(T.swap[1] + 1e-6, aspect, 42) / onScreen(T.swap[1] - 1e-6, aspect, DETAIL.sheet) - 1).toFixed(4)}));
result.cut = {into: +into.toFixed(2), leave: +leave.toFixed(2), ratio: +cutRatio.toFixed(3), size: jumps};
console.log('cut: speed in', into.toFixed(2), 'out', leave.toFixed(2), `(${cutRatio.toFixed(2)}×); sheet size change`, jumps.map(j => `${j.aspect}: ${(j.change * 100).toFixed(2)}%`).join(', '));
// (when the camera is at rest across the cut, there is no speed to match)
if (Math.max(into, leave) > 0.5 && cutRatio > 1.25) fails.push(`cut: the zoom leaves at ${leave.toFixed(1)} after arriving at ${into.toFixed(1)}`);
for (const j of jumps) if (Math.abs(j.change) > 0.02) fails.push(`cut: the sheet changes size by ${(j.change * 100).toFixed(1)}% at aspect ${j.aspect}`);
// the subject: through the turn the picked tray's front, still in its slot, is what the viewer follows. Its travel on
// a 1600 × 900 screen per 1% of scroll may not jump by more than 1.5 times and more than 15 px from one window to
// the next, so the rig can't sweep it into place while its own speed looks even; it may slow to rest
// as the camera comes to face it
const screen = (p, aspect, W) => {placeCamera(lens, p, aspect); const v = new THREE.Vector3(PLAN.PICK.x, DETAIL.slotY + 0.022, DETAIL.frontZ).project(lens); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * W / aspect];};
const travel = [];
for (let w = Math.round(T.power[1] * 100) - 2; w < Math.round(T.turn[1] * 100); w++) {
  let sum = 0, last = screen(w / 100, 16 / 9, 1600);
  for (let k = 1; k <= 20; k++) {const at = screen((w + k / 20) / 100, 16 / 9, 1600); sum += Math.hypot(at[0] - last[0], at[1] - last[1]); last = at;}
  travel.push({p: w / 100, px: sum});
}
result.subject = travel.map(t => [t.p, +t.px.toFixed(1)]);
// and on a phone (390 × 844 stage): no jump in its travel (1.5× and 8 px), and the tray in frame (10–90% across)
// from the moment its caption appears
const phone = [];
for (let w = Math.round(T.power[1] * 100) - 4; w < Math.round(T.turn[1] * 100); w++) {
  let sum = 0, last = screen(w / 100, PHONE, 390);
  for (let k = 1; k <= 20; k++) {const at = screen((w + k / 20) / 100, PHONE, 390); sum += Math.hypot(at[0] - last[0], at[1] - last[1]); last = at;}
  phone.push({p: w / 100, px: sum});
}
result.subjectPhone = phone.map(t => [t.p, +t.px.toFixed(1)]);
console.log('subject travel on a phone, px per 1%:', phone.map(t => t.px.toFixed(0)).join(' '));
for (let i = 1; i < phone.length; i++) {const a = phone[i - 1].px, b = phone[i].px; if (b - a > 8 && b / Math.max(1, a) > 1.5) fails.push(`subject on a phone: ${a.toFixed(0)} px then ${b.toFixed(0)} px per 1% at p ${phone[i].p.toFixed(2)}`);}
for (let p = CAPTION_LOCATE; p <= T.turn[1]; p += 0.005) {const x = screen(p, PHONE, 390)[0] / 390; if (x < 0.1 || x > 0.9) {fails.push(`subject on a phone: the tray is ${(x * 100).toFixed(0)}% across at p ${p.toFixed(3)}, while its caption shows`); break;}}
// and as it slides out and comes apart, on a phone (390 × 844 stage) the tray's front corners, handles included, stay
// at least 12 px inside the frame (its pose as detail.js poseTray: it slides 0.7 m out, its front from the rack's face)
{
  const sm = t => t * t * t * (t * (t * 6 - 15) + 10), seg = (p, [a, b]) => Math.min(1, Math.max(0, (p - a) / (b - a)));
  const v = new THREE.Vector3();
  let worst = null;
  for (let p = T.slide[0] + 0.01; p <= T.explode[0] + 0.02; p += 0.002) {
    placeCamera(lens, p, PHONE);
    const z = DETAIL.frontZ + 0.009 + 0.7 * sm(seg(p, T.slide)), y0 = DETAIL.outY - TRAY.h / 2, y1 = DETAIL.outY + TRAY.h / 2;
    for (const x of [PLAN.PICK.x - TRAY.w / 2 - 0.02, PLAN.PICK.x + TRAY.w / 2 + 0.02]) for (const y of [y0, y1]) {
      v.set(x, y, z).project(lens);
      const px = (v.x + 1) / 2 * 390, margin = Math.min(px, 390 - px);
      if (!worst || margin < worst.margin) worst = {p, margin};
    }
  }
  result.trayFramePhone = {p: +worst.p.toFixed(3), margin: +worst.margin.toFixed(1)};
  console.log('tray front on a phone, slide to explode: tightest margin', worst.margin.toFixed(1), 'px at p', worst.p.toFixed(3));
  if (worst.margin < 12) fails.push('tray on a phone: its front is ' + worst.margin.toFixed(0) + ' px from the frame edge at p ' + worst.p.toFixed(3) + ' (12 px needed)');
}
console.log('subject travel, px per 1%:', travel.map(t => t.px.toFixed(0)).join(' '));
for (let i = 1; i < travel.length; i++) {
  const a = travel[i - 1].px, b = travel[i].px;
  if (b - a > 15 && b / Math.max(1, a) > 1.5) fails.push(`subject: the tray's front sweeps ${a.toFixed(0)} px then ${b.toFixed(0)} px per 1% at p ${travel[i].p.toFixed(2)}`);
}
console.log(fails.length ? 'FAIL\n  ' + fails.join('\n  ') : 'PASS: clearance, peaks, no stops, no lurches, a continuous cut, an even subject');
if (fails.length) process.exitCode = 1;
const out = process.argv[2];
if (out) fs.writeFileSync(out, JSON.stringify({...result, curve: curve.filter((_, i) => i % 4 === 0).map(s => [+s.p.toFixed(4), +s.v.toFixed(3)])}));
// the case page draws the curve from this copy (every 8th sample)
fs.writeFileSync(path.join(app, 'src/pages/data-hall/probe.json'), JSON.stringify({...result, curve: curve.filter((_, i) => i % 8 === 0).map(s => [+s.p.toFixed(4), +s.v.toFixed(2)])}));
