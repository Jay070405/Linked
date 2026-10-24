// Assets for the Arden case page (src/product/worlds/arden), made from the case folder 视觉设计作品集/cases/d5-glasses:
// the Blender renders (renders/, see ../blender), the AI-generated lifestyle photos (lifestyle/), the in-lens HUD
// (hud/*.svg) and the scene photos the app uses behind it (app/public/scenes/).
//
//   node scripts/build-arden-assets.mjs [path-to-d5-glasses]
//
// Writes into public/assets/product/arden/:
//   still/<name>-<1600|800>.webp     every top-level render in renders/ (alpha kept only where the source is transparent)
//   still/exploded-plate-*.webp, exploded-parts-*.webp, xp/<nn>-<layer>.webp
//                                    the exploded view split into its studio backdrop and its parts on transparency,
//                                    and the parts cut into the layers that move together, each with its travel and
//                                    the numbered callouts placed from the model (scripts/arden-map, written by
//                                    scripts/arden-exploded-map.py in Blender), so the page can close the view up and
//                                    open it as you scroll
//   seq/turntable/<1600|800>/<01..72>.webp   once the 72-frame turntable is complete
//   film/<hero|hero-m|puton|puton-m>/<001..>.webp   the scroll-scrubbed opening and "Put them on": one width per set,
//                                    about 1440 px (wide screens) and about 900 px (the phone crops), quality about 70
//   pov/pov-worn[-m]-<1600|800>.webp the view through the frame, once the page is "worn"
//   still/sim-*-<1600|800>.webp      the outside views (renders/sim), for the You / Them switches
//   controls/sim-*-<900|600>.webp    alpha-bounded control cards, with 6% padding and remapped sim-hotspots.json
//   lifestyle/<name>-<1600|800>.webp, scenes/<name>-<1600|800>.webp, hud/<name>.svg, renders-app/<name>-<w>.webp
//   fonts/InterVariable-latin.woff2  the app's Latin Inter subset (SIL OFL), so page and app share one face
// and the files the page imports at build time:
//   src/product/worlds/arden/data/assets.json      what exists: sizes, frame counts, layers, plate colors
//   src/product/worlds/arden/data/dimensions.json  renders/dimensions.json, as the model measured it
//   src/product/worlds/arden/data/sim-hotspots.json  the control-card crops and anchors
//
// Idempotent and forgiving: an output is re-encoded only when its source (or the settings) changed (cache in app/.cache,
// ignored by git), files a run no longer produces are removed, a sequence still rendering keeps its previous output, and
// anything missing is simply left out of the manifest (the page falls back without it). Re-run after new renders land.
//
// Uses sharp from the pd-prototype project, like build-atelier-thumbs.mjs; this repo gains no dependency.
import {createRequire} from 'node:module';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {controlCrop, remapHotspots} from './arden-control-assets.mjs';
import {remapPartAnchors} from '../src/product/worlds/arden/part-anchors.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const work = path.join(app, '../../../视觉设计作品集');
const sharp = createRequire(path.join(work, 'pd-prototype/package.json'))('sharp');
const CASE = path.resolve(process.argv[2] || process.env.ARDEN_CASE || path.join(work, 'cases/d5-glasses'));
const SRC = path.join(CASE, 'renders');
const OUT = path.join(app, 'public/assets/product/arden');
const DATA = path.join(app, 'src/product/worlds/arden/data');
const CACHE_FILE = path.join(app, '.cache/arden-assets.json');
const URL_BASE = '/assets/product/arden';
const WIDTHS = [1600, 800];

if (!fs.existsSync(CASE)) throw new Error(`Arden case folder not found at ${CASE}`);
for (const d of [OUT, DATA, path.dirname(CACHE_FILE)]) fs.mkdirSync(d, {recursive: true});

const readJson = file => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
const cache = readJson(CACHE_FILE) || {};
const previous = readJson(path.join(DATA, 'assets.json')) || {};
const written = new Set();
const log = [];
let encoded = 0, reused = 0;

const stamp = file => { const s = fs.statSync(file); return `${s.size}:${Math.round(s.mtimeMs)}`; };
async function produce(outFile, sources, settings, make) {
  const key = path.relative(OUT, outFile).replaceAll('\\', '/');
  const sig = JSON.stringify({sources: sources.map(s => [path.relative(CASE, s).replaceAll('\\', '/'), stamp(s)]), settings});
  written.add(path.resolve(outFile));
  if (cache[key]?.sig === sig && fs.existsSync(outFile)) { reused++; return cache[key].meta; }
  fs.mkdirSync(path.dirname(outFile), {recursive: true});
  const meta = (await make(outFile)) || null;
  cache[key] = {sig, meta};
  encoded++;
  return meta;
}
function keep(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) keep(full); else written.add(path.resolve(full));
  }
}
async function hasAlpha(file) {
  const meta = await sharp(file).metadata();
  if (!meta.hasAlpha) return false;
  return (await sharp(file).stats()).channels[3].min < 255;
}
async function patchColor(file, fx, fy, size = 40) {
  const meta = await sharp(file).metadata();
  const left = Math.min(meta.width - size, Math.round(fx * meta.width)), top = Math.min(meta.height - size, Math.round(fy * meta.height));
  const patch = await sharp(file).extract({left, top, width: size, height: size}).removeAlpha().png().toBuffer();
  const {channels} = await sharp(patch).stats();          // stats() reads the input: extract into a buffer first
  return '#' + channels.slice(0, 3).map(c => Math.round(c.mean).toString(16).padStart(2, '0')).join('');
}
const webp = (img, alpha, quality) => (alpha ? img.webp({quality, alphaQuality: 90, effort: 5, smartSubsample: true}) : img.removeAlpha().webp({quality, effort: 5, smartSubsample: true}));

/** One source image → <dir>/<name>-1600.webp and -800.webp. Returns {w, h, alpha, sizes, plate?} or null. */
async function twoSizes(src, dir, name, {quality = 84, plate = false} = {}) {
  if (!fs.existsSync(src)) return null;
  const meta = await sharp(src).metadata();
  const alpha = await hasAlpha(src);
  const entry = {w: meta.width, h: meta.height, alpha, sizes: {}};
  for (const w of WIDTHS) {
    const out = path.join(OUT, dir, `${name}-${w}.webp`);
    const ow = Math.min(w, meta.width), oh = Math.round(meta.height * ow / meta.width);
    await produce(out, [src], {w: ow, alpha, quality}, file => webp(sharp(src).resize({width: ow}), alpha, quality).toFile(file));
    entry.sizes[w] = [ow, oh];
  }
  if (plate && !alpha) entry.plate = await patchColor(src, .5, .04);
  return entry;
}

