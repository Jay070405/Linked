import {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {CUT, channels} from './finale-cut';
import {createWorld} from './world-points';

const INK = new THREE.Vector3(9 / 255, 9 / 255, 11 / 255);
const LIT = new THREE.Vector3(245 / 255, 245 / 255, 247 / 255);
const PETAL = new THREE.Vector3(222 / 255, 166 / 255, 187 / 255);   // v16.css --petal
const REACH = 150;                                                    // css px around the cursor
const FOV = 38;
// Units: the globe has radius 1. The horizon pose sits close and looks up past
// the globe, so its limb spans the frame low down, like a planet rising.
const HORIZON = {position: new THREE.Vector3(0, 0, 1.85), target: new THREE.Vector3(0, 1.45, 0)};
const TILT = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationZ(0.36).multiply(new THREE.Matrix4().makeRotationX(0.42)));
// Reduced motion: one quiet frame of the finished world.
const STILL = {...channels(0.4), dist: 1, flight: 0, kick: 0, dim: 0, night: 1, spread: 1, twist: 0, p: 0.4};

const pointsVertex = /* glsl */ `
  uniform float uTime, uSpread, uTwist, uSpin, uSize, uRef, uPixelRatio, uDim, uFocus;
  uniform vec3 uCircle;
  uniform vec2 uResolution;
  uniform mat3 uTilt;
  uniform vec2 uPointer;           // device px, GL orientation
  uniform float uPush, uReach;
  attribute vec3 aThought;
  attribute vec3 aWorld;
  attribute vec4 aSeed;          // random, role (0 land, 1 sea, 2 ring, 3 dust), size, delay
  varying float vAlpha;
  varying float vLit;
  varying float vSoft;
  varying float vGlow;

  vec2 turn(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
  float backOut(float t) { t -= 1.0; return 1.0 + 2.25 * t * t * t + 1.25 * t * t; }

  void main() {
    float role = aSeed.y;
    bool globe = role < 1.5, ring = role > 1.5 && role < 2.5, dust = role > 2.5;

    // The thought: a turning pearl, its loose cloud orbiting at its own speeds.
    vec3 thought = aThought;
    thought.xz = turn(thought.xz, uTime * (dust ? 0.35 + aSeed.x * 0.55 : 0.9));
    thought *= 1.0 + 0.06 * sin(uTime * 1.6 + (dust ? aSeed.x * 6.283 : 0.0));

    // The world: a tilted, turning globe with an equatorial ring; dust drifts.
    vec3 home = aWorld;
    if (globe) { home.xz = turn(home.xz, uSpin); home = uTilt * home; }
    else if (ring) { home.xz = turn(home.xz, uSpin * 1.5); home = uTilt * home; }
    else { home.xz = turn(home.xz, uSpin * 0.25); home.y += sin(uTime * 0.2 + aSeed.x * 6.283) * 0.05; }

    // Every point makes its own trip, staggered, overshooting a touch on arrival,
    // spiralling as it goes.
    float t = clamp((uSpread - aSeed.w) / (1.0 - aSeed.w), 0.0, 1.0);
    vec3 p = mix(thought, home, backOut(t));
    p.xz = turn(p.xz, uTwist * (1.0 - smoothstep(0.0, 1.0, t)) * (0.8 + aSeed.x));

    vec4 view = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * view;
    // Rack focus lives here, not in a CSS blur: out of focus, every point swells into a
    // soft, fainter disc. (A CSS filter over the canvas cost a 21-32 ms frame as it began.)
    float size = uSize * aSeed.z * uPixelRatio * uRef / max(0.05, -view.z) * (1.0 + 2.2 * uFocus);
    vSoft = uFocus;
    gl_PointSize = clamp(size, 1.0, 22.0 * uPixelRatio);

    // The far side of the globe falls back; sub-pixel points fade rather than
    // pop; points close to the lens go soft and faint, like bokeh.
    float facing = dot(normalize(home), normalize(cameraPosition - home));
    float depth = globe ? mix(1.0, mix(0.2, 1.0, smoothstep(-0.3, 0.35, facing)), t) : 1.0;
    float kind = role < 0.5 ? 1.0 : globe ? 0.42 : ring ? 0.62 : 0.4;
    float coverage = min(1.0, size) * clamp(5.0 * uPixelRatio / size, 0.16, 1.0);
    // Inside the night circle a point is light; outside it is ink.
    vec2 pixel = (gl_Position.xy / gl_Position.w * 0.5 + 0.5) * uResolution;
    vLit = step(length(pixel - uCircle.xy), uCircle.z);

    // The cursor parts the field: points slide away from it, curling a little,
    // and the ones closest catch the petal colour.
    vec2 away = pixel - uPointer;
    float reach = length(away);
    // The pearl only trembles; its loose cloud is what scatters.
    float field = uPush * pow(max(0.0, 1.0 - reach / uReach), 2.0) * (dust ? 1.0 : mix(0.15, 1.0, t));
    vec2 out_ = reach > 0.001 ? away / reach : vec2(0.0);
    gl_Position.xy += (out_ + vec2(-out_.y, out_.x) * 0.35) * field * uReach * 0.32 / uResolution * 2.0 * gl_Position.w;
    vGlow = field;
    // On paper the dust is barely there: specks, not dirt on the screen.
    vAlpha = kind * depth * coverage * (1.0 - uDim * 0.55) * (1.0 - 0.45 * uFocus) * (dust ? mix(0.3, 1.0, vLit) : 1.0);
  }
`;

