// The cat. Jay Lin's own (sprite.js), built from cubes the way Jay is. It is the page's easter egg, so it is not there:
// it sits out of sight behind the machine. Press the machine's fourth key on the first screen (or make Jay say there is no
// easter egg) and it comes up behind the right end of the machine's top edge, ears first, as far as its nose; half asleep,
// it opens its eyes, has a look, shuts them, and sinks back. Jay, at the other end, only half notices.
// It belongs to the machine (it is mounted in the machine's group), and to the first screen: scroll, and it is down at once.
import React, {useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {CAT, CAT_INK, catCell} from './sprite';

const U = .05; // one pixel of the cat, in the scene's units: the same as Jay's
const HEART = ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..'];
const CELLS = CAT.flatMap((row, j) => [...row].map((ch, i) => ch !== '.' && {i, j})).filter(Boolean);
const SPARE = 25, clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), damp = THREE.MathUtils.damp;
// Where it is, in the machine's own space (the machine's top is at 1.1, its back at -.25): behind the back, towards the right end,
// clear of Jay at the left end and of the cartridge in the slot. DOWN: its ears under the top edge. UP: out as far as its nose.
const X = 1.15, Z = -.41, DOWN = .34, UP = .85, STAY = 4.2;

export default function VoxelCat({S, on}) {
  const body = useRef(), root = useRef(), edge = useRef();
  const hull = useMemo(() => { // on the game cartridge it is cut out like a sticker, as Jay is (see jay.jsx)
    const m = new THREE.MeshBasicMaterial({color: '#fff', side: THREE.BackSide, fog: false}); m.userData.grow = {value: 1};
    m.onBeforeCompile = sh => { sh.uniforms.uGrow = m.userData.grow;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uGrow;').replace('#include <begin_vertex>', 'vec3 transformed = vec3(position.xy * uGrow, position.z * (1. + (uGrow - 1.) * .04));'); };
    return m;
  }, []);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({color: '#fff', roughness: .6, fog: false});
    m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * .3;'); };
    return m;
  }, []);
  const K = useMemo(() => ({o: new THREE.Object3D(), c: new THREE.Color(), hov: false, tip: false, call: 0, t0: -99, until: -99, up: 0, out: false, heart: 0, pet: 0}), []);

  useFrame((state, dt) => {
    const s = S.current, m = body.current, g = root.current; if (!m) return;
    dt = Math.min(dt, .05); if (import.meta.env.DEV && window.__jl?.fast) dt = .4; if (import.meta.env.DEV && window.__jl?.dt) dt = window.__jl.dt; // development only, see Stage in JL01.jsx
    const now = performance.now() / 1000 + ((import.meta.env.DEV && window.__jl?.skew) || 0);
    if (s.catCall && s.catCall !== K.call) { K.call = s.catCall; if (now > K.until) K.t0 = now; K.until = now + STAY; } // called: up it comes (called again while it is up, it stays longer)
    if (s.catPet && s.catPet !== K.pet) { K.pet = s.catPet; K.heart = 1.3; K.until = Math.max(K.until, now + 2); }
    const want = now < K.until && s.phase === 'on' && s.y < .04 && s.explode < .02 ? 1 : 0;
    K.up = damp(K.up, want, want ? 7 : 13, dt);
    if (K.out && !want) { K.out = false; K.until = -99; on.catGone(); } K.out = K.out || !!want; // gone again: Jay wonders
    const there = K.up > .02;
    if (K.tip && !there) { K.tip = K.hov = false; on.tip(''); }
    g.visible = there; if (!there) { g.scale.setScalar(1e-4); return; }
    if (K.hov && !K.tip) { K.tip = true; on.tipKey('poke'); }
    const e = K.up * K.up * (3 - 2 * K.up), age = now - K.t0, open = K.hov || K.heart > 0 || (age > .8 && age < 2.5); // up with its eyes shut; then a look; then shut again
    g.position.set(X, DOWN + (UP - DOWN) * e, Z); g.rotation.set(0, 0, Math.sin(now * 1.3) * .02 * e); g.scale.setScalar(1);

    let n = 0;
    for (const cell of CELLS) { const ch = catCell(cell.i, cell.j, open);
      const front = ch === 'P' && cell.j > 3 ? .6 : ch === 'W' ? (cell.j === 13 ? .6 : .3) : cell.j < 3 ? -.6 : 0; // nose, muzzle and paws stand out; the ears are thin
      K.o.position.set((cell.i - 8) * U, (13.5 - cell.j) * U, 0); K.o.rotation.set(0, 0, 0); K.o.scale.set(U, U, U * (4 + front * 2)); K.o.updateMatrix();
      m.setMatrixAt(n, K.o.matrix); m.setColorAt(n, K.c.set(CAT_INK[ch])); n++; }
    K.heart -= dt; const pop = K.heart > 0 ? clamp((1.3 - K.heart) * 8) * clamp(K.heart * 5) : 0;
    for (let q = 0; q < SPARE; q++) { const on2 = HEART[Math.floor(q / 5)][q % 5] === 'X' ? pop : 0;
      K.o.position.set((q % 5 - 2) * U * .9, (20 - Math.floor(q / 5) + Math.sin(now * 3) * .4) * U * .9, 0); K.o.scale.setScalar(Math.max(1e-4, U * .9 * on2)); K.o.updateMatrix();
      m.setMatrixAt(n, K.o.matrix); m.setColorAt(n, K.c.set('#ff4d6d')); n++; }
    m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true;
    if (!K.sized) { K.sized = true; m.computeBoundingSphere(); } // the pointer's test sphere, measured once the cubes are laid out (see hider.jsx)
    const ed = edge.current; if (ed.instanceMatrix !== m.instanceMatrix) ed.instanceMatrix = m.instanceMatrix;
    hull.userData.grow.value = damp(hull.userData.grow.value, s.choice === 'game' ? 2 : 1, 5, dt); ed.visible = hull.userData.grow.value > 1.02;
  });

  // only what is above the machine's top edge can be pointed at
  const seen = e => root.current.parent.worldToLocal(K.o.position.copy(e.point)).y > 1.1;
  const hover = v => { if (v === K.hov) return; K.hov = v; if (!v && K.tip) { K.tip = false; on.tip(''); } };
  return <group ref={root} name="cat" visible={false}>
    <instancedMesh ref={edge} args={[null, null, CELLS.length + SPARE]} material={hull} frustumCulled={false} raycast={() => null}><boxGeometry args={[1, 1, 1]}/></instancedMesh>
    <instancedMesh ref={body} args={[null, null, CELLS.length + SPARE]} material={mat} frustumCulled={false}
      onPointerMove={e => { const v = seen(e); if (v) e.stopPropagation(); hover(v); }} onPointerOut={() => hover(false)} onClick={e => { if (seen(e)) { e.stopPropagation(); on.pet(); } }}>
      <boxGeometry args={[1, 1, 1]}/>
    </instancedMesh>
  </group>;
}
