import {useSyncExternalStore} from 'react';
import {LEGS, WAYPOINTS, TOTAL_FEET} from '../../v2/data/l100-route';
import {L} from '../../i18n';

/* The delivery run's geometry: where the courier is after walking `feet` of the route, which way they face, and
   whether they are upstairs. Positions come from the prototype's own route (v2/data/l100-route.js, copied from
   d3-last-100-feet-prototype/src/route.ts); one plan unit is about a foot. The displayed distances are the
   prototype's leg lengths (45, 125, 25 and 95 ft, 290 ft in all); the drawn legs are close to them, not equal, so
   each leg is walked in proportion. */

export {TOTAL_FEET};
const segLens = pts => pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
const LEG_GEOM = LEGS.map(l => { const lens = segLens(l.pts); return {lens, len: lens.reduce((a, b) => a + b, 0)}; });
/** feet walked when the courier reaches waypoint i (0 = the curb) */
export const AT_WAYPOINT = WAYPOINTS.map((_, i) => LEGS.slice(0, i).reduce((s, l) => s + l.feet, 0));
/** the whole route as one path, and its drawn length (plan units) */
export const ROUTE_D = LEGS.map((l, i) => (i ? l.d.replace(/^M[\d.]+ [\d.]+ ?/, 'L') : l.d)).join(' ')
  .replace(/L([VH])/g, '$1');
export const ROUTE_LEN = LEG_GEOM.reduce((s, g) => s + g.len, 0);
/** the stairs: the first stretch of the last leg climbs one floor */
const STAIR_UNITS = 34;

/** {x, y, angle (deg, 0 = facing north), drawn (plan units along the path), up (0..1, how far up the stairs)} */
export function walkAt(feet) {
  const f = Math.max(0, Math.min(TOTAL_FEET, feet));
  let i = 0, start = 0;
  while (i < LEGS.length - 1 && f > start + LEGS[i].feet) { start += LEGS[i].feet; i++; }
  const t = LEGS[i].feet ? (f - start) / LEGS[i].feet : 0;
  const {lens, len} = LEG_GEOM[i], pts = LEGS[i].pts;
  let along = t * len, drawn = LEG_GEOM.slice(0, i).reduce((s, g) => s + g.len, 0) + along, k = 0;
  while (k < lens.length - 1 && along > lens[k]) { along -= lens[k]; k++; }
  const a = pts[k], b = pts[k + 1], u = lens[k] ? Math.min(1, along / lens[k]) : 0;
  const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90;
  const climbed = i === 3 ? Math.min(1, (t * len) / STAIR_UNITS) : i > 3 ? 1 : 0;
  return {x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, angle, drawn, up: climbed, leg: i};
}

/** which waypoint the courier has reached (or is standing at) for a distance */
export const waypointFor = feet => AT_WAYPOINT.reduce((w, at, i) => (feet >= at - .5 ? i : w), 0);

/* ---------- the hot bag ----------
   A small store the HUD reads and the modules write: warmth from 1 (just picked up) toward 0. Illustrative only:
   it cools while the visitor waits at the locked gate and when "Find the door" sends the courier the wrong way. */
let bagState = {warmth: 1, note: null, notes: [], delivered: false, gateSeconds: null};
const subs = new Set();
const emit = () => subs.forEach(fn => fn());
export const bag = {
  get: () => bagState,
  reset() { bagState = {warmth: 1, note: null, notes: [], delivered: false, gateSeconds: null}; emit(); },
  cool(amount, note) {
    const warmth = Math.max(.2, bagState.warmth - amount);
    if (warmth === bagState.warmth && note === bagState.note) return;
    const notes = note && !bagState.notes.includes(note) ? [...bagState.notes, note] : bagState.notes;
    bagState = {...bagState, warmth, note: note ?? bagState.note, notes}; emit();
  },
  set(patch) { bagState = {...bagState, ...patch}; emit(); },
  subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
};
export const useBag = () => useSyncExternalStore(bag.subscribe, bag.get, bag.get);
const WARMTH = {hot: L('Hot', '热乎'), warm: L('Warm', '温热'), cooling: L('Cooling', '在变凉'), cold: L('Lukewarm', '快凉了')};
/** How warm the bag is, in both languages. */
export const warmthWord = w => WARMTH[w >= .85 ? 'hot' : w >= .62 ? 'warm' : w >= .42 ? 'cooling' : 'cold'];
/** Why the bag cooled: the notes the store keeps (in English), in both languages. */
export const NOTE_WORDS = {'Waited at the gate': L('Waited at the gate', '在大门口等了一会儿'), 'Garage detour': L('Garage detour', '绕去了车库'), 'Wrong turn': L('Wrong turn', '走错了路')};
