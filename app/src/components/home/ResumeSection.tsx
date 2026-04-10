"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { RESUME_EDUCATION, RESUME_SKILLS } from "@/data/portfolio"
import ScrollReveal from "@/components/ScrollReveal"

export function ResumeSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      const reveals = sectionRef.current?.querySelectorAll(".rs-reveal")
      if (!reveals?.length) return

      reveals.forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: i * 0.05,
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
      id="resume"
      ref={sectionRef}
      className="relative py-28 md:py-36 overflow-hidden"
      style={{ zIndex: 70, position: "relative" }}
    >
      <div className="absolute inset-0 section-bg" />

      <div className="relative z-10 mx-auto max-w-[860px] px-6 lg:px-10">
        {/* Header */}
        <div className="rs-reveal mb-12">
          <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.45em] text-accent/70">
            Background
          </p>
          <ScrollReveal
            scrollContainerRef={null}
            baseOpacity={0.08}
            baseRotation={2}
            blurStrength={3}
            enableBlur={true}
            containerClassName=""
            textClassName="font-heading text-2xl md:text-3xl tracking-[0.06em] text-fg"
          >
            Experience & Skills
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Education */}
          <div>
            <h3 className="rs-reveal mb-5 text-[10px] font-medium uppercase tracking-[0.35em] text-fg-muted">
              Education
            </h3>
            <div className="space-y-5">
              {RESUME_EDUCATION.map((item) => (
                <div
                  key={item.title}
                  className="rs-reveal border border-white/[0.04] rounded-sm p-5 transition-all duration-500 hover:border-white/[0.08]"
                >
                  <p className="mb-2 text-[10px] tracking-[0.2em] text-accent/60">{item.period}</p>
                  <p className="mb-1 text-base font-medium text-fg/90">{item.title}</p>
                  <p className="mb-2 text-sm text-fg-muted">{item.org}</p>
                  {item.note && <p className="text-xs leading-relaxed text-fg-subtle">{item.note}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h3 className="rs-reveal mb-5 text-[10px] font-medium uppercase tracking-[0.35em] text-fg-muted">
              Skills & Tools
            </h3>
            <div className="space-y-7">
              {RESUME_SKILLS.map((group) => (
                <div key={group.label} className="rs-reveal">
                  <p className="mb-3 text-xs tracking-[0.15em] text-fg-muted">{group.label}</p>
                  <div className="flex flex-wrap gap-2.5">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className={cn(
                          "inline-block rounded-sm border border-white/[0.06] px-4 py-2",
                          "text-[11px] tracking-[0.12em] text-fg-muted",
                          "transition-all duration-400",
                          "hover:border-accent/20 hover:text-fg/80"
                        )}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resume downloads */}
        <div className="rs-reveal mt-12 flex flex-wrap items-center gap-4">
          <a
            href="/resume/%E7%AE%80%E5%8E%86%20_1_%20(1).pdf"
            download
            className={cn(
              "group inline-flex items-center gap-2.5 rounded-sm border border-white/[0.08] px-5 py-3",
              "text-xs tracking-[0.2em] text-fg-muted",
              "transition-all duration-500",
              "hover:border-accent/30 hover:text-fg"
            )}
          >
            <Download className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-px" />
            Resume (EN)
          </a>
          <a
            href="/resume/%E7%AE%80%E5%8E%86%20%E4%B8%AD%E6%96%87.pdf"
            download
            className={cn(
              "group inline-flex items-center gap-2.5 rounded-sm border border-white/[0.08] px-5 py-3",
              "text-xs tracking-[0.2em] text-fg-muted",
              "transition-all duration-500",
              "hover:border-accent/30 hover:text-fg"
            )}
          >
            <Download className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-px" />
            Resume (ZH)
          </a>
        </div>
      </div>
    </section>
  )
}
