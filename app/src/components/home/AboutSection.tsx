"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"
import ScrollReveal from "@/components/ScrollReveal"
import CurvedLoop from "@/components/CurvedLoop"
import { ABOUT_APPROACH, ABOUT_GALLERY_IMAGES } from "@/data/portfolio"

const ABOUT_MARQUEE =
  "WORLDBUILDING / ENVIRONMENT DESIGN / VISUAL DEVELOPMENT / NARRATIVE / ATMOSPHERE / "

const FEATURED_GALLERY = ABOUT_GALLERY_IMAGES.slice(0, 3)
const ABOUT_CHIPS = ["Fantasy Worlds", "Environment Design", "Cinematic Mood", "Myth + Memory"]

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      const reveals = sectionRef.current?.querySelectorAll(".ab-reveal")
      if (!reveals?.length) return

      reveals.forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: i * 0.06,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        )
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      id="practice"
      ref={sectionRef}
      className="relative overflow-hidden py-32 md:py-44"
      style={{ zIndex: 65, position: "relative" }}
    >
      <div className="section-edge-top" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.1),transparent_22%),radial-gradient(circle_at_84%_26%,rgba(255,255,255,0.07),transparent_18%)]" />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.3]">
        <div className="absolute left-[-8%] right-[-8%] top-[18%]">
          <CurvedLoop
            marqueeText={ABOUT_MARQUEE}
            speed={1.25}
            direction="left"
            interactive={false}
            curveAmount={160}
            className="scale-[1.08]"
          />
        </div>
        <div className="absolute left-[-8%] right-[-8%] top-[62%]">
          <CurvedLoop
            marqueeText={ABOUT_MARQUEE}
            speed={0.9}
            direction="right"
            interactive={false}
            curveAmount={120}
            className="scale-[1.04]"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1380px] px-6 lg:px-10 xl:px-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.94fr)_minmax(380px,0.86fr)] lg:items-start">
          <div className="max-w-[44rem]">
            <p className="ab-reveal section-kicker">Philosophy & Practice</p>

            <ScrollReveal
              scrollContainerRef={null}
              baseOpacity={0.1}
              baseRotation={2}
              blurStrength={4}
              enableBlur={true}
              containerClassName="ab-reveal-skip mt-8"
              textClassName="section-heading text-[clamp(2.5rem,6vw,6rem)]"
            >
              I craft worlds that feel lived in before they are explained.
            </ScrollReveal>

            <div className="mt-8 space-y-5">
              <ScrollReveal
                scrollContainerRef={null}
                baseOpacity={0.16}
                baseRotation={1}
                blurStrength={2}
                enableBlur={true}
                containerClassName="ab-reveal-skip"
                textClassName="section-copy max-w-[38rem] text-[1rem] md:text-[1.02rem]"
              >
                Fantasy worldbuilding, environment design, and cinematic illustration all meet here. I build scenes as if they are fragments from a larger civilization, with visual decisions tied to story logic, memory, and mood.
              </ScrollReveal>
              <ScrollReveal
                scrollContainerRef={null}
                baseOpacity={0.16}
                baseRotation={1}
                blurStrength={2}
                enableBlur={true}
                containerClassName="ab-reveal-skip"
                textClassName="section-copy max-w-[36rem] text-[1rem] md:text-[1.02rem]"
              >
                The images pull from Eastern and Western mythology, architecture, and natural forms. I want the viewer to feel the climate, the age of the stone, and the history of the place before reading a single caption.
              </ScrollReveal>
            </div>

            <div className="ab-reveal mt-10 flex flex-wrap gap-3">
              {ABOUT_CHIPS.map((item) => (
                <span key={item} className="story-chip">
                  {item}
                </span>
              ))}
            </div>

            <div className="ab-reveal mt-10 flex flex-wrap items-center gap-4">
              <Link href="/about" className="story-link">
                Learn More
                <span>&#8594;</span>
              </Link>
              <p className="max-w-[24rem] text-sm leading-7 text-white/46">
                A practice shaped by atmosphere, internal logic, and cinematic staging.
              </p>
            </div>
          </div>

          <div className="ab-reveal grid gap-4 md:grid-cols-2">
            <div className="story-panel relative aspect-[0.86/1] md:col-span-2">
              <Image
                src={FEATURED_GALLERY[0].src}
                alt={FEATURED_GALLERY[0].title}
                fill
                sizes="(min-width: 1024px) 42vw, 92vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_38%,rgba(0,0,0,0.72)_100%)]" />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                <p className="text-[0.68rem] uppercase tracking-[0.3em] text-white/44">{FEATURED_GALLERY[0].category}</p>
                <p className="mt-3 font-heading text-2xl tracking-[0.04em] text-white">{FEATURED_GALLERY[0].title}</p>
              </div>
            </div>

            {FEATURED_GALLERY.slice(1).map((item, index) => (
              <div
                key={item.title}
                className="story-panel relative aspect-[0.92/1]"
                style={{ transform: index === 1 ? "translateY(18px)" : undefined }}
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 21vw, 44vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(0,0,0,0.76)_100%)]" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[0.62rem] uppercase tracking-[0.28em] text-white/40">{item.category}</p>
                  <p className="mt-2 text-base tracking-[0.04em] text-white/90">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ab-reveal mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ABOUT_APPROACH.map((item, index) => (
            <div key={item.label} className="story-panel p-5 md:p-6">
              <p className="text-[0.64rem] uppercase tracking-[0.28em] text-white/34">0{index + 1}</p>
              <p className="mt-5 text-sm uppercase tracking-[0.24em] text-white/76">{item.label}</p>
              <p className="mt-4 text-sm leading-7 text-white/54">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
