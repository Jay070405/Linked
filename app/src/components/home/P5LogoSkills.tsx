"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { sampleImagePoints } from "@/components/home/particleShapeUtils"
import type { LogoSkillsSketchAPI } from "./p5LogoSkillsSketch"

interface P5LogoSkillsProps {
  className?: string
  scrollProgress: number
}

export function P5LogoSkills({ className, scrollProgress }: P5LogoSkillsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sketchApiRef = useRef<LogoSkillsSketchAPI | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [ready, setReady] = useState(false)

  const scrollProgressRef = useRef(scrollProgress)
  scrollProgressRef.current = scrollProgress

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReducedMotion(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  // Forward scrollProgress imperatively
  useEffect(() => {
    sketchApiRef.current?.setScrollProgress(scrollProgress)
  }, [scrollProgress])

  // Mount p5 sketch
  useEffect(() => {
    if (reducedMotion) return

    const container = containerRef.current
    if (!container) return

    let disposed = false

    const mount = async () => {
      const width = Math.max(300, container.clientWidth)
      const height = Math.max(300, container.clientHeight)

      const logoPoints = await sampleImagePoints({
        src: "/image/logo.png",
        width,
        height,
        step: Math.max(2, Math.round(width / 180)),
        padding: 0.14,
      })

      if (disposed) return

      const p5Module = await import("p5")
      const p5Constructor = p5Module.default as unknown as new (
        sketch: (p: import("p5").default) => void,
        node: HTMLElement
      ) => import("p5").default

      if (disposed) return

      const { createLogoSkillsSketch } = await import("./p5LogoSkillsSketch")

      const particleCount = Math.min(1200, Math.max(800, Math.round(width * 1.2)))

      const { sketch, api } = createLogoSkillsSketch({
        logoPoints,
        width,
        height,
        particleCount,
      })

      sketchApiRef.current = api
      api.setScrollProgress(scrollProgressRef.current)

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

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      sketchApiRef.current?.setMouse(
        event.clientX - rect.left,
        event.clientY - rect.top
      )
    },
    []
  )

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      sketchApiRef.current?.applyClickImpulse(
        event.clientX - rect.left,
        event.clientY - rect.top
      )
    },
    []
  )

  return (
    <div
      ref={containerRef}
      className={className}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      role="img"
      aria-label="Interactive JL particle logo — hover to repel particles, click to explode"
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
