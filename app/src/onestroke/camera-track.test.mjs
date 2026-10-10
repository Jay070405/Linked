import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {createScrollCameraTrack, projectOpacity} from './camera-track.js';
import {toJourney, toScroll} from './pacing.js';

// A descent, a reading drift, then a lateral camera turn with changing directions.
const keys = [
  {s: 2.45, pos: new Vector3(160, 1850, 2600), look: new Vector3(0, -260, -2830)},
  {s: 2.95, pos: new Vector3(320, 0, -900), look: new Vector3(60, -40, -2700)},
  {s: 3.5, pos: new Vector3(270, 6, -960), look: new Vector3(30, -40, -2700)},
  {s: 3.95, pos: new Vector3(570, 30, -2400), look: new Vector3(940, -10, -4200)},
  {s: 4.55, pos: new Vector3(620, 36, -2460), look: new Vector3(970, -10, -4200)},
];
const track = createScrollCameraTrack(keys);
function frame(r) {
  const pos = new Vector3(), look = new Vector3(); track(toJourney(r), pos, look);
  return [...pos.toArray(), ...look.toArray()];
}

test('camera keeps every reading frame and joins with continuous wheel velocity', () => {
  const h = 1e-5;
  for (const k of keys) {
    const r = toScroll(k.s), at = frame(r), before = frame(r - h), after = frame(r + h);
    const expected = [...k.pos.toArray(), ...k.look.toArray()];
    at.forEach((v, c) => {
      assert.ok(Math.abs(v - expected[c]) < 1e-4);
      assert.ok(Math.abs((v - before[c]) / h - (after[c] - v) / h) < .2);
    });
  }
});

test('camera never overshoots frames or changes when revisiting the same scroll position', () => {
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    const av = [...a.pos.toArray(), ...a.look.toArray()], bv = [...b.pos.toArray(), ...b.look.toArray()];
    for (let r = toScroll(a.s); r < toScroll(b.s); r += .007) {
      const at = frame(r);
      at.forEach((v, c) => assert.ok(v >= Math.min(av[c], bv[c]) - 1e-5 && v <= Math.max(av[c], bv[c]) + 1e-5));
      frame(r + .05); assert.deepEqual(frame(r), at);
    }
  }
});

test('the long Systems descent has no short camera speed burst', () => {
  const start = toScroll(2.45), end = toScroll(2.95), h = .001;
  const average = keys[0].pos.distanceTo(keys[1].pos) / (end - start);
  let peak = 0;
  for (let r = start; r < end - h; r += h) {
    const a = frame(r), b = frame(r + h);
    peak = Math.max(peak, Math.hypot(...a.slice(0, 3).map((v, c) => (b[c] - v) / h)));
  }
  assert.ok(peak < average * 1.6, `peak/average ${peak / average}`);
});

test('project images overlap across turns and their fades have smooth endpoints', () => {
  const holds = [[2.95, 3.5], [3.95, 4.55], [5, 5.6], [6.05, 6.6]];
  for (const hold of holds) {
    assert.equal(projectOpacity(hold[0], hold), 1);
    assert.equal(projectOpacity(hold[1], hold), 1);
    for (const caption of [false, true]) {
      for (let s = hold[0] - .6; s < hold[1] + .6; s += .001) {
        const p = projectOpacity(s, hold, caption), next = projectOpacity(s + .001, hold, caption);
        assert.ok(p >= 0 && p <= 1);
        assert.ok(Math.abs(next - p) < .008);
      }
      const boundaries = caption ? [hold[0] - .22, hold[0] + .04, hold[1] + .04, hold[1] + .38]
        : [hold[0] - .5, hold[0] - .04, hold[1] + .04, hold[1] + .5];
      for (const s of boundaries) assert.ok(Math.abs(projectOpacity(s + .00001, hold, caption) - projectOpacity(s - .00001, hold, caption)) < 1e-8);
    }
  }
  for (let i = 1; i < holds.length; i++) {
    for (let s = holds[i - 1][1]; s <= holds[i][0]; s += .005)
      assert.ok(projectOpacity(s, holds[i - 1]) + projectOpacity(s, holds[i]) > .65);
  }
});
