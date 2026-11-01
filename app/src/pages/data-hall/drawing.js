// The drawings, each drawn twice on two canvases: once in ink, and once as a time map whose grey level says when
// each stroke is drawn (black first, white last, graded along every line). The shader shows the ink where the time
// map is below the drawing's progress, so a sheet draws itself line by line. A label is revealed whole: the time map
// gets a solid pad under it, so its letters never show as outlines. The hall's plan comes from plan.js; the die's
// plan is drawn on the same geometry and the same sheet, so at the match cut only the labels and line weights change.
//
// Everything is measured in sheet metres. A metre of sheet is about 26 px on screen in the opening view and about
// 12.6 px at the match cut, so the plan's room names are 0.68 m or more, its other words 0.42 m or more, and the
// die's words that carry the idea 1.3 or so.
import {SHEET_SIZE, ROOMS, BOUNDS, ROWS, RACKS, RACK, HOT_AISLES, COLD_AISLES, CDUS, FANWALLS, SWITCHBOARDS, UPS, BATTERIES, MDA, GRID_X, GRID_Z, COLUMNS, WALL, WALLS, DOORS, CENTER, CUT, ROW_X0, ROW_X1, PODS, PER_ROW, WALK_AISLE, FACTS} from './plan';

export const SHEET = {size: SHEET_SIZE, x0: CENTER.x - SHEET_SIZE / 2, z0: CENTER.z - SHEET_SIZE / 2};
const INK = '#111114', MUTED = '#5b5d64', LIGHT = '#a4a6ad', TONE = '#d8d9dd';
// lettering: the site's sans for names, headings and notes; its mono for figures and tags (dimensions, grid and door
// tags, equipment numbers). Chinese falls through to the system's sans
const SANS = "'TikTok Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif", MONO = "Mono, 'PingFang SC', 'Microsoft YaHei', monospace";
// both faces are the site's own (v16.css). A canvas draws with whatever is loaded at that moment, so the scene
// should await this before it calls drawPlan() or drawDie()
// the weights the sheets set text in
const FACE_WEIGHTS = [500, 600, 700];
const FACES = ["400 40px 'TikTok Sans'", "600 40px 'TikTok Sans'", "700 40px 'TikTok Sans'", '500 40px Mono', '700 40px Mono'];
export const fontsReady = typeof document !== 'undefined' && document.fonts
  ? Promise.all(FACES.map(f => document.fonts.load(f))).then(() => true, () => false)
  : Promise.resolve(false);
const fontsLoaded = () => typeof document === 'undefined' || !document.fonts || FACES.every(f => document.fonts.check(f));
// pens, in sheet metres: heavy for what is cut, medium for equipment, thin and hair for grid, hatching and swings
const PEN = {heavy: 0.075, med: 0.045, thin: 0.028, hair: 0.02};
const GRID_DASH = [1.4, 0.2, 0.2, 0.2];
// the walls as hall.js builds them, and the building's outer faces
const EXT_T = 0.4, INT_T = WALL.t;
const OUT = {x0: BOUNDS.x0 - EXT_T / 2, x1: BOUNDS.x1 + EXT_T / 2, z0: BOUNDS.z0 - EXT_T / 2, z1: BOUNDS.z1 + EXT_T / 2};
const lerp = (a, b, k) => a + (b - a) * k;
const at = ([t0, t1], k) => t0 + (t1 - t0) * k;
const PI = Math.PI, UP = -PI / 2;
// on a phone (small) no lettering is smaller than this, in sheet metres: about 9 px, 7 px of letter, at rest
const FLOOR = 0.72;
// text measured once per run, at 100 px (see metrics() in the painter)
const METRICS = new Map();

// a pen that draws on both canvases at once, in sheet coordinates
function painter(px, {anchor: edge = 'west', defer = false} = {}) {
  if (!fontsLoaded()) console.warn('drawing: the sheet fonts are not loaded yet; await fontsReady before drawing');
  const s = px / SHEET.size;
  // canvas work, done at once, or (defer) queued and done by drain() in short slices, in the same order: the drawing
  // decides what goes where, and the strokes and letters follow a few milliseconds at a time
  const queue = [];
  let next = 0;
  const exec = fn => (defer ? queue.push(fn) : fn());
  const drain = deadline => {
    do {if (next < queue.length) queue[next++]();} while (next < queue.length && performance.now() < deadline);
    if (next >= queue.length) {queue.length = 0; next = 0; return true;}
    return false;
  };
  const undefer = () => {defer = false; drain(Infinity);};
  const make = () => {const c = document.createElement('canvas'); c.width = c.height = px; return c;};
  // a third picture, frame: only what both sheets draw identically (shared() marks it), in ink like the first, so
  // the swap can hold these lines still while the rest of each sheet fades
  const ink = make(), time = make(), frm = make();
  const a = ink.getContext('2d'), b = time.getContext('2d'), f = frm.getContext('2d');
  // the time map starts white: drawn last everywhere
  exec(() => {b.fillStyle = '#fff'; b.fillRect(0, 0, px, px);});
  let sharing = 0;
  const shared = fn => {sharing++; try {fn();} finally {sharing--;}};
  // a fourth picture, labels: where each of this sheet's own labels lies (alpha 1 over its padded box) and where it
  // is anchored (red = an x of the label, as a fraction of the sheet's width), so a wipe can switch every label whole.
  // pairLabels() below sets the anchors once both sheets are drawn: labels of the two sheets that overlap switch
  // together at one x, the rest at their own centres. Until then a die label is anchored at its west edge and a hall
  // label at its east edge (the wipe runs west to east, die to hall), so the two never show over each other.
  // group() makes one label of everything drawn inside it (a room tag, a legend entry with its symbol, a note, a
  // title-block field); zone() adds a symbol's area to the label. Shared lettering is left out
  const lbl = make(), l = lbl.getContext('2d'), labelGroups = [];
  // a label's boxes go down as one path, filled once: overlapping fills would round its anchor in 8 bits each time
  const paint = (polys, v) => {
    l.fillStyle = `rgb(${v},0,0)`; l.beginPath();
    for (const poly of polys) {poly.forEach(([x, y], i) => (i ? l.lineTo(x, y) : l.moveTo(x, y))); l.closePath();}
    l.fill('nonzero');
  };
  let grp = null;
  const group = fn => {
    if (grp) return fn();
    grp = [];
    try {fn();} finally {
      const polys = grp; grp = null;
      if (polys.length) {
        const xs = polys.flat().map(p => p[0]), ys = polys.flat().map(p => p[1]), east = edge === 'east';
        // its box, in sheet fractions
        labelGroups.push({polys, x0: Math.min(...xs) / px, x1: Math.max(...xs) / px, y0: Math.min(...ys) / px, y1: Math.max(...ys) / px});
        const anchor = Math.min(1, Math.max(0, (east ? Math.max(...xs) : Math.min(...xs)) / px));
        const v = Math.min(255, Math.max(0, east ? Math.ceil(anchor * 255) : Math.floor(anchor * 255)));
        exec(() => paint(polys, v));
      }
    }
  };
  // paint the label map again, each label at the anchor (a sheet fraction) given for it
  const relabel = anchorOf => {
    l.clearRect(0, 0, px, px);
    labelGroups.forEach((g, i) => paint(g.polys, Math.min(255, Math.max(0, Math.round(anchorOf(g, i) * 255)))));
  };
  const record = poly => {if (!sharing) (grp ? grp.push(poly) : group(() => grp.push(poly)));};
  const zone = (x0, z0, x1, z1) => record([[X(x0), Y(z0)], [X(x1), Y(z0)], [X(x1), Y(z1)], [X(x0), Y(z1)]]);
  // the ink contexts a stroke goes to: the ink, and the frame too inside shared()
  const inks = () => (sharing ? [a, f] : [a]);
  const X = x => (x - SHEET.x0) * s, Y = z => (z - SHEET.z0) * s;
  const grey = t => {const v = Math.round(Math.min(1, Math.max(0, t)) * 255); return `rgb(${v},${v},${v})`;};
  const width = w => Math.max(1, w * s);
  // the texture's mipmaps average a thin stroke's time with the paper round it (1, last), which would hold back the
  // texels it only partly covers and draw it in fragments. So each stroke also lays a halo of its own time round
  // itself, taken with min: it never delays anything drawn before, and the averages stay near the stroke's time
  const HALO = Math.max(4, 0.06 * s);
  const ramp = (x0, z0, x1, z1, t0, t1) => {
    const g = b.createLinearGradient(X(x0), Y(z0), X(x1) + 1e-3, Y(z1) + 1e-3);
    g.addColorStop(0, grey(t0)); g.addColorStop(1, grey(t1));
    return g;
  };
  // the time map is always solid and a little wider than the ink, so a dashed line still draws along its length
  const line = (x0, z0, x1, z1, t0, t1 = t0, {w = PEN.med, color = INK, dash = null, cap = 'butt', halo = true} = {}) => {
    const cs = inks();
    exec(() => {
      for (const c of cs) {
        c.strokeStyle = color; c.lineWidth = width(w); c.lineCap = cap; c.setLineDash(dash ? dash.map(d => d * s) : []);
        c.beginPath(); c.moveTo(X(x0), Y(z0)); c.lineTo(X(x1), Y(z1)); c.stroke();
      }
      b.strokeStyle = ramp(x0, z0, x1, z1, t0, t1); b.lineCap = cap;
      b.beginPath(); b.moveTo(X(x0), Y(z0)); b.lineTo(X(x1), Y(z1));
      if (halo) {b.globalCompositeOperation = 'darken'; b.lineWidth = width(w) + 2 * HALO; b.stroke(); b.globalCompositeOperation = 'source-over';}
      b.lineWidth = width(w) + 2; b.stroke();
    });
  };
  // a polyline drawn in one go, its time spread by length
  const path = (pts, t0, t1, opts) => {
    let L = 0; const lens = [];
    for (let i = 1; i < pts.length; i++) {const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(l); L += l;}
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const u0 = acc / L; acc += lens[i - 1]; const u1 = acc / L;
      line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], t0 + (t1 - t0) * u0, t0 + (t1 - t0) * u1, opts);
    }
  };
  const rect = (x0, z0, x1, z1, t0, t1, opts = {}) => path([[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]], t0, t1, {cap: 'square', ...opts});
  // a filled shape, its time graded from one point to another. A solid one (a cut wall, a column) is stamped into
  // the time map again by settle(), after everything drawn over its edge, so it never shows a gap while it draws
  const solids = [];
  const timeFill = (pts, g) => {
    b.beginPath(); pts.forEach(([x, z], i) => (i ? b.lineTo(X(x), Y(z)) : b.moveTo(X(x), Y(z)))); b.closePath();
    b.fillStyle = b.strokeStyle = g;
    b.globalCompositeOperation = 'darken'; b.lineWidth = 2 * HALO; b.stroke(); b.globalCompositeOperation = 'source-over';
    b.lineWidth = 2; b.fill(); b.stroke();
  };
  const poly = (pts, t0, t1 = t0, {color = INK, from = pts[0], to = pts[pts.length >> 1], solid = false} = {}) => {
    const cs = inks(), g = () => ramp(from[0], from[1], to[0], to[1], t0, t1);
    exec(() => {
      for (const c of cs) {
        c.beginPath(); pts.forEach(([x, z], i) => (i ? c.lineTo(X(x), Y(z)) : c.moveTo(X(x), Y(z)))); c.closePath();
        c.fillStyle = color; c.fill();
      }
      timeFill(pts, g());
    });
    if (solid) solids.push(() => timeFill(pts, g()));
  };
  const settle = () => solids.forEach(f => exec(f));
  const fill = (x0, z0, x1, z1, t0, t1 = t0, color = INK, opts = {}) => {
    const along = x1 - x0 >= z1 - z0, zm = (z0 + z1) / 2, xm = (x0 + x1) / 2;
    poly([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], t0, t1, {color, from: along ? [x0, zm] : [xm, z0], to: along ? [x1, zm] : [xm, z1], ...opts});
  };
  const curve = (x, z, r, q0, q1, n) => Array.from({length: n + 1}, (_, i) => {const q = q0 + (q1 - q0) * i / n; return [x + Math.cos(q) * r, z + Math.sin(q) * r];});
  const circle = (x, z, r, t0, t1, opts = {}) => path(curve(x, z, r, UP, UP + 2 * PI, 48), t0, t1, opts);
  const arc = (x, z, r, q0, q1, t0, t1, opts) => path(curve(x, z, r, q0, q1, 20), t0, t1, opts);
  // 45° hatching, swept across the area from t0 to t1
  const hatch = (x0, z0, x1, z1, step, t0, t1, opts) => {
    const h = z1 - z0, xs = [];
    for (let x = x0 - h + ((x1 - x0 + h) % step) / 2; x < x1; x += step) xs.push(x);
    xs.forEach((x, i) => {
      const ax = Math.max(x0, x), az = z1 - (ax - x), bx = Math.min(x1, x + h), bz = z1 - (bx - x), t = lerp(t0, t1, i / Math.max(1, xs.length - 1));
      if (bx > ax + 1e-3) line(ax, az, bx, bz, t, t + 0.006, opts);
    });
  };

  // words. A line can mix runs (an English name and a Chinese one on one baseline). Each line knocks out the linework
  // under it (mask) and lays one grey in the time map over its box, so the whole line appears at once
  const style = p => ({size: 0.42, weight: 500, font: SANS, color: INK, track: 0.04, gap: 0.28, ...p});
  const setFont = (c, p) => {c.font = `${p.weight} ${(p.size * s).toFixed(2)}px ${p.font}`; c.letterSpacing = `${(p.track * p.size * s).toFixed(2)}px`;};
  // a run's width (without the letter space after its last letter), ascent and descent in canvas px. Text measures in
  // proportion to its size, so each run is measured once, at 100 px, and scaled: fitting a label tries many sizes
  const metrics = p => {
    const key = `${p.weight}|${p.font}|${p.track}|${p.str}`;
    let m = METRICS.get(key);
    if (!m) {
      a.font = `${p.weight} 100px ${p.font}`; a.letterSpacing = `${p.track * 100}px`;
      const t = a.measureText(p.str);
      m = {w: t.width - p.track * 100, asc: t.actualBoundingBoxAscent, desc: t.actualBoundingBoxDescent};
      METRICS.set(key, m);
    }
    const k = p.size * s / 100;
    return {w: m.w * k, asc: m.asc * k, desc: m.desc * k};
  };
  const measure = parts => {
    let w = 0, asc = 0, desc = 0;
    const runs = parts.filter(q => q.str).map((q, i) => {
      const p = style(q), m = metrics(p), x = i ? w + p.gap * s : 0;
      w = x + Math.max(0, m.w);
      asc = Math.max(asc, m.asc); desc = Math.max(desc, m.desc);
      return {...p, x};
    });
    return {runs, w, asc, desc};
  };
  const layout = (lines, lead = 0.16) => {
    const L = lines.map(l => measure(typeof l === 'string' ? [{str: l}] : l));
    const H = L.reduce((h, l) => h + l.asc + l.desc, 0) + lead * s * (L.length - 1);
    return {L, w: Math.max(...L.map(l => l.w)) / s, h: H / s, lead};
  };
  const block = (lines, x, z, t, {align = 'center', rotate = 0, mask = true, pad = 0.1, lpad = pad, lead = 0.16, valign = 'middle'} = {}) => {
    const B = layout(lines, lead), P = pad * s, cos = Math.cos(rotate), sin = Math.sin(rotate), M = lpad * s + Math.max(3, 0.06 * s);
    let y = valign === 'baseline' ? -B.L[0].asc : -B.h * s / 2;
    group(() => { for (const l of B.L) {
      const ox = align === 'left' ? 0 : align === 'right' ? -l.w : -l.w / 2, y0 = y, cs = [...inks(), b];
      const box = (c, m) => c.fillRect(ox - m, y0 - m, l.w + 2 * m, l.asc + l.desc + 2 * m);
      // the line's box, padded, on the label map
      record([[ox - M, y - M], [ox + l.w + M, y - M], [ox + l.w + M, y + l.asc + l.desc + M], [ox - M, y + l.asc + l.desc + M]]
        .map(([u, v]) => [X(x) + u * cos - v * sin, Y(z) + u * sin + v * cos]));
      exec(() => { for (const c of cs) {
        c.save(); c.translate(X(x), Y(z)); c.rotate(rotate);
        if (c !== b && mask) {c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; box(c, P);}
        if (c === b) {
          // the line's pad, and a halo round it (with min) so its edges stay whole in the mipmaps
          c.fillStyle = grey(t);
          c.globalCompositeOperation = 'darken'; box(c, P + HALO);
          if (mask) {c.globalCompositeOperation = 'source-over'; box(c, P);}
        }
        c.globalCompositeOperation = 'source-over';
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        for (const p of l.runs) {setFont(c, p); c.fillStyle = c === b ? grey(t) : p.color; c.fillText(p.str, ox + p.x, y0 + l.asc);}
        c.restore();
      } });
      y += l.asc + l.desc + B.lead * s;
    } });
    return B;
  };
  const text = (str, x, z, t, opts = {}) => block([[{str, ...opts}]], x, z, t, opts);
  const wrap = (str, w, q) => {
    const p = style(q);
    const out = []; let cur = '';
    for (const word of str.split(' ')) {
      const next = cur ? cur + ' ' + word : word;
      if (cur && metrics({...p, str: next}).w > w * s) {out.push(cur); cur = word;} else cur = next;
    }
    if (cur) out.push(cur);
    return out;
  };
  // the largest scale, from hi down to lo in steps of 0.05, at which one of the options (each k => lines, tried in
  // order) fits w × h; null if none does. A label only grows with k, so each option's largest fitting step is found
  // by halving the range
  const fit = (options, w, h, hi = 1, lo = hi, lead = 0.16) => {
    const steps = Math.max(0, Math.round((hi - lo) / 0.05)), kAt = i => Math.round((hi - i * 0.05) * 100) / 100;
    const fits = (o, i) => {const L = o(kAt(i)), B = layout(L, lead); return B.w <= w && B.h <= h ? {lines: L, k: kAt(i), B} : null;};
    let best = null, bestI = Infinity;
    for (const o of options) {
      let a0 = 0, a1 = steps, found = null, at = Infinity;
      if (!fits(o, a1)) continue;
      while (a0 < a1) {const m = (a0 + a1) >> 1, r = fits(o, m); if (r) a1 = m; else a0 = m + 1;}
      found = fits(o, a0); at = a0;
      if (at < bestI) {best = found; bestI = at;}
      if (bestI === 0) break;
    }
    return best;
  };
  // the first text in a face and weight costs the browser a font lookup (tens of ms on a slow phone, more for the
  // Chinese fallback): warm() pays it for one face at a time, so a step that sets text doesn't pay for all of them
  const warm = (weight, font) => {a.font = `${weight} 100px ${font}`; a.measureText('一号 A1');};
  return {ink, time, frame: frm, labels: lbl, labelGroups, relabel, drain, undefer, warm, shared, group, zone, s, line, path, rect, poly, fill, settle, circle, arc, hatch, block, layout, text, wrap, fit};
}

