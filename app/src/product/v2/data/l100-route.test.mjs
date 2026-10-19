// Checks the site's copy of the Last 100 Feet geometry (d3-last-100-feet-prototype/src/route.ts).
import test from 'node:test';
import assert from 'node:assert/strict';
import {LEGS, WAYPOINTS, STEPS, TOTAL_FEET, GATE, GEOFENCE_FT, courierAt, feetBetween, BASE} from './l100-route.js';

test('five waypoints, four legs, 290 ft from the curb to door 214', () => {
  assert.equal(WAYPOINTS.length, 5);
  assert.equal(LEGS.length, 4);
  assert.equal(STEPS.length, 5);
  assert.deepEqual(STEPS.map(s => s.key), WAYPOINTS.map(w => w.key));
  assert.equal(TOTAL_FEET, 290);
  // each leg ends on the next waypoint
  LEGS.forEach((leg, i) => { const end = leg.pts.at(-1), next = WAYPOINTS[i + 1].at; assert.ok(feetBetween(end, next) <= 6, `leg ${i}`); });
});
test('the courier crosses the geofence at 160 ft and stands at the gate at 0', () => {
  assert.deepEqual(courierAt(0), GATE);
  assert.ok(Math.abs(feetBetween(courierAt(GEOFENCE_FT), GATE) - GEOFENCE_FT) < .5);
  assert.ok(Math.abs(feetBetween(courierAt(240), GATE) - 240) < .5);
  assert.deepEqual(courierAt(LEGS[0].feet), LEGS[0].pts[0]);
});
test('the basemap covers the whole route, the garage gate and the approach on Elm St', () => {
  const inside = p => p.x >= BASE.x && p.x <= BASE.x + BASE.w && p.y >= BASE.y && p.y <= BASE.y + BASE.h;
  for (const w of WAYPOINTS) assert.ok(inside(w.at), w.key);
  assert.ok(inside(courierAt(240)));
});
