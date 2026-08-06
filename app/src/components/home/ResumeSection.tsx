"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { RESUME_EDUCATION, RESUME_SKILLS } from "@/data/portfolio"
import ScrollReveal from "@/components/ScrollReveal"

const PROCESS_STEPS = [
  "Research and reference gathering",
  "Composition and blockout",
  "Light, atmosphere, and color scripting",
  "Final detail pass for narrative read",
]

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
      className="relative overflow-hidden py-28 md:py-36"
      style={{ zIndex: 70, position: "relative" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_18%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_16%_82%,rgba(255,255,255,0.06),transparent_20%)]" />

      <div className="relative z-10 mx-auto max-w-[1380px] px-6 lg:px-10 xl:px-14">
        <div className="rs-reveal mb-14 max-w-[54rem]">
          <p className="section-kicker">Background</p>
          <ScrollReveal
            scrollContainerRef={null}
            baseOpacity={0.1}
            baseRotation={2}
            blurStrength={4}
            enableBlur={true}
            containerClassName="mt-7"
            textClassName="section-heading text-[clamp(2.3rem,5vw,5rem)]"
          >
            Experience, tools, and the way the work gets built.
          </ScrollReveal>
          <p className="mt-6 max-w-[38rem] text-base leading-8 text-white/54">
            The back half of the site becomes a dossier: how I think, how I build, and where the work is headed next.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.96fr)_minmax(320px,0.8fr)]">
          <div className="space-y-5">
            <div className="story-panel rs-reveal p-6 md:p-7">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="border-b border-white/[0.08] pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-4">
                  <p className="text-[0.64rem] uppercase tracking-[0.28em] text-white/32">Primary Focus</p>
                  <p className="mt-4 text-2xl tracking-[0.03em] text-white">Environment</p>
                  <p className="mt-3 text-sm leading-7 text-white/52">Worlds, atmosphere, and spatial storytelling.</p>
                </div>
                <div className="border-b border-white/[0.08] pb-4 md:border-b-0 md:border-r md:pb-0 md:px-4">
                  <p className="text-[0.64rem] uppercase tracking-[0.28em] text-white/32">Workflow</p>
                  <p className="mt-4 text-2xl tracking-[0.03em] text-white">2D + 3D</p>
                  <p className="mt-3 text-sm leading-7 text-white/52">Painting, blockout, and visual development working together.</p>
                </div>
                <div className="md:pl-4">
                  <p className="text-[0.64rem] uppercase tracking-[0.28em] text-white/32">Status</p>
                  <p className="mt-4 text-2xl tracking-[0.03em] text-white">Open</p>
                  <p className="mt-3 text-sm leading-7 text-white/52">Available for selected commissions and collaborative projects.</p>
                </div>
              </div>
            </div>

            <div className="story-panel rs-reveal p-6 md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[0.72rem] uppercase tracking-[0.3em] text-white/36">Education</h3>
                <span className="story-chip bg-white/[0.02] text-white/48">Current track</span>
              </div>
              <div className="mt-7 space-y-5">
                {RESUME_EDUCATION.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[8px] border border-white/[0.06] bg-white/[0.02] p-5"
                  >
                    <p className="mb-2 text-[0.64rem] uppercase tracking-[0.24em] text-white/38">{item.period}</p>
                    <p className="mb-1 text-xl tracking-[0.03em] text-white/92">{item.title}</p>
                    <p className="mb-4 text-sm uppercase tracking-[0.16em] text-white/48">{item.org}</p>
                    {item.note && <p className="text-sm leading-7 text-white/54">{item.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="story-panel rs-reveal p-6 md:p-7">
              <h3 className="text-[0.72rem] uppercase tracking-[0.3em] text-white/36">Capabilities</h3>
              <div className="mt-6 space-y-7">
                {RESUME_SKILLS.map((group) => (
                  <div key={group.label}>
                    <p className="mb-3 text-[0.68rem] uppercase tracking-[0.24em] text-white/42">{group.label}</p>
                    <div className="flex flex-wrap gap-2.5">
                      {group.items.map((item) => (
                        <span
                          key={item}
                          className={cn(
                            "story-chip rounded-full border-white/[0.07] bg-white/[0.02]",
                            "text-white/62 transition-all duration-400 hover:border-white/[0.16] hover:text-white/88"
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

            <div className="story-panel rs-reveal p-6 md:p-7">
              <h3 className="text-[0.72rem] uppercase tracking-[0.3em] text-white/36">Working Cadence</h3>
              <div className="mt-6 space-y-4">
                {PROCESS_STEPS.map((item, index) => (
                  <div key={item} className="flex gap-4 border-b border-white/[0.06] pb-4 last:border-b-0 last:pb-0">
                    <span className="mt-1 text-[0.64rem] uppercase tracking-[0.24em] text-white/28">0{index + 1}</span>
                    <p className="text-sm leading-7 text-white/58">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rs-reveal mt-12 flex flex-wrap items-center gap-4">
          <a
            href="/resume/%E7%AE%80%E5%8E%86%20_1_%20(1).pdf"
            download
            className={cn("story-link group")}
          >
            <Download className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-px" />
            Resume (EN)
          </a>
          <a
            href="/resume/%E7%AE%80%E5%8E%86%20%E4%B8%AD%E6%96%87.pdf"
            download
            className={cn("story-link group")}
          >
            <Download className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-px" />
            Resume (ZH)
          </a>
          <Link href="/works" className="story-link">
            Browse Works
            <span>&#8599;</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
