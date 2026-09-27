import {gsap} from 'gsap';

/** Named curves, shared by the pure channels below and the tweens in
 *  Finale.jsx, so a beat never moves on two different speed graphs. */
export const EASE = {
  camera: 'expo.inOut',
  light: 'power2.inOut',
  cutIn: 'expo.out',
  cutOut: 'power3.in',
};

/** The edit list for everything scroll drives continuously: the camera, the
 *  world and the light. Each beat is [start, end] in finale scroll progress. */
export const CUT = {
  push: [0.08, 0.22],     // lean in on the thought
  focusIn: [0.14, 0.19],  // rack focus onto the title…
  focusOut: [0.21, 0.25], // …and back as the world breaks out
  form: [0.25, 0.42],     // the thought becomes a world, as the title leaves
  reveal: [0.25, 0.38],   // pull back to see all of it
  night: [0.29, 0.38],    // the night opens out of the world
  flight: [0.38, 0.50],   // down to the horizon
  dim: [0.45, 0.50],
  read: [0.50, 0.68],
  undim: [0.70, 0.75],
  back: [0.73, 0.84],     // up off the horizon
  dawn: [0.78, 0.86],     // the night closes back into the world
  collapse: [0.84, 0.93], // the world folds back into the thought
  settle: [0.86, 0.96],
};

/** Moments. A hit is scheduled by scroll but plays at its own tempo, like a
 *  keyframed layer: [on, off] in progress, off > 1 for a hit that never leaves. */
export const HIT = {
  invite: [0, 0.07],
  titleA: [0.14, 0.25],
  titleB: [0.205, 0.25],
  philosophy: [0.46, 0.72],
  details: [0.62, 0.72],
  ending: [0.93, 2],
};

/** -1 waiting, 0 on, 1 spent. */
export const hitState = (p, [on, off]) => (p < on ? -1 : p >= off ? 1 : 0);

const camera = gsap.parseEase(EASE.camera);
const light = gsap.parseEase(EASE.light);
const clamp01 = x => Math.max(0, Math.min(1, x));
const mix = (a, b, t) => a + (b - a) * t;
export const span = (p, [a, b]) => clamp01((p - a) / (b - a));

/** Every continuous value the finale needs at smoothed progress p. Pure, so the
 *  3D camera and the DOM read the same numbers and cannot drift apart. */
export function channels(p) {
  p = clamp01(Number.isFinite(p) ? p : 0);
  // Camera distance, as a multiple of the distance that frames the whole globe.
  const dist = mix(mix(mix(1.3, 0.5, camera(span(p, CUT.push))), 1, camera(span(p, CUT.reveal))), 1.3, camera(span(p, CUT.settle)));
  // Linear on purpose: every point eases its own flight, staggered, in the shader.
  const spread = span(p, CUT.form) * (1 - span(p, CUT.collapse));
  const night = camera(span(p, CUT.night)) * (1 - camera(span(p, CUT.dawn)));
  const flight = camera(span(p, CUT.flight)) * (1 - camera(span(p, CUT.back)));
  const dim = light(span(p, CUT.dim)) * (1 - light(span(p, CUT.undim)));
  const focus = light(span(p, CUT.focusIn)) * (1 - light(span(p, CUT.focusOut)));
  return {
    p, dist, spread, night, flight, dim, focus,
    // The lens widens while the camera travels, most at the fastest point.
    kick: Math.max(Math.sin(Math.PI * span(p, CUT.flight)), Math.sin(Math.PI * span(p, CUT.back))),
    // A gentle spiral out; a tighter one on the way home. It changes only while
    // every point is home, where the swirl has no effect.
    twist: p < CUT.collapse[0] ? 0.9 : 3.4,
    read: span(p, CUT.read),
    // The vignette belongs to the night: it waits until the ink has nearly covered
    // the paper, then relaxes into a spotlight for the reading.
    iris: span(night, [0.75, 1]) ** 2 * mix(0.8, 0.5, dim),
    grain: mix(0.05, 0.10, night),
  };
}
