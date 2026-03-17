"use client"

import { useEffect } from "react"
import { Navigation } from "@/components/Navigation"
import { HeroScene } from "@/components/home/HeroScene"
import { WorksShowcase } from "@/components/home/WorksShowcase"
import { LogoSkillsTransition } from "@/components/home/LogoSkillsTransition"
import { AboutSection } from "@/components/home/AboutSection"
import { ResumeSection } from "@/components/home/ResumeSection"
import { ContactSection } from "@/components/home/ContactSection"
import { CinematicTransition } from "@/components/home/CinematicTransition"
import { Footer } from "@/components/Footer"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"

export default function HomePage() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const timer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <Navigation />
      <main className="relative z-[2]">
        <HeroScene />
        <WorksShowcase />
        <LogoSkillsTransition />
        <ResumeSection />
        <CinematicTransition />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
