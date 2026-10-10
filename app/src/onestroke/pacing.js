// Authored scene position → physical wheel travel, both in viewport heights.
// Slow the whole journey after the mark starts sinking. The sinking and first
// camera turn get extra travel; later projects, paper, timeline and worlds
// keep a comparable wheel pace instead of rushing after the opening.
export const PACING = Object.freeze([
  [0, 0], [1, 2.4], [1.25, 3.45], [1.75, 5.2], [2.45, 6.65], [2.95, 7.9],
  [7.3, 15.5], [9.9, 19.65], [14.2, 26.55], [16.9, 31.7],
  [21.3, 38.75], [23.2, 41.4],
].map(point => Object.freeze(point)));
export const TOTAL = PACING.at(-1)[0];
export const SCROLL_TOTAL = PACING.at(-1)[1];

const rates = PACING.slice(1).map(([s, r], i) =>
  (r - PACING[i][1]) / (s - PACING[i][0]));
// Positive harmonic tangents keep the map monotone and its speed continuous
// at every boundary, instead of suddenly changing wheel sensitivity there.
const slopes = PACING.map((_, i) => i === 0 ? rates[0] :
  i === rates.length ? rates.at(-1) : 2 / (1 / rates[i - 1] + 1 / rates[i]));

function segment(s, i) {
  const [a, ra] = PACING[i], [b, rb] = PACING[i + 1];
  const h = b - a, t = (s - a) / h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * ra + (t3 - 2 * t2 + t) * h * slopes[i]
    + (-2 * t3 + 3 * t2) * rb + (t3 - t2) * h * slopes[i + 1];
}

export function toScroll(s) {
  if (s <= 0) return s * slopes[0];
  if (s >= TOTAL) return SCROLL_TOTAL + (s - TOTAL) * slopes.at(-1);
  const i = PACING.findIndex(([next]) => next > s) - 1;
  return segment(s, i);
}

export function toJourney(r) {
  if (r <= 0) return r / slopes[0];
  if (r >= SCROLL_TOTAL) return TOTAL + (r - SCROLL_TOTAL) / slopes.at(-1);
  const i = PACING.findIndex(([, next]) => next > r) - 1;
  let lo = PACING[i][0], hi = PACING[i + 1][0];
  for (let n = 0; n < 26; n++) {
    const mid = (lo + hi) / 2;
    if (segment(mid, i) < r) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
