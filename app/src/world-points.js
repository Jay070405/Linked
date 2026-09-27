/** The point cloud behind the finale. Every point has two homes: its place in
 *  the thought (a tiny pearl with a loose cloud around it) and its place in the
 *  world (a unit globe of land and sea, a ring, and far dust). WorldScene
 *  morphs between them on the GPU. Pure and seeded, so it can be tested. */

export const ROLE = {land: 0, sea: 1, ring: 2, dust: 3};

function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth 3D value noise, a few octaves: coastlines, not static.
function lattice(x, y, z, seed) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440662683) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, z, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const s = t => t * t * (3 - 2 * t);
  const u = s(x - xi), v = s(y - yi), w = s(z - zi);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => lattice(xi + dx, yi + dy, zi + dz, seed);
  return l(l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v),
    l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
const terrain = (x, y, z, seed) => {
  let sum = 0, amplitude = 0.5, frequency = 1.7;
  for (let octave = 0; octave < 4; octave++) {
    sum += amplitude * noise(x * frequency + 11, y * frequency + 7, z * frequency + 3, seed + octave);
    amplitude *= 0.5; frequency *= 2.1;
  }
  return sum / 0.9375;
};
const SHORE = 0.52;

function onSphere(next) {
  const z = next() * 2 - 1, a = next() * Math.PI * 2, r = Math.sqrt(1 - z * z);
  return [r * Math.cos(a), z, r * Math.sin(a)];
}

export function createWorld(count, seed = 1) {
  const next = random(seed);
  const thought = new Float32Array(count * 3), world = new Float32Array(count * 3), seeds = new Float32Array(count * 4);
  const dust = Math.round(count * 0.14), ring = Math.round(count * 0.12), surface = count - dust - ring;
  const put = (i, home, pearl, role, size, delay) => {
    world.set(home, i * 3);
    thought.set(pearl, i * 3);
    seeds.set([next(), role, size, delay], i * 4);
  };
  const pearl = () => onSphere(next).map(v => v * (0.062 + next() * 0.016));

  let i = 0;
  while (i < surface) {
    const [x, y, z] = onSphere(next);
    const height = terrain(x, y, z, seed);
    const land = height > SHORE;
    if (!land && next() > 0.18) continue;                     // the sea is sparse
    const lift = land ? 1 + Math.min(0.02, (height - SHORE) * 0.08) : 1;
    // The globe draws itself from the north down, with a little scatter.
    const delay = 0.30 * (1 - (y + 1) / 2) + 0.12 * next();
    put(i++, [x * lift, y * lift, z * lift], pearl(), land ? ROLE.land : ROLE.sea, land ? 0.8 + next() * 0.5 : 0.6 + next() * 0.3, delay);
  }
  // The ring, in its own plane (y = 0); WorldScene tilts and spins it.
  for (let k = 0; k < ring; k++, i++) {
    const a = next() * Math.PI * 2, r = 1.45 + 0.3 * Math.pow(next(), 1.6);
    put(i, [r * Math.cos(a), (next() - 0.5) * 0.02, r * Math.sin(a)], pearl(), ROLE.ring, 0.6 + next() * 0.4, 0.30 + next() * 0.2);
  }
  // Dust: the thought's loose cloud, and in the world the far field that gives
  // the camera parallax.
  for (let k = 0; k < dust; k++, i++) {
    const direction = onSphere(next);
    const far = 2.2 + 4.8 * Math.pow(next(), 0.7), near = 0.12 + 0.63 * Math.pow(next(), 1.5);
    // It leaves late, so it spreads mostly into the night rather than over the paper.
    put(i, direction.map(v => v * far), onSphere(next).map(v => v * near), ROLE.dust, 0.5 + next() * 0.9, 0.25 + next() * 0.25);
  }
  return {thought, world, seeds};
}
