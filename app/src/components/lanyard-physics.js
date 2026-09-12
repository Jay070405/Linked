// Shared by the live badge and the real Rapier regression simulation.
// Only the first strap segment stretches. The two lower ropes and clip remain
// rigid-length constraints, so the original resting projection is preserved.
export const LANYARD_PHYSICS = Object.freeze({
  timeStep: 1 / 60,
  solverIterations: 6,
  anchorY: 4,
  clipOffsetY: 1.5,
  restY: -.5,
  segmentCount: 3,
  segmentLength: 1,
  segmentMass: .07,
  cardMass: 1.15,
  springStiffness: 95,
  springDamping: 10,
  minimumSpringRestLength: .15,
  topRopeMaxLength: 2.6,
  // 2.6 + 1 + 1 = 4.6 physical units; leave room for the rope solver.
  dragReach: 4.52,
  segmentLinearDamping: 2.7,
  cardLinearDamping: 2.4,
  angularDamping: 4.5,
  dragResponse: 12,
  dragSpeed: 9.5,
  releaseMomentum: .7,
  releaseSpeed: 4,
  dynamicSpeed: 7.5,
  angularSpeed: 4.5,
  minimumDragY: -2.1,
  maximumDragY: 1.7,
  minimumHorizontalReach: .95,
  maximumHorizontalReach: 2.35,
  horizontalClearance: .9,
  bottomClearance: 1.4,
});

export function getLanyardSpringRestLength(gravityY) {
  const p = LANYARD_PHYSICS;
  const suspendedMass = p.cardMass + p.segmentMass * p.segmentCount;
  // The loaded spring should measure one unit at rest: x = m*g/k.
  return Math.max(p.minimumSpringRestLength,
    p.segmentLength - suspendedMass * Math.abs(gravityY) / p.springStiffness);
}

export function getLanyardDragBounds(halfHeight, halfWidth) {
  const p = LANYARD_PHYSICS;
  return {
    reach: Math.min(p.maximumHorizontalReach,
      Math.max(p.minimumHorizontalReach, halfWidth - p.horizontalClearance)),
    minY: Math.max(p.minimumDragY, -halfHeight + p.bottomClearance),
    maxY: p.maximumDragY,
  };
}
