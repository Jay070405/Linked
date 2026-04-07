import type p5 from "p5"

// ─── Types ───────────────────────────────────────────────────────────

export interface LogoSkillsSketchConfig {
  logoPoints: Array<{ x: number; y: number }>
  width: number
  height: number
  particleCount: number
}

export interface LogoSkillsSketchAPI {
  setScrollProgress: (progress: number) => void
  setMouse: (x: number, y: number) => void
  applyClickImpulse: (clickX: number, clickY: number) => void
  dispose: () => void
}

export interface LogoSkillsSketchBundle {
  sketch: (p: p5) => void
  api: LogoSkillsSketchAPI
}

// ─── Physics Constants ───────────────────────────────────────────────

const SPRING_STIFFNESS = 0.025
const DAMPING = 0.88

const REPEL_RADIUS = 100
const REPEL_STRENGTH = 0.6

const IDLE_AMPLITUDE = 1.0
const PARALLAX_STRENGTH = 10

// ─── Particle ────────────────────────────────────────────────────────

interface Particle {
  logoX: number
  logoY: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseAlpha: number
  phase: number
  distFromCenter: number
  stagger: number
}

// ─── Sketch Factory ──────────────────────────────────────────────────

export function createLogoSkillsSketch(
  config: LogoSkillsSketchConfig
): LogoSkillsSketchBundle {
  let scrollProgress = 0
  let mouseX = config.width / 2
  let mouseY = config.height / 2
  const particles: Particle[] = []
  let p5Instance: p5 | null = null

  const api: LogoSkillsSketchAPI = {
    setScrollProgress(progress: number) {
      scrollProgress = Math.max(0, Math.min(1, progress))
    },
    setMouse(x: number, y: number) {
      mouseX = x
      mouseY = y
    },
    applyClickImpulse(clickX: number, clickY: number) {
      const impactRadius = Math.min(config.width, config.height) * 0.4
      for (const particle of particles) {
        const dx = particle.x - clickX
        const dy = particle.y - clickY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < impactRadius && dist > 0.1) {
          const strength = ((impactRadius - dist) / impactRadius) * 2.5
          particle.vx += (dx / dist) * strength
          particle.vy += (dy / dist) * strength
        }
      }
    },
    dispose() {
      if (p5Instance) p5Instance.remove()
    },
  }

  const sketch = (p: p5): void => {
    p5Instance = p

    const centerX = config.width / 2
    const centerY = config.height / 2

    const logoPoints = resizePoints(config.logoPoints, config.particleCount)

    // Initialize particles at logo positions
    for (let i = 0; i < config.particleCount; i++) {
      const lp = logoPoints[i]
      const dx = lp.x - centerX
      const dy = lp.y - centerY
      const dist = Math.sqrt(dx * dx + dy * dy) || 1

      particles.push({
        logoX: lp.x,
        logoY: lp.y,
        x: lp.x,
        y: lp.y,
        vx: 0,
        vy: 0,
        size: 0.5 + (i % 5) * 0.25,
        baseAlpha: 0.7 + (i % 3) * 0.1,
        phase: (i / config.particleCount) * Math.PI * 2,
        distFromCenter: dist,
        stagger: 0,
      })
    }

    // Normalize stagger 0–1 based on distance from center
    const maxDist = Math.max(...particles.map((pt) => pt.distFromCenter), 1)
    for (const particle of particles) {
      particle.stagger = particle.distFromCenter / maxDist
    }

    // ─── p5 lifecycle ────────────────────────────────────────────

    p.setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const canvas = p.createCanvas(config.width * dpr, config.height * dpr)
      canvas.style("width", `${config.width}px`)
      canvas.style("height", `${config.height}px`)
      p.pixelDensity(1)
      p.noStroke()
    }

    p.draw = () => {
      if (document.hidden) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = config.width
      const h = config.height
      const t = p.millis() * 0.001

      p.clear()

      // Parallax offset from mouse
      const parallaxX = ((mouseX - w / 2) / w) * PARALLAX_STRENGTH
      const parallaxY = ((mouseY - h / 2) / h) * PARALLAX_STRENGTH

      // Named explosion phase
      const EXPLODE_START = 0.64
      const EXPLODE_END = 0.92
      const rawExplosionT =
        scrollProgress <= EXPLODE_START
          ? 0
          : scrollProgress >= EXPLODE_END
            ? 1
            : (scrollProgress - EXPLODE_START) / (EXPLODE_END - EXPLODE_START)
      const explosionT = Math.max(0, Math.min(1, rawExplosionT))
      const isExploding = explosionT > 0

      for (const particle of particles) {
        // ─── Hover repulsion ───────────────────────────────────
        let repelForceX = 0
        let repelForceY = 0

        if (!isExploding) {
          const dmx = particle.x - mouseX
          const dmy = particle.y - mouseY
          const mouseDist = Math.sqrt(dmx * dmx + dmy * dmy)
          if (mouseDist < REPEL_RADIUS && mouseDist > 0.1) {
            const force =
              ((REPEL_RADIUS - mouseDist) / REPEL_RADIUS) * REPEL_STRENGTH
            repelForceX = (dmx / mouseDist) * force
            repelForceY = (dmy / mouseDist) * force
          }
        }

        // ─── Spring to logo position (when not exploding) ──────
        if (!isExploding) {
          const noiseX =
            (p.noise(particle.phase + t * 0.3, 0) - 0.5) * 2 * IDLE_AMPLITUDE
          const noiseY =
            (p.noise(0, particle.phase + t * 0.3) - 0.5) * 2 * IDLE_AMPLITUDE

          const goalX = particle.logoX + noiseX + parallaxX
          const goalY = particle.logoY + noiseY + parallaxY

          const forceX = (goalX - particle.x) * SPRING_STIFFNESS
          const forceY = (goalY - particle.y) * SPRING_STIFFNESS

          particle.vx += forceX + repelForceX
          particle.vy += forceY + repelForceY
          particle.vx *= DAMPING
          particle.vy *= DAMPING
          particle.x += particle.vx
          particle.y += particle.vy
        }

        // ─── Draw ──────────────────────────────────────────────
        let drawX = particle.x * dpr
        let drawY = particle.y * dpr
        let drawAlpha = particle.baseAlpha

        // ─── Scroll explosion (0.64 → 0.92) ───────────────────
        if (isExploding) {
          const dx = particle.x - centerX
          const dy = particle.y - centerY
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))

          // Cubic easing for slow ramp-up — tunable starting point
          const easedT = explosionT * explosionT * explosionT
          const burstDist = easedT * 180

          const offsetX = (dx / dist) * burstDist
          const offsetY = (dy / dist) * burstDist

          // Extended downward drift
          const driftY = explosionT * 60 * particle.stagger

          drawX = (particle.x + offsetX) * dpr
          drawY = (particle.y + offsetY + driftY) * dpr

          // Alpha fade: fast at edges, slow at center — stretched over wider range
          const fadeBias = 0.25 + particle.stagger * 0.75
          drawAlpha *= Math.max(0, 1 - explosionT * fadeBias)
        }

        // ─── Entrance fade (0 → 0.15) ─────────────────────────
        if (scrollProgress < 0.15) {
          drawAlpha *= scrollProgress / 0.15
        }

        // Render particle
        if (drawAlpha > 0.01) {
          const drawSize = particle.size * dpr
          p.fill(240, 240, 240, drawAlpha * 255)
          p.ellipse(drawX, drawY, drawSize * 2, drawSize * 2)
        }
      }
    }
  }

  return { sketch, api }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function resizePoints(
  points: Array<{ x: number; y: number }>,
  count: number
): Array<{ x: number; y: number }> {
  if (points.length === 0) {
    return Array.from({ length: count }, () => ({ x: 0, y: 0 }))
  }
  if (points.length === count) return points

  const result: Array<{ x: number; y: number }> = []
  for (let i = 0; i < count; i++) {
    const index = Math.floor((i / count) * points.length) % points.length
    result.push(points[index])
  }
  return result
}
