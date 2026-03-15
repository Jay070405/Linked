import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Card, CardContent } from "@/components/ui/card"
import { SectionDivider } from "@/components/SectionDivider"
import { personal, school, sketch, type PortfolioItem } from "@/data/portfolio"

gsap.registerPlugin(ScrollTrigger)

function MediaItem({ item }: { item: PortfolioItem }) {
  if (item.type === "video") {
    return (
      <video
        src={item.src}
        muted
        loop
        playsInline
        controls
        className="h-full w-full object-cover"
      />
    )
  }
  return (
    <img
      src={item.src}
      alt={item.alt}
      loading="lazy"
      className="h-full w-full object-cover"
    />
  )
}

function PortfolioSection({
  title,
  items,
  sectionRef,
  titleRef,
  gridRef,
  altBg,
}: {
  title: string
  items: PortfolioItem[]
  sectionRef: React.RefObject<HTMLElement | null>
  titleRef: React.RefObject<HTMLHeadingElement | null>
  gridRef: React.RefObject<HTMLDivElement | null>
  altBg?: boolean
}) {
  return (
    <section
      ref={sectionRef}
      className={altBg ? "bg-muted/30 py-12 md:py-16" : "py-12 md:py-16"}
    >
      <div className="container px-4 sm:px-6">
        <h2
          ref={titleRef}
          className="mb-2 text-2xl font-semibold tracking-tight text-muted-foreground"
        >
          {title}
        </h2>
        <SectionDivider className="pb-8" />
        <div
          ref={gridRef}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item, i) => (
            <Card key={i} className="overflow-hidden transition-shadow hover:shadow-lg">
              <CardContent className="aspect-[4/3] p-0">
                <MediaItem item={item} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Portfolio() {
  const section1Ref = useRef<HTMLElement>(null)
  const section2Ref = useRef<HTMLElement>(null)
  const section3Ref = useRef<HTMLElement>(null)
  const title1Ref = useRef<HTMLHeadingElement>(null)
  const title2Ref = useRef<HTMLHeadingElement>(null)
  const title3Ref = useRef<HTMLHeadingElement>(null)
  const grid1Ref = useRef<HTMLDivElement>(null)
  const grid2Ref = useRef<HTMLDivElement>(null)
  const grid3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return
    }
    const sections = [
      { section: section1Ref, title: title1Ref, grid: grid1Ref },
      { section: section2Ref, title: title2Ref, grid: grid2Ref },
      { section: section3Ref, title: title3Ref, grid: grid3Ref },
    ]
    sections.forEach(({ section, title, grid }) => {
      if (!section.current || !title.current || !grid.current) return
      gsap.set(title.current, { opacity: 0, y: 32 })
      gsap.set(grid.current.children, { opacity: 0, y: 40 })
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      })
      tl.to(title.current, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" })
        .to(grid.current.children, { opacity: 1, y: 0, duration: 0.5, stagger: 0.04, ease: "power3.out" }, "-=0.3")
    })
    return () => ScrollTrigger.getAll().forEach((t) => t.kill())
  }, [])

  return (
    <div className="pb-16">
      <section className="container px-4 pt-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">作品集</h1>
        <SectionDivider />
      </section>
      <PortfolioSection
        title="个人项目"
        items={personal}
        sectionRef={section1Ref}
        titleRef={title1Ref}
        gridRef={grid1Ref}
      />
      <PortfolioSection
        title="学校作品"
        items={school}
        sectionRef={section2Ref}
        titleRef={title2Ref}
        gridRef={grid2Ref}
        altBg
      />
      <PortfolioSection
        title="速写"
        items={sketch}
        sectionRef={section3Ref}
        titleRef={title3Ref}
        gridRef={grid3Ref}
      />
    </div>
  )
}
