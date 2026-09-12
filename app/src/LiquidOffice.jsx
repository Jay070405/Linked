import { useEffect, useRef, useState } from 'react';
import { composeStudioTitle, STUDIO_TITLE_FONT } from './studio-title-composite';

const CLEAN = '/assets/studio-clean.png';
const FANTASY = '/assets/studio-fantasy-anime.png';
const TRAIL_COUNT = 24;
const TRAIL_LIFE = 2.15;

const VERTEX = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * .5 + .5;
  gl_Position = vec4(aPosition, 0., 1.);
}`;

// One shared UV keeps the two authored rooms registered. The field only changes
// which image is visible; optical displacement is confined to its soft edge.
const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uClean;
uniform sampler2D uFantasy;
uniform float uAspect;
uniform float uImageAspect;
uniform float uTime;
uniform vec3 uHead;
uniform vec2 uVelocity;
uniform vec4 uTrail[24];

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
             mix(hash(i + vec2(0., 1.)), hash(i + vec2(1.)), f.x), f.y);
}
float softMass(vec2 d, vec2 radius) {
  vec2 q = d / radius;
  return exp(-dot(q, q) * 1.65);
}
void main() {
  // Distances use the short viewport edge, so patches remain broad on phones.
  vec2 metric = vec2(max(uAspect, 1.), max(1. / uAspect, 1.));
  vec2 p = vUv * metric;
  float t = uTime * .13;
  vec2 warp = vec2(noise(p * 5.2 + vec2(t, -t * .6)),
                   noise(p * 5.2 + vec2(17.3 - t * .5, 9.2 + t))) - .5;
  vec2 liquid = p + warp * .076;

  vec2 head = uHead.xy * metric;
  vec2 d = liquid - head;
  float speed = min(length(uVelocity), 1.);
  vec2 dir = normalize(uVelocity + vec2(.0001, .0001));
  vec2 across = vec2(-dir.y, dir.x);
  vec2 flowing = vec2(dot(d, dir), dot(d, across));
  // Asymmetric overlapping masses, not a circular cursor mask. The second
  // lobe stays broad at rest and leans into the movement while the wake lags.
  float field = uHead.z * (
    softMass(flowing, vec2(.235 + speed * .07, .185)) * 1.12 +
    softMass(d + vec2(.093, -.067), vec2(.165, .155)) * .71 +
    softMass(d - vec2(.063, .095), vec2(.14, .13)) * .48
  );
  vec2 surfaceNormal = vec2(0.);
  for (int i = 0; i < 24; i++) {
    vec4 drop = uTrail[i];
    vec2 q = liquid - drop.xy * metric;
    float mass = softMass(q, vec2(max(drop.z, .001), max(drop.z * .84, .001))) * drop.w;
    field += mass;
    surfaceNormal += q * mass / max(drop.z * drop.z, .001);
  }
  surfaceNormal += d * uHead.z * 5.;
  float grain = noise(p * 13. + warp * 2. + vec2(-t, t * .5));
  float threshold = .60 + (grain - .5) * .105;
  float reveal = smoothstep(threshold - .13, threshold + .15, field);
  // Refraction cannot bend the center of either room, only the mixing edge.
  float edge = 4. * reveal * (1. - reveal);
  vec2 bend = normalize(surfaceNormal + warp * .6 + vec2(.0001));
  vec2 offset = (bend * .0038 + warp * .003) * edge / metric;
  vec2 cover = vec2(min(1., uAspect / uImageAspect),
                    min(1., uImageAspect / uAspect));
  vec2 uv = clamp((vUv + offset - .5) * cover + .5, .001, .999);
  vec3 clean = texture2D(uClean, uv).rgb;
  vec3 fantasy = texture2D(uFantasy, uv).rgb;
  gl_FragColor = vec4(mix(clean, fantasy, reveal), 1.);
}`;

