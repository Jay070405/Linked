"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"

const LINE_ONE = "BETWEEN IMAGINATION AND REALITY,"
const LINE_TWO = "I BUILD WORLDS."
const LINE_CN = "在想象与现实之间，我构建世界。"

export function CinematicTransition() {
  const sectionRef = useRef<HTMLElement>(null)
  const lineOneRef = useRef<HTMLParagraphElement>(null)
  const lineTwoRef = useRef<HTMLParagraphElement>(null)
  const lineCnRef = useRef<HTMLParagraphElement>(null)
  const topLineRef = useRef<HTMLDivElement>(null)
  const dustRef = useRef<HTMLDivElement>(null)
  const contentWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=2000",
          pin: true,
          pinSpacing: true,
          scrub: 1.2,
          anticipatePin: 1,
        },
      })

      // Subtle entrance — continuity from aperture reveal
      timeline.to(
        contentWrapRef.current,
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.04,
          ease: "power2.out",
        },
        0
      )

      // Thin vertical accent line
      timeline.fromTo(
        topLineRef.current,
        { opacity: 0, scaleY: 0 },
        { opacity: 1, scaleY: 1, duration: 0.08, ease: "power2.out" },
        0
      )

      // Subtle dust glow
      timeline.fromTo(
        dustRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 0.6, scale: 1, duration: 0.2, ease: "power2.out" },
        0.02
      )

      // Line 1 reveals
      timeline.fromTo(
        lineOneRef.current,
        { opacity: 0, y: 56, filter: "blur(18px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.18, ease: "power3.out" },
        0.08
      )

      // Line 2 reveals
      timeline.fromTo(
        lineTwoRef.current,
        { opacity: 0, y: 48, filter: "blur(18px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.18, ease: "power3.out" },
        0.16
      )

      // Chinese subtitle
      timeline.fromTo(
        lineCnRef.current,
        { opacity: 0, y: 20, filter: "blur(8px)" },
        { opacity: 0.24, y: 0, filter: "blur(0px)", duration: 0.12, ease: "power2.out" },
        0.26
      )

      // Hold — slight breathing scale
      timeline.to(
        [lineOneRef.current, lineTwoRef.current],
        {
          scale: 1.04,
          duration: 0.22,
          ease: "sine.inOut",
        },
        0.44
      )

      // Dissolve out
      timeline.to(
        [lineOneRef.current, lineTwoRef.current],
        {
          opacity: 0,
          y: -44,
          filter: "blur(22px)",
          letterSpacing: "0.2em",
          duration: 0.2,
          ease: "power2.in",
        },
        0.7
      )

      timeline.to(
        lineCnRef.current,
        {
          opacity: 0,
          y: -20,
          filter: "blur(12px)",
          duration: 0.14,
          ease: "power2.in",
        },
        0.74
      )

      timeline.to(
        dustRef.current,
        {
          opacity: 0,
          scale: 1.1,
          duration: 0.16,
          ease: "power2.out",
        },
        0.76
      )

      timeline.to(
        topLineRef.current,
        {
          opacity: 0,
          scaleY: 0,
          duration: 0.1,
          ease: "power2.in",
        },
        0.82
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-black"
      style={{ zIndex: 36 }}
    >
      {/* Pure black + subtle center glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_0%,transparent_30%),linear-gradient(180deg,#010101_0%,#030303_48%,#010101_100%)]" />
      <div className="hero-grain absolute inset-0 opacity-[0.14]" aria-hidden="true" />

      {/* Restrained dust glow */}
      <div
        ref={dustRef}
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 20%, transparent 52%)",
        }}
      />

      {/* Thin vertical accent */}
      <div className="absolute top-[12vh] left-1/2 -translate-x-1/2">
        <div
          ref={topLineRef}
          className="h-20 w-px origin-top bg-gradient-to-b from-transparent via-white/30 to-transparent opacity-0"
        />
      </div>

      {/* Typography */}
      <div
        ref={contentWrapRef}
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
        style={{ opacity: 0, transform: "scale(0.96)", filter: "blur(4px)" }}
      >
        <p
          ref={lineOneRef}
          className="font-heading text-[clamp(1.8rem,4.2vw,4.6rem)] leading-[1.08] tracking-[0.1em] text-white/85 opacity-0"
          style={{ fontWeight: 400 }}
        >
          {LINE_ONE}
        </p>
        <p
          ref={lineTwoRef}
          className="mt-4 font-heading text-[clamp(2.2rem,5.2vw,5.8rem)] leading-[1] tracking-[0.1em] text-white opacity-0"
          style={{ fontWeight: 500 }}
        >
          {LINE_TWO}
        </p>
        <p
          ref={lineCnRef}
          className="mt-9 font-display-cn text-[clamp(0.68rem,0.9vw,0.88rem)] tracking-[0.28em] text-white/16 opacity-0"
        >
          {LINE_CN}
        </p>
      </div>
    </section>
  )
}
