// Atelier (D2): the prototype's catalog, print check and pricing, copied from d2-atelier-prototype/src/artworks.json
// and src/model.ts (round 2, Oct 19 2026). The eight paintings are Jay's own; the pixel sizes are the original files'.
// atelier-model.test.mjs repeats the prototype's model checks (scripts/test.mjs) against this copy.

export const art = [
  {id: 'blue-hour', title: 'The Blue Hour', originalWidth: 4096, originalHeight: 2160},
  {id: 'quiet-gate', title: 'The Quiet Gate', originalWidth: 1386, originalHeight: 792},
  {id: 'spring', title: 'Where Spring Stays', originalWidth: 1760, originalHeight: 688},
  {id: 'clouds', title: 'Above the Clouds', originalWidth: 1760, originalHeight: 688},
  {id: 'between', title: 'Between Worlds', originalWidth: 755, originalHeight: 845},
  {id: 'return', title: 'A Place to Return', originalWidth: 1194, originalHeight: 834},
  {id: 'red-planet', title: 'Red Planet', originalWidth: 1456, originalHeight: 624},
  {id: 'signal', title: 'A Distant Signal', originalWidth: 1900, originalHeight: 1031},
];
/** Served by the embedded prototype build (public/proto/atelier/art). */
export const artSrc = id => `/proto/atelier/art/${id}.webp`;

export const sizes = [
  {id: '2x3', w: 3, h: 2, cost: 2.4}, {id: '3x5', w: 5, h: 3, cost: 4},
  {id: '5x7', w: 7, h: 5, cost: 7}, {id: '8x10', w: 10, h: 8, cost: 11},
  {id: '12x16', w: 16, h: 12, cost: 18}, {id: '18x24', w: 24, h: 18, cost: 26},
];
export const papers = [
  {id: 'matte', name: 'Studio matte', extra: 0},
  {id: 'cotton', name: 'Cotton rag', extra: 4},
];
export function dimensions(a, s) { return a.originalWidth >= a.originalHeight ? {w: s.w, h: s.h} : {w: s.h, h: s.w}; }
/** Full artwork fits inside a minimum 1/4-inch white border. No crop or upscaling. */
export function printCheck(a, s) {
  const d = dimensions(a, s);
  const inchesPerPixel = Math.min((d.w - .5) / a.originalWidth, (d.h - .5) / a.originalHeight);
  const dpi = 1 / inchesPerPixel;
  return {dpi: Math.floor(dpi), ok: dpi >= 300, ...d};
}
/** The prototype's own sentence for a size, from its print-quality ruler. */
export const checkSentence = (a, s) => {
  const r = printCheck(a, s);
  return `${r.w} × ${r.h} in · ${r.dpi} dpi. ${r.ok ? 'Sharp at this size, with the full artwork and white border.' : 'Requires 300 dpi. Choose a smaller size or upload a larger original.'}`;
};
export const largestSharp = a => sizes.filter(s => printCheck(a, s).ok).at(-1);
export const money = n => new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 2, minimumFractionDigits: Number.isInteger(Math.round(n * 100) / 100) ? 0 : 2}).format(n);
export const fees = price => Math.round((price * .08 + .3) * 100) / 100;
/** Cover the change in print cost after the 8% fee, retaining the same earnings to the cent. */
export const variantPrice = (base, costDelta) => Math.round((base + costDelta / .92) * 100) / 100;
/** The price screen's breakdown: production cost of the print (size + paper), the fee, and what the artist keeps. */
export function earnings(price, size, paper) {
  const printCost = size.cost + paper.extra, fee = fees(price);
  return {price, printCost, fee, keep: Math.round((price - printCost - fee) * 100) / 100};
}
