"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { Download } from "lucide-react"
import { cn } from "@/lib/utils"

const education = [
  {
    period: "2023 — Present",
    title: "Visual Development & Concept Art",
    org: "Art Center / University",
    note: "Focus on environment design, character design, and visual storytelling.",
  },
]

const skills = [
  {
    label: "Disciplines",
    items: [
      "Concept Art",
      "Visual Development",
      "Environment Design",
      "Character Design",
      "Worldbuilding",
      "Digital Illustration",
    ],
  },
  {
    label: "Tools",
    items: ["Photoshop", "Procreate", "Maya", "Blender", "After Effects"],
  },
]

export function ResumeSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const fadeOverlayRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const rafRef = useRef(0)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) {
      gsap.set(contentRef.current, { opacity: 1 })
      return
    }

    if (sectionRef.current) {
      sectionRef.current.style.visibility = "hidden"
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=2500",
          pin: true,
          pinSpacing: true,
          scrub: 1.5,
          anticipatePin: 1,
          refreshPriority: -2,
          onEnter: () => {
            if (sectionRef.current) sectionRef.current.style.visibility = "visible"
          },
          onLeave: () => {
            if (sectionRef.current) sectionRef.current.style.visibility = "hidden"
          },
          onLeaveBack: () => {
            if (sectionRef.current) sectionRef.current.style.visibility = "hidden"
          },
          onEnterBack: () => {
            if (sectionRef.current) sectionRef.current.style.visibility = "visible"
          },
        },
      })

      // 进入视口即显示，确保 Experience & Skills 页面一定会出现（图1 → 本页 → 图2）
      tl.fromTo(contentRef.current,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.18, ease: "power3.out" },
        0
      )

      const revealEls = sectionRef.current?.querySelectorAll(".s-reveal")
      if (revealEls?.length) {
        tl.fromTo(revealEls,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.1, stagger: 0.015, ease: "power2.out" },
          0.06
        )
      }

      // Hold content visible (0.25 – 0.78)

      tl.to(contentRef.current, { opacity: 0, y: -40, duration: 0.12, ease: "power2.in" }, 0.80)

      tl.fromTo(fadeOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.15, ease: "power2.inOut" },
        0.85
      )
    }, sectionRef)

    const onMove = (e: MouseEvent) => {
      mouseRef.current.tx = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.ty = (e.clientY / window.innerHeight) * 2 - 1
    }
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const tick = () => {
      const m = mouseRef.current
      m.x = lerp(m.x, m.tx, 0.05)
      m.y = lerp(m.y, m.ty, 0.05)
      if (contentRef.current && parseFloat(contentRef.current.style.opacity || "0") > 0) {
        contentRef.current.style.transform = `translate(${m.x * -10}px, ${m.y * -6}px)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      ctx.revert()
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <section
      id="resume"
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
      style={{ scrollMarginTop: 0, zIndex: 40, position: "relative" }}
    >
      <div className="absolute inset-0 section-bg" />
      {/* Floating CSS 3D shapes */}
      <div className="absolute left-[5%] top-[15%] w-16 h-16 border border-accent/[0.05] pointer-events-none animate-blob-1" style={{ transform: "rotate(30deg) perspective(400px) rotateY(20deg) rotateX(15deg)" }} />
      <div className="absolute right-[8%] top-[25%] w-12 h-12 border border-white/[0.03] pointer-events-none animate-blob-2" style={{ transform: "rotate(-40deg) perspective(400px) rotateX(25deg)" }} />
      <div className="absolute left-[15%] bottom-[20%] w-20 h-20 border border-accent/[0.04] pointer-events-none animate-blob-3" style={{ transform: "rotate(60deg) perspective(400px) rotateY(-25deg)" }} />

      {/* Content — fades in directly */}
      <div ref={contentRef} className="absolute inset-0 flex items-center z-10 opacity-0" style={{ willChange: "transform" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-10 w-full py-16">
          <div className="s-reveal mb-12 md:mb-16">
            <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-accent mb-4">Background</p>
            <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl tracking-[0.08em] text-fg">EXPERIENCE & SKILLS</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <h3 className="s-reveal text-[10px] font-medium uppercase tracking-[0.35em] text-fg-muted mb-6">Education</h3>
              <div className="space-y-6">
                {education.map((item) => (
                  <div key={item.title} className="s-reveal skill-card-3d rounded-sm border border-white/[0.04] p-5 transition-all duration-500 hover:border-white/[0.08] hover:bg-white/[0.01]">
                    <p className="text-[10px] tracking-[0.2em] text-accent/60 mb-2">{item.period}</p>
                    <p className="text-base md:text-lg font-medium text-fg/90 mb-1">{item.title}</p>
                    <p className="text-sm text-fg-muted mb-2">{item.org}</p>
                    <p className="text-xs leading-relaxed text-fg-subtle">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="s-reveal text-[10px] font-medium uppercase tracking-[0.35em] text-fg-muted mb-6">Skills &amp; Tools</h3>
              <div className="space-y-8">
                {skills.map((group) => (
                  <div key={group.label} className="s-reveal">
                    <p className="text-xs tracking-[0.15em] text-fg-muted mb-3">{group.label}</p>
                    <div className="flex flex-wrap gap-2.5">
                      {group.items.map((item) => (
                        <span key={item} className={cn("skill-tag-3d inline-block rounded-sm border border-white/[0.06] px-4 py-2", "text-[11px] tracking-[0.12em] text-fg-muted", "transition-all duration-400", "hover:border-accent/25 hover:text-fg/80 hover:bg-white/[0.02]", "hover:shadow-[0_0_15px_-4px_hsl(var(--glow)/0.1)]")}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="s-reveal mt-14 flex flex-wrap items-center gap-4">
            <a href="/resume/%E7%AE%80%E5%8E%86%20_1_%20(1).pdf" download className={cn("group inline-flex items-center gap-2.5 rounded-sm border border-white/[0.08] px-5 py-3", "text-xs tracking-[0.2em] text-fg-muted", "transition-all duration-500", "hover:border-accent/30 hover:text-fg hover:shadow-[0_0_20px_-4px_hsl(var(--glow)/0.15)]")}>
              <Download className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-px" />
              Resume (EN)
            </a>
            <a href="/resume/%E7%AE%80%E5%8E%86%20%E4%B8%AD%E6%96%87.pdf" download className={cn("group inline-flex items-center gap-2.5 rounded-sm border border-white/[0.08] px-5 py-3", "text-xs tracking-[0.2em] text-fg-muted", "transition-all duration-500", "hover:border-accent/30 hover:text-fg hover:shadow-[0_0_20px_-4px_hsl(var(--glow)/0.15)]")}>
              <Download className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-px" />
              简历（中文）
            </a>
          </div>
        </div>
      </div>

      {/* Fade-out overlay for smooth transition to next section */}
      <div
        ref={fadeOverlayRef}
        className="absolute inset-0 z-[35] pointer-events-none opacity-0"
        style={{ background: "hsl(240 8% 2.5%)" }}
      />

      <div className="absolute inset-0 vignette pointer-events-none z-[5]" />
    </section>
  )
}