/* ---------- stills: every top-level render ---------- */
const stills = {};
const renderNames = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter(f => /\.png$/i.test(f)).map(f => f.slice(0, -4)).sort() : [];
for (const name of renderNames) {
  const e = await twoSizes(path.join(SRC, `${name}.png`), 'still', name, {quality: name.startsWith('dimensions') ? 90 : 84, plate: true});
  if (e) stills[name] = e;
}
// the outside views of the glasses (renders/sim), for the You / Them switches
const SIM = path.join(SRC, 'sim');
// Dedicated control-card crops; keep the full-frame You / Them assets below intact.
const controlSource = readJson(path.join(SIM, 'sim-hotspots.json'));
const controlViews = {};
for (const [name, view] of [['sim-3q', '3q'], ['sim-front', 'front'], ['sim-front-indicator', 'front'], ['sim-3q-display', '3q']]) {
  const src = path.join(SIM, `${name}.png`);
  const {data, info} = await sharp(src).ensureAlpha().extractChannel('alpha').raw().toBuffer({resolveWithObject: true});
  const crop = controlCrop(data, info.width, info.height);
  const source = controlSource?.views[view];
  if (!source || source.width !== info.width || source.height !== info.height) throw new Error(`${name}: missing or mismatched hotspots`);
  const sizes = {};
  for (const width of [900, 600]) {
    const height = Math.round(crop.height * width / crop.width);
    await produce(path.join(OUT, 'controls', `${name}-${width}.webp`), [src], {width, crop, quality: 86, alphaQuality: 100}, file =>
      sharp(src).extract(crop).resize({width}).webp({quality: 86, alphaQuality: 100, effort: 5}).toFile(file));
    sizes[width] = [width, height];
  }
  controlViews[name] = {image: `${name}-900.webp`, width: 900, height: sizes[900][1], sizes, crop,
    sourceW: info.width, sourceH: info.height, hotspots: remapHotspots(source.hotspots, info.width, info.height, crop, 900)};
}
const controlData = {units: 'pixels in the 900px image; *_pct = percent of cropped width/height', views: controlViews};
fs.mkdirSync(path.join(OUT, 'controls'), {recursive: true});
for (const target of [path.join(OUT, 'controls/sim-hotspots.json'), path.join(DATA, 'sim-hotspots.json')]) {
  fs.writeFileSync(target, JSON.stringify(controlData, null, 1) + '\n');
  written.add(path.resolve(target));
}
log.push('control cards: 4 alpha crops at 900/600px, remapped hotspots');
for (const f of fs.existsSync(SIM) ? fs.readdirSync(SIM).filter(f => /\.png$/i.test(f)).sort() : []) {
  const name = f.slice(0, -4), e = await twoSizes(path.join(SIM, f), 'still', name, {quality: 84});
  if (e) stills[name] = e;
}
// the outside view for the Display's "Them": the render's display-on glow reads as a blob, so the page uses the
// display-off render with only a faint sheen where the display is (the difference between the two, spread wider and
// turned down), flattened on black like the section it sits in
const SHEEN = {on: path.join(SIM, 'sim-3q-display.png'), off: path.join(SIM, 'sim-3q.png'), spread: 34, gain: .75};
if (fs.existsSync(SHEEN.on) && fs.existsSync(SHEEN.off)) {
  const meta = await sharp(SHEEN.off).metadata(), entry = {w: meta.width, h: meta.height, alpha: false, sizes: {}};
  for (const w of WIDTHS) {
    const ow = Math.min(w, meta.width), oh = Math.round(meta.height * ow / meta.width);
    await produce(path.join(OUT, 'still', `sim-3q-sheen-${w}.webp`), [SHEEN.on, SHEEN.off], {w: ow, spread: SHEEN.spread, gain: SHEEN.gain}, async file => {
      const flat = f => sharp(f).resize({width: ow}).flatten({background: '#000'}).removeAlpha().raw().toBuffer();
      const [on, off] = await Promise.all([flat(SHEEN.on), flat(SHEEN.off)]);
      const diff = Buffer.alloc(on.length);
      for (let i = 0; i < on.length; i++) diff[i] = Math.max(0, on[i] - off[i]);
      const soft = await sharp(diff, {raw: {width: ow, height: oh, channels: 3}}).blur(SHEEN.spread * ow / 1600).raw().toBuffer();
      for (let i = 0; i < off.length; i++) off[i] = Math.min(255, off[i] + Math.round(soft[i] * SHEEN.gain));
      return sharp(off, {raw: {width: ow, height: oh, channels: 3}}).webp({quality: 84, effort: 5, smartSubsample: true}).toFile(file);
    });
    entry.sizes[w] = [ow, oh];
  }
  stills['sim-3q-sheen'] = entry;
}
// a render that went missing mid-render keeps its previous output
for (const [name, e] of Object.entries(previous.stills || {})) {
  if (stills[name] || name.startsWith('charge-') || !fs.existsSync(path.join(OUT, 'still', `${name}-1600.webp`))) continue;   // charge-*: below
  stills[name] = e;
  for (const w of WIDTHS) written.add(path.resolve(OUT, 'still', `${name}-${w}.webp`));
  log.push(`still ${name}: source missing, kept the previous output`);
}
log.push(`stills: ${Object.keys(stills).length}`);

/* ---------- the exploded view: backdrop, parts, and one layer per piece ---------- */
/** The render's backdrop as a smooth surface (a cubic fitted robustly to 10 px block medians, so parts drop out as
    outliers), and the render with that backdrop made transparent (alpha from the difference, colors un-mixed). */
