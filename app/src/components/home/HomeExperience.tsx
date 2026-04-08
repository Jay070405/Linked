"use client"

import { useState, useCallback } from "react"
import { Navigation } from "@/components/Navigation"
import { HeroScene } from "@/components/home/HeroScene"
import { WorksShowcase } from "@/components/home/WorksShowcase"
import { LogoSkillsTransition } from "@/components/home/LogoSkillsTransition"
import { CinematicTransition } from "@/components/home/CinematicTransition"
import { AboutSection } from "@/components/home/AboutSection"
import { ResumeSection } from "@/components/home/ResumeSection"
import { ContactSection } from "@/components/home/ContactSection"
import { Footer } from "@/components/Footer"
import { ScrollSpy } from "@/components/home/ScrollSpy"
import type { ParticleState } from "@/components/home/p5HeroSketch"

export function HomeExperience() {
  const [brandMorphProgress, setBrandMorphProgress] = useState(0)
  const [bridgeBurstSignal, setBridgeBurstSignal] = useState(0)
  const [heroBridgeProgress, setHeroBridgeProgress] = useState(0)
  const [particleState, setParticleState] = useState<ParticleState>("logo")

  const handleParticleToggle = useCallback(() => {
    setParticleState((current) => (current === "logo" ? "galaxy" : "logo"))
  }, [])

  return (
    <>
      <Navigation brandMorphProgress={brandMorphProgress} />
      <ScrollSpy />
      <main>
        <HeroScene
          onBrandMorphProgressChange={setBrandMorphProgress}
          onBridgeProgressChange={setHeroBridgeProgress}
          onBridgeBurst={() => setBridgeBurstSignal((value) => value + 1)}
          particleState={particleState}
          onParticleToggle={handleParticleToggle}
        />
        <WorksShowcase bridgeBurstSignal={bridgeBurstSignal} heroBridgeProgress={heroBridgeProgress} />
        <LogoSkillsTransition />
        <CinematicTransition />
        <AboutSection />
        <ResumeSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