const pointsFragment = /* glsl */ `
  uniform vec3 uInk, uLit, uPetal;
  varying float vAlpha;
  varying float vLit;
  varying float vSoft;
  varying float vGlow;
  void main() {
    float a = min(1.0, smoothstep(0.5, 0.3 - 0.28 * vSoft, length(gl_PointCoord - 0.5)) * vAlpha * (1.0 + 0.8 * vGlow));
    if (a < 0.003) discard;
    gl_FragColor = vec4(mix(mix(uInk, uLit, vLit), uPetal, min(1.0, vGlow * 0.9)), a);
  }
`;

// The night: a crisp ink circle in device pixels, the same circle the points test against.
const nightVertex = /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const nightFragment = /* glsl */ `
  uniform vec3 uCircle;
  uniform vec3 uInk;
  void main() {
    float a = clamp(0.5 - (length(gl_FragCoord.xy - uCircle.xy) - uCircle.z), 0.0, 1.0);
    if (a <= 0.0) discard;
    gl_FragColor = vec4(uInk, a);
  }
`;

/**
 * The finale's world, drawn from the finale's channels (see finale-cut.js):
 * a thought that becomes a world of points and folds back into a thought.
 * getChannels() hands this scene the smoothed values the DOM uses, without a
 * React rerender per frame. The plain progress prop remains supported.
 */
