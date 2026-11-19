// The one who hides. A second figure, built the way Jay is built (a pixel sprite made of cubes) and in Jay's proportions:
// two heads high, the hair one block with the face looking out of its parting, a small grey jumper. Drawn after a photograph
// Jay Lin gave (long dark hair parted in the middle, a grey knitted jumper, and in half of the pictures a wink); he chose this look
// from the candidates in concepts/cast/.
// It belongs to the first screen. Once the machine is awake it leans out from behind the machine's right end, feet on the floor,
// fingers round the edge, and shows most of its face. Point at it and it leans out all the way and winks; click and it is gone behind
// the machine, calls out from there (the page hangs its word at the machine's edge: S.current.hider), and is back after a moment.
// When the page scrolls on it is out of the way before the machine comes apart.
import React, {useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';

const U = .056; // one pixel of the figure, in the scene's units (Jay's is .05: it stands a little further back than he does)
// H hair, h a lighter strand, S skin, g K eye (glint, dark), b cheek, M mouth, W w jumper (and its ribbing), L legs
const FIG = [
  '.....HHHHHHH.....',
  '...HHHHHHHHHHH...',
  '..HHHHhhhHHHHHH..',
  '.HHHHhHHHHHHHHHH.',
  '.HHHHHHHSHHHHHHH.',
  '.HHHHHSSSSSHHHHH.',
  '.HHHHSSSSSSSHHHH.',
  '.HHHSgKSSSgKSHHH.',
  '.HHHSKKSSSKKSHHH.',
  '.HHHSKKSSSKKSHHH.',
  '.HHHbbSSMSSbbHHH.',
  '.HHHHSSSSSSSHHHH.',
  '.HHhHHWWWWWHHhHH.',
  'HHHhHWWWWWWWHhHHH',
  'HHhhHWWWWWWWHhhHH',
  '.HhH.WWWWWWW.HhH.',
  '..h..WwWwWwW..h..',
  '......LL.LL......',
];
const INK = {H: '#4A3328', h: '#7A5540', S: '#F8DDCB', K: '#201613', g: '#FFFFFF', b: '#F4A9A0', M: '#D9606C', W: '#C9CDD6', w: '#A9AEBB', L: '#2B2E3A'};
const FRONT = {H: 1, h: 1, K: .12, g: .12, M: .12, W: .5, w: .5, L: .3}; // how far a cell stands out of the sprite: the hair and the jumper have bulk, the face sits inside the hair
const SIGN = {'!': ['..X..', '..X..', '..X..', '.....', '..X..'], heart: ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..']}, SIGN_INK = {'!': '#ff5a1f', heart: '#ff4d6d'};
const CELLS = FIG.flatMap((row, j) => [...row].map((ch, i) => ch !== '.' && {i, j, ch})).filter(Boolean);
const ROWS = FIG.length, MID = 8, SPARE = 25, GRIP = 3, clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), damp = THREE.MathUtils.damp;
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// Where it stands, in the machine's own space (the machine is 3.4 wide, 2.2 high and .5 deep, and stands on the floor): behind the
// back. IN: all of it behind the right end. PEEK: most of its face past it. FULL: the whole face. EDGE: the machine's right end.
const FLOOR = -1.1, BACK = -.56, IN = 1.14, PEEK = 1.66, FULL = 1.9, EDGE = 1.7, LEAN = .2, TURN = .14;

export default function VoxelHider({S, on}) {
  const body = useRef(), root = useRef(), edge = useRef(), grip = useRef();
  const hull = useMemo(() => { // on the game cartridge it is cut out like a sticker, as Jay is (see jay.jsx)
    const m = new THREE.MeshBasicMaterial({color: '#fff', side: THREE.BackSide, fog: false}); m.userData.grow = {value: 1};
    m.onBeforeCompile = sh => { sh.uniforms.uGrow = m.userData.grow;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uGrow;').replace('#include <begin_vertex>', 'vec3 transformed = vec3(position.xy * uGrow, position.z * (1. + (uGrow - 1.) * .04));'); };
    return m;
  }, []);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({color: '#fff', roughness: .6, fog: false});
    m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * .34;'); }; // a little light of its own: dark hair on a dark stage
    return m;
  }, []);
  const K = useMemo(() => ({o: new THREE.Object3D(), c: new THREE.Color(), v: new THREE.Vector3(), out: 0, full: 0, since: null, hov: false, hop: -1, sign: null, signT: 0, shy: 0, tip: false}), []);

  useFrame((state, dt) => {
    const s = S.current, m = body.current, g = root.current, gr = grip.current; if (!m) return;
    dt = Math.min(dt, .05); if (import.meta.env.DEV && window.__jl?.fast) dt = .4; if (import.meta.env.DEV && window.__jl?.dt) dt = window.__jl.dt; // development only, see Stage in JL01.jsx
    const now = performance.now() / 1000 + ((import.meta.env.DEV && window.__jl?.skew) || 0), hero = 1 - sm(.04, .2, s.y);
    if (s.phase !== 'on') K.since = null; else if (K.since == null) K.since = now;
    if (s.shy && s.shy !== K.shy) { K.shy = s.shy; K.t0 = now; K.till = now + 2.1; K.sign = '!'; K.signT = .9; K.hov = false; if (K.tip) { K.tip = false; on.tip(''); } } // clicked: gone, and back after a moment
    const want = K.since != null && now - K.since > .9 && hero > .5 && !(now < K.till) ? 1 : 0;
    K.out = damp(K.out, want, want ? 3 : 14, dt); // out slowly, in at once
    const tall = state.size.width / state.size.height < .9; // a phone has little room beside the machine: a smaller figure there
    const out = K.out, k = sm(0, .5, hero) * (tall ? .9 : 1), there = out > .015 && k > .001;
    // Once it is behind the machine it calls out. Where the word hangs on the page: at the machine's right edge, a little over its head
    { const H = s.hider, age = now - (K.t0 ?? -99); H.on = age > .32 && age < 1.8 && hero > .5 && s.phase === 'on';
      if (H.on) { g.parent.localToWorld(K.v.set(EDGE + .04, FLOOR + ROWS * U * (tall ? .9 : 1) + .1, BACK)).project(state.camera);
        H.sx = (K.v.x * .5 + .5) * state.size.width; H.sy = (-K.v.y * .5 + .5) * state.size.height; } } // the scroll itself takes it away, however fast: it is gone before the machine starts to open
    if (K.tip && !there) { K.tip = K.hov = false; on.tip(''); } // it went while the pointer was on it: the pointer's label goes too
    g.visible = gr.visible = there; if (!there) { g.scale.setScalar(1e-4); gr.scale.setScalar(1e-4); edge.current.visible = false; return; }
    if (K.hov && !K.tip) { K.tip = true; on.tipKey('poke'); if (K.hop < 0) K.hop = 0; K.sign = 'heart'; K.signT = 1.3; }
    let up = 0; if (K.hop >= 0) { K.hop += dt / .36; up = Math.sin(Math.PI * Math.min(1, K.hop)) * .1; if (K.hop >= 1) K.hop = -1; }
    K.full = damp(K.full, K.hov ? 1 : 0, 7, dt); // pointed at, it comes out all the way
    const e = out * out * (3 - 2 * out), lean = -(LEAN + Math.sin(now * 1.1) * .018) * e;
    g.position.set(IN + (PEEK - IN) * e + (FULL - PEEK) * K.full * e, FLOOR + up, BACK); g.rotation.set(0, TURN, lean); g.scale.set(k, k * (1 + Math.sin(now * 1.8) * .012), k);

    const wink = K.hov, blink = now % 4.3 < .13; let n = 0;
    for (const cell of CELLS) { let ch = cell.ch;
      if ((cell.j === 7 || cell.j === 8) && (ch === 'g' || ch === 'K') && (blink || (wink && cell.i < MID))) ch = 'S'; // a shut eye is its bottom row alone
      const front = FRONT[ch] || 0;
      K.o.position.set((cell.i - MID) * U, (ROWS - .5 - cell.j) * U, 0); K.o.rotation.set(0, 0, 0); K.o.scale.set(U, U, U * (4 + front * 2)); K.o.updateMatrix();
      m.setMatrixAt(n, K.o.matrix); m.setColorAt(n, K.c.set(INK[ch])); n++; }
    // the sign over its head
    K.signT -= dt; const sign = K.signT > 0 ? K.sign : null, rows = sign ? SIGN[sign] : null, pop = sign ? clamp((sign === '!' ? .9 : 1.3) - K.signT, 0, .12) / .12 * clamp(K.signT * 5) : 0;
    for (let q = 0; q < SPARE; q++) { const on2 = rows && rows[Math.floor(q / 5)][q % 5] === 'X' ? pop : 0;
      K.o.position.set((q % 5 - 2) * U * .8, (ROWS + 1.6) * U + (4.5 - Math.floor(q / 5) + Math.sin(now * 3) * .4) * U * .8, 0); K.o.scale.setScalar(Math.max(1e-4, U * .8 * on2)); K.o.updateMatrix();
      m.setMatrixAt(n, K.o.matrix); m.setColorAt(n, K.c.set(sign ? SIGN_INK[sign] : '#000')); n++; }
    m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true;
    // The pointer is tested against a sphere round the cubes, measured once. A pointer that moved before the cubes were first laid out
    // would have measured an empty figure, and the head could never be pointed at: measure again now that they are in place
    if (!K.sized) { K.sized = true; m.computeBoundingSphere(); }
    const ed = edge.current; if (ed.instanceMatrix !== m.instanceMatrix) ed.instanceMatrix = m.instanceMatrix;
    hull.userData.grow.value = damp(hull.userData.grow.value, s.choice === 'game' ? 2 : 1, 5, dt); ed.visible = hull.userData.grow.value > 1.02;

    // its fingers on the machine: two round the front of the right end, and the palm on the end itself. They let go first.
    const hold = sm(.55, .95, out) * k, gy = FLOOR + 8.6 * U;
    gr.scale.setScalar(1);
    for (let q = 0; q < GRIP; q++) { const palm = q === 2;
      if (palm) { K.o.position.set(EDGE + U * .4, gy, .17); K.o.scale.set(U * .8 * hold, U * 1.75 * hold, .32 * hold || 1e-4); } // from behind the end to the front of the glass (.28), where the fingers start
      else { K.o.position.set(EDGE - U * .55 + (1 - hold) * U * 2, gy + (q - .5) * U * .9, .28 + U * .4); K.o.scale.set(U * 1.25 * hold || 1e-4, U * .76 * hold || 1e-4, U * .8 * hold || 1e-4); }
      K.o.rotation.set(0, 0, 0); K.o.updateMatrix(); gr.setMatrixAt(q, K.o.matrix); gr.setColorAt(q, K.c.set('#E7C6B2')); } // a shade under the face: they face the lamps head on, and the full skin tone burns out
    gr.instanceMatrix.needsUpdate = true; if (gr.instanceColor) gr.instanceColor.needsUpdate = true;
  });

  // only the half the machine does not hide can be pointed at. The pointer's label is taken down here, as the pointer leaves,
  // and not a frame later: by then it may already be the label of the next thing
  const seen = e => root.current.parent.worldToLocal(K.v.copy(e.point)).x > EDGE - .04;
  const hover = v => { if (v === K.hov) return; K.hov = v; if (!v && K.tip) { K.tip = false; on.tip(''); } };
  return <>
    <group ref={root} name="hider" visible={false}>
      <instancedMesh ref={edge} args={[null, null, CELLS.length + SPARE]} material={hull} frustumCulled={false} raycast={() => null}><boxGeometry args={[1, 1, 1]}/></instancedMesh>
      <instancedMesh ref={body} args={[null, null, CELLS.length + SPARE]} material={mat} frustumCulled={false}
        onPointerMove={e => { const v = seen(e); if (v) e.stopPropagation(); hover(v); }} onPointerOut={() => hover(false)}
        onClick={e => { if (seen(e)) { e.stopPropagation(); on.shy(); } }}>
        <boxGeometry args={[1, 1, 1]}/>
      </instancedMesh>
    </group>
    <instancedMesh ref={grip} name="hider-grip" args={[null, null, GRIP]} material={mat} frustumCulled={false} raycast={() => null} visible={false}><boxGeometry args={[1, 1, 1]}/></instancedMesh>
  </>;
}
