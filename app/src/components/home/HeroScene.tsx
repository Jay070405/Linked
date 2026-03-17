"use client"

import { useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"

const GlassJLLogo3D = dynamic(
  () => import("./GlassJLLogo3D").then((m) => ({ default: m.GlassJLLogo3D })),
  { ssr: false }
)

export function HeroScene() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const logoWrapRef = useRef<HTMLDivElement>(null)
  const parallaxRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
  const rafRef = useRef(0)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(contentRef.current, { opacity: 1 })
        gsap.set(logoWrapRef.current, { opacity: 1 })
        return
      }

      gsap.set(contentRef.current, { opacity: 0, y: 50 })
      gsap.set(logoWrapRef.current, { opacity: 0, scale: 0.85, y: 40 })

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
      tl.to(contentRef.current, { opacity: 1, y: 0, duration: 1.3, delay: 0.2 })
        .to(logoWrapRef.current, { opacity: 1, scale: 1, y: 0, duration: 1.1 }, "-=0.7")

      gsap.fromTo(
        contentRef.current,
        { opacity: 1, y: 0, scale: 1 },
        {
          opacity: 0,
          y: -100,
          scale: 0.92,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "55% top",
            scrub: 1.5,
          },
        }
      )

      gsap.fromTo(
        logoWrapRef.current,
        { opacity: 1, y: 0, scale: 1 },
        {
          opacity: 0,
          y: -60,
          scale: 0.88,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "8% top",
            end: "65% top",
            scrub: 1.5,
          },
        }
      )
    }, sectionRef)

    const onMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.targetY = (e.clientY / window.innerHeight) * 2 - 1
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const tick = () => {
      const m = mouseRef.current
      m.x = lerp(m.x, m.targetX, 0.06)
      m.y = lerp(m.y, m.targetY, 0.06)

      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translate(${m.x * -15}px, ${m.y * -10}px)`
      }

      if (titleRef.current) {
        titleRef.current.style.transform = `translate(${m.x * -8}px, ${m.y * -5}px)`
        titleRef.current.style.textShadow = `
          ${m.x * 3}px ${m.y * 3}px 0px hsl(38 50% 61% / 0.08),
          ${m.x * 6}px ${m.y * 6}px 0px hsl(38 50% 61% / 0.04),
          ${m.x * 10}px ${m.y * 10}px 20px hsl(38 50% 61% / 0.03)
        `
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    if (!prefersReduced) {
      window.addEventListener("mousemove", onMove, { passive: true })
      rafRef.current = requestAnimationFrame(tick)
    }

    return () => {
      ctx.revert()
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ height: "115vh", zIndex: 5, position: "relative" }}
    >
      <div className="absolute inset-0 section-bg" />

      {/* Parallax ambient elements */}
      <div ref={parallaxRef} className="absolute inset-0 pointer-events-none">
        <div
          className="absolute left-[15%] top-[20%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full animate-blob-1"
          style={{
            background: "radial-gradient(circle, hsl(38 50% 61% / 0.05), transparent 70%)",
          }}
        />
        <div
          className="absolute right-[10%] top-[40%] w-[35vw] h-[35vw] max-w-[450px] max-h-[450px] rounded-full animate-blob-2"
          style={{
            background: "radial-gradient(circle, hsl(220 50% 50% / 0.035), transparent 70%)",
          }}
        />
        <div
          className="absolute left-[40%] bottom-[15%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full animate-blob-3"
          style={{
            background: "radial-gradient(circle, hsl(280 30% 50% / 0.025), transparent 70%)",
          }}
        />

        <div
          className="absolute left-[8%] top-[30%] w-32 h-32 border border-white/[0.02]"
          style={{ transform: "rotate(45deg) perspective(400px) rotateY(15deg)" }}
        />
        <div
          className="absolute right-[12%] bottom-[25%] w-24 h-24 border border-accent/[0.03]"
          style={{ transform: "rotate(12deg) perspective(400px) rotateX(20deg)" }}
        />
        <div
          className="absolute left-[60%] top-[15%] w-16 h-16 border border-white/[0.015]"
          style={{ transform: "rotate(-30deg) perspective(400px) rotateY(-25deg) rotateX(15deg)" }}
        />
      </div>

      {/* Ambient glow */}
      <div
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[50vh] rounded-full animate-glow-pulse pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, hsl(var(--accent) / 0.04) 0%, transparent 70%)",
        }}
      />

      {/* Sparkle particles */}
      {[
        { l: 15, t: 22, s: 2.0, d: 0.0, dur: 3.5 },
        { l: 72, t: 14, s: 1.2, d: 0.8, dur: 4.2 },
        { l: 38, t: 65, s: 2.5, d: 1.5, dur: 3.0 },
        { l: 85, t: 42, s: 1.5, d: 2.2, dur: 4.8 },
        { l: 52, t: 78, s: 1.8, d: 3.0, dur: 3.3 },
        { l: 24, t: 48, s: 2.2, d: 0.5, dur: 4.0 },
        { l: 63, t: 30, s: 1.3, d: 1.8, dur: 3.8 },
        { l: 44, t: 88, s: 2.8, d: 2.5, dur: 4.5 },
        { l: 78, t: 58, s: 1.0, d: 3.5, dur: 3.2 },
        { l: 30, t: 35, s: 1.6, d: 1.2, dur: 4.1 },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/30 animate-sparkle pointer-events-none"
          style={{
            left: `${p.l}%`,
            top: `${p.t}%`,
            width: `${p.s}px`,
            height: `${p.s}px`,
            animationDelay: `${p.d}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}

      {/* Sticky content */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center">
        {/* Title */}
        <div ref={contentRef} className="text-center z-10 px-4">
          <h1
            ref={titleRef}
            className="font-heading font-semibold tracking-[0.12em] text-fg text-[clamp(3rem,13vw,12rem)] leading-[0.88]"
            style={{
              willChange: "transform",
              transition: "text-shadow 0.1s ease-out",
            }}
          >
            SHIJIE LIN
          </h1>
          <p className="mt-5 text-[clamp(0.55rem,1.1vw,0.78rem)] font-light tracking-[0.35em] text-fg-muted/70 drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
            CONCEPT ART &nbsp;&middot;&nbsp; VISUAL DEVELOPMENT
            &nbsp;&middot;&nbsp; FANTASY WORLDBUILDING
          </p>
        </div>

        {/* 3D Glass JL Logo */}
        <div ref={logoWrapRef} className="mt-4 z-10">
          <GlassJLLogo3D
            className="w-[clamp(360px,70vw,1000px)] aspect-[16/9]"
            autoRotate={true}
            scaleMultiplier={1}
          />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 animate-float">
          <span className="text-[9px] font-medium tracking-[0.3em] text-fg-subtle/50 uppercase">
            scroll to explore
          </span>
          <span className="text-fg-muted/40">&rarr;</span>
        </div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />
    </section>
  )
}
