"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"

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
      style={{ zIndex: 30, position: "relative" }}
    >
      {/* Quiet section background */}
      <div className="absolute inset-0 section-bg" />
      <div className="section-edge-top" />

      {/* Atmospheric curved loop — background layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.08]">
        <svg
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%]"
          viewBox="0 0 1000 600"
          fill="none"
        >
          <path
            d="M-50,300 Q250,100 500,300 T1050,300"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.5"
            fill="none"
          >
            <animate
              attributeName="d"
              values="M-50,300 Q250,100 500,300 T1050,300;M-50,300 Q250,500 500,300 T1050,300;M-50,300 Q250,100 500,300 T1050,300"
              dur="20s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M-50,320 Q300,150 550,320 T1050,320"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
            fill="none"
          >
            <animate
              attributeName="d"
              values="M-50,320 Q300,150 550,320 T1050,320;M-50,320 Q300,480 550,320 T1050,320;M-50,320 Q300,150 550,320 T1050,320"
              dur="25s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-[860px] px-6 lg:px-10">
        {/* Label */}
        <p className="ab-reveal text-[10px] font-medium uppercase tracking-[0.45em] text-accent/70 mb-10">
          Philosophy & Practice
        </p>

        {/* Statement */}
        <h2 className="ab-reveal font-heading text-2xl md:text-3xl lg:text-4xl tracking-[0.04em] text-fg leading-[1.25] mb-10">
          I craft worlds that exist between imagination and reality.
        </h2>

        {/* Body text — editorial, generous whitespace */}
        <div className="ab-reveal space-y-6 mb-14">
          <p className="text-[0.95rem] md:text-base leading-[1.85] text-fg-muted max-w-[640px]">
            Specializing in fantasy worldbuilding, environment design, and cinematic illustration.
            My work spans concept art, visual development, and narrative-driven imagery — each piece
            a fragment of a larger story.
          </p>
          <p className="text-[0.95rem] md:text-base leading-[1.85] text-fg-muted max-w-[640px]">
            I draw from Eastern and Western mythology, architectural history, and the natural world.
            The best concept art makes you feel like you&apos;ve been to a place you can&apos;t quite remember.
          </p>
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
