import * as THREE from 'three';

/* The one stroke. A line of N points that can take any "pose" — the JL mark, a weave through
   letters, the frame of a screen, a timeline axis, a ring — and flows between them. It is drawn
   as a tube whose radius follows the pose, so the same line is a thick glass mark in 3D and a
   hairline of ink on paper. Poses store per point: position, radius, and distance to the
   nearest stroke end (zero inside gaps), which rounds the caps and hides the gaps. */

export const N = 1000;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eio = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function makePose() { return {P: new Float32Array(N * 3), R: new Float32Array(N), D: new Float32Array(N)}; }

/** strokes: arrays of THREE.Vector3; consecutive strokes are joined by invisible gaps. */
export function poseFromStrokes(strokes, radius, {gapWeight = 0.15} = {}) {
  const pts = [], seg = []; // seg[i]: weighted length of pts[i] -> pts[i+1], and whether it is a gap
  strokes.forEach((s, k) => {
    if (k > 0) { seg.push({len: pts.at(-1).distanceTo(s[0]) * gapWeight, gap: true, real: pts.at(-1).distanceTo(s[0])}); }
    s.forEach((p, i) => { if (i > 0) { const l = s[i - 1].distanceTo(p); seg.push({len: l, gap: false, real: l}); } pts.push(p.clone()); });
  });
  // arc length along its own stroke, and that stroke's length, for every source point
  const along = new Float32Array(pts.length), slen = new Float32Array(pts.length);
  { let i = 0; strokes.forEach(s => { const base = i; const acc = [0]; for (let j = 1; j < s.length; j++) acc.push(acc[j - 1] + s[j - 1].distanceTo(s[j])); const L = acc.at(-1); for (let j = 0; j < s.length; j++) { along[base + j] = acc[j]; slen[base + j] = L; } i += s.length; }); }
  const cum = [0]; seg.forEach(g => cum.push(cum.at(-1) + g.len)); const total = cum.at(-1);
  const pose = makePose();
  let j = 0;
  for (let i = 0; i < N; i++) {
    const s = total * i / (N - 1);
    while (j < seg.length - 1 && cum[j + 1] < s) j++;
    const t = seg[j].len > 0 ? clamp((s - cum[j]) / seg[j].len) : 0;
    const p = pts[j].clone().lerp(pts[j + 1], t);
    pose.P.set([p.x, p.y, p.z], i * 3); pose.R[i] = radius;
    if (seg[j].gap) pose.D[i] = 0; else { const al = along[j] + (along[j + 1] - along[j]) * t; pose.D[i] = Math.min(al, slen[j] - al); }
  }
  return pose;
}

/** A polyline sampled from a function f(u) -> Vector3, u in [0,1]. */
export function curve(f, n = 400) { return Array.from({length: n + 1}, (_, k) => f(k / n)); }

