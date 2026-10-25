// Authored scene position → physical wheel travel, both in viewport heights.
// Slow the whole journey after the mark starts sinking. The sinking and first
// camera turn get extra travel; later projects, paper, timeline and products
// keep a comparable wheel pace instead of rushing after the opening.
export const PACING = Object.freeze([
  [0, 0], [1, 2.4], [1.25, 3.45], [1.75, 5.2], [2.45, 6.65],
  // Two screens for the descent; generous turns between the reading frames.
  [2.95, 8.65], [3.5, 9.65], [3.95, 10.95], [4.55, 12.05],
  [5, 13.35], [5.6, 14.45], [6.05, 15.75], [6.6, 16.75],
  [7.3, 18.15], [9.9, 22.3], [14.2, 29.2],
  [15.8, 32.27], [16.15, 33.6], [16.25, 34.0], [16.42, 34.55], [16.7, 36.2], [18.05, 38.9], [18.55, 41.5], [20.1, 43.9], [20.65, 46.5],
  [22.55, 49.8], [23, 52.4], [24.65, 55.4], [25.1, 58.0], [26.85, 61.0], [28, 63.1], [28.8, 64.6],
  [29.3, 66.2], [31.2, 69.8],
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
  for (let n = 0; n < 32; n++) {
    const mid = (lo + hi) / 2;
    if (segment(mid, i) < r) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
