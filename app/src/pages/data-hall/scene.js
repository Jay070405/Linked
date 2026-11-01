// The renderer and the one scene. update(p, time) poses everything for a progress value; nothing keeps state
// between frames except the intro's drawing clock, so scrolling back un-builds the hall exactly.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {PICK, U1, ROW_X0, ROW_X1, WALK_Z, COLD_AISLES, OVERHEAD, CENTER} from './plan';
import {T, seg, smoother, lerp} from './timeline';
import {U, INK} from './build';
import {buildHall, buildLights} from './hall';
import {buildTray, poseTray, DETAIL, slotY, frontZ} from './detail';
import {drawPlanAsync, drawDieAsync, pairLabels, SHEET} from './drawing';
import {glow} from './textures';
import ENV_URL from './room-env.bin?url';
import {placeCamera} from './camera';
import {newBaker, useBaker, disposeBaker} from './gpu';
import {useSmallAtlas} from './closeup';

const PAPER = new THREE.Color('#fafbfc'), DARK = new THREE.Color('#0c0d0f');
// where the walk starts: the camera's x when it enters the aisle (camera.js, key 0.52)
const WALK_X0 = ROW_X0 - 1.6;
// the blend between drawing and material: narrow, so the ink line drawn where it is half way reads as a line
const REAL_W = 0.3;
// the drawings are grey ink on paper, so they keep two channels (grey, coverage) and the time maps one: a 4096²
// sheet costs 32 MB instead of 64 MB. The packing runs on the GPU: the canvas uploads once, one draw copies the
// channels it needs into a smaller target, and the upload is freed. No per-pixel loop on the main thread.
function packer(renderer) {
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), targets = [];
  const mat = new THREE.ShaderMaterial({
    uniforms: {uSrc: {value: null}, uTwo: {value: 1}, uPre: {value: 0}}, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    // (a label map is stored premultiplied, red times alpha, so filtering keeps red / alpha exact: the label's anchor)
    fragmentShader: 'uniform sampler2D uSrc; uniform float uTwo, uPre; varying vec2 vUv; void main(){ vec4 t = texture2D(uSrc, vUv); gl_FragColor = vec4(mix(t.r, t.r * t.a, uPre), t.a * uTwo, 0., 1.); }',
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  const pack = (c, channels, premultiply = false) => {
    const src = new THREE.CanvasTexture(c); src.colorSpace = THREE.NoColorSpace; src.generateMipmaps = false; src.minFilter = THREE.NearestFilter; src.magFilter = THREE.NearestFilter;
    const rt = new THREE.WebGLRenderTarget(c.width, c.height, {format: channels === 2 ? THREE.RGFormat : THREE.RedFormat, depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, colorSpace: THREE.NoColorSpace});
    rt.texture.anisotropy = 16;
    mat.uniforms.uSrc.value = src; mat.uniforms.uTwo.value = channels === 2 ? 1 : 0; mat.uniforms.uPre.value = premultiply ? 1 : 0;
    const before = renderer.getRenderTarget();
    renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(before);
    src.dispose(); targets.push(rt);
    return rt.texture;
  };
  pack.dispose = () => {for (const rt of targets) rt.dispose(); mat.dispose(); scene.children[0].geometry.dispose();};
  return pack;
}

// Building the scene takes a second or two on a slow phone: it is done in steps, and between them the main thread is
// given back to the page (scrolling, input), so no single task blocks it for long. The longest step is reported.
const pause = () => globalThis.scheduler?.yield ? globalThis.scheduler.yield() : new Promise(r => setTimeout(r, 0));

// `onEarly` is called with the scene as soon as the plan can be drawn, so the opening starts while the rest builds;
// the promise resolves when everything is built
// `settled` (optional) resolves once the opening has drawn itself in, or the visitor has scrolled: the build's heavy
// single steps wait for it, so the draw-in never pauses for them
export async function createScene(canvas, {small = false, signal = null, onEarly = null, settled = null} = {}) {
  let longest = 0, mark = performance.now();
  // (tick gives the page its turn; breathe also records the busy time since the last breathe, as one named step)
  const steps = [];
  let busy = 0, chunk = 0;
  // a cancelled build stops at its next step and frees what it has made so far (undo, newest first)
  const undo = [];
  let baker = null;
  const tick = async () => {
    const ms = performance.now() - mark; busy += ms; chunk = Math.max(chunk, ms); longest = Math.max(longest, ms); await pause(); mark = performance.now();
    if (signal?.aborted) {for (const f of undo.reverse()) try {f();} catch { /* already gone */ } throw new DOMException('Data Hall: build cancelled', 'AbortError');}
    if (baker) useBaker(baker);
  };
  // (each step: its busy time and its longest piece of work between two yields, in ms)
  const breathe = async label => {await tick(); steps.push([label, Math.round(busy), Math.round(chunk)]); busy = 0; chunk = 0;};
  // phones are capped at a lower pixel ratio than desktops. Integrated and phone GPUs start at 1 and earn the rest: the
  // frame budget in DataHall.jsx steps the ratio up (to the cap) while frames are quick, and down if they run slow
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance'});
  const gl = renderer.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info'), gpuName = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
  // (phones, integrated GPUs (Apple silicon too, as Safari and Chrome name it) and any GPU that doesn't give its name
  // get the cheaper set-up; ?tier=modest or ?tier=full in the address forces one, for the scripted runs)
  const forced = new URLSearchParams(location.search).get('tier');
  const modest = forced ? forced === 'modest' : small || !gpuName || /intel|mali|adreno|powervr|apple gpu|apple m\d|metal renderer: apple|radeon\(tm\) graphics|radeon graphics|radeon\D*\d{3,4}m\b|vega \d/i.test(gpuName);
  // (a modest GPU is capped where a phone is: 1.25)
  const maxDpr = Math.min(window.devicePixelRatio || 1, small || modest ? 1.25 : 1.5);
  renderer.setPixelRatio(modest ? Math.min(1, maxDpr) : maxDpr);
  undo.push(() => {renderer.dispose(); renderer.forceContextLoss();});
  // the room's reflections, prefiltered once (scripts/datahall-bake-env.mjs): fetched and unpacked while the plan
  // draws, a few rows at a time (null where the browser can't unpack it: the room is then filtered here, as before)
  const baked = (async () => {
    if (typeof DecompressionStream === 'undefined') return null;
    const res = await fetch(ENV_URL, {signal});
    const b = new Uint8Array(await new Response(res.body.pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
    const dv = new DataView(b.buffer), W = dv.getUint32(0, true), H = dv.getUint32(4, true), n = W * H, data = new Uint16Array(n * 4);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        // (each half is stored as the difference from the one to its left, or below at a row's start)
        for (let c = 0; c < 3; c++) {const k = i * 3 + c; data[i * 4 + c] = ((b[8 + k] | b[8 + n * 3 + k] << 8) + (x ? data[i * 4 + c - 4] : y ? data[(i - W) * 4 + c] : 0)) & 0xffff;}
        data[i * 4 + 3] = 0x3c00;
      }
      if (y % 64 === 63) await pause();
    }
    const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.HalfFloatType, THREE.CubeUVReflectionMapping);
    t.magFilter = t.minFilter = THREE.LinearFilter; t.colorSpace = THREE.LinearSRGBColorSpace; t.needsUpdate = true;
    return t;
  })().catch(() => null);
  // (asked once now, while the GPU is idle: three.js asks on the first texture upload, and later that query would wait
  // behind everything queued)
  renderer.capabilities.getMaxAnisotropy();
  // the GPU's time for each frame, where the browser offers timer queries: the frame budget then knows whether fewer
  // pixels would help (results arrive a frame or two late; at most four queries are in flight)
  const timer = gl.getExtension('EXT_disjoint_timer_query_webgl2'), queries = [], gpuMs = [];
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // shadows for the tray close-ups only: only the tray casts and receives
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = modest ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(20, 1, 0.1, 1000);
  const bg = new THREE.Color(), v3 = new THREE.Vector3();
  let width = 1, height = 1, instances = 0, full = false, disposed = false;
  // a frame that would be identical to the last one is skipped (update, below)
  let lastP = -1, lastSize = '', lastDraw = -1, sunDrawn = false, trayDrawn = false;
  const state = {cam: null};
  const api = {update, resize, setDpr, info, gpuTimes, ready, dispose, camera, state, three: scene};
  scene.background = PAPER.clone();
  // (in the scene from the start, at zero density, so turning it up compiles nothing)
  scene.fog = new THREE.FogExp2(DARK.clone(), 0);
  await tick();
  await breathe('renderer');

  const hemi = new THREE.HemisphereLight('#ffffff', '#d8d3ca', 0.62), key = new THREE.DirectionalLight('#fffaf2', 2.7);
  key.position.set(-34, 40, -22);
  const trayKey = new THREE.DirectionalLight('#ffffff', 0);
  trayKey.position.set(PICK.x + 0.6, DETAIL.outY + 1.6, DETAIL.outZ + 1.2); trayKey.target.position.set(PICK.x, DETAIL.outY, DETAIL.outZ);
  trayKey.castShadow = true; trayKey.shadow.mapSize.setScalar(small || modest ? 1024 : 2048); trayKey.shadow.bias = -0.0004; trayKey.shadow.normalBias = 0.002;
  Object.assign(trayKey.shadow.camera, {left: -0.6, right: 0.6, top: 0.6, bottom: -0.6, near: 0.8, far: 3.6}); trayKey.shadow.camera.updateProjectionMatrix();
  // the sun casts the plaster model's shadows (the depth pass grows pieces like their surfaces do)
  // (none on a modest GPU: the plaster model goes without the sun's shadows there)
  key.castShadow = !modest; key.shadow.mapSize.setScalar(1024);
  Object.assign(key.shadow.camera, {left: -19, right: 19, top: 19, bottom: -19, near: 20, far: 110}); key.shadow.camera.updateProjectionMatrix();
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.04;
  // shadow maps are drawn only while they can change: the sun's while the plaster model is building, the tray light's
  // while the tray moves (update() asks for them)
  key.shadow.autoUpdate = false; trayKey.shadow.autoUpdate = false; key.target.position.set(CENTER.x, 0, CENTER.z);
  scene.add(hemi, key, key.target, trayKey, trayKey.target);
  // once the hall is powered, the light lines over the cold aisles light it: a long area light under the nearest two
  // (none on a modest GPU, which also gets plain shadow filtering, a smaller tray shadow and no sun shadow: there the
  // glowing strips and a brighter room light stand in)
  RectAreaLightUniformsLib.init();
  const aisleLights = COLD_AISLES.slice().sort((a, b) => Math.abs((a.z0 + a.z1) / 2 - WALK_Z) - Math.abs((b.z0 + b.z1) / 2 - WALK_Z)).slice(0, modest ? 0 : 2).map(c => {
    const l = new THREE.RectAreaLight('#fff4e6', 0, ROW_X1 - ROW_X0 + 3, 0.35);
    l.position.set((ROW_X0 + ROW_X1) / 2, OVERHEAD.light - 0.06, (c.z0 + c.z1) / 2); l.lookAt(l.position.x, 0, l.position.z);
    scene.add(l); return l;
  });

  // a pool of light on the floor under each aisle's light strip, once the hall is powered (brightest along the aisle's
  // middle, fading to its edges and its ends)
  const poolMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, uniforms: {uA: {value: 0}},
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform float uA; varying vec2 vUv; void main(){ float across = exp(-pow((vUv.y - .5) / .22, 2.)), along = smoothstep(0., .08, vUv.x) * smoothstep(1., .92, vUv.x); gl_FragColor = vec4(vec3(1., .96, .9) * uA * across * along, 1.); }',
  });
  const pools = COLD_AISLES.map(c => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ROW_X1 - ROW_X0 + 2, c.z1 - c.z0).rotateX(-Math.PI / 2), poolMat);
    m.position.set((ROW_X0 + ROW_X1) / 2, 0.004, (c.z0 + c.z1) / 2); m.renderOrder = 1; scene.add(m); return m;
  });

  // paper ground, beyond the slab
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({color: PAPER.clone(), toneMapped: false}));
  ground.position.y = -0.31; scene.add(ground);

  // the plan on the floor
  // the 4096² sheet only on large screens (it is also the canvas-area limit on iOS)
  const pack = packer(renderer);
  baker = newBaker(renderer); useBaker(baker);
  undo.push(() => pack.dispose(), () => disposeBaker(baker), () => scene.traverse(o => {o.geometry?.dispose(); for (const m of [].concat(o.material || [])) m.dispose();}));
  // (on phones the lettering is drawn larger, to be read at a phone's scale)
  // (drawn in short steps, drawing.js; each texture uploads in a task of its own)
  const plan = await drawPlanAsync(small || modest || innerWidth <= 1440 ? 2048 : 4096, {small}, tick);
  await tick();
  const planInk = pack(plan.ink, 2);
  await tick();
  const planTime = pack(plan.time, 1);
  await breathe('plan drawing');
  const planMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    uniforms: {uInkTex: {value: planInk}, uTimeTex: {value: planTime}, uDraw: {value: 0}, uAlpha: {value: 1}, uReal: U.uReal, uRealC: U.uRealC, uRealR: U.uRealR, uRealW: U.uRealW},
    vertexShader: 'varying vec2 vUv; varying vec3 vWPos; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vWPos = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: /* glsl */`
      uniform sampler2D uInkTex, uTimeTex; uniform float uDraw, uAlpha, uReal, uRealR, uRealW; uniform vec3 uRealC;
      varying vec2 vUv; varying vec3 vWPos;
      void main(){
        vec2 ink = texture2D(uInkTex, vUv).rg; float t = texture2D(uTimeTex, vUv).r;
        float vis = smoothstep(t, t + .025, uDraw);
        float real = max(uReal, 1. - smoothstep(uRealR, uRealR + uRealW, length(vWPos.xz - uRealC.xz)));
        float a = ink.g * vis * uAlpha * (1. - real);
        if (a < .003) discard;
        gl_FragColor = vec4(vec3(ink.r), a);
      }`,
  });
  const planMesh = new THREE.Mesh(new THREE.PlaneGeometry(SHEET.size, SHEET.size).rotateX(-Math.PI / 2), planMat);
  planMesh.position.set(SHEET.x0 + SHEET.size / 2, 0.004, SHEET.z0 + SHEET.size / 2);
  planMesh.renderOrder = 1; scene.add(planMesh);
  // the opening can draw now: the paper and the plan (layer 1) while everything else is built
  planMesh.layers.enable(1); ground.layers.enable(1); camera.layers.set(1);
  // (its shaders compiled in parallel first, so the first frame of the opening doesn't wait on them)
  await renderer.compileAsync(scene, camera);
  await breathe('opening shaders');
  onEarly?.(api);

  // the route, in the brand's accent: a dashed line along the walk aisle's floor (to one side of its lettering), drawn during the aerial shots and
  // ending at the rack that opens; it fades where the floor turns real
  const routeX0 = WALK_X0, routeX1 = PICK.x, routeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    uniforms: {uDraw: {value: 0}, uReal: U.uReal, uRealC: U.uRealC, uRealR: U.uRealR, uRealW: U.uRealW, uLen: {value: routeX1 - routeX0}},
    vertexShader: 'varying vec2 vUv; varying vec3 vWPos; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vWPos = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: /* glsl */`
      uniform float uDraw, uReal, uRealR, uRealW, uLen; uniform vec3 uRealC; varying vec2 vUv; varying vec3 vWPos;
      void main(){
        float dash = step(.45, fract(vUv.x * uLen / .32)), end = step(vUv.x, uDraw);
        float real = max(uReal, 1. - smoothstep(uRealR, uRealR + uRealW, length(vWPos.xz - uRealC.xz)));
        float a = dash * end * (1. - real) * .95;
        if (a < .01) discard;
        gl_FragColor = vec4(.871, .651, .733, a);
      }`,
  });
  const route = new THREE.Mesh(new THREE.PlaneGeometry(routeX1 - routeX0, 0.045).rotateX(-Math.PI / 2), routeMat);
  route.position.set((routeX0 + routeX1) / 2, 0.006, WALK_Z + 0.5); route.renderOrder = 2; scene.add(route);

  // the picked tray's outline, a grey hairline after the locate light has found it (just inside the rack's cable bundles)
  const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => new THREE.Vector3(x * 0.23, y * (U1 * 0.62), 0))), new THREE.LineBasicMaterial({color: '#9a9da3', transparent: true, toneMapped: false}));
  outline.position.set(PICK.x, slotY + U1 / 2, frontZ + 0.02); scene.add(outline);

  await breathe('route, outline');
  const hall = await buildHall(tick); scene.add(hall.group);
  // the ink layers drawn for the hall's instances (build.js), this scene's own
  const ink = INK.splice(0);
  const leds = buildLights(glow()); scene.add(leds);
  await breathe('hall');
  // (the tray's pictures at half size on a modest GPU, as on a phone)
  useSmallAtlas(modest);
  const tray = await buildTray(tick); scene.add(tray);
  await breathe('tray');
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.53, U1 * 0.94, 0.012), new THREE.MeshBasicMaterial({color: '#030304'}));
  slot.position.set(PICK.x, slotY + U1 / 2, frontZ + 0.006); scene.add(slot);

  // the die's drawing, laid over the two dies; it cross-fades into the hall's plan for the cut
  const die = await drawDieAsync(small || modest ? 1024 : 2048, {small}, tick);
  // labels the two sheets draw in the same place switch together at the cut (drawing.js)
  pairLabels(plan, die);
  await tick();
  const dieTex = [];
  for (const [c, n, pre] of [[die.ink, 2], [die.time, 1], [die.frame, 2], [die.labels, 2, true], [plan.labels, 2, true]]) {dieTex.push(pack(c, n, pre)); await tick();}
  await breathe('die drawing');
  const dieMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    uniforms: {uA: {value: dieTex[0]}, uTA: {value: dieTex[1]}, uF: {value: dieTex[2]}, uLA: {value: dieTex[3]}, uLB: {value: dieTex[4]}, uB: planMat.uniforms.uInkTex, uDraw: {value: 0}, uMix: {value: 0}, uAlpha: {value: 0}, uPaperA: {value: 0}, uClipU: {value: 2}, uWx: {value: 0}, uWy: {value: 0}, uPaper: {value: new THREE.Vector3(...PAPER.clone().convertLinearToSRGB().toArray())}, uAccent: {value: new THREE.Vector3(...new THREE.Color('#dea6bb').convertLinearToSRGB().toArray())}},
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: /* glsl */`
      uniform sampler2D uA, uTA, uF, uB, uLA, uLB; uniform float uDraw, uMix, uAlpha, uPaperA, uClipU, uWx, uWy; uniform vec3 uPaper, uAccent; varying vec2 vUv;
      void main(){
        vec2 a = texture2D(uA, vUv).rg, b = texture2D(uB, vUv).rg; float t = texture2D(uTA, vUv).r;
        // what both sheets draw identically (the plan's skeleton and the sheet's frame) stays put; everything else
        // changes behind a hard wipe that crosses the sheet from west to east, with a hairline in the accent at it
        vec2 f = texture2D(uF, vUv).rg; float drawn = smoothstep(t, t + .03, uDraw);
        float frame = f.g * drawn, restA = max(0., a.g * drawn - frame), restB = max(0., b.g - f.g);
        // a label (a word, a tag, a note, a title-block field) is on one side of the wipe as a whole: its side is
        // decided by its anchor, the label's centre across the sheet, so the wipe swaps words and never cuts one. The
        // anchor is red over alpha: along a box's blurred edge red alone would read as a smaller x, a wrong side
        vec2 la = texture2D(uLA, vUv).rg, lb = texture2D(uLB, vUv).rg;
        float wipe = mix(-.02, 1.02, uMix), we = fwidth(vUv.x);
        float sideA = la.g > .01 ? la.r / la.g : vUv.x, sideB = lb.g > .01 ? lb.r / lb.g : vUv.x;
        float outA = smoothstep(wipe - we, wipe + we, sideA), inB = 1. - smoothstep(wipe - we, wipe + we, sideB);
        // and a label that is showing keeps the other sheet's lines out from under it
        restB *= 1. - la.g * outA; restA *= 1. - lb.g * inB;
        float hair = (uMix > 0. && uMix < 1.) ? 1. - smoothstep(we * .5, we * 1.5, abs(vUv.x - wipe)) : 0.;
        vec3 c = mix(uPaper, vec3(f.r), frame);
        c = mix(c, vec3(a.r), restA * outA);
        c = mix(c, vec3(b.r), restB * inB);
        c = mix(c, uAccent, hair);
        float ink = min(1., frame + restA * outA + restB * inB + hair);
        // on a phone the sheet ends at the rule before the notes column, where the closing crop ends: past it, paper
        if (vUv.x > uClipU) {c = uPaper; ink = 0.;}
        // before the paper comes in, the lines draw light on the die itself; the paper fills in behind them. The edge
        // of the sheet is a pixel wide
        float d = max(abs(vUv.x - .5) - uWx, abs(vUv.y - .5) - uWy), e = fwidth(d);
        gl_FragColor = vec4(mix(uPaper, c, uPaperA), uAlpha * mix(ink, 1., uPaperA) * (1. - smoothstep(-e, e, d)));
      }`,
  });
  const dieSheet = new THREE.Mesh(new THREE.PlaneGeometry(DETAIL.sheet, DETAIL.sheet).rotateX(-Math.PI / 2), dieMat);
  dieSheet.position.set(DETAIL.sheetCenter.x, DETAIL.sheetCenter.y, DETAIL.sheetCenter.z);
  dieSheet.renderOrder = 4; scene.add(dieSheet);
  // then the paper keeps spreading, out from the sheet's edge over the package and the board, as one hard boundary
  const floodMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    uniforms: {uR: {value: 0}, uPaper: dieMat.uniforms.uPaper},
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform float uR; uniform vec3 uPaper; varying vec2 vP; void main(){ float d = max(abs(vP.x), abs(vP.y)) - uR, e = fwidth(d); gl_FragColor = vec4(uPaper, 1. - smoothstep(-e, e, d)); }',
  });
  const flood = new THREE.Mesh(new THREE.PlaneGeometry(3, 3).rotateX(-Math.PI / 2), floodMat);
  flood.position.set(DETAIL.sheetCenter.x, DETAIL.sheetCenter.y - 0.0002, DETAIL.sheetCenter.z);
  flood.renderOrder = 3; scene.add(flood);

  // Every shader is compiled and every texture uploaded now, at start-up, with everything visible and both shadow
  // passes drawn once: otherwise the tray, the die and their shadows would compile the first time they came into view,
  // a stall of more than a second in the middle of the film. (This frame is drawn over before the page paints.)
  {
    const hidden = [];
    scene.traverse(o => {if (!o.visible) {hidden.push(o); o.visible = true;}});
    // (everything above was built in pieces of a few milliseconds; what follows can't be split as finely, so it waits
    // for the draw-in to end or the first scroll)
    // (a cancelled build stops here too: tick frees what it made)
    if (settled) {await new Promise(r => {settled.then(r); signal?.addEventListener('abort', r, {once: true});}); mark = performance.now(); await tick();}
    // the room's reflections (the plan doesn't use them): baked, or filtered here if the baked file couldn't be read
    const env = await baked;
    await tick();
    if (env) scene.environment = env;
    else {
      const pmrem = new THREE.PMREMGenerator(renderer);
      // (at 128 px a side, a quarter of the default's work: the room is soft and blurred anyway)
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04, 0.1, 100, {size: 128}).texture;
      pmrem.dispose();
    }
    undo.push(() => scene.environment?.dispose());
    await breathe('environment');
    const warm = new THREE.PerspectiveCamera();
    placeCamera(warm, 0.7, 16 / 9);
    // (the tray as it sits when the tray light comes on, so its first shadow pass is this one, not one in the film)
    poseTray(tray, T.turn[0] + 0.02, 0);
    const trayLight = trayKey.intensity;
    trayKey.intensity = 1; key.shadow.needsUpdate = trayKey.shadow.needsUpdate = true;
    await breathe('materials');
    // every texture uploads in a step of its own
    const textures = new Set(scene.environment ? [scene.environment] : []);
    scene.traverse(o => {for (const m of [].concat(o.material || [])) for (const v of [...Object.values(m), ...Object.values(m.uniforms || {}).map(u => u?.value)]) if (v?.isTexture) textures.add(v);});
    for (const t of textures) {renderer.initTexture(t); await tick();}
    await breathe('textures');
    // (compiled in parallel where the browser can, and waited for without blocking)
    // (only the synchronous part of the compile counts as busy: the wait for the driver is the page's own time)
    // group by group, each with the scene's lights, so the synchronous part of each is short
    let sync = 0;
    const pending = [];
    // (the hall, the biggest group, piece by piece)
    for (const group of scene.children.filter(o => !o.isLight && o.type !== 'Object3D').flatMap(o => (o === hall.group ? o.children : [o]))) {
      const c0 = performance.now();
      pending.push(renderer.compileAsync(group, warm, scene));
      sync += performance.now() - c0;
      await tick();
    }
    // (each group's compile starts in a task of its own; the driver finishes them all in parallel)
    await Promise.all(pending);
    mark = performance.now() - sync;
    await breathe('shaders');
    // the first draw of each piece uploads its geometry and draws it into the shadow maps: piece by piece, about 10 ms
    // of them at a time, each batch followed at once by the opening's own frame (so the page shows only that) and a pause
    const roots = scene.children.filter(o => !o.isLight && o.type !== 'Object3D');
    const pieces = roots.flatMap(o => (o === hall.group ? o.children.map(k => [o, k]) : [[null, o]]));
    const only = ([root, piece]) => {for (const o of roots) o.visible = o === (root || piece); if (root) for (const k of root.children) k.visible = k === piece;};
    const all = () => {for (const o of roots) o.visible = true; for (const k of hall.group.children) k.visible = true;};
    let t0 = performance.now();
    for (const piece of pieces) {
      only(piece);
      key.shadow.needsUpdate = trayKey.shadow.needsUpdate = true;
      renderer.render(scene, warm);
      if (performance.now() - t0 > 10) {all(); if (width > 1) {lastP = -1; update(state.p ?? 0, performance.now() / 1000, state.intro ?? 1);} await tick(); t0 = performance.now();}
    }
    all();
    // and the whole scene once, with both shadow maps
    key.shadow.needsUpdate = trayKey.shadow.needsUpdate = true;
    renderer.render(scene, warm);
    await breathe('geometry');
    trayKey.intensity = trayLight;
    for (const o of hidden) o.visible = false;
    // (the opening's frame drawn over the warm-up at once, so the page never shows it); the film takes over from the
    // plan with the next frame, a task of its own
    lastP = -1;
    if (width > 1) update(state.p ?? 0, performance.now() / 1000, state.intro ?? 1);
    await tick();
    full = true; camera.layers.set(0); lastP = -1;
  }

  // a frame that would be identical to the last one is skipped: before power-on nothing moves on its own, and after it
  // a still frame only changes with the status lights, so it is drawn at their blink rate (15 a second)
  function update(p, time, intro = 1) {
    const size = width + 'x' + height + '@' + renderer.getPixelRatio(), moved = p !== lastP || size !== lastSize || intro < 1;
    if (!moved && (p < T.power[0] || time - lastDraw < 1 / 15)) return false;
    lastP = p; lastSize = size; lastDraw = time; state.p = p; state.intro = intro;
    U.uProgress.value = p; U.uTime.value = time;
    const cam = state.cam = placeCamera(camera, p, width / height);
    const after = p >= T.swap[1];
    // (until the rest is built, only the paper and the plan)
    if (!full) {
      planMat.uniforms.uDraw.value = Math.max(intro, seg(p, [0, 0.06])) * 1.03;
      U.uRealR.value = -REAL_W; U.uReal.value = 0;
      scene.background.copy(PAPER); ground.material.color.copy(PAPER);
      renderer.render(scene, camera);
      return true;
    }

    // the plan draws itself on arrival and stays on the floor until reality covers it
    planMat.uniforms.uDraw.value = after ? 1.03 : Math.max(intro, seg(p, [0, 0.06])) * 1.03;

    // reality: nothing until the descent, then a circle round the camera that grows with the walk, then all of it
    const walked = Math.max(0, camera.position.x - WALK_X0);
    U.uRealC.value.copy(camera.position);
    // (a portrait frame is too narrow to see the racks beside you: there the circle sits 2.6 m ahead, so the near racks in
    // view are the real ones)
    if (width / height < 0.9) {const k = 2.6 * smoother(seg(p, [T.descend[0], T.walk[0]])); U.uRealC.value.x -= Math.sin(cam.yaw) * k; U.uRealC.value.z -= Math.cos(cam.yaw) * k;}
    U.uRealW.value = REAL_W;
    // (2.4 m: the two racks either side of the aisle's start are already built when the walk begins)
    U.uRealR.value = p < T.descend[1] ? lerp(-REAL_W, 2.4, smoother(seg(p, [T.descend[0] + 0.05, T.descend[1]]))) : 2.4 + walked * 0.62 + smoother(seg(p, [T.power[0] + 0.02, T.power[1]])) * 90;
    // (on a phone the circle, set ahead of the camera, would be seen from above during the descent as a grey disc on
    // the floor: there it starts once the camera is at eye level, and grows over the walk's first 3%)
    if (width / height < 0.9 && !after) U.uRealR.value = lerp(-REAL_W, U.uRealR.value, smoother(seg(p, [T.descend[1], T.descend[1] + 0.03])));
    U.uReal.value = after ? 0 : smoother(seg(p, [T.power[0] + 0.02, T.power[1]]));
    const inked = U.uReal.value < 1;
    if (ink.length && ink[0].visible !== inked) for (const o of ink) o.visible = inked;
    if (after) U.uRealR.value = -REAL_W;

    // power: the hall darkens and the lights come on
    const power = smoother(seg(p, T.power)), paper = smoother(seg(p, T.paper));
    bg.copy(PAPER).lerp(DARK, power).lerp(PAPER, paper);
    if (after) bg.copy(PAPER);
    scene.background.copy(bg); ground.material.color.copy(bg);
    hemi.intensity = lerp(0.62, modest ? 0.4 : 0.18, power); key.intensity = lerp(2.7, 0.12, smoother(seg(p, [T.walk[0] - 0.02, T.power[1]])));
    for (const l of aisleLights) l.intensity = 14 * power * (1 - paper);
    // once powered, the far end of the hall falls away into the dark, and the light strips glow
    scene.fog.color.copy(bg); scene.fog.density = after ? 0 : 0.05 * power * (1 - paper);
    hall.lightMat.emissiveIntensity = 2.4 + 7 * power * (1 - paper);
    poolMat.uniforms.uA.value = 0.16 * power * (1 - paper);
    for (const m of pools) m.visible = power > 0 && !after && paper < 1;
    // (in the powered hall the room light drops, so the aisle lights do the lighting; it comes back for the tray)
    scene.environmentIntensity = lerp(0.55, 0.24, power) + 0.18 * smoother(seg(p, [T.turn[0], T.slide[1]]));
    trayKey.intensity = 2.6 * smoother(seg(p, [T.turn[0], T.slide[1]]));
    // the sun's map while the model is building (and once, if the film opens later); the tray light's while the tray
    // moves (and once)
    const building = p <= T.connect[1] + 0.005, trayMoving = p > T.slide[0] - 0.005 && p < T.dive[1] + 0.01;
    key.shadow.needsUpdate = key.castShadow && power < 1 && ((building && moved) || !sunDrawn);
    // (the warm-up drew the tray light's map with the tray in its slot, as it is until the slide)
    if (!trayDrawn && p < T.slide[0] - 0.005) trayDrawn = true;
    trayKey.shadow.needsUpdate = trayKey.intensity > 0 && p < T.paper[1] && ((trayMoving && moved) || !trayDrawn);
    if (key.shadow.needsUpdate) sunDrawn = true;
    if (trayKey.shadow.needsUpdate) trayDrawn = true;
    const focus = smoother(seg(p, [T.turn[0], T.turn[0] + 0.02])) * (1 - smoother(seg(p, T.slide)));
    // (the blue light finds the tray; the outline only follows, once the light has blinked for a while)
    const traced = smoother(seg(p, [T.turn[0] + 0.025, T.turn[0] + 0.045])) * (1 - smoother(seg(p, T.slide)));
    outline.material.opacity = traced * 0.5; outline.visible = traced > 0.01 && width / height >= 0.9;
    for (const m of leds.userData.materials) {m.uniforms.uFocus.value = focus; m.uniforms.uProgress.value = p; m.uniforms.uTime.value = time; m.uniforms.uAlpha.value = (m.blending === THREE.AdditiveBlending ? 0.22 : 1) * (1 - paper);}

    // the tray and the die
    poseTray(tray, p, time);
    // the locate light's glow is never less than about 36 px across, so it reads as a light on a phone too
    {
      const glowS = tray.userData.locate.children[1], at = glowS.getWorldPosition(v3), dist = at.distanceTo(camera.position);
      const perPx = 2 * dist * Math.tan(camera.fov * Math.PI / 360) / height;
      glowS.scale.setScalar(Math.max(0.08, 36 * perPx));
    }
    slot.visible = p > T.slide[0] && !after;
    dieMat.uniforms.uAlpha.value = p > T.drawDie[0] ? 1 : 0;
    // the die's outline on the sheet is the building's, 22 × 27.5 of 42 sheet units: the lines draw inside it, the
    // paper fills in behind them, then the paper widens out to the sheet's edge and on over everything round it
    const widen = smoother(seg(p, [T.paper[0], T.paper[0] + 0.012])), spread = seg(p, [T.paper[0] + 0.012, T.paper[1]]);
    dieMat.uniforms.uPaperA.value = smoother(seg(p, T.sheet));
    dieMat.uniforms.uWx.value = lerp(0.262, 0.505, widen);
    dieMat.uniforms.uWy.value = lerp(0.327, 0.505, widen);
    // (all but the view's title by the end of drawDie; the title once the camera has stopped, before it pulls back)
    dieMat.uniforms.uDraw.value = seg(p, T.drawDie) * 0.97 + seg(p, [T.back[1] - 0.012, T.back[1] - 0.002]) * 0.06;
    dieMat.uniforms.uMix.value = smoother(seg(p, T.swap));
    dieMat.uniforms.uClipU.value = width / height < 0.9 ? 0.5 + 12.9 / 42 : 2;
    dieSheet.visible = dieMat.uniforms.uAlpha.value > 0 && !after;
    // the spread grows by a constant ratio (like a zoom), from the sheet's half-width to the whole 3 m plane
    floodMat.uniforms.uR.value = DETAIL.sheet / 2 * Math.pow(1.5 / (DETAIL.sheet / 2), spread * spread);
    flood.visible = spread > 0 && !after;
    // once the paper has covered everything round the die, the hall isn't drawn behind it
    hall.group.visible = leds.visible = !after && spread < 1;
    routeMat.uniforms.uDraw.value = smoother(seg(p, [T.connect[1] - 0.03, T.descend[0] + 0.05]));
    route.visible = p > T.connect[1] - 0.03 && p < T.walk[1];
    const query = timer && queries.length < 4 ? gl.createQuery() : null;
    if (query) query.p = p;
    if (query) gl.beginQuery(timer.TIME_ELAPSED_EXT, query);
    renderer.render(scene, camera);
    if (query) {gl.endQuery(timer.TIME_ELAPSED_EXT); queries.push(query);}
    while (queries.length && gl.getQueryParameter(queries[0], gl.QUERY_RESULT_AVAILABLE)) {
      const done = queries.shift();
      if (!gl.getParameter(timer.GPU_DISJOINT_EXT) && gpuMs.length < 600) gpuMs.push([done.p, gl.getQueryParameter(done, gl.QUERY_RESULT) / 1e6]);
      gl.deleteQuery(done);
    }
    return true;
  }
  function resize(w, h) {width = w; height = h; renderer.setSize(w, h, false);}
  function setDpr(v) {renderer.setPixelRatio(v); renderer.setSize(width, height, false);}
  scene.traverse(o => {instances += o.isInstancedMesh ? o.count : o.geometry?.isInstancedBufferGeometry && o.isMesh ? o.geometry.instanceCount : 0;});
  function info() {const r = renderer.info.render; return {calls: r.calls, triangles: r.triangles, dpr: renderer.getPixelRatio(), maxDpr, instances, longest, steps, tier: modest ? 'modest' : 'full'};}
  function dispose() {
    if (disposed) return; disposed = true;
    scene.traverse(o => {
      o.geometry?.dispose();
      for (const m of [].concat(o.material || [])) {for (const v of Object.values(m.uniforms || {})) v.value?.isTexture && v.value.dispose(); m.map?.dispose(); m.dispose();}
    });
    scene.environment?.dispose(); pack.dispose(); disposeBaker(baker);
    renderer.dispose(); renderer.forceContextLoss();
  }
  return api;
  // the GPU times measured since the last call, as [progress, ms] (null where the browser has no timer queries)
  function gpuTimes() {return timer ? gpuMs.splice(0) : null;}
  function ready() {return full;}
}
