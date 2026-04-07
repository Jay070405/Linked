"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import gsap from "gsap"
import { cn } from "@/lib/utils"
import { ALL_WORKS } from "@/data/portfolio"
import BorderGlow from "@/components/BorderGlow"

const categories = [
  { key: "all", label: "ALL" },
  { key: "Environment Design", label: "Environment Design" },
  { key: "Character Design", label: "Character Design" },
  { key: "Visual Development", label: "Visual Development" },
  { key: "Illustration", label: "Illustration" },
  { key: "Fundamentals", label: "Fundamentals" },
  { key: "3D", label: "3D" },
]

function getCategoryCount(key: string): number {
  if (key === "all") return ALL_WORKS.length
  return ALL_WORKS.filter((w) => w.category === key).length
}

export default function WorksPage() {
  const [activeFilter, setActiveFilter] = useState("all")
  const gridRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  const filtered =
    activeFilter === "all"
      ? ALL_WORKS
      : ALL_WORKS.filter((w) => w.category === activeFilter)

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll(".work-item")
    if (!cards?.length) return
    gsap.fromTo(
      cards,
      { opacity: 0, y: 30, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.04,
        ease: "power3.out",
      }
    )
  }, [activeFilter])

  useEffect(() => {
    if (!headerRef.current) return
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    )
  }, [])

  return (
    <div className="min-h-screen bg-bg text-fg relative z-[2]">
      <div className="fixed inset-0 hero-3d-grid pointer-events-none" />

      <header className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 lg:px-10">
          <Link
            href="/"
            className="font-heading text-sm tracking-[0.25em] text-fg/90 transition-opacity duration-300 hover:opacity-60"
          >
            SHIJIE LIN
          </Link>
          <nav className="hidden md:flex items-center gap-10">
            <Link
              href="/#works"
              className="text-[11px] font-medium tracking-[0.2em] text-fg transition-colors duration-300 hover:text-fg-muted"
            >
              Works
            </Link>
            <Link
              href="/about"
              className="text-[11px] font-medium tracking-[0.2em] text-fg-muted transition-colors duration-300 hover:text-fg"
            >
              About
            </Link>
          </nav>
          <Link
            href="/#contact"
            className="hidden md:flex items-center text-[11px] font-medium tracking-[0.15em] text-fg/80 border border-white/[0.12] rounded-full px-5 py-2 transition-all duration-300 hover:border-white/[0.25] hover:text-fg"
          >
            Contact
          </Link>
        </div>
      </header>

      <main className="relative z-10 pt-28 pb-20 px-6 lg:px-10 max-w-[1600px] mx-auto">
        <div ref={headerRef} className="mb-16">
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl tracking-[0.06em] text-fg leading-none">
            Works
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <aside className="lg:w-52 shrink-0 lg:sticky lg:top-28 lg:self-start">
            <nav className="flex flex-wrap lg:flex-col gap-1">
              {categories.map(({ key, label }) => {
                const count = getCategoryCount(key)
                if (count === 0 && key !== "all") return null
                return (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className={cn(
                      "text-left text-sm tracking-[0.04em] px-2 py-1.5 rounded-sm transition-all duration-300",
                      activeFilter === key
                        ? "text-fg font-medium"
                        : "text-fg-muted hover:text-fg/80"
                    )}
                  >
                    {label}{" "}
                    <span className="text-[10px] text-fg-subtle ml-1">
                      [{count}]
                    </span>
                  </button>
                )
              })}
            </nav>
          </aside>

          <div
            ref={gridRef}
            className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
          >
            {filtered.map((work, i) => (
              <Link
                key={`${work.slug}-${i}`}
                href={`/works/${work.slug}`}
                className="work-item group cursor-pointer block"
              >
                <BorderGlow
                  glowColor="0 0 80"
                  backgroundColor="transparent"
                  borderRadius={6}
                  glowIntensity={0.5}
                  colors={["#ffffff", "#c0c0c0", "#808080"]}
                  fillOpacity={0.03}
                  className="mb-4"
                >
                  <div className="relative overflow-hidden rounded-sm aspect-[16/10]">
                    <Image
                      src={work.src}
                      alt={work.title}
                      fill
                      sizes="(min-width: 1024px) 40vw, (min-width: 768px) 48vw, 92vw"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="absolute inset-0 border border-white/0 rounded-sm transition-all duration-500 group-hover:border-white/[0.08]" />
                  </div>
                </BorderGlow>

                <div className="flex items-center gap-4 mb-2">
                  {work.date && (
                    <span className="text-[10px] tracking-[0.15em] text-fg-subtle font-mono">
                      {work.date}
                    </span>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {work.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] uppercase tracking-[0.15em] text-fg-muted/50 border border-white/[0.05] px-2 py-0.5 rounded-sm font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="font-heading text-lg md:text-xl tracking-[0.04em] text-fg/90 transition-colors duration-300 group-hover:text-fg">
                  {work.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/[0.04] py-12 relative z-10">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 flex items-center justify-between">
          <Link
            href="/"
            className="font-heading text-xs tracking-[0.35em] text-fg-muted hover:text-fg transition-colors duration-300"
          >
            &larr; Back to Home
          </Link>
          <p className="text-[10px] tracking-[0.2em] text-fg-subtle">
            &copy; {new Date().getFullYear()} Jay Lin
          </p>
        </div>
      </footer>
    </div>
  )
}
