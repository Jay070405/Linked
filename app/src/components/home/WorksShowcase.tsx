"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import { HOME_SHOWCASE_WORKS } from "@/data/portfolio"

const ITEMS = HOME_SHOWCASE_WORKS
const COUNT = ITEMS.length
const GALLERY_START = 0.05
const GALLERY_END = 0.92

interface WorksShowcaseProps {
  bridgeBurstSignal?: number
  heroBridgeProgress?: number
}

export function WorksShowcase(_props: WorksShowcaseProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const infoRef = useRef<HTMLDivElement>(null)
  const transitionRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const stRef = useRef<ScrollTrigger | null>(null)

  const [activeIndex, setActiveIndex] = useState(0)
  const activeRef = useRef(0)
  const [dims, setDims] = useState({
    spreadX: 540,
    depthZ: 300,
    rotAngle: 30,
    cardW: 640,
    cardH: 420,
  })

  const updateDims = useCallback(() => {
    const viewportWidth = window.innerWidth

    if (viewportWidth < 640) {
      setDims({ spreadX: 200, depthZ: 120, rotAngle: 28, cardW: 280, cardH: 190 })
      return
    }

    if (viewportWidth < 1024) {
      setDims({ spreadX: 380, depthZ: 220, rotAngle: 30, cardW: 480, cardH: 320 })
      return
    }

    const scale = Math.min(viewportWidth / 1920, 1)
    setDims({
      spreadX: Math.round(580 * scale),
      depthZ: Math.round(320 * scale),
      rotAngle: 30,
      cardW: Math.round(Math.min(viewportWidth * 0.42, 720)),
      cardH: Math.round(Math.min(viewportWidth * 0.28, 480)),
    })
  }, [])

  useEffect(() => {
    updateDims()

    let timeout: ReturnType<typeof setTimeout> | undefined
    const handleResize = () => {
      if (timeout) {
        clearTimeout(timeout)
      }
      timeout = setTimeout(updateDims, 150)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [updateDims])

  const positionCards = useCallback(
    (activeFloat: number, visibility = 1) => {
      cardRefs.current.forEach((card, index) => {
        if (!card) return

        const offset = index - activeFloat
        const absOffset = Math.abs(offset)
        const x = offset * dims.spreadX
        const z = -absOffset * dims.depthZ
        const rotateY = offset * -dims.rotAngle
        const scale = Math.max(0.55, 1 - absOffset * 0.1)
        const opacity = Math.max(0, 1 - absOffset * 0.28) * visibility

        card.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${rotateY}deg) scale(${scale})`
        card.style.opacity = String(opacity)
        card.style.zIndex = String(COUNT * 10 - Math.round(absOffset * 10))
      })
    },
    [dims]
  )

  const scrollToCard = useCallback((index: number) => {
    const trigger = stRef.current
    if (!trigger || COUNT <= 1) return

    const galleryProgress = GALLERY_START + (index / (COUNT - 1)) * (GALLERY_END - GALLERY_START)
    const scrollTarget = trigger.start + galleryProgress * (trigger.end - trigger.start)

    window.scrollTo({ top: scrollTarget, behavior: "smooth" })
  }, [])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    positionCards(0)

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReducedMotion) {
      if (sceneRef.current) sceneRef.current.style.opacity = "1"
      if (infoRef.current) infoRef.current.style.opacity = "1"
      if (transitionRef.current) transitionRef.current.style.opacity = "0"
      return
    }

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=10000",
        pin: true,
        pinSpacing: true,
        scrub: 1.5,
        anticipatePin: 1,
        refreshPriority: 2,
        onUpdate: (self) => {
          const progress = self.progress

          if (progress < GALLERY_START) {
            const entranceProgress = progress / GALLERY_START

            if (sceneRef.current) sceneRef.current.style.opacity = String(entranceProgress)
            if (infoRef.current) infoRef.current.style.opacity = String(Math.max(0, entranceProgress - 0.3) / 0.7)
            if (transitionRef.current) transitionRef.current.style.opacity = "0"

            positionCards(0, entranceProgress)

            if (activeRef.current !== 0) {
              activeRef.current = 0
              setActiveIndex(0)
            }
            return
          }

          if (progress < GALLERY_END) {
            const galleryProgress = (progress - GALLERY_START) / (GALLERY_END - GALLERY_START)
            const activeFloat = galleryProgress * (COUNT - 1)
            const nextIndex = Math.max(0, Math.min(COUNT - 1, Math.round(activeFloat)))

            if (sceneRef.current) sceneRef.current.style.opacity = "1"
            if (infoRef.current) infoRef.current.style.opacity = "1"
            if (transitionRef.current) transitionRef.current.style.opacity = "0"

            positionCards(activeFloat)

            if (nextIndex !== activeRef.current) {
              activeRef.current = nextIndex
              setActiveIndex(nextIndex)
            }
            return
          }

          const exitProgress = (progress - GALLERY_END) / (1 - GALLERY_END)
          const fadeProgress = exitProgress * exitProgress

          if (sceneRef.current) sceneRef.current.style.opacity = String(1 - fadeProgress)
          if (infoRef.current) infoRef.current.style.opacity = String(1 - fadeProgress)
          if (transitionRef.current) transitionRef.current.style.opacity = String(Math.min(1, exitProgress * 1.35))

          positionCards(COUNT - 1, 1 - exitProgress * 0.2)

          if (activeRef.current !== COUNT - 1) {
            activeRef.current = COUNT - 1
            setActiveIndex(COUNT - 1)
          }
        },
      })

      stRef.current = trigger
    }, sectionRef)

    return () => {
      stRef.current = null
      ctx.revert()
    }
  }, [positionCards])

  useEffect(() => {
    const lines = infoRef.current?.querySelectorAll(".info-line")
    if (!lines?.length) return

    gsap.fromTo(
      lines,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: "power2.out" }
    )
  }, [activeIndex])

  const activeWork = ITEMS[activeIndex]

  return (
    <section
      id="works"
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
      style={{ scrollMarginTop: 0, position: "relative", zIndex: 70, isolation: "isolate" }}
    >
      <div className="absolute inset-0 bg-[hsl(230_12%_2.5%)]" />
      <div className="absolute inset-0 works-grid" />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, hsl(230 30% 50% / 0.06) 0%, hsl(260 20% 40% / 0.03) 40%, transparent 70%)",
        }}
      />

      <div className="pointer-events-none absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 md:left-8 md:block">
        <p
          className="text-[10px] font-medium uppercase tracking-[0.4em] text-fg-muted/30"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          WORKS
        </p>
      </div>

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
          {ITEMS.map((item, index) => (
            <Link
              key={item.slug}
              href={`/works/${item.slug}`}
              ref={(element) => {
                cardRefs.current[index] = element
              }}
              className="absolute inset-0 block rounded-[18px]"
              style={{
                transformStyle: "preserve-3d",
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
              }}
            >
              <div className="carousel-card-inner relative h-full w-full overflow-hidden rounded-[18px]">
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1280px) 42vw, (min-width: 768px) 54vw, 82vw"
                  className="object-cover"
                  loading={index <= 2 ? "eager" : "lazy"}
                  draggable={false}
                />
                <div className="carousel-card-shine" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div
        ref={infoRef}
        className="pointer-events-none absolute bottom-8 left-6 z-10 max-w-lg md:left-10"
        style={{ opacity: 0 }}
      >
        <p className="info-line mb-2 font-mono text-[10px] tracking-[0.2em] text-fg-subtle/50">
          {activeWork?.date}
          <span className="ml-4 text-accent/50">{activeWork?.category}</span>
        </p>
        <h3 className="info-line mb-1.5 font-heading text-2xl leading-tight tracking-[0.04em] text-fg/90 md:text-3xl lg:text-4xl">
          {activeWork?.title}
        </h3>
        <p className="info-line mb-3 max-w-sm text-xs leading-relaxed text-fg-muted/50 md:text-sm">
          {activeWork?.subtitle}
        </p>
        <div className="info-line flex flex-wrap gap-2">
          {activeWork?.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-sm border border-white/[0.06] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-fg-muted/50"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5">
        {ITEMS.map((item, index) => (
          <button
            key={item.slug}
            onClick={() => scrollToCard(index)}
            className="group p-1"
            aria-label={`Go to ${item.title}`}
          >
            <div
              className="rounded-full transition-all duration-400"
              style={{
                width: index === activeIndex ? "20px" : "6px",
                height: "6px",
                background: index === activeIndex ? "hsl(38 50% 61%)" : "rgba(255,255,255,0.15)",
              }}
            />
          </button>
        ))}
      </div>

      <Link href="/works" className="group absolute bottom-8 right-6 z-10 md:right-10">
        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-fg-muted/60 transition-colors duration-300 group-hover:text-fg/90">
          More Works
          <span className="text-fg-muted/40 transition-all duration-300 group-hover:text-fg/70">&#8599;</span>
        </span>
      </Link>

      <div
        ref={transitionRef}
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          opacity: 0,
          background: "hsl(240 10% 2%)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 vignette" />
    </section>
  )
}
