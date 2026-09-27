import test from 'node:test';
import assert from 'node:assert/strict';
import {CUT, channels} from './finale-cut.js';

const samples = Array.from({length: 10001}, (_, i) => i / 10000);

test('every beat sits inside the finale and runs forward', () => {
  for (const [name, [a, b]] of Object.entries(CUT)) assert.ok(a >= 0 && b <= 1 && a < b, `${name} = [${a}, ${b}]`);
});

test('the finale opens on the whole sculpture and ends pulled back in the light', () => {
  const start = channels(0), end = channels(1);
  assert.deepEqual([start.approach, start.dark, start.retreat, start.close, start.iris], [0, 0, 0, 0, 0]);
  assert.deepEqual([end.retreat, end.dark, end.close, end.iris], [1, 0, 0, 0]);
});

test('the reading happens in full darkness', () => {
  for (const p of samples.filter(p => p >= 0.50 && p <= 0.70)) assert.ok(channels(p).dark > 0.99, `dark ${channels(p).dark} at ${p}`);
});

test('the ground only changes colour while the petal fills the frame', () => {
  // close >= 0.7 keeps the camera within ~0.5 units of the petal skin, where the
  // petal covers the frame; below that the flower reads as an object again.
  for (const p of samples) {
    const c = channels(p);
    if (c.dark > 0.02) assert.ok(c.close > 0.7, `dark ${c.dark.toFixed(3)} with close ${c.close.toFixed(3)} at ${p}`);
  }
});

test('the camera never backs up on the dive or creeps forward on the way out', () => {
  let approach = -1, retreat = -1;
  for (const p of samples) {
    const c = channels(p);
    assert.ok(c.approach >= approach && c.retreat >= retreat, `at ${p}`);
    ({approach, retreat} = c);
  }
});

test('no channel jumps between neighbouring scroll positions', () => {
  const keys = ['approach', 'retreat', 'dark', 'iris', 'focus', 'depth', 'halo', 'haloScale', 'read', 'grain'];
  let previous = channels(0);
  for (const p of samples.slice(1)) {
    const c = channels(p);
    for (const key of keys) assert.ok(Math.abs(c[key] - previous[key]) < 0.012, `${key} jumps ${Math.abs(c[key] - previous[key]).toFixed(4)} at ${p}`);
    previous = c;
  }
});

test('the read head sweeps exactly across its beat', () => {
  const [a, b] = CUT.read;
  assert.equal(channels(a - 0.005).read, 0);
  assert.equal(channels(b + 0.005).read, 1);
  assert.ok(Math.abs(channels((a + b) / 2).read - 0.5) < 1e-9);
});

test('the iris settles into a spotlight for the reading', () => {
  const reading = channels(0.6);
  assert.ok(reading.iris > 0.55 && reading.iris < 0.65, `iris ${reading.iris}`);
});

test('malformed progress falls back to a valid frame', () => {
  assert.equal(channels(NaN).p, 0);
  assert.equal(channels(-3).p, 0);
  assert.equal(channels(7).p, 1);
});
