"use client"

import { useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import gsap from "gsap"
import { ALL_WORKS } from "@/data/portfolio"

export default function WorkDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const heroRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const workIndex = ALL_WORKS.findIndex((w) => w.slug === slug)
  const work = ALL_WORKS[workIndex]

  const prevWork = workIndex > 0 ? ALL_WORKS[workIndex - 1] : null
  const nextWork = workIndex < ALL_WORKS.length - 1 ? ALL_WORKS[workIndex + 1] : null

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, scale: 1.02 },
        { opacity: 1, scale: 1, duration: 1, ease: "power2.out" }
      )

      const lines = contentRef.current?.querySelectorAll(".detail-line")
      if (lines?.length) {
        gsap.fromTo(
          lines,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: "power3.out", delay: 0.3 }
        )
      }
    })

    return () => ctx.revert()
  }, [slug])

  if (!work) {
    return (
      <div className="min-h-screen bg-bg text-fg flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-3xl tracking-[0.06em] mb-4">Work not found</h1>
          <Link
            href="/works"
            className="text-xs tracking-[0.2em] text-fg-muted hover:text-fg transition-colors duration-300"
          >
            &larr; Back to Works
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Fixed nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 lg:px-10">
          <Link
            href="/"
            className="font-heading text-sm tracking-[0.25em] text-fg/90 transition-opacity duration-300 hover:opacity-60"
          >
            SHIJIE LIN
          </Link>
          <Link
            href="/works"
            className="text-[11px] font-medium tracking-[0.2em] text-fg-muted transition-colors duration-300 hover:text-fg"
          >
            &larr; All Works
          </Link>
        </div>
      </header>

      <main className="relative z-10 pt-24 pb-20">
        {/* Hero image */}
        <div ref={heroRef} className="mx-auto max-w-[1400px] px-6 lg:px-10 mb-12 md:mb-16">
          <div
            className="relative w-full overflow-hidden rounded-sm"
            style={{ aspectRatio: "16 / 9" }}
          >
            <Image
              src={work.src}
              alt={work.title}
              fill
              sizes="(min-width: 1280px) 1400px, 95vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="mx-auto max-w-[1200px] px-6 lg:px-10">
          <div className="flex flex-col md:flex-row gap-10 md:gap-16">
            {/* Sticky side meta — desktop */}
            <aside className="hidden md:block md:w-48 lg:w-56 shrink-0">
              <div className="sticky top-28 space-y-6">
                {work.date && (
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-fg-subtle mb-1">Year</p>
                    <p className="text-sm text-fg-muted font-mono">{work.date}</p>
                  </div>
                )}
                <div>
                  <p className="text-[9px] tracking-[0.25em] uppercase text-fg-subtle mb-1">Category</p>
                  <p className="text-sm text-fg-muted">{work.category}</p>
                </div>
                {work.role && (
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-fg-subtle mb-1">Role</p>
                    <p className="text-sm text-fg-muted">{work.role}</p>
                  </div>
                )}
                {work.tools && work.tools.length > 0 && (
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-fg-subtle mb-1">Tools</p>
                    <div className="flex flex-wrap gap-1.5">
                      {work.tools.map((tool) => (
                        <span key={tool} className="text-[9px] tracking-[0.1em] text-fg-muted/60 border border-white/[0.06] px-2 py-1 rounded-sm font-mono">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Mobile meta row */}
            <div className="md:hidden flex flex-wrap items-center gap-3 mb-4 detail-line">
              {work.date && <span className="text-[10px] tracking-[0.2em] text-fg-subtle font-mono">{work.date}</span>}
              <span className="text-[10px] tracking-[0.25em] uppercase text-accent/70">{work.category}</span>
              {work.role && <span className="text-[10px] tracking-[0.15em] text-fg-muted">{work.role}</span>}
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h1 className="detail-line font-heading text-4xl md:text-5xl lg:text-6xl tracking-[0.04em] text-fg leading-[1.1] mb-6">
                {work.title}
              </h1>

              {/* Description */}
              {work.description && (
                <p className="detail-line text-base md:text-lg leading-[1.7] text-fg-muted max-w-[640px] mb-8">
                  {work.description}
                </p>
              )}

              {/* Process timeline */}
              {work.process && work.process.length > 0 && (
                <div className="detail-line mb-10">
                  <p className="text-[9px] tracking-[0.25em] uppercase text-fg-subtle mb-4">Process</p>
                  <div className="flex items-center gap-0 overflow-x-auto pb-2">
                    {work.process.map((step, i) => (
                      <div key={step} className="flex items-center shrink-0">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-white/20 border border-white/10" />
                          <p className="text-[9px] tracking-[0.1em] text-fg-muted/50 mt-2 font-mono whitespace-nowrap">{step}</p>
                        </div>
                        {i < (work.process?.length ?? 0) - 1 && (
                          <div className="w-12 h-px bg-white/[0.06] mx-2 mt-[-14px]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mood & Notes */}
              {(work.mood?.length || work.notes) ? (
                <div className="detail-line mb-10">
                  {work.mood && work.mood.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {work.mood.map((m) => (
                        <span key={m} className="text-[8px] tracking-[0.15em] uppercase px-2 py-1 bg-white/[0.04] rounded-sm text-fg-muted/50 font-mono">{m}</span>
                      ))}
                    </div>
                  )}
                  {work.notes && (
                    <details className="group">
                      <summary className="text-[10px] tracking-[0.2em] uppercase text-fg-subtle cursor-pointer hover:text-fg-muted transition-colors duration-300 select-none">
                        Art Direction Notes
                        <span className="ml-1 text-[8px] group-open:rotate-90 inline-block transition-transform duration-200">▶</span>
                      </summary>
                      <p className="mt-3 text-sm leading-[1.8] text-fg-muted/70 max-w-[560px]">{work.notes}</p>
                    </details>
                  )}
                </div>
              ) : null}

              {/* Tags */}
              <div className="detail-line flex flex-wrap gap-2 mb-16">
                {work.tags.map((tag) => (
                  <span key={tag} className="text-[9px] uppercase tracking-[0.2em] text-fg-muted/50 border border-white/[0.06] px-3 py-1.5 rounded-sm font-mono">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Divider */}
              <div className="detail-line h-px bg-white/[0.06] mb-10" />

              {/* Related works */}
              {(() => {
                const related = ALL_WORKS.filter((w) => w.category === work.category && w.slug !== work.slug).slice(0, 4)
                if (!related.length) return null
                return (
                  <div className="detail-line mb-12">
                    <p className="text-[9px] tracking-[0.25em] uppercase text-fg-subtle mb-4">Related Works</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                      {related.map((r) => (
                        <Link key={r.slug} href={`/works/${r.slug}`} className="shrink-0 w-40 group">
                          <div className="relative w-full overflow-hidden rounded-sm" style={{ aspectRatio: "16/10" }}>
                            <Image src={r.src} alt={r.title} fill sizes="160px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                          </div>
                          <p className="mt-2 text-[10px] tracking-[0.02em] text-fg-muted/60 group-hover:text-fg-muted transition-colors duration-300 truncate">{r.title}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Prev / Next */}
              <nav className="detail-line flex items-center justify-between gap-6">
                {prevWork ? (
                  <Link href={`/works/${prevWork.slug}`} className="group flex flex-col gap-1 max-w-[45%]">
                    <span className="text-[9px] uppercase tracking-[0.25em] text-fg-subtle">Previous</span>
                    <span className="text-sm tracking-[0.02em] text-fg-muted transition-colors duration-300 group-hover:text-fg truncate">{prevWork.title}</span>
                  </Link>
                ) : <div />}
                {nextWork ? (
                  <Link href={`/works/${nextWork.slug}`} className="group flex flex-col gap-1 items-end max-w-[45%]">
                    <span className="text-[9px] uppercase tracking-[0.25em] text-fg-subtle">Next</span>
                    <span className="text-sm tracking-[0.02em] text-fg-muted transition-colors duration-300 group-hover:text-fg truncate">{nextWork.title}</span>
                  </Link>
                ) : <div />}
              </nav>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-12 relative z-10">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 flex items-center justify-between">
          <Link
            href="/works"
            className="font-heading text-xs tracking-[0.35em] text-fg-muted hover:text-fg transition-colors duration-300"
          >
            &larr; All Works
          </Link>
          <p className="text-[10px] tracking-[0.2em] text-fg-subtle">
            &copy; {new Date().getFullYear()} Jay Lin
          </p>
        </div>
      </footer>
    </div>
  )
}
