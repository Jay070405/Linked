import test from 'node:test';
import assert from 'node:assert/strict';
import {CUT, HIT, channels, hitState} from './finale-cut.js';

const samples = Array.from({length: 10001}, (_, i) => i / 10000);
const within = ([a, b]) => samples.filter(p => p >= a && p <= b);

test('every beat sits inside the finale and runs forward', () => {
  for (const [name, [a, b]] of Object.entries(CUT)) assert.ok(a >= 0 && b <= 1 && a < b, `${name} = [${a}, ${b}]`);
  for (const [name, [on, off]] of Object.entries(HIT)) assert.ok(on >= 0 && on <= 1 && on < off, `${name} = [${on}, ${off}]`);
});

test('the finale opens and closes on the thought, in the light', () => {
  for (const p of [0, 1]) {
    const c = channels(p);
    assert.deepEqual([c.spread, c.night, c.flight, c.dim, c.focus], [0, 0, 0, 0, 0], `at ${p}`);
    assert.ok(Math.abs(c.dist - channels(0).dist) < 1e-9, `the camera ends where it began (${c.dist})`);
  }
});

test('the night only ever opens on a world', () => {
  for (const p of samples) {
    const c = channels(p);
    if (c.night > 0.02) assert.ok(c.spread > 0.3, `night ${c.night.toFixed(3)} over spread ${c.spread.toFixed(3)} at ${p}`);
  }
});

test('the title has left before the night opens', () => {
  assert.ok(HIT.titleA[1] <= CUT.night[0] && HIT.titleB[1] <= CUT.night[0]);
  assert.ok(HIT.titleB[0] <= CUT.form[0], 'the world forms as "to a world" lands, not before');
});

test('the philosophy is only ever on the night', () => {
  for (const p of within(HIT.philosophy)) assert.ok(channels(p).night > 0.99, `night ${channels(p).night} at ${p}`);
});

test('the reading happens over a dim world with the camera at rest', () => {
  for (const p of within(CUT.read)) {
    const c = channels(p);
    assert.ok(c.dim > 0.99 && c.flight > 0.99, `dim ${c.dim} flight ${c.flight} at ${p}`);
  }
});

test('the ending waits for the world to fold back into the thought', () => {
  assert.ok(HIT.ending[0] >= CUT.collapse[1]);
  assert.equal(channels(HIT.ending[0]).spread, 0);
});

test('no channel jumps between neighbouring scroll positions', () => {
  const keys = ['dist', 'spread', 'night', 'flight', 'kick', 'dim', 'iris', 'focus', 'read', 'grain'];
  let previous = channels(0);
  for (const p of samples.slice(1)) {
    const c = channels(p);
    for (const key of keys) assert.ok(Math.abs(c[key] - previous[key]) < 0.012, `${key} jumps ${Math.abs(c[key] - previous[key]).toFixed(4)} at ${p}`);
    previous = c;
  }
});

test('the swirl only changes while every point is home', () => {
  let previous = channels(0);
  for (const p of samples.slice(1)) {
    const c = channels(p);
    if (c.twist !== previous.twist) assert.equal(c.spread, 1, `twist changed at ${p} with spread ${c.spread}`);
    previous = c;
  }
});

test('the read head sweeps exactly across its beat', () => {
  const [a, b] = CUT.read;
  assert.equal(channels(a - 0.005).read, 0);
  assert.equal(channels(b + 0.005).read, 1);
  assert.ok(Math.abs(channels((a + b) / 2).read - 0.5) < 1e-9);
});

test('the vignette waits for the night to cover the paper', () => {
  for (const p of samples) {
    const c = channels(p);
    if (c.night < 0.75) assert.ok(c.iris < 0.001, `iris ${c.iris.toFixed(3)} over night ${c.night.toFixed(3)} at ${p}`);
  }
});

test('the iris relaxes into a spotlight for the reading', () => {
  const reading = channels(0.6);
  assert.ok(reading.iris > 0.45 && reading.iris < 0.55, `iris ${reading.iris}`);
});

test('malformed progress falls back to a valid frame', () => {
  assert.equal(channels(NaN).p, 0);
  assert.equal(channels(-3).p, 0);
  assert.equal(channels(7).p, 1);
});

test('a hit is waiting, on, or spent', () => {
  assert.equal(hitState(0.10, [0.2, 0.4]), -1);
  assert.equal(hitState(0.20, [0.2, 0.4]), 0);
  assert.equal(hitState(0.39, [0.2, 0.4]), 0);
  assert.equal(hitState(0.40, [0.2, 0.4]), 1);
  assert.equal(hitState(1, HIT.ending), 0, 'the ending never leaves');
  assert.equal(hitState(0, HIT.invite), 0, 'the invitation is up from the first frame');
});
