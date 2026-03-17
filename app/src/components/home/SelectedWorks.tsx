"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { cn } from "@/lib/utils"

const works = [
  {
    title: "World Tree",
    category: "Environment Design",
    src: "/image/personal/world tree.png",
    featured: true,
  },
  {
    title: "Sakura Village",
    category: "Environment Design",
    src: "/image/personal/sakura-villege.png",
  },
  {
    title: "Enchanted Forest",
    category: "Environment Design",
    src: "/image/personal/%E6%A3%AE%E6%9E%97.png",
  },
  {
    title: "Sword Immortal",
    category: "Character Design",
    src: "/image/personal/%E5%89%91%E4%BB%99.png",
  },
  {
    title: "Temple Sketch",
    category: "Visual Development",
    src: "/image/personal/%E5%AF%BA%E5%BA%99%E8%8D%89%E7%A8%BF.jpg",
  },
  {
    title: "Artist Portrait",
    category: "Character Design",
    src: "/image/personal/artist (1).png",
  },
]

export function SelectedWorks() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      const cards = sectionRef.current?.querySelectorAll(".work-card")
      if (!cards) return

      cards.forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            toggleActions: "play none none none",
          },
          opacity: 0,
          y: 50,
          duration: 0.9,
          delay: i % 2 === 0 ? 0 : 0.12,
          ease: "power3.out",
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="works"
      ref={sectionRef}
      className="relative py-32 md:py-44"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Section header */}
        <div className="mb-16 md:mb-24">
          <p className="text-[10px] font-medium uppercase tracking-[0.4em] text-accent mb-4">
            Portfolio
          </p>
          <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl tracking-[0.08em] text-fg">
            SELECTED WORKS
          </h2>
        </div>

        {/* Works grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {works.map((work) => (
            <div
              key={work.title}
              className={cn(
                "work-card group relative cursor-pointer overflow-hidden rounded-sm",
                work.featured && "md:col-span-2"
              )}
            >
              <div
                className={cn(
                  "relative overflow-hidden",
                  work.featured ? "aspect-[21/9]" : "aspect-[4/3]"
                )}
              >
                {/* Image */}
                <img
                  src={work.src}
                  alt={work.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-500" />

                {/* Hover glow border */}
                <div className="absolute inset-0 rounded-sm border border-white/0 transition-all duration-500 group-hover:border-accent/20 group-hover:shadow-[inset_0_0_30px_-10px_hsl(var(--glow)/0.15)]" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                  <p className="text-[9px] font-medium uppercase tracking-[0.35em] text-accent/80 mb-2">
                    {work.category}
                  </p>
                  <h3 className="font-heading text-lg md:text-xl lg:text-2xl tracking-[0.1em] text-fg/95">
                    {work.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
