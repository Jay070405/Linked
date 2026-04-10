"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"

const PARTICLE_COUNT = 800
const MAX_SIZE = 2.5

interface Dot {
  x: number
  y: number
  homeX: number
  homeY: number
  size: number
  alpha: number
}

export function ParticleDissolve() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const canvas = canvasRef.current
    const section = sectionRef.current
    if (!canvas || !section) return

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    const ctx2d = canvas.getContext("2d")
    if (!ctx2d) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx2d.scale(dpr, dpr)

    // Initialize dots in random grid
    const dots: Dot[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      dots.push({
        x,
        y,
        homeX: x,
        homeY: y,
        size: 0.5 + Math.random() * MAX_SIZE,
        alpha: 0.3 + Math.random() * 0.7,
      })
    }

    const progressProxy = { value: 0 }

    const render = () => {
      const p = progressProxy.value
      ctx2d.clearRect(0, 0, w, h)

      // Background: black fading to transparent
      const bgAlpha = Math.max(0, 1 - p * 1.8)
      if (bgAlpha > 0.01) {
        ctx2d.fillStyle = `rgba(2, 2, 2, ${bgAlpha})`
        ctx2d.fillRect(0, 0, w, h)
      }

      const cx = w / 2
      const cy = h / 2

      for (const dot of dots) {
        // Phase 0.0-0.3: dots appear
        // Phase 0.3-0.7: dots scatter outward
        // Phase 0.7-1.0: dots fade out
        let dotAlpha = dot.alpha
        let dx = 0
        let dy = 0

        if (p < 0.3) {
          // Appear phase
          dotAlpha *= p / 0.3
        } else if (p < 0.7) {
          // Scatter phase
          const scatterT = (p - 0.3) / 0.4
          const eased = scatterT * scatterT
          const dirX = dot.homeX - cx
          const dirY = dot.homeY - cy
          const dist = Math.sqrt(dirX * dirX + dirY * dirY) || 1
          dx = (dirX / dist) * eased * 300
          dy = (dirY / dist) * eased * 300
        } else {
          // Fade out phase
          const fadeT = (p - 0.7) / 0.3
          const dirX = dot.homeX - cx
          const dirY = dot.homeY - cy
          const dist = Math.sqrt(dirX * dirX + dirY * dirY) || 1
          dx = (dirX / dist) * 300
          dy = (dirY / dist) * 300
          dotAlpha *= Math.max(0, 1 - fadeT)
        }

        if (dotAlpha < 0.01) continue

        ctx2d.beginPath()
        ctx2d.arc(dot.homeX + dx, dot.homeY + dy, dot.size, 0, Math.PI * 2)
        ctx2d.fillStyle = `rgba(220, 220, 220, ${dotAlpha})`
        ctx2d.fill()
      }
    }

    const gsapCtx = gsap.context(() => {
      gsap.to(progressProxy, {
        value: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=1200",
          pin: true,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          onUpdate: () => render(),
        },
      })
    }, section)

    render()

    return () => gsapCtx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
      style={{ zIndex: 62, position: "relative", background: "transparent" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ pointerEvents: "none" }}
      />
    </section>
  )
}
