"use client"

import { useEffect, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"

const GlassJLLogo3D = dynamic(
  () => import("./GlassJLLogo3D").then((m) => ({ default: m.GlassJLLogo3D })),
  { ssr: false }
)

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

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=5000",
          pin: true,
          pinSpacing: true,
          scrub: 1.8,
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

      // Phase 1 (0 – 0.15): Logo scales in quickly — user already sees dark from Works exit
      tl.fromTo(
        canvasWrapRef.current,
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 0.14, ease: "power3.out" },
        0
      )

      // Phase 2 (0.15 – 0.45): Typewriter "SKILLS" text reveal
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
        0.38
      )

      tl.fromTo(
        cnRef.current,
        { opacity: 0, y: 12 },
        { opacity: 0.4, y: 0, duration: 0.05, ease: "power2.out" },
        0.42
      )

      // Phase 3 (0.45 – 0.68): Hold — text + logo visible

      // Phase 4 (0.62 – 0.78): Fade out all content, then full dark overlay — 大 SKILLS 先完全消失，再露出 Experience & Skills
      tl.to(
        [subtitleRef.current, cnRef.current],
        { opacity: 0, y: -20, duration: 0.04, ease: "power2.in" },
        0.62
      )

      letterRefs.current.forEach((letter) => {
        if (!letter) return
        tl.to(letter, { opacity: 0, duration: 0.03, ease: "power2.in" }, 0.64)
      })

      tl.to(titleWrapRef.current, { opacity: 0, duration: 0.03 }, 0.66)

      tl.to(
        canvasWrapRef.current,
        { scale: 2.5, opacity: 0, duration: 0.12, ease: "power2.in" },
        0.64
      )

      // 全黑遮罩提前完成，最后约 28% 滚动只显示黑屏，避免大 SKILLS 与 Resume 同时出现
      tl.fromTo(
        zoomOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.12, ease: "power2.inOut" },
        0.70
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

      {/* 3D Glass Logo — large, centered (matching 图3 size) */}
      <div
        ref={canvasWrapRef}
        className="absolute inset-0 flex items-center justify-center opacity-0"
        style={{ transform: "translateZ(0)" }}
      >
        <GlassJLLogo3D
          className="w-[clamp(500px,85vw,1400px)] aspect-[16/10]"
          autoRotate={true}
          scaleMultiplier={1.5}
        />
      </div>

      {/* Typewriter text — positioned below logo center (图4 style) */}
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
