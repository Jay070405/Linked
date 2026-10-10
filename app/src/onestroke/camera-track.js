import {toScroll} from './pacing.js';

// Interpolate in wheel distance, with shared tangents at each camera anchor.
// Component-wise monotone tangents keep the reading frames from overshooting.
export function createScrollCameraTrack(keys) {
  const points = keys.map(k => ({r: toScroll(k.s), v: [...k.pos.toArray(), ...k.look.toArray()]}));
  const spans = points.slice(1).map((p, i) => p.r - points[i].r);
  const rates = spans.map((h, i) => points[i].v.map((v, c) => (points[i + 1].v[c] - v) / h));
  const tangents = points.map((_, i) => Array.from({length: 6}, (_, c) => {
    // Adjacent choreography eases to rest at either end of this track.
    if (i === 0 || i === points.length - 1) return 0;
    const a = rates[i - 1][c], b = rates[i][c];
    if (a * b <= 0) return 0;
    const w1 = 2 * spans[i] + spans[i - 1], w2 = spans[i] + 2 * spans[i - 1];
    return (w1 + w2) / (w1 / a + w2 / b);
  }));
  const value = new Array(6);
  return (s, pos, look) => {
    const r = Math.max(points[0].r, Math.min(points.at(-1).r, toScroll(s)));
    let i = points.findIndex(p => p.r > r) - 1;
    if (i < 0) i = r >= points.at(-1).r ? points.length - 2 : 0;
    const a = points[i], b = points[i + 1], h = spans[i], t = (r - a.r) / h;
    const t2 = t * t, t3 = t2 * t;
    for (let c = 0; c < 6; c++) value[c] =
      (2 * t3 - 3 * t2 + 1) * a.v[c] + (t3 - 2 * t2 + t) * h * tangents[i][c]
      + (-2 * t3 + 3 * t2) * b.v[c] + (t3 - t2) * h * tangents[i + 1][c];
    pos.set(value[0], value[1], value[2]); look.set(value[3], value[4], value[5]);
  };
}

const ease = t => { t = Math.max(0, Math.min(1, t)); return Math.max(0, Math.min(1, t * t * t * (t * (t * 6 - 15) + 10))); };
export function projectOpacity(s, [start, end], caption = false) {
  const enterStart = start - (caption ? .22 : .5), enterEnd = start + (caption ? .04 : -.04);
  const exitStart = end + .04, exitEnd = end + (caption ? .38 : .5);
  return ease((s - enterStart) / (enterEnd - enterStart))
    * (1 - ease((s - exitStart) / (exitEnd - exitStart)));
}
