"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { sampleImagePoints } from "@/components/home/particleShapeUtils"
import type { ParticleState, SketchAPI } from "./p5HeroSketch"

interface P5ParticleHeroProps {
  className?: string
  bridgeProgress: number
  targetState: ParticleState
  onClickToggle?: () => void
}

export function P5ParticleHero({
  className,
  bridgeProgress,
  targetState,
  onClickToggle,
}: P5ParticleHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sketchApiRef = useRef<SketchAPI | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [ready, setReady] = useState(false)

  // Refs to hold latest prop values (avoids re-mounting sketch on prop change)
  const targetStateRef = useRef(targetState)
  const bridgeProgressRef = useRef(bridgeProgress)
  targetStateRef.current = targetState
  bridgeProgressRef.current = bridgeProgress

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReducedMotion(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  // Forward bridgeProgress to sketch imperatively
  useEffect(() => {
    sketchApiRef.current?.setBridgeProgress(bridgeProgress)
  }, [bridgeProgress])

  // Forward targetState to sketch imperatively
  useEffect(() => {
    sketchApiRef.current?.setState(targetState)
  }, [targetState])

  // Mount p5 sketch
  useEffect(() => {
    if (reducedMotion) return

    const container = containerRef.current
    if (!container) return

    let disposed = false

    const mount = async () => {
      const width = Math.max(300, container.clientWidth)
      const height = Math.max(300, container.clientHeight)

      // Sample logo points from image
      const logoPoints = await sampleImagePoints({
        src: "/image/logo.png",
        width,
        height,
        step: Math.max(2, Math.round(width / 180)),
        padding: 0.14,
      })

      if (disposed) return

      // Dynamic imports to avoid SSR issues
      const p5Module = await import("p5")
      const p5Constructor = p5Module.default as unknown as new (
        sketch: (p: import("p5").default) => void,
        node: HTMLElement
      ) => import("p5").default

      if (disposed) return

      const { createHeroSketch } = await import("./p5HeroSketch")

      const particleCount = Math.min(1200, Math.max(800, Math.round(width * 1.2)))

      const { sketch, api } = createHeroSketch({
        logoPoints,
        width,
        height,
        particleCount,
      })

      sketchApiRef.current = api
      api.setState(targetStateRef.current)
      api.setBridgeProgress(bridgeProgressRef.current)

      new p5Constructor(sketch, container)
      setReady(true)
    }

    void mount()

    return () => {
      disposed = true
      if (sketchApiRef.current) {
        sketchApiRef.current.dispose()
        sketchApiRef.current = null
      }
      setReady(false)
    }
  }, [reducedMotion])

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    sketchApiRef.current?.setMouse(
      event.clientX - rect.left,
      event.clientY - rect.top
    )
  }, [])

  const handlePointerLeave = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    sketchApiRef.current?.setMouse(rect.width / 2, rect.height / 2)
  }, [])

  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // Apply subtle click impulse at click position
    const rect = event.currentTarget.getBoundingClientRect()
    sketchApiRef.current?.applyClickImpulse(
      event.clientX - rect.left,
      event.clientY - rect.top
    )
    onClickToggle?.()
  }, [onClickToggle])

  return (
    <div
      ref={containerRef}
      className={className}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClickToggle?.()
        }
      }}
      aria-label="Interactive JL particle logo — click to toggle between logo and galaxy"
    >
      {reducedMotion ? (
        <div className="flex h-full items-center justify-center">
          <div
            className="font-heading text-[8rem] tracking-[-0.04em] text-white/90"
            style={{ fontWeight: 400 }}
          >
            JL
          </div>
        </div>
      ) : (
        <>
          {!ready && (
            <div
              className="absolute inset-0 flex items-center justify-center font-heading text-[8rem] tracking-[-0.04em] text-white/90"
              style={{ fontWeight: 400 }}
            >
              JL
            </div>
          )}
        </>
      )}
    </div>
  )
}
