"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { HOME_SHOWCASE_WORKS } from "@/data/portfolio"
import { clamp } from "@/components/home/particleShapeUtils"
import BorderGlow from "@/components/BorderGlow"

const ITEMS = HOME_SHOWCASE_WORKS
const COUNT = ITEMS.length
const ORBIT_RADIUS = 1500
const ANGLE_STEP = 0.9
const HELIX_PITCH = 210
const HELIX_SWAY = 42
const DEPTH_BIAS = 160

interface WorksShowcaseProps {
  bridgeBurstSignal?: number
  heroBridgeProgress?: number
}

/**
 * Spiral 3D gallery — matches the prototype exactly.
 * Uses CSS position:sticky (works because body uses overflow-x:clip, not hidden).
 * Scroll events drive card positions directly (no GSAP, no React state in the loop).
 */
export function WorksShowcase({}: WorksShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const currentIndexRef = useRef(-1)
  const [activeIndex, setActiveIndex] = useState(0)

  const positionCards = useCallback((snappedIndex: number) => {
    cardRefs.current.forEach((card, index) => {
      if (!card) return

      const delta = index - snappedIndex
      const angle = delta * ANGLE_STEP
      const x = Math.sin(angle) * ORBIT_RADIUS
      const z = Math.cos(angle) * ORBIT_RADIUS - ORBIT_RADIUS + DEPTH_BIAS
      const y = delta * HELIX_PITCH + Math.sin(angle * 1.15) * HELIX_SWAY
      const facing = -angle * 0.86
      const normalizedDepth = clamp((z + ORBIT_RADIUS) / (ORBIT_RADIUS + DEPTH_BIAS), 0, 1)
      const scale = 0.44 + normalizedDepth * 0.7
      const opacity = clamp(1.06 - Math.abs(delta) * 0.38, 0, 1)
      const blur = Math.abs(delta) > 1.35 ? (Math.abs(delta) - 1.35) * 1.8 : 0
      const tiltX = delta * -0.08 + Math.sin(angle * 0.8) * -0.04
      const glow = ITEMS[index]?.glow ?? "rgba(255,255,255,0.1)"

      card.style.transform = `
        translate(-50%, -50%)
        translate3d(${x}px, ${y}px, ${z}px)
        rotateY(${facing}rad)
        rotateX(${tiltX}rad)
        scale(${scale})
      `
      card.style.opacity = String(opacity)
      card.style.filter = `blur(${blur}px) drop-shadow(0 0 36px ${glow})`
      card.style.zIndex = String(Math.round(normalizedDepth * 1000))
    })
  }, [])

  const animateInfo = useCallback(() => {
    const lines = infoRef.current?.querySelectorAll("[data-info-line]")
    if (!lines?.length) return

    lines.forEach((line, index) => {
      const el = line as HTMLElement
      el.animate(
        [
          { opacity: 0, transform: "translate3d(0, 18px, 0)", filter: "blur(10px)" },
          { opacity: 1, transform: "translate3d(0, 0, 0)", filter: "blur(0px)" },
        ],
        {
          duration: 520,
          delay: index * 55,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        }
      )
    })
  }, [])

  useEffect(() => {
    positionCards(0)

    // Direct scroll handler — no React state in the hot path
    const onScroll = () => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const scrollable = container.offsetHeight - window.innerHeight
      if (scrollable <= 0) return

      const progress = clamp(-rect.top / scrollable)
      const rawFloat = progress * (COUNT - 1)
      const snapped = Math.max(0, Math.min(COUNT - 1, Math.round(rawFloat)))

      positionCards(snapped)

      if (snapped !== currentIndexRef.current) {
        currentIndexRef.current = snapped
        setActiveIndex(snapped)
        animateInfo()

        const dots = progressRef.current?.querySelectorAll(".progress-dot")
        dots?.forEach((dot, i) => {
          dot.classList.toggle("active", i === snapped)
        })
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    onScroll()

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [animateInfo, positionCards])

  const activeWork = ITEMS[activeIndex]

  return (
    <div
      id="works"
      ref={containerRef}
      className="relative"
      style={{ zIndex: 50, height: "520vh" }}
    >
      {/* Sticky viewport — stays pinned to screen while container scrolls */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,1)_0%,rgba(3,3,3,1)_48%,rgba(1,1,1,1)_100%)]" />
        <div className="absolute inset-0 hero-3d-grid opacity-[0.1]" />

        {/* 3D scene with perspective */}
        <div
          className="absolute inset-0"
          style={{ perspective: "1600px", perspectiveOrigin: "50% 46%", transformStyle: "preserve-3d" }}
        >
          {/* Ambient colored glows */}
          <div
            className="absolute pointer-events-none opacity-90"
            style={{
              inset: "-14vh -14vw",
              background: `
                radial-gradient(circle at 24% 26%, rgba(44, 162, 255, 0.16), transparent 18%),
                radial-gradient(circle at 76% 24%, rgba(255, 60, 151, 0.13), transparent 18%),
                radial-gradient(circle at 70% 72%, rgba(255, 136, 0, 0.11), transparent 22%)
              `,
              filter: "blur(34px) saturate(130%)",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              inset: "-14vh -14vw",
              background: "radial-gradient(circle at center, transparent 28%, rgba(0,0,0,0.45) 100%)",
            }}
          />

          {/* Room walls */}
          <div
            className="absolute top-[-8vh] h-[116vh] w-[56vw] border border-white/[0.06] opacity-50"
            style={{
              left: "-17vw",
              transform: "translateZ(-380px) rotateY(68deg)",
              transformOrigin: "right center",
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px),
                linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0))
              `,
              backgroundSize: "34px 34px, 34px 34px, 100% 100%",
              boxShadow: "inset 0 0 100px rgba(255,255,255,0.03), 0 0 90px rgba(255,255,255,0.02)",
            }}
          />
          <div
            className="absolute top-[-8vh] h-[116vh] w-[56vw] border border-white/[0.04] opacity-30"
            style={{
              left: "22vw",
              transform: "translateZ(-760px)",
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px),
                linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))
              `,
              backgroundSize: "34px 34px, 34px 34px, 100% 100%",
              boxShadow: "inset 0 0 100px rgba(255,255,255,0.01)",
            }}
          />
          <div
            className="absolute top-[-8vh] h-[116vh] w-[56vw] border border-white/[0.06] opacity-50"
            style={{
              right: "-17vw",
              transform: "translateZ(-380px) rotateY(-68deg)",
              transformOrigin: "left center",
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px),
                linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0))
              `,
              backgroundSize: "34px 34px, 34px 34px, 100% 100%",
              boxShadow: "inset 0 0 100px rgba(255,255,255,0.03), 0 0 90px rgba(255,255,255,0.02)",
            }}
          />

          {/* Horizon line */}
          <div
            className="absolute left-0 right-0 top-1/2 h-px pointer-events-none opacity-[0.28]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
          />
        </div>

        {/* Vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{ background: "radial-gradient(ellipse at center, transparent 28%, rgba(0,0,0,0.78) 100%)" }}
        />

        {/* Cards layer — separate from room so perspective only affects cards */}
        <div
          className="absolute inset-0 z-[6]"
          style={{
            perspective: "1600px",
            perspectiveOrigin: "50% 46%",
            transformStyle: "preserve-3d",
          }}
        >
          {ITEMS.map((item, index) => (
            <Link
              key={item.slug}
              href={`/works/${item.slug}`}
              ref={(element) => {
                cardRefs.current[index] = element
              }}
              className="absolute left-1/2 top-1/2 block spiral-card-size"
              style={{
                aspectRatio: "1.62 / 1",
                transformStyle: "preserve-3d",
                borderRadius: "18px",
                overflow: "hidden",
                willChange: "transform, opacity, filter",
                backfaceVisibility: "hidden",
                transition: "transform 720ms cubic-bezier(0.22, 1, 0.36, 1), opacity 420ms ease, filter 520ms ease",
              }}
            >
              <BorderGlow
                glowColor="0 0 85"
                backgroundColor="transparent"
                borderRadius={18}
                glowIntensity={0.6}
                colors={["#ffffff", "#d4d4d4", "#a3a3a3"]}
                fillOpacity={0.05}
              >
                <div className="absolute inset-0 rounded-[inherit] overflow-hidden">
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1024px) 58vw, 86vw"
                    className="object-cover object-center"
                    style={{ filter: "saturate(1.05) contrast(1.02)" }}
                    loading={index <= 2 ? "eager" : "lazy"}
                    draggable={false}
                  />
                  <div
                    className="absolute inset-0 z-[1]"
                    style={{ background: "linear-gradient(180deg, transparent 52%, rgba(2,2,2,0.5) 100%)" }}
                  />
                </div>
              </BorderGlow>

              {/* Glass border */}
              <div
                className="absolute inset-0 rounded-[inherit] pointer-events-none z-[4]"
                style={{
                  border: "1px solid rgba(255,255,255,0.28)",
                  boxShadow: `
                    inset 0 1px 0 rgba(255,255,255,0.24),
                    inset 0 -1px 0 rgba(255,255,255,0.1),
                    0 35px 80px rgba(0,0,0,0.45),
                    0 0 0 1px rgba(255,255,255,0.05)
                  `,
                }}
              />
              {/* Glass tint */}
              <div
                className="absolute inset-0 rounded-[inherit] pointer-events-none z-[2]"
                style={{
                  background: `
                    radial-gradient(circle at 18% 18%, rgba(255,255,255,0.18), transparent 22%),
                    linear-gradient(125deg, rgba(255,255,255,0.14), transparent 28%, rgba(0,0,0,0.18))
                  `,
                  mixBlendMode: "screen",
                }}
              />
              {/* Glass shine */}
              <div
                className="absolute inset-0 rounded-[inherit] pointer-events-none z-[3] mix-blend-screen opacity-[0.85]"
                style={{
                  background: `
                    linear-gradient(106deg, rgba(255,255,255,0.22), transparent 12%, transparent 80%, rgba(255,255,255,0.08)),
                    linear-gradient(180deg, rgba(255,255,255,0.07), transparent 40%, rgba(0,0,0,0.25))
                  `,
                }}
              />
            </Link>
          ))}
        </div>

        {/* Info overlay */}
        <div ref={infoRef} className="absolute left-7 bottom-7 z-10 max-w-[440px] pointer-events-none md:left-10">
          <p data-info-line className="mb-3 text-[10px] tracking-[0.42em] text-white/24">
            {String(activeIndex + 1).padStart(2, "0")}
          </p>
          <h3
            data-info-line
            className="font-heading text-[clamp(2rem,2.8vw,3.6rem)] leading-[0.92] tracking-[0.06em] text-white"
            style={{ fontWeight: 600 }}
          >
            {activeWork?.title}
          </h3>
          <p data-info-line className="mt-4 text-[10px] uppercase tracking-[0.38em] text-white/36">
            {activeWork?.category}
          </p>
          <p data-info-line className="mt-3 max-w-[360px] text-[13px] leading-[1.7] text-white/42">
            {activeWork?.subtitle}
          </p>
        </div>

        {/* Progress dots */}
        <div
          ref={progressRef}
          className="absolute right-7 top-1/2 z-[60] flex -translate-y-1/2 flex-col gap-3"
        >
          {ITEMS.map((_, index) => (
            <div
              key={index}
              className={`progress-dot rounded-full border transition-all duration-300 ${
                index === activeIndex
                  ? "h-1.5 w-[18px] border-white bg-white shadow-[0_0_16px_rgba(255,255,255,0.14)]"
                  : "h-1.5 w-1.5 border-white/16 bg-transparent"
              }`}
            />
          ))}
        </div>

        {/* More works link */}
        <Link href="/works" className="absolute bottom-7 right-7 z-10 group md:right-10">
          <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.28em] text-white/36 transition-colors duration-300 group-hover:text-white/88">
            More Works
            <span className="transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">&#8599;</span>
          </span>
        </Link>
      </div>
    </div>
  )
}
