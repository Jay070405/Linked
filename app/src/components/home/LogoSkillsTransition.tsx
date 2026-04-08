"use client"

import Link from "next/link"
import { useEffect, useRef, useCallback, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { P5LogoSkills } from "./P5LogoSkills"

const SKILLS_TITLE = "SKILLS"
const SKILLS_SUBTITLE = "Experience & Skills"
const SKILLS_CN = "Method / Process"

const SKILL_CARDS = [
  {
    href: "#practice",
    label: "World Logic",
    text: "Environment design, narrative framing, and atmosphere treated as one system.",
  },
  {
    href: "#resume",
    label: "Tool Stack",
    text: "2D paint, 3D blockout, and visual development workflows shaped for production.",
  },
  {
    href: "#contact",
    label: "Collaborations",
    text: "Open to concept art, worldbuilding, and visual development conversations.",
  },
]

export function LogoSkillsTransition() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
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

    const progressProxy = { value: 0 }
    const logoInEnd = 0.12
    const revealEnd = 0.28
    const holdEnd = 0.45
    const textOutEnd = 0.55
    const particleFadeStart = 0.82
    const overlayStart = 0.94

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=5000",
          pin: true,
          pinSpacing: true,
          scrub: 1.5,
          anticipatePin: 1,
          refreshPriority: 1,
        },
      })

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

      tl.fromTo(
        canvasWrapRef.current,
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: logoInEnd, ease: "power3.out", immediateRender: false },
        0
      )

      tl.fromTo(titleWrapRef.current, { opacity: 0 }, { opacity: 1, duration: 0.01 }, logoInEnd)

      tl.fromTo(
        railRef.current,
        { opacity: 0, x: 40 },
        { opacity: 1, x: 0, duration: 0.12, ease: "power3.out", immediateRender: false },
        0.14
      )

      letterRefs.current.forEach((letter, i) => {
        if (!letter) return
        tl.fromTo(
          letter,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.05, ease: "power2.out" },
          logoInEnd + i * 0.022
        )
      })

      tl.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 18 },
        { opacity: 0.72, y: 0, duration: 0.06, ease: "power2.out" },
        0.22
      )

      tl.fromTo(
        cnRef.current,
        { opacity: 0, y: 12 },
        { opacity: 0.46, y: 0, duration: 0.05, ease: "power2.out" },
        0.25
      )

      tl.to(canvasWrapRef.current, { scale: 1.03, duration: holdEnd - revealEnd, ease: "sine.inOut" }, revealEnd)

      tl.to(
        [subtitleRef.current, cnRef.current],
        { opacity: 0, y: -20, duration: 0.06, ease: "power2.in" },
        holdEnd
      )

      letterRefs.current.forEach((letter, i) => {
        if (!letter) return
        tl.to(letter, { opacity: 0, y: -18, duration: 0.04, ease: "power2.in" }, 0.47 + i * 0.01)
      })

      tl.to(titleWrapRef.current, { opacity: 0, duration: 0.03 }, textOutEnd - 0.01)

      tl.to(railRef.current, { opacity: 0, x: 24, duration: 0.08, ease: "power2.in" }, 0.47)

      tl.to(
        canvasWrapRef.current,
        { scale: 1.08, duration: particleFadeStart - textOutEnd, ease: "none" },
        textOutEnd
      )

      tl.to(
        canvasWrapRef.current,
        { opacity: 0, duration: overlayStart - particleFadeStart, ease: "power2.out" },
        particleFadeStart
      )

      tl.fromTo(
        zoomOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.06, ease: "power2.inOut" },
        overlayStart
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="skills"
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
      style={{ zIndex: 68, position: "relative", background: "hsl(240 10% 2%)", isolation: "isolate" }}
    >
      <div className="absolute inset-0 hero-3d-grid opacity-[0.12]" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 18%, transparent 42%), linear-gradient(180deg, rgba(2,2,2,1) 0%, rgba(5,5,5,1) 100%)",
        }}
      />
      <div className="pointer-events-none absolute left-[4vw] top-[12vh] h-[40vh] w-px bg-gradient-to-b from-transparent via-white/35 to-transparent" />
      <div className="pointer-events-none absolute right-[4vw] top-[18vh] h-[28vh] w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

      <div className="pointer-events-none absolute left-6 top-24 z-[12] md:left-10">
        <p className="section-kicker">02 / Capability Dossier</p>
        <p className="mt-4 max-w-[18rem] text-[0.72rem] uppercase tracking-[0.24em] text-white/34">
          After the gallery, the process comes forward.
        </p>
      </div>

      <div className="pointer-events-none absolute right-6 top-24 z-[12] hidden max-w-[20rem] text-right lg:block">
        <p className="text-[0.65rem] uppercase tracking-[0.3em] text-white/34">Selected Focus</p>
        <p className="mt-4 text-sm leading-7 text-white/56">
          Environment design. Worldbuilding. Visual development. Image-making with cinematic weight.
        </p>
      </div>

      <div className="absolute inset-x-[4vw] top-[15vh] bottom-[16vh]">
        <div
          ref={canvasWrapRef}
          className="skills-stage relative mx-auto flex h-full w-full max-w-[1380px] items-center justify-center px-4 py-6 md:px-8"
          style={{ transform: "translateZ(0)" }}
        >
          <div className="skills-stage-grid pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-3 text-[0.64rem] uppercase tracking-[0.28em] text-white/34">
            <span>Studio Method</span>
            <span className="h-px w-10 bg-white/20" />
            <span>02</span>
          </div>
          <div className="pointer-events-none absolute bottom-5 left-5 hidden gap-2 xl:flex">
            {["Concept Art", "Visual Development", "Atmosphere", "3D Blockout"].map((item) => (
              <span key={item} className="story-chip bg-white/[0.02] text-white/54">
                {item}
              </span>
            ))}
          </div>
          <div
            ref={railRef}
            className="absolute right-5 top-20 z-[4] hidden w-[280px] space-y-3 xl:block"
          >
            {SKILL_CARDS.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className="skills-rail-card group block"
                style={{ marginLeft: `${index * 20}px` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[0.62rem] uppercase tracking-[0.28em] text-white/34">
                    0{index + 1}
                  </span>
                  <span className="text-white/26 transition-transform duration-300 group-hover:translate-x-1">
                    &#8599;
                  </span>
                </div>
                <p className="mt-4 text-[0.72rem] uppercase tracking-[0.24em] text-white/72">{item.label}</p>
                <p className="mt-3 text-sm leading-7 text-white/50">{item.text}</p>
              </Link>
            ))}
          </div>
          <P5LogoSkills
            className="relative z-[2] w-[clamp(500px,85vw,1400px)] aspect-[16/10]"
            scrollProgress={scrollProgress}
          />
        </div>
      </div>

      <div
        ref={titleWrapRef}
        className="absolute inset-x-0 bottom-[22vh] z-[14] flex flex-col items-center justify-end pointer-events-none opacity-0"
      >
        <div className="flex gap-[0.8vw]">
          {SKILLS_TITLE.split("").map((char, i) => (
            <span
              key={i}
              ref={(el) => setLetterRef(el, i)}
              className="font-heading text-[clamp(3rem,10vw,10rem)] leading-none tracking-[0.12em] text-fg/90 select-none"
              style={{ opacity: 0 }}
            >
              {char}
            </span>
          ))}
        </div>

        <p
          ref={subtitleRef}
          className="mt-4 text-[clamp(0.65rem,1.2vw,1rem)] font-light uppercase tracking-[0.35em] text-fg-muted/70 opacity-0"
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

      <div className="absolute inset-x-6 bottom-8 z-[16] md:inset-x-10 xl:hidden">
        <div className="mx-auto grid max-w-[1380px] gap-3 md:grid-cols-3">
          {SKILL_CARDS.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className="skills-rail-card group flex min-h-[148px] flex-col justify-between p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] uppercase tracking-[0.28em] text-white/38">
                  0{index + 1}
                </span>
                <span className="text-white/28 transition-transform duration-300 group-hover:translate-x-1">
                  &#8599;
                </span>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-white/74">{item.label}</p>
                <p className="mt-3 max-w-[26rem] text-sm leading-7 text-white/54">{item.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div
        ref={zoomOverlayRef}
        className="absolute inset-0 z-[30] pointer-events-none opacity-0"
        style={{ background: "hsl(240 10% 2%)" }}
      />

      <div className="absolute inset-0 vignette pointer-events-none" />
    </section>
  )
}
