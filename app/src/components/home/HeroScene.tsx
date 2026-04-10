"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { P5ParticleHero } from "@/components/home/P5ParticleHero"
import { clamp } from "@/components/home/particleShapeUtils"
import type { ParticleState } from "@/components/home/p5HeroSketch"

interface HeroSceneProps {
  onBrandMorphProgressChange?: (progress: number) => void
  onBridgeProgressChange?: (progress: number) => void
  onBridgeBurst?: () => void
  particleState: ParticleState
  onParticleToggle: () => void
}

export function HeroScene({
  onBrandMorphProgressChange,
  onBridgeProgressChange,
  onBridgeBurst,
  particleState,
  onParticleToggle,
}: HeroSceneProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const burstTriggeredRef = useRef(false)
  const [bridgeProgress, setBridgeProgress] = useState(0)
  const particleOpacity = useMemo(() => {
    if (bridgeProgress <= 0.68) return 1
    return 1 - clamp((bridgeProgress - 0.68) / 0.3)
  }, [bridgeProgress])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      const reveals = sectionRef.current?.querySelectorAll("[data-hero-reveal]") ?? []
      const ambient = sectionRef.current?.querySelectorAll("[data-hero-ambient]") ?? []

      if (!prefersReduced) {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } })

        intro.fromTo(
          reveals,
          { opacity: 0, y: 28, filter: "blur(6px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1.4,
            stagger: 0.15,
            ease: "power3.out",
          },
          0.5
        )
      }

      gsap.to(contentRef.current, {
        y: -80,
        opacity: 0.04,
        filter: "blur(8px)",
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          onUpdate: (self) => {
            const brand = clamp(self.progress / 0.32)
            const bridge = clamp((self.progress - 0.52) / 0.3)

            onBrandMorphProgressChange?.(brand)
            onBridgeProgressChange?.(bridge)
            setBridgeProgress((current) => (Math.abs(current - bridge) > 0.012 ? bridge : current))

            if (!burstTriggeredRef.current && bridge > 0.03) {
              burstTriggeredRef.current = true
              onBridgeBurst?.()
            }

            if (self.progress < 0.02) {
              burstTriggeredRef.current = false
            }
          },
        },
      })

      ambient.forEach((layer, index) => {
        gsap.to(layer, {
          opacity: 0,
          scale: 0.85,
          y: index % 2 === 0 ? -36 : 36,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "80% top",
            scrub: 1.1,
          },
        })
      })
    }, sectionRef)

    return () => {
      onBrandMorphProgressChange?.(0)
      onBridgeProgressChange?.(0)
      setBridgeProgress(0)
      ctx.revert()
    }
  }, [onBrandMorphProgressChange, onBridgeBurst, onBridgeProgressChange])

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative isolate overflow-visible bg-black text-white z-[60]"
      style={{ minHeight: "100vh" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(255,255,255,0.035),transparent_52%),linear-gradient(180deg,#000000_0%,#030303_100%)]" />
      <div className="absolute inset-0 hero-3d-grid opacity-[0.12]" />
      <div className="hero-grain absolute inset-0 opacity-[0.2]" aria-hidden="true" />

      <div
        className="fixed inset-0 z-[65] transition-opacity duration-300"
        style={{
          opacity: particleOpacity,
          pointerEvents: bridgeProgress < 0.72 ? "auto" : "none",
        }}
      >
        <P5ParticleHero
          className="h-full w-full"
          bridgeProgress={bridgeProgress}
          targetState={particleState}
          onClickToggle={onParticleToggle}
        />
      </div>

      <div
        data-hero-ambient
        className="pointer-events-none absolute left-[-12%] top-[14%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_68%)] blur-3xl"
      />
      <div
        data-hero-ambient
        className="pointer-events-none absolute bottom-[-6%] right-[-4%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06)_0%,transparent_68%)] blur-3xl"
      />

      <div className="pointer-events-none relative z-10 mx-auto grid min-h-[100vh] max-w-[1640px] grid-cols-1 gap-8 px-5 pb-16 pt-28 md:grid-cols-12 md:px-10 md:pt-36 xl:px-14">
        <div className="flex flex-col justify-between md:col-span-7">
          <div ref={contentRef} className="max-w-[44rem] pt-6 md:pt-10">
            <p
              data-hero-reveal
              className="text-[0.68rem] font-sans font-medium uppercase tracking-[0.32em] text-white/40"
            >
              Visual Development &mdash; Concept Art
            </p>

            <h1
              data-hero-reveal
              className="mt-10 font-heading text-[clamp(3.8rem,10vw,7.5rem)] leading-[0.92] tracking-[-0.02em] text-white"
              style={{ fontWeight: 600 }}
            >
              <span className="block">Jay</span>
              <span className="block mt-2 text-white/85">Lin</span>
            </h1>

            <p
              data-hero-reveal
              className="mt-8 max-w-[28rem] font-sans text-[clamp(1rem,1.6vw,1.28rem)] leading-[1.6] tracking-[-0.01em] text-white/50"
              style={{ fontWeight: 400 }}
            >
              Worlds built with atmosphere, restraint,
              <br className="hidden md:block" />
              and cinematic gravity.
            </p>

            <p
              data-hero-reveal
              className="mt-6 max-w-[28rem] text-[0.88rem] leading-[1.8] text-white/36"
            >
              Fantasy-driven concept art and visual development shaped through
              environment storytelling, image-making, and authored mood.
            </p>

            <div data-hero-reveal className="mt-11 flex flex-wrap items-center gap-5 pointer-events-auto">
              <a href="#works" className="hero-primary-cta">
                View Works
              </a>
              <a href="#contact" className="hero-secondary-cta">
                Contact
              </a>
            </div>
          </div>

          <div
            data-hero-reveal
            className="mt-14 flex items-center gap-3 pb-1 text-[0.6rem] uppercase tracking-[0.4em] text-white/26 md:mt-0"
          >
            <span>Scroll to explore</span>
            <span aria-hidden="true" className="editorial-scroll-line" />
          </div>
        </div>

        <div className="hidden md:col-span-5 md:block" />
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-52 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.96)_100%)]" />
    </section>
  )
}
