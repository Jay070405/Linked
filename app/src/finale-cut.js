import {gsap} from 'gsap';

/** Named curves, shared by the pure channels below and the timeline tweens in
 *  Finale.jsx, so a beat never moves on two different speed graphs. */
export const EASE = {
  camera: 'expo.inOut',
  light: 'power2.inOut',
  cutIn: 'expo.out',
  cutOut: 'expo.in',
  settle: 'power2.out',
};

/** The edit list. Every beat is [start, end] in finale scroll progress; beats
 *  overlap on purpose, like offset layers in a comp. See the design spec. */
export const CUT = {
  inviteOut: [0.07, 0.15],
  dive: [0.13, 0.40],
  titleIn: [0.17, 0.26],
  focusIn: [0.20, 0.27],
  focusOut: [0.34, 0.40],
  titleOut: [0.35, 0.42],
  irisClose: [0.37, 0.47],
  darkIn: [0.40, 0.48],
  depth: [0.47, 0.77],
  eyebrow: [0.48, 0.53],
  irisRelax: [0.48, 0.54],
  read: [0.51, 0.69],
  details: [0.62, 0.70],
  philOut: [0.71, 0.76],
  darkOut: [0.74, 0.84],
  retreat: [0.80, 0.96],
  ending: [0.90, 1.00],
};

const camera = gsap.parseEase(EASE.camera);
const light = gsap.parseEase(EASE.light);
const clamp01 = x => Math.max(0, Math.min(1, x));
const mix = (a, b, t) => a + (b - a) * t;
export const span = (p, [a, b]) => clamp01((p - a) / (b - a));

/** Every continuous value the finale needs at smoothed progress p. Pure, so the
 *  3D camera and the DOM read the same numbers and cannot drift apart. */
export function channels(p) {
  p = clamp01(Number.isFinite(p) ? p : 0);
  const approach = camera(span(p, CUT.dive));
  const retreat = camera(span(p, CUT.retreat));
  const close = approach * (1 - retreat);
  const lightsOn = light(span(p, CUT.darkOut));
  const dark = light(span(p, CUT.darkIn)) * (1 - lightsOn);
  // The iris shuts ahead of the cut, relaxes into a spotlight for the reading,
  // and opens with the returning light.
  const iris = light(span(p, CUT.irisClose)) * (1 - 0.4 * light(span(p, CUT.irisRelax))) * (1 - lightsOn);
  const focus = light(span(p, CUT.focusIn)) * (1 - light(span(p, CUT.focusOut)));
  const [d0, d1] = CUT.depth;
  const depth = light(span(p, [d0, d0 + 0.05])) * (1 - light(span(p, [d1 - 0.05, d1])));
  return {
    p, approach, retreat, close, dark, iris, focus, depth,
    read: span(p, CUT.read),
    halo: (1 - dark) * mix(0.55, 0.95, close),
    haloScale: 1 + 1.4 * close,
    grain: mix(0.05, 0.10, dark),
  };
}
