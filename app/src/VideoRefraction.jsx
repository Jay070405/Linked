import { useEffect, useRef } from 'react';
import { Camera, LinearFilter, Mesh, PlaneGeometry, Scene, ShaderMaterial, TextureLoader, Vector2, VideoTexture, WebGLRenderer } from 'three';

const clamp = x => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// The approved V13 local lens: four lagging fields bend the actual paused video
// texture. This is independent of the office's two-scene liquid reveal.
const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVideo;
uniform sampler2D uPoster;
uniform float uReady;
uniform float uAspect;
uniform float uVideoAspect;
uniform vec2 uPointer;
uniform vec2 uTrail[4];
uniform float uStrength;
uniform float uTime;
uniform float uScene;
void main(){
  vec2 uv=vUv;
  vec2 cover=vec2(min(1.,uAspect/uVideoAspect),min(1.,uVideoAspect/uAspect));
  vec2 delta=vec2(0.);float field=0.;float rim=0.;
  for(int i=0;i<4;i++){
    vec2 d=(uv-uTrail[i])*vec2(uAspect,1.);float r=length(d);
    float wave=sin(r*43.-uTime*1.8+float(i)*.3);float weight=1.-float(i)*.19;
    float f=exp(-r*r/(.022+float(i)*.007))*weight;
    field+=f*.36;
    delta+=normalize(d+vec2(.0001))*(f*.011+wave*f*.003)*weight/vec2(uAspect,1.);
    rim+=exp(-pow((r-.125)*36.,2.))*.024*weight;
  }
  float amount=uStrength*uScene;
  uv+=delta*amount;
  uv+=(uPointer-.5)*vec2(.01,.007)*uScene;
  uv=clamp((uv-.5)*cover+.5,.001,.999);
  vec3 original=mix(texture2D(uPoster,uv).rgb,texture2D(uVideo,uv).rgb,uReady);
  float fr=field*amount;
  vec3 refracted=vec3(texture2D(uVideo,uv+vec2(.0022*fr,0.)).r,original.g,texture2D(uVideo,uv-vec2(.0016*fr,0.)).b);
  vec3 color=mix(original,refracted,uReady*.8);
  color=mix(color,color*vec3(.89,1.075,1.1)+vec3(.035,.025,.025),clamp(fr,0.,.7));
  color+=rim*amount*.32;
  gl_FragColor=vec4(color,1.);
}`;

export default function VideoRefraction({ videoRef, progressRef, reduced = false, className = '' }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current, video = videoRef.current;
    if (!canvas || !video || reduced) return undefined;
    let disposed = false, failed = false, visible = true, raf = 0, lastTime = performance.now();
    let renderer, videoTexture, poster, geometry, material, observer;
    const input = { x: .5, y: .5, active: false };
    const follow = new Vector2(.5, .5), point = new Vector2(.5, .5);
    const trails = Array.from({ length: 4 }, () => new Vector2(.5, .5));
    canvas.style.opacity = '0';
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const start = () => {
      if (!disposed && !failed && visible && !(document.hidden || document.body.classList.contains('portfolio-route-open')) && !raf && renderer) {
        lastTime = performance.now(); raf = requestAnimationFrame(draw);
      }
    };
    function ready() { if (videoTexture) videoTexture.needsUpdate = true; start(); }
    function fail() { failed = true; stop(); canvas.style.opacity = '0'; }
    function resize() {
      if (!renderer) return;
      // Allocate for the largest film viewport only on a real window resize.
      // The closing frame shrinks each scroll tick; reallocating its drawing
      // buffer on every tick would stall the original video transition.
      const scale = Math.min(devicePixelRatio || 1, 1.5, 1920 / Math.max(innerWidth, innerHeight));
      renderer.setPixelRatio(scale);
      renderer.setSize(innerWidth, innerHeight, false);
      start();
    }
    function pointer(event) {
      const p = progressRef.current;
      if (!visible || (document.hidden || document.body.classList.contains('portfolio-route-open')) || p < .148 || p > .88) { input.active = false; return; }
      const rect = canvas.getBoundingClientRect();
      const inside = rect.width > 0 && rect.height > 0 && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      input.active = inside;
      if (inside) { input.x = clamp((event.clientX - rect.left) / rect.width); input.y = 1 - clamp((event.clientY - rect.top) / rect.height); }
      start();
    }
    function release(event) { if (!event || event.pointerType !== 'mouse') input.active = false; }
    function leave() { input.active = false; }
    function visibility() { if ((document.hidden || document.body.classList.contains('portfolio-route-open'))) { input.active = false; stop(); } else start(); }
    function contextLost(event) { event.preventDefault(); fail(); }
    let uniforms, scene, camera;
    function draw(now) {
      raf = 0;
      if (disposed || failed || !visible || (document.hidden || document.body.classList.contains('portfolio-route-open'))) return;
      const dt = Math.min(.05, (now - lastTime) / 1000) || .016; lastTime = now;
      const p = progressRef.current;
      if (p < .148 || p > .88) input.active = false;
      follow.lerp(point.set(input.x, input.y), 1 - Math.exp(-dt * 7));
      trails[0].lerp(follow, 1 - Math.exp(-dt * 10));
      for (let i = 1; i < 4; i++) trails[i].lerp(trails[i - 1], 1 - Math.exp(-dt * 7));
      uniforms.uPointer.value.copy(follow);
      uniforms.uStrength.value += ((input.active ? 1 : 0) - uniforms.uStrength.value) * (1 - Math.exp(-dt * 4));
      uniforms.uScene.value = smooth(.15, .185, p) * (1 - smooth(.80, .88, p));
      uniforms.uReady.value = video.readyState >= 2 ? 1 : 0;
      uniforms.uTime.value = now * .001;
      uniforms.uAspect.value = Math.max(1, canvas.clientWidth) / Math.max(1, canvas.clientHeight);
      uniforms.uVideoAspect.value = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : 16 / 9;
      // Keep the last decoded frame visible while a new seek is outstanding.
      // loadeddata/seeked explicitly upload it even though playback is paused.
      if (video.readyState >= 2) {
        renderer.render(scene, camera);
        canvas.style.opacity = '1';
      }
      raf = requestAnimationFrame(draw);
    }
    try {
      renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
      videoTexture = new VideoTexture(video);
      videoTexture.minFilter = LinearFilter; videoTexture.magFilter = LinearFilter; videoTexture.generateMipmaps = false;
      poster = new TextureLoader().load('/assets/courtyard-poster-first.png', () => { if (!disposed) start(); });
      uniforms = { uVideo: { value: videoTexture }, uPoster: { value: poster }, uReady: { value: 0 }, uAspect: { value: innerWidth / innerHeight }, uVideoAspect: { value: 16 / 9 }, uPointer: { value: new Vector2(.5, .5) }, uTrail: { value: trails }, uStrength: { value: 0 }, uTime: { value: 0 }, uScene: { value: 0 } };
      material = new ShaderMaterial({ uniforms, vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}', fragmentShader });
      geometry = new PlaneGeometry(2, 2); scene = new Scene(); camera = new Camera();
      scene.add(new Mesh(geometry, material));
      observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) start(); else { input.active = false; stop(); } });
      observer.observe(canvas);
      window.addEventListener('resize', resize);
      window.addEventListener('pointermove', pointer, { passive: true });
      window.addEventListener('pointerdown', pointer, { passive: true });
      window.addEventListener('pointerup', release, { passive: true });
      window.addEventListener('pointercancel', leave, { passive: true });
      window.addEventListener('blur', leave);
      document.documentElement.addEventListener('pointerleave', leave);
      document.addEventListener('visibilitychange', visibility);
      video.addEventListener('loadeddata', ready); video.addEventListener('seeked', ready); video.addEventListener('error', fail);
      canvas.addEventListener('webglcontextlost', contextLost);
      resize(); ready();
    } catch { fail(); }
    return () => {
      disposed = true; stop(); observer?.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', pointer); window.removeEventListener('pointerdown', pointer);
      window.removeEventListener('pointerup', release); window.removeEventListener('pointercancel', leave); window.removeEventListener('blur', leave);
      document.documentElement.removeEventListener('pointerleave', leave); document.removeEventListener('visibilitychange', visibility);
      video.removeEventListener('loadeddata', ready); video.removeEventListener('seeked', ready); video.removeEventListener('error', fail);
      canvas.removeEventListener('webglcontextlost', contextLost);
      videoTexture?.dispose(); poster?.dispose(); geometry?.dispose(); material?.dispose(); renderer?.dispose();
    };
  }, [videoRef, progressRef, reduced]);
  return <canvas ref={canvasRef} className={`legacy-video-refraction ${className}`} aria-hidden="true" style={{ display: reduced ? 'none' : 'block' }} />;
}
