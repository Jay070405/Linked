"use client"

import { useEffect, useRef } from "react"

const CONFIG = {
  SIM_RES: 128,
  DYE_RES: 512,
  PRESSURE_ITERS: 16,
  CURL: 25,
  SPLAT_RADIUS: 0.15,
  SPLAT_FORCE: 3500,
  DENSITY_DISSIPATION: 0.96,
  VELOCITY_DISSIPATION: 0.97,
  PRESSURE_VAL: 0.8,
}

const VERT = `
precision highp float;
attribute vec2 aPosition;
varying vec2 vUv;
varying vec2 vL, vR, vT, vB;
uniform vec2 texelSize;
void main(){
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const SPLAT_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main(){
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}
`

const ADVECTION_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
void main(){
  vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
  vec4 result = texture2D(uSource, coord);
  float decay = 1.0 + dissipation * dt;
  gl_FragColor = result / decay;
}
`

const DIVERGENCE_FRAG = `
precision mediump float;
varying highp vec2 vUv;
varying highp vec2 vL, vR, vT, vB;
uniform sampler2D uVelocity;
void main(){
  float L = texture2D(uVelocity, vL).x;
  float R = texture2D(uVelocity, vR).x;
  float T = texture2D(uVelocity, vT).y;
  float B = texture2D(uVelocity, vB).y;
  vec2 C = texture2D(uVelocity, vUv).xy;
  if(vL.x < 0.0) L = -C.x;
  if(vR.x > 1.0) R = -C.x;
  if(vT.y > 1.0) T = -C.y;
  if(vB.y < 0.0) B = -C.y;
  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
`

const CURL_FRAG = `
precision mediump float;
varying highp vec2 vUv;
varying highp vec2 vL, vR, vT, vB;
uniform sampler2D uVelocity;
void main(){
  float L = texture2D(uVelocity, vL).y;
  float R = texture2D(uVelocity, vR).y;
  float T = texture2D(uVelocity, vT).x;
  float B = texture2D(uVelocity, vB).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
`

const VORTICITY_FRAG = `
precision highp float;
varying vec2 vUv;
varying vec2 vL, vR, vT, vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
void main(){
  float L = texture2D(uCurl, vL).x;
  float R = texture2D(uCurl, vR).x;
  float T = texture2D(uCurl, vT).x;
  float B = texture2D(uCurl, vB).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 vel = texture2D(uVelocity, vUv).xy;
  vel += force * dt;
  vel = min(max(vel, -1000.0), 1000.0);
  gl_FragColor = vec4(vel, 0.0, 1.0);
}
`

const PRESSURE_FRAG = `
precision mediump float;
varying highp vec2 vUv;
varying highp vec2 vL, vR, vT, vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main(){
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  float divergence = texture2D(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`

const GRADIENT_FRAG = `
precision mediump float;
varying highp vec2 vUv;
varying highp vec2 vL, vR, vT, vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main(){
  float L = texture2D(uPressure, vL).x;
  float R = texture2D(uPressure, vR).x;
  float T = texture2D(uPressure, vT).x;
  float B = texture2D(uPressure, vB).x;
  vec2 vel = texture2D(uVelocity, vUv).xy;
  vel.xy -= vec2(R - L, T - B);
  gl_FragColor = vec4(vel, 0.0, 1.0);
}
`

const CLEAR_FRAG = `
precision mediump float;
varying highp vec2 vUv;
uniform sampler2D uTexture;
uniform float value;
void main(){
  gl_FragColor = value * texture2D(uTexture, vUv);
}
`

const DISPLAY_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
void main(){
  vec3 c = texture2D(uTexture, vUv).rgb;
  float a = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c, a * 0.9);
}
`

interface FBO {
  texture: WebGLTexture
  fbo: WebGLFramebuffer
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
  attach: (id: number) => number
}

interface DoubleFBO {
  width: number
  height: number
  texelSizeX: number
  texelSizeY: number
  read: FBO
  write: FBO
  swap: () => void
}

interface Program {
  program: WebGLProgram
  uniforms: Record<string, WebGLUniformLocation>
}

export function FluidCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
      premultipliedAlpha: false,
    }) as WebGL2RenderingContext | null

    if (!gl) return

    gl.getExtension("EXT_color_buffer_float")
    gl.clearColor(0, 0, 0, 0)

    const texType = gl.HALF_FLOAT
    const rgba = { internalFormat: gl.RGBA16F, format: gl.RGBA }
    const rg = { internalFormat: gl.RG16F, format: gl.RG }
    const r = { internalFormat: gl.R16F, format: gl.RED }

    function formatSupported(intFmt: number, fmt: number): boolean {
      const tex = gl!.createTexture()
      gl!.bindTexture(gl!.TEXTURE_2D, tex)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.NEAREST)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE)
      gl!.texImage2D(gl!.TEXTURE_2D, 0, intFmt, 4, 4, 0, fmt, texType, null)
      const fb = gl!.createFramebuffer()
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fb)
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, tex, 0)
      const ok = gl!.checkFramebufferStatus(gl!.FRAMEBUFFER) === gl!.FRAMEBUFFER_COMPLETE
      gl!.deleteTexture(tex)
      gl!.deleteFramebuffer(fb)
      return ok
    }

    const simFmt = formatSupported(rg.internalFormat, rg.format) ? rg : rgba
    const scalarFmt = formatSupported(r.internalFormat, r.format) ? r : rgba

    function compileShader(type: number, source: string): WebGLShader {
      const s = gl!.createShader(type)!
      gl!.shaderSource(s, source)
      gl!.compileShader(s)
      return s
    }

    function createProg(vs: string, fs: string): Program {
      const p = gl!.createProgram()!
      gl!.attachShader(p, compileShader(gl!.VERTEX_SHADER, vs))
      gl!.attachShader(p, compileShader(gl!.FRAGMENT_SHADER, fs))
      gl!.linkProgram(p)

      const uniforms: Record<string, WebGLUniformLocation> = {}
      const count = gl!.getProgramParameter(p, gl!.ACTIVE_UNIFORMS)
      for (let i = 0; i < count; i++) {
        const info = gl!.getActiveUniform(p, i)!
        uniforms[info.name] = gl!.getUniformLocation(p, info.name)!
      }
      return { program: p, uniforms }
    }

    const splatProg = createProg(VERT, SPLAT_FRAG)
    const advectionProg = createProg(VERT, ADVECTION_FRAG)
    const divergenceProg = createProg(VERT, DIVERGENCE_FRAG)
    const curlProg = createProg(VERT, CURL_FRAG)
    const vorticityProg = createProg(VERT, VORTICITY_FRAG)
    const pressureProg = createProg(VERT, PRESSURE_FRAG)
    const gradientProg = createProg(VERT, GRADIENT_FRAG)
    const clearProg = createProg(VERT, CLEAR_FRAG)
    const displayProg = createProg(VERT, DISPLAY_FRAG)

    const quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(0)

    function createFBO(w: number, h: number, intFmt: number, fmt: number, filtering: number): FBO {
      gl!.activeTexture(gl!.TEXTURE0)
      const tex = gl!.createTexture()!
      gl!.bindTexture(gl!.TEXTURE_2D, tex)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, filtering)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, filtering)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE)
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE)
      gl!.texImage2D(gl!.TEXTURE_2D, 0, intFmt, w, h, 0, fmt, texType, null)
      const fbo = gl!.createFramebuffer()!
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo)
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, tex, 0)
      gl!.viewport(0, 0, w, h)
      gl!.clear(gl!.COLOR_BUFFER_BIT)

      return {
        texture: tex, fbo, width: w, height: h,
        texelSizeX: 1.0 / w, texelSizeY: 1.0 / h,
        attach(id: number) { gl!.activeTexture(gl!.TEXTURE0 + id); gl!.bindTexture(gl!.TEXTURE_2D, tex); return id },
      }
    }

    function createDoubleFBO(w: number, h: number, intFmt: number, fmt: number, filtering: number): DoubleFBO {
      let fbo1 = createFBO(w, h, intFmt, fmt, filtering)
      let fbo2 = createFBO(w, h, intFmt, fmt, filtering)
      return {
        width: w, height: h, texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
        get read() { return fbo1 },
        set read(v) { fbo1 = v },
        get write() { return fbo2 },
        set write(v) { fbo2 = v },
        swap() { const t = fbo1; fbo1 = fbo2; fbo2 = t },
      }
    }

    function resAspect(res: number): { width: number; height: number } {
      const ar = gl!.canvas.width / gl!.canvas.height
      return ar < 1
        ? { width: Math.ceil(res * ar), height: res }
        : { width: res, height: Math.ceil(res / ar) }
    }

    const sim = resAspect(CONFIG.SIM_RES)
    const dye = resAspect(CONFIG.DYE_RES)

    let velocity = createDoubleFBO(sim.width, sim.height, simFmt.internalFormat, simFmt.format, gl.LINEAR)
    let density = createDoubleFBO(dye.width, dye.height, rgba.internalFormat, rgba.format, gl.LINEAR)
    let divergenceFbo = createFBO(sim.width, sim.height, scalarFmt.internalFormat, scalarFmt.format, gl.NEAREST)
    let curlFbo = createFBO(sim.width, sim.height, scalarFmt.internalFormat, scalarFmt.format, gl.NEAREST)
    let pressure = createDoubleFBO(sim.width, sim.height, scalarFmt.internalFormat, scalarFmt.format, gl.NEAREST)

    function blit(target: FBO | null) {
      if (target) {
        gl!.viewport(0, 0, target.width, target.height)
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, target.fbo)
      } else {
        gl!.viewport(0, 0, gl!.drawingBufferWidth, gl!.drawingBufferHeight)
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, null)
      }
      gl!.drawArrays(gl!.TRIANGLE_FAN, 0, 4)
    }

    function splat(x: number, y: number, dx: number, dy: number, color: [number, number, number]) {
      gl!.useProgram(splatProg.program)
      gl!.uniform1i(splatProg.uniforms.uTarget, velocity.read.attach(0))
      gl!.uniform1f(splatProg.uniforms.aspectRatio, canvas!.width / canvas!.height)
      gl!.uniform2f(splatProg.uniforms.point, x, y)
      gl!.uniform3f(splatProg.uniforms.color, dx, dy, 0.0)
      gl!.uniform1f(splatProg.uniforms.radius, correctRadius(CONFIG.SPLAT_RADIUS / 100))
      blit(velocity.write)
      velocity.swap()

      gl!.uniform1i(splatProg.uniforms.uTarget, density.read.attach(0))
      gl!.uniform3f(splatProg.uniforms.color, color[0], color[1], color[2])
      blit(density.write)
      density.swap()
    }

    function correctRadius(r: number): number {
      const ar = canvas!.width / canvas!.height
      return ar > 1 ? r * ar : r
    }

    function step(dt: number) {
      gl!.disable(gl!.BLEND)

      // Curl
      gl!.useProgram(curlProg.program)
      gl!.uniform2f(curlProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl!.uniform1i(curlProg.uniforms.uVelocity, velocity.read.attach(0))
      blit(curlFbo)

      // Vorticity
      gl!.useProgram(vorticityProg.program)
      gl!.uniform2f(vorticityProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl!.uniform1i(vorticityProg.uniforms.uVelocity, velocity.read.attach(0))
      gl!.uniform1i(vorticityProg.uniforms.uCurl, curlFbo.attach(1))
      gl!.uniform1f(vorticityProg.uniforms.curl, CONFIG.CURL)
      gl!.uniform1f(vorticityProg.uniforms.dt, dt)
      blit(velocity.write)
      velocity.swap()

      // Advect velocity
      gl!.useProgram(advectionProg.program)
      gl!.uniform2f(advectionProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl!.uniform1i(advectionProg.uniforms.uVelocity, velocity.read.attach(0))
      gl!.uniform1i(advectionProg.uniforms.uSource, velocity.read.attach(0))
      gl!.uniform1f(advectionProg.uniforms.dt, dt)
      gl!.uniform1f(advectionProg.uniforms.dissipation, CONFIG.VELOCITY_DISSIPATION)
      blit(velocity.write)
      velocity.swap()

      // Advect density
      gl!.uniform2f(advectionProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl!.uniform1i(advectionProg.uniforms.uVelocity, velocity.read.attach(0))
      gl!.uniform1i(advectionProg.uniforms.uSource, density.read.attach(1))
      gl!.uniform1f(advectionProg.uniforms.dissipation, CONFIG.DENSITY_DISSIPATION)
      blit(density.write)
      density.swap()

      // Divergence
      gl!.useProgram(divergenceProg.program)
      gl!.uniform2f(divergenceProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl!.uniform1i(divergenceProg.uniforms.uVelocity, velocity.read.attach(0))
      blit(divergenceFbo)

      // Clear pressure
      gl!.useProgram(clearProg.program)
      gl!.uniform1i(clearProg.uniforms.uTexture, pressure.read.attach(0))
      gl!.uniform1f(clearProg.uniforms.value, CONFIG.PRESSURE_VAL)
      blit(pressure.write)
      pressure.swap()

      // Pressure solve (Jacobi iterations)
      gl!.useProgram(pressureProg.program)
      gl!.uniform2f(pressureProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl!.uniform1i(pressureProg.uniforms.uDivergence, divergenceFbo.attach(0))
      for (let i = 0; i < CONFIG.PRESSURE_ITERS; i++) {
        gl!.uniform1i(pressureProg.uniforms.uPressure, pressure.read.attach(1))
        blit(pressure.write)
        pressure.swap()
      }

      // Gradient subtract
      gl!.useProgram(gradientProg.program)
      gl!.uniform2f(gradientProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY)
      gl!.uniform1i(gradientProg.uniforms.uPressure, pressure.read.attach(0))
      gl!.uniform1i(gradientProg.uniforms.uVelocity, velocity.read.attach(1))
      blit(velocity.write)
      velocity.swap()
    }

    function render() {
      gl!.enable(gl!.BLEND)
      gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA)
      gl!.useProgram(displayProg.program)
      gl!.uniform1i(displayProg.uniforms.uTexture, density.read.attach(0))
      blit(null)
    }

    // ── Pointer tracking ──
    const pointer = { x: 0, y: 0, prevX: 0, prevY: 0, moved: false, down: false }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect()
      pointer.prevX = pointer.x
      pointer.prevY = pointer.y
      pointer.x = (e.clientX - rect.left) / rect.width
      pointer.y = 1.0 - (e.clientY - rect.top) / rect.height
      pointer.moved = true
    }

    function onPointerDown() { pointer.down = true }
    function onPointerUp() { pointer.down = false }

    window.addEventListener("pointermove", onPointerMove, { passive: true })
    window.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointerup", onPointerUp)

    // ── Resize ──
    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 1.5)
      canvas!.width = Math.floor(canvas!.clientWidth * dpr)
      canvas!.height = Math.floor(canvas!.clientHeight * dpr)
    }
    resize()
    window.addEventListener("resize", resize)

    // ── Color generation ──
    function randomColor(): [number, number, number] {
      const palettes: [number, number, number][] = [
        [0.18, 0.12, 0.04],
        [0.04, 0.1, 0.2],
        [0.15, 0.06, 0.12],
        [0.05, 0.15, 0.1],
        [0.2, 0.08, 0.03],
        [0.06, 0.04, 0.18],
      ]
      return palettes[Math.floor(Math.random() * palettes.length)]
    }

    // ── Random ambient splats ──
    let ambientTimer = 0
    function ambientSplat() {
      const x = Math.random()
      const y = Math.random()
      const dx = (Math.random() - 0.5) * 1000
      const dy = (Math.random() - 0.5) * 1000
      splat(x, y, dx, dy, randomColor())
    }

    // ── Main loop ──
    let lastTime = Date.now()
    let raf = 0

    function loop() {
      const now = Date.now()
      let dt = (now - lastTime) / 1000
      dt = Math.min(dt, 0.016666)
      lastTime = now

      if (pointer.moved) {
        pointer.moved = false
        const dx = (pointer.x - pointer.prevX) * CONFIG.SPLAT_FORCE
        const dy = (pointer.y - pointer.prevY) * CONFIG.SPLAT_FORCE
        splat(pointer.x, pointer.y, dx, dy, randomColor())
      }

      ambientTimer += dt
      if (ambientTimer > 5.0) {
        ambientTimer = 0
        ambientSplat()
      }

      step(dt)
      render()
      raf = requestAnimationFrame(loop)
    }

    setTimeout(() => {
      for (let i = 0; i < 2; i++) ambientSplat()
    }, 200)

    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{
        zIndex: 9999,
        pointerEvents: "none",
        opacity: 0.3,
        mixBlendMode: "screen",
      }}
    />
  )
}
