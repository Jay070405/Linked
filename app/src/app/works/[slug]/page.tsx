"use client"

import { useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import gsap from "gsap"
import { ALL_WORKS } from "@/data/portfolio"
import BorderGlow from "@/components/BorderGlow"

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
          <BorderGlow
            glowColor="0 0 80"
            backgroundColor="transparent"
            borderRadius={4}
            glowIntensity={0.4}
            colors={["#ffffff", "#d4d4d4", "#a3a3a3"]}
            fillOpacity={0.02}
          >
            <div className="relative w-full overflow-hidden rounded-sm" style={{ aspectRatio: "16 / 9" }}>
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
          </BorderGlow>
        </div>

        {/* Content */}
        <div ref={contentRef} className="mx-auto max-w-[860px] px-6 lg:px-10">
          {/* Meta line */}
          <div className="detail-line flex flex-wrap items-center gap-4 mb-6">
            {work.date && (
              <span className="text-[10px] tracking-[0.2em] text-fg-subtle font-mono">
                {work.date}
              </span>
            )}
            <span className="text-[10px] tracking-[0.25em] uppercase text-accent/70">
              {work.category}
            </span>
          </div>

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

          {/* Tags */}
          <div className="detail-line flex flex-wrap gap-2 mb-16">
            {work.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] uppercase tracking-[0.2em] text-fg-muted/50 border border-white/[0.06] px-3 py-1.5 rounded-sm font-mono"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div className="detail-line h-px bg-white/[0.06] mb-10" />

          {/* Prev / Next */}
          <nav className="detail-line flex items-center justify-between gap-6">
            {prevWork ? (
              <Link
                href={`/works/${prevWork.slug}`}
                className="group flex flex-col gap-1 max-w-[45%]"
              >
                <span className="text-[9px] uppercase tracking-[0.25em] text-fg-subtle">
                  Previous
                </span>
                <span className="text-sm tracking-[0.02em] text-fg-muted transition-colors duration-300 group-hover:text-fg truncate">
                  {prevWork.title}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {nextWork ? (
              <Link
                href={`/works/${nextWork.slug}`}
                className="group flex flex-col gap-1 items-end max-w-[45%]"
              >
                <span className="text-[9px] uppercase tracking-[0.25em] text-fg-subtle">
                  Next
                </span>
                <span className="text-sm tracking-[0.02em] text-fg-muted transition-colors duration-300 group-hover:text-fg truncate">
                  {nextWork.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </nav>
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
