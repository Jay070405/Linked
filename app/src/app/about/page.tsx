"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { ArrowLeft, Download, Mail } from "lucide-react"

/* ── Data ───────────────────────────────────── */

const heroImage = "/image/personal/world tree.png"

const artistStatement =
  "I craft worlds that exist in the space between imagination and reality — designing the environments, characters, and atmospheres that bring fantasy narratives to life."

const bioSections = [
  {
    title: "Background",
    text: "I'm Shijie Lin, a concept artist and visual development artist specializing in fantasy worldbuilding. My journey began with a deep fascination for the surreal and the mythological — stories that transport you to places that feel both impossible and inevitable.",
  },
  {
    title: "Practice",
    text: "My work spans environment design, character design, and cinematic illustration. I approach each piece as a fragment of a larger narrative — every rock formation, every shaft of light, every silhouette tells a story. I draw heavily from Eastern and Western mythology, architectural history, and the natural world.",
  },
  {
    title: "Vision",
    text: "Currently focused on building immersive visual worlds through digital painting, 3D exploration, and cross-media visual development. I believe the best concept art doesn't just show you a place — it makes you feel like you've been there before, in a dream you can't quite remember.",
  },
]

const approach = [
  {
    label: "Narrative First",
    description: "Every environment tells a story. I start with the emotion and narrative purpose before touching a single brush stroke.",
  },
  {
    label: "World Logic",
    description: "Believable worlds need internal consistency — from geological formations to architectural traditions to how light interacts with atmosphere.",
  },
  {
    label: "Mood & Atmosphere",
    description: "Color, light, and composition are my primary tools for establishing the emotional tone that draws viewers into the world.",
  },
  {
    label: "Cross-Media Thinking",
    description: "I work across 2D painting, 3D blockout, and photo-bashing to find the approach that best serves each piece's intent.",
  },
]

const disciplines = [
  "Concept Art",
  "Visual Development",
  "Environment Design",
  "Character Design",
  "Worldbuilding",
  "Digital Illustration",
  "Matte Painting",
  "Storyboarding",
]

const tools = [
  { name: "Photoshop", level: 95 },
  { name: "Procreate", level: 90 },
  { name: "Maya", level: 75 },
  { name: "Blender", level: 70 },
  { name: "After Effects", level: 65 },
  { name: "ZBrush", level: 55 },
]

const education = [
  {
    period: "2023 — Present",
    title: "Visual Development & Concept Art",
    org: "University Program",
    description: "Focused study in environment design, character design, visual storytelling, and production pipeline for animation and games.",
  },
]

const galleryImages = [
  { src: "/image/personal/sakura-villege.png", title: "Sakura Village", category: "Environment" },
  { src: "/image/personal/%E6%A3%AE%E6%9E%97.png", title: "Enchanted Forest", category: "Environment" },
  { src: "/image/personal/%E5%89%91%E4%BB%99.png", title: "Sword Immortal", category: "Character" },
  { src: "/image/school/enviroment 1.png", title: "Environment Study I", category: "School" },
  { src: "/image/school/vis_dev_character.png", title: "Vis Dev Character", category: "School" },
  { src: "/image/school/24FA_MonBGptg_Wk12_v02_Jay.png", title: "Background Painting", category: "School" },
]

/* ── Page ────────────────────────────────────── */

