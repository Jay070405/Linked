// Jay, out of the screen. The same 17 x 14 sprite the machine draws, built from cubes, so he can stand on things:
// on the machine, on the part being talked about, on a cartridge, on the floor. The scene only tells him where his perch is
// (S.current.jay); getting there is his business: he hops, lands with a squash, blinks, leans after the pointer, and when
// something happens to him a small pixel sign pops over his head. He also reports where his head is on the page, so the
// page can hang his words there (the hints of every act are his), and he dozes off when nobody has touched anything for a while.
// Whatever he does, his feet stay on what he stands on: leaning lifts him by as much as the lower foot would sink.
import React, {useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {JAY} from './screen';

const U = .05; // one pixel of the bird, in the scene's units
const LEGS = ['.....LL....LL....', '.......LL.LL.....'];
const INK = {X: '#3d63ff', L: '#ff8a2b', O: '#ffffff', B: '#ff8a2b', E: '#0c0e13'};
const SIGN = { // what pops over his head, five by five
  '!': ['..X..', '..X..', '..X..', '.....', '..X..'],
  note: ['..XXX', '..X.X', '..X..', 'XXX..', 'XXX..'],
  z: ['XXXX.', '...X.', '..X..', '.X...', 'XXXX.'],
  heart: ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..'],
};
const SIGN_INK = {'!': '#ff5a1f', note: '#ffc933', z: '#9aa7c7', heart: '#ff4d6d'};
const CELLS = JAY.flatMap((row, j) => [...row].map((ch, i) => (ch !== '.' || j === 13) && {i, j, ch})).filter(Boolean);
const SPARE = 25, clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), damp = THREE.MathUtils.damp;

