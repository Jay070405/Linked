"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import gsap from "gsap"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/components/LanguageProvider"
import { NavBrandMorph } from "@/components/home/NavBrandMorph"

const navLabels = {
  en: {
    works: "Works",
    practice: "Practice",
    about: "About",
    contact: "Contact",
    menu: "Menu",
    close: "Close",
  },
  zh: {
    works: "\u4f5c\u54c1",
    practice: "\u7ec3\u4e60",
    about: "\u5173\u4e8e",
    contact: "\u8054\u7cfb",
    menu: "\u83dc\u5355",
    close: "\u5173\u95ed",
  },
} as const

interface NavigationProps {
  brandMorphProgress?: number
}

export function Navigation({ brandMorphProgress = 0 }: NavigationProps) {
  const { language, setLanguage } = useLanguage()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const labels = navLabels[language]
  const onHome = pathname === "/"
  const effectiveBrandProgress = onHome ? brandMorphProgress : 1

  const links = [
    { href: "#works", label: labels.works, forceHome: true },
    { href: "#practice", label: labels.practice, forceHome: true },
    { href: "/about", label: labels.about, isPage: true },
    { href: "#contact", label: labels.contact, forceHome: true },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!headerRef.current || prefersReduced) return

    gsap.fromTo(
      headerRef.current,
      { autoAlpha: 0, y: -18 },
      { autoAlpha: 1, y: 0, duration: 0.72, ease: "power2.out" }
    )
  }, [])

  const desktopLinkClass = scrolled || !onHome
    ? "text-white/70 after:bg-white/60 hover:text-white"
    : "text-white/64 after:bg-white/48 hover:text-white"

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-[90] transition-all duration-500",
          scrolled
            ? "border-b border-white/10 bg-[rgba(3,3,3,0.72)] shadow-[0_24px_70px_rgba(0,0,0,0.48)] backdrop-blur-2xl"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto flex h-[78px] max-w-[1640px] items-center justify-between px-5 md:px-10 xl:px-14">
          <Link
            href="/"
            className="group relative flex h-11 min-w-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            aria-label="Jay Lin homepage"
          >
            <NavBrandMorph
              progress={effectiveBrandProgress}
              className="relative h-11 w-[220px] md:w-[240px]"
            />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <nav aria-label="Primary">
              <ul className="flex items-center gap-7 lg:gap-9">
                {links.map(({ href, label, isPage, forceHome }) => {
                  const resolvedHref =
                    !isPage && forceHome && pathname !== "/" ? `/${href}` : href

                  return (
                    <li key={href}>
                      {isPage ? (
                        <Link
                          href={href}
                          className={cn(
                            "relative px-4 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-300 group",
                            desktopLinkClass
                          )}
                        >
                          <span className="relative z-10">{label}</span>
                          <span className="absolute inset-0 rounded-md bg-white/[0.04] opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300" />
                        </Link>
                      ) : (
                        <a
                          href={resolvedHref}
                          className={cn(
                            "relative px-4 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-300 group",
                            desktopLinkClass
                          )}
                        >
                          <span className="relative z-10">{label}</span>
                          <span className="absolute inset-0 rounded-md bg-white/[0.04] opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300" />
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </nav>

            <div className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[0.64rem] font-medium uppercase tracking-[0.22em] transition-all duration-300",
                  language === "en"
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white"
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("zh")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[0.64rem] font-medium tracking-[0.18em] transition-all duration-300",
                  language === "zh"
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white"
                )}
              >
                {"\u4e2d\u6587"}
              </button>
            </div>
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? labels.close : labels.menu}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="relative z-50 flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black md:hidden"
          >
            <span className="relative h-4 w-5">
              <span
                className={cn(
                  "absolute left-0 top-0 block h-px w-5 bg-current transition-[transform,top] duration-300",
                  mobileOpen && "top-[7px] rotate-45"
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-[7px] block h-px w-5 bg-current transition-opacity duration-300",
                  mobileOpen && "opacity-0"
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-[14px] block h-px w-5 bg-current transition-[transform,top] duration-300",
                  mobileOpen && "top-[7px] -rotate-45"
                )}
              />
            </span>
          </button>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-[80] bg-[rgba(2,2,2,0.96)] backdrop-blur-2xl transition-[opacity,visibility] duration-500 md:hidden",
          mobileOpen ? "visible opacity-100" : "invisible opacity-0"
        )}
      >
        <nav className="flex min-h-screen flex-col justify-between px-6 pb-10 pt-24">
          <div>
            <NavBrandMorph
              progress={effectiveBrandProgress}
              className="relative mb-12 h-10 w-[180px]"
            />

            <div className="space-y-7">
              {links.map(({ href, label, isPage, forceHome }) => {
                const resolvedHref =
                  !isPage && forceHome && pathname !== "/" ? `/${href}` : href

                return isPage ? (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="block w-fit font-heading text-[2.1rem] tracking-[-0.02em] text-white transition-all duration-300 hover:translate-x-1 hover:opacity-70"
                  >
                    {label}
                  </Link>
                ) : (
                  <a
                    key={href}
                    href={resolvedHref}
                    onClick={() => setMobileOpen(false)}
                    className="block w-fit font-heading text-[2.1rem] tracking-[-0.02em] text-white transition-all duration-300 hover:translate-x-1 hover:opacity-70"
                  >
                    {label}
                  </a>
                )
              })}
            </div>
          </div>

          <div className="space-y-6 border-t border-white/10 pt-6">
            <div className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.22em] transition-all duration-300",
                  language === "en"
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white"
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("zh")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[0.7rem] font-medium tracking-[0.2em] transition-all duration-300",
                  language === "zh"
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white"
                )}
              >
                {"\u4e2d\u6587"}
              </button>
            </div>

            <p className="max-w-[18rem] text-[0.72rem] uppercase tracking-[0.28em] text-white/42">
              Visual Development Artist / Concept Artist
            </p>
          </div>
        </nav>
      </div>
    </>
  )
}
