"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"

interface WorkItem {
  src: string
  title: string
  subtitle: string
  category: string
  tags: string[]
  date: string
}

const works: WorkItem[] = [
  {
    src: "/image/personal/world%20tree.png",
    title: "WORLD TREE",
    subtitle: "Fantasy environment concept — a colossal ancient tree as the axis of civilization",
    category: "Environment Design",
    tags: ["concept art", "environment", "fantasy"],
    date: "2025.01",
  },
  {
    src: "/image/personal/sakura-villege.png",
    title: "SAKURA VILLAGE",
    subtitle: "Japanese-inspired village surrounded by cherry blossoms and misty mountains",
    category: "Environment Design",
    tags: ["concept art", "japanese"],
    date: "2025.02",
  },
  {
    src: "/image/personal/%E6%A3%AE%E6%9E%97.png",
    title: "ENCHANTED FOREST",
    subtitle: "Deep forest environment with ethereal lighting and mystical atmosphere",
    category: "Environment Design",
    tags: ["concept art", "forest"],
    date: "2024.11",
  },
  {
    src: "/image/personal/%E5%89%91%E4%BB%99.png",
    title: "SWORD IMMORTAL",
    subtitle: "Wuxia character design — a swordsman ascending through celestial realms",
    category: "Character Design",
    tags: ["character", "fantasy"],
    date: "2024.09",
  },
  {
    src: "/image/personal/%E5%AF%BA%E5%BA%99%E8%8D%89%E7%A8%BF.jpg",
    title: "TEMPLE SKETCH",
    subtitle: "Architectural concept — traditional temple in misty mountains",
    category: "Visual Development",
    tags: ["architecture", "sketch", "concept art"],
    date: "2024.08",
  },
  {
    src: "/image/school/enviroment%201.png",
    title: "ENVIRONMENT STUDY",
    subtitle: "Academic environment painting exploring composition and color temperature",
    category: "Visual Development",
    tags: ["environment", "school"],
    date: "2024.10",
  },
]

const ITEM_COUNT = works.length

