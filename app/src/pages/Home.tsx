import { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import gsap from "gsap"
import { MagicHatLogo } from "@/components/MagicHatLogo"
import { Button } from "@/components/ui/button"

export function Home() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const showcaseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }
    const ctx = gsap.context(() => {
      gsap.set([titleRef.current, taglineRef.current, actionsRef.current, showcaseRef.current], { opacity: 0 })
      gsap.set(titleRef.current, { y: 28 })
      gsap.set(taglineRef.current, { y: 20 })
      gsap.set(actionsRef.current, { y: 16 })
      gsap.set(showcaseRef.current, { y: 24, scale: 0.98 })
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })
      tl.to(titleRef.current, { opacity: 1, y: 0, duration: 0.6 })
        .to(taglineRef.current, { opacity: 1, y: 0, duration: 0.5 }, "-=0.2")
        .to(actionsRef.current, { opacity: 1, y: 0, duration: 0.45 }, "-=0.2")
        .to(showcaseRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.7 }, "-=0.15")
    })
    return () => ctx.revert()
  }, [])

  return (
    <section className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="container flex flex-col items-center gap-6">
        <div className="flex items-center justify-center gap-3">
          <MagicHatLogo size={40} className="text-primary opacity-90" />
          <h1
            ref={titleRef}
            className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl"
          >
            Shijie Lin
          </h1>
        </div>
        <p
          ref={taglineRef}
          className="max-w-md text-muted-foreground text-base sm:text-lg"
        >
          视觉开发与概念艺术 · Visual Development & Concept Art
        </p>
        <div ref={actionsRef} className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link to="/portfolio">查看作品集</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="/resume/简历 中文.pdf" download>简历 (中文)</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/resume/简历 _1_ (1).pdf" download>Resume (EN)</a>
          </Button>
        </div>
      </div>
      <div
        ref={showcaseRef}
        className="absolute bottom-[8%] left-1/2 w-[90vw] max-w-[600px] -translate-x-1/2 overflow-hidden rounded-2xl border border-border shadow-2xl"
      >
        <img
          src="/image/personal/world tree.png"
          alt="Work showcase"
          className="block w-full object-cover"
        />
      </div>
    </section>
  )
}
