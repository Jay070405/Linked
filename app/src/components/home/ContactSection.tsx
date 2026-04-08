"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { Mail, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { CONTACT_SOCIAL_LINKS } from "@/data/portfolio"
import ScrollReveal from "@/components/ScrollReveal"

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      const reveals = sectionRef.current?.querySelectorAll(".ct-reveal")
      if (!reveals?.length) return

      reveals.forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: i * 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
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
      id="contact"
      ref={sectionRef}
      className="relative py-32 md:py-44"
      style={{ zIndex: 75, position: "relative" }}
    >
      <div className="absolute inset-0 section-bg" />
      <div className="section-edge-top" />

      <div className="mx-auto max-w-[860px] px-6 lg:px-10 text-center relative z-10">
        <p className="ct-reveal text-[10px] font-medium uppercase tracking-[0.45em] text-accent/70 mb-10">
          Contact
        </p>

        <ScrollReveal
          scrollContainerRef={null}
          baseOpacity={0.08}
          baseRotation={2}
          blurStrength={3}
          enableBlur={true}
          containerClassName="mb-6"
          textClassName="font-heading text-2xl md:text-4xl lg:text-5xl tracking-[0.06em] text-fg"
        >
          Let's Connect
        </ScrollReveal>

        <ScrollReveal
          scrollContainerRef={null}
          baseOpacity={0.15}
          baseRotation={1}
          blurStrength={2}
          enableBlur={true}
          containerClassName="mb-14 mx-auto max-w-lg"
          textClassName="text-sm md:text-base leading-[1.8] text-fg-muted"
        >
          Open to freelance projects, collaborations, and concept art commissions.
        </ScrollReveal>

        <a
          href="mailto:contact@shijielin.com"
          className={cn(
            "ct-reveal group inline-flex items-center gap-3 rounded-sm border border-white/[0.08] px-7 py-4",
            "text-sm tracking-[0.15em] text-fg-muted",
            "transition-all duration-500",
            "hover:border-accent/30 hover:text-fg"
          )}
        >
          <Mail className="h-4 w-4 text-accent/60 transition-colors duration-300 group-hover:text-accent" />
          contact@shijielin.com
        </a>

        <div className="ct-reveal mt-12 flex items-center justify-center gap-8">
          {CONTACT_SOCIAL_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-[11px] tracking-[0.2em] text-fg-subtle transition-all duration-300 hover:text-fg-muted hover:-translate-y-0.5"
            >
              {label}
              <ExternalLink className="h-2.5 w-2.5 opacity-0 transition-all duration-300 group-hover:opacity-100" />
            </a>
          ))}
        </div>

        <div className="ct-reveal mt-20 flex justify-center">
          <div className="h-12 w-px bg-gradient-to-b from-accent/20 to-transparent" />
        </div>
      </div>
    </section>
  )
}