async function separate(src, width) {
  const m0 = await sharp(src).metadata();
  const H = Math.round(width * m0.height / m0.width);
  const {data} = await sharp(src).removeAlpha().resize(width, H).raw().toBuffer({resolveWithObject: true});
  const B = 10, bw = Math.floor(width / B), bh = Math.floor(H / B), blocks = [];
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
    const ch = [[], [], []];
    for (let y = by * B; y < by * B + B; y++) for (let x = bx * B; x < bx * B + B; x++) { const i = (y * width + x) * 3; for (let c = 0; c < 3; c++) ch[c].push(data[i + c]); }
    ch.forEach(a => a.sort((p, q) => p - q));
    blocks.push({x: (bx + .5) / bw, y: (by + .5) / bh, v: ch.map(a => a[a.length >> 1]), spread: ch[1].at(-1) - ch[1][0]});
  }
  const terms = (x, y) => [1, x, y, x * x, y * y, x * y, x * x * y, x * y * y, x * x * x, y * y * y];
  const solve = (A, b) => {
    const n = A.length, M = A.map((r, i) => [...r, b[i]]);
    for (let i = 0; i < n; i++) {
      let p = i; for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
      [M[i], M[p]] = [M[p], M[i]];
      for (let k = i + 1; k < n; k++) { const f = M[k][i] / M[i][i]; for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j]; }
    }
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
    return x;
  };
  const T = terms(0, 0).length;
  let inlier = blocks.map(b => b.spread < 14), coef;
  for (let it = 0; it < 6; it++) {
    coef = [0, 1, 2].map(c => {
      const A = Array.from({length: T}, () => new Array(T).fill(0)), bb = new Array(T).fill(0);
      blocks.forEach((b, i) => { if (!inlier[i]) return; const t = terms(b.x, b.y); for (let p = 0; p < T; p++) { bb[p] += t[p] * b.v[c]; for (let q = 0; q < T; q++) A[p][q] += t[p] * t[q]; } });
      return solve(A, bb);
    });
    const res = blocks.map(b => b.v[1] - terms(b.x, b.y).reduce((s, v, k) => s + v * coef[1][k], 0));
    const r = res.filter((_, i) => inlier[i]).map(Math.abs).sort((a, b) => a - b), mad = r[r.length >> 1] || 1;
    inlier = blocks.map((b, i) => Math.abs(res[i]) < Math.max(2, 3 * mad) && b.spread < 20);
  }
  const plate = Buffer.alloc(width * H * 3), parts = Buffer.alloc(width * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < width; x++) {
    const t = terms(x / width, y / H), i = y * width + x;
    let d = 0;
    const bg = [0, 1, 2].map(c => { const v = Math.max(0, Math.min(255, t.reduce((s, tv, k) => s + tv * coef[c][k], 0))); d = Math.max(d, Math.abs(data[i * 3 + c] - v)); return v; });
    const a = Math.max(0, Math.min(1, (d - 2.5) / 9));
    for (let c = 0; c < 3; c++) {
      plate[i * 3 + c] = Math.round(bg[c]);
      parts[i * 4 + c] = a > 0 ? Math.max(0, Math.min(255, Math.round((data[i * 3 + c] - (1 - a) * bg[c]) / a))) : 0;
    }
    parts[i * 4 + 3] = Math.round(a * 255);
  }
  const mean = [0, 1, 2].map(c => { let s = 0; for (let i = c; i < plate.length; i += 3) s += plate[i]; return Math.round(s / (plate.length / 3)); });
  return {width, height: H, plate, parts, mean: '#' + mean.map(v => v.toString(16).padStart(2, '0')).join('')};
}

/** The Blender ID map for exploded.png (scripts/arden-exploded-map.py writes it into scripts/arden-map): which object
    each pixel shows, which layer each object moves with, and how far each layer travels on screen. Used only while the
    hash it recorded still matches the render; otherwise the parts are cut by connectivity and don't travel. */
const MAP_DIR = path.join(here, 'arden-map');
function exploderMap(src) {
  const map = readJson(path.join(MAP_DIR, 'exploded-map.json'));
  if (!map) return null;
  const sha = crypto.createHash('sha1').update(fs.readFileSync(src)).digest('hex');
  if (map.render?.sha1 !== sha) {
    log.push('exploded: the ID map is older than renders/exploded.png; re-run scripts/arden-exploded-map.py (parts will not travel until then)');
    return null;
  }
  if (!map.map.files.every(f => fs.existsSync(path.join(MAP_DIR, f)))) return null;
  return {...map, sig: map.map.files.map(f => stamp(path.join(MAP_DIR, f))).join('|') + '|' + stamp(path.join(MAP_DIR, 'exploded-map.json'))};
}

// how the layers stack in the page: what sits inside goes first, so with the view closed up the shells and the frame
// cover it; the lens layers lie over the frame, outermost last
const LAYER_ORDER = ['near-core', 'far-core', 'near-flex', 'far-flex', 'camera', 'projector', 'als', 'mic-bridge', 'accel', 'front-flex',
  'near-chassis', 'far-chassis', 'far-outer', 'lens-rxinsert', 'front', 'pads', 'lens-innercover', 'lens-waveguide', 'lens-carrier',
  'lens-ar', 'lens-hardcoat', 'near-skin', 'far-skin', 'button'];
// the objects each numbered callout points at (content.js PARTS[].id)
const CALLOUTS = {
  front: ['Frame_Front'], lens: ['LensStack_R_Waveguide'], projector: ['Projector_'], camera: ['Camera_Housing_L', 'Camera_Barrel_L'],
  flex: ['Flex_Front'], pads: ['NosePad_'], board: ['Board_Main_R', 'Can_R', 'Chip_R', 'Passive_R', 'Conn_B2B_R'], battery: ['Cell_L'], speaker: ['Speaker_L'],
  spreader: ['Spreader_Graphite_R'], temple: ['Hollow_Shell_L'],
};

/** Cut the parts image along the ID map: one transparent WebP per layer, with its travel; callout anchors on the parts
    they name, and a clear spot for each number badge. */