// ---------------------------------------------------------------------------------------------------------------
// The sheet round both drawings, line for line the same: border, a notes column right of the building and a view
// title under it. On a desktop the column ends in a title strip (the vertical title block of a drawing set), inside
// the opening view, which is also the last frame; on a phone, where the column is off screen, a compact title block
// runs under the drawing instead. Either way a sheet shows its number once.
const IB = {x0: SHEET.x0 + 0.8, x1: SHEET.x0 + SHEET.size - 0.8, z0: SHEET.z0 + 0.8, z1: SHEET.z0 + SHEET.size - 0.8};
// the notes column, ruled off from the drawing at x = COL.rule (12.8): everything that belongs to the building and
// its annotation lies west of the rule, so a narrow screen can crop there. Its parts stand at fixed heights, so the
// heading rules and the grids are the same on both sheets
const COL = {rule: OUT.x1 + 1.6, x0: OUT.x1 + 2.4, x1: IB.x1 - 0.2, orient: OUT.z0 + 1.5, legend: OUT.z0 + 3.85, step: 0.6, line: 0.5, gap: 0.1};
COL.notes = COL.legend + 1.1 + 5 * COL.step + 0.85;
// the title strip, ending 0.4 m above the opening view's lower edge (z 12.84), and the revisions over it
const STRIP = {x0: COL.rule, x1: IB.x1, z1: 12.45, rows: [1.1, 1.45, 0.95, 0.95]};
STRIP.z0 = STRIP.z1 - STRIP.rows.reduce((a, b) => a + b, 0);
const REV = {x0: COL.x0, x1: IB.x1, z1: STRIP.z0 - 0.3, row: 0.57, rows: 4};
// the view's title, under the drawing; the end of its rule is the same on both sheets
const VIEW = {z: OUT.z1 + 3.3};
const VIEW_RULE = 3.0;
// revision numbers and dates, the same on both sheets (each sheet has its own descriptions)
const REV_NOS = [['01', '2026-10'], ['02', '2026-10'], ['03', '2026-10'], ['04', '2026-10']];
const PROJECT = 'Data Hall';

