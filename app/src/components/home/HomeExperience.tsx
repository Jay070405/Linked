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
        <div className="post-work-atmosphere relative overflow-hidden" style={{ zIndex: 60 }}>
          <div className="pointer-events-none absolute inset-0 hero-3d-grid opacity-[0.06]" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                radial-gradient(circle at 15% 18%, rgba(255,255,255,0.08), transparent 22%),
                radial-gradient(circle at 82% 12%, rgba(255,255,255,0.05), transparent 18%),
                radial-gradient(circle at 50% 46%, rgba(255,255,255,0.04), transparent 28%),
                linear-gradient(180deg, rgba(2,2,2,0.96) 0%, rgba(4,4,4,0.98) 42%, rgba(2,2,2,1) 100%)
              `,
            }}
          />
          <AboutSection />
          <ResumeSection />
          <ContactSection />
        </div>
      </main>
      <Footer />
    </>
  )
}