async function mapPieces(sep, dir, map) {
  const W = sep.width, H = sep.height, N = W * H;
  const read = async f => {
    const img = sharp(path.join(MAP_DIR, f)).ensureAlpha();
    return (map.map.width === W && map.map.height === H ? img : img.resize(W, H, {kernel: 'nearest'})).raw().toBuffer();
  };
  const [opaque, clear] = await Promise.all(map.map.files.map(read));
  const objects = new Map(map.objects.map(o => [o.id, o]));
  const names = [...LAYER_ORDER.filter(n => map.layers.some(l => l.name === n)), ...map.layers.map(l => l.name).filter(n => !LAYER_ORDER.includes(n))];
  const index = new Map(names.map((n, i) => [n, i]));
  // each pixel's object (opaque first: a clear lens layer doesn't claim what shows through it) and layer
  const obj = new Int32Array(N), lab = new Int16Array(N).fill(-1), queue = new Int32Array(N);
  let qn = 0;
  for (let i = 0; i < N; i++) {
    const m = opaque[i * 4 + 3] ? opaque : clear[i * 4 + 3] ? clear : null;
    if (!m) continue;
    const o = objects.get(m[i * 4] + 256 * m[i * 4 + 1]);
    if (!o) continue;
    obj[i] = o.id; lab[i] = index.get(o.layer); queue[qn++] = i;
  }
  // edge pixels the flat map misses (anti-aliasing, glow) take the nearest layer
  for (let q = 0; q < qn; q++) {
    const i = queue[q], x = i % W, l = lab[i];
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < N && lab[j] < 0) { lab[j] = l; queue[qn++] = j; }
  }
  const box = names.map(() => ({n: 0, sx: 0, sy: 0, x0: W, y0: H, x1: -1, y1: -1}));
  for (let i = 0; i < N; i++) {
    const a = sep.parts[i * 4 + 3];
    if (a < 6 || lab[i] < 0) continue;
    const g = box[lab[i]], x = i % W, y = (i / W) | 0;
    g.x0 = Math.min(g.x0, x); g.y0 = Math.min(g.y0, y); g.x1 = Math.max(g.x1, x); g.y1 = Math.max(g.y1, y);
    if (a > 40) { g.n++; g.sx += x; g.sy += y; }
  }
  const travel = new Map(map.layers.map(l => [l.name, l]));
  const layers = [];
  fs.mkdirSync(path.join(OUT, dir), {recursive: true});
  for (const [li, name] of names.entries()) {
    const g = box[li];
    if (!g.n) continue;
    const w = g.x1 - g.x0 + 1, h = g.y1 - g.y0 + 1, buf = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (g.y0 + y) * W + g.x0 + x;
      if (lab[i] === li) sep.parts.copy(buf, (y * w + x) * 4, i * 4, i * 4 + 4);
    }
    const file = `${String(layers.length + 1).padStart(2, '0')}-${name}`;
    const out = path.join(OUT, dir, `${file}.webp`);
    await sharp(buf, {raw: {width: w, height: h, channels: 4}}).webp({quality: 86, alphaQuality: 90, effort: 5}).toFile(out);
    written.add(path.resolve(out));
    const t = travel.get(name) || {dx: 0, dy: 0};
    layers.push({src: `${URL_BASE}/${dir}/${file}.webp`, kind: name, x: g.x0 / W, y: g.y0 / H, w: w / W, h: h / H,
      cx: g.sx / g.n / W, cy: g.sy / g.n / H, dx: t.dx, dy: t.dy, area: g.n});
  }

  // callouts: the visible pixel of the named parts nearest to their visible centre
  const anchors = {};
  const ids = Object.fromEntries(Object.entries(CALLOUTS).map(([k, pre]) => [k, new Set(map.objects.filter(o => pre.some(p => o.name.startsWith(p))).map(o => o.id))]));
  const acc = Object.fromEntries(Object.keys(CALLOUTS).map(k => [k, {n: 0, sx: 0, sy: 0, px: []}]));
  for (let i = 0; i < N; i++) {
    if (!obj[i]) continue;
    for (const k in ids) if (ids[k].has(obj[i])) { const a = acc[k], x = i % W, y = (i / W) | 0; a.n++; a.sx += x; a.sy += y; if (!(x % 2 || y % 2)) a.px.push(x, y); }
  }
  const occ = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 1 : sep.parts[((y | 0) * W + (x | 0)) * 4 + 3] / 255);
  const placed = [];
  const at = {};
  for (const [k, a] of Object.entries(acc)) {
    if (!a.n) continue;
    const mx = a.sx / a.n, my = a.sy / a.n;
    let best = [mx, my], bd = Infinity;
    for (let j = 0; j < a.px.length; j += 2) { const d = (a.px[j] - mx) ** 2 + (a.px[j + 1] - my) ** 2; if (d < bd) { bd = d; best = [a.px[j], a.px[j + 1]]; } }
    at[k] = best;
  }
  // a badge goes where the figure is empty, its leader crossing as little of the rest of the product as it can, clear of
  // the other badges, dots and leaders
  const R = W * .014, anchorsXY = Object.values(at), lines = [];
  const cross = (p, q, r, t) => { const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); return d(p, q, r) * d(p, q, t) < 0 && d(r, t, p) * d(r, t, q) < 0; };
  for (const [k, [ax, ay]] of Object.entries(at)) {
    const own = ids[k], other = (x, y) => { const i = (y | 0) * W + (x | 0); return own.has(obj[i]) ? 0 : occ(x, y); };
    let pick = null, score = Infinity;
    for (let a = 0; a < 24; a++) for (const dist of [W * .035, W * .05, W * .065, W * .08]) {
      const ang = a * Math.PI / 12, bx = ax + Math.cos(ang) * dist, by = ay + Math.sin(ang) * dist;
      if (bx < R * 2 || by < R * 2 || bx > W - R * 2 || by > H - R * 2) continue;
      let s = 0;
      for (let dy = -R; dy <= R; dy += R / 3) for (let dx = -R; dx <= R; dx += R / 3) s += occ(bx + dx, by + dy);
      for (let u = .1; u < 1; u += .03) s += other(ax + (bx - ax) * u, ay + (by - ay) * u) * 4;
      for (const [px, py] of placed) if (Math.hypot(px - bx, py - by) < R * 4) s += 400;
      for (const [px, py] of anchorsXY) if ((px !== ax || py !== ay) && Math.hypot(px - bx, py - by) < R * 2.5) s += 100;
      for (const [p, q] of lines) if (cross([ax, ay], [bx, by], p, q)) s += 300;
      s += dist / W * 40;
      if (s < score) { score = s; pick = [bx, by]; }
    }
    if (!pick) continue;
    placed.push(pick); lines.push([[ax, ay], pick]);
    anchors[k] = {at: [ax / W * 100, ay / H * 100], badge: [(pick[0] - ax) / W * 100, (pick[1] - ay) / H * 100]};
  }
  const round = v => (typeof v === 'number' ? Number(v.toFixed(5)) : Array.isArray(v) ? v.map(n => Number(n.toFixed(2))) : v);
  return {
    layers: layers.map(l => Object.fromEntries(Object.entries(l).map(([key, v]) => [key, round(v)]))),
    anchors: Object.fromEntries(Object.entries(anchors).map(([k, v]) => [k, {at: round(v.at), badge: round(v.badge)}])),
  };
}

/** Without a current ID map: the parts cut into connected pieces (on a 4× coarser grid, slightly dilated so a part's
    own fragments stay together; specks join the nearest piece), each its own transparent WebP. They don't travel. */
