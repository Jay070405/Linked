import test from 'node:test';
import assert from 'node:assert/strict';
import {createGovernor} from './governor.js';

// A machine is a function from the canvas's resolution to the milliseconds a frame costs; a display shows it at the next refresh.
// The run feeds the governor every frame for `secs` seconds and applies what it answers, as the stage does.
function run(cost, {secs = 60, hz = 60, max = 1.5} = {}) {
  const G = createGovernor({max}), refresh = 1000 / hz, changes = []; let t = 0, dpr = max, low = max;
  while (t < secs * 1000) {
    t += Math.max(1, Math.ceil(cost(dpr, t) / refresh - 1e-9)) * refresh;
    const v = G.frame(t, false);
    if (v != null) { dpr = v; low = Math.min(low, v); changes.push([Math.round(t), +v.toFixed(3)]); }
  }
  return {dpr, low, changes, frame: Math.max(1, Math.ceil(cost(dpr, t) / refresh - 1e-9)) * refresh};
}

test('a machine with time to spare keeps its full resolution', () => {
  for (const hz of [60, 120]) { const r = run(d => 3 * d * d, {hz}); assert.equal(r.dpr, 1.5); assert.equal(r.changes.length, 0); }
});

test('a slow graphics card gets fewer pixels until it keeps pace, and no fewer than it needs', () => {
  const r = run(d => 2 + 14 * d * d); // 33 ms at full resolution, 16 ms at the page's own
  assert.ok(r.dpr >= 1 && r.dpr < 1.1, 'settles at the page\'s own resolution, or the little more it can afford: ' + r.dpr);
  assert.ok(r.frame <= 17, 'and runs at the display\'s rate there');
  assert.ok(r.low >= 1, 'never goes below it: that would cost sharpness for nothing');
});

test('on a fast display it finds the highest resolution that still keeps 60 a second', () => {
  const r = run(d => 2 + 7 * d * d, {hz: 120}); // 17.8 ms at 1.5 (shown at 25), 9 ms at 1
  assert.ok(r.dpr > 1.2 && r.dpr < 1.5, 'between the page\'s resolution and the full one: ' + r.dpr);
  assert.ok(r.frame <= 17);
});

test('a very slow machine goes below the page\'s resolution, to the floor and not through it', () => {
  const r = run(d => 5 + 40 * d * d); // 95 ms at 1.5, 45 at 1, 25 at .7
  assert.equal(r.dpr, .7);
  assert.ok(r.low >= .7);
});

test('when something else sets the pace, the picture keeps its pixels', () => {
  const r = run(() => 33.3, {secs: 120}); // a 30-a-second cap: no resolution makes it faster
  assert.equal(r.dpr, 1.5, 'back at full resolution');
  const dips = r.changes.filter(([, v]) => v < 1.5).length;
  assert.ok(dips >= 1 && dips <= 2, 'it tries once, sees no gain, and waits longer before trying again: ' + dips);
});

test('it comes back up when the load lightens', () => {
  const r = run((d, t) => (t < 20000 ? 2 + 14 * d * d : 3 * d * d), {secs: 90}); // a heavy act, then a light one
  assert.equal(r.dpr, 1.5);
});

test('frames while the page is hidden, and the gap after it, are not counted', () => {
  const G = createGovernor({max: 1.5}); let t = 0, answered = 0;
  for (let i = 0; i < 400; i++) { t += i % 50 === 49 ? 5000 : 16.7; if (G.frame(t, i % 50 > 40) != null) answered++; }
  assert.equal(answered, 0);
  assert.equal(G.dpr, 1.5);
});
