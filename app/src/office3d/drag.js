import { Plane, Vector3, MathUtils } from 'three';

// A vertical plane keeps depth unchanged: pointer up means world up.
export function pickupPlane(position, ray) {
  const plane = new Plane(new Vector3(0, 0, 1), -position.z);
  const initial = ray.intersectPlane(plane, new Vector3());
  if (!initial) return null;
  return { plane, offset: new Vector3().copy(position).sub(initial).add(new Vector3(0, .06, 0)) };
}
export function pickupPosition(drag, ray) {
  const point = ray.intersectPlane(drag.plane, new Vector3());
  if (!point) return null;
  point.add(drag.offset);
  point.x = MathUtils.clamp(point.x, -8, 8);
  point.y = MathUtils.clamp(point.y, .2, 7);
  return point;
}
