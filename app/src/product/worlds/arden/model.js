/* The arithmetic behind the Arden page, as pure functions (model.test.mjs runs them in Node). Inputs are the rows copied
   from ARCHITECTURE.md into content.js; nothing here invents a number. */

/** Sum of mass rows by group, in the groups' order, and the total. */
export function massByGroup(rows, groups) {
  const sums = groups.map(g => ({...g, g: round2(rows.filter(r => r[0] === g.id).reduce((s, r) => s + r[2], 0))}));
  return {groups: sums, total: round2(sums.reduce((s, g) => s + g.g, 0))};
}
export const round2 = v => Math.round(v * 100) / 100;

/** ARCHITECTURE.md's power table: average draw (mW) and runtime (h) from usable energy. */
export function power(rows, battery) {
  const avg = rows.reduce((s, r) => s + r[3], 0);
  const usable = battery.wh * battery.usable;
  return {avgMw: avg, usableWh: round2(usable * 1000) / 1000, hours: usable / (avg / 1000), at80: usable * .8 / (avg / 1000)};
}

/** The indicator's brightness for an ambient light level: a log–log line through the architecture's range ends
    (30 cd/m² at 10 lux, 150 at 1,000, 1,500 at 10,000, 6,000 at 100,000). The ends are ARCHITECTURE.md's Estimate
    ranges; the points in between are an illustration of a tuning curve, labelled as such on the page. */
export const CURVE = [[10, 30], [1000, 150], [10000, 1500], [100000, 6000]];
export function indicatorCdm2(lux) {
  const x = Math.log10(Math.max(CURVE[0][0], Math.min(CURVE.at(-1)[0], lux)));
  for (let i = 1; i < CURVE.length; i++) {
    const [l0, c0] = CURVE[i - 1], [l1, c1] = CURVE[i];
    if (x <= Math.log10(l1)) {
      const u = (x - Math.log10(l0)) / (Math.log10(l1) - Math.log10(l0));
      const v = 10 ** (Math.log10(c0) + u * (Math.log10(c1) - Math.log10(c0)));
      return Math.min(CURVE.at(-1)[1], Math.max(CURVE[0][1], Math.round(v * 1000) / 1000));
    }
  }
  return CURVE.at(-1)[1];
}
/** Slider position (0…1) ↔ lux, on a log scale from 10 to 100,000. */
export const luxAt = t => 10 ** (1 + 4 * Math.max(0, Math.min(1, t)));
export const tAt = lux => (Math.log10(lux) - 1) / 4;

/** A tidy number for the page: 1,500 / 150 / 30 / 4.6. */
export function nice(v) {
  if (v >= 1000) return (Math.round(v / 100) * 100).toLocaleString('en-US');
  if (v >= 100) return String(Math.round(v / 10) * 10);
  if (v >= 10) return String(Math.round(v));
  return v.toFixed(1);
}

/** A dimension line from dimensions.json: its two anchor points (px in the view's image), and the length in mm. */
export function dimension(view, key) {
  const a = view?.anchors_px?.[key];
  if (!a) return null;
  const [[x1, y1], [x2, y2]] = a;
  return {x1, y1, x2, y2, mm: Math.hypot(x2 - x1, y2 - y1) / view.px_per_mm};
}
