"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "works", label: "Works" },
  { id: "practice", label: "About" },
  { id: "resume", label: "Resume" },
  { id: "contact", label: "Contact" },
]

export function ScrollSpy() {
  const [active, setActive] = useState("hero")

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id)
        },
        { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[85] hidden md:flex flex-col gap-3">
      {SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => scrollTo(id)}
          aria-label={`Scroll to ${label}`}
          className={cn(
            "group relative flex items-center justify-end transition-all duration-300",
          )}
        >
          {/* Label tooltip */}
          <span className="absolute right-5 whitespace-nowrap text-[9px] uppercase tracking-[0.2em] text-white/0 group-hover:text-white/50 transition-all duration-300 pointer-events-none">
            {label}
          </span>
          {/* Dot */}
          <span
            className={cn(
              "block rounded-full transition-all duration-400",
              active === id
                ? "w-2 h-2 bg-white shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                : "w-1.5 h-1.5 border border-white/20 bg-transparent hover:border-white/40"
            )}
          />
        </button>
      ))}
    </div>
  )
}