/* ---- the JL mark, from the logo's own strokes (logo pixels, y down; stroke radius 23.5 px) ---- */
export const LOGO_R = 23.5, LOGO_C = [263.5, 297];
export function jlStrokes2D() {
  const quad = (p0, p1, p2, n) => Array.from({length: n + 1}, (_, k) => { const t = k / n, u = 1 - t; return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]; });
  const line = (a, b, n) => Array.from({length: n + 1}, (_, k) => [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  const bowl = Array.from({length: 81}, (_, k) => { const a = THREE.MathUtils.degToRad(192.7 - 172.7 * k / 80); return [198 + 81 * Math.cos(a), 386 + 81 * Math.sin(a)]; });
  const stem = [...quad([203, 385], [220.5, 368], [220.5, 340], 14), ...line([220.5, 340], [220.5, 126.5], 60).slice(1)];
  const L = [...line([307.5, 128], [307.5, 335], 60), ...quad([307.5, 335], [307.5, 359], [331.5, 359], 14).slice(1), ...line([331.5, 359], [408.5, 359], 24).slice(1)];
  return [bowl, stem, L];
}
/** The mark placed in 3D: centre, world units per logo pixel, and the plane's right/up axes. */
export function jlPose(center, scale, right = new THREE.Vector3(1, 0, 0), up = new THREE.Vector3(0, 1, 0), radius = LOGO_R * scale) {
  const strokes = jlStrokes2D().map(s => s.map(([x, y]) => center.clone().addScaledVector(right, (x - LOGO_C[0]) * scale).addScaledVector(up, -(y - LOGO_C[1]) * scale)));
  return poseFromStrokes(strokes, radius);
}

/** Rounded rectangle loop (w x h, corner r) on a plane, optionally bent around a vertical cylinder. */
export function framePose(center, w, h, r, radius, {yaw = 0, bend = 0, start = 0.62} = {}) {
  const pts = [];
  const per = 2 * (w + h - 4 * r) + 2 * Math.PI * r, n = 700;
  const at = s => { // walk the perimeter, starting mid-left edge going down
    s = ((s % per) + per) % per;
    const edges = [[h - 2 * r, 'L'], [Math.PI * r / 2, 'c1'], [w - 2 * r, 'B'], [Math.PI * r / 2, 'c2'], [h - 2 * r, 'R'], [Math.PI * r / 2, 'c3'], [w - 2 * r, 'T'], [Math.PI * r / 2, 'c4']];
    const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2;
    for (const [len, e] of edges) {
      if (s <= len) {
        const q = s / len;
        switch (e) {
          case 'L': return [x0, y1 - r - q * (h - 2 * r)];
          case 'c1': { const a = Math.PI + q * Math.PI / 2; return [x0 + r + r * Math.cos(a), y0 + r + r * Math.sin(a)]; }
          case 'B': return [x0 + r + q * (w - 2 * r), y0];
          case 'c2': { const a = -Math.PI / 2 + q * Math.PI / 2; return [x1 - r + r * Math.cos(a), y0 + r + r * Math.sin(a)]; }
          case 'R': return [x1, y0 + r + q * (h - 2 * r)];
          case 'c3': { const a = q * Math.PI / 2; return [x1 - r + r * Math.cos(a), y1 - r + r * Math.sin(a)]; }
          case 'T': return [x1 - r - q * (w - 2 * r), y1];
          case 'c4': { const a = Math.PI / 2 + q * Math.PI / 2; return [x0 + r + r * Math.cos(a), y1 - r + r * Math.sin(a)]; }
        }
      }
      s -= len;
    }
    return [x0, y1 - r];
  };
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  for (let k = 0; k <= n; k++) {
    const [x, y] = at(per * (start + 1.0 * k / n));
    // bend: the plane curves back around a vertical axis (a curved screen)
    const zb = bend ? -(x * x) * bend : 0;
    const lx = x, lz = zb;
    pts.push(new THREE.Vector3(center.x + lx * cy + lz * sy, center.y + y, center.z - lx * sy + lz * cy));
  }
  // a loop: close it with a tiny overlap so there is no visible seam; ends stay "open" but meet
  const pose = poseFromStrokes([pts], radius);
  for (let i = 0; i < N; i++) pose.D[i] = 1e4; // no caps on a closed frame
  return pose;
}

/* ---- blending ---- */
/** out = A -> B at t, flowing along the line: the head (u small, or large if dir<0) leaves first. */
export function flow(out, A, B, t, {spread = 0.55, dir = 1, lift = null, liftAmt = 0, ease = eio} = {}) {
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1), uu = dir > 0 ? u : 1 - u;
    const e = ease(clamp(t * (1 + spread) - uu * spread));
    const k = i * 3, w = lift ? Math.sin(Math.PI * e) * liftAmt : 0;
    out.P[k] = A.P[k] + (B.P[k] - A.P[k]) * e + (lift ? lift.x * w : 0);
    out.P[k + 1] = A.P[k + 1] + (B.P[k + 1] - A.P[k + 1]) * e + (lift ? lift.y * w : 0);
    out.P[k + 2] = A.P[k + 2] + (B.P[k + 2] - A.P[k + 2]) * e + (lift ? lift.z * w : 0);
    out.R[i] = A.R[i] + (B.R[i] - A.R[i]) * e;
    out.D[i] = A.D[i] + (B.D[i] - A.D[i]) * e;
  }
  return out;
}
export function copyPose(out, A) { out.P.set(A.P); out.R.set(A.R); out.D.set(A.D); return out; }

