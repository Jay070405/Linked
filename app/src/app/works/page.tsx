"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { cn } from "@/lib/utils"

interface WorkItem {
  src: string
  title: string
  category: string
  tags: string[]
  date?: string
  type: "personal" | "school"
}

const allWorks: WorkItem[] = [
  {
    src: "/image/personal/world tree.png",
    title: "World Tree",
    category: "Environment Design",
    tags: ["concept art", "environment", "fantasy"],
    date: "2025",
    type: "personal",
  },
  {
    src: "/image/personal/sakura-villege.png",
    title: "Sakura Village",
    category: "Environment Design",
    tags: ["concept art", "japanese"],
    date: "2025",
    type: "personal",
  },
  {
    src: "/image/personal/%E6%A3%AE%E6%9E%97.png",
    title: "Enchanted Forest",
    category: "Environment Design",
    tags: ["concept art", "forest"],
    date: "2024",
    type: "personal",
  },
  {
    src: "/image/personal/%E5%89%91%E4%BB%99.png",
    title: "Sword Immortal",
    category: "Character Design",
    tags: ["character", "fantasy"],
    date: "2024",
    type: "personal",
  },
  {
    src: "/image/personal/personal project.jpg",
    title: "Personal Project",
    category: "Visual Development",
    tags: ["vis dev", "narrative"],
    date: "2024",
    type: "personal",
  },
  {
    src: "/image/personal/%E5%AF%BA%E5%BA%99%E8%8D%89%E7%A8%BF.jpg",
    title: "Temple Sketch",
    category: "Visual Development",
    tags: ["architecture", "sketch"],
    date: "2024",
    type: "personal",
  },
  {
    src: "/image/personal/artist (1).png",
    title: "Artist Portrait",
    category: "Character Design",
    tags: ["character", "portrait"],
    date: "2025",
    type: "personal",
  },
  {
    src: "/image/school/enviroment 1.png",
    title: "Environment Study I",
    category: "Environment Design",
    tags: ["environment", "study"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/enviroment 2.png",
    title: "Environment Study II",
    category: "Environment Design",
    tags: ["environment", "study"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/enviroment 3.png",
    title: "Environment Study III",
    category: "Environment Design",
    tags: ["environment", "study"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/enviroment 4.png",
    title: "Environment Study IV",
    category: "Environment Design",
    tags: ["environment", "study"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/vis_dev_character.png",
    title: "Character Vis Dev",
    category: "Character Design",
    tags: ["vis dev", "character"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/vis_dev_prop.png",
    title: "Prop Design",
    category: "Visual Development",
    tags: ["vis dev", "prop"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/vis_dev_vehicle.png",
    title: "Vehicle Design",
    category: "Visual Development",
    tags: ["vis dev", "vehicle"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/vis dev.jpg",
    title: "Visual Development I",
    category: "Visual Development",
    tags: ["vis dev", "narrative"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/vis dev (2).jpg",
    title: "Visual Development II",
    category: "Visual Development",
    tags: ["vis dev", "narrative"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/vis dev 3.jpg",
    title: "Visual Development III",
    category: "Visual Development",
    tags: ["vis dev", "narrative"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/creative prespetive.jpg",
    title: "Creative Perspective",
    category: "Fundamentals",
    tags: ["perspective", "study"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/creative prespetive (2).png",
    title: "Creative Perspective II",
    category: "Fundamentals",
    tags: ["perspective", "study"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/24FA_MonBGptg_Wk12_v02_Jay.png",
    title: "Background Painting",
    category: "Environment Design",
    tags: ["painting", "background"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/mars monster.png",
    title: "Mars Monster",
    category: "Character Design",
    tags: ["creature", "character"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/maya.png",
    title: "3D Modeling — Maya",
    category: "3D",
    tags: ["maya", "3d"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/maya (2).png",
    title: "3D Modeling — Maya II",
    category: "3D",
    tags: ["maya", "3d"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/cat diary (1).png",
    title: "Cat Diary",
    category: "Illustration",
    tags: ["illustration", "narrative"],
    date: "2024",
    type: "school",
  },
  {
    src: "/image/school/sketching for entd.png",
    title: "Sketching for ENTD",
    category: "Fundamentals",
    tags: ["sketch", "study"],
    date: "2024",
    type: "school",
  },
]

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
  if (key === "all") return allWorks.length
  return allWorks.filter((w) => w.category === key).length
}

export default function WorksPage() {
  const [activeFilter, setActiveFilter] = useState("all")
  const gridRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  const filtered =
    activeFilter === "all"
      ? allWorks
      : allWorks.filter((w) => w.category === activeFilter)

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
      {/* Grid bg */}
      <div className="fixed inset-0 hero-3d-grid pointer-events-none" />

      {/* Nav bar */}
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
              href="/#about"
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
        {/* Header */}
        <div ref={headerRef} className="mb-16">
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl tracking-[0.06em] text-fg leading-none">
            Works
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left sidebar — Categories */}
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

          {/* Right — Works grid */}
          <div ref={gridRef} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {filtered.map((work, i) => (
              <div
                key={`${work.title}-${i}`}
                className="work-item group cursor-pointer"
              >
                {/* Image */}
                <div className="relative overflow-hidden rounded-sm aspect-[16/10] mb-4">
                  <img
                    src={work.src}
                    alt={work.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="absolute inset-0 border border-white/0 rounded-sm transition-all duration-500 group-hover:border-white/[0.08]" />
                </div>

                {/* Meta */}
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

                {/* Title */}
                <h3 className="font-heading text-lg md:text-xl tracking-[0.04em] text-fg/90 transition-colors duration-300 group-hover:text-fg">
                  {work.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-12 relative z-10">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 flex items-center justify-between">
          <Link
            href="/"
            className="font-heading text-xs tracking-[0.35em] text-fg-muted hover:text-fg transition-colors duration-300"
          >
            ← Back to Home
          </Link>
          <p className="text-[10px] tracking-[0.2em] text-fg-subtle">
            &copy; {new Date().getFullYear()} Shijie Lin
          </p>
        </div>
      </footer>
    </div>
  )
}
