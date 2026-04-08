import type p5 from "p5"

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

const SPRING_STIFFNESS = 0.025
const DAMPING = 0.88

const REPEL_RADIUS = 100
const REPEL_STRENGTH = 0.6

const IDLE_AMPLITUDE = 1.0
const PARALLAX_STRENGTH = 10

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

export function createLogoSkillsSketch(config: LogoSkillsSketchConfig): LogoSkillsSketchBundle {
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
      if (p5Instance) {
        p5Instance.remove()
      }
    },
  }

  const sketch = (p: p5): void => {
    p5Instance = p

    const centerX = config.width / 2
    const centerY = config.height / 2
    const logoPoints = resizePoints(config.logoPoints, config.particleCount)

    for (let i = 0; i < config.particleCount; i++) {
      const point = logoPoints[i]
      const dx = point.x - centerX
      const dy = point.y - centerY
      const dist = Math.sqrt(dx * dx + dy * dy) || 1

      particles.push({
        logoX: point.x,
        logoY: point.y,
        x: point.x,
        y: point.y,
        vx: 0,
        vy: 0,
        size: 0.5 + (i % 5) * 0.25,
        baseAlpha: 0.7 + (i % 3) * 0.1,
        phase: (i / config.particleCount) * Math.PI * 2,
        distFromCenter: dist,
        stagger: 0,
      })
    }

    const maxDist = Math.max(...particles.map((particle) => particle.distFromCenter), 1)
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
      const width = config.width
      const height = config.height
      const time = p.millis() * 0.001

      p.clear()

      const parallaxX = ((mouseX - width / 2) / width) * PARALLAX_STRENGTH
      const parallaxY = ((mouseY - height / 2) / height) * PARALLAX_STRENGTH

      const EXPLODE_START = 0.55
      const DISPERSION_END = 0.82
      const FADE_END = 0.94

      const rawTravelT =
        scrollProgress <= EXPLODE_START
          ? 0
          : scrollProgress >= DISPERSION_END
            ? 1
            : (scrollProgress - EXPLODE_START) / (DISPERSION_END - EXPLODE_START)
      const rawFadeT =
        scrollProgress <= DISPERSION_END
          ? 0
          : scrollProgress >= FADE_END
            ? 1
            : (scrollProgress - DISPERSION_END) / (FADE_END - DISPERSION_END)

      const travelT = Math.max(0, Math.min(1, rawTravelT))
      const fadeT = Math.max(0, Math.min(1, rawFadeT))
      const isExploding = travelT > 0 || fadeT > 0

      for (const particle of particles) {
        let repelForceX = 0
        let repelForceY = 0

        if (!isExploding) {
          const dmx = particle.x - mouseX
          const dmy = particle.y - mouseY
          const mouseDist = Math.sqrt(dmx * dmx + dmy * dmy)

          if (mouseDist < REPEL_RADIUS && mouseDist > 0.1) {
            const force = ((REPEL_RADIUS - mouseDist) / REPEL_RADIUS) * REPEL_STRENGTH
            repelForceX = (dmx / mouseDist) * force
            repelForceY = (dmy / mouseDist) * force
          }
        }

        if (!isExploding) {
          const noiseX = (p.noise(particle.phase + time * 0.3, 0) - 0.5) * 2 * IDLE_AMPLITUDE
          const noiseY = (p.noise(0, particle.phase + time * 0.3) - 0.5) * 2 * IDLE_AMPLITUDE

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

        let drawX = particle.x * dpr
        let drawY = particle.y * dpr
        let drawAlpha = particle.baseAlpha

        if (isExploding) {
          const dx = particle.x - centerX
          const dy = particle.y - centerY
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
          const easedTravelT = Math.pow(travelT, 1.35)
          const burstDist = easedTravelT * (240 + particle.stagger * 180)
          const offsetX = (dx / dist) * burstDist
          const offsetY = (dy / dist) * burstDist
          const driftY = easedTravelT * (72 + particle.stagger * 150)
          const fadeScatter = fadeT * (70 + particle.stagger * 130)

          drawX = (particle.x + offsetX + (dx / dist) * fadeScatter) * dpr
          drawY = (particle.y + offsetY + driftY + (dy / dist) * fadeScatter * 0.35) * dpr

          const dispersionFade = 1 - travelT * (0.18 + particle.stagger * 0.12)
          const fadeBias = 0.72 + particle.stagger * 0.4
          drawAlpha *= Math.max(0, dispersionFade)
          drawAlpha *= Math.max(0, 1 - fadeT * fadeBias)
        }

        if (scrollProgress < 0.12) {
          drawAlpha *= scrollProgress / 0.12
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

function resizePoints(points: Array<{ x: number; y: number }>, count: number): Array<{ x: number; y: number }> {
  if (points.length === 0) {
    return Array.from({ length: count }, () => ({ x: 0, y: 0 }))
  }

  if (points.length === count) {
    return points
  }

  const result: Array<{ x: number; y: number }> = []

  for (let i = 0; i < count; i++) {
    const index = Math.floor((i / count) * points.length) % points.length
    result.push(points[index])
  }

  return result
}
