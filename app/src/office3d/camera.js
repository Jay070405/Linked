import { Vector3, MathUtils } from 'three';

export const SCREEN_SIZE = [3.11, 1.73];
export const CAMERA_FOV = 39;
export const easeRange = (a, b, p) => {
  const x = MathUtils.clamp((p - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};

// Match the legacy exponential framing rate with a real dolly, not a CSS scale.
export function cameraPose(progress, aspect, start, look, screen, pointer = { x: 0, y: 0 }) {
  const z = easeRange(0, .141, progress);
  const travel = (1 - Math.pow(6.5, -z)) / (1 - 1 / 6.5);
  const tan = Math.tan(CAMERA_FOV * Math.PI / 360);
  const coverDistance = Math.min(SCREEN_SIZE[1] / (2 * tan), SCREEN_SIZE[0] / (2 * tan * aspect)) * .80;
  const origin = start.clone();
  // Portrait framing keeps the monitor legible without pushing the camera
  // into the desk. The headline is separately fitted on the physical wall.
  const initialLook = look.clone();
  if (aspect < .9) {
    origin.x = screen.x;
    initialLook.x = screen.x;
    origin.z = Math.max(start.z + 1.6, screen.z + SCREEN_SIZE[0] * 1.27 / (2 * tan * aspect));
  }
  const finish = screen.clone().add(new Vector3(0, 0, coverDistance));
  const position = origin.lerp(finish, travel);
  const target = initialLook.lerp(screen, easeRange(0, .095, progress));
  const sway = 1 - easeRange(.025, .11, progress);
  position.x += pointer.x * .20 * sway;
  position.y += pointer.y * .105 * sway;
  target.x += pointer.x * .055 * sway;
  target.y += pointer.y * .025 * sway;
  return { position, target, travel };
}