export default function WorldScene({progress = 0, reducedMotion = false, getChannels}) {
  const mountRef = useRef(null);
  const inputs = useRef({progress, reducedMotion, getChannels});
  inputs.current = {progress, reducedMotion, getChannels};

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, powerPreference: 'high-performance'});
    } catch {
      mount.dataset.renderState = 'webgl-unavailable';
      return undefined;
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    Object.assign(renderer.domElement.style, {display: 'block', width: '100%', height: '100%', pointerEvents: 'none'});
    mount.append(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 60);
    const circle = new THREE.Vector3();
    const resolution = new THREE.Vector2(1, 1);

    const night = new THREE.Mesh(
      new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)),
      new THREE.ShaderMaterial({uniforms: {uCircle: {value: circle}, uInk: {value: INK}}, vertexShader: nightVertex, fragmentShader: nightFragment, transparent: true, depthTest: false, depthWrite: false}),
    );
    night.frustumCulled = false;
    night.renderOrder = -1;
    scene.add(night);

    const count = matchMedia('(max-width: 700px)').matches ? 12000 : 26000;
    const {thought, world, seeds} = createWorld(count);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(world, 3));
    geometry.setAttribute('aWorld', new THREE.BufferAttribute(world, 3));
    geometry.setAttribute('aThought', new THREE.BufferAttribute(thought, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    const uniforms = {
      uTime: {value: 0}, uSpread: {value: 0}, uTwist: {value: 0}, uSpin: {value: 0}, uDim: {value: 0}, uFocus: {value: 0},
      uSize: {value: 2}, uRef: {value: 6}, uPixelRatio: {value: pixelRatio},
      uCircle: {value: circle}, uResolution: {value: resolution}, uTilt: {value: TILT},
      uInk: {value: INK}, uLit: {value: LIT}, uPetal: {value: PETAL},
      uPointer: {value: new THREE.Vector2(-1e4, -1e4)}, uPush: {value: 0}, uReach: {value: REACH * pixelRatio},
    };
    const points = new THREE.Points(geometry, new THREE.ShaderMaterial({uniforms, vertexShader: pointsVertex, fragmentShader: pointsFragment, transparent: true, depthTest: false, depthWrite: false}));
    points.frustumCulled = false;
    scene.add(points);

    // The cursor, eased: the field follows a hand, not a crosshair. Moving it stirs
    // the field harder; resting it leaves a gentle hollow. Touch screens scroll instead.
    const fine = matchMedia('(pointer: fine)').matches;
    const pointer = {x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, energy: 0, strength: 0, lookX: 0, lookY: 0, inside: false, moved: false, clientX: 0, clientY: 0};
    const onPointer = event => {
      pointer.clientX = event.clientX; pointer.clientY = event.clientY; pointer.moved = true;
      pointer.energy = Math.min(1, pointer.energy + Math.hypot(event.movementX || 0, event.movementY || 0) / 90);
    };
    const onLeave = () => { pointer.inside = false; };
    if (fine) { window.addEventListener('pointermove', onPointer, {passive: true}); document.documentElement.addEventListener('pointerleave', onLeave); }

    let frame = 0, disposed = false, visible = true, last = performance.now(), time = 0;
    let width = 1, height = 1, framing = 6;
    const front = new THREE.Vector3(), position = new THREE.Vector3(), target = new THREE.Vector3();

    function resize() {
      width = Math.max(1, mount.clientWidth || innerWidth);
      height = Math.max(1, mount.clientHeight || innerHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      // The distance at which the globe fills 52% of the height, or 78% of a portrait width.
      framing = Math.max(5.6, 3.72 / camera.aspect);
      uniforms.uRef.value = framing;
      renderer.getDrawingBufferSize(resolution);
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    const visibility = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); }, {rootMargin: '100px'});
    visibility.observe(mount);
    resize();

    function render(now) {
      if (disposed) return;
      const dt = Math.min((now - last) / 1000, 0.05) || 0.016;
      last = now;
      const input = inputs.current;
      const still = input.reducedMotion;
      const c = still ? STILL : input.getChannels ? input.getChannels() : channels(input.progress);
      const paused = document.hidden || document.body.classList.contains('portfolio-route-open');
      if (!still && visible && !paused) time += dt;

      if (pointer.moved) {
        const box = mount.getBoundingClientRect();
        pointer.tx = pointer.clientX - box.left; pointer.ty = pointer.clientY - box.top;
        pointer.inside = pointer.tx >= 0 && pointer.ty >= 0 && pointer.tx <= box.width && pointer.ty <= box.height;
        if (pointer.x < -1e3) { pointer.x = pointer.tx; pointer.y = pointer.ty; }
        pointer.moved = false;
      }
      const follow = 1 - Math.exp(-dt / 0.09), settle = 1 - Math.exp(-dt / 0.6);
      pointer.x += (pointer.tx - pointer.x) * follow; pointer.y += (pointer.ty - pointer.y) * follow;
      pointer.energy *= Math.exp(-dt / 0.5);
      const want = fine && pointer.inside && !still ? 0.55 + 0.45 * pointer.energy : 0;
      pointer.strength += (want - pointer.strength) * (1 - Math.exp(-dt / 0.2));
      pointer.lookX += ((pointer.inside ? pointer.x / width - 0.5 : 0) - pointer.lookX) * settle;
      pointer.lookY += ((pointer.inside ? pointer.y / height - 0.5 : 0) - pointer.lookY) * settle;
      uniforms.uPointer.value.set(pointer.x * pixelRatio, (height - pointer.y) * pixelRatio);
      uniforms.uPush.value = pointer.strength;

      front.set(0, 0, framing * c.dist);
      position.lerpVectors(front, HORIZON.position, c.flight);
      position.y += Math.sin(Math.PI * c.flight) * 0.25 + Math.sin(time * 0.17) * 0.03 * c.flight;
      position.x += Math.sin(time * 0.13) * 0.05 * c.flight;
      // A slight parallax toward the cursor, smaller on the horizon where it would rock the text.
      const sway = 1 - 0.6 * c.flight;
      position.x += pointer.lookX * 0.4 * sway;
      position.y -= pointer.lookY * 0.25 * sway;
      target.set(0, 0, 0).lerp(HORIZON.target, c.flight);
      camera.position.copy(position);
      camera.up.set(0, 1, 0);
      camera.lookAt(target);
      camera.rotateZ(Math.sin(Math.PI * c.flight) * 0.1);
      const fov = FOV + 14 * c.kick;
      if (Math.abs(camera.fov - fov) > 1e-3) { camera.fov = fov; camera.updateProjectionMatrix(); }

      uniforms.uTime.value = time;
      uniforms.uSpread.value = c.spread;
      uniforms.uTwist.value = c.twist;
      uniforms.uSpin.value = time * 0.05 + c.p * 2.4;
      uniforms.uDim.value = c.dim;
      uniforms.uFocus.value = c.focus;
      circle.set(resolution.x / 2, resolution.y / 2, c.night * Math.hypot(resolution.x, resolution.y) / 2);
      night.visible = c.night > 0;

      mount.dataset.phase = c.p < CUT.form[0] ? 'thought' : c.p < CUT.night[1] ? 'forming' : c.p < CUT.back[0] ? 'horizon' : c.p < CUT.collapse[1] ? 'return' : 'ending';
      if (visible && !paused) renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    }
    // Compile both programs and upload the points now, at page load, while the finale is
    // far below: done on its first visible frame instead, this cost a 50-150 ms frame on entry.
    renderer.compile(scene, camera);
    renderer.render(scene, camera);
    mount.dataset.renderState = 'ready';
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      for (const object of [night, points]) { object.geometry.dispose(); object.material.dispose(); }
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="world-scene" aria-hidden="true" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden'}}/>;
}
