import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BLACK = '#09090b';
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const petalCurve = (x, y) => 0.04 + 0.20 * (y / 1.35) ** 2 + 0.11 * (x / 0.65) ** 2;
const PETAL_CENTER = new THREE.Vector3(0, 0.58, petalCurve(0, 0.58) + 0.075);

// A closed, substantial shell. Both faces and the narrow outer wall are
// geometry; the five petals are not image planes or transparent sprites.
function createPetalGeometry() {
  const rings = 28, segments = 100;
  const positions = [], indices = [];
  const faceCount = 1 + rings * segments;
  for (let face = 0; face < 2; face++) {
    const top = face === 0;
    positions.push(0, 0.58, petalCurve(0, 0.58) + (top ? 0.075 : -0.046));
    for (let ring = 1; ring <= rings; ring++) {
      const rho = ring / rings;
      for (let j = 0; j < segments; j++) {
        const theta = j / segments * Math.PI * 2;
        const sine = Math.sin(theta), cosine = Math.cos(theta);
        const boundaryX = sine * (0.54 + 0.10 * cosine);
        // The two rounded lobes and central notch identify a cherry petal.
        const notch = 0.145 * Math.exp(-((sine / 0.20) ** 2)) * Math.max(0, cosine) ** 8;
        const boundaryY = 0.67 + 0.69 * cosine - notch;
        const x = rho * boundaryX;
        const y = 0.58 + rho * (boundaryY - 0.58);
        const thickness = (top ? 0.069 : -0.040) * (1 - rho * rho) + (top ? 0.006 : -0.006);
        const softEdge = 0.012 * Math.sin(theta * 3 + 0.4) * rho ** 4;
        positions.push(x, y, petalCurve(x, y) + thickness + softEdge);
      }
    }
    const offset = face * faceCount;
    const triangle = (a, b, c) => top ? indices.push(a, c, b) : indices.push(a, b, c);
    for (let j = 0; j < segments; j++) triangle(offset, offset + 1 + j, offset + 1 + (j + 1) % segments);
    for (let ring = 1; ring < rings; ring++) {
      const inner = offset + 1 + (ring - 1) * segments;
      const outer = inner + segments;
      for (let j = 0; j < segments; j++) {
        const next = (j + 1) % segments;
        triangle(inner + j, outer + j, outer + next);
        triangle(inner + j, outer + next, inner + next);
      }
    }
  }
  const last = 1 + (rings - 1) * segments;
  for (let j = 0; j < segments; j++) {
    const next = (j + 1) % segments;
    const a = last + j, b = last + next;
    indices.push(a, b, b + faceCount, a, b + faceCount, a + faceCount);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function finishMaterial(material, darkUniform, petal = false) {
  material.onBeforeCompile = shader => {
    shader.uniforms.uStoryDark = darkUniform;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBlossomPoint;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBlossomPoint = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uStoryDark;\nvarying vec3 vBlossomPoint;');
    if (petal) {
      shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
        #include <color_fragment>
        float fan = atan(vBlossomPoint.x, max(0.06, vBlossomPoint.y + 0.04));
        float vein = 1.0 - smoothstep(0.055, 0.19, abs(sin(fan * 24.0 + vBlossomPoint.y * 0.28)));
        float veinFade = smoothstep(0.08, 0.35, vBlossomPoint.y) * (1.0 - smoothstep(0.95, 1.30, vBlossomPoint.y));
        diffuseColor.rgb *= 1.0 + vein * veinFade * 0.055;
      `);
    }
    // This final operation is after output color conversion. All surfaces
    // converge to the exact CSS black, including highlights and stamens.
    shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', `
      #include <dithering_fragment>
      gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(9.0/255.0, 9.0/255.0, 11.0/255.0), uStoryDark);
    `);
  };
  material.customProgramCacheKey = () => petal ? 'sakura-petal-v1' : 'sakura-solid-v1';
  return material;
}

/**
 * Full-finale progress: 0..1. Root owns the sticky section and its scroll clock.
 * Optional getProgress() lets the animation read a mutable scroll value without
 * forcing a React rerender on every frame. The progress prop remains supported.
 */
export default function BlossomScene({ progress = 0, reducedMotion = false, getProgress }) {
  const mountRef = useRef(null);
  const inputs = useRef({ progress, reducedMotion, getProgress });
  inputs.current = { progress, reducedMotion, getProgress };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      mount.dataset.renderState = 'webgl-unavailable';
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(BLACK, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%', pointerEvents: 'none' });
    mount.append(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.004, 100);
    const darkUniform = { value: 0 };
    const flower = new THREE.Group();
    scene.add(flower);
    const petalGeometry = createPetalGeometry();
    const petalMaterial = finishMaterial(new THREE.MeshPhysicalMaterial({
      color: '#dc8da8', roughness: 0.31, metalness: 0.025,
      clearcoat: 0.44, clearcoatRoughness: 0.32,
      side: THREE.DoubleSide,
    }), darkUniform, true);
    const roseMaterial = finishMaterial(new THREE.MeshPhysicalMaterial({
      color: '#a84267', roughness: 0.46, metalness: 0.04,
      clearcoat: 0.25, clearcoatRoughness: 0.40,
    }), darkUniform);
    const goldMaterial = finishMaterial(new THREE.MeshPhysicalMaterial({
      color: '#d4a45c', roughness: 0.30, metalness: 0.34,
    }), darkUniform);
    const jadeMaterial = finishMaterial(new THREE.MeshPhysicalMaterial({
      color: '#727d73', roughness: 0.37, metalness: 0.04,
      clearcoat: 0.45, clearcoatRoughness: 0.25,
    }), darkUniform);

    const petals = [];
    for (let i = 0; i < 5; i++) {
      const hinge = new THREE.Group();
      hinge.rotation.z = i * Math.PI * 2 / 5;
      flower.add(hinge);
      const mesh = new THREE.Mesh(petalGeometry, petalMaterial);
      mesh.scale.set(1 + Math.sin(i * 2.3) * 0.018, 1 + Math.cos(i * 1.7) * 0.020, 1);
      hinge.add(mesh);
      petals.push(mesh);
    }

    const center = new THREE.Mesh(new THREE.SphereGeometry(0.19, 32, 20), roseMaterial);
    center.position.z = 0.15;
    center.scale.z = 0.46;
    flower.add(center);
    const pollenGeometry = new THREE.SphereGeometry(0.025, 12, 8);
    const stamens = new THREE.InstancedMesh(pollenGeometry, goldMaterial, 23);
    const temporary = new THREE.Object3D();
    for (let i = 0; i < 23; i++) {
      const angle = i * 2.399963;
      const radius = 0.045 + Math.sqrt((i + 1) / 23) * 0.195;
      const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
      const z = 0.31 + (1 - radius / 0.3) * 0.12 + Math.sin(i * 5.4) * 0.014;
      const filamentCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(x * 0.30, y * 0.30, 0.17),
        new THREE.Vector3(x * 0.70, y * 0.70, z * 0.95),
        new THREE.Vector3(x, y, z),
      );
      flower.add(new THREE.Mesh(new THREE.TubeGeometry(filamentCurve, 8, 0.0065, 5, false), goldMaterial));
      temporary.position.set(x, y, z);
      temporary.scale.setScalar(0.82 + (i % 4) * 0.12);
      temporary.updateMatrix();
      stamens.setMatrixAt(i, temporary.matrix);
    }
    flower.add(stamens);
    const stemCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, -0.025), new THREE.Vector3(0.20, -0.65, -0.34),
      new THREE.Vector3(-0.16, -1.24, -0.62), new THREE.Vector3(0.12, -1.68, -0.87),
    );
    flower.add(new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 40, 0.025, 10, false), jadeMaterial));

    scene.add(new THREE.HemisphereLight('#ecdee5', '#474951', 1.7));
    const key = new THREE.DirectionalLight('#fff6fa', 3.4);
    key.position.set(-3, 4, 5); scene.add(key);
    const edgeLight = new THREE.DirectionalLight('#e9ebf3', 2.0);
    edgeLight.position.set(3, -1, 2); scene.add(edgeLight);
    const backLight = new THREE.DirectionalLight('#c57a96', 1.5);
    backLight.position.set(-1, -3, -2); scene.add(backLight);

    let frame = 0, disposed = false, visible = true;
    let lastTime = performance.now(), idleTime = 0;
    let width = 1, height = 1;
    const focus = new THREE.Vector3();
    const target = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const normalMatrix = new THREE.Matrix3();
    const petalNormal = new THREE.Vector3().fromBufferAttribute(petalGeometry.attributes.normal, 0).normalize();
    if (petalNormal.z < 0) petalNormal.negate();

    function resize() {
      width = Math.max(1, mount.clientWidth || innerWidth);
      height = Math.max(1, mount.clientHeight || innerHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    const visibilityObserver = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
    }, { rootMargin: '100px' });
    visibilityObserver.observe(mount);
    resize();

    function render(now) {
      if (disposed) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05) || 0.016;
      lastTime = now;
      const input = inputs.current;
      const supplied = input.getProgress ? input.getProgress() : input.progress;
      const p = clamp(Number.isFinite(supplied) ? supplied : 0);
      const still = input.reducedMotion;
      const approach = smooth(0.15, 0.38, p);
      const retreat = smooth(0.72, 0.94, p);
      const close = approach * (1 - retreat);
      const dark = smooth(0.38, 0.50, p) * (1 - smooth(0.745, 0.90, p));
      if (!still && visible && !(document.hidden || document.body.classList.contains('portfolio-route-open'))) idleTime += dt * (1 - close);

      flower.rotation.set(
        -0.14 + close * 0.30 + (still ? 0 : Math.sin(idleTime * 0.42) * 0.045),
        0.12 + close * 0.54 + (still ? 0 : Math.sin(idleTime * 0.31) * 0.085),
        0.11 + close * 1.30 + (still ? idleTime * 0.065 : 0),
      );
      for (let i = 0; i < petals.length; i++) {
        // Each petal really folds at its base as the camera returns.
        petals[i].rotation.x = 0.065 + retreat * 0.39 + Math.sin(i * 1.9) * 0.018;
      }
      flower.updateMatrixWorld(true);
      focus.copy(PETAL_CENTER);
      petals[0].localToWorld(focus);
      normalMatrix.getNormalMatrix(petals[0].matrixWorld);
      normal.copy(petalNormal).applyMatrix3(normalMatrix).normalize();
      direction.set(0, 0, 1).lerp(normal, close * close).normalize();
      target.set(0, -0.12, 0).lerp(focus, close);

      // The close camera aims at solid petal skin, not the hole between petals.
      // Extra-wide displays come closer; portrait displays still fill height.
      const initialDistance = Math.max(3.05 / 0.31, 2.75 / (camera.aspect * 0.48)) / (2 * Math.tan(THREE.MathUtils.degToRad(19)));
      const surfaceDistance = 0.12 / Math.max(1, camera.aspect / 1.75);
      const distance = initialDistance * Math.pow(surfaceDistance / initialDistance, close);
      camera.position.copy(target).addScaledVector(direction, distance);
      camera.up.set(0, 1, 0);
      camera.lookAt(target);
      darkUniform.value = dark;
      renderer.setClearAlpha(dark);
      mount.dataset.phase = p < 0.15 ? 'sculpture' : p < 0.38 ? 'approach' : p < 0.50 ? 'pink-to-black' : p < 0.72 ? 'philosophy' : p < 0.94 ? 'return' : 'ending';
      if (visible && !(document.hidden || document.body.classList.contains('portfolio-route-open'))) renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    }
    mount.dataset.renderState = 'ready';
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibilityObserver.disconnect();
      const geometries = new Set(), materials = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="blossom-scene" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden' }} />;
}