export function WorksShowcase() {
  const sectionRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)
  const transitionRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const stRef = useRef<ScrollTrigger | null>(null)

  const [activeIndex, setActiveIndex] = useState(0)
  const activeRef = useRef(0)
  const progressRef = useRef(0)

  const [dims, setDims] = useState({ spreadX: 540, depthZ: 300, rotAngle: 30, cardW: 640, cardH: 420 })

  const updateDims = useCallback(() => {
    const w = window.innerWidth
    if (w < 640) {
      setDims({ spreadX: 200, depthZ: 120, rotAngle: 28, cardW: 280, cardH: 190 })
    } else if (w < 1024) {
      setDims({ spreadX: 380, depthZ: 220, rotAngle: 30, cardW: 480, cardH: 320 })
    } else {
      const scale = Math.min(w / 1920, 1)
      setDims({
        spreadX: Math.round(580 * scale),
        depthZ: Math.round(320 * scale),
        rotAngle: 30,
        cardW: Math.round(Math.min(w * 0.42, 720)),
        cardH: Math.round(Math.min(w * 0.28, 480)),
      })
    }
  }, [])

  useEffect(() => {
    updateDims()
    let timeout: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(timeout)
      timeout = setTimeout(updateDims, 150)
    }
    window.addEventListener("resize", onResize)
    return () => { window.removeEventListener("resize", onResize); clearTimeout(timeout) }
  }, [updateDims])

  const positionCards = useCallback(
    (activeFloat: number, entranceScale = 1) => {
      cardRefs.current.forEach((card, i) => {
        if (!card) return
        const offset = i - activeFloat
        const absOffset = Math.abs(offset)

        const x = offset * dims.spreadX
        const z = -absOffset * dims.depthZ
        const rotY = offset * -dims.rotAngle
        const scale = Math.max(0.55, 1 - absOffset * 0.1)
        const opacity = Math.max(0, 1 - absOffset * 0.28) * entranceScale

        card.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`
        card.style.opacity = String(opacity)
        card.style.zIndex = String(ITEM_COUNT - Math.round(absOffset))
      })
    },
    [dims]
  )

  const scrollToCard = useCallback((index: number) => {
    const st = stRef.current
    if (!st) return
    const galleryStart = 0.05
    const galleryEnd = 0.92
    const targetP = galleryStart + (index / (ITEM_COUNT - 1)) * (galleryEnd - galleryStart)
    const scrollTarget = st.start + targetP * (st.end - st.start)
    window.scrollTo({ top: scrollTarget, behavior: "smooth" })
  }, [])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    positionCards(0)

    const ctx = gsap.context(() => {
      cardRefs.current.forEach((card) => {
        if (card) gsap.set(card, { opacity: 0, scale: 1 })
      })

      const mainSt = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=10000",
        pin: true,
        pinSpacing: true,
        scrub: 1.5,
        anticipatePin: 1,
        refreshPriority: 1,
        onUpdate: (self) => {
          const p = self.progress
          progressRef.current = p

          if (p < 0.05) {
            const entranceP = p / 0.05
            if (sceneRef.current) sceneRef.current.style.opacity = String(entranceP)
            if (infoRef.current) infoRef.current.style.opacity = String(Math.max(0, entranceP - 0.3) / 0.7)
            positionCards(0, entranceP)
          } else if (p < 0.92) {
            if (sceneRef.current) sceneRef.current.style.opacity = "1"
            if (infoRef.current) infoRef.current.style.opacity = "1"

            const galleryP = (p - 0.05) / 0.87
            const activeFloat = galleryP * (ITEM_COUNT - 1)
            positionCards(activeFloat)

            const newIdx = Math.round(activeFloat)
            const clamped = Math.max(0, Math.min(ITEM_COUNT - 1, newIdx))
            if (clamped !== activeRef.current) {
              activeRef.current = clamped
              setActiveIndex(clamped)
            }
          } else {
            const exitP = (p - 0.92) / 0.08
            const eased = exitP * exitP
            if (sceneRef.current) sceneRef.current.style.opacity = String(1 - eased)
            if (infoRef.current) infoRef.current.style.opacity = String(1 - eased)
            if (transitionRef.current) transitionRef.current.style.opacity = String(Math.min(eased, 0.85))
          }
        },
      })

      stRef.current = mainSt
    }, sectionRef)

    return () => ctx.revert()
  }, [positionCards])

  useEffect(() => {
    const items = infoRef.current?.querySelectorAll(".info-line")
    if (!items?.length) return
    gsap.fromTo(
      items,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: "power2.out" }
    )
  }, [activeIndex])

  return (
    <section
      id="works"
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
      style={{ scrollMarginTop: 0, zIndex: 50, position: "relative" }}
    >
      {/* Background */}
      <div className="absolute inset-0" style={{ background: "hsl(230 12% 2.5%)" }} />
      <div className="absolute inset-0 works-grid" />

      {/* Ambient glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[60vh] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, hsl(230 30% 50% / 0.06) 0%, hsl(260 20% 40% / 0.03) 40%, transparent 70%)",
        }}
      />

      {/* Side label — "WORKS" vertical */}
      <div className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 pointer-events-none hidden md:block">
        <p
          className="text-[10px] uppercase tracking-[0.4em] text-fg-muted/30 font-medium"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          WORKS
        </p>
      </div>

      {/* 3D Gallery Scene */}
      <div
        ref={sceneRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ perspective: "1200px", opacity: 0 }}
      >
        <div
          className="relative"
          style={{
            transformStyle: "preserve-3d",
            width: `${dims.cardW}px`,
            height: `${dims.cardH}px`,
          }}
        >
          {works.map((item, i) => (
            <Link
              key={item.title}
              href="/works"
              ref={(el) => { cardRefs.current[i] = el }}
              className="absolute inset-0 block"
              style={{
                transformStyle: "preserve-3d",
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
              }}
            >
              <div className="carousel-card-inner w-full h-full">
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover pointer-events-none"
                  loading={i <= 2 ? "eager" : "lazy"}
                  draggable={false}
                />
                <div className="carousel-card-shine" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Info panel — ALCHE style: date → highlight → title → subtitle → tags */}
      <div
        ref={infoRef}
        className="absolute bottom-8 left-6 md:left-10 z-10 pointer-events-none max-w-lg"
        style={{ opacity: 0 }}
      >
        <p className="info-line text-[10px] font-mono tracking-[0.2em] text-fg-subtle/50 mb-2">
          {works[activeIndex]?.date}
          <span className="ml-4 text-accent/50">{works[activeIndex]?.category}</span>
        </p>
        <h3 className="info-line font-heading text-2xl md:text-3xl lg:text-4xl tracking-[0.04em] text-fg/90 mb-1.5 leading-tight">
          {works[activeIndex]?.title}
        </h3>
        <p className="info-line text-xs md:text-sm text-fg-muted/50 mb-3 leading-relaxed max-w-sm">
          {works[activeIndex]?.subtitle}
        </p>
        <div className="info-line flex flex-wrap gap-2">
          {works[activeIndex]?.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] uppercase tracking-[0.2em] text-fg-muted/50 border border-white/[0.06] px-2.5 py-1 rounded-sm font-mono"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Carousel indicators — bottom center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5">
        {works.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToCard(i)}
            className="group p-1"
            aria-label={`Go to work ${i + 1}`}
          >
            <div
              className="rounded-full transition-all duration-400"
              style={{
                width: i === activeIndex ? "20px" : "6px",
                height: "6px",
                background: i === activeIndex
                  ? "hsl(38 50% 61%)"
                  : "rgba(255,255,255,0.15)",
              }}
            />
          </button>
        ))}
      </div>

      {/* More Works — bottom right */}
      <Link href="/works" className="absolute bottom-8 right-6 md:right-10 z-10 group">
        <span className="text-[11px] uppercase tracking-[0.25em] text-fg-muted/60 flex items-center gap-1.5 transition-colors duration-300 group-hover:text-fg/90">
          More Works <span className="text-fg-muted/40 group-hover:text-fg/70 transition-all duration-300">&#8599;</span>
        </span>
      </Link>

      {/* Transition overlay — not full black, slight transparency */}
      <div
        ref={transitionRef}
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          opacity: 0,
          background: "hsl(240 10% 2%)",
        }}
      />

      <div className="absolute inset-0 vignette pointer-events-none" />
    </section>
  )
}
