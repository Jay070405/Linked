"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"

const LINE_ONE = "BETWEEN IMAGINATION AND REALITY,"
const LINE_TWO = "I BUILD WORLDS."
const LINE_CN = "Shaping worlds between imagination and reality."

export function CinematicTransition() {
  const sectionRef = useRef<HTMLElement>(null)
  const lineOneRef = useRef<HTMLParagraphElement>(null)
  const lineTwoRef = useRef<HTMLParagraphElement>(null)
  const lineCnRef = useRef<HTMLParagraphElement>(null)
  const topLineRef = useRef<HTMLDivElement>(null)
  const dustRef = useRef<HTMLDivElement>(null)
  const glassRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=1600",
          pin: true,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
        },
      })

      timeline.fromTo(
        topLineRef.current,
        { opacity: 0, scaleY: 0 },
        { opacity: 1, scaleY: 1, duration: 0.08, ease: "power2.out" },
        0
      )

      timeline.fromTo(
        dustRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 0.7, scale: 1, duration: 0.2, ease: "power2.out" },
        0.02
      )

      timeline.fromTo(
        glassRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.14, ease: "power2.out" },
        0.04
      )

      timeline.fromTo(
        lineOneRef.current,
        { opacity: 0, y: 56, filter: "blur(18px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.18, ease: "power3.out", immediateRender: false },
        0.08
      )

      timeline.fromTo(
        lineTwoRef.current,
        { opacity: 0, y: 48, filter: "blur(18px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.18, ease: "power3.out", immediateRender: false },
        0.16
      )

      timeline.fromTo(
        lineCnRef.current,
        { opacity: 0, y: 20, filter: "blur(8px)" },
        { opacity: 0.28, y: 0, filter: "blur(0px)", duration: 0.12, ease: "power2.out", immediateRender: false },
        0.26
      )

      timeline.to([lineOneRef.current, lineTwoRef.current], { scale: 1.04, duration: 0.22, ease: "sine.inOut" }, 0.44)

      timeline.to(
        [lineOneRef.current, lineTwoRef.current],
        {
          opacity: 0,
          y: -44,
          filter: "blur(22px)",
          letterSpacing: "0.2em",
          duration: 0.18,
          ease: "power2.in",
        },
        0.78
      )

      timeline.to(glassRef.current, { opacity: 0, duration: 0.14, ease: "power2.in" }, 0.78)

      timeline.to(
        lineCnRef.current,
        {
          opacity: 0,
          y: -20,
          filter: "blur(12px)",
          duration: 0.12,
          ease: "power2.in",
        },
        0.8
      )

      timeline.to(dustRef.current, { opacity: 0, scale: 1.1, duration: 0.1, ease: "power2.out" }, 0.86)
      timeline.to(topLineRef.current, { opacity: 0, scaleY: 0, duration: 0.08, ease: "power2.in" }, 0.9)
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="cinematic"
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-black"
      style={{ zIndex: 66, isolation: "isolate" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.08)_0%,transparent_24%),linear-gradient(180deg,#020202_0%,#050505_48%,#020202_100%)]" />
      <div className="absolute inset-0 hero-3d-grid opacity-[0.08]" />
      <div className="hero-grain absolute inset-0 opacity-[0.14]" aria-hidden="true" />

      <div
        ref={dustRef}
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 22%, transparent 54%)",
        }}
      />

      <div className="absolute left-1/2 top-[12vh] -translate-x-1/2">
        <div
          ref={topLineRef}
          className="h-24 w-px origin-top bg-gradient-to-b from-transparent via-white/40 to-transparent opacity-0"
        />
      </div>

      <div ref={glassRef} className="absolute inset-x-6 top-[16vh] bottom-[12vh] opacity-0 md:inset-x-10 xl:inset-x-14">
        <div className="story-panel relative mx-auto h-full w-full max-w-[1380px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_78%_24%,rgba(255,255,255,0.08),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_35%,rgba(255,255,255,0.02))]" />
          <div className="absolute left-6 top-6 text-[0.65rem] uppercase tracking-[0.3em] text-white/34 md:left-8 md:top-8">
            03 / Manifesto
          </div>
          <div className="absolute right-6 top-6 hidden max-w-[19rem] text-right text-[0.7rem] uppercase tracking-[0.26em] text-white/28 md:block md:right-8 md:top-8">
            Atmosphere first. Narrative always present.
          </div>
          <div className="absolute bottom-6 left-6 flex flex-wrap gap-2 md:bottom-8 md:left-8">
            {["Concept Art", "Worldbuilding", "Environment Design"].map((item) => (
              <span key={item} className="story-chip bg-white/[0.02] text-white/52">
                {item}
              </span>
            ))}
          </div>
          <div className="absolute bottom-6 right-6 hidden text-right md:block md:bottom-8 md:right-8">
            <p className="text-[0.66rem] uppercase tracking-[0.3em] text-white/26">Field Note</p>
            <p className="mt-3 max-w-[17rem] text-sm leading-7 text-white/52">
              Worlds become believable when mood, light, and structure speak the same language.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex h-full items-center justify-center px-6 md:px-10">
        <div className="mx-auto w-full max-w-[1160px] text-center">
          <p className="mb-8 text-[0.68rem] uppercase tracking-[0.34em] text-white/34">Between image and memory</p>
          <p
            ref={lineOneRef}
            className="font-heading text-[clamp(1.3rem,3vw,3rem)] leading-[1.08] tracking-[0.22em] text-white/74"
            style={{ fontWeight: 400 }}
          >
            {LINE_ONE}
          </p>
          <p
            ref={lineTwoRef}
            className="mt-5 font-heading text-[clamp(2.5rem,8vw,7rem)] leading-[0.92] tracking-[0.06em] text-white"
            style={{ fontWeight: 500 }}
          >
            {LINE_TWO}
          </p>
          <p
            ref={lineCnRef}
            className="mx-auto mt-10 max-w-[34rem] font-display-cn text-[clamp(0.72rem,0.95vw,0.94rem)] tracking-[0.24em] text-white/20 opacity-0"
          >
            {LINE_CN}
          </p>
        </div>
      </div>
    </section>
  )
}