async function pieces(sep, dir) {
  const S = 4, W = Math.ceil(sep.width / S), H = Math.ceil(sep.height / S);
  const occ = new Uint8Array(W * H);
  for (let y = 0; y < sep.height; y++) for (let x = 0; x < sep.width; x++) if (sep.parts[(y * sep.width + x) * 4 + 3] > 40) occ[(y / S | 0) * W + (x / S | 0)] = 1;
  const dil = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!occ[y * W + x]) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < H && xx >= 0 && xx < W) dil[yy * W + xx] = 1; }
  }
  const label = new Int32Array(W * H).fill(-1), comps = [];
  for (let i = 0; i < W * H; i++) {
    if (!dil[i] || label[i] >= 0) continue;
    const id = comps.length, stack = [i], c = {id, n: 0, x0: W, y0: H, x1: 0, y1: 0};
    label[i] = id;
    while (stack.length) {
      const j = stack.pop(), x = j % W, y = (j / W) | 0;
      c.n++; c.x0 = Math.min(c.x0, x); c.y0 = Math.min(c.y0, y); c.x1 = Math.max(c.x1, x); c.y1 = Math.max(c.y1, y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const yy = y + dy, xx = x + dx;
        if (yy < 0 || yy >= H || xx < 0 || xx >= W) continue;
        const k = yy * W + xx;
        if (dil[k] && label[k] < 0) { label[k] = id; stack.push(k); }
      }
    }
    comps.push(c);
  }
  const big = comps.filter(c => c.n >= 40);
  const owner = comps.map(c => {
    if (c.n >= 40 || !big.length) return c.id;
    const cx = (c.x0 + c.x1) / 2, cy = (c.y0 + c.y1) / 2;
    let best = big[0], bd = Infinity;
    for (const b of big) { const dx = Math.max(b.x0 - cx, 0, cx - b.x1), dy = Math.max(b.y0 - cy, 0, cy - b.y1), d = dx * dx + dy * dy; if (d < bd) { bd = d; best = b; } }
    return best.id;
  });
  const groups = new Map();
  for (let i = 0; i < W * H; i++) {
    if (label[i] < 0) continue;
    const o = owner[label[i]], x = i % W, y = (i / W) | 0, g = groups.get(o) || {n: 0, sx: 0, sy: 0, x0: W, y0: H, x1: 0, y1: 0};
    if (occ[i]) { g.n++; g.sx += x; g.sy += y; }
    g.x0 = Math.min(g.x0, x); g.y0 = Math.min(g.y0, y); g.x1 = Math.max(g.x1, x); g.y1 = Math.max(g.y1, y);
    groups.set(o, g);
  }
  const layers = [];
  fs.mkdirSync(path.join(OUT, dir), {recursive: true});
  for (const [o, g] of [...groups].filter(([, g]) => g.n > 0).sort((a, b) => b[1].n - a[1].n)) {
    const left = Math.max(0, g.x0 * S - 2), top = Math.max(0, g.y0 * S - 2);
    const w = Math.min(sep.width, (g.x1 + 1) * S + 2) - left, h = Math.min(sep.height, (g.y1 + 1) * S + 2) - top;
    const buf = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const X = left + x, Y = top + y, l = label[(Y / S | 0) * W + (X / S | 0)];
      if (l < 0 || owner[l] !== o) continue;
      sep.parts.copy(buf, (y * w + x) * 4, (Y * sep.width + X) * 4, (Y * sep.width + X) * 4 + 4);
    }
    const name = String(layers.length + 1).padStart(2, '0');
    const out = path.join(OUT, dir, `${name}.webp`);
    await sharp(buf, {raw: {width: w, height: h, channels: 4}}).webp({quality: 86, alphaQuality: 90, effort: 5}).toFile(out);
    written.add(path.resolve(out));
    layers.push({src: `${URL_BASE}/${dir}/${name}.webp`, kind: 'piece', x: left / sep.width, y: top / sep.height, w: w / sep.width, h: h / sep.height,
      cx: (g.sx / g.n + .5) * S / sep.width, cy: (g.sy / g.n + .5) * S / sep.height, dx: 0, dy: 0, area: g.n});
  }
  return {layers: layers.map(l => Object.fromEntries(Object.entries(l).map(([key, v]) => [key, typeof v === 'number' ? Number(v.toFixed(5)) : v]))), anchors: null};
}

if (stills.exploded) {
  const src = path.join(SRC, 'exploded.png');
  const xp = stills.exploded;
  const map = exploderMap(src);
  const sig = JSON.stringify({src: stamp(src), map: map?.sig || null, v: 8});
  if (cache.exploded?.sig === sig && fs.existsSync(path.join(OUT, 'still/exploded-parts-1600.webp'))) {
    Object.assign(xp, cache.exploded.meta);
    keep(path.join(OUT, 'xp'));
    for (const w of WIDTHS) for (const n of ['parts', 'plate']) written.add(path.resolve(OUT, 'still', `exploded-${n}-${w}.webp`));
    reused++;
  } else {
    for (const w of WIDTHS) {
      const sep = await separate(src, w);
      for (const [n, buf, ch] of [['parts', sep.parts, 4], ['plate', sep.plate, 3]]) {
        const out = path.join(OUT, 'still', `exploded-${n}-${w}.webp`);
        await sharp(buf, {raw: {width: sep.width, height: sep.height, channels: ch}}).webp({quality: n === 'plate' ? 90 : 86, alphaQuality: 90, effort: 5}).toFile(out);
        written.add(path.resolve(out));
      }
      if (w === 1600) { xp.backdrop = sep.mean; Object.assign(xp, map ? await mapPieces(sep, 'xp', map) : await pieces(sep, 'xp')); }
    }
    xp.split = true;
    cache.exploded = {sig, meta: {backdrop: xp.backdrop, layers: xp.layers, anchors: xp.anchors, split: true}};
    encoded++;
  }
  log.push(`exploded: ${xp.layers?.length || 0} layers, ${xp.anchors ? Object.keys(xp.anchors).length + ' callouts placed from the model' : 'no travel, no callouts'}`);
}

/* ---------- the turntable ---------- */
/** A frame with a soft shadow on transparency: the shadow's faint alpha is render noise that lossless alpha can't
    compress, and lossy alpha bands. Smooth it (only below 200, so the glasses' edges stay crisp) and drop the last bit;
    the result is visually the same and about half the size. */