// Everything inside shared() is drawn identically on both sheets and also goes into the pen's frame picture: the
// borders, the column rule, the heading rules, the revisions grid with its numbers and dates, the view bubble and its
// rule, the title block's lines and its fixed words. The rest (orientation, legend, notes, titles) is each sheet's own
function* frameSteps(pen, f) {
  const {line, rect, circle, text, block, layout, wrap, shared, group, zone, fit} = pen;
  const st = k => at(f.sheet, k);
  // on a phone the view's title and the compact title block are on screen, so their words grow to fit
  const sm = !!f.small, runs = (rs, k) => rs.map(r => ({...r, size: r.size * k, gap: (r.gap ?? 0.28) * k}));
  shared(() => {
    rect(SHEET.x0 + 0.55, SHEET.z0 + 0.55, SHEET.x0 + SHEET.size - 0.55, SHEET.z0 + SHEET.size - 0.55, f.border[0], f.border[1], {w: PEN.thin});
    rect(IB.x0, IB.z0, IB.x1, IB.z1, at(f.border, 0.2), f.border[1], {w: 0.12});
    line(COL.rule, IB.z0, COL.rule, sm ? IB.z1 : STRIP.z1, at(f.border, 0.5), f.border[1], {w: PEN.med});
  });

  yield ['frame: border', pen];
  // orientation (a north arrow, or the package the die sits in) and scale
  // (one label on the label map: the north arrow and scale, or the key plan, change as a whole)
  group(() => {zone(COL.x0 - 0.15, COL.orient - 1.25, COL.x1, COL.orient + 1.95); f.orient(st(0), st(0.1));});

  yield ['frame: orientation', pen];
  // legend and notes, under headings; the legend's heading is the same on both sheets, the notes' is not
  const head = (str, zh, z, t, same) => {
    const words = () => block([[{str, size: 0.5, weight: 700, track: 0.08}, {str: zh, size: 0.46, color: MUTED, gap: 0.3}]], COL.x0, z, t, {align: 'left', mask: false});
    if (same) shared(words); else words();
    shared(() => line(COL.x0, z + 0.48, COL.x1, z + 0.48, t, t + 0.01, {w: PEN.thin}));
  };
  const small = {track: 0.01, align: 'left', mask: false};
  head('LEGEND', '图例', COL.legend, st(0.1), true);
  for (const [i, [sym, str]] of f.legend.entries()) {
    const z = COL.legend + 1.1 + i * COL.step, t = st(0.12 + i * 0.012);
    group(() => {zone(COL.x0 - 0.15, z - 0.3, COL.x0 + 1.05, z + 0.3); sym(COL.x0 + 0.45, z, t); text(str, COL.x0 + 1.15, z, t, small);});
    if (i % 2) yield ['frame: legend', pen];
  }
  yield ['frame: legend', pen];
  head(f.notesHead, '说明', COL.notes, st(0.22), false);
  let z = COL.notes + 1.0, k = 0;
  for (const [i, n] of f.notes.entries()) {
    if (i % 2) yield ['frame: notes', pen];
    const lines = wrap(n, COL.x1 - COL.x0 - 0.7, {track: 0.01});
    // one note, all its lines, is one label
    group(() => {
      text(String(i + 1), COL.x0, z, st(0.24 + k * 0.012), {...small, font: MONO, weight: 700, valign: 'baseline', lpad: -0.03});
      for (const l of lines) {text(l, COL.x0 + 0.5, z, st(0.24 + k++ * 0.012), {...small, valign: 'baseline', lpad: -0.03}); z += COL.line;}
    });
    z += COL.gap;
  }
  yield ['frame: notes', pen];
  const rz0 = REV.z1 - REV.row * (REV.rows + 1);
  if (z - COL.line - COL.gap + 0.12 > rz0 - 0.3) console.warn('drawing: the notes run into the revisions table', z, rz0);

  // revisions: the grid, numbers and dates shared, the descriptions this sheet's own
  const rc = [REV.x0, REV.x0 + 1.1, REV.x0 + 3.1, REV.x1], tr = st(0.6);
  const cell = (str, r, c) => text(str, rc[c] + 0.12, rz0 + (r + 1) * REV.row - 0.19, tr + 0.03 + r * 0.01, {font: r && c < 2 ? MONO : SANS, size: 0.4, track: r ? 0 : 0.04, align: 'left', valign: 'baseline', mask: false, lpad: -0.055, color: r ? INK : MUTED, weight: r ? 500 : 600});
  shared(() => {
    rect(REV.x0, rz0, REV.x1, REV.z1, tr, tr + 0.03, {w: PEN.thin});
    for (let r = 1; r <= REV.rows; r++) line(REV.x0, rz0 + r * REV.row, REV.x1, rz0 + r * REV.row, tr + 0.01, tr + 0.02, {w: r === 1 ? PEN.med : PEN.hair});
    for (const x of rc.slice(1, -1)) line(x, rz0, x, REV.z1, tr + 0.01, tr + 0.02, {w: PEN.hair});
    ['REV', 'DATE', 'DESCRIPTION'].forEach((str, c) => cell(str, 0, c));
    REV_NOS.forEach((row, r) => row.forEach((str, c) => cell(str, r + 1, c)));
  });
  // the descriptions change as one column
  group(() => f.revs.forEach((str, r) => cell(str, r + 1, 2)));

  yield ['frame: revisions', pen];
  // the view's title under the drawing: a reference bubble with the view's number, the name on a rule and the
  // scale under it. On a phone the compact title block runs under the drawing, so the view's title sits above it
  const TBK = {x0: OUT.x0, x1: COL.rule - 0.4, z0: IB.z1 - 3.3, z1: IB.z1};
  // (a sheet can give it a time of its own: viewAt)
  const vx = BOUNDS.x0 + 0.6, vz = sm ? TBK.z0 - 1.45 : VIEW.z, tv = f.viewAt ?? st(0.68);
  shared(() => {
    circle(vx, vz, 0.8, tv, tv + 0.02, {w: PEN.med});
    text('1', vx, vz, tv + 0.02, {size: sm ? FLOOR : 0.62, font: MONO, weight: 700, mask: false, pad: 0.03});
    line(vx + 0.8, vz, VIEW_RULE, vz, tv + 0.02, tv + 0.05, {w: PEN.heavy});
  });
  // the view's name and its subtitle change together
  group(() => {
    const view = k => [[{str: f.view, size: 0.85 * k, weight: 700, track: 0.05}]], vk = sm ? (fit([view], VIEW_RULE - vx - 1.4, 9, 1.4, 1) || {k: 1}).k : 1;
    block(view(vk), vx + 1.1, vz - 0.22, tv + 0.03, {align: 'left', valign: 'baseline', mask: false, lpad: 0.02});
    const sk = sm ? Math.max(vk, FLOOR / Math.min(...f.viewSub.map(r => r.size))) : 1;
    block([runs(f.viewSub, sk)], vx + 1.1, vz + 0.78 + (vk - 1) * 0.45 + (sk - 1) * 0.3, tv + 0.04, {align: 'left', valign: 'baseline', mask: false, lpad: 0.02});
  });

  yield ['frame: view', pen];
  // the title block: its lines and field names shared, with the project, the drawer, the date and the revision
  const tt = st(0.74), field = {color: MUTED, track: 0.08, align: 'left', valign: 'baseline', mask: false};
  const value = (v, x, z, t, same, size = 0.42) => {const w = () => text(v, x, z, t, {size, weight: 600, align: 'left', valign: 'baseline', mask: false, lpad: 0.02}); if (same) shared(w); else w();};
  if (!sm) {
    yield ['frame: before strip', pen];
    // the strip: project and status; the sheet's title; scale and date; drawn and revision, beside the sheet number
    const S = STRIP, ys = [S.z0], cx = S.x0 + (S.x1 - S.x0) * 0.29, nx = S.x0 + (S.x1 - S.x0) * 0.58;
    for (const h of S.rows) ys.push(ys.at(-1) + h);
    shared(() => {
      rect(S.x0, S.z0, S.x1, S.z1, tt, tt + 0.04, {w: PEN.heavy});
      for (let r = 1; r < S.rows.length; r++) line(S.x0, ys[r], r >= 3 ? nx : S.x1, ys[r], tt + 0.02, tt + 0.04, {w: r === 2 ? PEN.med : PEN.thin});
      line(cx, ys[2], cx, S.z1, tt + 0.03, tt + 0.04, {w: PEN.hair});
      line(nx, ys[2], nx, S.z1, tt + 0.03, tt + 0.04, {w: PEN.med});
      text('PROJECT', S.x0 + 0.3, ys[0] + 0.42, tt + 0.05, {size: 0.28, ...field, lpad: 0.02});
      text(PROJECT, S.x0 + 0.3, ys[0] + 0.88, tt + 0.05, {size: 0.42, weight: 700, track: 0.02, align: 'left', valign: 'baseline', mask: false, lpad: 0.02});
      [['SCALE', S.x0, ys[2]], ['DATE', cx, ys[2]], ['DRAWN', S.x0, ys[3]], ['REV', cx, ys[3]]].forEach(([key, x, y], i) => text(key, x + 0.25, y + 0.36, tt + 0.06 + i * 0.01, {size: 0.26, ...field, lpad: 0.02}));
      text('SHEET', nx + 0.3, ys[2] + 0.42, tt + 0.08, {size: 0.28, ...field, lpad: 0.02});
    });
    // (this sheet's own fields, on the label map as one label, so the strip never shows half of each sheet)
    group(() => {
      text(f.status, S.x1 - 0.25, ys[0] + 0.88, tt + 0.06, {size: 0.28, color: MUTED, track: 0.04, align: 'right', valign: 'baseline', mask: false, lpad: 0.02});
      const title = k => [[{str: f.title, size: 0.5 * k, weight: 700, track: 0.03}], [{str: f.titleZh, size: 0.38 * k, color: MUTED, track: 0.02}]];
      const tf = fit([title], S.x1 - S.x0 - 0.6, S.rows[1] - 0.3, 1, 0.7, 0.2) || {lines: title(0.7)};
      block(tf.lines, S.x0 + 0.3, (ys[1] + ys[2]) / 2, tt + 0.07, {align: 'left', mask: false, lead: 0.2, lpad: 0.02});
      value(f.scale, S.x0 + 0.25, ys[2] + 0.8, tt + 0.08, false);
      const no = fit([k => [[{str: f.sheetNo, size: 1.1 * k, weight: 700, track: 0.02}]]], S.x1 - nx - 0.6, 1.2, 1, 0.6) || {lines: [[{str: f.sheetNo, size: 0.66, weight: 700}]]};
      block(no.lines, nx + 0.3, S.z1 - 0.3, tt + 0.09, {align: 'left', valign: 'baseline', mask: false, lpad: 0.02});
    });
    value(REV_NOS.at(-1)[1], cx + 0.25, ys[2] + 0.8, tt + 0.08, true);
    value('JAY LIN', S.x0 + 0.25, ys[3] + 0.8, tt + 0.08, true);
    value(REV_NOS.at(-1)[0], cx + 0.25, ys[3] + 0.8, tt + 0.08, true);
    return;
  }
  // compact, for a phone: the title on one line over a row of four fields, the sheet number at the east end, all
  // west of the notes column
  const cells = [['SCALE', f.scale, false], ['DRAWN', 'JAY LIN', true], ['DATE', REV_NOS.at(-1)[1], true], ['REV', REV_NOS.at(-1)[0], true]];
  const B = TBK, split = B.x1 - 4.0, row = B.z0 + 1.45, cw = (split - B.x0) / cells.length;
  shared(() => {
    rect(B.x0, B.z0, B.x1, B.z1, tt, tt + 0.04, {w: PEN.heavy});
    line(split, B.z0, split, B.z1, tt + 0.02, tt + 0.04, {w: PEN.med});
    line(B.x0, row, split, row, tt + 0.02, tt + 0.04, {w: PEN.thin});
    text('SHEET', split + 0.3, B.z0 + 0.85, tt + 0.08, {size: FLOOR, ...field, track: 0.04, lpad: 0.03});
  });
  cells.forEach(([key, v, same], i) => {
    const x = B.x0 + i * cw;
    shared(() => {
      if (i) line(x, row, x, B.z1, tt + 0.03, tt + 0.04, {w: PEN.hair});
      text(key, x + 0.3, row + 0.75, tt + 0.06 + i * 0.01, {size: FLOOR, ...field, track: 0.04, lpad: 0.03});
    });
    if (same) value(v, x + 0.3, row + 1.6, tt + 0.06 + i * 0.01, true, 0.76);
  });
  group(() => {
  value(f.scale, B.x0 + 0.3, row + 1.6, tt + 0.06, false, 0.76);
  const title = k => [[{str: f.title, size: 0.8 * k, weight: 700, track: 0.04}, {str: f.titleZh, size: 0.56 * k, color: MUTED, track: 0.02, gap: 0.5 * k}]];
  const tf = fit([title, k => [[{str: f.title, size: 0.8 * k, weight: 700, track: 0.04}]]], split - B.x0 - 0.7, row - B.z0 - 0.4, 1.2, 0.7) || {lines: title(0.7), B: layout(title(0.7))};
  block(tf.lines, B.x0 + 0.35, (B.z0 + row) / 2, tt + 0.05, {align: 'left', mask: false, lpad: 0.03});
  const no = fit([k => [[{str: f.sheetNo, size: 1.25 * k, weight: 700, track: 0.02}]]], B.x1 - split - 0.6, 1.3, 1, 0.6) || {lines: [[{str: f.sheetNo, size: 0.75, weight: 700}]]};
  block(no.lines, split + 0.3, B.z0 + 1.95, tt + 0.09, {align: 'left', valign: 'baseline', mask: false, lpad: 0.03});
  });
}

// the rooms along the north side as the drawing names them. The three plan.js calls switchgear, UPS and battery hold
// this hall's own power distribution: the boards and PDUs that feed the row busways, and the panels for the cooling
// plant. The UPS, batteries and medium-voltage switchgear behind them are in a separate power building (a note says
// so); at 7.4 MW they would need about ten times these rooms
const ROOM_NO = {hall: 101, switchgear: 102, ups: 103, battery: 104, mda: 105};
const ROOM_NAME = {switchgear: ['ELEC. 1', '配电间 1'], ups: ['ELEC. 2', '配电间 2'], battery: ['ELEC. 3', '配电间 3'], mda: ['MDA', '主配线区']};
const TAGS = [[SWITCHBOARDS, i => 'DB' + (i + 1)], [UPS, i => 'PDU' + (i + 1)], [BATTERIES, i => 'P' + (i + 1)]];
// equipment in a gallery room, and the clear strip between its two rows, where the room's name goes
const GALLERY = ['switchgear', 'ups', 'battery', 'mda'];
const GEAR = [...SWITCHBOARDS, ...UPS, ...BATTERIES, ...MDA];
const strip = k => {
  const r = ROOMS[k], mid = (r.z0 + r.z1) / 2, kit = GEAR.filter(e => e.x > r.x0 && e.x < r.x1 && e.z > r.z0 && e.z < r.z1);
  const z0 = Math.max(...kit.filter(e => e.z < mid).map(e => e.z + e.d / 2)), z1 = Math.min(...kit.filter(e => e.z > mid).map(e => e.z - e.d / 2));
  const face = x => (x <= BOUNDS.x0 || x >= BOUNDS.x1 ? EXT_T : INT_T) / 2;
  return {x0: r.x0 + face(r.x0), x1: r.x1 - face(r.x1), z0, z1, cx: (r.x0 + r.x1) / 2, cz: (z0 + z1) / 2};
};
const area = r => Math.round((r.x1 - r.x0) * (r.z1 - r.z0));
const westWall = Math.max(...FANWALLS.filter(f => f.x < 0).map(f => f.x + f.w / 2));
const eastWall = Math.min(...FANWALLS.filter(f => f.x > 0).map(f => f.x - f.w / 2));
// the HBM stacks round the die, as detail.js places them: 10.5 mm wide, 0.4 mm either side of the die's centre line,
// two above and two below. The die is 25.5 mm across the sheet's 22 m, so their centres fall at these sheet x
const STACK_X = [-1, 1].map(k => k * (10.5 / 2 + 0.4) * (BOUNDS.x1 - BOUNDS.x0) / 25.5 + CENTER.x);

