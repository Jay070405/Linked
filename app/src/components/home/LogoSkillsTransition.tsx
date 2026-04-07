"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { P5LogoSkills } from "./P5LogoSkills"

const SKILLS_TITLE = "SKILLS"
const SKILLS_SUBTITLE = "Experience & Skills"
const SKILLS_CN = "技能 · 经验"

export function LogoSkillsTransition() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const titleWrapRef = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const cnRef = useRef<HTMLParagraphElement>(null)
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([])
  const zoomOverlayRef = useRef<HTMLDivElement>(null)

  const [scrollProgress, setScrollProgress] = useState(0)

  const setLetterRef = useCallback((el: HTMLSpanElement | null, i: number) => {
    letterRefs.current[i] = el
  }, [])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    if (sectionRef.current) {
      sectionRef.current.style.visibility = "hidden"
    }

    // Progress proxy object for GSAP to tween
    const progressProxy = { value: 0 }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=4800",
          pin: true,
          pinSpacing: true,
          scrub: 2.4,
          anticipatePin: 1,
          refreshPriority: -1,
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

      // Drive scrollProgress 0→1 across the full timeline
      tl.to(
        progressProxy,
        {
          value: 1,
          duration: 1,
          ease: "none",
          onUpdate: () => setScrollProgress(progressProxy.value),
        },
        0
      )

      // Phase 1 (0.00–0.15): Logo scales in
      tl.fromTo(
        canvasWrapRef.current,
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 0.14, ease: "power3.out" },
        0
      )

      // Phase 2 (0.15–0.40): Typewriter "SKILLS" text reveal
      tl.fromTo(
        titleWrapRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.02 },
        0.15
      )

      letterRefs.current.forEach((letter, i) => {
        if (!letter) return
        tl.fromTo(
          letter,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.04, ease: "power2.out" },
          0.17 + i * 0.025
        )
      })

      tl.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 18 },
        { opacity: 0.6, y: 0, duration: 0.06, ease: "power2.out" },
        0.34
      )

      tl.fromTo(
        cnRef.current,
        { opacity: 0, y: 12 },
        { opacity: 0.4, y: 0, duration: 0.05, ease: "power2.out" },
        0.38
      )

      // Phase 3 (0.40–0.58): Hold — text + logo visible, calm breathing

      // Phase 4 (0.58–0.72): Fade out text
      tl.to(
        [subtitleRef.current, cnRef.current],
        { opacity: 0, y: -20, duration: 0.06, ease: "power2.in" },
        0.58
      )

      letterRefs.current.forEach((letter) => {
        if (!letter) return
        tl.to(letter, { opacity: 0, duration: 0.04, ease: "power2.in" }, 0.62)
      })

      tl.to(titleWrapRef.current, { opacity: 0, duration: 0.04 }, 0.66)

      // Phase 5 (0.64–0.92): Particle explosion — driven by scrollProgress in p5 sketch

      // Phase 6 (0.88–1.00): Dark overlay fades in
      tl.fromTo(
        zoomOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.10, ease: "power2.inOut" },
        0.90
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
      style={{ zIndex: 15, position: "relative", background: "hsl(240 10% 2%)" }}
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 hero-3d-grid opacity-20" />

      {/* Ambient glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[1100px] max-h-[1100px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, hsl(220 30% 50% / 0.06) 0%, hsl(240 20% 40% / 0.02) 40%, transparent 70%)",
        }}
      />

      {/* P5 Particle Logo — large, centered */}
      <div
        ref={canvasWrapRef}
        className="absolute inset-0 flex items-center justify-center opacity-0"
        style={{ transform: "translateZ(0)" }}
      >
        <P5LogoSkills
          className="w-[clamp(500px,85vw,1400px)] aspect-[16/10]"
          scrollProgress={scrollProgress}
        />
      </div>

      {/* Typewriter text — positioned below logo center */}
      <div
        ref={titleWrapRef}
        className="absolute inset-0 flex flex-col items-center justify-end pb-[14vh] pointer-events-none opacity-0"
      >
        <div className="flex gap-[0.8vw]">
          {SKILLS_TITLE.split("").map((char, i) => (
            <span
              key={i}
              ref={(el) => setLetterRef(el, i)}
              className="font-heading text-[clamp(3rem,10vw,10rem)] tracking-[0.12em] text-fg/90 leading-none select-none"
              style={{ opacity: 0 }}
            >
              {char}
            </span>
          ))}
        </div>

        <p
          ref={subtitleRef}
          className="mt-4 text-[clamp(0.65rem,1.2vw,1rem)] font-light tracking-[0.35em] text-fg-muted/60 uppercase opacity-0"
        >
          {SKILLS_SUBTITLE}
        </p>

        <p
          ref={cnRef}
          className="mt-2 text-[clamp(0.6rem,0.9vw,0.85rem)] tracking-[0.5em] text-fg-subtle/40 opacity-0"
        >
          {SKILLS_CN}
        </p>
      </div>

      {/* Exit overlay */}
      <div
        ref={zoomOverlayRef}
        className="absolute inset-0 z-[30] pointer-events-none opacity-0"
        style={{ background: "hsl(240 10% 2%)" }}
      />

      <div className="absolute inset-0 vignette pointer-events-none" />
    </section>
  )
}
