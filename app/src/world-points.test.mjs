import test from 'node:test';
import assert from 'node:assert/strict';
import {ROLE, createWorld} from './world-points.js';

const COUNT = 6000;
const world = createWorld(COUNT);
const length = (a, i) => Math.hypot(a[i * 3], a[i * 3 + 1], a[i * 3 + 2]);
const roleOf = i => world.seeds[i * 4 + 1];
const indices = role => Array.from({length: COUNT}, (_, i) => i).filter(i => roleOf(i) === role);

test('one thought, one world and one seed per point', () => {
  assert.equal(world.thought.length, COUNT * 3);
  assert.equal(world.world.length, COUNT * 3);
  assert.equal(world.seeds.length, COUNT * 4);
  assert.ok(world.world.every(Number.isFinite) && world.thought.every(Number.isFinite));
});

test('the same seed always builds the same world', () => {
  assert.deepEqual(createWorld(500, 7), createWorld(500, 7));
  assert.notDeepEqual(createWorld(500, 7).world, createWorld(500, 8).world);
});

test('land and sea lie on the globe; land is the denser surface', () => {
  const land = indices(ROLE.land), sea = indices(ROLE.sea);
  for (const i of [...land, ...sea]) assert.ok(Math.abs(length(world.world, i) - 1) < 0.03, `point ${i} at radius ${length(world.world, i)}`);
  assert.ok(land.length > sea.length * 2, `${land.length} land vs ${sea.length} sea`);
});

test('the rings orbit clear of the globe and the dust sits far beyond it', () => {
  for (const i of indices(ROLE.ring)) {
    const r = length(world.world, i);
    assert.ok(r > 1.4 && r < 1.8, `ring point at ${r}`);
  }
  for (const i of indices(ROLE.dust)) {
    const r = length(world.world, i);
    assert.ok(r > 2.1 && r < 7.1, `dust at ${r}`);
  }
  assert.ok(indices(ROLE.ring).length > 0 && indices(ROLE.dust).length > 0);
});

test('the thought is a small pearl with a loose cloud around it', () => {
  for (let i = 0; i < COUNT; i++) {
    const r = length(world.thought, i);
    assert.ok(roleOf(i) === ROLE.dust ? r > 0.1 && r < 0.8 : r < 0.09, `role ${roleOf(i)} thought radius ${r}`);
  }
});

test('the globe draws itself before its rings', () => {
  const delay = i => world.seeds[i * 4 + 3];
  const mean = list => list.reduce((sum, i) => sum + delay(i), 0) / list.length;
  for (let i = 0; i < COUNT; i++) assert.ok(delay(i) >= 0 && delay(i) <= 0.55, `delay ${delay(i)}`);
  assert.ok(mean(indices(ROLE.ring)) > mean(indices(ROLE.land)));
});
