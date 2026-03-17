"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"

const STATEMENT_EN = "Between imagination and reality,"
const STATEMENT_EN_2 = "I build worlds."
const STATEMENT_CN = "在想象与现实之间，我构建世界。"

const PARTICLE_POSITIONS = [
  { x: 12, y: 18, s: 2.2, d: 0 },
  { x: 78, y: 25, s: 1.5, d: 0.4 },
  { x: 35, y: 72, s: 2.8, d: 0.8 },
  { x: 88, y: 55, s: 1.3, d: 1.2 },
  { x: 22, y: 45, s: 2.0, d: 1.6 },
  { x: 65, y: 82, s: 1.8, d: 2.0 },
  { x: 48, y: 15, s: 2.5, d: 0.3 },
  { x: 92, y: 38, s: 1.2, d: 0.9 },
  { x: 8, y: 68, s: 2.4, d: 1.4 },
  { x: 55, y: 90, s: 1.6, d: 1.8 },
  { x: 72, y: 8, s: 2.1, d: 0.6 },
  { x: 30, y: 58, s: 1.4, d: 2.2 },
]

export function CinematicTransition() {
  const sectionRef = useRef<HTMLElement>(null)
  const statementRef = useRef<HTMLDivElement>(null)
  const line1Ref = useRef<HTMLParagraphElement>(null)
  const line2Ref = useRef<HTMLParagraphElement>(null)
  const cnRef = useRef<HTMLParagraphElement>(null)
  const nextLabelRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const lineTopRef = useRef<HTMLDivElement>(null)
  const lineBottomRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    if (prefersReduced) {
      gsap.set(statementRef.current, { opacity: 1 })
      return
    }

    if (sectionRef.current) {
      sectionRef.current.style.visibility = "hidden"
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=2500",
          pin: true,
          pinSpacing: true,
          scrub: 1.2,
          anticipatePin: 1,
          refreshPriority: -3,
          onEnter: () => {
            if (sectionRef.current) sectionRef.current.style.visibility = "visible"
          },
          onLeave: () => {
            if (sectionRef.current) sectionRef.current.style.visibility = "hidden"
          },
          onLeaveBack: () => {
            if (sectionRef.current) sectionRef.current.style.visibility = "hidden"
          },
          onEnterBack: () => {
            if (sectionRef.current) sectionRef.current.style.visibility = "visible"
          },
        },
      })

      // Phase 1: Top line draws in
      tl.fromTo(
        lineTopRef.current,
        { scaleY: 0, opacity: 0 },
        { scaleY: 1, opacity: 1, duration: 0.06, ease: "power2.inOut" },
        0
      )

      // Phase 1: Ambient glow fades in
      tl.fromTo(
        glowRef.current,
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 0.1, ease: "power2.out" },
        0.02
      )

      // Phase 1: Particles fade in
      tl.fromTo(
        particlesRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.08 },
        0.04
      )

      // Phase 2: Statement line 1 fades in from below with blur
      tl.fromTo(
        line1Ref.current,
        { opacity: 0, y: 60, filter: "blur(12px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.12, ease: "power3.out" },
        0.08
      )

      // Phase 2: Statement line 2 fades in
      tl.fromTo(
        line2Ref.current,
        { opacity: 0, y: 50, filter: "blur(12px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.12, ease: "power3.out" },
        0.14
      )

      // Phase 2: Chinese subtitle fades in
      tl.fromTo(
        cnRef.current,
        { opacity: 0, y: 30, filter: "blur(6px)" },
        { opacity: 0.5, y: 0, filter: "blur(0px)", duration: 0.1, ease: "power2.out" },
        0.2
      )

      // Phase 3: Hold — text is visible (0.26 – 0.50)

      // Phase 4: Text scales up and blurs out
      tl.to(
        line1Ref.current,
        {
          scale: 2.5,
          opacity: 0,
          filter: "blur(20px)",
          letterSpacing: "0.15em",
          duration: 0.2,
          ease: "power2.in",
        },
        0.50
      )

      tl.to(
        line2Ref.current,
        {
          scale: 3,
          opacity: 0,
          filter: "blur(24px)",
          letterSpacing: "0.2em",
          duration: 0.2,
          ease: "power2.in",
        },
        0.52
      )

      tl.to(
        cnRef.current,
        { opacity: 0, y: -20, filter: "blur(8px)", duration: 0.12 },
        0.54
      )

      // Phase 4: Glow intensifies then fades
      tl.to(
        glowRef.current,
        { scale: 1.8, opacity: 0.6, duration: 0.1, ease: "power2.in" },
        0.50
      )
      tl.to(
        glowRef.current,
        { opacity: 0, scale: 2.2, duration: 0.12, ease: "power2.out" },
        0.62
      )

      // Phase 5: Next section label fades in
      tl.fromTo(
        nextLabelRef.current,
        { opacity: 0, y: 25, filter: "blur(4px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.1, ease: "power2.out" },
        0.72
      )

      // Phase 5: Bottom line draws in
      tl.fromTo(
        lineBottomRef.current,
        { scaleY: 0, opacity: 0 },
        { scaleY: 1, opacity: 1, duration: 0.06, ease: "power2.inOut" },
        0.74
      )

      // Phase 6: Everything fades out at end
      tl.to(
        nextLabelRef.current,
        { opacity: 0, y: -15, duration: 0.08 },
        0.88
      )
      tl.to(
        lineTopRef.current,
        { scaleY: 0, opacity: 0, transformOrigin: "top center", duration: 0.06 },
        0.88
      )
      tl.to(
        lineBottomRef.current,
        { scaleY: 0, opacity: 0, transformOrigin: "bottom center", duration: 0.06 },
        0.90
      )
      tl.to(
        particlesRef.current,
        { opacity: 0, duration: 0.08 },
        0.88
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
      style={{ zIndex: 45, position: "relative" }}
    >
      <div className="absolute inset-0 section-bg" />
      {/* Ambient radial glow */}
      <div
        ref={glowRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[900px] max-h-[900px] rounded-full pointer-events-none opacity-0"
        style={{
          background:
            "radial-gradient(circle, hsl(38 45% 55% / 0.08) 0%, hsl(260 25% 45% / 0.03) 35%, transparent 65%)",
        }}
      />

      {/* Floating particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none opacity-0">
        {PARTICLE_POSITIONS.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-accent/20 animate-sparkle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.s}px`,
              height: `${p.s}px`,
              animationDelay: `${p.d}s`,
              animationDuration: `${3 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      {/* Top decorative line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center pt-[12vh]">
        <div
          ref={lineTopRef}
          className="w-px origin-top opacity-0"
          style={{
            height: "80px",
            background:
              "linear-gradient(to bottom, transparent, hsl(38 50% 61% / 0.4))",
          }}
        />
      </div>

      {/* Main statement — centered */}
      <div
        ref={statementRef}
        className="absolute inset-0 flex flex-col items-center justify-center px-6"
        style={{ perspective: "1000px" }}
      >
        <p
          ref={line1Ref}
          className="font-heading text-[clamp(1.5rem,4.5vw,4.5rem)] tracking-[0.06em] text-fg/90 leading-[1.2] text-center opacity-0"
          style={{ willChange: "transform, opacity, filter" }}
        >
          {STATEMENT_EN}
        </p>
        <p
          ref={line2Ref}
          className="font-heading text-[clamp(1.8rem,5.5vw,5.5rem)] tracking-[0.08em] text-fg leading-[1.1] text-center mt-2 opacity-0"
          style={{ willChange: "transform, opacity, filter" }}
        >
          {STATEMENT_EN_2}
        </p>
        <p
          ref={cnRef}
          className="mt-6 text-[clamp(0.7rem,1.2vw,1rem)] tracking-[0.4em] text-fg-muted/50 text-center opacity-0"
          style={{ willChange: "transform, opacity, filter" }}
        >
          {STATEMENT_CN}
        </p>
      </div>

      {/* Next section preview label */}
      <div
        ref={nextLabelRef}
        className="absolute left-1/2 -translate-x-1/2 bottom-[18vh] flex flex-col items-center opacity-0"
      >
        <p className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.5em] text-accent/60 text-center">
          About the Artist
        </p>
        <div className="w-px h-6 mt-3" style={{ background: "linear-gradient(to bottom, hsl(38 50% 61% / 0.3), transparent)" }} />
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center pb-[12vh]">
        <div
          ref={lineBottomRef}
          className="w-px origin-bottom opacity-0"
          style={{
            height: "80px",
            background:
              "linear-gradient(to top, transparent, hsl(38 50% 61% / 0.25))",
          }}
        />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />
    </section>
  )
}
