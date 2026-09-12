/**
 * Run: node --test src/components/lanyard-physics.test.mjs
 *
 * This runs the installed Rapier solver, real masses, all five constraints,
 * kinematic drag, and dynamic release. It checks motion outcomes rather than
 * only comparing parameter values. Browser pointer capture / scroll ownership
 * still require UI checks; a cancelled gesture is modelled with zero momentum.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import RAPIER from '@dimforge/rapier3d-compat';
import { LANYARD_PHYSICS as P, getLanyardSpringRestLength, getLanyardDragBounds } from './lanyard-physics.js';

await RAPIER.init();
const ZERO = { x: 0, y: 0, z: 0 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const length = vector => Math.hypot(vector.x, vector.y, vector.z);
const clone = vector => ({ x: vector.x, y: vector.y, z: vector.z });
function limited(vector, maximum) {
  const factor = Math.min(1, maximum / Math.max(length(vector), 1e-8));
  return { x: vector.x * factor, y: vector.y * factor, z: vector.z * factor };
}

function rotatedClip(rotation) {
  const { x, y, z, w } = rotation, offset = P.clipOffsetY;
  return {
    x: 2 * (x * y - w * z) * offset,
    y: (1 - 2 * (x * x + z * z)) * offset,
    z: 2 * (y * z + w * x) * offset,
  };
}

function createRig(gravityY = -32) {
  const world = new RAPIER.World({ x: 0, y: gravityY, z: 0 });
  world.timestep = P.timeStep;
  const fixed = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, P.anchorY, 0));
  function bodyAt(y, isCard = false) {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, y, 0)
      .setLinearDamping(isCard ? P.cardLinearDamping : P.segmentLinearDamping)
      .setAngularDamping(P.angularDamping).setCanSleep(true));
    body.setAdditionalSolverIterations(P.solverIterations);
    if (isCard) body.enableCcd(true);
    const collider = isCard ? RAPIER.ColliderDesc.cuboid(.8, 1.125, .025) : RAPIER.ColliderDesc.ball(.07);
    world.createCollider(collider.setMass(isCard ? P.cardMass : P.segmentMass).setRestitution(0), body);
    return body;
  }
  const segments = Array.from({ length: P.segmentCount }, (_, index) =>
    bodyAt(P.anchorY - P.segmentLength * (index + 1)));
  const card = bodyAt(P.restY, true);
  world.createImpulseJoint(RAPIER.JointData.spring(getLanyardSpringRestLength(gravityY),
    P.springStiffness, P.springDamping, ZERO, ZERO), fixed, segments[0], true);
  world.createImpulseJoint(RAPIER.JointData.rope(P.topRopeMaxLength, ZERO, ZERO), fixed, segments[0], true);
  for (let i = 1; i < segments.length; i++) {
    world.createImpulseJoint(RAPIER.JointData.rope(P.segmentLength, ZERO, ZERO), segments[i - 1], segments[i], true);
  }
  world.createImpulseJoint(RAPIER.JointData.spherical(ZERO, { x: 0, y: P.clipOffsetY, z: 0 }),
    segments.at(-1), card, true);
  for (let frame = 0; frame < 300; frame++) world.step();
  return { world, fixed, segments, card, rest: clone(card.translation()) };
}

function simulate({ target = { x: 0, y: -2.1 }, dragFrames = 40, holdFrames = 90,
  cancel = false, mobile = false, gravityY = -32 } = {}) {
  const rig = createRig(gravityY);
  const { world, fixed, segments, card, rest } = rig;
  try {
    const halfHeight = Math.tan(25 * Math.PI / 360) * 23 * (mobile ? .72 : 1);
    const halfWidth = halfHeight * (mobile ? 390 / (844 * .62) : 720 / 900);
    const bounds = getLanyardDragBounds(halfHeight, halfWidth);
    card.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
    let release = clone(ZERO);
    for (let frame = 0; frame < dragFrames + holdFrames; frame++) {
      const position = card.translation(), origin = fixed.translation();
      const clip = rotatedClip(card.rotation());
      const input = { x: clamp(target.x, -bounds.reach, bounds.reach),
        y: clamp(target.y, bounds.minY, bounds.maxY), z: 0 };
      const reach = limited({ x: input.x + clip.x - origin.x,
        y: input.y + clip.y - origin.y, z: input.z + clip.z - origin.z }, P.dragReach);
      const desired = { x: origin.x + reach.x - clip.x,
        y: origin.y + reach.y - clip.y, z: origin.z + reach.z - clip.z };
      const ease = 1 - Math.exp(-P.timeStep * P.dragResponse);
      const step = limited({ x: (desired.x - position.x) * ease,
        y: (desired.y - position.y) * ease, z: (desired.z - position.z) * ease }, P.dragSpeed * P.timeStep);
      release = limited({ x: step.x / P.timeStep * P.releaseMomentum,
        y: step.y / P.timeStep * P.releaseMomentum, z: step.z / P.timeStep * P.releaseMomentum }, P.releaseSpeed);
      card.setNextKinematicTranslation({ x: position.x + step.x, y: position.y + step.y, z: position.z + step.z });
      [card, ...segments].forEach(body => body.wakeUp());
      world.step();
    }
    const held = clone(card.translation());
    if (cancel) release = clone(ZERO);
    card.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
    card.setLinvel(release, true);
    card.setAngvel(limited(card.angvel(), P.angularSpeed), true);
    const samples = [];
    let peakSpeed = 0, peakClipDistance = 0;
    for (let frame = 0; frame < 360; frame++) {
      // Match the live component's speed safety limits; record speed before
      // limiting so an unstable setup cannot conceal a solver impulse.
      const velocity = card.linvel();
      peakSpeed = Math.max(peakSpeed, length(velocity));
      if (length(velocity) > P.dynamicSpeed) card.setLinvel(limited(velocity, P.dynamicSpeed), false);
      const angular = clone(card.angvel());
      angular.y -= card.rotation().y * .5 * P.timeStep;
      card.setAngvel(limited(angular, P.angularSpeed), false);
      world.step();
      const position = clone(card.translation()), clip = rotatedClip(card.rotation());
      peakClipDistance = Math.max(peakClipDistance,
        Math.hypot(position.x + clip.x, position.y + clip.y - P.anchorY, position.z + clip.z));
      samples.push({ time: (frame + 1) * P.timeStep, ...position, speed: length(card.linvel()),
        error: Math.hypot(position.x - rest.x, position.y - rest.y, position.z - rest.z) });
    }
    const physicalReach = P.topRopeMaxLength + (P.segmentCount - 1) * P.segmentLength;
    return { rest, held, release, bounds, samples, peakSpeed, peakClipDistance, physicalReach,
      maximumY: Math.max(...samples.map(sample => sample.y)) };
  } finally { world.free(); }
}

function assertSafeReturn(result, settleBy) {
  for (const sample of result.samples) {
    assert.ok([sample.x, sample.y, sample.z, sample.speed].every(Number.isFinite), 'No NaN or infinite solver state');
    assert.ok(sample.error < 3.5, `Badge escaped its play area: ${sample.error}`);
  }
  assert.ok(result.peakSpeed < 9, `Unexpected solver impulse: ${result.peakSpeed}`);
  assert.ok(result.peakClipDistance < result.physicalReach + .1, 'Hard rope stop must contain the badge');
  const tail = result.samples.filter(sample => sample.time >= settleBy);
  assert.ok(tail.length > 0);
  assert.ok(tail.every(sample => sample.error < .06 && sample.speed < .14), 'Return should remain settled, not merely cross its rest point');
}

test('Loaded spring preserves the existing badge / cat projection for both used gravity values', () => {
  for (const gravity of [-32, -40]) {
    const rig = createRig(gravity);
    try {
      assert.ok(Math.abs(rig.rest.y - P.restY) < .065, `Rest projection drift at gravity ${gravity}: ${rig.rest.y}`);
      assert.ok(Math.hypot(rig.rest.x, rig.rest.z) < .01);
      assert.ok(length(rig.card.linvel()) < .04);
    } finally { rig.world.free(); }
  }
});

test('Downward drag has real travel and returns with one bounded visible rebound', t => {
  const result = simulate();
  assert.ok(result.rest.y - result.held.y > 1, 'A downward pull must move at least one world unit');
  const rebound = result.maximumY - result.rest.y;
  assert.ok(rebound > .025 && rebound < .35, `Expected a visible, restrained rebound: ${rebound}`);
  assertSafeReturn(result, 1.6);
  t.diagnostic(`down=${(result.rest.y - result.held.y).toFixed(3)}, rebound=${rebound.toFixed(3)}, peakSpeed=${result.peakSpeed.toFixed(3)}`);
});

test('Portrait viewport keeps useful downward travel while retaining the bottom clearance', () => {
  const result = simulate({ mobile: true });
  assert.ok(result.rest.y - result.held.y > 1);
  assert.ok(result.held.y >= result.bounds.minY - .03);
  assertSafeReturn(result, 1.6);
});

test('A cancelled downward flick injects no pointer momentum and still returns safely', () => {
  const result = simulate({ dragFrames: 8, holdFrames: 0, cancel: true });
  assert.deepEqual(result.release, ZERO);
  assert.ok(result.rest.y - result.held.y > .8, 'Cancellation is tested after meaningful extension');
  assertSafeReturn(result, 1.6);
});

test('Diagonal hold and fast release retain natural sideways swing without a runaway', t => {
  for (const options of [
    { target: { x: 2.35, y: -2.1 } },
    { target: { x: -2.35, y: -2.1 }, dragFrames: 12, holdFrames: 0 },
  ]) {
    const result = simulate(options);
    assert.ok(Math.abs(result.held.x) > 1, 'Sideways play remains available');
    assert.ok(result.samples.some(sample => sample.x * result.held.x < -.04), 'Release should swing through the resting center');
    assert.ok(length(result.release) <= P.releaseSpeed + 1e-6);
    assertSafeReturn(result, 4.2);
    t.diagnostic(`diagonal peakSpeed=${result.peakSpeed.toFixed(3)}, finalError=${result.samples.at(-1).error.toFixed(4)}`);
  }
});

test('Horizontal dragging remains playable and settles without vertical projection drift', () => {
  const result = simulate({ target: { x: 2.35, y: P.restY } });
  assert.ok(result.held.x > 2);
  assertSafeReturn(result, 4.2);
});
