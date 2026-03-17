"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/works", label: "Works", isPage: true },
  { href: "/about", label: "About", isPage: true },
  { href: "#resume", label: "Skills", isPage: false },
]

const sectionIds = ["hero", "works", "about", "resume", "contact"]
const sectionLabels: Record<string, string> = {
  hero: "TOP",
  works: "WORKS",
  about: "ABOUT",
  resume: "RESUME",
  contact: "CONTACT",
}

export function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [currentSection, setCurrentSection] = useState("hero")
  const [mobileOpen, setMobileOpen] = useState(false)

  const detectSection = useCallback(() => {
    const threshold = window.innerHeight / 3
    for (let i = sectionIds.length - 1; i >= 0; i--) {
      const el = document.getElementById(sectionIds[i])
      if (!el) continue
      if (el.getBoundingClientRect().top <= threshold) {
        setCurrentSection(sectionIds[i])
        break
      }
    }
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      detectSection()
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [detectSection])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-700",
          scrolled
            ? "bg-bg/80 backdrop-blur-2xl border-b border-white/[0.04]"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 lg:px-10">
          <a
            href="#hero"
            className="font-heading text-sm tracking-[0.25em] text-fg/90 transition-opacity duration-300 hover:opacity-60"
          >
            SHIJIE LIN
          </a>

          {/* Centered nav */}
          <nav className="hidden md:block absolute left-1/2 -translate-x-1/2">
            <ul className="flex items-center gap-10">
              {navLinks.map(({ href, label, isPage }) => (
                <li key={href}>
                  {isPage ? (
                    <Link
                      href={href}
                      className={cn(
                        "relative text-[11px] font-medium tracking-[0.2em] text-fg-muted",
                        "transition-colors duration-300 hover:text-fg",
                        currentSection === "works" && "text-fg"
                      )}
                    >
                      {label}
                    </Link>
                  ) : (
                    <a
                      href={href}
                      className={cn(
                        "relative text-[11px] font-medium tracking-[0.2em] text-fg-muted",
                        "transition-colors duration-300 hover:text-fg",
                        currentSection === href.slice(1) && "text-fg"
                      )}
                    >
                      {label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact button — top right */}
          <a
            href="#contact"
            className="hidden md:flex items-center text-[11px] font-medium tracking-[0.15em] text-fg/80 border border-white/[0.12] rounded-full px-5 py-2 transition-all duration-300 hover:border-white/[0.25] hover:text-fg"
          >
            Contact
          </a>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="relative z-50 flex h-8 w-8 flex-col items-center justify-center gap-[5px] md:hidden"
            aria-label="Toggle menu"
          >
            <span
              className={cn(
                "block h-px w-5 bg-fg transition-all duration-500",
                mobileOpen && "translate-y-[6px] rotate-45"
              )}
            />
            <span
              className={cn(
                "block h-px w-5 bg-fg transition-all duration-500",
                mobileOpen && "opacity-0"
              )}
            />
            <span
              className={cn(
                "block h-px w-5 bg-fg transition-all duration-500",
                mobileOpen && "-translate-y-[6px] -rotate-45"
              )}
            />
          </button>
        </div>
      </header>

      {/* Left section indicator */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex items-center">
        <span
          className="text-[9px] font-medium tracking-[0.35em] text-fg-subtle/60 uppercase"
          style={{ writingMode: "vertical-rl" }}
        >
          {sectionLabels[currentSection]}
        </span>
      </div>

      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 flex flex-col items-center justify-center bg-bg/[0.97] backdrop-blur-3xl transition-all duration-700 md:hidden",
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        <nav className="flex flex-col items-center gap-10">
          {[...navLinks, { href: "#contact", label: "Contact", isPage: false }].map(
            ({ href, label, isPage }) =>
              isPage ? (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="font-heading text-2xl tracking-[0.3em] text-fg-muted transition-colors duration-300 hover:text-fg"
                >
                  {label}
                </Link>
              ) : (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="font-heading text-2xl tracking-[0.3em] text-fg-muted transition-colors duration-300 hover:text-fg"
                >
                  {label}
                </a>
              )
          )}
        </nav>
      </div>
    </>
  )
}