// ---------------------------------------------------------------------------------------------------------------
// The plan's skeleton: the paths that mean the same place on both sheets, drawn by these functions alone, with the
// same pen on both, inside shared(), so they also go into the frame picture and stay through the swap. Each sheet
// calls them at its own moment in its own draw order; what it adds round them (the hall's poché, racks, hatching
// and tags; the die's edge, seal ring, SM tiles and lanes) is its own.
const BONE = {wall: 0.08, row: 0.06, box: PEN.med};
const near = (x0, z0, x1, z1) => Math.abs(x0 - x1) < 1e-6 && Math.abs(z0 - z1) < 1e-6;
const jamb = (x, z) => DOORS.some(d => near(d.x, d.z, x, z) || near(d.x + d.ux * d.w, d.z + d.uz * d.w, x, z));
// walls = the die's edge and its block boundaries: each wall's centre line, open at the doors, run on past its ends
// to close the corners. On the hall's sheet it lies inside the cut wall; on the die's, under the edge line
// (the walls between the gallery's rooms are the hall's own: the die's memory band is laid out on its HBM stacks)
const divider = w => Math.abs(w.x0 - w.x1) < 1e-6 && w.x0 > BOUNDS.x0 + 1e-6 && w.x0 < BOUNDS.x1 - 1e-6;
function sharedWalls(pen, [t0, t1]) {
  const walls = WALLS.filter(w => !divider(w)), total = walls.reduce((L, w) => L + Math.hypot(w.x1 - w.x0, w.z1 - w.z0), 0);
  let run = 0;
  pen.shared(() => walls.forEach(w => {
    const L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0), ux = (w.x1 - w.x0) / L, uz = (w.z1 - w.z0) / L, e = BONE.wall / 2;
    const e0 = jamb(w.x0, w.z0) ? 0 : e, e1 = jamb(w.x1, w.z1) ? 0 : e, a = lerp(t0, t1, run / total);
    run += L;
    pen.line(w.x0 - ux * e0, w.z0 - uz * e0, w.x1 + ux * e1, w.z1 + uz * e1, a, lerp(t0, t1, run / total), {w: BONE.wall});
  }));
}
// a rack row = a bank of compute blocks: its outline
const sharedRow = (pen, row, t0, t1) => pen.shared(() => pen.rect(ROW_X0, row.z0, ROW_X1, row.z1, t0, t1, {w: BONE.row}));
// a hot aisle = an L2 cache band: its long sides are the rows'; these are its two ends (the containment doors)
const sharedAisleEnds = (pen, h, t0, t1) => pen.shared(() => {
  pen.line(ROW_X0, h.z0, ROW_X0, h.z1, t0, t0 + 0.01, {w: BONE.row});
  pen.line(ROW_X1, h.z0, ROW_X1, h.z1, t1 - 0.01, t1, {w: BONE.row});
});
// a box of plant = a block of the die: fan walls are the I/O strips on the long edges (held to the wall's inner face,
// so they clear the die's seal ring), CDUs the engines
const INNER = {x0: BOUNDS.x0 + EXT_T / 2 + 0.1, x1: BOUNDS.x1 - EXT_T / 2 - 0.1};
const boxOf = e => [Math.max(e.x - e.w / 2, INNER.x0), e.z - e.d / 2, Math.min(e.x + e.w / 2, INNER.x1), e.z + e.d / 2];
const sharedBox = (pen, e, t0, t1 = t0 + 0.015) => pen.shared(() => pen.rect(...boxOf(e), t0, t1, {w: BONE.box}));

