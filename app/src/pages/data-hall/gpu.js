// Normal maps baked on the GPU: a height picture uploads once and one draw writes its normal map, instead of a
// per-pixel loop on the main thread. Each scene makes its own baker (its renderer, its maps) and makes it the current
// one whenever its build runs, so two builds that overlap (a page left and entered again while loading) never share
// or free each other's maps (the drawn pictures themselves are kept).
import * as THREE from 'three';

const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
let current = null;

export const newBaker = renderer => ({renderer, cache: new WeakMap(), targets: [], scene: new THREE.Scene(), quad: null});
export function useBaker(b) {current = b;}
export function disposeBaker(b) {
  for (const t of b.targets) t.dispose();
  b.targets.length = 0; b.cache = new WeakMap();
  if (b.quad) {b.scene.remove(b.quad); b.quad.geometry.dispose(); b.quad.material.dispose(); b.quad = null;}
  if (current === b) current = null;
}

// height from the red channel (a grey height map) or from luminance (a picture: brighter reads as higher)
export function bakeNormal(src, strength, {wrap = false, luminance = false} = {}) {
  const {renderer, cache, targets, scene} = current;
  const hit = cache.get(src);
  if (hit && hit.strength === strength) return hit.texture;
  if (!current.quad) {
    current.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: {uSrc: {value: null}, uTexel: {value: new THREE.Vector2()}, uStrength: {value: 1}, uLum: {value: 0}}, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: /* glsl */`
        uniform sampler2D uSrc; uniform vec2 uTexel; uniform float uStrength, uLum; varying vec2 vUv;
        float H(vec2 o) { vec3 c = texture2D(uSrc, vUv + o * uTexel).rgb; return mix(c.r, dot(c, vec3(.3, .59, .11)), uLum); }
        void main() {
          // the picture's rows run down and texture v runs up, so green takes the downward slope
          float dx = (H(vec2(1., 0.)) - H(vec2(-1., 0.))) * uStrength, dy = (H(vec2(0., -1.)) - H(vec2(0., 1.))) * uStrength;
          gl_FragColor = vec4(normalize(vec3(-dx, dy, 1.)) * .5 + .5, 1.);
        }`,
    }));
    scene.add(current.quad);
  }
  const quad = current.quad;
  const edge = wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  const tex = new THREE.CanvasTexture(src);
  Object.assign(tex, {colorSpace: THREE.NoColorSpace, generateMipmaps: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, wrapS: edge, wrapT: edge});
  const rt = new THREE.WebGLRenderTarget(src.width, src.height, {depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, colorSpace: THREE.NoColorSpace, wrapS: edge, wrapT: edge});
  rt.texture.anisotropy = 8;
  const u = quad.material.uniforms;
  u.uSrc.value = tex; u.uTexel.value.set(1 / src.width, 1 / src.height); u.uStrength.value = strength; u.uLum.value = luminance ? 1 : 0;
  const before = renderer.getRenderTarget();
  renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(before);
  tex.dispose(); targets.push(rt);
  cache.set(src, {strength, texture: rt.texture});
  return rt.texture;
}
