import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import LiquidOffice from '../LiquidOffice';
import { STUDIO_TITLE_FONT } from '../studio-title-composite';
import { preloadOffice } from './model';
import { cameraPose, CAMERA_FOV, easeRange } from './camera';
import { liquidVertex, liquidFragment } from './liquidShader';
import './office3d.css';

const clamp = THREE.MathUtils.clamp;
const filmBlocked = () => document.hidden || document.body.classList.contains('portfolio-route-open');

function wallTitle() {
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 384;
  const ctx = canvas.getContext('2d');
  ctx.font = STUDIO_TITLE_FONT; ctx.fillStyle = '#f5f5f3'; ctx.textBaseline = 'alphabetic';
  const metrics = ctx.measureText('PORTFOLIO');
  const ascent = metrics.actualBoundingBoxAscent || 146;
  ctx.scale(1990 / metrics.width, 330 / ascent);
  ctx.fillText('PORTFOLIO', 16, ascent + 3);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.name = 'WallPortfolio'; mesh.position.set(.6, 4.09, -1.79); mesh.scale.set(7.65, 1.29, 1);
  return mesh;
}

/** Real geometry, one shared camera, two render targets, existing liquid field. */
export default function Office3D({ progressRef, reducedMotion, onMode }) {
  const hostRef = useRef(null), canvasRef = useRef(null), modeRef = useRef(onMode);
  modeRef.current = onMode;
  const [mode, setMode] = useState('loading');

  useEffect(() => {
    if (reducedMotion) { setMode('image'); modeRef.current?.('image'); return undefined; }
    const host = hostRef.current, canvas = canvasRef.current, root = host.closest('.legacy-hero');
    let disposed = false, ready = false, visible = true, lost = false, frame = 0, previous = 0;
    let width = 1, height = 1, lastInput = 0, lastDrop = 0, active = false, strength = 0;
    let touchEnd = 0, vx = 0, vy = 0, renderer, model, title, cleanTarget, gardenTarget, composite, post;
    const cursor = new THREE.Vector2(.5, .5), head = cursor.clone(), sway = new THREE.Vector2();
    const trail = [], packed = Array.from({ length: 24 }, () => new THREE.Vector4());
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, .015, 90);
    scene.background = new THREE.Color('#111a16');
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const hemi = new THREE.HemisphereLight('#c7daef', '#b2a99e', 2.5); scene.add(hemi);
    const key = new THREE.DirectionalLight('#f5f1df', 2.3); key.position.set(-3, 6, 5); scene.add(key);
    key.shadow.intensity = .48;
    key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -.0003; key.shadow.normalBias = .018;
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -3, near: .1, far: 18 });
    key.target.position.set(.4, 1.3, 0); scene.add(key.target);
    const lamp = new THREE.PointLight('#ffbb68', 4, 4, 2); lamp.position.set(2.35, 2.77, -.25); scene.add(lamp);
    let indoor, garden, start, look, screen, lastP = -1, samples = 0, sampleTotal = 0;
    const stop = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; };
    const allowed = () => !disposed && !lost && ready && visible && !filmBlocked() && progressRef.current < .18;
    const wake = () => { if (!frame && allowed()) frame = requestAnimationFrame(draw); };
    const report = value => {
      if (disposed) return;
      setMode(value); modeRef.current?.(value);
      host.dataset.mode = value;
    };
    const fail = error => {
      if (disposed) return;
      stop(); ready = false; report('image');
      console.warn('3D office unavailable; keeping the original opening.', error);
    };

    function resize() {
      width = Math.max(1, host.clientWidth); height = Math.max(1, host.clientHeight);
      if (!renderer) return;
      const mobile = width < 700;
      const ratio = Math.min(devicePixelRatio || 1, mobile ? 1.15 : 1.4, 2100 / Math.max(width, height));
      renderer.setPixelRatio(ratio); renderer.setSize(width, height, false);
      cleanTarget?.setSize(Math.round(width * ratio), Math.round(height * ratio));
      gardenTarget?.setSize(Math.round(width * ratio), Math.round(height * ratio));
      camera.aspect = width / height; camera.updateProjectionMatrix();
      if (title) {
        title.scale.x = camera.aspect < .9 ? 3.65 : 7.65;
        title.scale.y = camera.aspect < .9 ? 1.04 : 1.29;
        title.position.x = camera.aspect < .9 ? .55 : .6;
      }
      wake();
    }

    function draw(now) {
      frame = 0;
      if (!allowed()) { previous = 0; return; }
      const dt = previous ? Math.min(.05, (now - previous) / 1000) : 1 / 60; previous = now;
      const p = progressRef.current;
      if (touchEnd && now > touchEnd) { active = false; touchEnd = 0; }
      const permitReveal = 1 - easeRange(.075, .125, p);
      const follow = 1 - Math.exp(-dt * 9);
      head.lerp(cursor, follow);
      strength += ((active ? 1 : 0) * permitReveal - strength) * (1 - Math.exp(-dt * 6));
      vx *= Math.exp(-dt * 3); vy *= Math.exp(-dt * 3);
      const sx = active ? (cursor.x - .5) * 2 : 0, sy = active ? (cursor.y - .5) * 2 : 0;
      sway.lerp(new THREE.Vector2(sx, sy), follow);
      const pose = cameraPose(p, camera.aspect, start, look, screen, sway);
      camera.position.copy(pose.position); camera.lookAt(pose.target); camera.updateMatrixWorld();
      packed.forEach(v => v.set(0, 0, .001, 0));
      for (let i = trail.length - 1; i >= 0; i--) if (now - trail[i].born > 2150) trail.splice(i, 1);
      trail.forEach((drop, i) => {
        const age = (now - drop.born) / 1000, life = 1 - age / 2.15;
        const glide = (1 - Math.exp(-age * 2.7)) / 2.7;
        packed[i].set(drop.x + drop.vx * glide, drop.y + drop.vy * glide,
          drop.radius * (1 + age * .19), .58 * life * life * permitReveal);
      });
      const u = composite.uniforms;
      u.uAspect.value = camera.aspect; u.uImageAspect.value = camera.aspect;
      u.uTime.value = now / 1000; u.uHead.value.set(head.x, head.y, strength);
      u.uVelocity.value.set(vx, vy);
      const renderStart = performance.now();
      renderer.info.reset();
      indoor.visible = true; garden.visible = false; title.visible = true;
      scene.background.set('#111a16');
      renderer.setRenderTarget(cleanTarget); renderer.render(scene, camera);
      if (strength > .001 || trail.length) {
        indoor.visible = false; garden.visible = true; title.visible = false;
        scene.background.set('#686d85');
        renderer.setRenderTarget(gardenTarget); renderer.render(scene, camera);
      }
      renderer.setRenderTarget(null); renderer.render(post, postCamera);
      sampleTotal += performance.now() - renderStart; samples++;
      if (samples % 10 === 0) {
        host.dataset.renderMs = (sampleTotal / samples).toFixed(2);
        host.dataset.drawCalls = String(renderer.info.render.calls);
      }
      host.dataset.frames = String(samples);
      host.dataset.progress = p.toFixed(4);
      host.dataset.camera = camera.position.toArray().map(v => v.toFixed(3)).join(',');
      host.dataset.reveal = strength.toFixed(3);
      if (mode !== '3d' && host.dataset.mode !== '3d') report('3d');
      const settling = active || strength > .001 || trail.length || sway.lengthSq() > .00001 || Math.abs(lastP - p) > .00001;
      lastP = p;
      if (settling) wake();
    }

    function pointer(event) {
      if (!allowed() || progressRef.current > .125) return;
      if (event.target instanceof Element && event.target.closest('a,button,nav,dialog')) { leave(); return; }
      const rect = host.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) { leave(); return; }
      const now = performance.now();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = 1 - clamp((event.clientY - rect.top) / rect.height, 0, 1);
      const dt = Math.max(.016, Math.min(.15, (now - lastInput) / 1000 || .016));
      const dx = x - cursor.x, dy = y - cursor.y;
      if (!active || now - lastInput > 250) head.set(x,y);
      vx = active ? clamp(dx / dt, -1.4, 1.4) : 0; vy = active ? clamp(dy / dt, -1.4, 1.4) : 0;
      cursor.set(x,y); lastInput = now; active = true;
      if (event.pointerType === 'touch') touchEnd = now + 650;
      if (now - lastDrop > 35 && Math.hypot(dx,dy) > .002) {
        trail.push({x,y,vx:vx*.065,vy:vy*.065,radius:.14+Math.min(Math.hypot(vx,vy),1)*.037,born:now});
        if (trail.length > 24) trail.shift(); lastDrop = now;
      }
      wake();
    }
    function leave() { active = false; wake(); }
    function visibility() {
      if (filmBlocked()) { active = false; strength = 0; trail.length = 0; stop(); }
      else wake();
    }
    function contextLost(event) { event.preventDefault(); lost = true; fail('WebGL context lost'); }
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) wake(); else stop(); });
    const sizeObserver = new ResizeObserver(resize);
    const routeObserver = new MutationObserver(visibility);
    observer.observe(host); sizeObserver.observe(host); routeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    root.addEventListener('office:progress', wake);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pointermove', pointer, { passive: true });
    window.addEventListener('pointerdown', pointer, { passive: true });
    window.addEventListener('pointercancel', leave);
    window.addEventListener('blur', leave);
    document.documentElement.addEventListener('pointerleave', leave);
    canvas.addEventListener('webglcontextlost', contextLost);

    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false, powerPreference: 'high-performance' });
      renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.3;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
      renderer.info.autoReset = false;
      cleanTarget = new THREE.WebGLRenderTarget(1,1,{ type: THREE.HalfFloatType, samples: 2 });
      gardenTarget = new THREE.WebGLRenderTarget(1,1,{ type: THREE.HalfFloatType, samples: 2 });
      composite = new THREE.ShaderMaterial({
        vertexShader: liquidVertex, fragmentShader: liquidFragment, depthTest: false, depthWrite: false,
        uniforms: { uClean: {value: cleanTarget.texture}, uFantasy:{value:gardenTarget.texture}, uAspect:{value:1},
          uImageAspect:{value:1},uTime:{value:0},uHead:{value:new THREE.Vector3(.5,.5,0)},uVelocity:{value:new THREE.Vector2()},uTrail:{value:packed} }
      });
      post = new THREE.Scene(); post.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),composite));
      resize();
      Promise.all([preloadOffice(), document.fonts.load(STUDIO_TITLE_FONT).catch(() => [])]).then(async ([buffer]) => {
        if (disposed) return;
        const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buffer, '/assets/office3d/');
        if (disposed) { disposeObject(gltf.scene); return; }
        model = gltf.scene; scene.add(model);
        indoor = model.getObjectByName('StudioInterior'); garden = model.getObjectByName('FantasyGarden');
        if (!indoor || !garden || !model.getObjectByName('ScreenTarget')) throw new Error('Missing office anchors');
        model.updateMatrixWorld(true);
        start = model.getObjectByName('CameraStart').getWorldPosition(new THREE.Vector3());
        look = model.getObjectByName('CameraLook').getWorldPosition(new THREE.Vector3());
        screen = model.getObjectByName('ScreenTarget').getWorldPosition(new THREE.Vector3());
        model.traverse(object => {
          if (!object.isMesh) return;
          object.castShadow = object.parent !== garden && !/painting|landscape|ScreenSurface/i.test(object.name);
          object.receiveShadow = true;
          const material = object.material;
          if (material.name.startsWith('Leaf') || material.name === 'Petal') material.side = THREE.DoubleSide;
          if (material.name === 'Screen_off') {
            object.material = new THREE.MeshBasicMaterial({ color: '#020303', toneMapped: false });
            object.receiveShadow = false;
          }
        });
        title = wallTitle(); scene.add(title);
        ready = true; resize();
        // If restored below the office, establish mode without rendering it.
        if (progressRef.current >= .18) report('3d');
        wake();
      }).catch(fail);
    } catch (error) { fail(error); }

    return () => {
      disposed = true; stop(); observer.disconnect(); sizeObserver.disconnect(); routeObserver.disconnect();
      root.removeEventListener('office:progress', wake);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pointermove', pointer); window.removeEventListener('pointerdown', pointer);
      window.removeEventListener('pointercancel', leave); window.removeEventListener('blur', leave);
      document.documentElement.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('webglcontextlost', contextLost);
      disposeObject(scene); if (post) disposeObject(post);
      cleanTarget?.dispose(); gardenTarget?.dispose(); key.shadow.map?.dispose(); renderer?.dispose();
    };
  }, [reducedMotion, progressRef]);

  return <div ref={hostRef} className="office-3d" data-mode={mode}>
    {mode !== '3d' && <LiquidOffice reducedMotion={reducedMotion} progressRef={progressRef} />}
    <canvas ref={canvasRef} className={mode === '3d' ? 'is-ready' : ''} aria-hidden="true" />
    <span className="office-3d-description">工作室：书桌、电脑、台灯和窗外的手绘风景。滚动进入作品。</span>
  </div>;
}

function disposeObject(root) {
  const materials = new Set(), geometries = new Set(), textures = new Set();
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
  });
  materials.forEach(m => { Object.values(m).forEach(v => { if (v?.isTexture) textures.add(v); }); m.dispose(); });
  const images = new Set();
  textures.forEach(t => { if (t.source?.data) images.add(t.source.data); t.dispose(); });
  images.forEach(value => value.close?.());
  geometries.forEach(g => g.dispose());
}
