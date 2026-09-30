import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {Font} from 'three/addons/loaders/FontLoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import helvetiker from 'three/examples/fonts/helvetiker_bold.typeface.json';
import OUTLINE from './jl-outline.json';
import {N, Tube, jlPose, poseFromStrokes, curve, flow, copyPose, makePose, LOGO_C} from './line.js';
import {PROJECTS, ART, ABOUT, TIMELINE, COPY, pick} from './content.js';

/* The homepage after the office: "One Stroke". The office's dark monitor switches on as a single line of light, and the line
   is the horizon of a lake at dusk. A monolith of the mark rises from the water; the headline hangs in the sky and the lake
   answers it with "& wonder.". On scroll the stone sinks, we look down into the lake, and a pen of light writes SYSTEMS on the
   lakebed; the letters rise. The thread runs past the projects, lies down as ink on a drafting sheet (about, the mark's
   construction), becomes the timeline, closes into a ring you pass through, and stays on as the horizon of the art worlds.
   The last world burns out to white; the white is morning mist over the same lake, where the stone rises again for the letter.

   The page is a 900-unit-tall design space scaled to the window. Its scroll position S is counted in screens from the moment
   the office has gone dark (the section overlaps the office's last screen), so S = 0 is the switch-on. */

export const TOTAL = 23.2;                                   // screens of journey after the switch-on
export const CHAPTERS = [0, 2.05, 8.3, 10.9, 16.9, 22.6];    // where the index takes you, in screens
/* The opening gets more scroll than the rest: the first KV_RAW screens of scrolling play its first journey screen, so the
   stone has room to rise and stand before it sinks. Journey S (what everything below is keyed to) ↔ scroll screens. */
const KV_HOLD = 0.5, KV_RAW = 1 + KV_HOLD;
export const SCROLL_TOTAL = TOTAL + KV_HOLD;
export const toJourney = r => (r < KV_RAW ? r / KV_RAW : r - KV_HOLD);
export const toScroll = s => (s < 1 ? s * KV_RAW : s + KV_HOLD);
export const SCREEN_SIDES = [1, -1, 1, -1];                  // which side of its screen each project's words stand on
export const MIN_ASPECT = 1.11;                              // narrower windows get the static page
export function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; }
}

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mix = (a, b, t) => a + (b - a) * t;
const seg = (x, a, b) => clamp((x - a) / (b - a));
const eio = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eo3 = t => 1 - Math.pow(1 - t, 3);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const INK = '#141418', MUTED = '#6d6d76';   // one ink: emphasis comes from weight, size and inversion, never from hue
const FLOOR = -260, FOV = 24, DH = 900;
const LIN = 'vec3 toLin(vec3 c){ return pow(max(c, vec3(0.)), vec3(2.2)); }';   // these shaders pick colours by eye, in display space
const grey = (c, keep = 0.06) => { const l = c.r * 0.3 + c.g * 0.59 + c.b * 0.11; return new THREE.Color(l, l, l).lerp(c, keep); };   // the light a picture throws, drained of hue

