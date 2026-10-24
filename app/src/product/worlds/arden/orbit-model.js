export const ELEVATIONS = [-30, -15, 0, 12, 25, 40, 55, 70];
export const wrap = n => ((n % 36) + 36) % 36;
export const clampRow = n => Math.max(0, Math.min(ELEVATIONS.length - 1, n));
export const snapOrbit = ({az, row}) => ({az: wrap(Math.round(az)), row: clampRow(Math.round(row))});
export const orbitKey = ({az, row}) => `e${ELEVATIONS[row]}_a${String(az * 10).padStart(3, '0')}`;
export function orbitRows(row) {
  return ELEVATIONS.map((_, i) => i).sort((a, b) => Math.abs(a - row) - Math.abs(b - row));
}
export function orbitKeyStep(position, key) {
  const p = snapOrbit(position);
  if (key === 'Home') return {az: 0, row: 3};
  if (key === 'ArrowLeft') p.az--;
  else if (key === 'ArrowRight') p.az++;
  else if (key === 'ArrowUp') p.row++;
  else if (key === 'ArrowDown') p.row--;
  else return null;
  return snapOrbit(p);
}
// Within ten degrees of vertical is a page scroll; holding the actual object arms a deliberate tilt.
export function orbitGesture(dx, dy, onObject, heldMs) {
  if (Math.hypot(dx, dy) < 8) return 'pending';
  const vertical = Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI <= 10;
  return onObject && (!vertical || heldMs >= 180) ? 'rotate' : 'scroll';
}
