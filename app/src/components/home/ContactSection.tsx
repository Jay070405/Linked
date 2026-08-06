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
      <div className="section-edge-top" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.12),transparent_18%),radial-gradient(circle_at_78%_74%,rgba(255,255,255,0.08),transparent_20%)]" />

      <div className="mx-auto max-w-[1380px] px-6 lg:px-10 xl:px-14 relative z-10">
        <p className="ct-reveal section-kicker mb-8">Contact</p>

        <ScrollReveal
          scrollContainerRef={null}
          baseOpacity={0.1}
          baseRotation={2}
          blurStrength={4}
          enableBlur={true}
          containerClassName="mb-6 max-w-[62rem]"
          textClassName="section-heading text-[clamp(2.4rem,6vw,5.8rem)]"
        >
          Let&apos;s build something with atmosphere and intent.
        </ScrollReveal>

        <ScrollReveal
          scrollContainerRef={null}
          baseOpacity={0.16}
          baseRotation={1}
          blurStrength={2}
          enableBlur={true}
          containerClassName="mb-14 max-w-[42rem]"
          textClassName="text-base leading-[1.9] text-white/56"
        >
          Open to freelance projects, collaborations, and concept art commissions across worldbuilding, environment design, and visual development.
        </ScrollReveal>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.75fr)]">
          <a
            href="mailto:contact@shijielin.com"
            className={cn("ct-reveal story-panel group flex min-h-[320px] flex-col justify-between p-6 md:min-h-[360px] md:p-8")}
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] uppercase tracking-[0.28em] text-white/34">Direct Line</span>
              <Mail className="h-5 w-5 text-white/34 transition-colors duration-300 group-hover:text-white/78" />
            </div>
            <div>
              <p className="max-w-[16rem] text-sm uppercase tracking-[0.24em] text-white/42">
                Email for projects, commissions, and collaborations
              </p>
              <p className="mt-6 break-all font-heading text-[clamp(1.9rem,4vw,4rem)] leading-[1.02] tracking-[0.02em] text-white">
                contact@shijielin.com
              </p>
            </div>
            <div className="flex items-center justify-between text-sm leading-7 text-white/52">
              <span>Replying to serious inquiries and good ideas.</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">&#8599;</span>
            </div>
          </a>

          <div className="space-y-5">
            <div className="ct-reveal story-panel p-6 md:p-7">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/34">Availability</p>
              <p className="mt-5 text-2xl tracking-[0.03em] text-white">Selected freelance and collaborative work</p>
              <p className="mt-4 text-sm leading-7 text-white/54">
                Especially interested in fantasy worldbuilding, cinematic key art, and visual development with a strong narrative angle.
              </p>
            </div>

            <div className="ct-reveal story-panel p-6 md:p-7">
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/34">Elsewhere</p>
              <div className="mt-5 space-y-3">
                {CONTACT_SOCIAL_LINKS.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-[8px] border border-white/[0.06] bg-white/[0.02] px-4 py-4 text-sm tracking-[0.16em] text-white/66 transition-all duration-300 hover:border-white/[0.14] hover:text-white"
                  >
                    <span>{label}</span>
                    <ExternalLink className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="ct-reveal mt-20 flex justify-center">
          <div className="h-16 w-px bg-gradient-to-b from-white/20 to-transparent" />
        </div>
      </div>
    </section>
  )
}