// ---------------------------------------------------------------------------------------------------------------
// small: lettering for phones (screens 700 px wide or less), where a metre of sheet is about 13 px on screen instead
// of 26. The drawing's words grow up to 1.6×, each to the largest size that fits its place; row numbers and the aisle
// dimensions, which can't grow where they are, are left out. The notes column is off a phone's screen and keeps its size
function* planSteps(px = 4096, {small = false, defer = false} = {}) {
  const pen = painter(px, {anchor: 'east', defer}), {line, path, rect, poly, fill, settle, circle, arc, hatch, block, layout, text, group, zone, fit} = pen;
  yield ['plan: painter', pen];
  for (const w of FACE_WEIGHTS) for (const font of [SANS, MONO]) {pen.warm(w, font); yield ['plan: fonts', pen];}
  // when each part draws: grid, walls, doors, racks, aisles, plant, labels, dimensions, then the sheet's furniture
  const P = {border: [0, 0.05], grid: [0.03, 0.13], walls: [0.13, 0.27], columns: [0.26, 0.3], doors: [0.29, 0.35], racks: [0.35, 0.55], aisles: [0.55, 0.61], plant: [0.6, 0.69], labels: [0.69, 0.81], dims: [0.81, 0.89], sheet: [0.88, 0.99]};
  const H = ROOMS.hall, K = small ? 1.6 : 1;

  // structural grid: numbers across the top, letters down the west side
  const RB = small ? 0.62 : 0.48, GT = small ? 0.72 : 0.55, gN = OUT.z0 - (small ? 3.75 : 3.4), gW = OUT.x0 - (small ? 3.75 : 3.4), nG = GRID_X.length + GRID_Z.length;
  GRID_X.forEach((x, i) => {
    const t = at(P.grid, i / nG);
    line(x, gN + RB, x, OUT.z1 + 0.8, t, t + 0.05, {w: PEN.thin, color: LIGHT, dash: GRID_DASH});
    group(() => {
      zone(x - RB - 0.12, gN - RB - 0.12, x + RB + 0.12, gN + RB + 0.12);
      circle(x, gN, RB, t, t + 0.02, {w: PEN.med});
      text(String(i + 1), x, gN, t + 0.02, {size: GT, font: MONO, weight: 600, mask: false, pad: 0.04});
    });
  });
  GRID_Z.forEach((z, i) => {
    const t = at(P.grid, (GRID_X.length + i) / nG);
    line(gW + RB, z, OUT.x1 + 0.8, z, t, t + 0.05, {w: PEN.thin, color: LIGHT, dash: GRID_DASH});
    group(() => {
      zone(gW - RB - 0.12, z - RB - 0.12, gW + RB + 0.12, z + RB + 0.12);
      circle(gW, z, RB, t, t + 0.02, {w: PEN.med});
      text(String.fromCharCode(65 + i), gW, z, t + 0.02, {size: GT, font: MONO, weight: 600, mask: false, pad: 0.04});
    });
  });

  yield ['plan: grid', pen];
  // walls cut at 1.2 m, solid; each runs on past its end to close the corner, except at a door's jamb. The shared
  // centre line goes in first, under the poché
  sharedWalls(pen, P.walls);
  const total = WALLS.reduce((L, w) => L + Math.hypot(w.x1 - w.x0, w.z1 - w.z0), 0);
  let run = 0;
  WALLS.forEach(w => {
    const L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0), ux = (w.x1 - w.x0) / L, uz = (w.z1 - w.z0) / L, th = w.exterior ? EXT_T : INT_T;
    const nx = -uz * th / 2, nz = ux * th / 2, e0 = jamb(w.x0, w.z0) ? 0 : th / 2, e1 = jamb(w.x1, w.z1) ? 0 : th / 2;
    const ax = w.x0 - ux * e0, az = w.z0 - uz * e0, bx = w.x1 + ux * e1, bz = w.z1 + uz * e1;
    const t0 = at(P.walls, run / total); run += L;
    poly([[ax + nx, az + nz], [bx + nx, bz + nz], [bx - nx, bz - nz], [ax - nx, az - nz]], t0, at(P.walls, run / total), {from: [ax, az], to: [bx, bz], solid: true});
  });
  COLUMNS.forEach((c, i) => fill(c.x - 0.25, c.z - 0.25, c.x + 0.25, c.z + 0.25, at(P.columns, i / COLUMNS.length), undefined, INK, {solid: true}));
  yield ['plan: walls', pen];
  // doors: the leaf open at 90° and its swing; a wide opening is a pair
  DOORS.forEach((d, i) => {
    const q = Math.atan2(d.uz, d.ux), t = at(P.doors, i / DOORS.length), pair = d.w > 1.5, r = pair ? d.w / 2 : d.w;
    const leaves = pair ? [[d.x, d.z, q], [d.x + d.ux * d.w, d.z + d.uz * d.w, q + PI]] : [[d.x, d.z, q]];
    for (const [x, z, q0] of leaves) {
      const q1 = q + PI / 2;
      line(x, z, x + Math.cos(q1) * r, z + Math.sin(q1) * r, t, t + 0.015, {w: PEN.med});
      arc(x, z, r, q0, q1, t + 0.01, t + 0.04, {w: PEN.thin, color: MUTED});
    }
  });

  yield ['plan: doors', pen];
  // racks, row by row: GPU racks toned, network racks with a diagonal, the front drawn heavy
  ROWS.forEach((row, r) => {
    const t0 = at(P.racks, r / ROWS.length), t1 = at(P.racks, (r + 0.9) / ROWS.length);
    RACKS.filter(k => k.row === r).forEach(k => {
      const t = lerp(t0, t1, k.i / PER_ROW), x0 = k.x - RACK.w / 2, x1 = k.x + RACK.w / 2, z0 = k.z - RACK.d / 2, z1 = k.z + RACK.d / 2;
      const zf = k.face < 0 ? z0 : z1, zb = k.face < 0 ? z1 : z0;
      if (k.gpu) fill(x0, z0, x1, z1, t, t + 0.01, TONE);
      else line(x0 + 0.07, zb - k.face * 0.08, x1 - 0.07, zf + k.face * 0.14, t + 0.005, t + 0.012, {w: PEN.hair, color: MUTED});
      rect(x0, z0, x1, z1, t, t + 0.012, {w: PEN.med});
      line(x0 + 0.02, zf - k.face * 0.05, x1 - 0.02, zf - k.face * 0.05, t + 0.008, t + 0.016, {w: 0.09});
    });
    // the row's outline, shared: drawn over its racks
    sharedRow(pen, row, t0, t1);
  });
  yield ['plan: racks', pen];
  // hot aisles: hatched, closed at each end by the containment's doors (shared)
  HOT_AISLES.forEach((h, p) => {
    const t0 = at(P.aisles, p / PODS), t1 = at(P.aisles, (p + 0.9) / PODS);
    hatch(ROW_X0, h.z0 + 0.05, ROW_X1, h.z1 - 0.05, 0.3, t0, t1 - 0.01, {w: PEN.hair, color: LIGHT});
    sharedAisleEnds(pen, h, t0, t1);
  });

  yield ['plan: aisles', pen];
  // plant: fan walls and CDUs (shared boxes), and the power and network rooms' equipment
  const plant = [...FANWALLS, ...CDUS, ...SWITCHBOARDS, ...UPS, ...BATTERIES];
  const tag = {font: MONO, size: 0.42, weight: 600, track: 0}, own = (e, t) => rect(e.x - e.w / 2, e.z - e.d / 2, e.x + e.w / 2, e.z + e.d / 2, t, t + 0.015, {w: BONE.box});
  plant.forEach((e, i) => (FANWALLS.includes(e) || CDUS.includes(e) ? sharedBox : (p, x, t) => own(x, t))(pen, e, at(P.plant, i / (plant.length + MDA.length))));
  MDA.forEach((e, i) => {
    const t = at(P.plant, (plant.length + i) / (plant.length + MDA.length)), face = e.z < strip('mda').cz ? 1 : -1;
    own(e, t);
    const zf = e.z + face * (e.d / 2 - 0.05);
    line(e.x - e.w / 2 + 0.02, zf, e.x + e.w / 2 - 0.02, zf, t + 0.01, t + 0.02, {w: 0.09});
  });

  yield ['plan: plant', pen];
  // ---- labels
  const tl = k => at(P.labels, k);
  // a door's tag: its number in a long hexagon
  const DT = small ? FLOOR : 0.42;
  const doorSize = str => (str ? layout([[{str, ...tag, size: DT, weight: 700}]]).w / 2 : 0.2) + 0.26;
  const doorTag = (str, x, z, t, size = DT) => {
    const w = (str ? layout([[{str, ...tag, size, weight: 700}]]).w / 2 : 0.2) + 0.26, h = size * 0.75, k = h * 0.6;
    group(() => {zone(x - w - 0.12, z - h - 0.12, x + w + 0.12, z + h + 0.12); path([[x - w, z], [x - w + k, z - h], [x + w - k, z - h], [x + w, z], [x + w - k, z + h], [x - w + k, z + h], [x - w, z]], t, t + 0.01, {w: PEN.thin});
    if (str) text(str, x, z, t + 0.01, {...tag, size, weight: 700, mask: false, pad: 0.03});});
  };
  // pods: a bracket and its name. On a phone the row numbers go and the bracket moves in to the rows
  const podX = small ? ROW_X0 - 0.3 : ROW_X0 - 1.32, podT = 0.5 * (small ? 1.5 : 1);
  const podW = layout([[{str: 'POD A', size: podT, weight: 700, track: 0.1}]]).h, podC = podX - (small ? 0.18 + podW / 2 + 0.1 : 0.45);
  // the hall's tag runs up the open floor at its west end, between the fan walls and the pods
  const hallTag = k => [
    [{str: H.name, size: 0.95 * k, weight: 700, track: 0.06}],
    [{str: H.zh, size: 0.5 * k, color: MUTED, track: 0}, {str: String(ROOM_NO.hall), size: 0.46 * k, font: MONO, weight: 700, gap: 0.3 * k}, {str: `· ${area(H)} m²`, size: 0.46 * k, font: MONO, color: MUTED, gap: 0.18 * k}],
  ];
  if (small) {
    const room = {x0: westWall + 0.15, x1: podC - podW / 2 - 0.25}, f = fit([hallTag], H.z1 - H.z0 - 4, room.x1 - room.x0 - 0.2, K, 1, 0.24);
    block((f || {lines: hallTag(1)}).lines, (room.x0 + room.x1) / 2, (H.z0 + H.z1) / 2, tl(0), {rotate: UP, lead: 0.24});
  } else block(hallTag(1), (westWall + ROW_X0 - 1.8) / 2, (H.z0 + H.z1) / 2, tl(0), {rotate: UP, lead: 0.24});
  yield ['plan: hall tag', pen];
  // each gallery room's tag fits in the strip between its rows of equipment: name, then Chinese name, number and
  // area, on as few lines as fit. On a phone: name, number and area, as large as fits in every room
  // (on two lines, or on one where the strip is low)
  const roomTags = (key, k) => {
    const [en] = ROOM_NAME[key], name = {str: en, size: 0.68 * k, weight: 700, track: 0.06}, no = {str: String(ROOM_NO[key]), size: Math.max(FLOOR, 0.6 * k), font: MONO, weight: 700};
    return [[[name], [no]], [[name, {...no, gap: 0.3 * k}]]];
  };
  const roomTag = (key, k) => {
    const g = strip(key);
    return roomTags(key, k).find(L => {const B = layout(L, 0.16); return B.w <= g.x1 - g.x0 - 0.15 && B.h <= g.z1 - g.z0 - 0.16;});
  };
  let roomFit = {o: 4, k: 1};
  if (small) for (let k = K; k >= 1 - 1e-6; k = Math.round((k - 0.05) * 100) / 100) {
    if (GALLERY.every(key => roomTag(key, k))) {roomFit = {o: 4, k}; break;}
  }
  GALLERY.forEach((key, i) => {
    const r = ROOMS[key], g = strip(key), [en, cn] = ROOM_NAME[key];
    const name = k => ({str: en, size: 0.68 * k, weight: 700, track: 0.06}), zh = k => ({str: cn, size: 0.44 * k, color: MUTED, track: 0});
    const no = k => ({str: String(ROOM_NO[key]), size: 0.42 * k, font: MONO, weight: 700}), ar = k => ({str: `· ${area(r)} m²`, size: 0.42 * k, font: MONO, color: MUTED, gap: 0.18 * k});
    const options = [
      k => [[name(k)], [zh(k), {...no(k), gap: 0.22 * k}, ar(k)]],
      k => [[name(k)], [zh(k)], [no(k), ar(k)]],
      k => [[name(k), {...zh(k), gap: 0.22 * k}], [no(k), ar(k)]],
      k => [[{...name(k), track: 0.02}, {...zh(k), size: 0.42 * k, gap: 0.14 * k}], [no(k), ar(k)]],
      k => [[name(k)], [no(k), ar(k)]],
      k => [[name(k), {...no(k), gap: 0.3 * k}]],
    ];
    const W = g.x1 - g.x0 - 0.15, Hh = g.z1 - g.z0 - 0.16;
    const f = small ? {lines: roomTag(key, roomFit.k) || roomTags(key, 1)[1]} : fit(options.slice(0, 5), W, Hh);
    block(f ? f.lines : options[4](1), g.cx, g.cz, tl(0.05 + i * 0.02), {lead: 0.16, pad: 0.04});
  });
  yield ['plan: room tags', pen];
  // aisles; the walk aisle's label sits north of centre, clear of the route drawn along it
  const aisleW = ROW_X1 - ROW_X0 - 0.4;
  COLD_AISLES.forEach((c, i) => {
    const cold = k => [[{str: 'COLD AISLE', size: 0.48 * k, color: MUTED, track: 0.08}, {str: '冷通道', size: 0.46 * k, color: MUTED}]];
    const f = small ? fit([cold], aisleW, (c.z1 - c.z0) / 2 + 0.1, K, 1) : {lines: cold(1), B: {h: 0}};
    const z = (c.z0 + c.z1) / 2 - (c === WALK_AISLE ? (small ? 0.3 : 0.22) : 0);
    block((f || {lines: cold(1)}).lines, (ROW_X0 + ROW_X1) / 2, z, tl(0.16 + i * 0.015));
  });
  yield ['plan: cold aisle labels', pen];
  HOT_AISLES.forEach((h, p) => {
    const hot = k => [[{str: 'HOT AISLE', size: 0.48 * k, weight: 600, track: 0.08}, {str: '热通道', size: 0.46 * k, weight: 600}, ...(small ? [] : [{str: '· DUCTED', size: 0.44, color: MUTED, track: 0.06, gap: 0.22}])]];
    block(small ? (fit([hot], aisleW, h.z1 - h.z0 - 0.5, K, 1) || {lines: hot(1)}).lines : hot(1), (ROW_X0 + ROW_X1) / 2, (h.z0 + h.z1) / 2, tl(0.18 + p * 0.015));
  });
  yield ['plan: hot aisle labels', pen];
  // rows, and the pods they pair into
  if (!small) ROWS.forEach((row, r) => text('R' + String(r + 1).padStart(2, '0'), ROW_X0 - 0.25, (row.z0 + row.z1) / 2, tl(0.26 + r * 0.01), {...tag, size: 0.46, weight: 700, align: 'right'}));
  for (let p = 0; p < PODS; p++) {
    const z0 = ROWS[p * 2].z0, z1 = ROWS[p * 2 + 1].z1, bx = podX, t = tl(0.33 + p * 0.015);
    group(() => {
      zone(bx - 0.12, z0 - 0.06, bx + 0.25, z1 + 0.06);
      path([[bx + 0.18, z0 + 0.05], [bx, z0 + 0.05], [bx, z1 - 0.05], [bx + 0.18, z1 - 0.05]], t, t + 0.01, {w: PEN.thin});
      text('POD ' + 'ABC'[p], podC, (z0 + z1) / 2, t + 0.005, {size: podT, weight: 700, track: 0.1, rotate: UP});
    });
  }
  yield ['plan: aisle labels', pen];
  // equipment tags: inside the box where they fit (as large as fits, on a phone), beside it where they don't
  if (small) FANWALLS.forEach((e, i) => {
    const [x0, , x1] = boxOf(e), L = [[{str: 'FAN WALL', size: FLOOR, weight: 600, track: 0.04}]], B = layout(L);
    if (B.w <= e.d - 0.9 && B.h + 0.1 <= x1 - x0 - BONE.box) block(L, (x0 + x1) / 2, e.z, tl(0.4 + i * 0.006), {rotate: UP, mask: false, lpad: -0.04});
  });
  else FANWALLS.forEach((e, i) => {
    const [x0, , x1] = boxOf(e), f = fit([k => [[{str: 'FAN WALL', size: 0.44 * k, weight: 600, track: 0.08}]]], e.d - 0.6, x1 - x0 - BONE.box - 0.26, K, 1);
    block(f ? f.lines : [[{str: 'FAN WALL', size: 0.44, weight: 600, track: 0.08}]], (x0 + x1) / 2, e.z, tl(0.4 + i * 0.006), {rotate: UP, pad: 0.05});
  });
  CDUS.forEach((e, i) => text('CDU' + (i + 1), e.x + e.w / 2 + 0.22, e.z, tl(0.45 + i * 0.006), {...tag, size: small ? FLOOR : 0.42, align: 'left'}));
  TAGS.forEach(([kit, name], j) => !(small && kit !== SWITCHBOARDS) && kit.forEach((e, i) => {
    const f = fit([k => [[{str: name(i), ...tag, size: 0.42 * k}]]], e.w - BONE.box - 0.14, e.d - BONE.box - 0.1, small ? 1.9 : 1, small ? FLOOR / 0.42 : 1);
    if (f || !small) text(name(i), e.x, e.z, tl(0.52 + j * 0.03 + i * 0.004), {...tag, size: 0.42 * (f ? f.k : 1), pad: 0.04});
  }));
  yield ['plan: equipment tags', pen];
  // door tags, numbered after the room each door serves (the two outside doors are the hall's A and B), inside the
  // hall beside the hinge, or beside the far jamb where the hinge side has no room (a wall, a column, plant)
  const hallIn = {x0: H.x0 + EXT_T / 2 + 0.12, x1: H.x1 - EXT_T / 2 - 0.12};
  const blocked = (x0, z0, x1, z1) => x0 < hallIn.x0 || x1 > hallIn.x1
    || [...COLUMNS.map(c => ({x: c.x, z: c.z, w: 0.6, d: 0.6})), ...FANWALLS, ...CDUS].some(e => x1 > e.x - e.w / 2 && x0 < e.x + e.w / 2 && z1 > e.z - e.d / 2 && z0 < e.z + e.d / 2);
  let outside = 0;
  DOORS.forEach((d, i) => {
    const cx = d.x + d.ux * d.w / 2, cz = d.z + d.uz * d.w / 2;
    const room = GALLERY.find(k => cx > ROOMS[k].x0 && cx < ROOMS[k].x1 && Math.abs(cz - H.z0) < 1e-6);
    const no = room ? String(ROOM_NO[room]) : ROOM_NO.hall + 'AB'[outside++];
    // (on a phone the tag is larger, so it stands closer to the jamb and keeps a margin from what is round it)
    const hw = doorSize(no), off = hw + (small ? 0.08 : 0.18), h = DT * 0.75 + 0.005, n = small ? h + 0.42 : 0.72, nx = -d.uz, nz = d.ux, mg = small ? 0.14 : 0;
    const spots = [[d.x - d.ux * off, d.z - d.uz * off], [d.x + d.ux * (d.w + off), d.z + d.uz * (d.w + off)]].map(([x, z]) => [x + nx * n, z + nz * n]);
    const [x, z] = spots.find(([x, z]) => !blocked(x - hw - mg, z - h - mg / 3, x + hw + mg, z + h + mg / 3)) || spots[0];
    doorTag(no, x, z, tl(0.64 + i * 0.01));
  });
  yield ['plan: door tags', pen];
  // the floor level, in the open floor at the hall's south-west
  const lx = westWall + 0.65, lz = COLD_AISLES.at(-1).z1 - 0.95, tlv = tl(0.72);
  group(() => {
    zone(lx - 0.5, lz - 0.5, lx + 0.5, lz + 0.5);
    circle(lx, lz, 0.24, tlv, tlv + 0.01, {w: PEN.thin});
    for (const q of [UP, PI / 2]) poly([[lx, lz], ...arcPts(lx, lz, 0.24, q, q + PI / 2)], tlv + 0.01);
    line(lx - 0.38, lz, lx + 0.38, lz, tlv, tlv + 0.01, {w: PEN.hair});
    line(lx, lz - 0.38, lx, lz + 0.38, tlv, tlv + 0.01, {w: PEN.hair});
    text('FFL ±0.00', lx + 0.5, lz, tlv + 0.01, {...tag, size: small ? FLOOR : 0.44, align: 'left'});
  });

  yield ['plan: level', pen];
  // ---- section 1 is cut along the walk aisle, looking north at the rack fronts the walk passes. Its line is drawn
  // before the dimensions so that their figures, drawn over it, mask it
  const td = k => at(P.dims, k), mm = v => String(Math.round(v * 1000));
  const zs = (WALK_AISLE.z0 + WALK_AISLE.z1) / 2, sx = small ? gW : gW - 1.45, sr = small ? 0.62 : 0.85, tsec = td(0.88), c45 = sr * Math.SQRT1_2;
  line(sx + sr, zs, OUT.x0 + 0.1, zs, tsec, tsec + 0.03, {w: 0.08, dash: [0.9, 0.16, 0.16, 0.16]});
  group(() => {
    zone(sx - sr - 0.12, zs - sr - 0.72, sx + sr + 0.12, zs + sr + 0.12);
    circle(sx, zs, sr, tsec, tsec + 0.015, {w: PEN.med});
    if (!small) line(sx - sr, zs, sx + sr, zs, tsec + 0.01, tsec + 0.015, {w: PEN.thin});
    poly([[sx - c45, zs - c45], [sx, zs - sr - 0.6], [sx + c45, zs - c45], ...arcPts(sx, zs, sr, -PI / 4, -3 * PI / 4)], tsec + 0.015);
    text('1', sx, small ? zs : zs - 0.36, tsec + 0.02, {...tag, size: small ? FLOOR : 0.46, weight: 700, mask: false, pad: 0.03});
    if (!small) text('A-301', sx, zs + 0.37, tsec + 0.02, {...tag, size: 0.4, weight: 500, mask: false, pad: 0.03});
  });

  yield ['plan: section', pen];
  // ---- dimensions, in millimetres: grid and overall on the north and west, the aisles across pod A, one rack
  const tick = (x, z, t) => line(x - 0.15, z + 0.15, x + 0.15, z - 0.15, t, t, {w: PEN.heavy});
  // a chain of dimensions along x (or z): witness lines from the object, ticks, and the figures on the given side. A
  // figure that would sit on a line crossing the chain (avoid) slides along its dimension, clear of it. A vertical
  // chain's figures read from the east, as usual, unless turned to read from the west (turn)
  const FIG = small ? FLOOR : 0.42, FIG_OFF = small ? 0.52 : 0.36;
  const chain = (vs, at, obj, t0, t1, {vertical = false, side = Math.sign(at - obj), ext = true, avoid = null, turn = false} = {}) => {
    const P2 = (u, v) => (vertical ? [v, u] : [u, v]);
    line(...P2(vs[0] - 0.3, at), ...P2(vs.at(-1) + 0.3, at), t0, t1, {w: PEN.thin, color: MUTED});
    const dir = Math.sign(at - obj);
    vs.forEach((v, i) => {
      const t = lerp(t0, t1, i / (vs.length - 1));
      if (ext) line(...P2(v, obj + dir * 0.2), ...P2(v, at + dir * 0.25), t, t + 0.005, {w: PEN.hair, color: MUTED});
      tick(...P2(v, at), t);
      if (!i) return;
      const fig = {font: MONO, size: FIG, track: 0.02}, str = mm(v - vs[i - 1]), half = layout([[{str, ...fig}]]).w / 2 + 0.25;
      let c = (v + vs[i - 1]) / 2;
      if (avoid != null && Math.abs(c - avoid) < half) c = avoid + Math.sign(c - avoid || 1) * (half + 0.4);
      text(str, ...P2(c, at + side * FIG_OFF), t, {...fig, rotate: vertical ? (turn ? -UP : UP) : 0, pad: 0.06});
    });
  };
  chain(GRID_X, OUT.z0 - 1.0, OUT.z0, td(0), td(0.15), {ext: false});
  chain([OUT.x0, OUT.x1], OUT.z0 - 1.95, OUT.z0, td(0.15), td(0.25));
  chain(GRID_Z, OUT.x0 - 1.0, OUT.x0, td(0.25), td(0.45), {vertical: true, ext: false, avoid: zs});
  chain([OUT.z0, OUT.z1], OUT.x0 - 1.95, OUT.x0, td(0.45), td(0.55), {vertical: true, avoid: zs});
  // the aisles across pod A, ending at the walk's aisle: these figures face the walk, which comes from the west; and
  // one rack. On a phone the figures can't grow between their ticks, so these two go
  if (!small) {
    chain([ROWS[0].z0, ROWS[0].z1, ROWS[1].z0, ROWS[1].z1, ROWS[2].z0], ROW_X1 + 0.95, ROW_X1, td(0.6), td(0.8), {vertical: true, side: -1, turn: true});
    chain([ROW_X0, ROW_X0 + RACK.w], ROWS[0].z0 - 0.55, ROWS[0].z0, td(0.8), td(0.85));
  }

  yield ['plan: dimensions', pen];
  // the cut walls and columns keep their own time where later lines run over their edges
  settle();

  yield ['plan: settle', pen];
  // ---- the sheet
  yield* frameSteps(pen, {
    small, border: P.border, sheet: P.sheet, sheetNo: 'A-101', status: 'NOT FOR CONSTRUCTION',
    title: 'DATA HALL 01 · PLAN', titleZh: '数据中心一号机房 · 平面图', scale: '1:200',
    view: 'PLAN AT +' + CUT.toFixed(2), viewSub: [{str: '平面图', size: 0.6, color: MUTED}, {str: '· 1:200', size: 0.56, font: MONO, color: MUTED, gap: 0.2}],
    revs: ['First issue', 'Room tags', 'Label sizes', 'Power rooms'],
    orient: (t0, t1) => {
      // north arrow: a needle, its east half filled, and N over it
      const nx = COL.x0 + 0.8, nz = COL.orient + 0.55, r = 0.72;
      circle(nx, nz, r, t0, t0 + 0.02, {w: PEN.med});
      poly([[nx, nz - r - 0.3], [nx + 0.3, nz + 0.5], [nx, nz + 0.28]], t0 + 0.02);
      path([[nx, nz - r - 0.3], [nx - 0.3, nz + 0.5], [nx, nz + 0.28]], t0 + 0.02, t0 + 0.03, {w: PEN.thin});
      text('N', nx, nz - r - 0.72, t0 + 0.03, {size: 0.55, weight: 700, mask: false});
      // graphic scale, 0–3 m
      const sx = COL.x0 + 2.2, sz = nz + 0.1;
      for (let k = 0; k < 3; k++) {
        if (k % 2 === 0) fill(sx + k, sz - 0.08, sx + k + 1, sz + 0.08, t0 + 0.03 + k * 0.005);
        rect(sx + k, sz - 0.08, sx + k + 1, sz + 0.08, t0 + 0.03 + k * 0.005, t0 + 0.035 + k * 0.005, {w: PEN.hair});
      }
      ['0', '1', '2', '3 m'].forEach((v, k) => text(v, sx + k + (k === 3 ? 0.3 : 0), sz - 0.48, t1, {...tag, weight: 500, mask: false, pad: 0.03}));
      text('SCALE 1:200', sx, sz + 0.75, t1, {size: 0.42, track: 0.04, align: 'left', mask: false});
    },
    legend: [
      [(x, z, t) => {fill(x - 0.4, z - 0.22, x + 0.4, z + 0.22, t, t, TONE); rect(x - 0.4, z - 0.22, x + 0.4, z + 0.22, t, t + 0.01, {w: PEN.med}); line(x - 0.38, z + 0.17, x + 0.38, z + 0.17, t, t + 0.01, {w: 0.09});}, `GPU rack, ${FACTS.rackKw} kW`],
      [(x, z, t) => {rect(x - 0.4, z - 0.22, x + 0.4, z + 0.22, t, t + 0.01, {w: PEN.med}); line(x - 0.33, z - 0.15, x + 0.33, z + 0.08, t, t, {w: PEN.hair, color: MUTED}); line(x - 0.38, z + 0.17, x + 0.38, z + 0.17, t, t + 0.01, {w: 0.09});}, `Network rack, ${FACTS.netKw} kW`],
      [(x, z, t) => {hatch(x - 0.4, z - 0.22, x + 0.4, z + 0.22, 0.16, t, t + 0.01, {w: PEN.hair, color: LIGHT}); line(x - 0.4, z - 0.22, x - 0.4, z + 0.22, t, t, {w: PEN.med}); line(x + 0.4, z - 0.22, x + 0.4, z + 0.22, t, t, {w: PEN.med});}, 'Hot aisle, ducted'],
      [(x, z, t) => {fill(x - 0.4, z - 0.1, x + 0.05, z + 0.1, t); fill(x + 0.15, z - 0.2, x + 0.4, z + 0.2, t);}, 'Cut wall, column'],
      [(x, z, t) => {line(x - 0.55, z, x + 0.18, z, t, t + 0.01, {w: PEN.thin, color: LIGHT, dash: [0.3, 0.08, 0.08, 0.08]}); circle(x + 0.38, z, 0.2, t, t + 0.01, {w: PEN.thin});}, 'Structural grid'],
      [(x, z, t) => doorTag('', x, z, t, 0.3), 'Door, by room number'],
    ],
    notesHead: 'GENERAL NOTES',
    notes: [
      'Dimensions in millimetres, levels in metres, areas to wall centre lines.',
      `Plan cut at +${CUT.toFixed(2)} above FFL ±0.00.`,
      'Rack fronts face the cold aisles; hot aisles are ducted to the ceiling plenum.',
      `${FACTS.gpuRacks} GPU racks at ${FACTS.rackKw} kW and ${FACTS.netRacks} network racks at ${FACTS.netKw} kW: ${FACTS.itMw.toFixed(1)} MW of IT load.`,
      'Elec. 1–3: boards (DB) and PDUs feed the row busways; panels (P) the CDUs and fan walls.',
      'UPS, batteries and medium-voltage switchgear are in a separate power building, not shown.',
      'After a published reference design for liquid-cooled racks.',
    ],
  });
  return pen;
}