export function createOneStroke({root, section, lang: startLang = 'zh', actions = {}}) {
  const Q = new URLSearchParams(location.search);
  const OFFLINE = Q.has('offline');                          // frame-by-frame capture: the recorder drives the clock
  const FIXED = Q.has('h');                                  // the recorder pins the page to 1440 × h CSS px
  const DPR = Math.min(devicePixelRatio || 1, 2);
  let lang = startLang;
  let UI = FIXED ? 1 : innerHeight / DH;                     // CSS px per design unit
  let W = FIXED ? 1440 : innerWidth / UI;
  const H = FIXED ? +Q.get('h') : DH;
  const pixelRatio = () => (FIXED ? +(Q.get('pr') || 1) : Math.min(UI * DPR, Math.sqrt(5.2e6 / (W * H))));
  let PR = pixelRatio();
  const TEXQ = FIXED ? 2 : Math.min(3, Math.max(2, Math.ceil(UI * DPR)));   // canvas textures drawn at this many px per unit
  const TOPD = (H / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2));       // camera height at which the floor maps 1:1 to design px
  let alive = true, raf = 0;
  const listeners = [];
  const on = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); listeners.push([target, type, fn, opts]); };

  /* ---------------- renderer: linear HDR, bloom for light, tone mapped at the end ---------------- */
  const canvas = document.createElement('canvas'); canvas.className = 'os-gl'; canvas.setAttribute('aria-hidden', 'true'); root.prepend(canvas);
  const gl = new THREE.WebGLRenderer({canvas, antialias: false, stencil: true, preserveDrawingBuffer: FIXED || OFFLINE, powerPreference: 'high-performance'});
  gl.setPixelRatio(PR); gl.setSize(W, H, false);
  gl.toneMapping = THREE.NeutralToneMapping; gl.toneMappingExposure = 1.0; gl.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(FOV, W / H, 5, 120000);
  const rt = new THREE.WebGLRenderTarget(W, H, {type: THREE.HalfFloatType, samples: 4, stencilBuffer: true});
  const composer = new EffectComposer(gl, rt); composer.setPixelRatio(PR); composer.setSize(W, H);
  // resolve only colour out of the multisampled buffers: nothing after the scene pass reads depth or stencil, and on Windows
  // (ANGLE / D3D11) resolving a depth-stencil buffer is a slow path that tripled the cost of every frame
  [composer.renderTarget1, composer.renderTarget2].forEach(t => { t.resolveDepthBuffer = false; t.resolveStencilBuffer = false; });
  composer.addPass(new RenderPass(scene, cam));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.3, 0.32, 1.35); composer.addPass(bloom);
  composer.addPass(new OutputPass());
  // photographic white-out, in display space: raising uWhite burns the highlights out first and the shadows last;
  // lowering it again brings the shadows back first, the way a print develops
  const expose = new ShaderPass({uniforms: {tDiffuse: {value: null}, uWhite: {value: 0}},
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uWhite; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(.299, .587, .114));
        float w = smoothstep(0., 1., uWhite * 2.2 - (1. - l) * 1.2);
        gl_FragColor = vec4(mix(c.rgb, vec3(1.), w), 1.); }`});
  expose.enabled = false; composer.addPass(expose);
  const pmrem = new THREE.PMREMGenerator(gl);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(-900, 1400, 1600); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.7); rim.position.set(900, 500, -1800); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x101010, 0.45));

  /* ---------------- text & canvas helpers ---------------- */
  const FONT = {sans: w => `${w} SZpx 'TikTok Sans','Microsoft YaHei',sans-serif`, serif: () => 'italic 400 SZpx Editorial, serif', mono: () => '500 SZpx Mono, monospace', song: w => `${w} SZpx 'SimSun','Songti SC',serif`};
  function txt(g, text, x, y, {size = 16, face = 'sans', weight = 560, color = INK, align = 'left', ls = 0, alpha = 1} = {}) {
    g.save(); g.font = FONT[face](weight).replace('SZ', size); g.letterSpacing = `${ls}em`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'alphabetic'; g.globalAlpha *= alpha; g.fillText(text, x, y); const w = g.measureText(text).width; g.restore(); return w;
  }
  function measure(g, text, size, face = 'sans', weight = 560, ls = 0) { g.save(); g.font = FONT[face](weight).replace('SZ', size); g.letterSpacing = `${ls}em`; const w = g.measureText(text).width; g.restore(); return w; }
  const fit = (g, text, size, maxW, face = 'sans', weight = 560, ls = 0) => Math.min(size, size * maxW / Math.max(1, measure(g, text, size, face, weight, ls)));
  function vert(g, text, x, y, {size = 40, face = 'song', weight = 600, color = INK, gap = 1.1, alpha = 1} = {}) { [...text].forEach((ch, i) => txt(g, ch, x, y + i * size * gap, {size, face, weight, color, align: 'center', alpha})); }
  function coverImg(g, im, x, y, w, h) { const ia = im.width / im.height, ba = w / h; let sw = im.width, sh = im.height; if (ba > ia) sh = im.width / ba; else sw = im.height * ba; g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h); g.restore(); }
  function labelBox(g, text, x, y, size, {bg = INK, color = '#fff', weight = 620} = {}) {
    g.save(); g.font = FONT.sans(weight).replace('SZ', size); const w = g.measureText(text).width, top = y - size * 0.98, bh = size * 1.3;
    g.fillStyle = bg; g.fillRect(x - 9, top, w + 18, bh); g.fillStyle = color; g.fillText(text, x, y); g.restore(); return w + 18;
  }
  const textures = [];
  function canvasTex(w, h, scale = TEXQ) { const c = document.createElement('canvas'); c.width = Math.round(w * scale); c.height = Math.round(h * scale); const g = c.getContext('2d'); g.scale(scale, scale); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; textures.push(t); return {c, g, t, w, h, clear() { g.clearRect(0, 0, w, h); }}; }
  function dashed(g, x0, y0, x1, y1, dash = [4, 6]) { g.save(); g.setLineDash(dash); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.restore(); }

  /* ---------------- pictures, the typeface for SYSTEMS, the mark's outline ---------------- */
  const IMG = {}, AVG = {}, TEX = {};
  const paths = [...new Set([...PROJECTS.map(p => p.tex), ...ART.flatMap(a => [a.tex, a.tex2]), ...TIMELINE.filter(n => n.img).map(n => `/assets/home/${n.img}.jpg`)].filter(Boolean))];
  const imgReady = Promise.all(paths.map(src => new Promise(res => { const im = new Image(); im.decoding = 'async';
    im.onload = () => { IMG[src] = im; const c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d'); g.drawImage(im, 0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; AVG[src] = new THREE.Color(`rgb(${d[0]},${d[1]},${d[2]})`);
      const t = new THREE.Texture(im); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; TEX[src] = t; res(); };
    im.onerror = () => res(); im.src = src; })));
  const FONT3D = new Font(helvetiker);
  const ready = Promise.all([imgReady, document.fonts.load("600 40px 'TikTok Sans'"), document.fonts.load('italic 40px Editorial'), document.fonts.load('500 12px Mono')]);
  const imgOf = src => IMG[src] || null;

  /* ---------------- sky and floor ---------------- */
  // dark space, drafting paper, or the lake: dusk for the opening, dawn mist for the letter
  const skyVert = `varying vec3 vDir; void main(){ vDir = normalize((modelMatrix * vec4(position, 1.)).xyz - cameraPosition); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`;
  const skyFrag = `uniform float uPaper, uLake, uDawn, uLine; varying vec3 vDir; ${LIN}
    float h1(float n){ return fract(sin(n * 91.7) * 43758.5453); }
    float n1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h1(i), h1(i + 1.), f); }
    vec3 lake(vec3 d){
      float t = d.y, az = atan(d.x, -d.z);
      vec3 zen = mix(vec3(.07, .07, .075), vec3(.8), uDawn), hor = mix(vec3(.6, .6, .595), vec3(.965, .965, .96), uDawn);
      vec3 c = mix(hor, zen, pow(smoothstep(0., .26, t), .55));
      // far shores: low hills to either side, open water straight ahead, their feet lost in mist
      float ridge = n1(az * 11.) * .58 + n1(az * 29. + 4.) * .28 + n1(az * 73. + 9.) * .14;
      float hh = (.003 + .02 * ridge) * smoothstep(.06, .3, abs(az + .015));
      float hill = step(0., t) * (1. - smoothstep(hh - .0008, hh + .0008, t));
      c = mix(c, mix(mix(vec3(.2, .2, .21), vec3(.82), uDawn), hor, .25 + .6 * (1. - t / max(hh, 1e-4))), hill);
      // the horizon: a fine line of light and its glow; the first stroke
      c += vec3(1.) * exp(-pow(t / (.0015 * uLine), 2.)) * mix(.55, .12, uDawn) + vec3(.85) * exp(-pow(t / .035, 2.)) * mix(.14, .05, uDawn);
      vec3 w = mix(mix(vec3(.03), vec3(.55), uDawn), hor * .8, exp(t * 30.));   // below it, seen only by the stone: water
      return t < 0. ? w : c; }
    void main(){ vec3 d = normalize(vDir); float t = d.y;
      vec3 dark = mix(vec3(.05), vec3(.012), smoothstep(-.02, .32, t)) + vec3(.13) * exp(-pow(t / .05, 2.)) * .3;
      vec3 paper = mix(vec3(.915,.91,.895), vec3(.955,.952,.94), smoothstep(0., .4, t));
      gl_FragColor = vec4(toLin(mix(mix(dark, paper, uPaper), lake(d), uLake)), 1.); }`;
  const skyU = () => ({uPaper: {value: 0}, uLake: {value: 0}, uDawn: {value: 0}, uLine: {value: 1}});
  function makeSky() { const m = new THREE.Mesh(new THREE.SphereGeometry(60000, 48, 24), new THREE.ShaderMaterial({uniforms: skyU(), vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false})); m.renderOrder = -1000; m.frustumCulled = false; scene.add(m); return m; }
  const skyA = makeSky(), skyB = makeSky(); skyB.visible = false;
  function lakeEnv(dawn) {   // what the stone sees: the lake's own sky, prefiltered
    const sc = new THREE.Scene(), u = skyU(); u.uLake.value = 1; u.uDawn.value = dawn; u.uLine.value = 7;
    const m = new THREE.Mesh(new THREE.SphereGeometry(40, 96, 48), new THREE.ShaderMaterial({uniforms: u, vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide})); sc.add(m);
    const t = pmrem.fromScene(sc, 0, 0.1, 100).texture; m.geometry.dispose(); m.material.dispose(); return t;
  }
  const envDusk = lakeEnv(0), envDawn = lakeEnv(1);

  const POOLS = 13;
  const floorFrag = `uniform float uPaper; uniform vec3 uCam, uWipe; uniform vec4 uPool[${POOLS}]; uniform vec3 uPoolC[${POOLS}]; varying vec3 vW; ${LIN}
    float lineAA(float c, float w){ float fw = fwidth(c); return 1. - smoothstep(w * .5 - fw, w * .5 + fw, abs(c)); }
    void main(){
      vec2 p = vW.xz; float d = length(vW - uCam);
      vec2 m100 = mod(p + 50., 100.) - 50., m500 = mod(p + 250., 500.) - 250.;
      float minor = max(lineAA(m100.x, 1.), lineAA(m100.y, 1.));
      float major = max(lineAA(m500.x, 1.5), lineAA(m500.y, 1.5));
      float crs = clamp(lineAA(m500.x, 2.2) * step(abs(m500.y), 16.) + lineAA(m500.y, 2.2) * step(abs(m500.x), 16.), 0., 1.);
      vec3 glow = vec3(0.);
      for (int i = 0; i < ${POOLS}; i++) { vec2 q = (p - uPool[i].xy) / uPool[i].z; glow += uPoolC[i] * uPool[i].w * exp(-dot(q, q)); }
      vec3 cd = vec3(.016) + vec3(.4) * (minor * .09 + major * .18) + vec3(.88) * crs * .45;
      cd += glow * (.5 + minor * .8 + major * 1.3);
      cd = mix(cd, vec3(.05), 1. - exp(-d / 5200.));
      float plus = clamp(lineAA(m100.x, 1.1) * step(abs(m100.y), 6.) + lineAA(m100.y, 1.1) * step(abs(m100.x), 6.), 0., 1.);
      float hair = max(lineAA(m500.x, .9), lineAA(m500.y, .9));
      vec3 cp = mix(vec3(.945,.941,.925), vec3(.09,.09,.11), plus * .26 + hair * .075);
      cp = mix(cp, vec3(.915,.91,.895), 1. - exp(-d / 7000.));
      float wd = length(p - uWipe.xy), wm = 1. - smoothstep(uWipe.z - 14., uWipe.z + 14., wd);
      float pa = max(uPaper, wm);
      vec3 c = toLin(mix(cd, cp, pa)) + vec3(.8) * exp(-pow((wd - uWipe.z) / 9., 2.)) * (1. - uPaper) * step(1., uWipe.z) * 2.2;
      gl_FragColor = vec4(c, 1.); }`;
  function makeFloor() {
    const u = {uPaper: {value: 0}, uCam: {value: new THREE.Vector3()}, uWipe: {value: new THREE.Vector3()}, uPool: {value: Array.from({length: POOLS}, () => new THREE.Vector4(0, 0, 1, 0))}, uPoolC: {value: Array.from({length: POOLS}, () => new THREE.Color())}};
    const m = new THREE.Mesh(new THREE.PlaneGeometry(90000, 90000), new THREE.ShaderMaterial({uniforms: u, vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`, fragmentShader: floorFrag}));
    m.rotation.x = -Math.PI / 2; m.position.y = FLOOR; m.renderOrder = -900; m.frustumCulled = false; scene.add(m); return m;
  }
  const floorA = makeFloor(), floorB = makeFloor(); floorB.visible = false;
  function setStencil(obj, mode) {   // 'none' | 'inside' | 'outside' the portal disc
    obj.traverse(o => { if (!o.material) return; [].concat(o.material).forEach(m => {
      if (mode === 'none') { m.stencilWrite = false; return; }
      m.stencilWrite = true; m.stencilRef = 1; m.stencilFunc = mode === 'inside' ? THREE.EqualStencilFunc : THREE.NotEqualStencilFunc;
      m.stencilFail = m.stencilZFail = m.stencilZPass = THREE.KeepStencilOp; }); });
  }

  /* ---------------- the stroke: a pen of light, or a hairline of ink ---------------- */
  const tubeL = new Tube(12), tubeI = new Tube(8);
  const LIGHT = new THREE.Color(1, 1, 1);
  const lightMat = new THREE.MeshBasicMaterial({color: LIGHT.clone().multiplyScalar(1.55)});
  const lightMesh = new THREE.Mesh(tubeL.geo, lightMat); lightMesh.frustumCulled = false; lightMesh.matrixAutoUpdate = false; scene.add(lightMesh);
  const inkMat = new THREE.MeshBasicMaterial({color: 0x55545d});
  const inkMesh = new THREE.Mesh(tubeI.geo, inkMat); inkMesh.frustumCulled = false; inkMesh.matrixAutoUpdate = false; scene.add(inkMesh);
  const live = makePose();

  /* ---------------- the mark: a monolith of polished black stone, cut from the logo's own outline ---------------- */
  // no light inside it: the stroke it carries is the horizon, reflected in its faces as it turns
  const stoneKV = new THREE.MeshPhysicalMaterial({color: 0x0e0e10, roughness: 0.24, metalness: 0, ior: 2.0, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.04, envMap: envDusk, envMapIntensity: 2.4});
  const stoneEnd = stoneKV.clone(); Object.assign(stoneEnd, {envMap: envDawn, ior: 1.5, clearcoat: 0.5, roughness: 0.3});   // honed, not mirror: black against the mist
  // extrusions can hold zero-area triangles whose normals come out NaN; one NaN pixel is enough for the bloom to black out
  // a whole block of the frame, so every such normal is replaced by the face direction it should have had
  function cleanNormals(g) {
    const n = g.attributes.normal;
    for (let i = 0; i < n.count; i++) { const x = n.getX(i), y = n.getY(i), z = n.getZ(i), l = Math.hypot(x, y, z); if (!Number.isFinite(l) || l < 1e-6) n.setXYZ(i, 0, 0, 1); }
    n.needsUpdate = true; return g;
  }
  let markGeo = new THREE.ExtrudeGeometry(OUTLINE.map(poly => new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x - LOGO_C[0], -(y - LOGO_C[1]))))),
    {depth: 58, bevelEnabled: true, bevelThickness: 2.6, bevelSize: 2.6, bevelOffset: -2.6, bevelSegments: 1, curveSegments: 2});   // a slab with a fine chamfer, not a tube
  markGeo.deleteAttribute('uv'); markGeo = toCreasedNormals(markGeo, THREE.MathUtils.degToRad(32)); cleanNormals(markGeo); markGeo.translate(0, 0, -29);
  const jlKV = new THREE.Mesh(markGeo, stoneKV); scene.add(jlKV);
  const jlEnd = new THREE.Mesh(markGeo, stoneEnd); scene.add(jlEnd);

  /* ---------------- 00 · the centre of a lake at dusk ---------------- */
  const WL = -110;                                                     // water level
  const JL_S = 1.0, JLC = V(0, WL + 34 + 170.3 * JL_S, -1500);         // the monolith, risen clear: it hovers a hand above the water
  const NR = 10, rips = Array.from({length: NR}, () => new THREE.Vector4(0, 0, -99, 0)); let ripK = 0;
  const ripple = (x, z, amp) => { rips[ripK++ % NR].set(x, z, time, amp); };
  const lakeShader = {
    name: 'Lake',
    uniforms: {color: {value: null}, tDiffuse: {value: null}, textureMatrix: {value: null}, uTime: {value: 0}, uRip: {value: []}, uSink: {value: new THREE.Vector4()},
      uDeep: {value: new THREE.Color()}, uHor: {value: new THREE.Color()}, uMurk: {value: 0.9}, uOp: {value: 1}, uFogD: {value: 9000}},
    vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
      void main(){ vUv = textureMatrix * vec4(position, 1.); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 color, uDeep, uHor; uniform float uTime, uMurk, uOp, uFogD; uniform vec4 uRip[${NR}]; uniform vec4 uSink; varying vec4 vUv; varying vec3 vW;
      float ring(vec2 p, vec2 c, float R, float a){ float d = length(p - c) - R; return a * sin(d * .075) * exp(-d * d / 7000.); }
      float height(vec2 p){   // a slow swell, and rings that travel out and fade
        float h = sin(p.x * .0105 + uTime * .5) * .9 + sin(p.y * .0162 - uTime * .65 + p.x * .004) * .6 + sin((p.x * .6 + p.y) * .047 + uTime * 1.2) * .22 + sin((p.x - p.y * .7) * .11 - uTime * 1.9) * .07;
        for (int i = 0; i < ${NR}; i++) { vec4 r = uRip[i]; float age = uTime - r.z; if (r.w > 0. && age > 0. && age < 6.) h += ring(p, r.xy, age * 240., r.w * 4. * exp(-age * .75)); }
        if (uSink.w > 0.) h += ring(p, uSink.xy, uSink.z, uSink.w * 4.);
        return h; }
      void main(){
        vec2 p = vW.xz; float e = 2.;
        vec3 n = normalize(vec3(height(p - vec2(e, 0.)) - height(p + vec2(e, 0.)), 2. * e, height(p - vec2(0., e)) - height(p + vec2(0., e))));
        vec3 v = normalize(cameraPosition - vW);
        float F = .02 + .98 * pow(1. - max(dot(n, v), 0.), 5.), Fr = mix(.3, 1., F);
        vec4 uv = vUv; uv.xy += vec2(n.x * .35, n.z) * .12 * uv.w;          // reflections stretch up and down, like light on water
        vec3 col = mix(uDeep, texture2DProj(tDiffuse, uv).rgb, Fr);
        col = mix(col, uHor, (1. - exp(-length(vW.xz - cameraPosition.xz) / uFogD)) * .5);
        gl_FragColor = vec4(col, (Fr + (1. - Fr) * uMurk) * uOp);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  };
  function makeLake(y, x, z, deep, hor) {
    const m = new Reflector(new THREE.PlaneGeometry(200000, 200000), {shader: lakeShader, textureWidth: 1024, textureHeight: 640, clipBias: 0.003, multisample: 4});
    m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = -850;
    Object.assign(m.material, {transparent: true, depthWrite: false});
    const u = m.material.uniforms; u.uRip.value = rips; u.uDeep.value.set(deep); u.uHor.value.set(hor);
    m.camera.layers.enable(2);                                         // the reflection sees what only the water shows
    const t = m.getRenderTarget(); t.resolveDepthBuffer = false; t.resolveStencilBuffer = false;
    scene.add(m); return m;
  }
  const lake = makeLake(WL, 0, 0, '#0a0a0b', '#8e8e8c');
  const waterKV = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WL);
  // the headline: a sheet of type far off in the sky (layer 1: the camera sees it, the water does not), and its answer,
  // drawn upside down below the mirror line (layer 2: only the water sees it, and turns it the right way up)
  const HEAD = {d: 5500, cy: 30}; HEAD.h = 2 * HEAD.d * Math.tan(THREE.MathUtils.degToRad(FOV / 2)); HEAD.w = HEAD.h * 16 / 9;
  const headA = canvasTex(1600, 900), headB = canvasTex(1600, 900);
  function headPlane(tex, y, layer) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(HEAD.w, HEAD.h), new THREE.ShaderMaterial({uniforms: {map: {value: tex.t}, uIn: {value: 0}, uA: {value: 1}}, transparent: true, depthWrite: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: `uniform sampler2D map; uniform float uIn, uA; varying vec2 vUv;
        void main(){ vec4 t = texture2D(map, vUv); gl_FragColor = vec4(t.rgb, t.a * clamp((uIn * 1.3 - vUv.x) / .15, 0., 1.) * uA);
          #include <colorspace_fragment>
        }`}));
    m.position.set(0, y, 1500 - HEAD.d); m.layers.set(layer); m.renderOrder = -800; scene.add(m); return m;
  }
  headA.mesh = headPlane(headA, HEAD.cy, 1); headB.mesh = headPlane(headB, 2 * WL - HEAD.cy, 2);
  cam.layers.enable(1);
  function drawHead() {   // canvas px are screen px of the opening frame (80 px spare at each side)
    let g = headA.g; headA.clear();
    txt(g, COPY.headline, 112, 236, {size: 150, weight: 650, ls: -0.058, color: '#fff'});
    txt(g, pick(COPY.headSub, lang), 118, 290, {size: 20, weight: 520, color: '#ffffffcc'});
    txt(g, '(JL) — PORTFOLIO 2026', 118, 96, {face: 'mono', size: 13, ls: 0.16, color: '#ffffffaa'});
    txt(g, 'INDEX 00 — ENTRANCE', 1500, 96, {face: 'mono', size: 13, ls: 0.16, color: '#ffffffaa', align: 'right'});
    headA.t.needsUpdate = true;
    g = headB.g; headB.clear(); g.save(); g.translate(0, 900); g.scale(1, -1);
    txt(g, COPY.answer, 1500, 718, {face: 'serif', size: 168, color: '#fff', align: 'right'});
    g.restore(); headB.t.needsUpdate = true;
  }
  const wHit = new THREE.Vector3(), lastRip = {x: 1e9, z: 1e9};
  function touchWater(plane, amp, force = false) {   // the pointer on the water: a ring wherever it has moved far enough
    ndc.set(pointer.x / W * 2 - 1, -(pointer.y / H * 2 - 1)); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(plane, wHit)) return;
    if (force || Math.hypot(wHit.x - lastRip.x, wHit.z - lastRip.z) > 150) { ripple(wHit.x, wHit.z, amp); lastRip.x = wHit.x; lastRip.z = wHit.z; }
  }

  /* ---------------- 01 · SYSTEMS: written on the lakebed by the pen, then risen ---------------- */
  const LET = {size: 300, depth: 150, z: -360};
  const letterMat = new THREE.MeshPhysicalMaterial({color: 0xbcbcbf, metalness: 0, roughness: 0.5, clearcoat: 0.8, clearcoatRoughness: 0.12, envMap: env, envMapIntensity: 0.42});
  const letters = [];
  let TRACE;
  function buildLetters() {
    const gap = 58, per = [...'SYSTEMS'].map(ch => { const sh = FONT3D.generateShapes(ch, LET.size); const g = new THREE.ShapeGeometry(sh); g.computeBoundingBox(); const bb = g.boundingBox; g.dispose(); return {sh, bb}; });
    const widths = per.map(p => p.bb.max.x - p.bb.min.x), total = widths.reduce((a, b) => a + b, 0) + gap * (per.length - 1);
    let x = -total / 2; const loops = [], lastLoop = [];
    per.forEach((p, k) => {
      const ox = x - p.bb.min.x;
      const geo = cleanNormals(new THREE.ExtrudeGeometry(p.sh, {depth: LET.depth, bevelEnabled: true, bevelThickness: 5, bevelSize: 4, bevelOffset: -4, bevelSegments: 4, curveSegments: 10}));
      const m = new THREE.Mesh(geo, letterMat); m.rotation.x = -Math.PI / 2; m.position.set(ox, FLOOR, LET.z); m.scale.z = 0.001; m.visible = false; scene.add(m); letters.push(m);
      const add = s => { const pts = s.getPoints(10); pts.push(pts[0].clone()); loops.push(pts.map(v => V(ox + v.x, FLOOR + 1.8, LET.z - v.y))); };
      p.sh.forEach(s => { add(s); s.holes.forEach(add); });
      lastLoop.push(loops.length - 1);
      x += widths[k] + gap;
    });
    TRACE = poseFromStrokes(loops, 2.4, {gapWeight: 0.04});   // the pen lifts between loops: no line runs from letter to letter
    window.__letterEnds = lastLoop.map(i => TRACE.ends[i]);   // for the recorder: letter k is fully written at S = 1.2 + 0.7 * ends[k]
  }

  /* ---------------- the projects: frameless screens drawn in row by row ---------------- */
  const SCREENS = [
    {c: V(-150, -40, -2700), yaw: 0.14, w: 580, hold: [2.95, 3.5]},
    {c: V(1150, -10, -4200), yaw: -0.2, w: 620, hold: [3.95, 4.55]},
    {c: V(-120, -40, -5700), yaw: 0.34, w: 580, hold: [5.0, 5.6]},
    {c: V(1000, -70, -7200), yaw: -0.12, w: 440, hold: [6.05, 6.6]},
  ].map((s, i) => ({...s, side: SCREEN_SIDES[i]}));
  const BEND = 0.00016;
  const rotY = (v, a) => V(v.x * Math.cos(a) + v.z * Math.sin(a), v.y, -v.x * Math.sin(a) + v.z * Math.cos(a));
  const soon = canvasTex(800, 520, 2);
  const stars = Array.from({length: 160}, () => [Math.random() * 800, Math.random() * 520, Math.random() * 1.8, Math.random() * 0.7]);
  function drawSoon() {
    const g = soon.g; soon.clear();
    const gr = g.createRadialGradient(400, 250, 20, 400, 260, 520); gr.addColorStop(0, '#3b3b3f'); gr.addColorStop(0.55, '#161618'); gr.addColorStop(1, '#070708'); g.fillStyle = gr; g.fillRect(0, 0, 800, 520);
    g.strokeStyle = '#ffffff22'; [90, 150, 210].forEach(r => { g.beginPath(); g.arc(400, 260, r, 0, Math.PI * 2); g.stroke(); });
    stars.forEach(([x, y, r, a]) => { g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    const [title, line] = pick(COPY.soon, lang);
    txt(g, title, 400, 282, {size: fit(g, title, 64, 620, 'sans', 650), weight: 650, color: '#fff', align: 'center', ls: -0.02});
    txt(g, line, 400, 330, {face: 'mono', size: 12, ls: 0.2, color: '#ffffffaa', align: 'center'});
    soon.t.needsUpdate = true;
  }
  const screenFrag = `uniform sampler2D map; uniform vec4 uST; uniform vec2 uSize; uniform float uReveal, uHover, uSweep; varying vec2 vUv;
    float sdRR(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
    void main(){
      vec2 p = (vUv - .5) * uSize; float d = sdRR(p, uSize * .5, 14.);
      float inside = 1. - smoothstep(-.75, .75, d);
      float rows = 42., k = floor((1. - vUv.y) * rows);
      float rk = clamp(uReveal * 1.7 - k / rows * .7, 0., 1.);
      float fill = step(vUv.x, rk);
      float head = exp(-pow((vUv.x - rk) * uSize.x / 1.6, 2.)) * step(.001, rk) * step(rk, .985) * .55;
      vec3 c = texture2D(map, vUv * uST.xy + uST.zw).rgb;
      float edge = (1. - smoothstep(0., 1.4, abs(d + 1.1))) * .28;
      float band = exp(-pow((vUv.x * .8 + vUv.y * .35 - uSweep) / .08, 2.)) * .2 * uHover;
      c = c * (1. + uHover * .05) + vec3(edge + band) + vec3(1.) * head * 3.;
      gl_FragColor = vec4(c, inside * max(fill, head));
      #include <colorspace_fragment>
    }`;
  const screenMeshes = [];
  function buildScreens() {
    SCREENS.forEach((s, i) => {
      const pr = PROJECTS[i], im = pr.tex && imgOf(pr.tex), tex = im ? TEX[pr.tex] : soon.t;
      const ar = im ? im.height / im.width : 0.65; s.h = Math.round(s.w * Math.min(ar, 0.6));
      const geo = new THREE.PlaneGeometry(s.w, s.h, 48, 1); const p = geo.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, -(p.getX(k) ** 2) * BEND);
      const ia = im ? im.width / im.height : s.w / s.h, ba = s.w / s.h;
      const st = ba > ia ? new THREE.Vector4(1, ia / ba, 0, (1 - ia / ba) / 2) : new THREE.Vector4(ba / ia, 1, (1 - ba / ia) / 2, 0);
      const mat = new THREE.ShaderMaterial({uniforms: {map: {value: tex}, uST: {value: st}, uSize: {value: new THREE.Vector2(s.w, s.h)}, uReveal: {value: 0}, uHover: {value: 0}, uSweep: {value: 0.5}},
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`, fragmentShader: screenFrag, transparent: true});
      const m = new THREE.Mesh(geo, mat); m.position.copy(s.c); m.rotation.y = s.yaw; scene.add(m); screenMeshes.push(m); s.mesh = m;
      s.cam = s.c.clone().add(rotY(V(s.side * 215, 40, 1850), s.yaw)); s.look = s.c.clone().add(rotY(V(s.side * 215, 0, 0), s.yaw));
      s.col = grey(im ? AVG[pr.tex] : new THREE.Color('#555558'));
      s.dom = root.querySelector(`[data-os-proj="${i}"]`); s.lines = s.dom ? [...s.dom.querySelectorAll('.reveal>span')] : [];
    });
  }

  /* ---------------- 02 · ABOUT on the drafting sheet ---------------- */
  const PX = 900, PZ = -9200, AZ = PZ + (H < 880 ? 20 : 60);   // sheet origin, timeline axis
  const FJ = {c: V(PX + 280, FLOOR + 1.5, PZ + 10), s: 1.25};
  function floorDecal(w, h, x, z, lift = 1) {
    const ct = canvasTex(w, h, Math.min(TEXQ, 16000 / w));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: ct.t, transparent: true, depthWrite: false}));
    m.rotation.x = -Math.PI / 2; m.position.set(x, FLOOR + lift, z); m.renderOrder = -800 + lift; scene.add(m);
    return Object.assign(ct, {mesh: m});
  }
  /* Sheets: drawings that come in without ever being redrawn. Each is drawn once, finished; a timing canvas holds, per pixel,
     the point of the reveal (red, 0..1) at which that ink arrives, so scrolling only moves a uniform. Marks that belong to a
     hover sit on their own canvas, timed in the green channel by the hover itself. Nothing is re-uploaded while you scroll. */
  const sheetFrag = `uniform sampler2D map, hmap, tmap; uniform float uP, uH, uO, uFade, uGain, uHasH; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(map, vUv); vec2 t = texture2D(tmap, vUv).rg;
      float a = smoothstep(t.r, t.r + uFade, uP * (1. + uFade));
      c.a = clamp(c.a * a * (1. + uH * uGain), 0., 1.);
      if (uHasH > .5) { vec4 h = texture2D(hmap, vUv); float ha = h.a * a * smoothstep(t.g, t.g + .25, uH * 1.25);
        float oa = ha + c.a * (1. - ha); if (oa > 0.) c.rgb = (h.rgb * ha + c.rgb * c.a * (1. - ha)) / oa; c.a = oa; }
      gl_FragColor = vec4(c.rgb, c.a * uO);
      #include <colorspace_fragment>
    }`;
  const TR = r => `rgb(${Math.round(clamp(r) * 255)},0,0)`, TG = v => `rgb(0,${Math.round(clamp(v) * 255)},0)`;
  function sheet(w, h, x, z, lift, {fade = 0.15, gain = 0, hover = false} = {}) {
    const sc = Math.min(TEXQ, 16000 / w), col = canvasTex(w, h, sc), tim = canvasTex(w, h, Math.min(1.5, sc)), hc = hover ? canvasTex(w, h, sc) : null;
    tim.t.colorSpace = THREE.NoColorSpace; tim.t.anisotropy = 1;
    const u = {map: {value: col.t}, hmap: {value: (hc || col).t}, tmap: {value: tim.t}, uP: {value: 0}, uH: {value: 0}, uO: {value: 1}, uFade: {value: fade}, uGain: {value: gain}, uHasH: {value: hover ? 1 : 0}};
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.ShaderMaterial({uniforms: u, transparent: true, depthWrite: false, fragmentShader: sheetFrag,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`}));
    m.rotation.x = -Math.PI / 2; m.position.set(x, FLOOR + lift, z); m.renderOrder = -800 + lift; scene.add(m);
    const S_ = {w, h, mesh: m, u, g: col.g, tg: tim.g, hg: hc && hc.g,
      reset() { col.clear(); if (hc) hc.clear(); tim.g.save(); tim.g.globalCompositeOperation = 'copy'; tim.g.fillStyle = TR(1); tim.g.fillRect(0, 0, w, h); tim.g.restore(); },   // unmarked: arrives last
      done() { [col, tim, hc].forEach(c => { if (c) c.t.needsUpdate = true; }); }};
    S_.reset(); return S_;
  }
  // each mark's timing twin: the same shape in its arrival time, drawn a little fatter so no anti-aliased edge arrives early
  function tText(tg, text, x, y, o, color) { tg.save(); tg.font = FONT[o.face || 'sans'](o.weight ?? 560).replace('SZ', o.size || 16); tg.letterSpacing = `${o.ls || 0}em`; tg.textAlign = o.align || 'left';
    tg.fillStyle = tg.strokeStyle = color; tg.lineWidth = 3; tg.lineJoin = 'round'; tg.strokeText(text, x, y); tg.fillText(text, x, y); tg.restore(); }
  function tRect(tg, x, y, w, h, c0, c1 = c0) { const gr = tg.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, c0); gr.addColorStop(1, c1); tg.fillStyle = gr; tg.fillRect(x - 2, y - 2, w + 4, h + 4); }
  function tLine(tg, x0, y0, x1, y1, r0, r1, lw = 1) { const gr = tg.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, TR(r0)); gr.addColorStop(1, TR(r1));
    tg.save(); tg.strokeStyle = gr; tg.lineWidth = lw + 3; tg.lineCap = 'round'; tg.beginPath(); tg.moveTo(x0, y0); tg.lineTo(x1, y1); tg.stroke(); tg.restore(); }
  function tArc(tg, cx, cy, R, a0, r0, r1, lw = 1) { const gr = tg.createConicGradient(a0, cx, cy); gr.addColorStop(0, TR(r0)); gr.addColorStop(0.998, TR(r1)); gr.addColorStop(1, TR(r1));
    tg.save(); tg.strokeStyle = gr; tg.lineWidth = lw + 3; tg.beginPath(); tg.arc(cx, cy, R, 0, Math.PI * 2); tg.stroke(); tg.restore(); }
  function hoverLayer(tg, draw) { tg.save(); tg.globalCompositeOperation = 'lighter'; draw(); tg.restore(); }   // green adds; red stays
  const paperObjs = [];
  let aboutD, guideD, rulerD, headD; const nodes = [];
  function buildAbout() {
    const D = aboutD, g = D.g, tg = D.tg; D.reset();
    const tx = (text, x, y, o, r) => { txt(g, text, x, y, o); tText(tg, text, x, y, o, TR(r)); };
    tx(pick(ABOUT.label, lang), 0, 60, {face: 'mono', size: 11, ls: 0.16, color: MUTED}, 0);
    const lines = pick(ABOUT.lines, lang), size = Math.min(...lines.map(t => fit(g, t, 40, 590, 'sans', 620)));
    lines.forEach((t, i) => { const y = 170 + i * 64, r = 0.05 + i * 0.08;   // the black labels wipe in, left to right
      const w = labelBox(g, t, 9, y, size); tRect(tg, 0, y - size * 0.98, w, size * 1.3, TR(r), TR(r + 0.3)); });
    pick(ABOUT.aside, lang).forEach((t, i) => tx(t, 0, 312 + i * 26, {size: 17, weight: 450, color: MUTED}, 0.3 + i * 0.03));
    g.fillStyle = '#14141826'; g.fillRect(0, 392, 560, 1); tRect(tg, 0, 392, 560, 1, TR(0.38), TR(0.62));
    tx(ABOUT.name, 0, 444, {size: 26, weight: 620, ls: -0.02}, 0.42);
    tx(pick(ABOUT.role, lang), 0, 474, {size: 15, weight: 480, color: MUTED}, 0.46);
    tx('EDUCATION', 0, 540, {face: 'mono', size: 10, ls: 0.16, color: MUTED}, 0.5);
    ABOUT.education.forEach((e, i) => { tx(e.school, 0, 568 + i * 26, {size: 15, weight: 560}, 0.55 + i * 0.05); tx(pick(e.what, lang), 250, 568 + i * 26, {size: 13, weight: 450, color: MUTED}, 0.58 + i * 0.05); });
    tx(ABOUT.stats, 0, 660, {face: 'mono', size: 10, ls: 0.16, color: INK}, 0.68);
    D.done();
  }
  // the construction of the mark keeps drawing itself while you read: guides, the bowl's circle, then the dimensions
  function buildGuides() {
    const D = guideD, g = D.g, tg = D.tg, X = x => 500 + (x - 263.5) * FJ.s, Y = y => 400 + (y - 297) * FJ.s; D.reset();
    const tx = (text, x, y, o, r) => { txt(g, text, x, y, o); tText(tg, text, x, y, o, TR(r)); };
    const dl = (x0, y0, x1, y1, r0, r1) => { dashed(g, x0, y0, x1, y1); tLine(tg, x0, y0, x1, y1, r0, r1); };
    const ln = (x0, y0, x1, y1, r0, r1) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); tLine(tg, x0, y0, x1, y1, r0, r1); };
    g.strokeStyle = 'rgba(20,20,24,.25)'; g.lineWidth = 1;
    dl(X(220.5), 20, X(220.5), 780, 0.02, 0.22); dl(X(307.5), 780, X(307.5), 20, 0.05, 0.25);
    [[126.5, 0.1], [359, 0.14], [386, 0.18], [467.5, 0.22]].forEach(([y, a]) => dl(40, Y(y), 960, Y(y), a, a + 0.2));
    const cx = X(198), cy = Y(386), R = 81 * FJ.s;
    g.strokeStyle = INK; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke(); tArc(tg, cx, cy, R, Math.PI, 0.25, 0.5, 1.2);
    g.strokeStyle = 'rgba(20,20,24,.2)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, (81 + 23.5) * FJ.s, 0, Math.PI * 2); g.stroke(); tArc(tg, cx, cy, (81 + 23.5) * FJ.s, 0, 0.35, 0.6);
    g.strokeStyle = '#141418aa';
    ln(cx - 8, cy, cx + 8, cy, 0.45, 0.45); ln(cx, cy - 8, cx, cy + 8, 0.45, 0.45);
    ln(cx, cy, cx + Math.cos(Math.PI * 0.8) * R, cy + Math.sin(Math.PI * 0.8) * R, 0.48, 0.58);
    const y = Y(250), y2 = Y(205);
    ln(X(284), y, X(331), y, 0.58, 0.7); tx('47', X(307.5), y - 8, {face: 'mono', size: 10, color: INK, align: 'center'}, 0.66);
    ln(X(244), y2, X(284), y2, 0.63, 0.75); tx('40', X(264), y2 - 8, {face: 'mono', size: 10, color: INK, align: 'center'}, 0.72);
    tx('R 81', cx - 70, cy + 40, {face: 'mono', size: 10, color: INK}, 0.6);
    tx('172.7°', cx + 22, cy + R + 36, {face: 'mono', size: 10, color: MUTED}, 0.68);
    tx('FIG. 01 — THE MARK · 一笔', 40, 40, {face: 'mono', size: 10, ls: 0.16, color: MUTED}, 0);
    tx('STROKE 47 · RADIUS 81 · SWEEP 172.7° · RULES → WONDER', 40, 770, {face: 'mono', size: 10, ls: 0.14, color: MUTED}, 0.8);
    D.done();
  }

  /* ---------------- 03 · TIMELINE along the straightened stroke ---------------- */
  function buildNode(n) {   // a card on the sheet; hover underlines it and offers 展开, all without a redraw
    const d = n.d, g = d.g, tg = d.tg, hg = d.hg, w = n.w, h = n.h; d.reset();
    const tx = (text, x, y, o, r) => { txt(g, text, x, y, o); tText(tg, text, x, y, o, TR(r)); };
    tRect(tg, 0, 0, w, h, TR(0));
    if (!n.now) { g.save(); g.shadowColor = 'rgba(20,20,30,.14)'; g.shadowBlur = 22; g.shadowOffsetY = 8; g.fillStyle = '#fbfaf6'; g.fillRect(20, 20, w - 40, h - 40); g.restore(); }
    let y = 58; const im = n.img && imgOf(`/assets/home/${n.img}.jpg`);
    if (im) { coverImg(g, im, 36, 36, w - 72, h * 0.45); tRect(tg, 36, 36, w - 72, h * 0.45, TR(0.08)); y = 36 + h * 0.45 + 28; }   // leaves room for three lines above the hover rule
    const open = lang === 'en' ? 'Open ↗' : '展开 ↗';
    if (n.now) {
      tx('NOW', 20, 150, {size: 150, weight: 700, ls: -0.07, color: INK}, 0.08);
      const t1 = pick(n.title, lang), t2 = pick(n.sub, lang), s = Math.min(fit(g, t1, 26, w - 52, 'sans', 620), fit(g, t2, 26, w - 52, 'sans', 620));
      tx(t1, 26, 206, {size: s, weight: 620}, 0.16); tx(t2, 26, 240, {size: s, weight: 620}, 0.16);
      tx('Between rules & wonder.', 26, 276, {face: 'serif', size: 24, color: MUTED}, 0.24);
      hg.fillStyle = INK; hg.fillRect(26, 166, 300, 4);
      hoverLayer(tg, () => tRect(tg, 26, 166, 300, 4, TG(0), TG(0.75)));
    } else {
      const title = pick(n.title, lang), sub = pick(n.sub, lang);
      tx(n.tag, 38, y, {face: 'mono', size: 10, ls: 0.16, color: MUTED}, 0.16);
      tx(title, 38, y + 32, {size: fit(g, title, title.length > 14 ? 21 : 26, w - 76, 'sans', 620, -0.02), weight: 620, ls: -0.02}, 0.16);
      tx(sub, 38, y + 60, {size: fit(g, sub, 13, w - 76, 'sans', 450), weight: 450, color: MUTED}, 0.24);
      hg.fillStyle = INK; hg.fillRect(20, h - 23, w - 40, 3);
      txt(hg, open, w - 38, y, {size: 11, weight: 560, color: INK, align: 'right'});
      hoverLayer(tg, () => { tRect(tg, 20, h - 23, w - 40, 3, TG(0), TG(0.75)); tText(tg, open, w - 38, y, {size: 11, weight: 560, align: 'right'}, TG(0.3)); });
    }
    d.done();
    const yd = n.yd, gy = yd.g; yd.reset();   // the year, in outline; hover darkens it
    gy.save(); gy.globalAlpha = 0.9; gy.font = FONT.sans(700).replace('SZ', 132); gy.letterSpacing = '-0.06em'; gy.strokeStyle = 'rgba(20,20,24,.33)'; gy.lineWidth = 1.2; gy.strokeText(n.year === 'SYS' ? '→' : n.year, 0, 120); gy.restore();
    tRect(yd.tg, 0, 0, yd.w, yd.h, TR(0.08)); yd.done();
  }
  function drawRuler() {
    const g = rulerD.g; rulerD.clear(); g.fillStyle = '#14141840';
    for (let x = 0; x <= rulerD.w; x += 50) { const big = x % 250 === 0; g.fillRect(x, big ? 18 : 24, 1, big ? 24 : 12); }
    TIMELINE.forEach(n => { const x = n.x + 700; g.fillStyle = INK; g.beginPath(); g.arc(x, 30, 4.5, 0, 7); g.fill(); g.strokeStyle = '#14141855'; g.beginPath(); g.arc(x, 30, 10, 0, 7); g.stroke(); });
    rulerD.t.needsUpdate = true;
  }
  function drawTimelineHead() {
    const g = headD.g; headD.clear();
    txt(g, pick(COPY.timelineHead, lang), 0, 40, {face: 'mono', size: 11, ls: 0.16, color: MUTED}); txt(g, 'Drawn from 2023 to now.', 0, 84, {face: 'serif', size: 34, color: INK});
    headD.t.needsUpdate = true;
  }

  /* ---------------- 04 · the portal ring and the art worlds ---------------- */
  const RX = PX + 5100, RING_R = 300, RY = FLOOR + 330;
  const GZ = AZ, AX0 = RX + 1500;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(RING_R - 3, 128), new THREE.MeshBasicMaterial({colorWrite: false, depthWrite: false, side: THREE.DoubleSide}));
  Object.assign(disc.material, {stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp});
  disc.rotation.y = Math.PI / 2; disc.position.set(RX, RY, AZ); disc.renderOrder = -2000; disc.visible = false; scene.add(disc);
  const artObjs = [];
  const ART_LAYOUT = [{dx: 250, depth: 1500, y: 350, w: 880}, {dx: 1250, depth: 1350, y: 330, w: 320}, {dx: 2080, depth: 1950, y: 470, w: 760},
    {dx: 2980, depth: 1250, y: 300, w: 520}, {dx: 3780, depth: 1700, y: 380, w: 640}, {dx: 4950, depth: 1600, y: 350, w: 780}, {dx: 6250, depth: 1500, y: 340, w: 820}];
  const ARTS = ART.map((a, i) => ({...a, ...ART_LAYOUT[i]}));
  let cmpMat, worldsSign, worldsTex;
  function buildArt() {
    ARTS.forEach(a => {
      const im = imgOf(a.tex); a.h = Math.round(a.w * (im ? im.height / im.width : 0.56));
      let mat;
      if (a.cmp) {
        cmpMat = new THREE.ShaderMaterial({uniforms: {tA: {value: TEX[a.tex]}, tB: {value: TEX[a.tex2]}, uSplit: {value: 0.5}, uGlow: {value: 0}},
          vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
          fragmentShader: `uniform sampler2D tA, tB; uniform float uSplit, uGlow; varying vec2 vUv;
            void main(){ vec3 a = texture2D(tA, vUv).rgb, b = texture2D(tB, vUv).rgb; float e = smoothstep(uSplit - .002, uSplit + .002, vUv.x);
              vec3 c = mix(a, b, e); float line = exp(-pow((vUv.x - uSplit) / .0022, 2.)); c += vec3(.95) * line * 2.4;
              gl_FragColor = vec4(c * (1. + uGlow * .06), 1.);
              #include <colorspace_fragment>
            }`});
        mat = cmpMat;
      } else mat = new THREE.MeshBasicMaterial({map: TEX[a.tex] || null, color: new THREE.Color(1, 1, 1)});
      const m = new THREE.Mesh(new THREE.PlaneGeometry(a.w, a.h), mat);
      m.position.set(AX0 + a.dx, FLOOR + a.y, GZ - a.depth); scene.add(m); a.mesh = m; artObjs.push(m);
      const tl = canvasTex(120, 520, 2); a.tl = tl; drawArtTitle(a, 0);
      const tm = new THREE.Mesh(new THREE.PlaneGeometry(120, 520), new THREE.MeshBasicMaterial({map: tl.t, transparent: true, depthWrite: false}));
      tm.position.set(AX0 + a.dx + a.w / 2 + 90, FLOOR + a.y + a.h / 2 - 260, GZ - a.depth); scene.add(tm); a.tm = tm; artObjs.push(tm);
      a.col = grey(AVG[a.tex] || new THREE.Color('#555'));
    });
    worldsTex = canvasTex(1300, 560, 2); drawWorlds();
    worldsSign = new THREE.Mesh(new THREE.PlaneGeometry(1300, 560), new THREE.MeshBasicMaterial({map: worldsTex.t, transparent: true, depthWrite: false}));
    worldsSign.rotation.y = -Math.PI / 2; worldsSign.position.set(RX + 2900, FLOOR + 420, AZ); scene.add(worldsSign); artObjs.push(worldsSign);
  }
  function drawWorlds() {
    const g = worldsTex.g; worldsTex.clear();
    txt(g, 'WORLDS', 650, 300, {size: 250, weight: 680, ls: -0.06, color: '#ffffff', align: 'center'});
    txt(g, 'worth entering.', 650, 450, {face: 'serif', size: 130, color: '#c4c4ca', align: 'center'});
    txt(g, pick(COPY.worlds, lang), 650, 530, {face: 'mono', size: 13, ls: 0.18, color: '#ffffff88', align: 'center'});
    worldsTex.t.needsUpdate = true;
  }
  function drawArtTitle(a, hov) {
    const g = a.tl.g; a.tl.clear(); const title = pick(a.title, lang), hot = hov > 0.5;
    if (lang === 'en') { g.save(); g.translate(46, 30); g.rotate(Math.PI / 2); txt(g, title, 0, 0, {size: fit(g, title, 30, 460, 'sans', 620), weight: 620, color: hot ? '#ffffff' : '#e4e4e6'}); g.restore(); }
    else vert(g, title, 40, 60, {size: 34, color: hot ? '#ffffff' : '#e4e4e6', face: 'song', weight: 600});
    g.save(); g.translate(84, 30); g.rotate(Math.PI / 2); txt(g, `${a.en} · ${a.year}`, 0, 0, {face: 'mono', size: 10, ls: 0.18, color: hot ? '#ffffff' : '#ffffff88'}); g.restore();
    if (hov > 0.01) { g.fillStyle = `rgba(255,255,255,${hov})`; g.fillRect(16, 36, 2, Math.min(460, (lang === 'en' ? measure(g, title, 30, 'sans', 620) : title.length * 37.4)) * eo3(hov)); }
    a.tl.t.needsUpdate = true;
  }

  /* ---------------- 05 · the letter: the same lake, at dawn ---------------- */
  const OX = AX0 + 6250, OY = FLOOR + 2600, OZ = GZ - 3200, WL2 = OY - 140;
  const ENDC = V(OX, WL2 + 34 + 170.3 * JL_S, OZ - 3000);
  const MQ = {h: 230};
  let marq = null, marqPlane, lakeEnd, waterEnd;
  function drawMarquee() {
    const probe = document.createElement('canvas').getContext('2d');
    const parts = pick(COPY.marquee, lang).map((t, i) => [t, i ? 'serif' : 'sans']);
    const size = {sans: 150, serif: 176}, gapW = 130;
    const widths = parts.map(([t, f]) => measure(probe, t, size[f], f, f === 'sans' ? 680 : 400, f === 'sans' ? -0.04 : 0));
    const total = Math.ceil(widths.reduce((a, b) => a + b, 0) + gapW * parts.length);
    const next = canvasTex(total, MQ.h, 2); next.t.wrapS = THREE.RepeatWrapping;
    let x = gapW / 2; parts.forEach(([t, f], i) => { txt(next.g, t, x, 172, {size: size[f], face: f, weight: f === 'sans' ? 680 : 400, ls: f === 'sans' ? -0.04 : 0, color: '#fff'}); x += widths[i] + gapW; });
    next.g.fillStyle = '#fff'; [gapW / 2 - 65, gapW / 2 + widths[0] + 65].forEach(cx => { next.g.beginPath(); next.g.arc(cx, 118, 5, 0, 7); next.g.fill(); });
    next.t.needsUpdate = true;
    if (marq) marq.t.dispose();
    marq = next; MQ.w = total;
    if (marqPlane) { const u = marqPlane.material.uniforms; u.uMarq.value = marq.t; u.uRep.value = marqPlane.userData.PW / (MQ.w * marqPlane.userData.u); }
  }
  function buildOutro() {
    drawMarquee();
    const u = HEAD.h / 900, PW = HEAD.h * 2.6;                           // world units per px at the sheet's distance; wide enough for any window
    marqPlane = new THREE.Mesh(new THREE.PlaneGeometry(PW, MQ.h * u), new THREE.ShaderMaterial({uniforms: {uMarq: {value: marq.t}, uTime: {value: 0}, uIn: {value: 0}, uRep: {value: PW / (MQ.w * u)}}, transparent: true, depthWrite: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: `uniform sampler2D uMarq; uniform float uTime, uIn, uRep; varying vec2 vUv;
        void main(){ float a = texture2D(uMarq, vec2(fract(vUv.x * uRep - uTime * .035), vUv.y)).a; gl_FragColor = vec4(vec3(.02), a * uIn * .2); }`}));
    marqPlane.userData = {PW, u};
    marqPlane.position.set(OX, WL2 + (MQ.h / 2 - (MQ.h - 172)) * u, OZ - HEAD.d); marqPlane.renderOrder = -800; scene.add(marqPlane);   // its baseline on the far waterline
    lakeEnd = makeLake(WL2, OX, OZ, '#8c8c8e', '#ededeb'); lakeEnd.material.uniforms.uFogD.value = 6500;
    waterEnd = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WL2);
  }

  /* ---------------- poses of the one line ---------------- */
  let JL_CORE, FLAT_JL, AXIS, RING, HORIZON, JL_END;
  function buildPoses() {
    JL_CORE = jlPose(JLC, JL_S, V(1, 0, 0), V(0, 1, 0), 2.6);
    FLAT_JL = jlPose(FJ.c, FJ.s, V(1, 0, 0), V(0, 0, -1), 1.1);
    AXIS = poseFromStrokes([[V(PX - 620, FLOOR + 1.5, AZ), V(PX + 5200, FLOOR + 1.5, AZ)]], 0.75);
    RING = poseFromStrokes([curve(u => { const a = -Math.PI / 2 + u * Math.PI * 2 * 1.002; return V(RX, RY + RING_R * Math.sin(a), AZ + RING_R * Math.cos(a)); }, 400)], 3.2);
    for (let i = 0; i < N; i++) RING.D[i] = 1e4;
    HORIZON = poseFromStrokes([[V(RX - 3000, FLOOR + 30, GZ - 9000), V(AX0 + 11000, FLOOR + 30, GZ - 9000)]], 4);
    JL_END = jlPose(V(OX, OY + 20, OZ - 1500), 0.62, V(1, 0, 0), V(0, 1, 0), 2.1);
  }
  function linePose(S) {
    if (S < 1.2) return copyPose(live, JL_CORE);
    if (S < 7.3) return copyPose(live, TRACE);
    if (S < 9.6) return copyPose(live, FLAT_JL);
    if (S < 10.5) return flow(live, FLAT_JL, AXIS, seg(S, 9.6, 10.5), {spread: 0.7});
    if (S < 14.2) return copyPose(live, AXIS);
    if (S < 15.0) return flow(live, AXIS, RING, seg(S, 14.2, 15.0), {spread: 0.5, dir: -1, lift: V(0, 1, 0), liftAmt: 160});
    if (S < 15.8) return copyPose(live, RING);
    if (S < 16.6) return flow(live, RING, HORIZON, seg(S, 15.8, 16.6), {spread: 0.5});
    if (S < 21.3) return copyPose(live, HORIZON);
    return copyPose(live, JL_END);
  }

  /* ---------------- camera choreography ---------------- */
  const KEYS = [];
  function k(s, pos, look, up = V(0, 1, 0), e = 'io') { KEYS.push({s, pos, look, up, e}); }
  function buildKeys() {
    k(0, V(0, 30, 1500), V(0, 30, 0));
    k(1.0, V(0, 28, 1340), V(0, 26, 0));
    k(1.75, V(0, 2050, 2850), V(0, FLOOR, LET.z - 110));
    k(2.45, V(160, 1850, 2600), V(0, FLOOR, LET.z - 130));
    k(2.72, V(-60, 240, -520), V(-150, -40, -2500));
    SCREENS.forEach((s, i) => { k(s.hold[0], s.cam, s.look, V(0, 1, 0), i === 0 ? 'out' : 'io'); k(s.hold[1], s.cam.clone().add(rotY(V(-s.side * 40, 6, -70), s.yaw)), s.look.clone().add(rotY(V(-s.side * 30, 0, 0), s.yaw))); });
    k(7.25, V(PX, FLOOR + 1300, PZ + 1650), V(PX, FLOOR, PZ - 160), V(0, 1, 0));
    k(7.9, V(PX - 40, FLOOR + TOPD, PZ), V(PX - 40, FLOOR, PZ), V(0, 0, -1));
    k(9.6, V(PX + 25, FLOOR + TOPD, PZ), V(PX + 25, FLOOR, PZ), V(0, 0, -1), 'lin');
    k(10.5, V(PX + 60, FLOOR + TOPD, PZ), V(PX + 60, FLOOR, PZ), V(0, 0, -1), 'lin');
    k(14.2, V(PX + 4480, FLOOR + TOPD, PZ), V(PX + 4480, FLOOR, PZ), V(0, 0, -1), 'lin');
    k(14.75, V(RX - 1900, FLOOR + 1050, AZ + 1500), V(RX, RY - 40, AZ), V(0, 1, 0));
    k(15.15, V(RX - 2900, RY, AZ), V(RX, RY, AZ), V(0, 1, 0));
    k(15.8, V(RX + 420, RY, AZ), V(RX + 3000, RY, AZ), V(0, 1, 0), 'in');
    k(16.5, V(AX0 - 320, FLOOR + 260, GZ), V(AX0 - 320, FLOOR + 380, GZ - 1600), V(0, 1, 0), 'io');
    k(20.6, V(AX0 + 5000, FLOOR + 260, GZ), V(AX0 + 5000, FLOOR + 380, GZ - 1600), V(0, 1, 0), 'lin');
    const lastArt = ARTS.at(-1);
    k(21.3, V(AX0 + lastArt.dx, FLOOR + lastArt.y, GZ - lastArt.depth + 560), V(AX0 + lastArt.dx, FLOOR + lastArt.y, GZ - lastArt.depth), V(0, 1, 0), 'in');
    k(21.31, V(OX, OY, OZ + 400), V(OX, OY, OZ - 1500));
    k(22.6, V(OX, OY, OZ), V(OX, OY, OZ - 1500));
  }
  const EASE = {io: eio, lin: t => t, in: t => t * t * t, out: eo3};
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camUp = new THREE.Vector3();
  function camAt(S) {
    let i = KEYS.findIndex(q => q.s > S);
    if (i === -1) i = KEYS.length - 1; if (i === 0) i = 1;
    const a = KEYS[i - 1], b = KEYS[i], e = EASE[b.e](clamp((S - a.s) / (b.s - a.s)));
    camPos.copy(a.pos).lerp(b.pos, e); camLook.copy(a.look).lerp(b.look, e); camUp.copy(a.up).lerp(b.up, e).normalize();
  }

  /* ---------------- interaction ---------------- */
  // inside: over the journey itself (hovers and clicks); inWin: anywhere in the window. The view leans toward the pointer
  // wherever it is, so crossing the site's own navigation or a corner button never snaps the scene back to centre.
  const pointer = {x: W * 0.6, y: H * 0.5, inside: false, down: false, inWin: false};
  const within = t => t instanceof Element && !!t.closest('.onestroke');
  const move = e => { pointer.x = e.clientX / UI; pointer.y = e.clientY / UI; pointer.inside = within(e.target); pointer.inWin = true; };
  on(window, 'pointermove', move, {passive: true});
  on(document.documentElement, 'pointerleave', () => { pointer.inside = false; pointer.inWin = false; });
  on(window, 'blur', () => { pointer.inWin = false; });
  const leanP = {x: 0, y: 0};   // the pointer as the scene feels it: eased, so it follows like a weight on a string
  const mag = {x: 0, y: 0};     // how far the letter button has leaned toward the pointer
  const spin = {v: 0, a: 0, lx: 0};
  let splash = false;
  on(window, 'pointerdown', e => { move(e); if (!pointer.inside) return; pointer.down = true; spin.lx = pointer.x; splash = true; }, {passive: true});
  on(window, 'pointerup', () => { pointer.down = false; }, {passive: true});
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hitTest(meshes) { ndc.set(pointer.x / W * 2 - 1, -(pointer.y / H * 2 - 1)); ray.setFromCamera(ndc, cam); const h = ray.intersectObjects(meshes.filter(m => m && m.visible), false); return h[0] || null; }
  const q$ = sel => root.querySelector(sel);
  const cursorEl = q$('.os-cursor'), cursorLabel = cursorEl.querySelector('span');
  const cross = q$('.os-cross'), crossH = cross.querySelector('.h'), crossV = cross.querySelector('.v'), crossXY = cross.querySelector('.xy');
  let hovEls = [];
  const collectHover = () => { hovEls = [...root.querySelectorAll('[data-h]')]; hovEls.forEach(el => { el.__lay = undefined; }); };
  function domHover() {   // every DOM control answers the pointer, including the scripted one used for recordings
    let hit = null;
    hovEls.forEach(el => {
      const lay = el.__lay === undefined ? (el.__lay = el.closest('.os-l')) : el.__lay, vis = !lay || parseFloat(lay.style.opacity || '1') > 0.3;
      let onEl = false;
      if (vis && pointer.inside) { const r = el.getBoundingClientRect(), qx = pointer.x * UI, qy = pointer.y * UI; onEl = r.width > 0 && qx >= r.left - 4 && qx <= r.right + 4 && qy >= r.top - 4 && qy <= r.bottom + 4; }
      if (el.__on !== onEl) { el.__on = onEl; el.classList.toggle('hov', onEl); } if (onEl) hit = el;
    });
    return hit;
  }

  /* ---------------- DOM refs ---------------- */
  const setStyle = (el, k_, v) => { if (!el) return; const c = el.__s || (el.__s = {}); if (c[k_] !== v) { c[k_] = v; el.style[k_] = v; } };   // the frame writes only what changed
  const op = v => (v <= 0.001 ? '0' : v >= 0.999 ? '1' : v.toFixed(3));
  const stage = q$('.os-stage'), idx = q$('.os-index'), idxRows = [...idx.querySelectorAll('[data-k]')];
  const monitor = q$('.os-monitor'), crtT = monitor.querySelector('.t'), crtB = monitor.querySelector('.b'), crtLine = monitor.querySelector('b');
  const kvMeta = q$('.os-kv-meta'), kvHud = q$('.os-kv-hud'), kvScroll = q$('.os-kv-scroll'), hudQ = q$('.os-hud-q'), gzA = q$('.os-gz-a'), gzB = q$('.os-gz-b');
  const artHead = q$('.os-art-head'), artCount = q$('.os-art-count'), outro = q$('.os-outro'), mail = q$('.os-mail'), tracer = q$('.os-tracer'), tracerL = tracer.querySelector('span');
  const outroLines = [...outro.querySelectorAll('line')];
  const oParts = [outro.querySelector('.o-top'), ...outro.querySelectorAll('.o-grid > *'), outro.querySelector('.o-foot')];

  /* ---------------- layout: the design space, scaled to the window ---------------- */
  const dyn = {s: 1, hist: []};   // the share of the full resolution this machine can afford
  function applySize() {
    PR = pixelRatio() * dyn.s;
    gl.setPixelRatio(PR); gl.setSize(W, H, false); composer.setPixelRatio(PR); composer.setSize(W, H);
    [lake, lakeEnd].forEach(l => l && l.getRenderTarget().setSize(Math.round(W * PR * 0.6), Math.round(H * PR * 0.6)));   // reflections at 60 %
    cam.aspect = W / H; cam.updateProjectionMatrix();
  }
  function adapt(dt) {   // frames that run long for a while cost a little sharpness; never below half
    if (FIXED || OFFLINE || document.hidden) return;
    dyn.hist.push(dt); if (dyn.hist.length < 45) return;
    const med = dyn.hist.sort((a, b) => a - b)[22]; dyn.hist.length = 0;
    if (med > 0.024 && dyn.s > 0.5) { dyn.s = Math.max(0.5, dyn.s * 0.85); applySize(); }
  }
  function layout() {
    if (!FIXED) { UI = innerHeight / DH; W = innerWidth / UI; }
    stage.style.width = `${W}px`; stage.style.height = `${H}px`; stage.style.transform = FIXED ? 'none' : `scale(${UI})`;
    canvas.style.width = FIXED ? `${W}px` : '100vw'; canvas.style.height = FIXED ? `${H}px` : '100vh';
    applySize();
    const svg = outro.querySelector('svg'), ls = outro.querySelectorAll('line');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    [96, W / 2, W - 96].forEach((x, i) => { ls[i].setAttribute('x1', x); ls[i].setAttribute('x2', x); ls[i].setAttribute('y2', H); });
    [[3, 170], [4, H - 280], [5, H - 64]].forEach(([i, y]) => { ls[i].setAttribute('x2', W); ls[i].setAttribute('y1', y); ls[i].setAttribute('y2', y); });
    outro.querySelector('.o-grid').style.top = `${H - 232}px`;
    outroLines.forEach(l => { const L = l.getTotalLength(); l.style.strokeDasharray = L; l.style.strokeDashoffset = L; l.dataset.len = L; l.__s = {}; });
  }

  /* ---------------- the screen: switching on (and off) like an old monitor ---------------- */
  function crt(o) {  // 0: dark screen, 1: fully open
    setStyle(monitor, 'display', o >= 1 ? 'none' : 'block'); if (o >= 1) return;
    const dot = seg(o, 0, 0.12), line = eo3(seg(o, 0.12, 0.45)), open = eio(seg(o, 0.45, 1));
    setStyle(crtLine, 'opacity', op(dot * (1 - seg(open, 0, 0.7))));
    setStyle(crtLine, 'transform', `translate(-50%, -50%) scale(${mix(0.006, 1, line).toFixed(4)}, ${(1 + open * 5).toFixed(3)})`);
    setStyle(crtT, 'transform', `translateY(${(-open * 100).toFixed(2)}%)`); setStyle(crtB, 'transform', `translateY(${(open * 100).toFixed(2)}%)`);
  }
  // The screen's own state, 0 dark … 1 open. It switches on when you arrive from the office and off again when you scroll
  // back up into it (the layer stays until the picture has collapsed to a dot), or when "back to top" takes you out.
  const screen = {o: 0, want: 0};
  const SCREEN_ON = 0.92, SCREEN_OFF = 0.55;   // seconds: dot → line → open, and back
  // chapter jumps fly on their own easing (any wheel, key or touch hands control back); "back to top" switches the screen off
  const power = {off: -1};
  let fly = null, snap = false;
  const sectionTop = () => section.getBoundingClientRect().top + scrollY;
  ['wheel', 'keydown', 'touchstart'].forEach(ev => on(window, ev, () => { fly = null; }, {passive: true}));
  on(window, 'journey:jump', () => { snap = true; fly = null; });
  function goChapter(i) {
    const to = sectionTop() + toScroll(CHAPTERS[i]) * innerHeight, far = Math.abs(to - scrollY) / innerHeight;
    fly = {from: scrollY, to, t0: time, dur: clamp(0.9 + far * 0.09, 0.9, 2.6)};
  }
  function backToTop() { if (power.off < 0) power.off = time; }
  // the 3D things you can click: a screen opens its project, a picture its page, a card where it leads, the ring takes you through
  on(window, 'click', e => {
    if (!activeNow || OFFLINE || !within(e.target) || e.target.closest('a,button,[data-os-action]')) return;
    if (hoverScreen >= 0 && PROJECTS[hoverScreen].ready) actions.openProject?.(PROJECTS[hoverScreen]);
    else if (hoverArt >= 0 && !ARTS[hoverArt].cmp) actions.openArt?.(ARTS[hoverArt]);
    else if (hoverNode >= 0) actions.node?.(TIMELINE[hoverNode].go);
    else if (hov.ring > 0.5) goChapter(4);
    else if (hov.end > 0.5) actions.mail?.();
  });

  /* ---------------- frame ---------------- */
  let S = 0, last = performance.now(), time = 0, t0 = 0, introPrev = -1, ringTick = -1, activeNow = false, built = false, paused = false;
  const TV = new THREE.Vector3();
  const pool = (i, x, z, r, w, col) => { [floorA, floorB].forEach(f => { f.material.uniforms.uPool.value[i].set(x, z, r, w); f.material.uniforms.uPoolC.value[i].copy(col); }); };
  const qJL = new THREE.Quaternion(), eul = new THREE.Euler();
  const pluck = {x: 0, z: 0, a: 0}, hov = {mark: 0, guides: 0, ring: 0, end: 0}, eulE = new THREE.Euler();
  let hoverScreen = -1, hoverNode = -1, hoverArt = -1;
  const inkAbout = new THREE.Color(0x55545d), inkAxis = new THREE.Color(0xb2b1b9), inkRing = new THREE.Color(0x18181d);
  const white1 = new THREE.Color('#ffffff');
  const bodyTone = tone => { if (tone) { if (document.body.dataset.navTone !== tone) document.body.dataset.navTone = tone; } else if (document.body.dataset.navTone) delete document.body.dataset.navTone; };

  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)) || 0.016; last = now; time += dt;
    const St = window.__tourS ?? toJourney(-section.getBoundingClientRect().top / innerHeight);
    const routeOpen = document.body.classList.contains('portfolio-route-open');
    paused = document.hidden || routeOpen;
    // the page before us (the office) owns the screen until it has gone dark; scrolling back up into it, the office gets the
    // screen back once ours has switched off
    const inJourney = built && St > -0.0005;
    const active = inJourney || (activeNow && screen.o > 0 && !paused);
    if (active !== activeNow) {
      activeNow = active; root.classList.toggle('is-live', active); section.classList.toggle('is-live', active); document.body.classList.toggle('past-office', active);
      if (active) { t0 = now; S = St; introPrev = -1; power.off = -1; screen.o = 0; } else bodyTone(null);
    }
    if (!active || paused) { if (!OFFLINE) raf = requestAnimationFrame(frame); return; }
    S += (St - S) * (1 - Math.exp(-dt / 0.12)); if (Math.abs(St - S) < 1e-4 || OFFLINE || snap) S = St; snap = false;
    if (window.__tourPointer) { const was = pointer.down; Object.assign(pointer, window.__tourPointer); if (pointer.down && !was) spin.lx = pointer.x; }
    // layout is read before this frame writes any style, so reading it never forces a second layout
    const mailBox = S > 21.3 ? mail.getBoundingClientRect() : null, domHit = domHover();
    /* the office's dark monitor switches on, the line it opens from is the horizon; at the very top of the journey (or for
       "back to top") it switches off again: the picture folds into that line, the line into a dot */
    if (power.off >= 0 || !inJourney || St < 0.012) screen.want = 0; else if (St > 0.03) screen.want = 1;
    screen.o = clamp(screen.o + (screen.want ? dt / SCREEN_ON : -dt / SCREEN_OFF));
    crt(screen.o);
    if (power.off >= 0 && screen.o <= 0) { power.off = -1; fly = null; scrollTo({top: 0, behavior: 'instant'}); }   // dark: back out through the monitor, into the office
    if (fly) { const qf = seg(time, fly.t0, fly.t0 + fly.dur); scrollTo({top: mix(fly.from, fly.to, eio(qf)), behavior: 'instant'}); if (qf >= 1) fly = null; }
    const intro = (now - t0) / 1000;
    // the opening plays by itself; once the screen is open, scrolling can hurry it along, so the stone is always up
    // (by S 0.5) long before the first scroll sinks it (S 1.0)
    const iv = Math.max(intro, S * 5.4 * seg(screen.o, 0.5, 1));
    // the pointer as the scene feels it: eased, and wherever it is in the window
    const inWin = pointer.inWin || pointer.inside, kp = 1 - Math.exp(-dt / 0.3);
    leanP.x += ((inWin ? clamp(pointer.x / W) - 0.5 : 0) - leanP.x) * kp; leanP.y += ((inWin ? clamp(pointer.y / H) - 0.5 : 0) - leanP.y) * kp;
    const px = leanP.x, py = leanP.y;

    /* camera, leaning a little toward the pointer (not while top-down on paper) */
    camAt(S); const topDown = seg(S, 7.6, 7.9) * (1 - seg(S, 14.2, 14.5));
    cam.position.copy(camPos); cam.up.copy(camUp); cam.lookAt(camLook);
    // while the screen switches on the camera holds still, so the horizon lands exactly on the monitor's line
    const lean = (1 - topDown) * (S < 1 ? eio(seg(screen.o, 0.7, 1)) : 1); cam.translateX(px * 32 * lean); cam.translateY(-py * 20 * lean); cam.lookAt(camLook);
    cam.updateMatrixWorld();

    /* the monolith: rises out of the lake as the screen opens, turns with the pointer or a drag, sinks on the first scroll */
    const kvW = 1 - seg(S, 0.6, 1.3);
    hov.mark += ((S < 0.9 && pointer.inside && hitTest([jlKV]) ? 1 : 0) - hov.mark) * (1 - Math.exp(-dt / 0.2));
    if (pointer.down && S < 1.2) { spin.v += (pointer.x - spin.lx) * 0.0009; spin.lx = pointer.x; }
    spin.v *= Math.exp(-dt * 2.2); spin.a += spin.v; spin.a *= Math.exp(-dt * (pointer.down ? 0 : 1.1));
    const turn = 0.3 + hov.mark * 0.2;
    eul.set(py * 0.16 * turn * kvW, (px * turn + spin.a + Math.sin(time * 0.3) * 0.08) * kvW, 0); qJL.setFromEuler(eul);
    const rise = eo3(seg(iv, 1.1, 2.7)), sink = Math.pow(seg(S, 1.0, 1.25), 2);
    [[1.1, 1.5], [1.55, 1.0], [2.3, 0.55]].forEach(([t, a]) => { if (introPrev < t && iv >= t && S < 1) ripple(JLC.x, JLC.z + 25, a); });
    const bob = Math.sin(time * 0.9) * 5;                              // it breathes; now and then the water answers with a ring
    if (S < 0.95 && iv > 2.9 && Math.floor(time / 3.4) !== ringTick) { ringTick = Math.floor(time / 3.4); ripple(JLC.x, JLC.z + 25, 0.22); }
    if (S > 22.3 && Math.floor(time / 3.4) !== ringTick) { ringTick = Math.floor(time / 3.4); ripple(ENDC.x, ENDC.z + 25, 0.22); }
    jlKV.position.set(JLC.x, JLC.y + bob - (1 - rise) * 420 - sink * 460, JLC.z); jlKV.quaternion.copy(qJL); jlKV.scale.setScalar(JL_S); jlKV.visible = S < 1.25 && rise > 0.001;
    stoneKV.envMapIntensity = 2.4 + hov.mark * 0.8;
    const endIn = eo3(seg(S, 21.62, 22.35));
    hov.end += ((S > 22.1 && pointer.inside && hitTest([jlEnd]) ? 1 : 0) - hov.end) * (1 - Math.exp(-dt / 0.2));
    eulE.set(py * (0.08 + hov.end * 0.08), px * (0.24 + hov.end * 0.18) + Math.sin(time * 0.3) * 0.1, 0); jlEnd.quaternion.setFromEuler(eulE);
    jlEnd.position.set(ENDC.x, ENDC.y + bob - (1 - endIn) * 420, ENDC.z); jlEnd.scale.setScalar(JL_S); jlEnd.visible = S > 21.3 && endIn > 0.001;
    stoneEnd.envMapIntensity = 0.5 + hov.end * 0.5;   // in the white mist the stone stays black: the one dark thing in the frame

    const beyond = S > 14.3 && cam.position.x > RX - 6, portal = S > 14.3 && !beyond, letterOn = S > 21.3;
    linePose(S);
    let reveal = 1;
    if (S >= 1.2 && S < 2.45) reveal = seg(S, 1.2, 1.9);                // the pen writes SYSTEMS on the lakebed, letter by letter
    else if (S > 7.3 && S < 9.6) reveal = eio(seg(S, 7.35, 8.25));      // then the mark again, in ink
    const onAxis = S > 10.4 && S < 14.25 && pointer.inside;
    const wx = cam.position.x + (pointer.x - W / 2), wz = cam.position.z + (pointer.y - H / 2);
    const want = onAxis && Math.abs(wz - AZ) < 240 ? 1 : 0; pluck.a += (want - pluck.a) * (1 - Math.exp(-dt / 0.2)); if (want) { pluck.x = wx; pluck.z = wz; }
    const wob = pluck.a > 0.001 ? (u, x) => { const g = Math.exp(-(((x - pluck.x) / 200) ** 2)) * pluck.a; return [0, 0, (pluck.z - AZ) * 0.3 * g + Math.sin(time * 8 + x * 0.01) * 1.5 * g]; } : null;
    const inkAmt = (S > 7.3 && S < 21.3 && !beyond) || S > 21.3 ? 1 : 0;
    const lineOn = S >= 1.2 && S < 21.3 ? 1 : 0;
    const rest = 1 - seg(S, 2.5, 2.9) * (1 - seg(S, 7.2, 7.3));   // the thread rests while the projects speak
    lightMesh.visible = inkAmt < 0.999 && rest > 0.001 && lineOn > 0; inkMesh.visible = inkAmt > 0.001 && lineOn > 0;
    if (lightMesh.visible) tubeL.update(live, {k: (1 - inkAmt) * rest, reveal, wobble: wob});
    if (inkMesh.visible) tubeI.update(live, {k: inkAmt * (1 + hov.ring * 0.9), reveal, wobble: wob});
    inkMat.color.copy(inkAbout).lerp(inkAxis, seg(S, 9.8, 10.5)).lerp(inkRing, seg(S, 14.2, 14.7));
    let glow = 1.55;                                                     // a pen of light, not a neon tube
    if (S >= 2.6 && S < 7.0) glow = mix(1.55, 1.2, seg(S, 2.6, 3.0));
    if (S > 14.2) glow = 0.85;
    lightMat.color.copy(LIGHT).multiplyScalar(glow);

    /* the lake: the horizon is there the moment the screen opens; the headline is set once the monolith stands; the pointer
       touches the water. The first scroll sinks the monolith, tilts us down into the lake, and the water clears over the lakebed */
    const lu = lake.material.uniforms; lu.uTime.value = time; lu.uOp.value = 1 - seg(S, 1.2, 1.55); lu.uMurk.value = mix(0.9, 0.35, seg(S, 1.0, 1.3));
    lu.uSink.value.set(JLC.x, JLC.z + 25, seg(S, 1.0, 1.5) * 2600, S > 1.0 ? 1.8 * (1 - seg(S, 1.0, 1.5)) : 0);
    lake.visible = S < 1.56;
    const hA = headA.mesh.material.uniforms, hB = headB.mesh.material.uniforms;
    hA.uIn.value = seg(iv, 2.1, 3.1); hB.uIn.value = seg(iv, 2.6, 3.6); hA.uA.value = hB.uA.value = 1 - seg(S, 0.85, 1.1);
    headA.mesh.visible = headB.mesh.visible = S < 1.1;
    if (splash && S < 0.95) touchWater(waterKV, 1.3, true);
    else if (pointer.inside && S < 0.95 && iv > 1.2) touchWater(waterKV, 0.4);
    if (splash && S > 22.05) touchWater(waterEnd, 1.3, true);
    else if (pointer.inside && S > 22.05) touchWater(waterEnd, 0.4);
    splash = false;
    const hudA = seg(iv, 2.7, 3.5) * (1 - seg(S, 0.62, 0.9));
    [kvMeta, kvHud, kvScroll].forEach(el => setStyle(el, 'opacity', op(hudA)));
    kvHud.classList.toggle('hov', hov.mark > 0.5);
    if (hudA > 0.001) { hudQ.textContent = `Q ${qJL.x.toFixed(3)} ${qJL.y.toFixed(3)} ${qJL.z.toFixed(3)} ${qJL.w.toFixed(3)}`;
      setStyle(gzA, 'transform', `rotate(${(eul.y * 57.3).toFixed(1)}deg)`); setStyle(gzB, 'transform', `rotate(${(90 + eul.x * 57.3).toFixed(1)}deg)`); }

    /* letters rise out of their outlines one after another; a letter under the pointer stands a little taller */
    let hl = -1; if (S > 2.15 && S < 2.62 && pointer.inside) { const h = hitTest(letters); if (h) hl = letters.indexOf(h.object); }
    letters.forEach((m, i) => { const up = eo3(seg(S, 1.92 + i * 0.035, 2.2 + i * 0.035)); m.userData.h = (m.userData.h || 0) + ((hl === i ? 1 : 0) - (m.userData.h || 0)) * (1 - Math.exp(-dt / 0.14));
      m.scale.z = Math.max(0.001, up * (1 + m.userData.h * 0.55)); m.visible = up > 0.001 && S < 3.3; });

    /* screens: drawn in row by row, tilted by the pointer */
    hoverScreen = -1;
    if (S > 2.8 && S < 6.7 && pointer.inside) { const h = hitTest(screenMeshes); if (h) hoverScreen = screenMeshes.indexOf(h.object); }
    SCREENS.forEach((s, i) => {
      const onS = seg(S, s.hold[0] - 0.5, s.hold[0] - 0.06) * (1 - seg(S, s.hold[1] + 0.05, s.hold[1] + 0.3));
      const u = s.mesh.material.uniforms; u.uReveal.value = onS; s.mesh.visible = onS > 0.001;
      s.hov = (s.hov || 0) + ((hoverScreen === i ? 1 : 0) - (s.hov || 0)) * (1 - Math.exp(-dt / 0.2)); u.uHover.value = s.hov;
      if (hoverScreen === i) { const hit = hitTest([s.mesh]); if (hit) u.uSweep.value += (hit.uv.x * 0.8 + hit.uv.y * 0.35 - u.uSweep.value) * (1 - Math.exp(-dt / 0.1)); }
      s.mesh.rotation.y = s.yaw + px * 0.12 * s.hov; s.mesh.rotation.x = py * 0.08 * s.hov;
      s.mesh.position.copy(s.c).add(rotY(V(0, 0, 40 * s.hov), s.yaw));
      const p = seg(S, s.hold[0] - 0.22, s.hold[0] + 0.04) * (1 - seg(S, s.hold[1] + 0.02, s.hold[1] + 0.16));
      setStyle(s.dom, 'opacity', p > 0.001 ? '1' : '0'); setStyle(s.dom, 'visibility', p > 0.001 ? 'visible' : 'hidden');
      if (p > 0.001 || s.lines[0]?.__s?.opacity !== '0') s.lines.forEach((l, j) => { const qq = eo3(clamp(p * 1.6 - j * 0.1)); setStyle(l, 'transform', `translateY(${((1 - qq) * 115).toFixed(2)}%)`); setStyle(l, 'opacity', op(qq)); });
    });

    /* paper: spreads from where the thread lands; about, guides, timeline */
    const wipe = seg(S, 6.9, 7.8), paper = wipe >= 1 ? 1 : 0;
    floorA.material.uniforms.uWipe.value.set(FJ.c.x, FJ.c.z, wipe > 0 && wipe < 1 ? Math.pow(wipe, 2.2) * 9000 : 0);
    floorA.material.uniforms.uPaper.value = letterOn ? 1 : beyond ? 0 : (S > 14.3 ? 1 : paper);
    skyA.material.uniforms.uPaper.value = letterOn ? 1 : beyond ? 0 : (S > 14.3 ? 1 : eio(seg(S, 7.35, 7.8)));
    skyA.material.uniforms.uLake.value = letterOn ? 1 : 1 - seg(S, 1.3, 1.6); skyA.material.uniforms.uDawn.value = letterOn ? 1 : 0;
    floorA.material.uniforms.uCam.value.copy(cam.position); floorB.material.uniforms.uCam.value.copy(cam.position);
    skyA.position.copy(cam.position); skyB.position.copy(cam.position);
    const paperMode = (!beyond && S > 7.5 && S < 21.3) || letterOn;
    gl.toneMapping = paperMode ? THREE.NoToneMapping : THREE.NeutralToneMapping;
    bloom.enabled = S > 1.1 && S < 7.45;                                 // only the pen of light and the screens' reveal heads glow
    bloom.strength = S < 2.6 ? 0.3 : 0.22;
    const paperVis = S > 7.0 && S < 16.0 && !beyond;
    paperObjs.forEach(o => { o.visible = paperVis; });
    aboutD.u.uP.value = seg(S, 7.35, 8.3); aboutD.u.uO.value = 1 - seg(S, 9.7, 10.2); aboutD.mesh.position.x = PX - 205 - seg(S, 9.7, 10.3) * 160;
    const onAbout = S > 7.9 && S < 9.7 && pointer.inside && Math.abs(wx - FJ.c.x) < 330 && Math.abs(wz - FJ.c.z) < 330;
    hov.guides += ((onAbout ? 1 : 0) - hov.guides) * (1 - Math.exp(-dt / 0.2));
    guideD.u.uP.value = seg(S, 7.5, 9.35); guideD.u.uH.value = hov.guides; guideD.u.uO.value = 1 - seg(S, 9.6, 10.0);
    // a tracer runs the finished stroke while you read, reading off how far along it is
    const tu = seg(S, 8.35, 9.5), trA = seg(S, 8.25, 8.4) * (1 - seg(S, 9.5, 9.65));
    setStyle(tracer, 'opacity', trA > 0.001 && !beyond ? trA.toFixed(3) : '0');
    if (trA > 0.001) { const i = Math.round(tu * (N - 1)) * 3; TV.set(FLAT_JL.P[i], FLAT_JL.P[i + 1], FLAT_JL.P[i + 2]).project(cam);
      setStyle(tracer, 'transform', `translate3d(${((TV.x + 1) / 2 * W).toFixed(1)}px, ${((1 - TV.y) / 2 * H).toFixed(1)}px, 0)`); tracerL.textContent = `s ${tu.toFixed(2)}`; }
    headD.mesh.material.opacity = seg(S, 10.2, 10.7);
    rulerD.mesh.material.opacity = seg(S, 10.1, 10.6);
    hoverNode = -1;
    if (S > 10.4 && S < 14.3 && pointer.inside) { const h = hitTest(nodes.map(n => n.d.mesh)); if (h) hoverNode = nodes.findIndex(n => n.d.mesh === h.object); }
    nodes.forEach((n, i) => {
      const sx = (PX + n.x - cam.position.x) / W;
      const p = clamp((0.62 - sx) * 2.2) * seg(S, 10.3, 10.6);
      n.hov += ((hoverNode === i ? 1 : 0) - n.hov) * (1 - Math.exp(-dt / 0.15));
      n.d.u.uP.value = n.yd.u.uP.value = p; n.d.u.uH.value = n.yd.u.uH.value = n.hov;
      n.d.mesh.scale.setScalar(1 + n.hov * 0.04); n.yd.mesh.position.x = PX + n.x - 20 - (0.5 - sx) * 60;
    });
    disc.visible = portal; disc.scale.setScalar(Math.max(0.001, eio(seg(S, 14.78, 15.05))));
    floorB.visible = portal; skyB.visible = portal;
    setStencil(floorA, portal ? 'outside' : 'none'); setStencil(skyA, portal ? 'outside' : 'none');
    paperObjs.forEach(o => setStencil(o, portal ? 'outside' : 'none'));
    const artVis = S > 14.3 && S < 21.3;
    artObjs.forEach(o => { o.visible = artVis; setStencil(o, portal ? 'inside' : 'none'); });
    setStencil(floorB, 'inside'); setStencil(skyB, 'inside');
    hov.ring += ((portal && S > 15.0 && pointer.inside && hitTest([disc]) ? 1 : 0) - hov.ring) * (1 - Math.exp(-dt / 0.2));

    /* art: panels lean toward the camera; hover brings one forward and names it */
    hoverArt = -1;
    if (S > 16.4 && S < 21.0 && pointer.inside) { const h = hitTest(ARTS.map(a => a.mesh)); if (h) hoverArt = ARTS.findIndex(a => a.mesh === h.object); }
    ARTS.forEach((a, i) => {
      const target = hoverArt === i ? 1 : 0; a.hov = (a.hov || 0) + (target - (a.hov || 0)) * (1 - Math.exp(-dt / 0.2));
      const rel = (AX0 + a.dx - cam.position.x) / a.depth;
      a.mesh.rotation.y = -Math.atan(rel) * 0.35; a.mesh.position.z = GZ - a.depth + a.hov * 90; a.tm.rotation.y = a.mesh.rotation.y; a.tm.position.z = a.mesh.position.z;
      a.mesh.position.y = FLOOR + a.y + Math.sin(time * 0.6 + i) * 6;
      if (!a.cmp) a.mesh.material.color.setScalar(1 + a.hov * 0.12); else cmpMat.uniforms.uGlow.value = a.hov;
      if (Math.abs(a.hov - (a.dh ?? -1)) > 0.03) { drawArtTitle(a, a.hov); a.dh = a.hov; }
    });
    if (cmpMat) {
      const a = ARTS.find(qa => qa.cmp), hit = hoverArt === ARTS.indexOf(a) ? hitTest([a.mesh]) : null;
      const target = hit ? hit.uv.x : 0.5 + 0.38 * Math.sin((S - 19.0) * 2.4);
      cmpMat.uniforms.uSplit.value += (target - cmpMat.uniforms.uSplit.value) * (1 - Math.exp(-dt / 0.12));
    }
    worldsSign.material.opacity = 1 - seg(S, 15.9, 16.4);

    /* floor light pools under whatever glows nearby */
    let pi = 0;
    pool(pi++, 0, 0, 1, 0, white1);
    pool(pi++, 0, LET.z - 120, 1300, 0.12 * seg(S, 1.3, 1.9) * (1 - seg(S, 2.9, 3.3)), white1);
    SCREENS.forEach(s => { pool(pi++, s.c.x, s.c.z + 200, 420, 0.5 * s.mesh.material.uniforms.uReveal.value, s.col); });
    ARTS.slice(0, POOLS - pi).forEach(a => { pool(pi++, AX0 + a.dx, GZ - a.depth + 340, a.w * 0.62, artVis ? 0.55 + a.hov * 0.3 : 0, a.col); });

    /* the letter */
    const eu = lakeEnd.material.uniforms; eu.uTime.value = time; lakeEnd.visible = letterOn;
    eu.uSink.value.set(ENDC.x, ENDC.z + 25, seg(S, 21.62, 22.3) * 2400, S > 21.62 ? 1.4 * (1 - seg(S, 21.62, 22.3)) : 0);
    marqPlane.visible = letterOn; marqPlane.material.uniforms.uTime.value = time; marqPlane.material.uniforms.uIn.value = seg(S, 21.75, 22.35);
    const white = S < 21.3 ? eio(seg(S, 20.92, 21.3)) : 1 - eio(seg(S, 21.3, 21.95));   // the last world burns out to white; the white is mist, and it thins
    expose.uniforms.uWhite.value = white; expose.enabled = white > 0.001;
    const o = seg(S, 21.45, 22.6);
    const outroA = S > 21.35 ? (power.off >= 0 ? 1 - seg(time - power.off, 0, 0.2) : 1) : 0;
    setStyle(outro, 'opacity', op(outroA)); setStyle(outro, 'visibility', outroA > 0.001 ? 'visible' : 'hidden');
    if (S > 21.3) {
      outroLines.forEach((l, i) => { setStyle(l, 'strokeDashoffset', (l.dataset.len * (1 - eio(clamp(o * 1.5 - i * 0.07)))).toFixed(1)); });
      oParts.forEach((el, i) => { const qq = eo3(clamp((S - 22.0) * 2.2 - i * 0.12)); setStyle(el, 'opacity', op(qq)); setStyle(el, 'transform', `translateY(${((1 - qq) * 24).toFixed(2)}px)`); });
      // the button leans toward a pointer that comes near; measured from where it rests, not from where it has leaned to
      // (measuring the leaned button fed its own motion back and made it shiver)
      const mx = pointer.x - ((mailBox.left + mailBox.width / 2) / UI - mag.x), my = pointer.y - ((mailBox.top + mailBox.height / 2) / UI - mag.y), md = Math.hypot(mx, my);
      const mpull = S > 22 && pointer.inside && md < 190 ? (1 - md / 190) : 0, km = 1 - Math.exp(-dt / 0.16);
      mag.x += (mx * mpull * 0.35 - mag.x) * km; mag.y += (my * mpull * 0.35 - mag.y) * km;
      setStyle(mail, 'translate', `${mag.x.toFixed(1)}px ${mag.y.toFixed(1)}px`);
    }

    /* chrome: the site's navigation takes its tone from the page; the index, the headers */
    const light = (S > 7.25 && S < 16.5 && !beyond) || S > 21.32;   // dark ink as soon as the page is paper
    bodyTone(light ? 'light' : 'dark');
    idx.classList.toggle('dark', light);
    const ch = S < 2.3 ? 0 : S < 7.3 ? 1 : S < 9.9 ? 2 : S < 14.5 ? 3 : S < 21.3 ? 4 : 5;
    idxRows.forEach((r, i) => r.classList.toggle('on', i === ch));
    const idxA = seg(S, 0.8, 1.3) * (1 - seg(S, 21.0, 21.3)) * (1 - 0.65 * seg(S, 1.15, 1.3) * (1 - seg(S, 2.45, 2.6)));
    setStyle(idx, 'opacity', op(idxA)); setStyle(idx, 'visibility', idxA > 0.001 ? 'visible' : 'hidden');
    const ahA = seg(S, 16.5, 16.9) * (1 - seg(S, 20.5, 20.9)), acA = seg(S, 19.9, 20.3) * (1 - seg(S, 20.9, 21.1));
    setStyle(artHead, 'opacity', op(ahA)); setStyle(artCount, 'opacity', op(acA)); setStyle(artCount, 'visibility', acA > 0.001 ? 'visible' : 'hidden');

    /* cursor */
    const C = COPY.cursor;
    let label = '';
    if (hoverScreen >= 0) label = PROJECTS[hoverScreen].ready ? `${pick(PROJECTS[hoverScreen].cta, lang)} ↗` : pick(C.soon, lang);
    else if (hoverNode >= 0) label = pick(C.open, lang);
    else if (hoverArt >= 0) label = ARTS[hoverArt].cmp ? pick(C.compare, lang) : pick(C.work, lang);
    else if (hov.mark > 0.5) label = pick(C.drag, lang);
    else if (hov.ring > 0.5) label = pick(C.enter, lang);
    else if (hov.end > 0.5) label = pick(C.write, lang);
    setStyle(cursorEl, 'transform', `translate3d(${pointer.x.toFixed(1)}px, ${pointer.y.toFixed(1)}px, 0)`); cursorEl.classList.toggle('big', !!label); cursorEl.classList.toggle('link', !label && !!domHit);
    if (cursorLabel.__t !== label) { cursorLabel.__t = label; cursorLabel.textContent = label; } setStyle(cursorEl, 'opacity', pointer.inside ? '1' : '0');
    const onPaper = topDown > 0.99 && S < 14.2 && pointer.inside && !label && !domHit;
    setStyle(cross, 'opacity', onPaper ? '1' : '0');
    if (onPaper) { setStyle(crossH, 'top', `${pointer.y.toFixed(1)}px`); setStyle(crossV, 'left', `${pointer.x.toFixed(1)}px`); setStyle(crossXY, 'left', `${(pointer.x + 14).toFixed(1)}px`); setStyle(crossXY, 'top', `${(pointer.y + 12).toFixed(1)}px`);
      const xy = `X ${Math.round(wx - PX)}  Y ${Math.round(PZ - wz)}`; if (crossXY.__t !== xy) { crossXY.__t = xy; crossXY.textContent = xy; } }

    if (window.__plate) { headA.mesh.visible = headB.mesh.visible = false; marqPlane.visible = false; }   // a clean plate of the scene, for the still page's pictures
    composer.render(dt);
    adapt(dt);
    introPrev = iv;
    window.__S = S;
    if (!OFFLINE) raf = requestAnimationFrame(frame);
  }

  /* ---------------- build, warm, run ---------------- */
  ready.then(() => {
    if (!alive) return;
    drawHead(); drawSoon(); buildLetters(); buildScreens(); buildArt(); buildOutro();
    aboutD = sheet(620, 720, PX - 205, PZ + 10, 2, {fade: 0.2}); guideD = sheet(1000, 800, FJ.c.x, FJ.c.z, 1.2, {fade: 0.1, gain: 1}); buildAbout(); buildGuides();
    rulerD = floorDecal(5700, 60, PX - 700 + 2850, AZ, 1.1); drawRuler();
    headD = floorDecal(700, 120, PX + 60, PZ - 300, 1.3); drawTimelineHead();
    TIMELINE.forEach(n0 => {
      const n = {...n0}, zc = n.side < 0 ? AZ - 60 - n.h / 2 : AZ + 60 + n.h / 2;
      n.d = sheet(n.w, n.h, PX + n.x + n.w / 2 - 40, zc, 3, {fade: 0.35, hover: true});
      n.yd = sheet(420, 150, PX + n.x - 20, n.side < 0 ? AZ + 110 : AZ - 110, 1.4, {fade: 0.35, gain: 1.6});
      n.hov = 0; buildNode(n); nodes.push(n);
    });
    paperObjs.push(aboutD.mesh, guideD.mesh, rulerD.mesh, headD.mesh, ...nodes.flatMap(n => [n.d.mesh, n.yd.mesh]));
    buildPoses(); buildKeys(); collectHover();
    layout(); on(window, 'resize', layout);
    { // everything drawn once, unculled, so every shader, buffer and picture is on the GPU before the page moves
      const saved = []; scene.traverse(o => { if (o.isMesh || o.isLine) { saved.push([o, o.visible, o.frustumCulled]); o.visible = true; o.frustumCulled = false; } }); expose.enabled = true;
      [THREE.NoToneMapping, THREE.NeutralToneMapping].forEach(m => { gl.toneMapping = m; composer.render(0.016); });
      saved.forEach(([o, v, f]) => { o.visible = v; o.frustumCulled = f; }); expose.enabled = false; }
    built = true;
    if (OFFLINE) {
      // DOM transitions follow the recorder's clock too: each is paused and set to its age in virtual time
      const born = new WeakMap();
      const animTick = v => document.getAnimations().forEach(a => { if (!born.has(a)) born.set(a, v); a.pause(); a.currentTime = Math.max(0, v - born.get(a)); });
      t0 = 0; last = 0; window.__frame = v => { frame(v); animTick(v); return window.__S; };
    } else { last = performance.now(); raf = requestAnimationFrame(frame); }
    if (!OFFLINE && !Q.has('debug')) return;
    // for the recorder (and ?debug): where things land on screen, and handles on the scene
    window.__probe = {
      project: (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; },
      screens: SCREENS.map(s => s.c.toArray()), art: ARTS.map(a => [AX0 + a.dx, FLOOR + a.y, GZ - a.depth, a.w]), ring: [RX, RY, AZ],
      nodes: TIMELINE.map(n => ({x: PX + n.x, w: n.w, h: n.h, side: n.side})), PX, PZ, AZ, FJ: FJ.c.toArray(), mark: JLC.toArray(), end: ENDC.toArray(),
      rects: sel => [...document.querySelectorAll(sel)].map(e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width, r.height]; }),
    };
    window.__dbg = {cam, composer, bloom, letters, lightMesh, inkMesh, floorA, skyA, screenMeshes, jlKV, jlEnd, lake, lakeEnd, scene, frame, power, headA, headB};
    window.__ready = true;
  });

  function setLang(next) {
    if (next === lang) return;
    lang = next;
    if (!built) return;
    drawHead(); drawSoon(); buildAbout(); drawTimelineHead(); nodes.forEach(buildNode); drawWorlds(); drawMarquee();
    ARTS.forEach(a => { a.dh = -1; });
    requestAnimationFrame(collectHover);
  }

  function dispose() {
    alive = false; cancelAnimationFrame(raf);
    listeners.forEach(([t, type, fn, opts]) => t.removeEventListener(type, fn, opts));
    bodyTone(null); document.body.classList.remove('past-office');
    const mats = new Set();
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); [].concat(o.material || []).forEach(m => mats.add(m)); });
    mats.forEach(m => m.dispose());
    textures.forEach(t => t.dispose()); Object.values(TEX).forEach(t => t.dispose());
    [env, envDusk, envDawn].forEach(t => t.dispose()); pmrem.dispose();
    lake.getRenderTarget().dispose(); lakeEnd?.getRenderTarget().dispose();
    composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); bloom.dispose?.();
    gl.dispose(); gl.forceContextLoss(); canvas.remove();
    ['__frame', '__probe', '__dbg', '__ready', '__S', '__letterEnds'].forEach(k_ => { delete window[k_]; });
  }

  return {setLang, goChapter, backToTop, dispose, ready};
}