/* ---- the tube ---- */
export class Tube {
  constructor(radial = 20) {
    const m = radial, n = N, V = n * (m + 1);
    this.m = m;
    this.geo = new THREE.BufferGeometry();
    this.pos = new THREE.BufferAttribute(new Float32Array(V * 3), 3).setUsage(THREE.DynamicDrawUsage);
    this.nor = new THREE.BufferAttribute(new Float32Array(V * 3), 3).setUsage(THREE.DynamicDrawUsage);
    const uv = new Float32Array(V * 2), idx = [];
    for (let i = 0; i < n; i++) for (let j = 0; j <= m; j++) { const v = i * (m + 1) + j; uv[v * 2] = i / (n - 1); uv[v * 2 + 1] = j / m; }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < m; j++) { const a = i * (m + 1) + j, b = a + m + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    this.geo.setAttribute('position', this.pos); this.geo.setAttribute('normal', this.nor); this.geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); this.geo.setIndex(idx);
    this.geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    this.T = new Float32Array(n * 3); this.Nn = new Float32Array(n * 3);
  }
  /** radius scale k multiplies every radius (for draw-on / global swell). reveal: [a,b] of u visible. */
  update(pose, {k = 1, reveal = 1, wobble = null} = {}) {
    const n = N, m = this.m, P = pose.P, T = this.T, NN = this.Nn, pos = this.pos.array, nor = this.nor.array;
    // tangents
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1) * 3, b = Math.min(n - 1, i + 1) * 3;
      let tx = P[b] - P[a], ty = P[b + 1] - P[a + 1], tz = P[b + 2] - P[a + 2];
      let l = Math.hypot(tx, ty, tz);
      if (l < 1e-6) { if (i > 0) { tx = T[(i - 1) * 3]; ty = T[(i - 1) * 3 + 1]; tz = T[(i - 1) * 3 + 2]; l = 1; } else { tx = 1; ty = 0; tz = 0; l = 1; } }
      T[i * 3] = tx / l; T[i * 3 + 1] = ty / l; T[i * 3 + 2] = tz / l;
    }
    // parallel-transported normals
    let nx, ny, nz;
    { const tx = T[0], ty = T[1], tz = T[2]; const ax = Math.abs(tx) < 0.9 ? 1 : 0, ay = ax ? 0 : 1; // cross(T, axis)
      nx = ty * 0 - tz * ay; ny = tz * ax - tx * 0; nz = tx * ay - ty * ax; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l; }
    for (let i = 0; i < n; i++) {
      const tx = T[i * 3], ty = T[i * 3 + 1], tz = T[i * 3 + 2];
      // remove the tangent component, renormalise
      const d = nx * tx + ny * ty + nz * tz; nx -= d * tx; ny -= d * ty; nz -= d * tz;
      let l = Math.hypot(nx, ny, nz); if (l < 1e-6) { nx = -ty; ny = tx; nz = 0; l = Math.hypot(nx, ny) || 1; } nx /= l; ny /= l; nz /= l;
      NN[i * 3] = nx; NN[i * 3 + 1] = ny; NN[i * 3 + 2] = nz;
    }
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const tx = T[i * 3], ty = T[i * 3 + 1], tz = T[i * 3 + 2];
      const ax = NN[i * 3], ay = NN[i * 3 + 1], az = NN[i * 3 + 2];
      const bx = ty * az - tz * ay, by = tz * ax - tx * az, bz = tx * ay - ty * ax;
      const R = pose.R[i] * k, D = pose.D[i];
      const x = R > 0 ? clamp(D / R) : 0; let r = R * Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x)));
      // draw-on: the line appears from its start with a rounded head
      if (reveal < 1) { const h = (reveal * 1.02 - u) * 60; r *= h <= 0 ? 0 : Math.sqrt(clamp(h)); }
      let px = P[i * 3], py = P[i * 3 + 1], pz = P[i * 3 + 2];
      if (wobble) { const w = wobble(u, px, py, pz); px += w[0]; py += w[1]; pz += w[2]; }
      for (let j = 0; j <= m; j++) {
        const a = j / m * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        const qx = ax * c + bx * s, qy = ay * c + by * s, qz = az * c + bz * s, v = (i * (m + 1) + j) * 3;
        pos[v] = px + qx * r; pos[v + 1] = py + qy * r; pos[v + 2] = pz + qz * r;
        nor[v] = qx; nor[v + 1] = qy; nor[v + 2] = qz;
      }
    }
    this.pos.needsUpdate = true; this.nor.needsUpdate = true;
  }
}
