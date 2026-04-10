import type p5 from "p5"
import { generateGalaxyPositions } from "./galaxyLayout"

export type ParticleState = "logo" | "galaxy"

export interface SketchConfig {
  logoPoints: Array<{ x: number; y: number }>
  width: number
  height: number
  particleCount: number
}

export interface SketchAPI {
  setState: (state: ParticleState) => void
  setBridgeProgress: (progress: number) => void
  setMouse: (x: number, y: number) => void
  applyClickImpulse: (clickX: number, clickY: number) => void
  dispose: () => void
}

const SPRING = {
  LOGO_TO_GALAXY: 0.018,
  GALAXY_TO_LOGO: 0.022,
} as const

const DAMPING = 0.88

const IDLE = {
  LOGO_AMPLITUDE: 1.0,
  GALAXY_AMPLITUDE: 2.5,
} as const

const PARALLAX_STRENGTH = 12

interface Particle {
  logoX: number
  logoY: number
  galaxyX: number
  galaxyY: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  phase: number
  distFromCenter: number
  stagger: number
}

export interface SketchBundle {
  sketch: (p: p5) => void
  api: SketchAPI
}

export function createHeroSketch(config: SketchConfig): SketchBundle {
  let targetState: ParticleState = "logo"
  let bridgeProgress = 0
  let mouseX = config.width / 2
  let mouseY = config.height / 2
  const particles: Particle[] = []
  let p5Instance: p5 | null = null

  const api: SketchAPI = {
    setState(state: ParticleState) {
      targetState = state
    },
    setBridgeProgress(progress: number) {
      bridgeProgress = Math.max(0, Math.min(1, progress))
    },
    setMouse(x: number, y: number) {
      mouseX = x
      mouseY = y
    },
    applyClickImpulse(clickX: number, clickY: number) {
      const impactRadius = Math.min(config.width, config.height) * 0.25
      for (const particle of particles) {
        const dx = particle.x - clickX
        const dy = particle.y - clickY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < impactRadius && dist > 0.1) {
          const strength = ((impactRadius - dist) / impactRadius) * 0.8
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

    const galaxyPositions = generateGalaxyPositions(
      config.particleCount,
      config.width,
      config.height
    )

    const logoPoints = resizePoints(config.logoPoints, config.particleCount)

    for (let i = 0; i < config.particleCount; i++) {
      const lp = logoPoints[i]
      const gp = galaxyPositions[i]
      const dx = lp.x - centerX
      const dy = lp.y - centerY
      const dist = Math.sqrt(dx * dx + dy * dy) || 1

      particles.push({
        logoX: lp.x,
        logoY: lp.y,
        galaxyX: gp.x,
        galaxyY: gp.y,
        x: lp.x,
        y: lp.y,
        vx: 0,
        vy: 0,
        size: 0.5 + (i % 5) * 0.25,
        alpha: 0.7 + (i % 3) * 0.1,
        phase: (i / config.particleCount) * Math.PI * 2,
        distFromCenter: dist,
        stagger: 0,
      })
    }

    const maxDist = Math.max(...particles.map((pt) => pt.distFromCenter), 1)
    for (const particle of particles) {
      particle.stagger = particle.distFromCenter / maxDist
    }

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

      const parallaxX = ((mouseX - w / 2) / w) * PARALLAX_STRENGTH
      const parallaxY = ((mouseY - h / 2) / h) * PARALLAX_STRENGTH

      const isLogo = targetState === "logo"
      const stiffness = isLogo ? SPRING.GALAXY_TO_LOGO : SPRING.LOGO_TO_GALAXY
      const idleAmp = isLogo ? IDLE.LOGO_AMPLITUDE : IDLE.GALAXY_AMPLITUDE

      for (const particle of particles) {
        const targetX = isLogo ? particle.logoX : particle.galaxyX
        const targetY = isLogo ? particle.logoY : particle.galaxyY

        const staggerDelay = isLogo
          ? (1 - particle.stagger) * 0.15
          : particle.stagger * 0.15

        const noiseX = (p.noise(particle.phase + t * 0.3, 0) - 0.5) * 2 * idleAmp
        const noiseY = (p.noise(0, particle.phase + t * 0.3) - 0.5) * 2 * idleAmp

        const goalX = targetX + noiseX + parallaxX
        const goalY = targetY + noiseY + parallaxY

        const effectiveStiffness = stiffness * (1 - staggerDelay)
        const forceX = (goalX - particle.x) * effectiveStiffness
        const forceY = (goalY - particle.y) * effectiveStiffness

        particle.vx += forceX
        particle.vy += forceY
        particle.vx *= DAMPING
        particle.vy *= DAMPING
        particle.x += particle.vx
        particle.y += particle.vy

        let drawX = particle.x * dpr
        let drawY = particle.y * dpr
        let drawAlpha = particle.alpha

        if (bridgeProgress > 0) {
          const cxDpr = (w / 2) * dpr
          const cyDpr = (h / 2) * dpr
          const funnelY = h * 0.74 * dpr
          const scatterX = drawX - cxDpr
          const scatterY = drawY - cyDpr
          const scatterDist = Math.sqrt(scatterX * scatterX + scatterY * scatterY) || 1
          const scatterNx = scatterX / scatterDist
          const scatterNy = scatterY / scatterDist

          if (bridgeProgress < 0.22) {
            const hold = bridgeProgress / 0.22
            const holdEase = hold * hold * (3 - 2 * hold)
            const tremor = (0.6 + particle.stagger * 2.1) * dpr
            drawX += Math.cos(t * 7 + particle.phase * 1.7) * tremor * holdEase
            drawY += Math.sin(t * 8 + particle.phase * 1.3) * tremor * holdEase
            drawAlpha *= 1 - holdEase * 0.04
          } else if (bridgeProgress < 0.52) {
            const shatter = (bridgeProgress - 0.22) / 0.3
            const shatterEase = 1 - Math.pow(1 - shatter, 3)
            const blast = (28 + particle.stagger * 220) * dpr
            const spin = particle.phase + t * (1.2 + particle.stagger * 1.4)
            drawX += scatterNx * blast * shatterEase + Math.cos(spin) * 14 * dpr * (1 - shatter)
            drawY += scatterNy * blast * shatterEase + Math.sin(spin) * 14 * dpr * (1 - shatter)
            drawAlpha *= 1 - shatter * 0.08
          } else if (bridgeProgress < 0.82) {
            const funnel = (bridgeProgress - 0.52) / 0.3
            const funnelEase = funnel * funnel * (3 - 2 * funnel)
            const swirl = (1 - funnelEase) * (42 + particle.stagger * 54) * dpr
            const swirlAngle = particle.phase * 0.85 + t * (2.2 + particle.stagger)
            const targetX = cxDpr + Math.cos(swirlAngle) * swirl * (0.2 + particle.stagger * 0.35)
            const targetY = cyDpr + (funnelY - cyDpr) * funnelEase + Math.sin(swirlAngle) * swirl * 0.16
            drawX += (targetX - drawX) * (0.42 + funnelEase * 0.34)
            drawY += (targetY - drawY) * (0.34 + funnelEase * 0.46)
            drawAlpha *= 1 - funnel * 0.18
          } else {
            const handoff = (bridgeProgress - 0.82) / 0.18
            const handoffEase = handoff * handoff
            const cluster = (18 * (1 - handoffEase) + 4) * dpr
            const angle = particle.phase + t * 0.4
            const targetX = cxDpr + Math.cos(angle) * cluster
            const targetY = funnelY + Math.sin(angle) * cluster * 0.22
            drawX += (targetX - drawX) * 0.72
            drawY += (targetY - drawY) * 0.82
            drawAlpha *= Math.max(0, 1 - handoffEase * 1.7)
          }
        }

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
