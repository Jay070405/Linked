// How pieces are built and how they turn real.
// Every piece is an instance of a unit shape with a build window (start, duration) and a growth axis. The vertex
// shader grows it from its base (or along its length) as the scroll passes the window, so the model can be built
// and un-built by scrolling. The fragment shader mixes each surface between the plaster white of the drawing and
// its real material, by distance from the camera ("reality" grows as you walk) or globally.
import * as THREE from 'three';

export const U = {
  uProgress: {value: 0},
  uClay: {value: new THREE.Color('#f3f1ec')},
  uReal: {value: 0},
  uRealC: {value: new THREE.Vector3()},
  uRealR: {value: 0},
  uRealW: {value: 3},
  uInk: {value: new THREE.Color('#111114')},
  uLine: {value: 1},
  uPower: {value: 0},
  uTime: {value: 0},
};

// axis codes: 0 rise (y), 1 grow east from the west end, 2 grow west from the east end, 3 grow south, 4 grow north, 5 pop
const GROW = /* glsl */`
attribute vec3 aBuild;
varying float vGrow;
varying vec3 vWPos;
#ifdef ANCHORED
attribute vec2 aAnchor; varying vec2 vAnchor;
#endif
uniform float uProgress;
float buildAmount(){
  float g = clamp((uProgress - aBuild.x) / max(aBuild.y, 1e-4), 0., 1.);
  return g * g * g * (g * (g * 6. - 15.) + 10.);
}
vec3 grow(vec3 p, float g){
  // not started yet: collapse to a point, so nothing (not even a flat top face) is drawn
  if (g <= 0.) return vec3(0.);
  float ax = aBuild.z;
  if (ax < .5) p.y *= g;
  else if (ax < 1.5) p.x = (p.x + .5) * g - .5;
  else if (ax < 2.5) p.x = (p.x - .5) * g + .5;
  else if (ax < 3.5) p.z = (p.z + .5) * g - .5;
  else if (ax < 4.5) p.z = (p.z - .5) * g + .5;
  else p = (p - vec3(0., .5, 0.)) * g + vec3(0., .5, 0.);
  return p;
}`;
const REAL = /* glsl */`
uniform vec3 uClay; uniform float uReal; uniform vec3 uRealC; uniform float uRealR; uniform float uRealW;
varying vec3 vWPos; varying float vGrow;
#ifdef ANCHORED
varying vec2 vAnchor;
#endif
#ifdef ANCHORED
// judged from the piece's anchor (its rack's centre), so a rack and all of it turn real together: as the circle
// reaches the rack, the real material rises up its face from the floor (wipeT, the height reached, 0–1 of 2.3 m),
// behind an ink line
float wipeT(){ return 1. - smoothstep(uRealR, uRealR + uRealW, length(vAnchor - uRealC.xz)); }
float realness(){
  float t = wipeT(), h = clamp(vWPos.y / 2.3, 0., 1.), e = .5 * fwidth(h) + 1e-5;
  return max(uReal, t <= 0. ? 0. : t >= 1. ? 1. : 1. - smoothstep(t - e, t + e, h));
}
#else
float realness(){
  float d = length(vWPos.xz - uRealC.xz);
  return max(uReal, 1. - smoothstep(uRealR, uRealR + uRealW, d));
}
#endif`;

