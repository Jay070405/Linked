"use client"

import { useEffect, useRef, useState } from "react"

interface Props {
  label?: string
}

const DOT_POSITIONS = [
  { x: 80, y: 0 },
  { x: 40, y: 69 },
  { x: -40, y: 69 },
  { x: -80, y: 0 },
  { x: -40, y: -69 },
  { x: 40, y: -69 },
]

export function SectionTransition3D({ label }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true)
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="relative overflow-hidden flex flex-col items-center justify-center"
      style={{
        height: "25vh",
        minHeight: "160px",
        position: "relative",
        background: "hsl(240 10% 2%)",
      }}
    >
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, hsl(38 45% 55% / 0.05) 0%, transparent 60%)",
          opacity: inView ? 1 : 0,
        }}
      />

      <div
        className="flex flex-col items-center transition-all duration-[1200ms] ease-out"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(15px)",
        }}
      >
        <div
          className="w-px"
          style={{
            height: "40px",
            background: "linear-gradient(to bottom, transparent, hsl(38 50% 61% / 0.35))",
            transition: "transform 800ms ease-out 200ms",
            transform: inView ? "scaleY(1)" : "scaleY(0)",
            transformOrigin: "top",
          }}
        />

        {label && (
          <div
            className="my-4"
            style={{
              transition: "opacity 1000ms ease-out 400ms, transform 1000ms ease-out 400ms",
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(8px)",
            }}
          >
            <p className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.5em] text-accent/50 text-center">
              {label}
            </p>
          </div>
        )}

        <div
          className="w-px"
          style={{
            height: "40px",
            background: "linear-gradient(to top, transparent, hsl(38 50% 61% / 0.2))",
            transition: "transform 800ms ease-out 300ms",
            transform: inView ? "scaleY(1)" : "scaleY(0)",
            transformOrigin: "bottom",
          }}
        />
      </div>

      {DOT_POSITIONS.map((pos, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-accent/25"
          style={{
            left: `calc(50% + ${pos.x}px)`,
            top: `calc(50% + ${pos.y}px)`,
            transition: `opacity 800ms ease-out ${400 + i * 60}ms, transform 800ms ease-out ${400 + i * 60}ms`,
            opacity: inView ? 0.4 : 0,
            transform: inView ? "scale(1)" : "scale(0)",
          }}
        />
      ))}
    </div>
  )
}
