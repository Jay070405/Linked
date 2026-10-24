import {ASSETS} from './media';

/* Sun mode (site-spec/WORLD-ARDEN-V4.md §6): the outside views of the lenses at a few tints, from
   renders/sun/hero-tint-<percent>.png (scripts/build-arden-assets.mjs), lightest first. Until they exist the list is
   empty and nothing that needs them is shown. */

export const SUN = (ASSETS.sun?.stills || []).filter(name => /hero-tint-\d+$/.test(name))
  .map(name => ({name, tint: +(name.match(/tint-(\d+)/)?.[1] ?? 0)}))
  .sort((a, b) => a.tint - b.tint);

/** How much of the i-th tint render to show for a tint (percent): a crossfade between the two around it. */
export function sunMix(list, pct, i) {
  const t = list.map(x => x.tint);
  if (!t.length) return 0;
  if (pct <= t[0]) return i === 0 ? 1 : 0;
  if (pct >= t[t.length - 1]) return i === t.length - 1 ? 1 : 0;
  const j = t.findIndex((v, k) => pct >= v && pct <= t[k + 1]);
  const f = (pct - t[j]) / (t[j + 1] - t[j]);
  return i === j ? 1 : i === j + 1 ? f : 0;
}
