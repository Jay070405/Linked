"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"

export function SectionTransition() {
  const sectionRef = useRef<HTMLElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          end: "bottom 20%",
          scrub: 1,
        },
      })

      tl.fromTo(
        lineRef.current,
        { scaleY: 0, opacity: 0 },
        { scaleY: 1, opacity: 1, duration: 0.4, ease: "power2.inOut" },
        0
      )

      tl.fromTo(
        glowRef.current,
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" },
        0.1
      )

      tl.fromTo(
        textRef.current,
        { opacity: 0, y: 15, filter: "blur(4px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.3, ease: "power2.out" },
        0.2
      )

      tl.to(
        glowRef.current,
        { opacity: 0, scale: 1.5, duration: 0.3 },
        0.7
      )

      tl.to(
        textRef.current,
        { opacity: 0, y: -10, duration: 0.2 },
        0.75
      )

      tl.to(
        lineRef.current,
        { scaleY: 0, opacity: 0, transformOrigin: "top center", duration: 0.3 },
        0.8
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-28 md:py-40 flex flex-col items-center justify-center overflow-hidden"
      style={{ zIndex: 22, position: "relative", background: "hsl(240 10% 2%)" }}
    >
      {/* Ambient glow */}
      <div
        ref={glowRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full pointer-events-none opacity-0"
        style={{
          background:
            "radial-gradient(circle, hsl(38 40% 55% / 0.06) 0%, hsl(260 30% 50% / 0.03) 40%, transparent 70%)",
        }}
      />

      {/* Vertical line */}
      <div
        ref={lineRef}
        className="w-px h-20 md:h-28 origin-bottom opacity-0"
        style={{
          background:
            "linear-gradient(to top, hsl(38 50% 61% / 0.3), transparent)",
        }}
      />

      {/* Transition text */}
      <p
        ref={textRef}
        className="mt-6 text-[9px] md:text-[10px] font-medium uppercase tracking-[0.5em] text-fg-subtle/40 opacity-0"
      >
        Experience &amp; Skills
      </p>
    </section>
  )
}
