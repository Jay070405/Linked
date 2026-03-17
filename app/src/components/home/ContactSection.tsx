"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { Mail, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

const socialLinks = [
  { label: "ArtStation", href: "https://artstation.com/shijielin" },
  { label: "LinkedIn", href: "https://linkedin.com/in/shijielin" },
  { label: "Instagram", href: "https://instagram.com/shijielin" },
]

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const rafRef = useRef(0)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      const elements = sectionRef.current?.querySelectorAll(".reveal")
      if (!elements) return

      elements.forEach((el, i) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
          opacity: 0, y: 30, duration: 0.9, delay: i * 0.1, ease: "power3.out",
        })
      })
    }, sectionRef)

    const onMove = (e: MouseEvent) => {
      mouseRef.current.tx = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.ty = (e.clientY / window.innerHeight) * 2 - 1
    }
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const tick = () => {
      const m = mouseRef.current
      m.x = lerp(m.x, m.tx, 0.04)
      m.y = lerp(m.y, m.ty, 0.04)
      if (contentRef.current) {
        contentRef.current.style.transform = `translate(${m.x * -8}px, ${m.y * -5}px) perspective(800px) rotateY(${m.x * 1.5}deg) rotateX(${m.y * -0.8}deg)`
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
      id="contact"
      ref={sectionRef}
      className="relative py-32 md:py-44"
      style={{ zIndex: 30, position: "relative" }}
    >
      <div className="absolute inset-0 section-bg" />
      {/* Top gradient edge — blends with About above */}
      <div className="section-edge-top" />

      {/* Floating CSS 3D shapes */}
      <div className="absolute left-[10%] top-[20%] w-14 h-14 border border-accent/[0.06] pointer-events-none animate-blob-2" style={{ transform: "rotate(25deg) perspective(400px) rotateY(20deg)" }} />
      <div className="absolute right-[15%] top-[30%] w-10 h-10 border border-white/[0.04] pointer-events-none animate-blob-1" style={{ transform: "rotate(-35deg) perspective(400px) rotateX(25deg) rotateY(-15deg)" }} />
      <div className="absolute left-[20%] bottom-[15%] w-16 h-16 border border-accent/[0.04] pointer-events-none animate-blob-3" style={{ transform: "rotate(50deg) perspective(400px) rotateY(-20deg)" }} />

      <div
        ref={contentRef}
        className="mx-auto max-w-3xl px-6 lg:px-10 text-center relative z-10"
        style={{ willChange: "transform", transformStyle: "preserve-3d" }}
      >
        <p className="reveal text-[10px] font-medium uppercase tracking-[0.4em] text-accent mb-8">Contact</p>

        <h2 className="reveal font-heading text-3xl md:text-5xl lg:text-6xl tracking-[0.08em] text-fg mb-6">
          LET&apos;S CONNECT
        </h2>

        <p className="reveal text-sm md:text-base leading-relaxed text-fg-muted max-w-lg mx-auto mb-14">
          Open to freelance projects, collaborations, and concept art commissions. Let&apos;s build something extraordinary together.
        </p>

        <a
          href="mailto:contact@shijielin.com"
          className={cn(
            "reveal contact-btn-3d group inline-flex items-center gap-3 rounded-sm border border-white/[0.08] px-7 py-4",
            "text-sm tracking-[0.15em] text-fg-muted",
            "transition-all duration-500",
            "hover:border-accent/30 hover:text-fg",
            "hover:shadow-[0_0_30px_-6px_hsl(var(--glow)/0.2)]"
          )}
        >
          <Mail className="h-4 w-4 text-accent/60 transition-colors duration-300 group-hover:text-accent" />
          contact@shijielin.com
        </a>

        <div className="reveal mt-12 flex items-center justify-center gap-8">
          {socialLinks.map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 text-[11px] tracking-[0.2em] text-fg-subtle transition-all duration-300 hover:text-fg-muted hover:-translate-y-0.5">
              {label}
              <ExternalLink className="h-2.5 w-2.5 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-px group-hover:-translate-y-px" />
            </a>
          ))}
        </div>

        <div className="reveal mt-20 flex justify-center">
          <div className="h-12 w-px bg-gradient-to-b from-accent/20 to-transparent" />
        </div>
      </div>
    </section>
  )
}