// points along an arc, for filled shapes
function arcPts(x, z, r, q0, q1, n = 12) {
  return Array.from({length: n + 1}, (_, i) => {const q = q0 + (q1 - q0) * i / n; return [x + Math.cos(q) * r, z + Math.sin(q) * r];});
}

// ---------------------------------------------------------------------------------------------------------------
// One GPU die as a floor plan, drawn on the hall's own geometry: the building's outline is the die's edge, the racks
// are compute blocks, the hot aisles L2 cache, the cold aisles the crossbar, the north gallery the memory interface,
// the fan walls the die's I/O on its west (to the other die) and east (NVLink, PCIe) edges, the CDUs small engines.
// At the cut only the labels and line weights change. It is illustrative: the maker hasn't published a floor plan.
function* dieSteps(px = 2048, {small = false, defer = false} = {}) {
  const pen = painter(px, {anchor: 'west', defer}), {line, rect, poly, hatch, block, layout, text, group, zone, fit} = pen, K = small ? 1.6 : 1;
  yield ['die: painter', pen];
  for (const w of FACE_WEIGHTS) for (const font of [SANS, MONO]) {pen.warm(w, font); yield ['die: fonts', pen];}
  const P = {edge: [0, 0.12], walls: [0.1, 0.18], memory: [0.16, 0.3], blocks: [0.28, 0.5], cache: [0.5, 0.56], io: [0.54, 0.62], labels: [0.62, 0.76], border: [0.74, 0.8], sheet: [0.74, 0.86]};
  const H = ROOMS.hall, SEAL = 0.12, hz = (H.z0 + H.z1) / 2;
  // the die's edge and its seal ring, where the building's outer walls are
  rect(BOUNDS.x0, BOUNDS.z0, BOUNDS.x1, BOUNDS.z1, P.edge[0], P.edge[1], {w: 0.13});
  rect(BOUNDS.x0 + SEAL, BOUNDS.z0 + SEAL, BOUNDS.x1 - SEAL, BOUNDS.z1 - SEAL, P.edge[0] + 0.04, P.edge[1] + 0.02, {w: PEN.thin, color: MUTED});
  yield ['die: edge', pen];
  // block boundaries where the hall has its walls (shared); the memory band's inner edge runs on unbroken where the
  // hall has its doors
  sharedWalls(pen, P.walls);
  line(BOUNDS.x0, H.z0, BOUNDS.x1, H.z0, P.walls[0], P.walls[1], {w: BONE.wall});
  yield ['die: walls', pen];
  // the memory interface along the north edge, where the hall has its gallery: under each of the two HBM stacks a PHY
  // as wide as the stack (centred on it, its lanes along the edge), and behind it two memory controllers; the corners
  // beyond the stacks hold the die's other I/O
  const NB = {z0: BOUNDS.z0 + SEAL + 0.14, z1: H.z0 - 0.2, phy: 2.4, gap: 0.25}, PHYW = 9.2;
  const stacks = STACK_X.map(sx => ({sx, x0: sx - PHYW / 2, x1: sx + PHYW / 2}));
  stacks.forEach(({sx, x0, x1}, h) => {
    const t = at(P.memory, h * 0.5), zp = NB.z0 + NB.phy, zm = zp + NB.gap;
    rect(x0, NB.z0, x1, zp, t, t + 0.04, {w: PEN.med});
    line(x0, NB.z0 + 0.62, x1, NB.z0 + 0.62, t + 0.02, t + 0.05, {w: PEN.hair});
    for (let x = x0 + 0.15; x < x1 - 0.08; x += 0.2) line(x, NB.z0 + 0.1, x, NB.z0 + 0.52, t + 0.03, t + 0.06, {w: PEN.hair, color: MUTED});
    rect(x0, zm, sx - 0.12, NB.z1, t + 0.06, t + 0.09, {w: PEN.med});
    rect(sx + 0.12, zm, x1, NB.z1, t + 0.08, t + 0.11, {w: PEN.med});
  });
  for (const [x0, x1] of [[BOUNDS.x0 + SEAL + 0.14, stacks[0].x0 - 0.25], [stacks[1].x1 + 0.25, BOUNDS.x1 - SEAL - 0.14]]) {
    rect(x0, NB.z0, x1, NB.z1, at(P.memory, 0.9), P.memory[1], {w: PEN.thin});
  }
  yield ['die: north band', pen];
  // compute blocks where the racks stand
  ROWS.forEach((row, r) => {
    const t0 = at(P.blocks, r / ROWS.length), t1 = at(P.blocks, (r + 0.9) / ROWS.length);
    RACKS.filter(k => k.row === r).forEach(k => {
      const t = lerp(t0, t1, k.i / PER_ROW), x0 = k.x - RACK.w / 2 + 0.09, x1 = k.x + RACK.w / 2 - 0.09, z0 = k.z - RACK.d / 2 + 0.12, z1 = k.z + RACK.d / 2 - 0.12;
      rect(x0, z0, x1, z1, t, t + 0.012, {w: PEN.thin});
      const zf = k.face < 0 ? z0 + 0.3 : z1 - 0.3;
      line(x0, zf, x1, zf, t + 0.008, t + 0.014, {w: PEN.hair});
      rect(k.x - 0.12, (zf + (k.face < 0 ? z1 : z0)) / 2 - 0.12, k.x + 0.12, (zf + (k.face < 0 ? z1 : z0)) / 2 + 0.12, t + 0.01, t + 0.016, {w: PEN.hair, color: MUTED});
    });
    // the bank's outline, shared: the rack row's
    sharedRow(pen, row, t0, t1);
  });
  yield ['die: blocks', pen];
  // graphics processing clusters beside the banks, where the hall has open floor: a tile per pod on each side, each
  // a grid of SM blocks (the number drawn is schematic): west of the banks out to the edge strip, east of them between
  // the engines and the NVLink strip. Their labels stand outside the die edge, so nothing breaks the tiles
  const cduE = Math.max(...CDUS.map(e => e.x + e.w / 2)), cduW = Math.min(...CDUS.map(e => e.x - e.w / 2));
  const gpcBands = [[westWall + 0.2, ROW_X0 - 0.45, 7], [cduE + 0.25, eastWall - 0.2, 3]];
  gpcBands.forEach(([x0, x1, cols], side) => {
    for (let p = 0; p < PODS; p++) {
      const z0 = ROWS[p * 2].z0, z1 = ROWS[p * 2 + 1].z1, rows = 7, cw = (x1 - x0 - 0.2) / cols, ch = (z1 - z0 - 0.2) / rows;
      const t = at(P.blocks, 0.55 + (side * PODS + p) * 0.07);
      rect(x0, z0, x1, z1, t, t + 0.03, {w: PEN.thin});
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const cx = x0 + 0.1 + c * cw, cz = z0 + 0.1 + r * ch, tc = t + 0.01 + (r * cols + c) / (rows * cols) * 0.03;
        rect(cx + 0.05, cz + 0.05, cx + cw - 0.05, cz + ch - 0.05, tc, tc + 0.004, {w: PEN.hair, color: LIGHT});
      }
    }
  });
  yield ['die: gpc tiles', pen];
  // L2 cache where the hot aisles are
  HOT_AISLES.forEach((h, p) => {
    const t0 = at(P.cache, p / PODS), t1 = at(P.cache, (p + 0.9) / PODS);
    hatch(ROW_X0, h.z0 + 0.08, ROW_X1, h.z1 - 0.08, 0.3, t0, t1, {w: PEN.hair, color: LIGHT});
    sharedAisleEnds(pen, h, t0, t1);
  });
  yield ['die: cache', pen];
  // I/O where the fan walls are (shared boxes, clear of the seal ring): lanes across each block
  FANWALLS.forEach((e, i) => {
    const t = at(P.io, i / FANWALLS.length), [x0, z0, x1, z1] = boxOf(e);
    sharedBox(pen, e, t);
    for (let z = z0 + 0.2; z < z1 - 0.1; z += 0.25) line(x0 + 0.12, z, x1 - 0.12, z, t + 0.01, t + 0.012, {w: PEN.hair, color: MUTED});
  });
  // engines where the CDUs are
  CDUS.forEach((e, i) => {
    const t = at(P.io, 0.6 + i * 0.04);
    sharedBox(pen, e, t, t + 0.01);
    rect(e.x - e.w / 2 + 0.2, e.z - e.d / 2 + 0.2, e.x + e.w / 2 - 0.2, e.z + e.d / 2 - 0.2, t + 0.005, t + 0.012, {w: PEN.hair, color: MUTED});
  });
  yield ['die: io', pen];
  // the memory interface along the south edge too, the north band's mirror for the two HBM stacks below the die:
  // under each a PHY as wide as the stack, its lanes along the edge, and two controllers behind it toward the die's
  // centre. The hall has no rooms here, so this band is the die's own (it fades at the swap)
  const SB = {x0: westWall + 0.2, x1: eastWall - 0.2, z0: ROWS.at(-1).z1 + 0.22, z1: BOUNDS.z1 - SEAL - 0.1, phy: 1.45, gap: 0.12, mc: small ? 0.8 : 0.73, lanes: 0.44};
  SB.zp = SB.z1 - SB.phy; SB.zm = SB.zp - SB.gap - SB.mc;
  const tb = k => at(P.io, 0.7 + k * 0.3);
  line(SB.x0, SB.z0, SB.x1, SB.z0, tb(0), tb(0.3), {w: 0.06});
  stacks.forEach(({sx, x0, x1}, h) => {
    const t = tb(0.3 + h * 0.35);
    rect(x0, SB.zp, x1, SB.z1, t, t + 0.04, {w: PEN.med});
    line(x0, SB.z1 - SB.lanes, x1, SB.z1 - SB.lanes, t + 0.02, t + 0.05, {w: PEN.hair});
    for (let x = x0 + 0.15; x < x1 - 0.08; x += 0.2) line(x, SB.z1 - SB.lanes + 0.08, x, SB.z1 - 0.08, t + 0.03, t + 0.06, {w: PEN.hair, color: MUTED});
    rect(x0, SB.zm, sx - 0.12, SB.zp - SB.gap, t + 0.06, t + 0.09, {w: PEN.med});
    rect(sx + 0.12, SB.zm, x1, SB.zp - SB.gap, t + 0.08, t + 0.11, {w: PEN.med});
  });

  yield ['die: south band', pen];
  // ---- labels: few and large (on a phone, as large as fits, up to 1.6×)
  const tl = k => at(P.labels, k), lab = {weight: 700, track: 0.04};
  // the north band: HBM PHY centred on each stack, MC in each controller behind it
  const phyL = k => [[{str: 'HBM PHY', size: 1.1 * k, ...lab}]], mcL = k => [[{str: 'MC', size: 0.95 * k, ...lab}]];
  stacks.forEach(({sx, x0, x1}, h) => {
    const zl = (NB.z0 + 0.62 + NB.z0 + NB.phy) / 2, zm = NB.z0 + NB.phy + NB.gap;
    const p = fit([phyL], x1 - x0 - 0.6, NB.phy - 0.62 - 0.4, small ? K : 1, 0.6) || {lines: phyL(1)};
    block(p.lines, sx, zl, tl(h * 0.06));
    const m = fit([mcL], sx - x0 - 0.7, NB.z1 - zm - 0.4, small ? K : 1, 0.6) || {lines: mcL(1)};
    block(m.lines, (x0 + sx) / 2, (zm + NB.z1) / 2, tl(h * 0.06 + 0.02));
    block(m.lines, (sx + x1) / 2, (zm + NB.z1) / 2, tl(h * 0.06 + 0.04));
  });
  HOT_AISLES.forEach((h, p) => {
    const l2 = k => [[{str: 'L2 CACHE', size: 1.2 * k, weight: 700, track: 0.03}, {str: '二级缓存', size: 0.5 * k, font: SANS, color: MUTED, gap: 0.35 * k}]];
    const f = small ? fit([l2, k => [[{str: 'L2 CACHE', size: 1.2 * k, weight: 700, track: 0.03}]]], ROW_X1 - ROW_X0 - 0.4, h.z1 - h.z0 - 0.36, K, 1) : null;
    block(f ? f.lines : l2(1), (ROW_X0 + ROW_X1) / 2, (h.z0 + h.z1) / 2, tl(0.15 + p * 0.03));
  });
  let crossW = 0;
  COLD_AISLES.slice(1, -1).forEach((c, i) => {
    const xb = k => [[{str: 'CROSSBAR', size: 0.7 * k, color: MUTED, track: 0.06}, {str: '交叉开关', size: 0.56 * k, font: SANS, color: MUTED, gap: 0.3 * k}]];
    const f = small ? fit([xb], ROW_X1 - ROW_X0 - 0.4, c.z1 - c.z0 - 0.36, K, 1) : null, lines = f ? f.lines : xb(1);
    crossW = Math.max(crossW, layout(lines).w);
    block(lines, (ROW_X0 + ROW_X1) / 2, (c.z0 + c.z1) / 2, tl(0.27 + i * 0.03));
  });
  yield ['die: band labels', pen];
  // west of the die: the link to the other die as a callout on the arrow to it (DIE 0 above, DIE-TO-DIE under), in
  // the margin, which the paper reveals as it widens. On a phone it grows as far as the margin allows inside a gutter
  // (the crop starts about 16.5 m west of the centre), on three lines so the second and third stay legible
  const len = 2 * Math.min(hz - H.z0, SB.z0 - hz) - 0.8;
  const MX = BOUNDS.x0 - 0.45, ML = small ? -15.8 : -17.6;
  const dtd = k => (small
    ? [[{str: 'DIE-TO-DIE', size: 0.85 * k, weight: 700, track: 0}], [{str: '10 TB/s', size: FLOOR, font: MONO, color: MUTED, track: 0}], [{str: '裸片互连', size: FLOOR, color: MUTED, track: 0}]]
    : [[{str: 'DIE-TO-DIE', size: 0.85 * k, weight: 700, track: 0.03}], [{str: '10 TB/s', size: 0.5 * k, font: MONO, color: MUTED}, {str: '裸片互连', size: 0.5 * k, color: MUTED, gap: 0.3 * k}]]);
  const die0 = k => [[{str: 'DIE 0', size: 0.8 * k, weight: 700, track: 0.06}]];
  const mk = small ? (fit([dtd], MX - ML, 4, 1.3, 0.7, 0.14) || {k: 0.7}).k : 1;
  const A = layout(dtd(mk), 0.14), D0 = layout(die0(mk));
  const ta = tl(0.5), ax0 = BOUNDS.x0 - 0.25, ax1 = Math.max(ML + 0.05, MX - Math.max(A.w, D0.w) - 0.35);
  line(ax0, hz, ax1 + 0.3, hz, ta, ta + 0.02, {w: PEN.med});
  poly([[ax1, hz], [ax1 + 0.5, hz - 0.22], [ax1 + 0.5, hz + 0.22]], ta + 0.02);
  group(() => {
    block(die0(mk), MX, hz - 0.3 - D0.h / 2, ta + 0.02, {align: 'right', mask: false});
    block(dtd(mk), MX, hz + 0.35 + A.h / 2, ta + 0.03, {align: 'right', mask: false, lead: 0.14});
  });
  // SM ARRAY inside the die, in the open west end of the crossbar band between pods A and B, west of CROSSBAR, so it
  // draws with the die and breaks no tile; a short leader up and one down to a dot in the GPC tile on either side
  const sma = k => [[{str: 'SM ARRAY', size: 0.85 * k, weight: 700, track: 0.04}], [{str: 'SM 阵列', size: small ? FLOOR : 0.6 * k, color: MUTED}]];
  const bz0 = ROWS[1].z1, bz1 = ROWS[2].z0, sx0 = westWall + 0.15, sx1 = -crossW / 2 - 0.5, ts = tl(0.38);
  const sf = fit([sma], sx1 - sx0 - 0.3, bz1 - bz0 - 0.36, small ? K : 1.2, 0.6, 0.12) || {lines: sma(0.6), B: layout(sma(0.6), 0.12)};
  const scx = (sx0 + sx1) / 2, scz = (bz0 + bz1) / 2, dxs = scx - sf.B.w / 2 + 0.35;
  block(sf.lines, scx, scz, ts, {lead: 0.12, pad: 0.06});
  for (const [from, to] of [[scz - sf.B.h / 2 - 0.1, bz0 - 0.5], [scz + sf.B.h / 2 + 0.1, bz1 + 0.5]]) {
    line(dxs, from, dxs, to, ts + 0.01, ts + 0.03, {w: PEN.thin});
    poly(arcPts(dxs, to, 0.11, 0, 2 * PI, 12), ts + 0.03);
  }
  yield ['die: west labels', pen];
  // the east edge, from outside it: NVLink, PCIe and the CPU link along the edge, in the strip before the notes
  // column; the engines beside their column
  const nvl = k => [[{str: 'NVLINK', size: 1.1 * k, weight: 700, track: 0.04}, {str: 'PCIE · CPU LINK', size: small ? Math.max(FLOOR, 0.52 * k) : 0.52 * k, color: MUTED, gap: 0.35 * k}]];
  const eng = k => [[{str: 'ENGINES', size: 0.7 * k, weight: 600, track: 0.06}, {str: '引擎', size: 0.56 * k, font: SANS, color: MUTED, gap: 0.25 * k}]];
  const nx0 = BOUNDS.x1 + 0.3, nx1 = COL.rule - 0.3, nf = fit([nvl], len, nx1 - nx0 - 0.2, small ? K : 1, 0.7) || {lines: nvl(0.7)};
  block(nf.lines, (nx0 + nx1) / 2, hz, tl(0.58), {rotate: UP, mask: false});
  if (small) {
    const ex0 = ROW_X1 + 0.1, ex1 = cduW - 0.1, g = fit([eng], 12, ex1 - ex0 - 0.24, K, 1) || {lines: eng(1)};
    block(g.lines, (ex0 + ex1) / 2, CDUS[4].z, tl(0.66), {rotate: UP});
  } else block(eng(1), ROW_X1 + 0.8, CDUS[4].z, tl(0.66), {rotate: UP});
  // the south band's labels, as on the north: HBM PHY centred on each stack, MC in each controller
  stacks.forEach(({sx, x0, x1}, h) => {
    const zone = SB.phy - SB.lanes - 0.12, p = fit([phyL], x1 - x0 - 0.6, zone - 0.24, small ? K : 1, 0.5) || {lines: phyL(0.6)};
    block(p.lines, sx, SB.zp + 0.06 + zone / 2, tl(0.7 + h * 0.06));
    const m = small ? {lines: [[{str: 'MC', size: FLOOR, ...lab}]]} : fit([mcL], sx - x0 - 0.7, SB.mc - 0.24, 1, 0.4) || {lines: mcL(0.6)};
    block(m.lines, (x0 + sx) / 2, SB.zm + SB.mc / 2, tl(0.72 + h * 0.06));
    block(m.lines, (sx + x1) / 2, SB.zm + SB.mc / 2, tl(0.74 + h * 0.06));
  });
  yield ['die: east labels', pen];

  yield* frameSteps(pen, {
    small, border: P.border, sheet: P.sheet, sheetNo: 'C-301', status: 'ILLUSTRATIVE',
    // (on a desktop the view's title, under the drawing, is below the frame while the camera is on the die: it draws
    // last, once the camera has stopped, after the rest of the sheet (scene.js holds the drawing at 0.97 until then; the
    // title block's last fields, at st(0.74) + 0.09, are in by 0.95). On a phone it is in the frame and draws with the rest
    viewAt: small ? null : 0.975,
    title: 'GPU DIE 1 · FLOOR PLAN', titleZh: '一颗 GPU 裸片 · 示意版图', scale: 'NTS',
    view: 'GPU DIE 1 · FLOOR PLAN', viewSub: [{str: 'ILLUSTRATIVE', size: 0.6, weight: 600, color: MUTED, track: 0.06}, {str: '· 示意 · NOT TO SCALE', size: 0.56, color: MUTED, gap: 0.2}],
    // the die sheet's own history: the GPC labels became SM arrays, then the key plan and notes came in
    revs: ['First issue', 'SM arrays', 'Key plan, notes', 'Lettering'],
    orient: (t0, t1) => {
      // key plan: the package, its two dies and eight HBM stacks, this die toned (measured in millimetres)
      const k = 2.6 / 76, cx = COL.x0 + 1.35, cz = COL.orient + 0.55, X = v => cx + v * k, Z = v => cz + v * k;
      rect(X(-38), Z(-38), X(38), Z(38), t0, t0 + 0.02, {w: PEN.thin});
      for (const side of [-1, 1]) {
        const dx = side * 13.05;
        if (side > 0) pen.fill(X(dx - 12.75), Z(-15.75), X(dx + 12.75), Z(15.75), t0 + 0.02, t0 + 0.03, TONE);
        rect(X(dx - 12.75), Z(-15.75), X(dx + 12.75), Z(15.75), t0 + 0.02, t0 + 0.03, {w: side > 0 ? PEN.heavy : PEN.thin});
        for (const kz of [-1, 1]) for (const kx of [-1, 1]) {
          const hx = dx + kx * 5.65, hz = kz * 22.7;
          rect(X(hx - 5.25), Z(hz - 5.75), X(hx + 5.25), Z(hz + 5.75), t0 + 0.03, t0 + 0.04, {w: PEN.hair});
        }
        text(side > 0 ? '1' : '0', X(dx), Z(0), t0 + 0.04, {size: 0.42, font: MONO, weight: 700, mask: false, pad: 0.02});
      }
      block([[{str: 'KEY PLAN', weight: 600, track: 0.06}], [{str: '封装示意', color: MUTED}], [{str: 'Not to scale', color: MUTED, track: 0.01}]], COL.x0 + 3.2, cz, t1, {align: 'left', mask: false, lead: 0.2});
    },
    legend: [
      [(x, z, t) => {rect(x - 0.3, z - 0.22, x + 0.3, z + 0.22, t, t + 0.01, {w: PEN.thin}); line(x - 0.3, z + 0.05, x + 0.3, z + 0.05, t, t, {w: PEN.hair});}, 'Compute block (SMs)'],
      [(x, z, t) => {rect(x - 0.4, z - 0.24, x + 0.4, z + 0.24, t, t + 0.01, {w: PEN.thin}); for (const u of [-0.2, 0.05]) for (const v of [-0.27, 0, 0.27]) rect(x + v - 0.1, z + u - 0.06, x + v + 0.1, z + u + 0.12, t, t + 0.01, {w: PEN.hair, color: MUTED});}, 'GPC: a cluster of SMs'],
      [(x, z, t) => {hatch(x - 0.4, z - 0.22, x + 0.4, z + 0.22, 0.16, t, t + 0.01, {w: PEN.hair, color: LIGHT}); rect(x - 0.4, z - 0.22, x + 0.4, z + 0.22, t, t + 0.01, {w: PEN.thin});}, 'L2 cache'],
      [(x, z, t) => {rect(x - 0.4, z - 0.22, x + 0.4, z + 0.22, t, t + 0.01, {w: PEN.thin}); for (let v = -0.3; v < 0.35; v += 0.15) line(x + v, z - 0.14, x + v, z + 0.14, t, t, {w: PEN.hair, color: MUTED});}, 'PHY, I/O on the edge'],
      [(x, z, t) => {rect(x - 0.4, z - 0.22, x + 0.4, z + 0.22, t, t + 0.01, {w: PEN.thin}); rect(x - 0.2, z - 0.1, x + 0.2, z + 0.1, t, t + 0.01, {w: PEN.hair});}, 'Engine'],
      [(x, z, t) => {line(x - 0.5, z - 0.08, x + 0.5, z - 0.08, t, t + 0.01, {w: 0.13}); line(x - 0.5, z + 0.18, x + 0.5, z + 0.18, t, t + 0.01, {w: PEN.thin, color: MUTED});}, 'Die edge, seal ring'],
    ],
    notesHead: 'NOTES',
    notes: [
      'Illustrative layout based on published architecture. The maker hasn’t published a floor plan.',
      'Two dies act as one GPU, joined by a 10 TB/s link along one edge.',
      'The two dies together are over 1,600 mm², about 800 each.',
      '160 SMs per GPU on the full chip (80 per die); reportedly 148 enabled on GB200. The number of blocks drawn is schematic.',
      'Eight HBM stacks per GPU, four per die. MC: memory controller.',
      'Engines: front end, decompression, RAS, security.',
    ],
  });
  return pen;
}