export default function VoxelJay({S, on}) {
  const body = useRef(), root = useRef(), edge = useRef();
  // The game cartridge cuts him out like a sticker: every cube is drawn once more, wider, in white, back faces only, so a white edge
  // shows all round him. A blue jay in a blue room needs it; on the dark machine the edge has no width and is not there.
  const hull = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({color: '#fff', side: THREE.BackSide, fog: false}); m.userData.grow = {value: 1};
    m.onBeforeCompile = sh => { sh.uniforms.uGrow = m.userData.grow;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uGrow;').replace('#include <begin_vertex>', 'vec3 transformed = vec3(position.xy * uGrow, position.z * (1. + (uGrow - 1.) * .04));'); };
    return m;
  }, []);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({color: '#fff', roughness: .55, fog: false}); // no haze on him: in the flooded room it would turn a blue jay purple
    m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * .3;'); }; // he carries a little of his own light, so the dark stage does not swallow him
    return m;
  }, []);
  const K = useMemo(() => ({o: new THREE.Object3D(), c: new THREE.Color(), pos: new THREE.Vector3(), from: new THREE.Vector3(), to: new THREE.Vector3(), v: new THREE.Vector3(),
    hop: -1, dur: .4, high: .4, b: -1, land: 0, lean: 0, idle: 3, sign: null, signT: 0, ready: false, show: 0, nap: false, flip: -1, ry: 0}), []);

  useFrame((state, dt) => {
    const s = S.current, J = s.jay, m = body.current, g = root.current; if (!m || !J) return;
    dt = Math.min(dt, .05); if (import.meta.env.DEV && window.__jl?.fast) dt = .4; if (import.meta.env.DEV && window.__jl?.dt) dt = window.__jl.dt; // development only, see Stage in JL01.jsx
    const now = performance.now() / 1000 + ((import.meta.env.DEV && window.__jl?.skew) || 0), asleep = s.phase === 'standby' || s.nap; // left alone for a while, he dozes off where he stands
    if (K.nap && !s.nap) { K.sign = '!'; K.signT = 1.3; if (K.b < 0 && K.hop < 0) K.b = 0; } K.nap = !!s.nap;
    K.to.set(J.x, J.y, J.z);
    if (!K.ready) { K.ready = true; K.pos.copy(K.to); K.ry = J.ry || 0; }
    // a perch that is far away is a hop; one that only drifts is followed
    const far = K.pos.distanceTo(K.to);
    if (K.hop < 0) { if (far > .3) { K.hop = 0; K.from.copy(K.pos); K.dur = clamp(.3 + far * .06, .32, .6); K.high = .3 + Math.min(1.2, far * .17); } else K.pos.copy(K.to); }
    if (K.hop >= 0) { K.hop += dt / K.dur; const t = Math.min(1, K.hop), e = t * t * (3 - 2 * t);
      K.pos.lerpVectors(K.from, K.to, e); K.pos.y += Math.sin(Math.PI * t) * K.high; if (t >= 1) { K.hop = -1; K.land = 1; } }
    // a hop on the spot: when something asks for it, or now and then when nothing does
    if (s.jayKick) { s.jayKick = 0; if (K.b < 0 && K.hop < 0) K.b = 0; }
    K.idle -= dt; if (K.idle < 0) { K.idle = 4 + Math.random() * 4; if (!asleep && K.b < 0 && K.hop < 0) K.b = 0; }
    let up = 0; if (K.b >= 0) { K.b += dt / .4; up = Math.sin(Math.PI * Math.min(1, K.b)) * .26; if (K.b >= 1) { K.b = -1; K.land = .8; } }
    K.land = damp(K.land, 0, 9, dt);
    if (s.jaySay) { K.sign = s.jaySay; K.signT = 1.3; s.jaySay = null; }
    K.signT -= dt; const sign = asleep ? 'z' : K.signT > 0 ? K.sign : null;
    // he leans the way the pointer is
    K.v.copy(K.pos).project(state.camera);
    K.lean = damp(K.lean, asleep ? .16 : clamp((state.pointer.x - K.v.x) * 1.4, -1, 1) * -.16, 5, dt);
    K.show = damp(K.show, J.hide ? 0 : 1, 10, dt);
    const breathe = asleep ? 1 + Math.sin(now * 1.6) * .03 : 1, sq = K.land * .2, k = (J.k || 1) * K.show;
    // poked often enough, he turns a somersault: once round his own middle, with a jump under it
    if (s.jayFlip) { s.jayFlip = 0; if (K.flip < 0) K.flip = 0; }
    let roll = 0; if (K.flip >= 0) { K.flip += dt / .7; const t = Math.min(1, K.flip); roll = t * t * (3 - 2 * t) * Math.PI * 2; up += Math.sin(Math.PI * t) * .5; if (t >= 1) { K.flip = -1; K.land = 1; } }
    // he turns to where he is asked to face the short way round, and not in one frame
    K.ry += Math.atan2(Math.sin((J.ry || 0) - K.ry), Math.cos((J.ry || 0) - K.ry)) * (1 - Math.exp(-9 * dt));
    if (J.walk && K.hop < 0) up += Math.abs(Math.sin(now * 13)) * .03; // on the turning knob he steps to stay on top of it
    const ry = K.ry, ox = Math.sin(roll) * .35 * k, foot = (K.lean > 0 ? .175 : .225) * Math.abs(Math.sin(K.lean)) * k;
    g.visible = K.show > .02; g.position.set(K.pos.x + ox * Math.cos(ry), K.pos.y + up + foot + (1 - Math.cos(roll)) * .35 * k, K.pos.z - ox * Math.sin(ry)); g.rotation.set(0, ry, K.lean + roll);
    g.scale.set(k * (1 + sq * .6), k * (1 - sq) * breathe, k * (1 + sq * .6));
    // where his words go on the page: a little over his head, above the sign
    K.v.set(K.pos.x, K.pos.y + up + 1.02 * k, K.pos.z).project(state.camera);
    J.sx = (K.v.x * .5 + .5) * state.size.width; J.sy = (-K.v.y * .5 + .5) * state.size.height; J.on = K.show;
    K.v.set(K.pos.x, K.pos.y + up, K.pos.z).project(state.camera); J.sh = (-K.v.y * .5 + .5) * state.size.height - J.sy; // and how tall he is on the page, feet to words

    const closed = asleep || now % 3.7 < .13 || K.land > .5, step = K.hop >= 0 ? Math.floor(K.hop * 4) % 2 : J.walk ? Math.floor(now * 8) % 2 : 0; let n = 0;
    for (const cell of CELLS) { let ch = cell.j === 13 ? LEGS[step][cell.i] : cell.ch;
      if (ch === 'E' && closed && cell.j !== 6) ch = 'X';
      const out = ch === '.' ? 0 : 1, front = ch === 'B' ? 1.3 : ch === 'E' || ch === 'O' ? .5 : 0;
      K.o.position.set((cell.i - 8) * U, (13.5 - cell.j) * U, 0); K.o.rotation.set(0, 0, 0); K.o.scale.set(U * out, U * out, U * (4 + front * 2) * out || 1e-4); K.o.updateMatrix();
      m.setMatrixAt(n, K.o.matrix); m.setColorAt(n, K.c.set(INK[ch] || '#000')); n++; }
    // the sign over his head
    const rows = sign ? SIGN[sign] : null, bob = Math.sin(now * 3) * .4, pop = sign === 'z' ? 1 : clamp((1.3 - K.signT) * 8) * clamp(K.signT * 5);
    for (let q = 0; q < SPARE; q++) { const on2 = rows && rows[Math.floor(q / 5)][q % 5] === 'X' ? pop : 0;
      K.o.position.set((q % 5 - 2 + (sign === 'z' ? 5 : 0)) * U * .9, (20.5 - Math.floor(q / 5) + bob) * U * .9, 0); K.o.scale.setScalar(Math.max(1e-4, U * .9 * on2)); K.o.updateMatrix();
      m.setMatrixAt(n, K.o.matrix); m.setColorAt(n, K.c.set(sign ? SIGN_INK[sign] : '#000')); n++; }
    m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true;
    const e = edge.current; if (e.instanceMatrix !== m.instanceMatrix) e.instanceMatrix = m.instanceMatrix; // the edge is the same cubes, so it reads the same matrices
    hull.userData.grow.value = damp(hull.userData.grow.value, s.choice === 'game' ? 2 : 1, 5, dt); e.visible = hull.userData.grow.value > 1.02;
  });

  return <group ref={root} name="jay">
    <instancedMesh ref={edge} args={[null, null, CELLS.length + SPARE]} material={hull} frustumCulled={false} raycast={() => null}><boxGeometry args={[1, 1, 1]}/></instancedMesh>
    <instancedMesh ref={body} args={[null, null, CELLS.length + SPARE]} material={mat} frustumCulled={false}
      onPointerOver={e => { e.stopPropagation(); on.tipKey('poke'); }} onPointerOut={() => on.tip('')} onClick={e => { e.stopPropagation(); on.poke(); }}>
      <boxGeometry args={[1, 1, 1]}/>
    </instancedMesh>
  </group>;
}
