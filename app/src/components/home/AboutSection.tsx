"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"

const statement =
  "I craft worlds that exist between imagination and reality."

const images = [
  { src: "/image/personal/sakura-villege.png", alt: "Sakura Village" },
  { src: "/image/personal/artist%20(1).png", alt: "Self Portrait" },
  { src: "/image/personal/world%20tree.png", alt: "World Tree" },
  { src: "/image/personal/%E5%AF%BA%E5%BA%99%E8%8D%89%E7%A8%BF.jpg", alt: "Temple Sketch" },
]

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const rafRef = useRef(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.tx = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.ty = (e.clientY / window.innerHeight) * 2 - 1
    }
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const tick = () => {
      const m = mouseRef.current
      m.x = lerp(m.x, m.tx, 0.04)
      m.y = lerp(m.y, m.ty, 0.04)

      const cards = sectionRef.current?.querySelectorAll(".ab-img") as NodeListOf<HTMLElement> | undefined
      cards?.forEach((card, i) => {
        const d = [1, 0.6, 0.8, 0.5][i] || 0.7
        card.style.transform = `translate(${m.x * 12 * d}px, ${m.y * 8 * d}px) perspective(600px) rotateY(${m.x * 4 * d}deg) rotateX(${m.y * -3 * d}deg)`
      })

      rafRef.current = requestAnimationFrame(tick)
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-28 md:py-40 overflow-hidden"
      style={{ zIndex: 30, position: "relative" }}
    >
      <div className="absolute inset-0 section-bg" />
      {/* Top gradient edge — blends with CinematicTransition above */}
      <div className="section-edge-top" />
      {/* Bottom gradient edge — blends with Contact below */}
      <div className="section-edge-bottom" />

      {/* Ambient blobs */}
      <div className="absolute top-[25%] left-[5%] w-[35vw] h-[35vw] max-w-[450px] max-h-[450px] rounded-full animate-blob-2 pointer-events-none" style={{ background: "radial-gradient(circle, hsl(38 50% 61% / 0.04), transparent 70%)" }} />
      <div className="absolute bottom-[15%] right-[8%] w-[28vw] h-[28vw] max-w-[350px] max-h-[350px] rounded-full animate-blob-3 pointer-events-none" style={{ background: "radial-gradient(circle, hsl(260 30% 50% / 0.03), transparent 70%)" }} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        {/* Layout: left text + right mosaic */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left: Text */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-accent mb-8">
              About
            </p>

            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl tracking-[0.06em] text-fg leading-[1.15] mb-8">
              {statement}
            </h2>

            <p className="text-sm md:text-base leading-[1.8] text-fg-muted mb-6 max-w-lg">
              Specializing in fantasy worldbuilding, environment design, and cinematic illustration.
              My work spans concept art, visual development, and narrative-driven imagery.
            </p>

            <p className="text-sm md:text-base leading-[1.8] text-fg-muted mb-10 max-w-lg">
              Currently focused on building immersive visual worlds through digital painting,
              3D exploration, and cross-media visual development.
            </p>

            <Link
              href="/about"
              className="group inline-flex items-center gap-3 border border-white/[0.1] rounded-sm px-6 py-3.5 text-xs tracking-[0.2em] text-fg-muted transition-all duration-500 hover:border-accent/30 hover:text-fg hover:shadow-[0_0_30px_-8px_hsl(var(--glow)/0.15)] hover:-translate-y-0.5"
            >
              LEARN MORE
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {/* Right: Image mosaic */}
          <div className="relative" style={{ perspective: "800px" }}>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="ab-img col-span-2 relative overflow-hidden rounded-sm border border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.5)]" style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
                <img src={images[0].src} alt={images[0].alt} className="w-full h-[220px] md:h-[280px] object-cover" loading="lazy" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>

              <div className="ab-img relative overflow-hidden rounded-sm border border-white/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.4)]" style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
                <img src={images[1].src} alt={images[1].alt} className="w-full h-[180px] md:h-[220px] object-cover" loading="lazy" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

              <div className="ab-img relative overflow-hidden rounded-sm border border-white/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.4)]" style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
                <img src={images[2].src} alt={images[2].alt} className="w-full h-[180px] md:h-[220px] object-cover" loading="lazy" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>

              <div className="ab-img col-span-2 relative overflow-hidden rounded-sm border border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.5)]" style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
                <img src={images[3].src} alt={images[3].alt} className="w-full h-[160px] md:h-[200px] object-cover object-top" loading="lazy" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
