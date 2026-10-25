export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const smoothstep = n => { const k = clamp(n, 0, 1); return k * k * (3 - 2 * k); };
export const flickSide = (velocity, side, threshold = 500) => Math.abs(velocity) > threshold ? (side === 'product' ? 'game' : 'product') : side;
export const wrappedYawError = (target, yaw) => Math.atan2(Math.sin(target - yaw), Math.cos(target - yaw));
// Pointer moves only (not the release itself): the last move against the newest move at least windowMs before it,
// so slow frames still measure a flick. A pointer held still for longer than windowMs before release is not one.
export function releaseVelocity(samples, now, windowMs = 60) {
  const last = samples.at(-1);
  if (!last || now - last.time > windowMs) return 0;
  let first = samples[0];
  for (const p of samples) { if (last.time - p.time >= windowMs) first = p; else break; }
  return last.time > first.time ? (last.x - first.x) * 1000 / (last.time - first.time) : 0;
}
export function badgeHeight(scroll, viewportHeight, phone = false) {
  if (phone) return clamp(viewportHeight * .52, 360, 440) * .46;
  const start = clamp(viewportHeight * .34, 240, 360), end = clamp(viewportHeight * .24, 180, 250);
  return start + (end - start) * smoothstep(scroll / 700);
}
export const openStations = (tops, scroll, height) => tops.map(top => top <= scroll + height * .47);
export const clampOrigin = (point, width, height) => ({x: clamp(point.x, Math.min(60, width / 2), Math.max(width - 60, width / 2)), y: clamp(point.y, height * .2, height * .8)});
export const wipeRadius = ({x, y}, width, height) => Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) * 1.05;
export function countText(value, suffix, progress) {
  const k = clamp(progress, 0, 1), n = k === 1 ? value : Math.round(value * (1 - (1 - k) ** 3));
  return n.toLocaleString('en-US') + (k === 1 ? suffix : '');
}
