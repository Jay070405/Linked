"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import ScrollReveal from "@/components/ScrollReveal"
import CurvedLoop from "@/components/CurvedLoop"

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      const reveals = sectionRef.current?.querySelectorAll(".ab-reveal")
      if (!reveals?.length) return

      reveals.forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: i * 0.06,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        )
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="practice"
      ref={sectionRef}
      className="relative py-32 md:py-44 overflow-hidden"
      style={{ zIndex: 65, position: "relative" }}
    >
      {/* Quiet section background */}
      <div className="absolute inset-0 section-bg" />
      <div className="section-edge-top" />

      {/* CurvedLoop marquee background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.12]">
        <div className="absolute top-[30%] left-0 right-0">
          <CurvedLoop
            marqueeText="WORLDBUILDING · ENVIRONMENT DESIGN · VISUAL DEVELOPMENT · NARRATIVE · ATMOSPHERE · "
            speed={1.5}
            direction="left"
            interactive={false}
            curveAmount={200}
            className=""
          />
        </div>
        <div className="absolute top-[60%] left-0 right-0">
          <CurvedLoop
            marqueeText="WORLDBUILDING · ENVIRONMENT DESIGN · VISUAL DEVELOPMENT · NARRATIVE · ATMOSPHERE · "
            speed={1}
            direction="right"
            interactive={false}
            curveAmount={150}
            className=""
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[860px] px-6 lg:px-10">
        {/* Label */}
        <p className="ab-reveal text-[10px] font-medium uppercase tracking-[0.45em] text-accent/70 mb-10">
          Philosophy & Practice
        </p>

        {/* Statement */}
        <ScrollReveal
          scrollContainerRef={null}
          baseOpacity={0.08}
          baseRotation={2}
          blurStrength={3}
          enableBlur={true}
          containerClassName="ab-reveal-skip mb-10"
          textClassName="font-heading text-2xl md:text-3xl lg:text-4xl tracking-[0.04em] text-fg leading-[1.25]"
        >
          I craft worlds that exist between imagination and reality.
        </ScrollReveal>

        {/* Body text — editorial, generous whitespace */}
        <div className="space-y-6 mb-14">
          <ScrollReveal
            scrollContainerRef={null}
            baseOpacity={0.15}
            baseRotation={1}
            blurStrength={2}
            enableBlur={true}
            containerClassName="ab-reveal-skip"
            textClassName="text-[0.95rem] md:text-base leading-[1.85] text-fg-muted max-w-[640px]"
          >
            Specializing in fantasy worldbuilding, environment design, and cinematic illustration. My work spans concept art, visual development, and narrative-driven imagery — each piece a fragment of a larger story.
          </ScrollReveal>
          <ScrollReveal
            scrollContainerRef={null}
            baseOpacity={0.15}
            baseRotation={1}
            blurStrength={2}
            enableBlur={true}
            containerClassName="ab-reveal-skip"
            textClassName="text-[0.95rem] md:text-base leading-[1.85] text-fg-muted max-w-[640px]"
          >
            I draw from Eastern and Western mythology, architectural history, and the natural world. The best concept art makes you feel like you've been to a place you can't quite remember.
          </ScrollReveal>
        </div>

        {/* Approach — quiet cards */}
        <div className="ab-reveal grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {[
            { label: "Narrative First", text: "Every environment tells a story. I start with emotion and narrative purpose." },
            { label: "World Logic", text: "Believable worlds need internal consistency — from geology to architecture to light." },
            { label: "Mood & Atmosphere", text: "Color, light, and composition establish the emotional tone that draws viewers in." },
            { label: "Cross-Media", text: "I work across 2D painting, 3D blockout, and photo-bashing to serve each piece." },
          ].map((item) => (
            <div
              key={item.label}
              className="border border-white/[0.04] rounded-sm p-5 transition-all duration-500 hover:border-white/[0.08]"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent/60 mb-2">
                {item.label}
              </p>
              <p className="text-sm leading-[1.7] text-fg-muted">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="ab-reveal">
          <Link
            href="/about"
            className="group inline-flex items-center gap-3 border border-white/[0.08] rounded-sm px-6 py-3.5 text-xs tracking-[0.2em] text-fg-muted transition-all duration-500 hover:border-accent/30 hover:text-fg hover:-translate-y-0.5"
          >
            LEARN MORE
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