const layer = { position: 'absolute', inset: 0, width: '100%', height: '100%' };
const imageStyle = { ...layer, display: 'block', objectFit: 'cover', objectPosition: '50% 50%', pointerEvents: 'none', userSelect: 'none' };
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function shader(gl, type, source) {
  const result = gl.createShader(type);
  gl.shaderSource(result, source);
  gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
    const reason = gl.getShaderInfoLog(result);
    gl.deleteShader(result);
    throw new Error(reason || 'Liquid surface shader did not compile.');
  }
  return result;
}

/**
 * Fits its positioned parent. The parent owns zoom, typography and navigation.
 * Pointer events are observed on window so text above the canvas stays live.
 * Reduced motion / missing WebGL exposes an instantaneous, keyboard-safe toggle.
 */
export default function LiquidOffice({ className = '', reducedMotion = false, progressRef }) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [alternate, setAlternate] = useState(false);
  const [restore, setRestore] = useState(0);
  const [composition, setComposition] = useState(null);

  useEffect(() => {
    let disposed = false, image, resizeTimer = 0, fontTimer = 0;
    let lastWidth = 0, lastHeight = 0;
    function compose(force = false) {
      if (disposed || !image) return;
      const width = window.innerWidth, height = window.innerHeight;
      if (!force && width === lastWidth && height === lastHeight) return;
      lastWidth = width; lastHeight = height;
      try {
        const canvas = composeStudioTitle(image, width, height);
        setComposition({ canvas, src: canvas.toDataURL('image/png') });
      } catch {
        // A failed 2D canvas still leaves the untouched source room visible.
        setComposition(null);
      }
    }
    const font = document.fonts?.load(STUDIO_TITLE_FONT).catch(() => []);
    const fontWait = new Promise(resolve => { fontTimer = window.setTimeout(resolve, 700); });
    Promise.all([loadImage(CLEAN), Promise.race([font || Promise.resolve(), fontWait])])
      .then(([source]) => { image = source; compose(true); }).catch(() => {});
    // A slow or failed font never holds the room hostage. If it arrives later,
    // measure again so fallback text never overflows the painted wall bounds.
    font?.then(() => compose(true));
    const resize = () => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => compose(), 120); };
    window.addEventListener('resize', resize, { passive: true });
    return () => {
      disposed = true;
      clearTimeout(resizeTimer); clearTimeout(fontTimer);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    setReady(false);
    setFallback(false);
    if (reducedMotion || !composition) return undefined;

    const host = hostRef.current;
    const canvas = canvasRef.current;
    let disposed = false, lost = false, raf = 0, program, buffer;
    let visible = true, loaded = false, width = 1, height = 1, imageAspect = 16 / 9;
    let lastFrame = performance.now(), lastEvent = 0, lastSpawn = 0;
    let active = false, headStrength = 0, cursorX = .5, cursorY = .5;
    let headX = .5, headY = .5, velocityX = 0, velocityY = 0;
    const points = [];
    const packed = new Float32Array(TRAIL_COUNT * 4);
    const textures = [];
    const shaders = [];
    const locations = {};
    let gl;

    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const start = () => {
      if (!raf && !disposed && !lost && loaded && visible && !(document.hidden || document.body.classList.contains('portfolio-route-open'))) {
        lastFrame = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };

    function fail() {
      stop();
      if (!disposed) { setReady(false); setFallback(true); }
    }

    function resize() {
      width = Math.max(1, host.clientWidth);
      height = Math.max(1, host.clientHeight);
      // A capped backing store keeps full-screen fill cost reasonable. A parent
      // CSS zoom does not allocate a room-sized framebuffer on every frame.
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5, 2400 / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      if (gl && !lost) gl.viewport(0, 0, canvas.width, canvas.height);
      start();
    }

    function draw(now) {
      raf = 0;
      if (disposed || lost || !loaded || !visible || (document.hidden || document.body.classList.contains('portfolio-route-open'))) return;
      if (progressRef && progressRef.current > .165) {
        active = false; headStrength = 0; points.length = 0;
      }
      const dt = Math.min(.05, Math.max(.001, (now - lastFrame) / 1000));
      lastFrame = now;
      const headEase = 1 - Math.exp(-dt * 9);
      headX += (cursorX - headX) * headEase;
      headY += (cursorY - headY) * headEase;
      headStrength += ((active ? 1 : 0) - headStrength) * (1 - Math.exp(-dt * (active ? 5.5 : 2.6)));
      velocityX *= Math.exp(-dt * 3);
      velocityY *= Math.exp(-dt * 3);
      packed.fill(0);
      let j = 0;
      for (let i = points.length - 1; i >= 0; i--) {
        const point = points[i];
        const age = (now - point.born) / 1000;
        if (age >= TRAIL_LIFE) { points.splice(i, 1); continue; }
        const life = 1 - age / TRAIL_LIFE;
        const glide = (1 - Math.exp(-age * 2.7)) / 2.7;
        // A small, opposing lateral drift widens the wake without a prescribed
        // ribbon path. The metaball field merges intersecting pointer strokes.
        const curl = Math.sin(age * 2.4 + point.phase) * .009 * life;
        packed[j++] = point.x + point.vx * glide - point.vy * curl;
        packed[j++] = point.y + point.vy * glide + point.vx * curl;
        packed[j++] = point.radius * (1 + age * .19);
        packed[j++] = point.strength * life * life;
      }
      gl.useProgram(program);
      gl.uniform1f(locations.uAspect, width / height);
      gl.uniform1f(locations.uImageAspect, imageAspect);
      gl.uniform1f(locations.uTime, now * .001);
      gl.uniform3f(locations.uHead, headX, headY, headStrength);
      gl.uniform2f(locations.uVelocity, velocityX, velocityY);
      gl.uniform4fv(locations.uTrail, packed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      // Once the last wake has dissolved, leave a still original room on GPU.
      if (active || headStrength > .001 || points.length) raf = requestAnimationFrame(draw);
    }

    function pointer(event) {
      if (!visible || (document.hidden || document.body.classList.contains('portfolio-route-open')) || disposed || lost) return;
      if (progressRef && progressRef.current > .165) return;
      const rect = host.getBoundingClientRect();
      const inside = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 &&
        rect.top < innerHeight && rect.left < innerWidth && event.clientX >= rect.left &&
        event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) { active = false; start(); return; }
      // Use the room's visual rectangle instead of event.target so sibling
      // typography overlays can receive input without interrupting the wake.
      const now = performance.now();
      const x = clamp((event.clientX - rect.left) / rect.width);
      const y = 1 - clamp((event.clientY - rect.top) / rect.height);
      const dt = Math.max(.016, Math.min(.15, (now - lastEvent) / 1000 || .016));
      const dx = x - cursorX, dy = y - cursorY;
      if (!active || now - lastEvent > 250) { headX = x; headY = y; }
      velocityX = active ? clamp(dx / dt, -1.4, 1.4) : 0;
      velocityY = active ? clamp(dy / dt, -1.4, 1.4) : 0;
      cursorX = x; cursorY = y; active = true; lastEvent = now;
      if (now - lastSpawn > 35 && (Math.hypot(dx, dy) > .0025 || event.type === 'pointerdown')) {
        points.push({ x, y, vx: velocityX * .065, vy: velocityY * .065,
          radius: .14 + Math.min(Math.hypot(velocityX, velocityY), 1) * .037,
          strength: .58, phase: now * .017, born: now });
        if (points.length > TRAIL_COUNT) points.shift();
        lastSpawn = now;
      }
      start();
    }

    function release(event) {
      if (!event || event.pointerType !== 'mouse') { active = false; start(); }
    }
    function leave() { active = false; start(); }
    function visibility() {
      if ((document.hidden || document.body.classList.contains('portfolio-route-open'))) { active = false; headStrength = 0; points.length = 0; stop(); }
      else start();
    }
    function contextLost(event) { event.preventDefault(); lost = true; fail(); }
    function contextRestored() { if (!disposed) setRestore(value => value + 1); }

    let observer, sizeObserver;
    try {
      gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
      if (!gl) throw new Error('WebGL is unavailable.');
      const vs = shader(gl, gl.VERTEX_SHADER, VERTEX);
      shaders.push(vs);
      const fs = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
      shaders.push(fs);
      program = gl.createProgram();
      gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'aPosition');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      ['uAspect', 'uImageAspect', 'uTime', 'uHead', 'uVelocity'].forEach(name => { locations[name] = gl.getUniformLocation(program, name); });
      locations.uTrail = gl.getUniformLocation(program, 'uTrail[0]');
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

      Promise.all([Promise.resolve(composition.canvas), loadImage(FANTASY)]).then(images => {
        if (disposed || lost) return;
        imageAspect = images[0].width / images[0].height;
        images.forEach((image, index) => {
          const texture = gl.createTexture(); textures.push(texture);
          gl.activeTexture(gl.TEXTURE0 + index);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          gl.uniform1i(gl.getUniformLocation(program, ['uClean', 'uFantasy'][index]), index);
        });
        loaded = true;
        resize();
        setReady(true);
      }).catch(fail);

      observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible) start(); else { active = false; headStrength = 0; points.length = 0; stop(); }
      }, { threshold: 0 });
      observer.observe(host);
      sizeObserver = new ResizeObserver(resize);
      sizeObserver.observe(host);
      window.addEventListener('pointermove', pointer, { passive: true });
      window.addEventListener('pointerdown', pointer, { passive: true });
      window.addEventListener('pointerup', release, { passive: true });
      window.addEventListener('pointercancel', leave, { passive: true });
      window.addEventListener('blur', leave);
      document.documentElement.addEventListener('pointerleave', leave);
      document.addEventListener('visibilitychange', visibility);
      canvas.addEventListener('webglcontextlost', contextLost);
      canvas.addEventListener('webglcontextrestored', contextRestored);
      resize();
    } catch { fail(); }

    return () => {
      disposed = true;
      stop();
      observer?.disconnect(); sizeObserver?.disconnect();
      window.removeEventListener('pointermove', pointer);
      window.removeEventListener('pointerdown', pointer);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', leave);
      window.removeEventListener('blur', leave);
      document.documentElement.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      if (gl) {
        textures.forEach(texture => gl.deleteTexture(texture));
        shaders.forEach(value => gl.deleteShader(value));
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
      }
    };
  }, [reducedMotion, restore, composition]);

  const staticControl = reducedMotion || fallback;
  return (
    <div ref={hostRef} className={`liquid-office ${className}`} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#171d14' }}>
      <img src={composition?.src || CLEAN} alt="PORTFOLIO — 工作室的书桌、电脑与窗外景色" draggable="false" style={imageStyle} />
      {staticControl && <img src={FANTASY} alt="" aria-hidden="true" draggable="false" style={{ ...imageStyle, opacity: alternate ? 1 : 0 }} />}
      <canvas ref={canvasRef} aria-hidden="true" style={{ ...layer, display: 'block', opacity: ready && !staticControl ? 1 : 0, pointerEvents: 'auto', touchAction: 'pan-y' }} />
      {staticControl && (
        <button type="button" aria-pressed={alternate} onClick={() => setAlternate(value => !value)}
          style={{ position: 'absolute', zIndex: 2, right: 24, bottom: 24, minHeight: 44, padding: '10px 18px', border: '1px solid rgba(255,255,255,.65)', borderRadius: 999, background: 'rgba(12,25,17,.82)', color: '#fff', font: 'inherit', cursor: 'pointer' }}>
          {alternate ? '回到工作室' : '另一种可能'}
        </button>
      )}
    </div>
  );
}