async function smoothAlpha(src, width, quality, file) {
  const img = sharp(src).resize({width});
  const {data, info} = await img.clone().ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const blurred = await sharp(data, {raw: info}).extractChannel(3).blur(2).raw().toBuffer();
  for (let i = 0, n = info.width * info.height; i < n; i++) if (data[i * 4 + 3] < 200) data[i * 4 + 3] = blurred[i] & ~1;
  return sharp(data, {raw: info}).webp({quality, alphaQuality: 100, effort: 6, smartSubsample: true}).toFile(file);
}
const frameFiles = dir => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^\d{4}\.png$/.test(f)).sort() : []);
const complete = (files, expected) => files.length >= expected && files.every((f, i) => Number(f.slice(0, 4)) === i + 1);
async function sequence(name, dir, frames, quality) {
  const outDir = path.join(OUT, 'seq', name);
  const files = frameFiles(path.join(SRC, dir));
  if (!complete(files, frames)) {
    log.push(`seq ${name}: ${files.length} of ${frames} frames, not complete yet`);
    if (previous.seq?.[name]) { keep(outDir); return previous.seq[name]; }
    return null;
  }
  const first = path.join(SRC, dir, files[0]);
  const meta = await sharp(first).metadata();
  const alpha = await hasAlpha(first);
  const entry = {count: frames, alpha, sizes: {}, base: `${URL_BASE}/seq/${name}`};
  for (const w of WIDTHS) {
    const ow = Math.min(w, meta.width), oh = Math.round(meta.height * ow / meta.width);
    entry.sizes[w] = [ow, oh];
    for (const [i, f] of files.slice(0, frames).entries()) {
      const src = path.join(SRC, dir, f);
      await produce(path.join(outDir, String(w), `${String(i + 1).padStart(2, '0')}.webp`), [src], {w: ow, alpha, quality, smooth: 2},
        file => (alpha ? smoothAlpha(src, ow, quality, file) : webp(sharp(src).resize({width: ow}), false, quality).toFile(file)));
    }
  }
  log.push(`seq ${name}: ${frames} frames${alpha ? ', with alpha' : ''}`);
  return entry;
}
const seq = {};
const tt = await sequence('turntable', 'turntable', 72, 78);
if (tt) seq.turntable = tt;

/* ---------- the films: the pinned opening and "Put them on", scrubbed by scroll ---------- */
/** One width per set, at the quality a frame in motion needs. The put-on frames keep their alpha (the page shows
    around the glasses). A set still rendering, or with a frame that can't be read yet, keeps its previous output. */
async function film(name, dir, frames, width, quality, orbit = null) {
  const outDir = path.join(OUT, 'film', name);
  const files = frameFiles(path.join(SRC, dir));
  const fallback = why => {
    log.push(`film ${name}: ${why}${previous.films?.[name] ? ', kept the previous output' : ''}`);
    if (previous.films?.[name]) { keep(outDir); return previous.films[name]; }
    return null;
  };
  if (!complete(files, frames)) return fallback(`${files.length} of ${frames} frames, not complete yet`);
  try {
    const first = path.join(SRC, dir, files[0]);
    const meta = await sharp(first).metadata(), alpha = await hasAlpha(first);
    const ow = orbit?.w ?? Math.min(width, meta.width), oh = orbit?.h ?? Math.round(meta.height * ow / meta.width);
    let bytes = 0;
    for (const [i, f] of files.slice(0, frames).entries()) {
      const src = path.join(SRC, dir, f), out = path.join(outDir, `${String(i + 1).padStart(3, '0')}.webp`);
      if (orbit) {
        const handoff = path.join(OUT, 'seq', `orbit-exploded${name.endsWith('-m') ? '-m' : ''}`, 'e12_a000.webp');
        await produce(out, i === frames - 1 ? [handoff] : [src], {w: ow, h: oh, quality, crop: orbit.crop, sourceW: orbit.sourceW, sourceH: orbit.sourceH, alphaQuality: 100}, async file => {
          // Reuse the exact encoded orbit frame at the handoff, including its render sampling.
          if (i === frames - 1) { fs.copyFileSync(handoff, file); return; }
          if (meta.width * orbit.sourceH !== meta.height * orbit.sourceW) throw new Error(`${name}: film and orbit camera aspect ratios differ`);
          // Film renders are larger than the orbit renders. Normalize to the crop's pixel space first.
          const normalized = await sharp(src).resize(orbit.sourceW, orbit.sourceH).png().toBuffer();
          return sharp(normalized).extract(orbit.crop).resize({width: ow, height: oh})
            .webp({quality, alphaQuality: 100, effort: 5, smartSubsample: true}).toFile(file);
        });
      } else {
        await produce(out, [src], {w: ow, alpha, quality}, file => sharp(src).resize({width: ow})
          .webp(alpha ? {quality, alphaQuality: 80, effort: 5, smartSubsample: true} : {quality, effort: 5, smartSubsample: true}).toFile(file));
      }
      bytes += fs.statSync(out).size;
    }
    log.push(`film ${name}: ${frames} frames at ${ow} px${alpha ? ', with alpha' : ''}, ${(bytes / 1048576).toFixed(1)} MB`);
    return {count: frames, w: ow, h: oh, alpha, base: `${URL_BASE}/film/${name}`, bytes,
      ...(orbit ? {crop: orbit.crop, sourceW: orbit.sourceW, sourceH: orbit.sourceH} : {})};
  } catch (err) {
    return fallback("a frame couldn't be read (" + err.message.split(/\r?\n/)[0] + ")");
  }
}
const films = {};
for (const [name, frames, width] of [['hero', 120, 1440], ['hero-m', 120, 900], ['puton', 60, 1440], ['puton-m', 60, 900]]) {
  const e = await film(name, `seq/${name}`, frames, width, 70);
  if (e) films[name] = e;
}
// Legacy spin (72 frames, with anchors in parts.json) and fold (48), with smaller phone encodes.
// The explode film is built after the orbit grids so it can share their framing.
for (const [name, frames] of [['exploded-spin', 72], ['fold', 48]]) {
  for (const [suffix, width] of [['', 1440], ['-m', 900]]) {
    const e = await film(name + suffix, `seq/${name}`, frames, width, 74);
    if (e) films[name + suffix] = e;
  }
}
const spinParts = readJson(path.join(SRC, 'seq', 'exploded-spin', 'parts.json')) || previous.spinParts || null;