export default function AboutPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const rafRef = useRef(0)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      // Reveal animations
      const revealEls = pageRef.current?.querySelectorAll(".rv")
      revealEls?.forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.9, delay: i * 0.03, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 93%", toggleActions: "play none none none" },
          }
        )
      })

      // Parallax hero image
      const heroImg = pageRef.current?.querySelector(".hero-parallax")
      if (heroImg) {
        gsap.fromTo(heroImg,
          { y: 0 },
          {
            y: -60, ease: "none",
            scrollTrigger: { trigger: heroImg, start: "top bottom", end: "bottom top", scrub: 2 },
          }
        )
      }

      // Skill bar animations
      const bars = pageRef.current?.querySelectorAll(".skill-fill")
      bars?.forEach((bar) => {
        const width = (bar as HTMLElement).dataset.level || "0"
        gsap.fromTo(bar,
          { width: "0%" },
          {
            width: `${width}%`, duration: 1.2, ease: "power3.out",
            scrollTrigger: { trigger: bar, start: "top 90%", toggleActions: "play none none none" },
          }
        )
      })

      // Gallery card 3D entrance
      const cards = pageRef.current?.querySelectorAll(".gal-card")
      cards?.forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, y: 60, rotateY: (i % 2 === 0 ? -8 : 8), scale: 0.9 },
          {
            opacity: 1, y: 0, rotateY: 0, scale: 1, duration: 0.9, delay: i * 0.08, ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 92%", toggleActions: "play none none none" },
          }
        )
      })
    }, pageRef)

    // Mouse parallax
    const onMove = (e: MouseEvent) => {
      mouseRef.current.tx = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.ty = (e.clientY / window.innerHeight) * 2 - 1
    }
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const tick = () => {
      const m = mouseRef.current
      m.x = lerp(m.x, m.tx, 0.04)
      m.y = lerp(m.y, m.ty, 0.04)

      const heroEl = pageRef.current?.querySelector(".hero-mouse-parallax") as HTMLElement
      if (heroEl) {
        heroEl.style.transform = `translate(${m.x * -15}px, ${m.y * -10}px)`
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
    <>
      <Navigation />
      <div ref={pageRef} className="relative" style={{ background: "hsl(240 10% 2%)" }}>

        {/* ═══════════════════════════════════════
            HERO
            ═══════════════════════════════════════ */}
        <section className="relative h-[85vh] min-h-[550px] overflow-hidden flex items-end">
          {/* Background image with parallax */}
          <div className="absolute inset-0">
            <div className="hero-parallax hero-mouse-parallax absolute inset-[-40px]">
              <img
                src={heroImage}
                alt="Featured artwork"
                className="w-full h-full object-cover"
                style={{ filter: "brightness(0.4) saturate(0.8)" }}
                draggable={false}
              />
            </div>
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, hsl(240 10% 2%) 0%, hsl(240 10% 2% / 0.4) 40%, transparent 70%)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, hsl(240 10% 2% / 0.6) 0%, transparent 50%)" }} />
          </div>

          {/* Hero content */}
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 w-full pb-16 md:pb-24">
            <Link
              href="/"
              className="rv inline-flex items-center gap-2 text-[10px] tracking-[0.25em] text-fg-muted/60 mb-8 transition-colors duration-300 hover:text-fg-muted"
            >
              <ArrowLeft className="h-3 w-3" /> BACK TO HOME
            </Link>

            <p className="rv text-[10px] font-medium uppercase tracking-[0.5em] text-accent mb-4">
              About the Artist
            </p>
            <h1 className="rv font-heading text-4xl md:text-6xl lg:text-7xl tracking-[0.08em] text-fg leading-[1.05] mb-6 max-w-3xl">
              SHIJIE LIN
            </h1>
            <p className="rv text-sm md:text-base text-fg-muted/70 max-w-xl leading-relaxed">
              Concept Artist &middot; Visual Development &middot; Fantasy Worldbuilding
            </p>
          </div>

          {/* Vignette */}
          <div className="absolute inset-0 vignette pointer-events-none" />
        </section>

        {/* ═══════════════════════════════════════
            ARTIST STATEMENT
            ═══════════════════════════════════════ */}
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-4xl px-6 lg:px-10 text-center">
            <div className="rv h-12 w-px bg-gradient-to-b from-accent/30 to-transparent mx-auto mb-12" />
            <blockquote className="rv">
              <p className="font-heading text-2xl md:text-3xl lg:text-[2.5rem] leading-[1.5] tracking-[0.04em] text-fg/90">
                &ldquo;{artistStatement}&rdquo;
              </p>
            </blockquote>
            <div className="rv h-12 w-px bg-gradient-to-t from-accent/20 to-transparent mx-auto mt-12" />
          </div>
        </section>

        {/* ═══════════════════════════════════════
            BIO SECTIONS
            ═══════════════════════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="rv h-px w-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent mb-20" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
              {bioSections.map((section) => (
                <div key={section.title}>
                  <p className="rv text-[10px] font-medium uppercase tracking-[0.4em] text-accent mb-5">
                    {section.title}
                  </p>
                  <p className="rv text-sm md:text-[15px] leading-[1.9] text-fg-muted">
                    {section.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            APPROACH / PHILOSOPHY
            ═══════════════════════════════════════ */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          {/* Subtle background */}
          <div className="absolute left-[10%] top-[20%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full animate-blob-1 pointer-events-none" style={{ background: "radial-gradient(circle, hsl(38 50% 61% / 0.03), transparent 70%)" }} />

          <div className="mx-auto max-w-7xl px-6 lg:px-10 relative z-10">
            <div className="rv h-px w-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent mb-20" />

            <div className="mb-14">
              <p className="rv text-[10px] font-medium uppercase tracking-[0.4em] text-accent mb-4">
                Approach
              </p>
              <h2 className="rv font-heading text-2xl md:text-4xl tracking-[0.06em] text-fg">
                HOW I WORK
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {approach.map((item, i) => (
                <div
                  key={item.label}
                  className="rv group rounded-sm border border-white/[0.04] p-6 md:p-8 transition-all duration-500 hover:border-white/[0.08] hover:bg-white/[0.01]"
                  style={{ perspective: "600px" }}
                >
                  <div className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full border border-accent/20 flex items-center justify-center text-[10px] tracking-wide text-accent/60 font-medium">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-base md:text-lg font-medium text-fg/90 mb-2 tracking-wide">
                        {item.label}
                      </h3>
                      <p className="text-sm leading-[1.8] text-fg-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SKILLS & TOOLS
            ═══════════════════════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="rv h-px w-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent mb-20" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
              {/* Disciplines */}
              <div>
                <p className="rv text-[10px] font-medium uppercase tracking-[0.4em] text-accent mb-4">
                  Disciplines
                </p>
                <h2 className="rv font-heading text-2xl md:text-4xl tracking-[0.06em] text-fg mb-10">
                  WHAT I DO
                </h2>

                <div className="flex flex-wrap gap-3">
                  {disciplines.map((d) => (
                    <span
                      key={d}
                      className="rv skill-tag-3d inline-block rounded-sm border border-white/[0.06] px-5 py-2.5 text-[11px] tracking-[0.15em] text-fg-muted transition-all duration-400 hover:border-accent/25 hover:text-fg/80 hover:bg-white/[0.02] hover:shadow-[0_0_15px_-4px_hsl(var(--glow)/0.1)]"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tools with proficiency bars */}
              <div>
                <p className="rv text-[10px] font-medium uppercase tracking-[0.4em] text-accent mb-4">
                  Tools
                </p>
                <h2 className="rv font-heading text-2xl md:text-4xl tracking-[0.06em] text-fg mb-10">
                  WHAT I USE
                </h2>

                <div className="space-y-6">
                  {tools.map((tool) => (
                    <div key={tool.name} className="rv">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-fg/80 tracking-wide">{tool.name}</span>
                        <span className="text-[10px] text-fg-subtle tracking-[0.15em]">{tool.level}%</span>
                      </div>
                      <div className="h-[2px] w-full bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className="skill-fill h-full rounded-full"
                          data-level={tool.level}
                          style={{
                            width: "0%",
                            background: `linear-gradient(to right, hsl(38 50% 61% / 0.6), hsl(38 50% 61% / 0.25))`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            EDUCATION
            ═══════════════════════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="rv h-px w-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent mb-20" />

            <div className="max-w-2xl">
              <p className="rv text-[10px] font-medium uppercase tracking-[0.4em] text-accent mb-4">
                Education
              </p>
              <h2 className="rv font-heading text-2xl md:text-4xl tracking-[0.06em] text-fg mb-10">
                BACKGROUND
              </h2>

              <div className="space-y-8">
                {education.map((item) => (
                  <div
                    key={item.title}
                    className="rv border-l-2 border-accent/20 pl-6 md:pl-8"
                  >
                    <p className="text-[10px] tracking-[0.25em] text-accent/60 mb-2">{item.period}</p>
                    <h3 className="text-lg md:text-xl font-medium text-fg/90 mb-1 tracking-wide">{item.title}</h3>
                    <p className="text-sm text-fg-muted mb-2">{item.org}</p>
                    <p className="text-sm leading-[1.8] text-fg-subtle">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            SELECTED GALLERY
            ═══════════════════════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="rv h-px w-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent mb-20" />

            <div className="mb-14 flex items-end justify-between">
              <div>
                <p className="rv text-[10px] font-medium uppercase tracking-[0.4em] text-accent mb-4">
                  Gallery
                </p>
                <h2 className="rv font-heading text-2xl md:text-4xl tracking-[0.06em] text-fg">
                  SELECTED WORKS
                </h2>
              </div>
              <Link href="/works" className="rv text-[11px] tracking-[0.2em] text-fg-muted/50 transition-colors duration-300 hover:text-fg-muted hidden md:block">
                VIEW ALL →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5" style={{ perspective: "1000px" }}>
              {galleryImages.map((img) => (
                <div
                  key={img.title}
                  className="gal-card group relative overflow-hidden rounded-sm border border-white/[0.06] transition-all duration-500 hover:border-white/[0.12] hover:shadow-[0_12px_50px_-10px_rgba(0,0,0,0.6)]"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <img
                    src={img.src}
                    alt={img.title}
                    className="w-full h-[240px] md:h-[280px] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="carousel-card-shine" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <p className="text-[9px] uppercase tracking-[0.25em] text-accent/60 mb-1">{img.category}</p>
                    <p className="text-sm text-fg/80 font-medium tracking-wide">{img.title}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rv mt-8 md:hidden text-center">
              <Link href="/works" className="text-[11px] tracking-[0.2em] text-fg-muted/50 transition-colors duration-300 hover:text-fg-muted">
                VIEW ALL WORKS →
              </Link>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
            CTA / CONTACT
            ═══════════════════════════════════════ */}
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-4xl px-6 lg:px-10 text-center">
            <div className="rv h-px w-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent mb-20" />

            <p className="rv text-[10px] font-medium uppercase tracking-[0.4em] text-accent mb-6">
              Get in Touch
            </p>
            <h2 className="rv font-heading text-3xl md:text-5xl tracking-[0.06em] text-fg mb-6">
              LET&apos;S CREATE TOGETHER
            </h2>
            <p className="rv text-sm md:text-base leading-relaxed text-fg-muted max-w-lg mx-auto mb-10">
              Open to freelance projects, collaborations, and concept art commissions.
            </p>

            <div className="rv flex flex-wrap items-center justify-center gap-4">
              <a
                href="mailto:contact@shijielin.com"
                className="group inline-flex items-center gap-3 border border-white/[0.1] rounded-sm px-7 py-3.5 text-xs tracking-[0.2em] text-fg-muted transition-all duration-500 hover:border-accent/30 hover:text-fg hover:shadow-[0_0_30px_-8px_hsl(var(--glow)/0.15)]"
              >
                <Mail className="h-3.5 w-3.5 text-accent/50 group-hover:text-accent transition-colors duration-300" />
                CONTACT ME
              </a>
              <a
                href="/resume/%E7%AE%80%E5%8E%86%20_1_%20(1).pdf"
                download
                className="group inline-flex items-center gap-3 border border-white/[0.1] rounded-sm px-7 py-3.5 text-xs tracking-[0.2em] text-fg-muted transition-all duration-500 hover:border-accent/30 hover:text-fg hover:shadow-[0_0_30px_-8px_hsl(var(--glow)/0.15)]"
              >
                <Download className="h-3.5 w-3.5 text-accent/50 group-hover:text-accent transition-colors duration-300" />
                DOWNLOAD RESUME
              </a>
            </div>

            <div className="rv h-12 w-px bg-gradient-to-b from-accent/15 to-transparent mx-auto mt-16" />
          </div>
        </section>

      </div>
      <Footer />
    </>
  )
}
