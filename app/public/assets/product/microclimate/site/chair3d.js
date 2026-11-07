// The V9l chair, live: one transparent WebGL canvas the whole page shares. Exported from Blender (blender/web3d9l.py),
// posed here with the same pivots as the Blender rig (back_g / seat_g for recline, the lumbar pad's bow0..6 shape keys
// for lumbar height) and the same 11 explode modules. Two looks: the product (physical materials) and a thermal camera,
// where each zone's temperature spreads out from the real heating-wire layout.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';

const Z2Y = (p) => new THREE.Vector3(p[0], p[2], -p[1]);          // Blender z-up -> three y-up
const sanitize = (n) => n.replace(/\s/g, '_').replace(/[\[\]\.:\/]/g, '');
const PADS = { A: 'upper_pad', B: 'lumbar_pad', C: 'seat_cushion' };
const WIRES = { A: 'heat_A', B: 'heat_B', C: 'heat_C' };
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));

// ---- thermal look, injected into every physical material -------------------------------------------------------------
const G = { uScan: { value: -1 }, uAmbT: { value: 24 }, uTime: { value: 0 } };   // shared by all materials
const THERMAL_GLSL = /* glsl */`
uniform float uScan, uAmbT, uBaseT, uPad, uZoneT, uSig, uFill, uAir, uAirR;
varying vec3 vWPos; varying float vWd; varying float vCd;
vec3 thermalRamp(float t) {           // an "iron" style ramp: cold navy, blue, purple, magenta, red, orange, yellow, white (sRGB)
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(.02, .01, .10), c1 = vec3(.11, .10, .48), c2 = vec3(.36, .11, .62), c3 = vec3(.69, .16, .56);
  vec3 c4 = vec3(.91, .28, .29), c5 = vec3(1.0, .54, .12), c6 = vec3(1.0, .82, .25), c7 = vec3(1.0, .98, .90);
  if (t < .18) return mix(c0, c1, t / .18);
  if (t < .32) return mix(c1, c2, (t - .18) / .14);
  if (t < .48) return mix(c2, c3, (t - .32) / .16);
  if (t < .62) return mix(c3, c4, (t - .48) / .14);
  if (t < .76) return mix(c4, c5, (t - .62) / .14);
  if (t < .9) return mix(c5, c6, (t - .76) / .14);
  return mix(c6, c7, (t - .9) / .1);
}
float zoneTemp() {
  if (uPad < 0.5) return uAmbT + uBaseT;
  float f;
  if (uAir > 0.5) f = 1.0 - smoothstep(uAirR, uAirR + 0.07, vCd);
  else f = mix(exp(-vWd * vWd / (2.0 * uSig * uSig)), 1.0, uFill);
  return uAmbT + (uZoneT - uAmbT) * f;
}`;
function thermalize(mat, own) {
  mat.userData.th = own;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, G, own);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float wd; attribute float cd;\nvarying vec3 vWPos; varying float vWd; varying float vCd;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz; vWd = wd; vCd = cd;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + THERMAL_GLSL)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
      {
        float T = zoneTemp();
        vec3 th = pow(thermalRamp((T - 20.0) / 20.0), vec3(2.2));
        float nv = abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
        th *= 0.5 + 0.5 * nv;
        #ifdef USE_COLOR
          th *= 0.5 + 0.5 * vColor.r;
        #endif
        float k = 1.0 - smoothstep(uScan - 0.025, uScan, vWPos.y);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, th, k);
        float line = (1.0 - smoothstep(0.0, 0.006, abs(vWPos.y - uScan))) * step(-0.5, uScan) * step(uScan, 1.6);
        gl_FragColor.rgb += vec3(0.55, 0.85, 1.0) * line * 1.2;
      }`);
  };
  mat.customProgramCacheKey = () => 'thermal1';
  return mat;
}
const ownUniforms = (off) => ({ uBaseT: { value: off }, uPad: { value: 0 }, uZoneT: { value: 24 }, uSig: { value: .01 },
                                   uFill: { value: 0 }, uAir: { value: 0 }, uAirR: { value: 0 } });

// ---- a knit normal map, drawn once (jersey: columns of V stitches) ------------------------------------------------------
function knitNormal() {
  const N = 256, cw = 8, ch = 8, H = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = (x % cw) / cw * 2 - 1, v = (y % ch) / ch; let h = 0;
    for (const s of [-1, 1]) { const cx = s * (.48 - .32 * (v - .5)); h += Math.exp(-((u - cx) ** 2) / .06) * (.55 + .45 * Math.sin(Math.PI * v)); }
    H[y * N + x] = h;
  }
  const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), im = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const hx = H[y * N + (x + 1) % N] - H[y * N + (x + N - 1) % N], hy = H[((y + 1) % N) * N + x] - H[((y + N - 1) % N) * N + x];
    const n = new THREE.Vector3(-hx * 1.4, -hy * 1.4, 1).normalize(), i = (y * N + x) * 4;
    im.data[i] = (n.x * .5 + .5) * 255; im.data[i + 1] = (n.y * .5 + .5) * 255; im.data[i + 2] = (n.z * .5 + .5) * 255; im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = THREE.NoColorSpace;
  return t;
}
// box-projected uvs in the mesh's own space (1 uv = 1 m * s)
function boxUV(geo, s) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let a, b;
    if (ax >= ay && ax >= az) { a = p.getZ(i); b = p.getY(i); } else if (ay >= az) { a = p.getX(i); b = p.getZ(i); } else { a = p.getX(i); b = p.getY(i); }
    uv[i * 2] = a * s; uv[i * 2 + 1] = b * s;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

// the stitches were in place when the occlusion was baked, so the fabric carries a dashed shadow beside every seam;
// a few rounds of neighbour averaging keep the seam's soft groove and lose the dashes
function smoothAO(geo, iters) {
  const col = geo.attributes.color, a = geo.index && geo.index.array; if (!a) return;
  const n = col.count, sum = new Float32Array(n), cnt = new Float32Array(n);
  let c = new Float32Array(n); for (let i = 0; i < n; i++) c[i] = col.getX(i);
  for (let it = 0; it < iters; it++) {
    sum.fill(0); cnt.fill(0);
    for (let t = 0; t < a.length; t += 3) {
      const i = a[t], j = a[t + 1], k = a[t + 2];
      sum[i] += c[j] + c[k]; sum[j] += c[i] + c[k]; sum[k] += c[i] + c[j]; cnt[i] += 2; cnt[j] += 2; cnt[k] += 2;
    }
    const nc = new Float32Array(n); for (let i = 0; i < n; i++) nc[i] = (c[i] + sum[i]) / (1 + cnt[i]); c = nc;
  }
  for (let i = 0; i < n; i++) col.setXYZ(i, c[i], c[i], c[i]);
  col.needsUpdate = true;
}

// ---- a photo studio for reflections: graded walls, a big overhead softbox, a tall key strip front left, a cool rim strip
// behind on the right and a low fill; gives the white plastic and the polished base long, product-shot highlights ----------
function studioEnv(renderer) {
  const sc = new THREE.Scene();
  const sg = new THREE.SphereGeometry(20, 48, 24), col = new Float32Array(sg.attributes.position.count * 3);
  for (let i = 0; i < sg.attributes.position.count; i++) {
    const y = sg.attributes.position.getY(i) / 20, k = y > 0 ? .42 + .5 * Math.pow(y, .8) : .2 + .22 * (1 + y);
    col[i * 3] = k; col[i * 3 + 1] = k * 1.01; col[i * 3 + 2] = k * 1.04;
  }
  sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  sc.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const panel = (w, h, pos, k, hex = '#ffffff') => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, .6, 0); sc.add(m);
  };
  panel(7, 5, [0, 7.5, 1.5], 3.2);                    // overhead
  panel(1.4, 6, [-6.5, 2.6, 4.2], 7);                 // key strip
  panel(1.1, 6, [6.2, 2.8, -4.4], 6, '#e4ecff');      // rim strip
  panel(3.5, 3, [6, 1.4, 5.5], 1.6);                  // fill
  panel(12, 12, [0, -2.2, 0], .12);                   // dark floor: the polished base reads as a dark chrome
  const pm = new THREE.PMREMGenerator(renderer), t = pm.fromScene(sc, .02).texture; pm.dispose();
  return t;
}

// ---- physical materials by Blender material name -------------------------------------------------------------------
function makeMaterials(knit) {
  const P = (o) => new THREE.MeshPhysicalMaterial(o);
  const c = (h) => new THREE.Color(h);
  return {
    fabric: () => P({ color: c('#989b9f'), roughness: .93, sheen: .4, sheenRoughness: .6, sheenColor: c('#ffffff'), normalMap: knit, normalScale: new THREE.Vector2(.45, .45) }),
    fabricD: () => P({ color: c('#5b5e62'), roughness: .94, sheen: .5, sheenRoughness: .6, sheenColor: c('#d8dadd'), normalMap: knit, normalScale: new THREE.Vector2(.45, .45) }),
    welt: () => P({ color: c('#74777c'), roughness: .62, sheen: .3, sheenColor: c('#ffffff') }),
    thread: () => P({ color: c('#9a9da1'), roughness: .95 }),       // the fabric's own grey: at web sizes a contrasting stitch reads as a zip
    frame: () => P({ color: c('#eeece8'), roughness: .38, clearcoat: .25, clearcoatRoughness: .3 }),
    grey: () => P({ color: c('#b6b5b2'), roughness: .42, clearcoat: .15, clearcoatRoughness: .35 }),
    pu: () => P({ color: c('#7b7e83'), roughness: .62, sheen: .25, sheenColor: c('#ffffff') }),
    chassis: () => P({ color: c('#2a2b2e'), roughness: .45, metalness: .3 }),
    blackP: () => P({ color: c('#1e1f21'), roughness: .48 }),
    rubber: () => P({ color: c('#18191b'), roughness: .82 }),
    baseM: () => P({ color: c('#d9dbde'), roughness: .14, metalness: 1 }),
    alu: () => P({ color: c('#cfd1d4'), roughness: .2, metalness: 1 }),
    satin: () => P({ color: c('#c0c3c6'), roughness: .3, metalness: 1 }),
  };
}
// the two finishes of the Blender build (make_materials8 'white' / 'black'): [colour, roughness, metalness] per material
const FINISH = {
  white: { fabric: ['#989b9f', .93, 0], fabricD: ['#5b5e62', .94, 0], welt: ['#74777c', .62, 0], frame: ['#eeece8', .38, 0], grey: ['#b6b5b2', .42, 0],
    pu: ['#7b7e83', .62, 0], chassis: ['#2a2b2e', .45, .3], blackP: ['#1e1f21', .48, 0], baseM: ['#d9dbde', .14, 1], alu: ['#cfd1d4', .2, 1], satin: ['#c0c3c6', .3, 1], seam: ['#8a8d91', .9, 0] },
  black: { fabric: ['#36383c', .95, 0], fabricD: ['#1f2023', .96, 0], welt: ['#4a4d51', .65, 0], frame: ['#1f2022', .45, 0], grey: ['#3a3c3f', .45, 0],
    pu: ['#2c2d30', .62, 0], chassis: ['#1a1b1d', .48, .3], blackP: ['#141517', .5, 0], baseM: ['#2a2b2e', .25, .9], alu: ['#3c3e42', .25, 1], satin: ['#55585c', .32, 1], seam: ['#2a2c2f', .9, 0] },
};

export class ChairStage {
  constructor(host, { base = './assets/' } = {}) {
    this.host = host; this.base = base;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.small = Math.min(innerWidth, innerHeight) < 600; r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.small ? 1.6 : 2)); r.setClearColor(0x000000, 0);
    r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.0; r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = !this.small; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.shadowMap.autoUpdate = false;       // the key light never moves: its shadow is redrawn only when the chair changes shape
    this.maxPR = Math.min(window.devicePixelRatio || 1, this.small ? 1.6 : 2);
    host.appendChild(r.domElement); r.domElement.style.display = 'block';
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(26, 1, .05, 30);
    this.scene.environment = studioEnv(r);
    this.scene.environmentIntensity = 1.0;
    const key = this.key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-1.6, 3.2, 2.4); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -1, right: 1, top: 1.6, bottom: -.3, near: .5, far: 7 });
    key.shadow.bias = -.0004; key.shadow.normalBias = .012; key.shadow.radius = 4; this.scene.add(key);
    const rim = this.rim = new THREE.DirectionalLight(0xdfe8ff, .9); rim.position.set(2.2, 2.0, -2.6); this.scene.add(rim);
    this.chair = new THREE.Group(); this.scene.add(this.chair);
    // camera rig: eased toward its target every frame; pointer adds a small parallax
    // az: degrees round the chair (0 = in front), el: degrees up, dist: metres, sx/sy: where the target sits on screen
    this.view = { az: 30, el: 12, dist: 3.6, tgt: new THREE.Vector3(0, .62, 0), fov: 26, sx: 0, sy: 0 };
    this.cur = { az: 30, el: 12, dist: 3.6, tgt: this.view.tgt.clone(), fov: 26, sx: 0, sy: 0 };
    this.look = { env: 1, key: 1.6, rim: .9, shadow: .85, floor: 0 }; this.curLook = { ...this.look };
    this.parallax = new THREE.Vector2(); this.par = new THREE.Vector2();
    // pose, in the units of the design table: recl deg; lum = lumbar apex mm; seat 0-1 over the 130 mm gas lift (0.5 = as built);
    // depth = seat slide mm; armH 0-110 mm, armW -47..+20 mm (+ = outward), armD +-25 mm (+ = forward), armR -20..+10 deg
    // (- = front inward); lumD 0-20 mm; headU 0-100 mm; headT 0-20 deg; levH / levD = how far each paddle is pulled (0-1);
    // door 0-1 (battery door open), batt 0-1 (pack out)
    this.state = { recl: 0, lum: 205, explode: 0, thermal: 0, seat: .5, depth: 0, armH: 0, armW: 0, armD: 0, armR: 0, lumD: 0, headU: 0, headT: 0, levH: 0, levD: 0, door: 0, batt: 0 };
    this.cs = Object.fromEntries(Object.entries(this.state).filter(([k]) => k !== 'thermal'));
    this.zones = { A: { mode: 'off', level: 0, t: 0 }, B: { mode: 'off', level: 0, t: 0 }, C: { mode: 'off', level: 0, t: 0 } };
    this.zv = {}; for (const z of 'ABC') this.zv[z] = { T: 24, sig: .006, fill: 0, glow: 0, air: 0, airR: 0 };
    this.timeScale = 1; this.visible = true; this.onFrame = null; this.G = G;
    this.clock = new THREE.Clock();
    this._resize = () => this.resize(); new ResizeObserver(this._resize).observe(host); this.resize();
  }
  resize() {
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false); this.renderer.domElement.style.width = w + 'px'; this.renderer.domElement.style.height = h + 'px';
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.aspect = w / h;
    this.busy = 2;      // a resized canvas comes back blank
  }
  async load(onProgress) {
    // WebAssembly decoder first; if the page isn't allowed to compile WebAssembly, the plain-JS decoder
    // the model ships as base64 text (artifact hosting serves text, not .glb); read it with progress, then decode
    // the page starts both downloads before any script loads (window.__mcPre in index.html); fetch them here if it didn't
    const pre = window.__mcPre || {}, get0 = (p, f) => (p || Promise.reject()).catch(() => fetch(this.base + f, { cache: 'no-cache' }));
    const res0 = await get0(pre.glb, 'chair.glb.txt'), total = +res0.headers.get('content-length') || 5.5e6;
    const reader = res0.body.getReader(), parts = []; let got = 0;
    for (;;) { const { done, value } = await reader.read(); if (done) break; parts.push(value); got += value.length; onProgress && onProgress(Math.min(.98, got / total)); }
    const txt = new TextDecoder().decode(await new Blob(parts).arrayBuffer()), bin = atob(txt.trim()), buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    const get = (type) => {
      const draco = new DRACOLoader().setDecoderPath(this.base + 'draco/').setDecoderConfig({ type });
      const loader = new GLTFLoader().setDRACOLoader(draco);
      return new Promise((res, rej) => loader.parse(buf.buffer, '', res, rej));
    };
    const [gltf, info] = await Promise.all([
      get(typeof WebAssembly === 'object' ? 'wasm' : 'js').catch((e) => { console.warn('wasm decoder failed, using js', e); return get('js'); }),
      get0(pre.json, 'chair.json').then((r) => r.json())]);
    this.info = info; const root = gltf.scene; this.chair.add(root); this.root = root;
    const byName = {}; for (const k of Object.keys(info.objects)) byName[sanitize(k)] = k;
    this.nodes = {}; root.traverse((o) => { this.nodes[o.name] = o; });
    const knit = knitNormal(), M = makeMaterials(knit), shared = {};
    // offsets from room temperature as a thermal camera reads them: polished metal reflects the cold room, the pod's electronics run warm
    const baseT = { baseM: -3.5, alu: -2.5, satin: -2, rubber: 0, blackP: .4, chassis: 1.5 };
    this.meshes = []; this.padMesh = {}; this.wireMesh = {};
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      if (!o.isMesh) return;
      let a = o, key = null; while (a && !key) { key = byName[a.name] || null; a = a.parent; }
      o.userData.obj = key; o.userData.module = key ? info.objects[key].m : 'pod';
      const mname = (o.material && o.material.name || '').replace(/\.\d+$/, '');
      o.castShadow = o.receiveShadow = true; o.frustumCulled = false;
      const zone = Object.keys(PADS).find((z) => PADS[z] === key), wz = Object.keys(WIRES).find((z) => WIRES[z] === key);
      if (wz) { this.wireMesh[wz] = o; return; }
      // seams: in the Cycles renders a seam reads as one soft line and the stitches vanish at that size; at web size the
      // stitch tubes and the dark welt read as a zip, so the stitches go and the seam takes a quiet grey of its own
      if (/_thread/.test(key || '')) { o.visible = false; return; }
      let mat;
      if (/_seam/.test(key || '')) mat = shared.seam || (shared.seam = new THREE.MeshPhysicalMaterial({ color: '#8a8d91', roughness: .9 }));
      else if (M[mname]) {
        if (zone || mname.startsWith('fabric')) { mat = M[mname](); mat.side = THREE.DoubleSide; boxUV(o.geometry, 14); }
        // parts with pose shapes get their own copy: three.js would otherwise rebuild the shader choice for every part, every frame
        else { const sk = mname + '|' + (o.geometry.morphAttributes.position ? o.geometry.morphAttributes.position.length : 0); mat = shared[sk] || (shared[sk] = M[mname]()); }
      } else { mat = o.material; if (mat.isMeshStandardMaterial) mat.envMapIntensity = 1; }
      if (!mat.userData.th) thermalize(mat, ownUniforms(baseT[mname] ?? .2));
      if (!o.geometry.attributes.color) { const n = o.geometry.attributes.position.count; o.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3)); }
      else if (mname.startsWith('fabric')) smoothAO(o.geometry, 8);
      // the seam sits in its groove, so its baked occlusion is near black; it takes the light as it is
      mat.vertexColors = mat !== shared.seam;
      mat.userData.fin = mat === shared.seam ? 'seam' : mname;
      o.material = mat; this.meshes.push(o);
      if (zone) { this.padMesh[zone] = o; mat.userData.th.uPad.value = 1; }
    });
    this.fields(info);
    this.wires();
    this.airInit();
    this.explodeInit(info);
    // parts the design rebuilds for every pose (rubber boot, synchro links and pins, front seal, cables) carry their shapes at
    // 10 / 20 / 30 deg of recline and 40 / 80 mm of seat slide as morph targets
    this.poseMorph = []; root.traverse((o) => { const d = o.morphTargetDictionary; if (o.isMesh && d && (d.r10 !== undefined || d.d40 !== undefined)) this.poseMorph.push(o); });
    this.pivots = { back: this.nodes.back_g, seat: this.nodes.seat_g };
    for (const p of Object.values(this.pivots)) p.userData.q0 = p.quaternion.clone();
    this.rigInit();
    // every material that changes between the white and the black finish, once each
    this.finMats = [...new Set(this.meshes.map((m) => m.material))].filter((m) => FINISH.white[m.userData.fin]);
    this.finK = 0; this.finT = 0;
    // centre and size reference
    const box = new THREE.Box3().setFromObject(root); this.box = box;
    this.contactInit(box);
    this.loop();
    return this;
  }
  // per-vertex distance to the zone's heating wire (wd, metres) and normalised distance from the pad's middle (cd)
  fields(info) {
    for (const z of 'ABC') {
      const m = this.padMesh[z]; if (!m) continue;
      const pts = (info.wires[z] || []).map(Z2Y), g = m.geometry, p = g.attributes.position, n = p.count;
      const wd = new Float32Array(n), cd = new Float32Array(n), v = new THREE.Vector3(), W = m.matrixWorld;
      const P = new Float32Array(pts.length * 3); pts.forEach((q, i) => { P[i * 3] = q.x; P[i * 3 + 1] = q.y; P[i * 3 + 2] = q.z; });
      const box = new THREE.Box3(); const wp = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { v.fromBufferAttribute(p, i).applyMatrix4(W); wp[i * 3] = v.x; wp[i * 3 + 1] = v.y; wp[i * 3 + 2] = v.z; box.expandByPoint(v); }
      const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3()), R = Math.max(s.x, s.y, s.z) / 2;
      for (let i = 0; i < n; i++) {
        const x = wp[i * 3], y = wp[i * 3 + 1], zz = wp[i * 3 + 2]; let best = 1e9;
        for (let j = 0; j < P.length; j += 3) { const dx = x - P[j], dy = y - P[j + 1], dz = zz - P[j + 2], d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; }
        wd[i] = Math.sqrt(best);
        const ex = (x - c.x) / (s.x / 2 || 1), ey = (y - c.y) / (Math.max(s.y, s.z) / 2 || 1); cd[i] = Math.min(1.4, Math.hypot(ex, ey * .8));
      }
      g.setAttribute('wd', new THREE.BufferAttribute(wd, 1)); g.setAttribute('cd', new THREE.BufferAttribute(cd, 1));
      m.userData.wd = wd;
    }
    // the other meshes still need the attributes declared; WebGL's default (0) is fine for them
  }
  // the heating wires: a hot core and a soft halo, pushed a few mm toward the camera so they read through the knit
  wires() {
    this.wireMats = {};
    for (const z of 'ABC') {
      const m = this.wireMesh[z]; if (!m) continue;
      const u = { uGlow: { value: 0 }, uPush: { value: .006 }, uThick: { value: 0 }, uColor: { value: new THREE.Color('#ff7a2f') } };
      const mk = (thick, opacity, halo) => {
        const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
        mat.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, u, { uT: { value: thick }, uO: { value: opacity } });
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uPush, uT; varying float vF;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normal * uT;')
            .replace('#include <project_vertex>', `#include <project_vertex>
              mvPosition.xyz += normalize(-mvPosition.xyz) * uPush; gl_Position = projectionMatrix * mvPosition;
              vec3 nv = normalize(normalMatrix * normal); vF = abs(dot(nv, normalize(-mvPosition.xyz)));`);
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGlow, uO; uniform vec3 uColor; varying float vF;')
            .replace('#include <opaque_fragment>', `vec3 col = uColor * (${halo ? 'pow(vF, 2.0)' : '0.6 + 0.8 * vF'}) * uGlow * uO; gl_FragColor = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));`);
        };
        mat.customProgramCacheKey = () => 'wire' + (halo ? 'h' : 'c');
        return mat;
      };
      m.material = mk(0, 1.4, false); m.renderOrder = 5; m.castShadow = m.receiveShadow = false;
      const halo = new THREE.Mesh(m.geometry, mk(.0045, .55, true)); halo.renderOrder = 6;
      if (m.morphTargetInfluences) { halo.morphTargetInfluences = m.morphTargetInfluences; halo.morphTargetDictionary = m.morphTargetDictionary; }
      m.add(halo); this.wireMats[z] = u; m.visible = false;
    }
  }
  // air: soft points leaving the pad's front face along its normals
  airInit() {
    this.airMats = {};
    for (const z of 'ABC') {
      const m = this.padMesh[z]; if (!m) continue;
      const g = m.geometry, p = g.attributes.position, nr = g.attributes.normal, N = 900;
      const nm = new THREE.Matrix3().getNormalMatrix(m.matrixWorld), v = new THREE.Vector3();
      const want = z === 'C' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, .15, 1).normalize();
      const cand = []; for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(nr, i).applyMatrix3(nm).normalize(); const d = v.dot(want); if (Math.abs(d) > .75) cand.push(d > 0 ? i : -1 - i); }
      if (!cand.length) continue;
      const pos = new Float32Array(N * 3), dir = new Float32Array(N * 3), seed = new Float32Array(N);
      for (let k = 0; k < N; k++) {
        const c0 = cand[(Math.random() * cand.length) | 0], i = c0 < 0 ? -1 - c0 : c0, sg = c0 < 0 ? -1 : 1;
        pos[k * 3] = p.getX(i); pos[k * 3 + 1] = p.getY(i); pos[k * 3 + 2] = p.getZ(i);
        dir[k * 3] = sg * nr.getX(i); dir[k * 3 + 1] = sg * nr.getY(i); dir[k * 3 + 2] = sg * nr.getZ(i); seed[k] = Math.random();
      }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      bg.setAttribute('dir', new THREE.BufferAttribute(dir, 3)); bg.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
      const u = { uTime: G.uTime, uAmt: { value: 0 }, uPx: { value: this.renderer.getPixelRatio() }, uCold: { value: 0 } };
      const mat = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `uniform float uTime, uAmt, uPx; attribute vec3 dir; attribute float seed; varying float vA;
          void main() { float t = fract(uTime * (0.32 + 0.22 * seed) + seed * 7.0);
            vec3 p = position + normalize(dir) * (0.004 + t * (0.07 + 0.06 * seed));
            vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
            vA = sin(3.14159 * t) * uAmt * (0.5 + 0.5 * seed); gl_PointSize = uPx * (1.6 + 2.6 * (1.0 - t)) * (1.4 / -mv.z); }`,
        fragmentShader: `uniform float uCold; varying float vA; void main() { vec2 q = gl_PointCoord - 0.5; float d = dot(q, q);
            if (d > 0.25) discard; vec3 c = mix(vec3(0.75, 0.95, 1.0), vec3(0.7, 0.9, 1.0), uCold) * (1.0 + 0.6 * uCold);
            float a = vA * (1.0 - d * 4.0); gl_FragColor = vec4(c * a, a); }` });
      const pts = new THREE.Points(bg, mat); pts.frustumCulled = false; pts.renderOrder = 7; m.add(pts); this.airMats[z] = u;
    }
  }
  explodeInit(info) {
    const off = {}; for (const [k, v] of Object.entries(info.const.OFF9)) off[k] = Z2Y(v);
    this.exNodes = [];
    const seen = new Set();
    this.root.updateMatrixWorld(true);
    this.root.traverse((o) => {
      const key = o.userData.obj || (o.isMesh ? null : null);
      if (!o.isMesh && !o.children.some((c) => c.isMesh)) return;
      const k = o.isMesh ? o.userData.obj : null; if (!k || seen.has(o)) return;
      // move the topmost node that carries this Blender object
      let n = o; while (n.parent && n.parent.userData.obj === k && n.parent !== this.root) n = n.parent;
      if (seen.has(n)) return; seen.add(n);
      const mod = info.objects[k].m, d = off[mod] ? off[mod].clone() : new THREE.Vector3();
      if (mod === 'arm') { const wp = new THREE.Box3().setFromObject(n).getCenter(new THREE.Vector3()); d.x = Math.sign(wp.x || 1) * Math.abs(d.x); }
      n.userData.exOff = d; n.userData.p0 = n.position.clone(); n.userData.objName = k.replace(/\.\d+$/, ''); this.exNodes.push(n);
    });
    this.exNodes.sort((a, b) => depth(a) - depth(b));
    function depth(o) { let d = 0; while (o.parent) { d++; o = o.parent; } return d; }
  }
  // the rig nodes keep their rest transform; parts with no rig node (levers, battery door, pack) get a pivot group at
  // their hinge, with the parts moved under it in place
  rigInit() {
    const N = this.nodes, C = this.info.const, rest = (o) => { if (o) o.userData.r0 = { p: o.position.clone(), q: o.quaternion.clone() }; return o; };
    for (const k of ['up', 'col_mid', 'col_mid2', 'seat_slide', 'armR_top', 'armL_top', 'armR_cap', 'armL_cap', 'lumbar', 'lumbar_bh', 'head_stem', 'head_tilt']) rest(N[k]);
    this.UB = Z2Y(C.UB).normalize(); this.NB = Z2Y(C.NB).normalize();
    this.root.updateMatrixWorld(true);
    const parts = (re) => this.exNodes.filter((n) => re.test(n.userData.objName || ''));
    const box = (ns) => { const b = new THREE.Box3(), t = new THREE.Box3(); for (const n of ns) { n.updateMatrixWorld(true); t.setFromObject(n); b.union(t); } return b; };
    const pivot = (ns, at) => {
      if (!ns.length) return null;
      const g = new THREE.Group(), par = ns[0].parent; par.add(g); g.position.copy(par.worldToLocal(at.clone())); g.updateMatrixWorld(true);
      for (const n of ns) { g.attach(n); n.userData.p0 = n.position.clone(); }
      return rest(g);
    };
    const lh = parts(/^lever_height/), ld = parts(/^lever_depth/);
    const dr = parts(/^(pod_door|pod_release_key)/), bt = parts(/^battery(?!_rail|_socket|_latch)/);
    const b1 = box(parts(/^lever_height$/)), b2 = box(parts(/^lever_depth$/)), bd = box(parts(/^pod_door$/));
    this.rig = {
      levH: pivot(lh, new THREE.Vector3(b1.max.x, (b1.min.y + b1.max.y) / 2, (b1.min.z + b1.max.z) / 2)),     // the paddles swing up about the lever's inner end
      levD: pivot(ld, new THREE.Vector3(b2.max.x, (b2.min.y + b2.max.y) / 2, (b2.min.z + b2.max.z) / 2)),
      door: pivot(dr, new THREE.Vector3(bd.max.x, bd.min.y, (bd.min.z + bd.max.z) / 2)),                        // hinged along its bottom edge
      batt: pivot(bt, box(bt).getCenter(new THREE.Vector3())),
    };
  }
  poseRig() {
    const N = this.nodes, C = this.info.const, c = this.cs, mm = (v) => v / 1000, R = this.rig;
    const q = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1), d2r = THREE.MathUtils.degToRad;
    const at = (o, dp, rq) => { if (!o) return; const r = o.userData.r0; o.position.copy(r.p); if (dp) o.position.add(dp); o.quaternion.copy(r.q); if (rq) o.quaternion.multiply(rq); };
    // gas lift: everything on 'up' rises; the column's two telescoping covers follow at 2/3 and 1/3
    const lift = mm((c.seat - C.SEAT_REST) * (C.SEAT_RANGE[1] - C.SEAT_RANGE[0]));
    at(N.up, new THREE.Vector3(0, lift, 0)); at(N.col_mid, new THREE.Vector3(0, lift * 2 / 3, 0)); at(N.col_mid2, new THREE.Vector3(0, lift / 3, 0));
    at(N.seat_slide, new THREE.Vector3(0, 0, mm(c.depth)));
    for (const [nm, sx] of [['R', -1], ['L', 1]]) {
      at(N['arm' + nm + '_top'], new THREE.Vector3(0, mm(c.armH), 0));
      at(N['arm' + nm + '_cap'], new THREE.Vector3(sx * mm(c.armW), 0, mm(c.armD)), q.clone().setFromAxisAngle(Y, sx * d2r(c.armR)));
    }
    at(N.lumbar, this.NB.clone().multiplyScalar(mm(c.lumD)));
    at(N.lumbar_bh, this.UB.clone().multiplyScalar(mm(c.lum - C.LC0)));
    at(N.head_stem, this.UB.clone().multiplyScalar(mm(c.headU)));
    at(N.head_tilt, null, q.clone().setFromAxisAngle(X, d2r(c.headT)));
    at(R.levH, null, q.clone().setFromAxisAngle(Z, -d2r(14) * c.levH));
    at(R.levD, null, q.clone().setFromAxisAngle(Z, -d2r(14) * c.levD));
    at(R.door, null, q.clone().setFromAxisAngle(Z, -d2r(92) * c.door));
    at(R.batt, new THREE.Vector3(.15 * c.batt, 0, 0));
  }
  applyExplode(k) {
    const inv = new THREE.Matrix4(), v = new THREE.Vector3();
    for (const n of this.exNodes) {
      if (k < 1e-6) { n.position.copy(n.userData.p0); continue; }
      let a = n.parent, pOff = null; while (a) { if (a.userData.exOff) { pOff = a.userData.exOff; break; } a = a.parent; }
      v.copy(n.userData.exOff); if (pOff) v.sub(pOff); v.multiplyScalar(k);
      // only the chain above this node needs to be current, not everything under its parent
      n.parent.updateWorldMatrix(true, false); inv.copy(n.parent.matrixWorld).setPosition(0, 0, 0).invert(); v.applyMatrix4(inv);
      n.position.copy(n.userData.p0).add(v);
    }
  }
  // soft contact shadow under the chair (three.js contact-shadow technique), re-rendered when the pose changes
  contactInit(box) {
    const W = 1.5, D = 1.5, RES = 512; this.cShadow = { dirty: true };
    const rt = new THREE.WebGLRenderTarget(RES, RES), rtb = new THREE.WebGLRenderTarget(RES, RES); rt.texture.generateMipmaps = rtb.texture.generateMipmaps = false;
    const group = new THREE.Group(); group.position.y = box.min.y + .001; this.scene.add(group);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, D).rotateX(Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: rt.texture, opacity: .85, transparent: true, depthWrite: false }));
    plane.renderOrder = 1; plane.scale.y = -1; group.add(plane);
    const blurPlane = new THREE.Mesh(plane.geometry); blurPlane.visible = false; group.add(blurPlane);
    const cam = new THREE.OrthographicCamera(-W / 2, W / 2, D / 2, -D / 2, 0, 1.4); cam.rotation.x = Math.PI / 2; group.add(cam);
    const dm = new THREE.MeshDepthMaterial(); dm.userData.dark = { value: 1.6 };
    dm.onBeforeCompile = (sh) => { sh.uniforms.dark = dm.userData.dark; sh.fragmentShader = 'uniform float dark;\n' +
      sh.fragmentShader.replace('gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );', 'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * dark );'); };
    dm.depthTest = dm.depthWrite = false;
    const hb = new THREE.ShaderMaterial(HorizontalBlurShader), vb = new THREE.ShaderMaterial(VerticalBlurShader); hb.depthTest = vb.depthTest = false;
    const blur = (amount) => {
      blurPlane.visible = true; blurPlane.material = hb; hb.uniforms.tDiffuse.value = rt.texture; hb.uniforms.h.value = amount / 256;
      this.renderer.setRenderTarget(rtb); this.renderer.render(blurPlane, cam);
      blurPlane.material = vb; vb.uniforms.tDiffuse.value = rtb.texture; vb.uniforms.v.value = amount / 256;
      this.renderer.setRenderTarget(rt); this.renderer.render(blurPlane, cam); blurPlane.visible = false;
    };
    this.cShadow.render = () => {
      const r = this.renderer, sc = this.scene, bg = sc.background, hidden = [];
      sc.background = null; sc.overrideMaterial = dm; plane.visible = false;
      sc.traverse((o) => { if ((o.isPoints || o === this.pool || (o.isMesh && o.material && o.material.blending === THREE.AdditiveBlending)) && o.visible) { hidden.push(o); o.visible = false; } });
      const ic = r.getClearAlpha(); r.setClearAlpha(0); r.setRenderTarget(rt); r.clear(); r.render(sc, cam);
      sc.overrideMaterial = null; plane.visible = true; hidden.forEach((o) => (o.visible = true));
      blur(1.4); blur(.5); r.setRenderTarget(null); r.setClearAlpha(ic); sc.background = bg;
    };
    this.cShadow.plane = plane;
    // on the dark sections the chair stands in a soft pool of light on the floor, the way it would under a studio softbox
    const pc = document.createElement('canvas'); pc.width = pc.height = 256; const g2 = pc.getContext('2d');
    const gr = g2.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.55)'); gr.addColorStop(.7, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g2.fillStyle = gr; g2.fillRect(0, 0, 256, 256);
    const pool = this.pool = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.6).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(pc), color: 0x44464d, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    pool.position.set(0, box.min.y - .0005, .05); pool.renderOrder = 0; this.scene.add(pool);
  }
  // ---- public API -----------------------------------------------------------------------------------------------------
  setView(v) { const t = v.tgt; Object.assign(this.view, v); if (t) this.view.tgt = new THREE.Vector3(...t); }
  jumpView() { const v = this.view, c = this.cur; for (const k of ['az', 'el', 'dist', 'fov', 'sx', 'sy']) c[k] = v[k]; c.tgt.copy(v.tgt); }
  setLook(l) { Object.assign(this.look, l); }
  setZone(z, mode, level = 2) { const s = this.zones[z]; if (s.mode !== mode || s.level !== level) { if (s.mode !== mode) s.t = 0; s.mode = mode; s.level = level; } }
  setThermal(on) { this.state.thermal = on ? 1 : 0; }
  setFinish(name) { this.finT = name === 'black' ? 1 : 0; }
  finishStep(dt) {
    this._finLive = !!this.finMats && Math.abs(this.finK - this.finT) >= 1e-4;
    if (!this._finLive) return;
    this.finK = Math.abs(this.finK - this.finT) < .002 ? this.finT : damp(this.finK, this.finT, 4.5, dt);
    const k = this.finK, a = new THREE.Color(), b = new THREE.Color();
    for (const m of this.finMats) {
      const W = FINISH.white[m.userData.fin], B = FINISH.black[m.userData.fin];
      m.color.copy(a.set(W[0])).lerp(b.set(B[0]), k); m.roughness = lerp(W[1], B[1], k); m.metalness = lerp(W[2], B[2], k);
    }
  }
  // the zone's temperature model: wire temperature rises toward its target, the warm band widens, then fills the pad
  zoneUpdate(dt) {
    const amb = G.uAmbT.value; let live = false;
    for (const z of 'ABC') {
      const s = this.zones[z], v = this.zv[z]; s.t += dt * this.timeScale;
      const was = v.T + v.sig * 1e3 + v.fill + v.glow + v.air + v.airR;
      const ramp = 1 - Math.exp(-s.t / 2.2), spread = 1 - Math.exp(-s.t / 5);
      let T = amb, sig = .006, fill = 0, glow = 0, air = 0, airR = -.1;
      if (s.mode === 'heat') { T = amb + ([0, 33, 35, 37][s.level] - amb) * ramp; sig = .005 + .022 * spread; fill = .55 * spread; glow = (.35 + .22 * s.level) * Math.min(1, s.t / .6); }
      else if (s.mode === 'after') { const k = Math.exp(-s.t / 4.5); T = amb + ([0, 33, 35, 37][s.level] - amb) * k; sig = .027; fill = .55 * (.35 + .65 * k); }   // wire off after a long run: the pad cools as one
      else if (s.mode === 'air') { T = amb - (1.6 + 1.3 * s.level) * ramp; airR = -.05 + 1.25 * spread; air = .35 + .25 * s.level; }
      v.T = damp(v.T, T, 4, dt); v.sig = damp(v.sig, sig, 4, dt); v.fill = damp(v.fill, fill, 4, dt); v.glow = damp(v.glow, glow, 5, dt);
      v.air = damp(v.air, air, 4, dt); v.airR = s.mode === 'air' ? damp(v.airR, airR, 3, dt) : damp(v.airR, -.1, 6, dt);
      const m = this.padMesh[z]; if (m) { const th = (m.userData.mat0 || m.material).userData.th; th.uZoneT.value = v.T; th.uSig.value = v.sig; th.uFill.value = v.fill; th.uAir.value = s.mode === 'air' || v.airR > 0 ? 1 : 0; th.uAirR.value = v.airR; }
      if (this.wireMats[z]) { this.wireMats[z].uGlow.value = v.glow * (1 - this.thermalK); this.wireMesh[z].visible = v.glow > .01 && this.thermalK < .99; }
      if (this.airMats[z]) { this.airMats[z].uAmt.value = v.air; this.airMats[z].uCold.value = this.thermalK; }
      // the air particles run on time while any air shows
      if (Math.abs(v.T + v.sig * 1e3 + v.fill + v.glow + v.air + v.airR - was) > 1e-4 || v.air > .002) live = true;
    }
    this._zoneLive = live;
  }
  // temperature at a pad point (for the spot meter)
  tempAt(hit) {
    const m = hit.object, z = Object.keys(this.padMesh).find((k) => this.padMesh[k] === m);
    if (!z || !hit.face) return G.uAmbT.value;
    const wd = m.userData.wd, f = hit.face, b = hit.barycoord || new THREE.Vector3(1 / 3, 1 / 3, 1 / 3);
    const d = wd[f.a] * b.x + wd[f.b] * b.y + wd[f.c] * b.z, v = this.zv[z], amb = G.uAmbT.value, s = this.zones[z];
    if (s.mode === 'air' || v.airR > 0) { const cd = m.geometry.attributes.cd; const c = cd.getX(f.a) * b.x + cd.getX(f.b) * b.y + cd.getX(f.c) * b.z;
      return amb + (v.T - amb) * (1 - THREE.MathUtils.smoothstep(c, v.airR, v.airR + .07)); }
    return amb + (v.T - amb) * lerp(Math.exp(-d * d / (2 * v.sig * v.sig)), 1, v.fill);
  }
  pick(ndcX, ndcY, padsOnly = false) {
    this._ray = this._ray || new THREE.Raycaster(); this._ray.setFromCamera({ x: ndcX, y: ndcY }, this.camera);
    const hits = this._ray.intersectObjects(padsOnly ? Object.values(this.padMesh) : this.meshes, false); if (!hits.length) return null;
    const h = hits[0], z = Object.keys(this.padMesh).find((k) => this.padMesh[k] === h.object);
    const mat = (h.object.userData.mat0 || h.object.material).userData.th;
    return { zone: z || null, point: h.point, T: z ? this.tempAt(h) : G.uAmbT.value + (mat ? mat.uBaseT.value : 0), object: h.object.userData.obj, hit: h };
  }
  probe(z, u = .5, v = .5) {
    const m = this.padMesh[z]; if (!m) return null;
    if (!m.userData.probe) m.userData.probe = {};
    const key = u + ',' + v; let i = m.userData.probe[key];
    if (i === undefined) {       // the vertex nearest the given spot of the pad's front face (u across, v front to back / bottom to top)
      const b = new THREE.Box3().setFromBufferAttribute(m.geometry.attributes.position), p = m.geometry.attributes.position, n = m.geometry.attributes.normal;
      const tgt = new THREE.Vector3(lerp(b.min.x, b.max.x, u), lerp(b.min.y, b.max.y, v), b.max.z); let best = 1e9; i = 0;
      const q = new THREE.Vector3();
      for (let k = 0; k < p.count; k++) { q.fromBufferAttribute(p, k); const d = q.distanceToSquared(tgt); if (d < best) { best = d; i = k; } }
      m.userData.probe[key] = i;
    }
    const w = new THREE.Vector3().fromBufferAttribute(m.geometry.attributes.position, i).applyMatrix4(m.matrixWorld);
    const vv = this.zv[z], amb = G.uAmbT.value, s = this.zones[z], d = m.userData.wd[i];
    let T;
    if (s.mode === 'air' || vv.airR > 0) T = amb + (vv.T - amb) * (1 - THREE.MathUtils.smoothstep(m.geometry.attributes.cd.getX(i), vv.airR, vv.airR + .07));
    else T = amb + (vv.T - amb) * lerp(Math.exp(-d * d / (2 * vv.sig * vv.sig)), 1, vv.fill);
    return { point: w, T };
  }
  project(v3) { const v = v3.clone().project(this.camera); return { x: (v.x * .5 + .5) * this.host.clientWidth, y: (-v.y * .5 + .5) * this.host.clientHeight, z: v.z }; }
  worldOf(name, local = [0, 0, 0]) { const n = this.nodes[sanitize(name)]; if (!n) return null; n.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(n); return b.getCenter(new THREE.Vector3()); }
  padCentre(z) { const m = this.padMesh[z]; return m ? new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3()) : null; }
  // keep the named parts solid and ghost everything else (null = all solid)
  setHighlight(prefixes) {
    const key = prefixes ? prefixes.join('|') : ''; if (key === this._hl) return; this._hl = key; this._hlList = prefixes; this.applyMats();
  }
  // x-ray: ghost the parts matching `ghost` so the part matching `show` inside them can be seen (null = off)
  setXray(ghost, show) {
    const key = ghost ? ghost.source + '|' + (show ? show.source : '') : ''; if (key === this._xk) return; this._xk = key; this._xr = ghost ? { ghost, show } : null; this.applyMats();
  }
  // the control being explained, in the motion colour with a slow pulse (null = none)
  setFocus(re) {
    const key = re ? re.source : ''; if (key === this._fk) return; this._fk = key; this._focus = re; this.applyMats();
  }
  applyMats() {
    this.ghost = this.ghost || new THREE.MeshBasicMaterial({ color: 0xc9ced6, transparent: true, opacity: .1, depthWrite: false });
    this.xghost = this.xghost || new THREE.MeshBasicMaterial({ color: 0x9aa2ad, transparent: true, opacity: .16, depthWrite: false });
    this.emph = this.emph || new THREE.MeshStandardMaterial({ color: 0x6e6bf2, emissive: 0x6e6bf2, emissiveIntensity: .4, roughness: .45, metalness: .1 });
    const hl = this._hlList, xr = this._xr, fo = this._focus, V = (b, m) => this.variant(b, m);
    for (const m of this.meshes) {
      const n = (m.userData.obj || '').replace(/\.\d+$/, '');
      if (!m.userData.mat0) m.userData.mat0 = m.material;
      let mat = m.userData.mat0;
      if (hl && !hl.some((p) => n.startsWith(p))) mat = V(this.ghost, m);
      else if (xr && xr.ghost.test(n)) mat = V(this.xghost, m);
      else if ((xr && xr.show && xr.show.test(n)) || (fo && fo.test(n))) mat = V(this.emph, m);
      m.material = mat; m.castShadow = mat === m.userData.mat0 || mat.userData.base === this.emph || mat === this.emph;
    }
    this.cShadow.dirty = true;
  }
  // one copy of a shared material per count of pose shapes, so meshes with and without them don't share a shader slot
  variant(base, m) {
    const mp = m.geometry.morphAttributes.position, k = mp ? mp.length : 0; if (!k) return base;
    this._var = this._var || new Map(); const key = base.uuid + k; let x = this._var.get(key);
    if (!x) { x = base.clone(); x.userData.base = base; this._var.set(key, x); }
    return x;
  }
  // centre of every object whose name starts with prefix (world space, current pose)
  anchor(prefix) {
    const b = new THREE.Box3(), t = new THREE.Box3(); let any = false;
    for (const m of this.meshes.concat(Object.values(this.wireMesh))) {
      const n = (m.userData.obj || '').replace(/\.\d+$/, ''); if (!n.startsWith(prefix)) continue;
      m.updateMatrixWorld(true); t.setFromObject(m); b.union(t); any = true;
    }
    return any ? b.getCenter(new THREE.Vector3()) : null;
  }
  // animated tubes along chains of anchors: [{color, chain: ['battery', 'main_board', ...]}]
  setFlows(list) {
    const key = JSON.stringify(list); if (key === this._flowKey) return; this._flowKey = key;
    this.flowSpec = list;
    if (!this.flowGroup) { this.flowGroup = new THREE.Group(); this.scene.add(this.flowGroup); }
    if (!this.flowMat) this.flowMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color() } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
        void main(){ float d = fract(vUv.x * 14.0 - uTime * 1.2); float a = smoothstep(0.0, 0.15, d) * (1.0 - smoothstep(0.45, 0.6, d));
          gl_FragColor = vec4(uColor, 0.3 + 0.7 * a); }` });
    this.flowDirty = true;
  }
  buildFlows() {
    const g = this.flowGroup; if (!g) return;
    while (g.children.length) { const c = g.children.pop(); c.geometry.dispose(); c.material.dispose(); }
    for (const f of this.flowSpec || []) {
      const pts = f.chain.map((n) => this.anchor(n)).filter(Boolean); if (pts.length < 2) continue;
      const cp = []; for (let i = 0; i < pts.length; i++) { cp.push(pts[i]); if (i < pts.length - 1) { const m = pts[i].clone().lerp(pts[i + 1], .5); m.z += .05; cp.push(m); } }
      const curve = new THREE.CatmullRomCurve3(cp, false, 'centripetal');
      const mat = this.flowMat.clone(); mat.uniforms.uTime = this.flowMat.uniforms.uTime; mat.uniforms.uColor = { value: new THREE.Color(f.color) };
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, .0045, 8), mat); tube.renderOrder = 20; g.add(tube);
    }
  }
  pose() {
    const s = this.state, c = this.cs, P = this.pivots;
    const q = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);
    P.back.quaternion.copy(P.back.userData.q0).multiply(q.setFromAxisAngle(X, -THREE.MathUtils.degToRad(c.recl)));
    P.seat.quaternion.copy(P.seat.userData.q0).multiply(q.setFromAxisAngle(X, -THREE.MathUtils.degToRad(c.recl) / (this.info.const.RATIO || 3)));
    const B = this.info.const.BOW_C, hb = Math.min(Math.max(c.lum, B[0]), B[B.length - 1]), st = B[1] - B[0];
    const kk = Math.min(B.length - 2, Math.floor((hb - B[0]) / st)), wb = (hb - B[kk]) / st;
    for (const m of [this.padMesh.B, this.wireMesh.B]) {
      if (!m || !m.morphTargetDictionary) continue;
      for (let i = 0; i < B.length; i++) { const j = m.morphTargetDictionary['bow' + i]; if (j !== undefined) m.morphTargetInfluences[j] = i === kk ? 1 - wb : i === kk + 1 ? wb : 0; }
    }
    this.poseRig();
    // piecewise-linear between the pose shapes: key i sits at x = i (x = angle / 10, slide / 40)
    const hat = (inf, idx, x) => idx.forEach((j, i) => { if (j !== undefined) inf[j] = Math.max(0, 1 - Math.abs(x - (i + 1))); });
    for (const m of this.poseMorph) {
      const d = m.morphTargetDictionary, inf = m.morphTargetInfluences;
      if (d.r10 !== undefined) hat(inf, [d.r10, d.r20, d.r30], Math.min(30, Math.max(0, c.recl)) / 10);
      if (d.d40 !== undefined) hat(inf, [d.d40, d.d80], Math.min(80, Math.max(0, c.depth)) / 40);
    }
    this.applyExplode(c.explode);
  }
  loop() {
    const tick = () => { requestAnimationFrame(tick); const raw = this.clock.getDelta(), dt = Math.min(raw, .05); if (this.visible) { if (!this._wasVis) this.busy = 2; this.step(dt, true); this.budget(raw); } this._wasVis = this.visible; };
    tick();
  }
  // a GPU that can't keep up gets fewer pixels: after a run of slow frames the canvas drops a quarter step of resolution
  // (never below 1x), so the page stays smooth on a laptop at the cost of a little sharpness
  budget(raw) {
    const b = this._bud = this._bud || { n: 0, slow: 0, wait: 3 };
    if (raw > .2) return;                                    // back from a hidden tab
    if (b.wait > 0) { b.wait -= raw; return; }             // let the first shaders compile
    if (!this.drew) return;                                 // idle frames say nothing about the GPU
    b.n++; if (raw > .024) b.slow++;
    if (b.n < 90) return;
    const pr = this.renderer.getPixelRatio();
    if (b.slow > 54 && pr > 1) { this.renderer.setPixelRatio(Math.max(1, pr - .25)); this.resize(); b.wait = 1.5; }
    b.n = b.slow = 0;
  }
  // anything on the chair still changing this frame: the pose, the thermal sweep, a zone warming or its air moving, the
  // finish blending, the lights fading, a flow or the focus pulse (both run on time), the room temperature settling
  animating() {
    const L = this.look, cl = this.curLook, s = this.state;
    if (this._moved || this._zoneLive || this._finLive || this.flowDirty) return true;
    if (Math.abs((this.thermalK || 0) - s.thermal) > .002) return true;
    for (const k in L) if (Math.abs((cl[k] || 0) - (L[k] || 0)) > 1e-3) return true;
    if (this.flowSpec && this.flowSpec.length) return true;
    if (this._focus || (this._xr && this._xr.show)) return true;
    const amb = G.uAmbT.value; if (Math.abs(amb - (this._amb ?? amb + 1)) > 1e-4) { this._amb = amb; return true; }
    return false;
  }
  // compile the ghost, x-ray and focus materials ahead, off screen, so the first section that uses them doesn't stall
  warm() {
    if (!this.renderer.compileAsync) return Promise.resolve();
    this.applyMats();                    // makes the three materials; with nothing ghosted it leaves every part as it is
    const sc = new THREE.Scene(), seen = new Set();
    for (const m of this.meshes) {
      const g = m.geometry, mp = g.morphAttributes.position, key = (mp ? mp.length : 0) + '|' + m.receiveShadow;
      if (seen.has(key)) continue; seen.add(key);
      for (const mat of [this.ghost, this.xghost, this.emph]) { const p = new THREE.Mesh(g, this.variant(mat, m)); p.receiveShadow = m.receiveShadow; p.frustumCulled = false; sc.add(p); }
    }
    return this.renderer.compileAsync(sc, this.camera, this.scene).catch(() => {});
  }
  // fast-forward n steps without drawing (tests, and catching up after the tab was hidden)
  settle(n = 120, dt = .05) { for (let i = 0; i < n; i++) this.step(dt, i === n - 1); }
  step(dt, draw) {
    {
      G.uTime.value += dt;
      const s = this.state, c = this.cs; let moved = false;
      for (const k in c) { const nv = damp(c[k], s[k], k === 'explode' ? 7 : k.startsWith('lev') ? 10 : 5, dt); if (Math.abs(nv - c[k]) > 1e-4) moved = true; c[k] = Math.abs(nv - s[k]) < 1e-4 ? s[k] : nv; }
      if (moved || !this._posed) { this.pose(); this._posed = true; this.cShadow.dirty = true; this.flowDirty = true; }
      this._moved = moved;
      if (this.flowDirty) { this.buildFlows(); this.flowDirty = false; }
      // thermal sweep: the scan line climbs to switch on and falls to switch off
      this.thermalK = this.thermalK || 0; this.thermalK = damp(this.thermalK, s.thermal, 2.2, dt);
      G.uScan.value = this.thermalK < .002 ? -1 : lerp(-.1, 1.62, this.thermalK);
      this.zoneUpdate(dt);
      this.finishStep(dt);
      // camera
      const v = this.view, cu = this.cur, k = this.camK || 3.4;
      for (const key of ['az', 'el', 'dist', 'fov', 'sx', 'sy']) cu[key] = damp(cu[key], v[key], k, dt);
      cu.tgt.lerp(v.tgt, 1 - Math.exp(-k * dt));
      this.par.lerp(this.parallax, 1 - Math.exp(-3 * dt));
      const az = THREE.MathUtils.degToRad(cu.az + this.par.x * 4), el = THREE.MathUtils.degToRad(cu.el - this.par.y * 2.5);
      this.camera.position.set(cu.tgt.x + cu.dist * Math.cos(el) * Math.sin(az), cu.tgt.y + cu.dist * Math.sin(el), cu.tgt.z + cu.dist * Math.cos(el) * Math.cos(az));
      this.camera.lookAt(cu.tgt);
      const w = this.host.clientWidth, h = this.host.clientHeight;
      if (Math.abs(cu.sx) > 1e-4 || Math.abs(cu.sy) > 1e-4) this.camera.setViewOffset(w, h, -cu.sx * w, -cu.sy * h, w, h); else this.camera.clearViewOffset();
      this.camera.fov = cu.fov; this.camera.updateProjectionMatrix();
      const L = this.look, cl = this.curLook;
      for (const key of Object.keys(L)) cl[key] = damp(cl[key], L[key], 3, dt);
      this.scene.environmentIntensity = cl.env; this.key.intensity = cl.key; this.rim.intensity = cl.rim; this.cShadow.plane.material.opacity = cl.shadow;
      this.pool.material.opacity = cl.floor || 0; this.pool.visible = cl.floor > .005;
      if (this.flowMat) this.flowMat.uniforms.uTime.value = G.uTime.value;
      if (this.emph) { const ei = .25 + .3 * (.5 + .5 * Math.sin(G.uTime.value * 4)); this.emph.emissiveIntensity = ei; if (this._var) for (const x of this._var.values()) if (x.userData.base === this.emph) x.emissiveIntensity = ei; }
      if (this.onFrame) this.onFrame(dt);
      if (!draw) return;
      if (this.cShadow.dirty) { this.cShadow.render(); this.cShadow.dirty = false; this.renderer.shadowMap.needsUpdate = true; this.busy = 2; }
      // a still picture is not drawn again: skip the frame when the camera, the pose and every animated material are at rest
      const e = this.camera.matrixWorld.elements, pm = this.camera.projectionMatrix.elements;
      let sig = 0; for (let i = 0; i < 16; i++) sig += e[i] * (i + 1) + pm[i] * (i + 17);
      const live = Math.abs(sig - (this._sig || 0)) > 1e-5 || this.animating();      // far below a pixel
      this._sig = sig;
      if (live) this.busy = 2; else if (this.busy > 0) this.busy--;
      this.drew = this.busy > 0;
      if (!this.drew) return;
      this.renderer.render(this.scene, this.camera);
    }
  }
}
export { THREE };
