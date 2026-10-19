// Last 100 Feet (D3): the fictional complex's geometry, the five photo steps and the gate code, copied from
// d3-last-100-feet-prototype/src/route.ts, src/photos.ts and src/screens/courier/stepData.ts (round 2, Oct 19 2026).
// One plan unit is roughly one foot; north is up, Elm St runs along the bottom, Cypress Ave along the left.
// The photos are AI-generated illustrative images of a fictional complex, served by the embedded prototype build.
// l100-route.test.mjs checks this copy against the prototype's numbers.

/** The basemap the case page draws on (public/assets/product/last-100-feet/plan-base.webp, from
    scripts/capture-last-100-feet-plan.mjs): this rectangle of plan units, at PLAN_PX css px per plan unit x 2. */
export const BASE = {x: -40, y: 40, w: 460, h: 520};

export const WAYPOINTS = [
  {key: 'park', at: {x: 206, y: 463}, name: 'Elm St curb', glyph: 'P'},
  {key: 'gate', at: {x: 226, y: 431}, name: 'Elm St gate', glyph: 'gate'},
  {key: 'building', at: {x: 248, y: 322}, name: 'Building 4', glyph: '4'},
  {key: 'stairs', at: {x: 248, y: 292}, name: 'Stairs', glyph: 'stairs'},
  {key: 'door', at: {x: 254, y: 198}, name: 'Door 214', glyph: '214'},
];
/** Leg i connects waypoint i to waypoint i + 1. */
export const LEGS = [
  {d: 'M206 455 V441 H226 V431', pts: [{x: 206, y: 455}, {x: 206, y: 441}, {x: 226, y: 441}, {x: 226, y: 431}], feet: 45},
  {d: 'M226 431 V346 L248 324', pts: [{x: 226, y: 431}, {x: 226, y: 346}, {x: 248, y: 324}], feet: 125},
  {d: 'M248 324 V292', pts: [{x: 248, y: 324}, {x: 248, y: 292}], feet: 25},
  {d: 'M248 292 V198 H254', pts: [{x: 248, y: 292}, {x: 248, y: 198}, {x: 254, y: 198}], feet: 95},
];
export const TOTAL_FEET = LEGS.reduce((s, l) => s + l.feet, 0);
/** Where map apps drop this address: the residents-only garage gate on Cypress Ave. */
export const GARAGE_GATE = {x: 78, y: 86};
export const GATE = WAYPOINTS[1].at;
/** Gate code geofence, about 50 m. */
export const GEOFENCE_FT = 160;
export const ADDRESS = {complex: 'Jacaranda Court', street: '1450 Elm St', unit: '214', resident: 'Dana', code: '4721', callBox: '214'};
/** The prototype's hold and reveal timings (components/ui.tsx HoldButton, screens/courier/StepCard.tsx). */
export const HOLD_MS = 900, REVEAL_SECONDS = 20;

const PHOTO = '/proto/last-100-feet/photos/';
/** The five cards a courier follows, one per waypoint, with the resident's photo for each. */
export const STEPS = [
  {key: 'park', title: 'Elm St stop', instr: 'Park by the olive tree, about 40 ft before the gate.', photo: `${PHOTO}curb.webp`, focus: '46% 60%',
    alt: 'Curb on Elm St in front of the pedestrian gate, olive tree on the left, red curb on the right'},
  {key: 'gate', title: 'Elm St gate', instr: 'Call box on the left post. Pull the gate when it buzzes.', photo: `${PHOTO}gate.webp`, focus: '52% 50%',
    alt: 'Black metal pedestrian gate between stucco walls, call box on the left post'},
  {key: 'building', title: 'Building 4', instr: 'Keep right where the path splits. Look for the metal 4 on the wall.', photo: `${PHOTO}courtyard.webp`, focus: '64% 50%',
    alt: 'Courtyard walkway that splits in two, metal number 4 on the building to the right'},
  {key: 'stairs', title: 'Stairs up', instr: 'Take the metal stairs up one floor.', photo: `${PHOTO}stairs.webp`, focus: '58% 50%',
    alt: 'Open metal stairs up to the second floor, next to the number 4 plaque'},
  {key: 'door', title: 'Door 214', instr: 'Keep straight on the walkway. Dark green door, plant on the right.', photo: `${PHOTO}door.webp`, focus: '70% 50%',
    alt: 'Dark green door 214 on the second-floor walkway, coir mat, potted plant on the right'},
];
export const GARAGE_PHOTO = {photo: `${PHOTO}garage.webp`, alt: 'Rolling garage gate on Cypress Ave with a card reader post, residents only'};

const segLens = pts => pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
/** Courier position on the plan for a straight-line distance (feet) from the Elm St gate. Within the first leg the
    courier is walking from the car; beyond it they are still driving east on Elm St toward the stop, so the dot
    crosses the geofence ring at exactly 160 ft. */
export function courierAt(distanceFt) {
  const leg1 = LEGS[0].pts;
  if (distanceFt <= LEGS[0].feet) {
    const lens = segLens(leg1), total = lens.reduce((a, b) => a + b, 0);
    let remaining = distanceFt / LEGS[0].feet * total;
    for (let i = leg1.length - 1; i > 0; i--) {
      const a = leg1[i], b = leg1[i - 1], len = lens[i - 1];
      if (remaining <= len) { const t = remaining / len; return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t}; }
      remaining -= len;
    }
    return leg1[0];
  }
  const laneY = 476, dy = laneY - GATE.y;
  const dx = Math.sqrt(Math.max(0, distanceFt * distanceFt - dy * dy));
  return {x: Math.min(WAYPOINTS[0].at.x, GATE.x - dx), y: laneY};
}
/** Straight-line feet between two plan points (one plan unit is about a foot). */
export const feetBetween = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
/** Walking distance along the route from the curb to the door. */
export const routeFeet = () => TOTAL_FEET;
