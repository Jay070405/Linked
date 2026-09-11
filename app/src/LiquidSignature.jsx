import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import BrandWordmark,{geometry as brandGeometry,fitBrandWord} from './components/BrandWordmark';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/** A steady, flat wordmark with a small clear-glass disturbance at the pointer. */
export default function LiquidSignature({ reduced = false, vectorWordmark = false }) {
  const mountRef = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current, heading = headingRef.current;
    if (!mount || !heading || reduced) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: false, antialias: false, powerPreference: 'high-performance' });
    } catch { return undefined; }
    const canvas = renderer.domElement;
    canvas.className = 'liquid-signature__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    mount.append(canvas);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setClearColor('#FAFBFC', 1);
    const bitmap = document.createElement('canvas');
    const context = bitmap.getContext('2d', { alpha: false });
    const makeTexture = () => {
      const result = new THREE.CanvasTexture(bitmap);
      result.colorSpace = THREE.NoColorSpace;
      result.minFilter = THREE.LinearFilter;
      result.magFilter = THREE.LinearFilter;
      result.generateMipmaps = false;
      return result;
    };
    let texture = makeTexture();
    const points = Array.from({ length: 6 }, () => new THREE.Vector2(0.5, 0.5));
    const uniforms = {
      uText: { value: texture }, uSize: { value: new THREE.Vector2(1, 1) },
      uTrail: { value: points }, uGain: { value: 0 },
      uTime: { value: 0 }, uSpeed: { value: 0 }, uRadius: { value: 90 },
    };
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}',
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uText;
        uniform vec2 uSize;
        uniform vec2 uTrail[6];
        uniform float uGain;
        uniform float uTime;
        uniform float uSpeed;
        uniform float uRadius;
        void main(){
          vec2 px=vUv*uSize;
          float field=0.0;
          vec2 gradient=vec2(0.0);
          for(int i=0;i<6;i++){
            vec2 d=px-uTrail[i]*uSize;
            float angle=atan(d.y,d.x);
            float shape=1.0+0.12*sin(angle*3.0+uTime*1.4)+0.055*cos(angle*5.0-uTime);
            vec2 flow=d/vec2(1.1,0.91);
            float radius=uRadius*shape*(1.0-float(i)*0.06);
            float f=exp(-dot(flow,flow)/(radius*radius));
            float weight=0.56*pow(0.71,float(i));
            field+=f*weight;
            gradient+=normalize(d+vec2(0.001))*f*weight;
          }
          float mask=smoothstep(0.12,0.72,field)*uGain;
          float amount=8.0+4.0*clamp(uSpeed,0.0,1.0);
          vec2 direction=gradient/max(0.35,length(gradient));
          vec2 displacement=direction*amount*mask;
          vec2 uv=clamp(vUv+displacement/uSize,vec2(0.001),vec2(0.999));
          vec3 original=texture2D(uText,vUv).rgb;
          vec3 refracted=texture2D(uText,uv).rgb;
          vec3 color=mix(original,refracted,mask);
          float rim=exp(-pow((field-0.31)*8.0,2.0))*uGain;
          float light=dot(direction,normalize(vec2(-0.55,1.0)));
          // Neutral light and shadow only. No chrome, tint or extruded type.
          color+=vec3(light*rim*0.015);
          gl_FragColor=vec4(clamp(color,0.0,1.0),1.0);
        }
      `,
    });
    const scene = new THREE.Scene(), camera = new THREE.Camera();
    scene.add(new THREE.Mesh(geometry, material));
    const target = new THREE.Vector2(0.5, 0.5);
    let disposed = false, visible = true, ready = false, frame = 0, failed = false;
    let width = 1, height = 1, lastTime = performance.now(), lastMove = -Infinity;
    let previousPointerAt = 0, velocity = 0, entered = false;
    const fallback = () => {
      failed = true; ready = false; cancelAnimationFrame(frame); frame = 0;
      mount.classList.remove('is-canvas-ready'); canvas.style.visibility = 'hidden';
    };
    renderer.debug.onShaderError = fallback;
    const lost = event => { event.preventDefault(); fallback(); };
    const restored = () => { failed = false; canvas.style.visibility = ''; drawText(); };
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);

    function drawText() {
      if (disposed || failed || !context) return;
      width = Math.max(1, mount.clientWidth);
      height = Math.max(1, mount.clientHeight);
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const bitmapWidth=Math.round(width*dpr),bitmapHeight=Math.round(height*dpr);
      if(bitmap.width!==bitmapWidth||bitmap.height!==bitmapHeight){
        // WebGL texture storage has immutable dimensions after its first upload.
        texture.dispose();bitmap.width=bitmapWidth;bitmap.height=bitmapHeight;
        texture=makeTexture();uniforms.uText.value=texture;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.fillStyle = '#FAFBFC'; context.fillRect(0, 0, width, height);
      if(vectorWordmark){
        const fit=fitBrandWord(width,height);
        context.save();context.translate(fit.x,fit.y);context.scale(fit.scale,fit.scale);
        context.fillStyle='#111114';
        for(const glyph of brandGeometry.word.paths)context.fill(new Path2D(glyph.d));
        context.restore();
      } else {
      const setFont = size => {
        context.font = `650 ${size}px "TikTok Sans", sans-serif`;
        context.fontKerning = 'normal';
        if ('letterSpacing' in context) context.letterSpacing = `${-size * 0.065}px`;
      };
      setFont(100);
      const measured = context.measureText('JAY LIN').width;
      let fontSize = width * 0.99 / measured * 100;
      setFont(fontSize);
      let metrics = context.measureText('JAY LIN');
      if (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent > height * 0.94) {
        fontSize *= height * 0.94 / (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
        setFont(fontSize); metrics = context.measureText('JAY LIN');
      }
      const x = (width - metrics.width) / 2;
      const baseline = (height + metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
      context.fillStyle = '#111114';
      context.fillText('JAY LIN', x, baseline);
      heading.style.fontSize = `${fontSize}px`;
      }
      texture.needsUpdate = true;
      renderer.setSize(width, height, false);
      uniforms.uSize.value.set(width, height);
      uniforms.uRadius.value = width < 700 ? 51 : 88;
      renderer.render(scene, camera);
      if (failed) return;
      ready = true;
      mount.classList.add('is-canvas-ready');
      mount.dataset.renderState = 'ready';
    }
    function wake() {
      if (!frame && ready && visible && !disposed) {
        lastTime = performance.now(); frame = requestAnimationFrame(draw);
      }
    }
    function onPointer(event, tap = false) {
      if (event.pointerType === 'touch' && !tap) return;
      const rect = mount.getBoundingClientRect(), now = performance.now();
      const x = clamp((event.clientX - rect.left) / rect.width);
      const y = clamp(1 - (event.clientY - rect.top) / rect.height);
      const dt = clamp((now - previousPointerAt) / 1000, 0.008, 0.05);
      if (!entered || tap) {
        target.set(x, y); points.forEach(point => point.copy(target)); velocity = 0;
      } else {
        velocity = clamp(Math.hypot((x - target.x) * width, (y - target.y) * height) / dt / 950);
        target.set(x, y);
      }
      entered = true; previousPointerAt = now; lastMove = now;
      wake();
    }
    const move = event => onPointer(event);
    const down = event => { if (event.pointerType === 'touch' || event.pointerType === 'pen') onPointer(event, true); };
    const leave = () => { entered = false; lastMove = Math.min(lastMove, performance.now() - 100); wake(); };
    function draw(now) {
      frame = 0;
      if (disposed || !visible || (document.hidden || document.body.classList.contains('portfolio-route-open'))) return;
      const dt = Math.min((now - lastTime) / 1000, 0.05) || 0.016;
      lastTime = now;
      // The lead point settles in roughly .5s; the tail is a damped flow.
      points[0].lerp(target, 1 - Math.exp(-dt * 6.2));
      for (let i = 1; i < points.length; i++) points[i].lerp(points[i - 1], 1 - Math.exp(-dt * (8.5 - i * 0.7)));
      const age = Math.max(0, now - lastMove - 90) / 700;
      const recovery = 1 - clamp(age) ** 2 * (3 - 2 * clamp(age));
      uniforms.uGain.value = recovery > uniforms.uGain.value
        ? THREE.MathUtils.lerp(uniforms.uGain.value, recovery, 1 - Math.exp(-dt * 20)) : recovery;
      if (now - lastMove > 60) velocity *= Math.exp(-dt * 6);
      uniforms.uSpeed.value = THREE.MathUtils.lerp(uniforms.uSpeed.value, velocity, 1 - Math.exp(-dt * 8));
      uniforms.uTime.value = now / 1000;
      renderer.render(scene, camera);
      if (uniforms.uGain.value > 0.0005 || now - lastMove < 790) frame = requestAnimationFrame(draw);
    }

    const resize = new ResizeObserver(drawText);
    resize.observe(mount);
    const visibility = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; }
      else if (visible && ready) { renderer.render(scene, camera); wake(); }
    }, { rootMargin: '150px' });
    visibility.observe(mount);
    const pageVisibility = () => {
      // Returning to a tab must not preserve a half-finished glass imprint.
      cancelAnimationFrame(frame); frame = 0;
      lastMove = -Infinity; entered = false; velocity = 0;
      uniforms.uGain.value = 0; uniforms.uSpeed.value = 0;
      if (!(document.hidden || document.body.classList.contains('portfolio-route-open')) && ready && visible) renderer.render(scene, camera);
    };
    document.addEventListener('visibilitychange', pageVisibility);
    mount.addEventListener('pointermove', move, { passive: true });
    mount.addEventListener('pointerdown', down, { passive: true });
    mount.addEventListener('pointerleave', leave, { passive: true });
    const fontsChanged = () => { if (!disposed) drawText(); };
    document.fonts?.addEventListener('loadingdone', fontsChanged);
    Promise.resolve(document.fonts?.load('650 200px "TikTok Sans"')).then(fontsChanged).catch(fontsChanged);
    drawText();

    return () => {
      disposed = true; cancelAnimationFrame(frame);
      resize.disconnect(); visibility.disconnect();
      mount.removeEventListener('pointermove', move);
      mount.removeEventListener('pointerdown', down);
      mount.removeEventListener('pointerleave', leave);
      document.fonts?.removeEventListener('loadingdone', fontsChanged);
      document.removeEventListener('visibilitychange', pageVisibility);
      mount.classList.remove('is-canvas-ready');
      heading.style.removeProperty('font-size');
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      texture.dispose(); geometry.dispose(); material.dispose(); renderer.dispose(); canvas.remove();
    };
  }, [reduced,vectorWordmark]);

  return <div className={`liquid-signature${vectorWordmark?' has-vector':''}`} ref={mountRef}>
    {vectorWordmark&&<BrandWordmark/>}
    <h2 className="liquid-signature__native" ref={headingRef}>JAY LIN</h2>
  </div>;
}
