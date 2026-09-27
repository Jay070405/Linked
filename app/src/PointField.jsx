import {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {gridLayout, samplePetal, sectionProgress} from './point-field-layout';
import {random} from './world-points';
import './point-field.css';

const INK = new THREE.Vector3(17 / 255, 17 / 255, 20 / 255);      // v16.css --ink
const PETAL = new THREE.Vector3(222 / 255, 166 / 255, 187 / 255); // v16.css --petal
const PITCH = 28;                                                  // css px between grid dots
const REACH = 130;                                                 // css px around the cursor

const vertexShader = /* glsl */ `
  uniform vec2 uResolution;        // css px
  uniform vec2 uPointer;           // css px
  uniform vec4 uShape;             // centre x, centre y, height (css px), angle
  uniform float uPixelRatio, uMorph, uTime, uPush, uReach;
  attribute vec2 aGrid;            // a grid node (css px)
  attribute vec3 aPetal;           // petal-space x, y and 1 for an edge point; z < 0 marks a grid dot
  attribute vec4 aSeed;            // random, delay, size, phase
  varying float vAlpha;
  varying float vGlow;
  varying float vTint;

  vec2 turn(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

  void main() {
    bool grid = aPetal.z < 0.0;
    // A petal point leaves its grid node on a curve and settles into the petal, where it
    // keeps a slow shimmer. Grid dots stay put and recede a little as the petal forms.
    float t = grid ? 0.0 : clamp((uMorph - aSeed.y) / (1.0 - aSeed.y), 0.0, 1.0);
    float e = t * t * (3.0 - 2.0 * t);
    vec2 petal = uShape.xy + turn(aPetal.xy * vec2(1.0, -1.0) * uShape.z, uShape.w);
    petal += vec2(sin(uTime * 0.7 + aSeed.w * 6.283), cos(uTime * 0.6 + aSeed.x * 6.283)) * 1.4 * e;
    vec2 path = petal - aGrid;
    vec2 p = mix(aGrid, petal, e) + vec2(-path.y, path.x) * 0.22 * sin(3.1416 * e);

    // The cursor warms the field. Grid dots swell and darken where they stand, like a lens
    // passing over the rules; petal points are pushed aside.
    vec2 away = p - uPointer;
    float reach = length(away);
    float field = uPush * pow(max(0.0, 1.0 - reach / uReach), 2.0);
    vec2 out_ = reach > 0.001 ? away / reach : vec2(0.0);
    p += (out_ + vec2(-out_.y, out_.x) * 0.35) * field * uReach * (grid ? 0.1 : 0.28);
    vGlow = field;

    vec2 clip = p / uResolution * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
    float size = grid ? 1.8 : mix(1.8, 2.2 + aPetal.z * 0.5, e);
    gl_PointSize = size * aSeed.z * uPixelRatio * (1.0 + field * (grid ? 3.2 : 1.6));
    float alpha = grid ? mix(0.17, 0.1, uMorph) : mix(0.0, aPetal.z > 0.5 ? 0.9 : 0.5, smoothstep(0.0, 0.25, t));
    vAlpha = min(1.0, alpha * (1.0 + field * 5.0));
    vTint = grid ? 0.0 : (aPetal.z > 0.5 ? 0.1 : 0.55) * e;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uInk, uPetal;
  varying float vAlpha;
  varying float vGlow;
  varying float vTint;
  void main() {
    float a = smoothstep(0.5, 0.3, length(gl_PointCoord - 0.5)) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(mix(uInk, uPetal, min(1.0, vTint + vGlow * 1.5)), a);
  }
`;

function buildGeometry(width, height, originY, form, petalCount, seed) {
  const {count: dots, positions} = gridLayout(width, height, PITCH, originY);
  const count = dots + petalCount, next = random(seed);
  const grid = new Float32Array(count * 2), petal = new Float32Array(count * 3), seeds = new Float32Array(count * 4);
  grid.set(positions);
  const shape = samplePetal(petalCount, seed);
  const x0 = positions[0], y0 = positions[1], columns = Math.round((width - 2 * x0) / PITCH) + 1, rows = Math.max(1, dots / columns);
  for (let i = 0; i < count; i++) {
    if (i < dots) { petal.set([0, 0, -1], i * 3); seeds.set([next(), 0, 0.85 + next() * 0.3, next()], i * 4); continue; }
    const [px, py, line] = shape.subarray((i - dots) * 3, (i - dots) * 3 + 3);
    // Born on a grid node near where it lands: the lattice nearby condenses into the petal.
    const turn = form.angle, size = form.height * height;
    const tx = form.x * width + (Math.cos(turn) * px + Math.sin(turn) * py) * size, ty = form.y * height + (Math.sin(turn) * px - Math.cos(turn) * py) * size;
    const reach = 50 + next() * 190, heading = next() * Math.PI * 2;
    const column = Math.max(0, Math.min(columns - 1, Math.round((tx + Math.cos(heading) * reach - x0) / PITCH)));
    const row = Math.max(0, Math.min(rows - 1, Math.round((ty + Math.sin(heading) * reach - y0) / PITCH)));
    grid.set([x0 + column * PITCH, y0 + row * PITCH], i * 2);
    petal.set([px, py, line], i * 3);
    // The petal grows from its base to its tip.
    seeds.set([next(), 0.04 + 0.34 * (py + 0.5) + next() * 0.12, 0.8 + next() * 0.45, next()], i * 4);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('aGrid', new THREE.BufferAttribute(grid, 2));
  geometry.setAttribute('aPetal', new THREE.BufferAttribute(petal, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  return geometry;
}

/**
 * A field of points on paper. Alone it is a quiet dot grid (the rules) that parts and
 * warms under the cursor. Given a `shape`, points leave the grid and gather into the
 * site's petal as the section scrolls through: imagination, made of the rules.
 * shape: {x, y, height, angle, from, to}; x, y and height are fractions of the field,
 * from/to the section progress over which the petal forms. `mobile` overrides it at ≤ 700px.
 */
export default function PointField({className = '', shape = null, mobile = null, reducedMotion = false}) {
  const mountRef = useRef(null);
  const inputs = useRef({shape, mobile, reducedMotion});
  inputs.current = {shape, mobile, reducedMotion};

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({alpha: true, antialias: false, powerPreference: 'high-performance'});
    } catch {
      mount.dataset.renderState = 'webgl-unavailable';
      return undefined;
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    Object.assign(renderer.domElement.style, {display: 'block', width: '100%', height: '100%'});
    mount.append(renderer.domElement);

    const scene = new THREE.Scene(), camera = new THREE.Camera();
    const uniforms = {
      uResolution: {value: new THREE.Vector2(1, 1)}, uPointer: {value: new THREE.Vector2(-1e4, -1e4)},
      uShape: {value: new THREE.Vector4()}, uPixelRatio: {value: pixelRatio},
      uMorph: {value: 0}, uTime: {value: 0}, uPush: {value: 0}, uReach: {value: REACH},
      uInk: {value: INK}, uPetal: {value: PETAL},
    };
    const material = new THREE.ShaderMaterial({uniforms, vertexShader, fragmentShader, transparent: true, depthTest: false, depthWrite: false});
    const points = new THREE.Points(new THREE.BufferGeometry(), material);
    points.frustumCulled = false;
    scene.add(points);

    let width = 1, height = 1, small = false, frame = 0, disposed = false, visible = false, last = performance.now();
    const pointer = {x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, clientX: 0, clientY: 0, moved: false, inside: false, energy: 0, strength: 0};
    const fine = matchMedia('(pointer: fine)').matches;
    const current = () => (small && inputs.current.mobile) || inputs.current.shape;

    function draw(now = performance.now()) {
      const dt = Math.min((now - last) / 1000, 0.05) || 0.016;
      last = now;
      const {reducedMotion: still} = inputs.current, form = current();
      const box = mount.getBoundingClientRect();
      if (form) {
        const progress = sectionProgress(box.top, box.height, innerHeight);
        const t = Math.max(0, Math.min(1, (progress - form.from) / (form.to - form.from)));
        uniforms.uMorph.value = still ? 1 : t;
        uniforms.uShape.value.set(form.x * width, form.y * height, form.height * height, form.angle);
      }
      if (pointer.moved) {
        pointer.tx = pointer.clientX - box.left; pointer.ty = pointer.clientY - box.top;
        pointer.inside = pointer.tx >= 0 && pointer.ty >= 0 && pointer.tx <= box.width && pointer.ty <= box.height;
        if (pointer.x < -1e3) { pointer.x = pointer.tx; pointer.y = pointer.ty; }
        pointer.moved = false;
      }
      const follow = 1 - Math.exp(-dt / 0.09);
      pointer.x += (pointer.tx - pointer.x) * follow; pointer.y += (pointer.ty - pointer.y) * follow;
      pointer.energy *= Math.exp(-dt / 0.5);
      const want = fine && pointer.inside && !still ? 0.55 + 0.45 * pointer.energy : 0;
      pointer.strength += (want - pointer.strength) * (1 - Math.exp(-dt / 0.2));
      uniforms.uPointer.value.set(pointer.x, pointer.y);
      uniforms.uPush.value = pointer.strength;
      if (!still) uniforms.uTime.value += dt;
      renderer.render(scene, camera);
    }

    function loop(now) {
      if (disposed) return;
      frame = 0;
      if (!visible || inputs.current.reducedMotion || document.hidden || document.body.classList.contains('portfolio-route-open')) return;
      draw(now);
      frame = requestAnimationFrame(loop);
    }
    const wake = () => { if (!frame && !disposed) { last = performance.now(); frame = requestAnimationFrame(loop); } };

    function resize() {
      const box = mount.getBoundingClientRect();
      width = Math.max(1, box.width); height = Math.max(1, box.height);
      small = innerWidth <= 700;
      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(width, height);
      points.geometry.dispose();
      const form = current();
      const petals = form ? (small ? 900 : 2000) : 0;
      points.geometry = buildGeometry(width, height, box.top + scrollY, form, petals, 7);
      draw();
      wake();
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    const visibility = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) wake();
    }, {rootMargin: '100px'});
    visibility.observe(mount);

    const onPointer = event => {
      pointer.clientX = event.clientX; pointer.clientY = event.clientY; pointer.moved = true;
      pointer.energy = Math.min(1, pointer.energy + Math.hypot(event.movementX || 0, event.movementY || 0) / 90);
    };
    if (fine) window.addEventListener('pointermove', onPointer, {passive: true});
    // Coming back from a portfolio page or a hidden tab restarts the loop.
    const onVisibility = () => wake();
    document.addEventListener('visibilitychange', onVisibility);
    const routeWatch = new MutationObserver(onVisibility);
    routeWatch.observe(document.body, {attributes: true, attributeFilter: ['class']});
    mount.dataset.renderState = 'ready';

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      routeWatch.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      points.geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className={'point-field ' + className} aria-hidden="true"/>;
}
