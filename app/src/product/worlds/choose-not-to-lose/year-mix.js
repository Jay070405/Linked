// "Roll your year" (D4 world, the receipt). A year of covered bills is drawn from an ILLUSTRATIVE mix, then every plan's
// total for that year comes from the prototype's tested cost model (v2/data/cntl-model.js, imported, not copied). So
// the bills are made up, and the arithmetic on them is real: which plan is cheapest in a drawn year, and the fact that
// Plan B never is, follow from the plan terms alone.
//
// The mixes are not claims data, a forecast, or a statement about anyone's health. They only exist to show that the
// cheapest plan moves with the year while a dominated plan can't win in any year. USD in integer cents, as the model.
import {cost, dominator, plans} from '../../v2/data/cntl-model.js';

/** Three made-up mixes. parts: shares of years that are zero, log-normal around a median (spread = sigma of ln), or
    flat between two amounts. `words` is what the page prints under the button, so the mix is never hidden. Labels and
    words are {en, zh} (the page's L() shape, written out so this file stays plain JS for the tests). */
export const MIXES = [
  {id: 'light', label: {en: 'Mostly light years', zh: '多数年份花得少'},
    words: {en: '1 year in 4 with no covered bills; the rest mostly a few hundred dollars.', zh: '每 4 年里有 1 年没有承保医疗费用，其余年份大多只有几百美元。'},
    parts: [{share: .25, kind: 'zero'}, {share: .75, kind: 'log', median: 600, spread: 1}]},
  {id: 'mixed', label: {en: 'A mix', zh: '有多有少'},
    words: {en: '1 year in 8 with no covered bills, most a few hundred to a few thousand dollars, and 3 in 100 between $20,000 and $90,000.', zh: '每 8 年里有 1 年没有承保医疗费用，多数年份在几百到几千美元之间，每 100 年里有 3 年在 $20,000 到 $90,000 之间。'},
    parts: [{share: .12, kind: 'zero'}, {share: .85, kind: 'log', median: 1400, spread: 1.2}, {share: .03, kind: 'flat', min: 20000, max: 90000}]},
  {id: 'heavy', label: {en: 'Mostly heavy years', zh: '多数年份花得多'},
    words: {en: 'Most years several thousand dollars, and 1 in 5 between $20,000 and $90,000.', zh: '多数年份要几千美元，每 5 年里有 1 年在 $20,000 到 $90,000 之间。'},
    parts: [{share: .03, kind: 'zero'}, {share: .77, kind: 'log', median: 6000, spread: 1}, {share: .2, kind: 'flat', min: 20000, max: 90000}]},
];
export const DEFAULT_MIX = 'mixed';
const CAP = 200000;   // dollars; keeps a log-normal tail from printing absurd years

/** Standard normal from two uniforms (Box-Muller). */
const normal = rand => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());

/** One year's covered bills, in cents (whole dollars), from a mix. `rand` returns [0, 1). */
export function drawBills(mixId = DEFAULT_MIX, rand = Math.random) {
  const mix = MIXES.find(m => m.id === mixId) || MIXES[1];
  let u = rand(), part = mix.parts.at(-1);
  for (const p of mix.parts) { if (u < p.share) { part = p; break; } u -= p.share; }
  let dollars = 0;
  if (part.kind === 'log') dollars = part.median * Math.exp(part.spread * normal(rand));
  else if (part.kind === 'flat') dollars = part.min + (part.max - part.min) * rand();
  return Math.round(Math.min(CAP, Math.max(0, dollars))) * 100;
}

/** Every plan's year at `bills` cents, and which plans are cheapest (all of them on an exact tie). */
export function priceYear(bills) {
  const rows = plans.map(p => ({id: p.id, name: p.name, ...cost(p, bills)}));
  const low = Math.min(...rows.map(r => r.total));
  return {bills, rows, low, winners: rows.filter(r => r.total === low).map(r => r.id)};
}

/** Roll one year. */
export const rollYear = (mixId, rand = Math.random) => priceYear(drawBills(mixId, rand));

/** Cheapest-plan tally over n rolled years. */
export function simulate(n, mixId, rand = Math.random) {
  const tally = Object.fromEntries(plans.map(p => [p.id, 0]));
  const years = [];
  for (let i = 0; i < n; i++) {
    const y = rollYear(mixId, rand);
    y.winners.forEach(id => { tally[id] += 1; });
    years.push(y);
  }
  return {tally, years};
}

/** The plan that beats Plan B on every term, from the model's own all-spend test. */
export const bDominator = () => dominator(plans.find(p => p.id === 'b'));

/** A small seeded generator (mulberry32), for tests and repeatable captures. */
export function seeded(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