// The drawings run in steps (a generator yields between sections). drawPlan() and drawDie() run them in one go;
// drawPlanAsync() and drawDieAsync() queue the canvas work and do it in slices of about SLICE ms, waiting for pause()
// after each slice and each section, so the page can paint and handle input while a sheet draws:
// await drawPlanAsync(4096, {small}, () => new Promise(r => setTimeout(r, 0))).
const SLICE = 6;
const runSteps = gen => {let r; do r = gen.next(); while (!r.done); return r.value;};
const runStepsAsync = async (gen, pause) => {
  let r, pen = null;
  for (;;) {
    const t = performance.now();
    r = gen.next();
    pen = r.done ? r.value : r.value[1];
    const name = r.done ? 'last' : r.value[0];
    for (let d = t + SLICE; !pen.drain(d); d = performance.now() + SLICE) if (pause) await pause(name);
    if (r.done) break;
    if (pause) await pause(name);
  }
  pen.undefer();
  return r.value;
};
export const drawPlan = (px = 4096, opts = {}) => runSteps(planSteps(px, opts));
export const drawDie = (px = 2048, opts = {}) => runSteps(dieSteps(px, opts));
export const drawPlanAsync = (px = 4096, opts = {}, pause) => runStepsAsync(planSteps(px, {...opts, defer: true}), pause);
export const drawDieAsync = (px = 2048, opts = {}, pause) => runStepsAsync(dieSteps(px, {...opts, defer: true}), pause);

