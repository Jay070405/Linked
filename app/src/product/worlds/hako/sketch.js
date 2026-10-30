/* The sketch a block shows before it is built: a wireframe of the block's own layout, measured from the real content
   (each heading and text line as a stroke as long as its words, each picture as a crossed box, each button as a pill),
   drawn with a seeded wobble so the same block always gets the same hand. */

/** A small seeded random generator (the same block draws the same sketch every time). */
export function seeded(seed) {
  let s = (seed >>> 0) || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

const f = n => Math.round(n * 10) / 10;

/** One hand-drawn stroke from (x1, y1) to (x2, y2): a slight bow and uneven ends. */
export function stroke(x1, y1, x2, y2, rand, j = 1.2) {
  const mx = (x1 + x2) / 2 + (rand() - 0.5) * j * 2.4, my = (y1 + y2) / 2 + (rand() - 0.5) * j * 2.4;
  return `M${f(x1 + (rand() - 0.5) * j)} ${f(y1 + (rand() - 0.5) * j)}Q${f(mx)} ${f(my)} ${f(x2 + (rand() - 0.5) * j)} ${f(y2 + (rand() - 0.5) * j)}`;
}

/** A box drawn as four strokes that overshoot at the corners, the way a pen draws one. */
export function box(x, y, w, h, rand, j = 1.4) {
  const o = () => 1.5 + rand() * 4;
  return stroke(x - o(), y, x + w + o(), y, rand, j) + stroke(x + w, y - o(), x + w, y + h + o(), rand, j)
    + stroke(x + w + o(), y + h, x - o(), y + h, rand, j) + stroke(x, y + h + o(), x, y - o(), rand, j);
}

const TEXT = 'h1,h2,h3,h4,h5,p,li,dt,dd,figcaption,blockquote,pre,th,td,label,summary';
const MEDIA = 'img,video,canvas,picture,[data-sk="media"]';
const PILL = 'button,input,select,textarea,a.hw-btn,[data-sk="pill"]';
const FRAME = '[data-sk="box"]';

/** The lines an element's text sits on: one rect per line, as wide as the words on it (from a Range, so wrapped
    text gives one stroke per wrapped line). */
function lines(el, base) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const out = [];
  for (const r of range.getClientRects()) {
    if (r.width < 2 || r.height < 2) continue;
    const cy = r.top + r.height / 2;
    const line = out.find(l => Math.abs(l.cy - cy) < Math.max(4, r.height * 0.4));
    if (line) { line.l = Math.min(line.l, r.left); line.r = Math.max(line.r, r.right); line.h = Math.max(line.h, r.height); }
    else out.push({cy, l: r.left, r: r.right, h: r.height});
  }
  range.detach?.();
  return out.map(l => ({x: l.l - base.left, y: l.cy - base.top, w: l.r - l.l, h: l.h}));
}

/** Measure a block's content (inside `inner`) relative to `block`, as a list of marks to draw. The content may be
    hidden by the build window: it sits in place (the window's two transforms cancel out), so its rects are true. */
export function measure(block, inner) {
  const base = block.getBoundingClientRect();
  const marks = [], taken = [];
  for (const el of inner.querySelectorAll(`${TEXT},${MEDIA},${PILL},${FRAME},svg`)) {
    if (taken.some(t => t.contains(el)) || el.closest('[data-sk="skip"]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const x = r.left - base.left, y = r.top - base.top;
    if (el.matches(FRAME)) { marks.push({k: 'frame', x, y, w: r.width, h: r.height}); continue; }
    if (el.matches(MEDIA) || (el.tagName.toLowerCase() === 'svg' && r.width > 56 && r.height > 40)) {
      marks.push({k: 'media', x, y, w: r.width, h: r.height}); taken.push(el); continue;
    }
    if (el.tagName.toLowerCase() === 'svg') { taken.push(el); continue; }     // an icon: the line it sits on carries it
    if (el.matches(PILL)) { marks.push({k: 'pill', x, y, w: r.width, h: r.height}); taken.push(el); continue; }
    const fs = parseFloat(getComputedStyle(el).fontSize) || 16;
    const head = /^h[1-5]$/i.test(el.tagName);
    for (const l of lines(el, base)) marks.push({k: head ? 'head' : 'text', x: l.x, y: l.y, w: l.w, fs});
    taken.push(el);
  }
  return {w: base.width, h: base.height, marks};
}

/** The SVG path data for a measured sketch, split by weight: [thin, heavy]. */
export function draw(sketch, seed) {
  const rand = seeded(seed);
  let thin = '', heavy = [];
  for (const m of sketch.marks) {
    if (m.k === 'text') thin += stroke(m.x + 1, m.y, m.x + Math.max(8, m.w - 2), m.y, rand, 1);
    else if (m.k === 'head') heavy.push({d: stroke(m.x + 2, m.y, m.x + Math.max(10, m.w - 4), m.y, rand, 1.4), w: Math.min(10, Math.max(3, m.fs * 0.16))});
    else if (m.k === 'media') thin += box(m.x + 2, m.y + 2, m.w - 4, m.h - 4, rand) + stroke(m.x + 8, m.y + 8, m.x + m.w - 8, m.y + m.h - 8, rand, 2) + stroke(m.x + m.w - 8, m.y + 8, m.x + 8, m.y + m.h - 8, rand, 2);
    else if (m.k === 'pill') thin += box(m.x + 1, m.y + 1, m.w - 2, m.h - 2, rand, 1) + stroke(m.x + m.w * 0.28, m.y + m.h / 2, m.x + m.w * 0.72, m.y + m.h / 2, rand, 0.8);
    else if (m.k === 'frame') thin += box(m.x + 1, m.y + 1, m.w - 2, m.h - 2, rand, 1.2);
  }
  return {thin, heavy};
}