// patch a standard material so it grows and turns real
// `ink` is an optional line drawing (white paper, black lines) shown on the plaster before the surface turns real;
// `anchored` judges realness from each instance's anchor (aAnchor) instead of each pixel
// `realOnly` hides a piece until it is real (thin parts that would only flicker as white lines in the plaster model)
export function buildable(material, {floorShade = true, ink = null, keepColor = false, anchored = false, realOnly = false} = {}) {
  if (anchored) material.defines = {...material.defines, ANCHORED: ''};
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, {uProgress: U.uProgress, uClay: U.uClay, uReal: U.uReal, uRealC: U.uRealC, uRealR: U.uRealR, uRealW: U.uRealW});
    if (ink) shader.uniforms.uInkMap = {value: ink};
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + GROW)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGrow = buildAmount();\ntransformed = grow(transformed, vGrow);')
      .replace('#include <project_vertex>', `#include <project_vertex>
      vec4 wp = vec4(transformed, 1.);
      #ifdef USE_INSTANCING
      wp = instanceMatrix * wp;
      #endif
      vWPos = (modelMatrix * wp).xyz;
      #ifdef ANCHORED
      vAnchor = aAnchor;
      #endif`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + REAL + (ink ? '\nuniform sampler2D uInkMap;' : ''))
      .replace('#include <color_fragment>', `#include <color_fragment>
      float realM = realness();
      ${realOnly ? 'if (realM < .5) discard;' : ''}
      // an ink line about 2 cm wide where the blend between drawing and material is half way (for a whole rack, the
      // seam to its neighbour is the edge)
      #ifdef ANCHORED
      // (a line about a pixel and a half wide wherever it is seen from)
      float wt = wipeT(), wh = clamp(vWPos.y / 2.3, 0., 1.), wf = fwidth(wh) + 1e-5;
      float edge = wt > 0. && wt < 1. ? (1. - smoothstep(.75 * wf, 1.75 * wf, abs(wh - wt))) * (1. - uReal) : 0.;
      #else
      float edge = (1. - smoothstep(.006, .02, abs(length(vWPos.xz - uRealC.xz) - uRealR - .5 * uRealW))) * (1. - uReal);
      #endif
      vec3 clayC = uClay${ink ? ' * mix(.28, 1., texture2D(uInkMap, vMapUv).r)' : ''};
      ${keepColor ? '' : 'diffuseColor.rgb = mix(clayC, diffuseColor.rgb, realM) * (1. - .85 * edge);'}
      ${floorShade ? 'diffuseColor.rgb *= mix(.78, 1., smoothstep(0., .9, vWPos.y));' : ''}`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(.94, roughnessFactor, realM);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(0., metalnessFactor, realM);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= realM;');
  };
  material.customProgramCacheKey = () => 'dh-build' + (floorShade ? 1 : 0) + (ink ? 'i' : '') + (keepColor ? 'k' : '') + (anchored ? 'a' : '') + (realOnly ? 'r' : '');
  return material;
}

// edges of the same instances, drawn as ink lines that fade as the surface turns real (`weight` < 1 for thin members,
// whose edges fall on top of each other from a distance)
const lineMaterial = (anchored = false, weight = 1) => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, defines: anchored ? {ANCHORED: ''} : {},
  uniforms: {uProgress: U.uProgress, uInk: U.uInk, uLine: U.uLine, uReal: U.uReal, uRealC: U.uRealC, uRealR: U.uRealR, uRealW: U.uRealW, uClay: U.uClay, uWeight: {value: weight}},
  vertexShader: /* glsl */`
    ${GROW}
    attribute vec3 iPos; attribute vec3 iSize; attribute float iRot;
    void main(){
      vGrow = buildAmount();
      vec3 p = grow(position, vGrow) * iSize;
      float c = cos(iRot), s = sin(iRot);
      p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z) + iPos;
      vWPos = p;
      #ifdef ANCHORED
      vAnchor = aAnchor;
      #endif
      vec4 mv = viewMatrix * vec4(p, 1.);
      gl_Position = projectionMatrix * mv;
      gl_Position.z -= 2e-4 * gl_Position.w;
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uInk; uniform float uLine, uWeight;
    ${REAL}
    void main(){
      if (vGrow <= 0.001) discard;
      float a = uLine * uWeight * (1. - realness()) * .82;
      if (a < .01) discard;
      gl_FragColor = vec4(uInk, a);
    }`,
});

// a silhouette for thin pieces in the plaster model: the piece's back faces pushed out along their normals by a few
// millimetres and drawn in ink, so only a rim shows round the piece; it fades as the piece turns real
let outlineMat = null;
const silhouette = () => outlineMat || (outlineMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.BackSide,
  uniforms: {uProgress: U.uProgress, uInk: U.uInk, uReal: U.uReal, uRealC: U.uRealC, uRealR: U.uRealR, uRealW: U.uRealW, uClay: U.uClay, uWidth: {value: 0.012}},
  vertexShader: /* glsl */`
    ${GROW}
    uniform float uWidth;
    void main(){
      vGrow = buildAmount();
      vec4 wp = modelMatrix * instanceMatrix * vec4(grow(position, vGrow), 1.);
      vec3 n = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
      // never thinner than about a pixel and a half, so a far pipe's rim doesn't break into dots
      wp.xyz += n * max(uWidth, distance(wp.xyz, cameraPosition) * .0012);
      vWPos = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uInk;
    ${REAL}
    void main(){
      float a = (1. - realness()) * .78 * smoothstep(.15, .4, vGrow);
      if (a < .01) discard;
      gl_FragColor = vec4(uInk, a);
    }`,
}));