// ---------------------------------------------------------------------------------------------------------------
// The wipe at the cut runs west to east, from the die's sheet to the hall's, and switches each label whole, at its
// anchor. In the drawing (west of the notes column's rule) each label stays on its own side of the wipe: a hall label
// appears once the wipe has passed all of it (its east edge, rounded up), and a die label goes as the wipe reaches it
// (its west edge, rounded down), or sooner, with the first hall label its box (padded by pad metres) touches. In the
// notes column and the title strip there is no drawing under the words: there labels of the two sheets that touch,
// and the labels those touch in turn, switch together, at the centre of their joint box, so the column is never left
// blank and never shows both; the rest switch at their centres. Labels switching together get the same 8-bit value.
// Call once both sheets are drawn, before their label maps are packed: pairLabels(plan, die). It repaints both pens' .labels
// canvases (red = anchor, alpha = box, as before) and returns the number of die labels that go with a hall label.
export function pairLabels(plan, die, {pad = 0.15} = {}) {
  const P = plan.labelGroups, p = pad / SHEET.size;
  const hit = (a, b) => a.x0 - p < b.x1 && b.x0 - p < a.x1 && a.y0 - p < b.y1 && b.y0 - p < a.y1;
  const centre = g => Math.round((g.x0 + g.x1) / 2 * 255);
  const rule = (COL.rule - SHEET.x0) / SHEET.size, inCol = g => (g.x0 + g.x1) / 2 >= rule;
  // the column's clusters: hall and die labels joined by touching, each switching at the centre of its joint box
  const D = die.labelGroups, n = P.length, parent = [...P, ...D].map((_, i) => i);
  const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  P.forEach((h, i) => inCol(h) && D.forEach((g, j) => {if (inCol(g) && hit(h, g)) parent[find(i)] = find(n + j);}));
  const box = new Map();
  [...P, ...D].forEach((g, i) => {const r = find(i), b = box.get(r) || {x0: 1, x1: 0, size: 0}; box.set(r, {x0: Math.min(b.x0, g.x0), x1: Math.max(b.x1, g.x1), size: b.size + 1});});
  const cluster = i => {const b = box.get(find(i)); return b.size > 1 ? centre(b) : null;};
  const east = g => Math.min(255, Math.ceil(g.x1 * 255)), hallAnchor = (g, i) => (inCol(g) ? cluster(i) ?? centre(g) : east(g));
  let paired = 0;
  plan.relabel((g, i) => hallAnchor(g, i) / 255);
  die.relabel((g, j) => {
    if (inCol(g)) {const c = cluster(n + j); if (c != null) paired++; return (c ?? centre(g)) / 255;}
    // in the drawing: its own west edge, or the anchor of the first hall label it touches if that comes first
    const hall = Math.min(Infinity, ...P.filter(h => !inCol(h) && hit(h, g)).map(east)), west = Math.max(0, Math.floor(g.x0 * 255));
    if (hall <= west) paired++;
    return Math.min(west, hall) / 255;
  });
  return paired;
}
