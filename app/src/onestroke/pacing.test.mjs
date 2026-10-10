import test from 'node:test';
import assert from 'node:assert/strict';
import {PACING, TOTAL, SCROLL_TOTAL, toScroll, toJourney} from './pacing.js';

test('wheel mapping is reversible and strictly forward, including chapter destinations', () => {
  let previous = -Infinity;
  for (let s = -1; s <= TOTAL + 1; s += .01) {
    const r = toScroll(s);
    assert.ok(r > previous);
    assert.ok(Math.abs(toJourney(r) - s) < 1e-6);
    previous = r;
  }
  for (const [s, r] of PACING) assert.ok(Math.abs(toScroll(s) - r) < 1e-9);
  for (const s of [0, 2.05, 8.3, 10.9, 16.9, 22.6])
    assert.ok(Math.abs(toJourney(toScroll(s)) - s) < 1e-6);
  assert.equal(toScroll(TOTAL), SCROLL_TOTAL);
});

test('wheel sensitivity does not jump at scene boundaries', () => {
  const h = 1e-5;
  for (const [s] of PACING.slice(1, -1)) {
    const left = (toScroll(s) - toScroll(s - h)) / h;
    const right = (toScroll(s + h) - toScroll(s)) / h;
    assert.ok(Math.abs(left - right) < .001);
  }
});

test('mark sinking has a full screen of travel and every later chapter slows down', () => {
  assert.equal(toScroll(1), 2.4);
  assert.ok(toScroll(1.25) - toScroll(1) >= 1);
  assert.ok(toScroll(2.72) - toScroll(2.45) > .5);
  for (const [a, b] of [[2.95, 7.3], [7.3, 9.9], [9.9, 14.2], [14.2, 16.9], [16.9, 21.3]])
    assert.ok((toScroll(b) - toScroll(a)) / (b - a) >= 1.5);
  // No short interval should turn into a fast burst between the control points.
  for (let s = 1; s < TOTAL; s += .01)
    assert.ok((toScroll(s + .001) - toScroll(s)) / .001 > 1.25);
});