// every ink layer drawn for instances (edges and rims): once the whole hall is real they draw nothing, so the scene
// stops drawing them
export const INK = [];

// items: {x, y, z, w, h, d, rot, start, dur, axis, color, ax, az}; the shape's base sits at y = 0 and spans −0.5…0.5 in x
// and z; (ax, az) is the anchor an anchored material judges realness from (the item's own x, z if not given)
export function instances(shape, material, items, {edges = true, edgeShape = shape, edgeWeight = 1, shadow = false, outline = false} = {}) {
  const n = items.length;
  const mesh = new THREE.InstancedMesh(shape, material, n);
  const build = new Float32Array(n * 3), anchor = new Float32Array(n * 2), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
  items.forEach((it, i) => {
    q.setFromEuler(e.set(0, it.rot || 0, 0));
    m.compose(new THREE.Vector3(it.x, it.y || 0, it.z), q, new THREE.Vector3(it.w, it.h, it.d));
    mesh.setMatrixAt(i, m);
    build.set([it.start, it.dur, it.axis || 0], i * 3);
    anchor.set([it.ax ?? it.x, it.az ?? it.z], i * 2);
    if (it.color) mesh.setColorAt(i, col.set(it.color));
  });
  shape.setAttribute('aBuild', new THREE.InstancedBufferAttribute(build, 3));
  shape.setAttribute('aAnchor', new THREE.InstancedBufferAttribute(anchor, 2));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.frustumCulled = false;
  mesh.castShadow = shadow; mesh.receiveShadow = !material.transparent;
  if (shadow) mesh.customDepthMaterial = growingDepth();
  const group = new THREE.Group(); group.add(mesh);
  if (outline) {
    const rim = new THREE.InstancedMesh(shape, silhouette(), n);
    rim.instanceMatrix = mesh.instanceMatrix; rim.frustumCulled = false; rim.renderOrder = 1;
    group.add(rim); INK.push(rim);
  }
  if (edges) {
    const base = new THREE.EdgesGeometry(edgeShape, 30), g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', base.getAttribute('position'));
    const pos = new Float32Array(n * 3), size = new Float32Array(n * 3), rot = new Float32Array(n);
    items.forEach((it, i) => {pos.set([it.x, it.y || 0, it.z], i * 3); size.set([it.w, it.h, it.d], i * 3); rot[i] = it.rot || 0;});
    g.setAttribute('iPos', new THREE.InstancedBufferAttribute(pos, 3));
    g.setAttribute('iSize', new THREE.InstancedBufferAttribute(size, 3));
    g.setAttribute('iRot', new THREE.InstancedBufferAttribute(rot, 1));
    g.setAttribute('aBuild', new THREE.InstancedBufferAttribute(build, 3));
    g.setAttribute('aAnchor', new THREE.InstancedBufferAttribute(anchor, 2));
    g.instanceCount = n;
    const lines = new THREE.LineSegments(g, lineMaterial(material.defines?.ANCHORED !== undefined, edgeWeight));
    lines.frustumCulled = false; lines.renderOrder = 2;
    group.add(lines); INK.push(lines);
  }
  group.userData.mesh = mesh;
  return group;
}

// the shadow pass's depth material, with the same growth as the surfaces
let depthMat = null;
function growingDepth() {
  if (depthMat) return depthMat;
  depthMat = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking});
  depthMat.onBeforeCompile = shader => {
    shader.uniforms.uProgress = U.uProgress;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + GROW)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGrow = buildAmount();\ntransformed = grow(transformed, vGrow);');
  };
  depthMat.customProgramCacheKey = () => 'dh-depth';
  return depthMat;
}

// unit shapes with their base at y = 0
export const SHAPES = {
  box: () => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
  // a run along x, centred on its axis (used for pipes and busways that hang overhead)
  runX: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 14, 1).rotateZ(Math.PI / 2).translate(0, 0.5, 0),
  runZ: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 14, 1).rotateX(Math.PI / 2).translate(0, 0.5, 0),
  post: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 12, 1).translate(0, 0.5, 0),
};