/* One union crop per grid prevents scale/position changes between orientations. */
async function orbitCrop(dir, names) {
  let left = Infinity, top = Infinity, right = -1, bottom = -1, width, height;
  for (const name of names) {
    const {data, info} = await sharp(path.join(dir, `${name}.png`)).ensureAlpha().extractChannel('alpha').raw().toBuffer({resolveWithObject: true});
    if (width !== undefined && (width !== info.width || height !== info.height)) throw new Error(`${dir}: inconsistent frame dimensions`);
    ({width, height} = info);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (data[y * width + x] <= 8) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  if (right < left) throw new Error(`${dir}: orbit frames have no visible alpha`);
  // Add 4% of the union dimensions on every side, rounded outwards and bounded by the source.
  const padX = (right - left + 1) * .04, padY = (bottom - top + 1) * .04;
  right = Math.min(width, Math.ceil(right + 1 + padX)); bottom = Math.min(height, Math.ceil(bottom + 1 + padY));
  left = Math.max(0, Math.floor(left - padX)); top = Math.max(0, Math.floor(top - padY));
  return {sourceW: width, sourceH: height, crop: {left, top, width: right - left, height: bottom - top}};
}

/* Two-axis grids: preserve the render's alpha and filename, including negative elevations. */
const orbits = {};
const elevations = [-30, -15, 0, 12, 25, 40, 55, 70];
const azimuths = Array.from({length: 36}, (_, i) => i * 10);
for (const kind of ['exploded', 'assembled']) for (const mobile of [false, true]) {
  const name = `orbit-${kind}${mobile ? '-m' : ''}`;
  const dir = path.join(SRC, 'seq', name), outDir = path.join(OUT, 'seq', name);
  const names = elevations.flatMap(e => azimuths.map(a => `e${e}_a${String(a).padStart(3, '0')}`));
  if (!names.every(n => fs.existsSync(path.join(dir, `${n}.png`)))) {
    throw new Error(`${name}: expected all 288 orbit frames in ${dir}`);
  }
  const width = mobile ? 720 : 1200, quality = mobile ? 60 : 64;
  const framing = await orbitCrop(dir, names), {crop} = framing;
  let bytes = 0;
  for (const n of names) {
    const src = path.join(dir, `${n}.png`), out = path.join(outDir, `${n}.webp`);
    await produce(out, [src], {width, quality, alpha: true, alphaQuality: 100, crop}, file =>
      sharp(src).extract(crop).resize({width}).webp({quality, alphaQuality: 100, effort: 5, smartSubsample: true}).toFile(file));
    bytes += fs.statSync(out).size;
  }
  const meta = await sharp(path.join(outDir, `${names[0]}.webp`)).metadata();
  const parts = readJson(path.join(dir, 'parts.json'));
  if (parts) {
    remapPartAnchors(parts, framing);
    Object.assign(parts, {width: meta.width, height: meta.height, ...framing});
    const target = path.join(outDir, 'parts.json');
    fs.writeFileSync(target, JSON.stringify(parts));
    written.add(path.resolve(target));
    bytes += fs.statSync(target).size;
  }
  orbits[name] = {base: `${URL_BASE}/seq/${name}`, count: names.length, w: meta.width, h: meta.height, ...framing,
    elevations, azimuths, bytes, parts: parts ? `${URL_BASE}/seq/${name}/parts.json` : null};
  console.log(`${name}: 288 WebP frames, ${width}px, quality ${quality}, alpha kept; ${(bytes / 1024 / 1024).toFixed(2)} MiB total`);
}
// Use each cut's own camera and the exploded orbit's crop for the entire scroll sequence.
for (const suffix of ['', '-m']) {
  const orbit = orbits[`orbit-exploded${suffix}`];
  const e = await film(`explode${suffix}`, `seq/explode${suffix}`, 36, orbit.w, suffix ? 60 : 64, orbit);
  if (e) {
    const parts = readJson(path.join(SRC, 'seq', `explode${suffix}`, 'parts.json'));
    if (parts) {
      remapPartAnchors(parts, orbit);
      Object.assign(parts, {width: e.w, height: e.h});
      const target = path.join(OUT, 'film', `explode${suffix}`, 'parts.json');
      fs.writeFileSync(target, JSON.stringify(parts));
      written.add(path.resolve(target));
      e.parts = `${URL_BASE}/film/explode${suffix}/parts.json`;
    }
    films[`explode${suffix}`] = e;
  }
}
if (spinParts) log.push('exploded-spin: parts.json');

/* ---------- sun mode (renders/sun): the lenses at a few tints, seen from outside ---------- */
const SUN_DIR = path.join(SRC, 'sun');
const sun = {stills: []};
for (const f of fs.existsSync(SUN_DIR) ? fs.readdirSync(SUN_DIR).filter(f => /\.png$/i.test(f)).sort() : []) {
  const name = `sun-${f.slice(0, -4)}`, e = await twoSizes(path.join(SUN_DIR, f), 'still', name, {quality: 86, plate: true});
  if (e) { stills[name] = e; sun.stills.push(name); }
}
for (const name of previous.sun?.stills || []) if (!sun.stills.includes(name) && stills[name]) sun.stills.push(name);   // mid-render: keep what was there
if (sun.stills.length) log.push(`sun: ${sun.stills.length} stills`);

/* ---------- how it charges (renders/charge): its stills, the lowering sequence, its callouts ---------- */
// Whatever the folder holds: every PNG becomes still/charge-<name>, every folder of numbered frames a film
// (charge-<folder>, and -m for phones), charge.json is passed to the page as is. Until it exists the page uses stand-ins.
const CHARGE_DIR = path.join(SRC, 'charge');
const charge = {stills: [], films: [], data: null};
if (fs.existsSync(CHARGE_DIR)) {
  charge.data = readJson(path.join(CHARGE_DIR, 'charge.json')) || previous.charge?.data || null;
  for (const f of fs.readdirSync(CHARGE_DIR).filter(f => /\.png$/i.test(f)).sort()) {
    const name = `charge-${f.slice(0, -4)}`, e = await twoSizes(path.join(CHARGE_DIR, f), 'still', name, {quality: 86, plate: true});
    if (e) { stills[name] = e; charge.stills.push(name); }
  }
  // a still that is being re-rendered right now keeps its previous output
  for (const name of previous.charge?.stills || []) {
    if (charge.stills.includes(name) || !previous.stills?.[name] || !fs.existsSync(path.join(OUT, 'still', `${name}-1600.webp`))) continue;
    stills[name] = previous.stills[name]; charge.stills.push(name);
    for (const w of WIDTHS) written.add(path.resolve(OUT, 'still', `${name}-${w}.webp`));
    log.push(`still ${name}: source missing, kept the previous output`);
  }
  const dirs = new Set([...fs.readdirSync(CHARGE_DIR, {withFileTypes: true}).filter(e => e.isDirectory()).map(e => e.name), ...(previous.charge?.films || []).map(f => f.replace(/^charge-/, ''))]);
  for (const d of [...dirs].sort()) {
    // how many frames the sequence has: charge.json lists it as "<dir>/0001-0036.png"; a folder with fewer is still rendering
    const listed = (charge.data?.images || []).map(s => String(s).match(new RegExp(`^${d}/(\\d+)-(\\d+)\\.png$`))).find(Boolean);
    const n = Math.max(listed ? +listed[2] - +listed[1] + 1 : 0, fs.existsSync(path.join(CHARGE_DIR, d)) ? frameFiles(path.join(CHARGE_DIR, d)).length : 0);
    if (!n) continue;
    for (const [suffix, width] of [['', 1440], ['-m', 900]]) {
      const e = await film(`charge-${d}${suffix}`, `charge/${d}`, n, width, 74);
      if (e) { films[`charge-${d}${suffix}`] = e; if (!suffix) charge.films.push(`charge-${d}`); }
    }
  }
  log.push(`charge: ${charge.stills.length} stills, ${charge.films.length} sequences${charge.data ? ', charge.json' : ''}`);
}

/* ---------- the view through the frame ---------- */
const pov = {};
for (const n of ['pov-worn', 'pov-worn-m']) {
  const e = await twoSizes(path.join(SRC, 'pov', `${n}.png`), 'pov', n, {quality: 80});
  if (e) pov[n] = e;
  else if (previous.pov?.[n]) { pov[n] = previous.pov[n]; for (const w of WIDTHS) written.add(path.resolve(OUT, 'pov', `${n}-${w}.webp`)); }
}

/* ---------- photographs, the HUD, the app's own renders ---------- */
const photos = async (dir, srcDir, pattern, quality) => {
  const out = {};
  if (!fs.existsSync(srcDir)) return out;
  for (const f of fs.readdirSync(srcDir).filter(f => pattern.test(f)).sort()) {
    const name = f.replace(/\.[^.]+$/, '');
    const e = await twoSizes(path.join(srcDir, f), dir, name, {quality});
    if (e) out[name] = e;
  }
  return out;
};
// one try-on photo per finish, in the finishes' order (try-on-01..03 are an older set, superseded)
const lifestyle = Object.fromEntries(Object.entries(await photos('lifestyle', path.join(CASE, 'lifestyle'), /^try-on-(natural|black|desert)\.(png|jpe?g)$/i, 82))
  .sort(([a], [b]) => ['natural', 'black', 'desert'].indexOf(a.slice(7)) - ['natural', 'black', 'desert'].indexOf(b.slice(7))));
const scenes = await photos('scenes', path.join(CASE, 'app/public/scenes'), /\.(png|jpe?g)$/i, 80);
const appRenders = await photos('renders-app', path.join(SRC, 'app'), /\.png$/i, 86);
const hud = {};
const hudDir = path.join(CASE, 'hud');
if (fs.existsSync(hudDir)) {
  for (const f of fs.readdirSync(hudDir).filter(f => f.endsWith('.svg')).sort()) {
    const out = path.join(OUT, 'hud', f);
    await produce(out, [path.join(hudDir, f)], {copy: 1}, file => fs.promises.copyFile(path.join(hudDir, f), file));
    hud[f.slice(0, -4)] = `${URL_BASE}/hud/${f}`;
  }
}
log.push(`lifestyle ${Object.keys(lifestyle).length}, scenes ${Object.keys(scenes).length}, hud ${Object.keys(hud).length}, app renders ${Object.keys(appRenders).length}`);

/* ---------- the face ---------- */
const fontSrc = path.join(CASE, 'app/public/fonts');
let font = null;
for (const [from, to] of [['InterVariable-latin.woff2', 'InterVariable-latin.woff2'], ['Inter-LICENSE.txt', 'Inter-LICENSE.txt']]) {
  const src = path.join(fontSrc, from);
  if (!fs.existsSync(src)) { keep(path.join(OUT, 'fonts')); continue; }
  await produce(path.join(OUT, 'fonts', to), [src], {copy: 1}, file => fs.promises.copyFile(src, file));
  if (to.endsWith('.woff2')) font = `${URL_BASE}/fonts/${to}`;
}

/* ---------- the drawing's numbers ---------- */
const dims = readJson(path.join(SRC, 'dimensions.json'));
if (dims) fs.writeFileSync(path.join(DATA, 'dimensions.json'), JSON.stringify(dims, null, 1) + '\n');
else if (!fs.existsSync(path.join(DATA, 'dimensions.json'))) fs.writeFileSync(path.join(DATA, 'dimensions.json'), '{}\n');

/* ---------- manifest ---------- */
fs.writeFileSync(path.join(DATA, 'assets.json'), JSON.stringify({base: URL_BASE, widths: WIDTHS, stills, seq, films, orbits, pov, charge, sun, spinParts, lifestyle, scenes, hud, appRenders, font}, null, 1) + '\n');

/* ---------- remove what this run no longer produces (only in the folders this script owns) ---------- */
let removed = 0;
const sweep = dir => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { sweep(full); if (!fs.readdirSync(full).length) fs.rmdirSync(full); }
    else if (!written.has(path.resolve(full))) { fs.unlinkSync(full); removed++; }
  }
};
for (const d of ['still', 'controls', 'xp', 'seq', 'film', 'pov', 'lifestyle', 'scenes', 'renders-app', 'hud', 'fonts']) sweep(path.join(OUT, d));
for (const key of Object.keys(cache)) if (key !== 'exploded' && !written.has(path.resolve(OUT, key))) delete cache[key];
fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
const total = dir => fs.readdirSync(dir, {withFileTypes: true}).reduce((s, e) => s + (e.isDirectory() ? total(path.join(dir, e.name)) : fs.statSync(path.join(dir, e.name)).size), 0);
console.log(`Arden assets (${encoded} encoded, ${reused} unchanged, ${removed} removed; ${(total(OUT) / 1048576).toFixed(1)} MB in ${path.relative(app, OUT)}):\n  ${log.join('\n  ')}`);
