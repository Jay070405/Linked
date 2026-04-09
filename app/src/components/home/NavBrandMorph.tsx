"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"

interface NavBrandMorphProps {
  progress: number
  className?: string
}

/**
 * Typographic morph: "Jay Lin" wordmark → JL monogram.
 * Driven by `progress` (0 = full wordmark, 1 = JL monogram).
 * Pure DOM + CSS transforms + GSAP — no canvas, no particles.
 *
 * Morph phases (spec §3):
 *   0.00–0.35  Secondary letters fade (opacity + blur), letter-spacing tightens
 *   0.35–0.60  Secondary nearly invisible, J and L remain, space closes
 *   0.60–0.85  J/L reposition → monogram crossfade
 *   0.85–1.00  Finishing settle
 */
export function NavBrandMorph({ progress, className }: NavBrandMorphProps) {
  const charsRef = useRef<(HTMLSpanElement | null)[]>([])
  const monogramRef = useRef<HTMLDivElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReducedMotion(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    const chars = charsRef.current.filter(Boolean) as HTMLSpanElement[]
    const monogram = monogramRef.current
    if (chars.length === 0 || !monogram) return

    // Characters: J(0) a(1) y(2) SPACE(3) L(4) i(5) n(6)
    const secondaryIndices = [1, 2, 5, 6]

    const p = Math.max(0, Math.min(1, progress))

    // Phase boundaries
    const phase1 = Math.min(1, p / 0.35) // 0–0.35
    const phase2 = Math.max(0, Math.min(1, (p - 0.35) / 0.25)) // 0.35–0.6
    const phase3 = Math.max(0, Math.min(1, (p - 0.6) / 0.25)) // 0.6–0.85
    const phase4 = Math.max(0, Math.min(1, (p - 0.85) / 0.15)) // 0.85–1.0

    // Secondary letters: fade + blur + spacing collapse
    for (const i of secondaryIndices) {
      const el = chars[i]
      if (!el) continue
      const opacity = Math.max(0, 1 - phase1 * 0.7 - phase2 * 0.3)
      const blur = phase1 * 2 + phase2 * 4
      const spacing = -(phase1 * 1 + phase2 * 3)
      gsap.set(el, {
        opacity,
        filter: `blur(${blur}px)`,
        marginRight: `${spacing}px`,
        display: phase2 > 0.95 ? "none" : "inline-block",
      })
    }

    // Space character collapses
    const spaceEl = chars[3]
    if (spaceEl) {
      const spaceWidth = Math.max(0, 1 - phase1 * 0.5 - phase2 * 0.5)
      gsap.set(spaceEl, { width: `${spaceWidth * 0.35}em` })
    }

    // Primary letters (J, L): fade out as monogram fades in
    for (const i of [0, 4]) {
      const el = chars[i]
      if (!el) continue
      gsap.set(el, { opacity: Math.max(0, 1 - phase3) })
    }

    // Monogram: fade in during phase 3, settle in phase 4
    const monogramOpacity = phase3 * 0.95 + phase4 * 0.05
    gsap.set(monogram, {
      opacity: monogramOpacity,
      scale: 0.95 + phase3 * 0.03 + phase4 * 0.02,
    })
  }, [progress, reducedMotion])

  const text = "Jay Lin"
  const chars = Array.from(text)

  if (reducedMotion) {
    return (
      <div className={className} aria-label="Jay Lin brand mark">
        <div className="flex h-full items-center">
          <span className="font-heading text-[1.75rem] tracking-[-0.02em] text-white">
            {progress > 0.8 ? "JL" : "Jay Lin"}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={className} aria-label="Jay Lin brand mark">
      <div className="relative flex h-full items-center">
        {/* Text characters — individually wrapped for animation */}
        <span className="font-heading text-[1.75rem] tracking-[-0.02em] text-white whitespace-nowrap">
          {chars.map((char, i) => (
            <span
              key={i}
              ref={(el) => { charsRef.current[i] = el }}
              className="inline-block"
              style={char === " " ? { width: "0.35em" } : undefined}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </span>

        {/* JL Monogram — positioned to align with J and L, fades in */}
        <div
          ref={monogramRef}
          className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0"
        >
          <span
            className="font-heading text-[1.75rem] tracking-[-0.02em] text-white"
            style={{ fontWeight: 600 }}
          >
            JL
          </span>
        </div>
      </div>
    </div>
  )
}
