# Homepage Polish v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 visual enhancements across the homepage scroll to eliminate dead zones, add interactivity, and deliver a premium editorial feel.

**Architecture:** Vanilla CSS/JS for visual effects (card glow, glass panel, particle dissolve). React components only where they work cleanly (CurvedLoop SVG marquee, ScrollReveal GSAP wrapper). All scroll animations via GSAP ScrollTrigger. Monochrome only — black, white, gray.

**Tech Stack:** Next.js 15, React 19, GSAP + ScrollTrigger, p5.js (existing), Tailwind CSS, vanilla CSS/JS for effects

---

## File Structure

| File | Responsibility |
|------|---------------|
| `app/src/hooks/useCardGlow.ts` | **New** — Mouse-tracking glow hook, sets CSS vars on pointermove |
| `app/src/components/home/ScrollSpy.tsx` | **New** — Fixed vertical dot indicator for active section |
| `app/src/components/home/ParticleDissolve.tsx` | **New** — Canvas-based particle dissolve transition |
| `app/src/app/globals.css` | Add `.card-glow`, `.glass-panel`, `.scroll-spy` styles |
| `app/src/components/Navigation.tsx` | Add underline hover animation, glass bg on scroll |
| `app/src/components/home/HomeExperience.tsx` | Mount ScrollSpy + ParticleDissolve |
| `app/src/components/home/WorksShowcase.tsx` | Apply card glow |
| `app/src/app/works/page.tsx` | Apply card glow |
| `app/src/app/works/[slug]/page.tsx` | Apply card glow |
| `app/src/components/home/CinematicTransition.tsx` | Add frosted glass panel behind text |
| `app/src/components/home/AboutSection.tsx` | Replace SVG with CurvedLoop, add ScrollReveal to body |
| `app/src/components/home/ResumeSection.tsx` | Add ScrollReveal to heading |
| `app/src/components/home/ContactSection.tsx` | Add ScrollReveal to heading + description |
| `app/src/components/home/LogoSkillsTransition.tsx` | Rework timeline pacing |
| `app/src/components/home/p5LogoSkillsSketch.ts` | Adjust explosion phase mapping |
| `app/src/components/BorderGlow.jsx` | **Delete** |
| `app/src/components/BorderGlow.css` | **Delete** |

---

### Task 1: Mouse-Tracking Card Glow — Hook + CSS

**Files:**
- Create: `app/src/hooks/useCardGlow.ts`
- Modify: `app/src/app/globals.css`

- [ ] **Step 1: Create the useCardGlow hook**

```ts
// app/src/hooks/useCardGlow.ts
"use client"

import { useCallback, useRef } from "react"

export function useCardGlow() {
  const glowRefs = useRef<Map<number, HTMLElement>>(new Map())

  const setRef = useCallback((el: HTMLElement | null, index: number) => {
    if (el) {
      glowRefs.current.set(index, el)
    } else {
      glowRefs.current.delete(index)
    }
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLElement>, index: number) => {
    const el = glowRefs.current.get(index)
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    el.style.setProperty("--glow-x", `${x}px`)
    el.style.setProperty("--glow-y", `${y}px`)
    el.style.setProperty("--glow-opacity", "1")
  }, [])

  const handlePointerLeave = useCallback((_e: React.PointerEvent<HTMLElement>, index: number) => {
    const el = glowRefs.current.get(index)
    if (!el) return
    el.style.setProperty("--glow-opacity", "0")
  }, [])

  return { setRef, handlePointerMove, handlePointerLeave }
}
```

- [ ] **Step 2: Add card-glow CSS to globals.css**

Append to end of `app/src/app/globals.css`:

```css
/* Mouse-tracking card glow */

.card-glow {
  position: relative;
  --glow-x: 50%;
  --glow-y: 50%;
  --glow-opacity: 0;
}

.card-glow::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 10;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(
    180px circle at var(--glow-x) var(--glow-y),
    rgba(255, 255, 255, 0.12),
    transparent 70%
  );
  opacity: var(--glow-opacity);
  transition: opacity 0.4s ease;
}
```

- [ ] **Step 3: Verify build**

Run: `cd app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add app/src/hooks/useCardGlow.ts app/src/app/globals.css
git commit -m "feat: add mouse-tracking card glow hook and CSS"
```

---

### Task 2: Apply Card Glow to Works Cards

**Files:**
- Modify: `app/src/components/home/WorksShowcase.tsx`
- Modify: `app/src/app/works/page.tsx`
- Modify: `app/src/app/works/[slug]/page.tsx`

- [ ] **Step 1: Apply glow to WorksShowcase spiral cards**

In `WorksShowcase.tsx`:

1. Add import: `import { useCardGlow } from "@/hooks/useCardGlow"`
2. Inside the component, call: `const { setRef: setGlowRef, handlePointerMove: onGlowMove, handlePointerLeave: onGlowLeave } = useCardGlow()`
3. On each `<Link>` card element (the one with `ref={(element) => { cardRefs.current[index] = element }}`), add:
   - Class: add `card-glow` to the className string
   - Add: `onPointerMove={(e) => onGlowMove(e, index)}`
   - Add: `onPointerLeave={(e) => onGlowLeave(e, index)}`
   - Modify the existing ref callback to also call `setGlowRef`:
     ```tsx
     ref={(element) => {
       cardRefs.current[index] = element
       setGlowRef(element, index)
     }}
     ```

- [ ] **Step 2: Apply glow to works grid page**

In `app/src/app/works/page.tsx`:

1. Add import: `import { useCardGlow } from "@/hooks/useCardGlow"`
2. Inside `WorksPage`, call: `const { setRef: setGlowRef, handlePointerMove: onGlowMove, handlePointerLeave: onGlowLeave } = useCardGlow()`
3. On the image container `<div className="relative overflow-hidden rounded-sm aspect-[16/10] mb-4">`, wrap it to include glow:
   - Add `card-glow` class to the div
   - Add `onPointerMove={(e) => onGlowMove(e, i)}` and `onPointerLeave={(e) => onGlowLeave(e, i)}`
   - Add `ref={(el) => setGlowRef(el, i)}`

- [ ] **Step 3: Apply glow to work detail hero**

In `app/src/app/works/[slug]/page.tsx`:

1. Add import: `import { useCardGlow } from "@/hooks/useCardGlow"`
2. Inside component, call: `const { setRef: setGlowRef, handlePointerMove: onGlowMove, handlePointerLeave: onGlowLeave } = useCardGlow()`
3. On the hero image `<div className="relative w-full overflow-hidden rounded-sm" ...>`:
   - Add `card-glow` class
   - Add `ref={(el) => setGlowRef(el, 0)}`
   - Add `onPointerMove={(e) => onGlowMove(e, 0)}`
   - Add `onPointerLeave={(e) => onGlowLeave(e, 0)}`

- [ ] **Step 4: Build and verify**

Run: `cd app && npx next build --no-lint 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add app/src/components/home/WorksShowcase.tsx app/src/app/works/page.tsx "app/src/app/works/[slug]/page.tsx"
git commit -m "feat: apply mouse-tracking edge glow to all works cards"
```

**BROWSER CHECK**: Ask user to verify the glow effect on cards.

---

### Task 3: Navigation Polish — Underline Animation + Glass BG

**Files:**
- Modify: `app/src/components/Navigation.tsx`

- [ ] **Step 1: Replace the current hover card effect with underline animation**

In `Navigation.tsx`, the desktop nav links currently use this hover pattern:
```tsx
<span className="relative z-10">{label}</span>
<span className="absolute inset-0 rounded-md bg-white/[0.04] opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300" />
```

Replace each desktop nav link's inner content with just:
```tsx
<span className="relative">
  {label}
  <span className="absolute left-0 right-0 -bottom-1 h-px bg-white/50 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
</span>
```

Remove the background hover `<span>` — we're replacing card hover with underline.

- [ ] **Step 2: Enhance the scrolled state glass effect**

The current scrolled header class is:
```
"border-b border-white/10 bg-[rgba(3,3,3,0.72)] shadow-[0_24px_70px_rgba(0,0,0,0.48)] backdrop-blur-2xl"
```

Change to:
```
"border-b border-white/[0.06] bg-[rgba(6,6,6,0.6)] shadow-[0_24px_70px_rgba(0,0,0,0.48)] backdrop-blur-3xl backdrop-saturate-150"
```

This adds stronger blur and saturation for a more visible frosted glass effect.

- [ ] **Step 3: Build and verify**

Run: `cd app && npx next build --no-lint 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add app/src/components/Navigation.tsx
git commit -m "feat: polish nav with underline hover and glass bg"
```

**BROWSER CHECK**: Verify nav hover underline and glass backdrop.

---

### Task 4: Scroll Spy Component

**Files:**
- Create: `app/src/components/home/ScrollSpy.tsx`
- Modify: `app/src/components/home/HomeExperience.tsx`

- [ ] **Step 1: Create ScrollSpy component**

```tsx
// app/src/components/home/ScrollSpy.tsx
"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "works", label: "Works" },
  { id: "practice", label: "About" },
  { id: "resume", label: "Resume" },
  { id: "contact", label: "Contact" },
]

export function ScrollSpy() {
  const [active, setActive] = useState("hero")

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id)
        },
        { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[85] hidden md:flex flex-col gap-3">
      {SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => scrollTo(id)}
          aria-label={`Scroll to ${label}`}
          className={cn(
            "group relative flex items-center justify-end transition-all duration-300",
          )}
        >
          {/* Label tooltip */}
          <span className="absolute right-5 whitespace-nowrap text-[9px] uppercase tracking-[0.2em] text-white/0 group-hover:text-white/50 transition-all duration-300 pointer-events-none">
            {label}
          </span>
          {/* Dot */}
          <span
            className={cn(
              "block rounded-full transition-all duration-400",
              active === id
                ? "w-2 h-2 bg-white shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                : "w-1.5 h-1.5 border border-white/20 bg-transparent hover:border-white/40"
            )}
          />
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Add `id="hero"` to HeroScene section if missing**

Check `HeroScene.tsx` — the outermost section/div needs `id="hero"`. If it doesn't have it, add it to the root element.

- [ ] **Step 3: Mount ScrollSpy in HomeExperience**

In `HomeExperience.tsx`, add:
```tsx
import { ScrollSpy } from "@/components/home/ScrollSpy"
```

Place `<ScrollSpy />` right after `<Navigation ... />`:
```tsx
<Navigation brandMorphProgress={brandMorphProgress} />
<ScrollSpy />
```

- [ ] **Step 4: Build and verify**

Run: `cd app && npx next build --no-lint 2>&1 | tail -5`

- [ ] **Step 5: Commit**

```bash
git add app/src/components/home/ScrollSpy.tsx app/src/components/home/HomeExperience.tsx
git commit -m "feat: add scroll spy vertical dot indicator"
```

**BROWSER CHECK**: Verify dots appear on right side, highlight on scroll, click to navigate.

---

### Task 5: CSS Frosted Glass on Cinematic Text

**Files:**
- Modify: `app/src/components/home/CinematicTransition.tsx`
- Modify: `app/src/app/globals.css`

- [ ] **Step 1: Add glass-panel CSS to globals.css**

Append to `globals.css`:

```css
/* Frosted glass panel */

.glass-panel {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.glass-panel-inner {
  width: min(80vw, 900px);
  height: 40vh;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.025);
  backdrop-filter: blur(24px) saturate(120%);
  -webkit-backdrop-filter: blur(24px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 0 120px rgba(255, 255, 255, 0.03);
  position: relative;
  overflow: hidden;
}

.glass-panel-inner::before {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  padding: 1px;
  background: conic-gradient(
    from var(--glass-angle, 0deg),
    transparent 0%,
    rgba(255, 255, 255, 0.08) 10%,
    transparent 20%,
    transparent 80%,
    rgba(255, 255, 255, 0.06) 90%,
    transparent 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: glass-rotate 20s linear infinite;
}

@keyframes glass-rotate {
  to { --glass-angle: 360deg; }
}

@property --glass-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
```

- [ ] **Step 2: Add glass panel to CinematicTransition**

In `CinematicTransition.tsx`, add a `glassRef` ref:
```tsx
const glassRef = useRef<HTMLDivElement>(null)
```

Add the glass panel div right before the Typography div:
```tsx
{/* Frosted glass panel */}
<div ref={glassRef} className="glass-panel opacity-0">
  <div className="glass-panel-inner" />
</div>
```

In the GSAP timeline, add glass fade-in at the same time text appears (~0.06):
```tsx
// Glass panel fades in
timeline.fromTo(
  glassRef.current,
  { opacity: 0 },
  { opacity: 1, duration: 0.12, ease: "power2.out" },
  0.04
)

// Glass panel fades out with text
timeline.to(
  glassRef.current,
  { opacity: 0, duration: 0.14, ease: "power2.in" },
  0.78
)
```

- [ ] **Step 3: Build and verify**

Run: `cd app && npx next build --no-lint 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add app/src/components/home/CinematicTransition.tsx app/src/app/globals.css
git commit -m "feat: add frosted glass panel behind cinematic text"
```

**BROWSER CHECK**: Verify glass panel is visible behind text, rotates subtly, fades in/out with content.

---

### Task 6: Particle Dissolve Transition

**Files:**
- Create: `app/src/components/home/ParticleDissolve.tsx`
- Modify: `app/src/components/home/HomeExperience.tsx`

- [ ] **Step 1: Create ParticleDissolve component**

```tsx
// app/src/components/home/ParticleDissolve.tsx
"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/dist/ScrollTrigger"

const PARTICLE_COUNT = 800
const MAX_SIZE = 2.5

interface Dot {
  x: number
  y: number
  homeX: number
  homeY: number
  size: number
  alpha: number
}

export function ParticleDissolve() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const canvas = canvasRef.current
    const section = sectionRef.current
    if (!canvas || !section) return

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    const ctx2d = canvas.getContext("2d")
    if (!ctx2d) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx2d.scale(dpr, dpr)

    // Initialize dots in random grid
    const dots: Dot[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      dots.push({
        x,
        y,
        homeX: x,
        homeY: y,
        size: 0.5 + Math.random() * MAX_SIZE,
        alpha: 0.3 + Math.random() * 0.7,
      })
    }

    const progressProxy = { value: 0 }

    const render = () => {
      const p = progressProxy.value
      ctx2d.clearRect(0, 0, w, h)

      // Background: black fading to transparent
      const bgAlpha = Math.max(0, 1 - p * 1.8)
      if (bgAlpha > 0.01) {
        ctx2d.fillStyle = `rgba(2, 2, 2, ${bgAlpha})`
        ctx2d.fillRect(0, 0, w, h)
      }

      const cx = w / 2
      const cy = h / 2

      for (const dot of dots) {
        // Phase 0.0-0.3: dots appear
        // Phase 0.3-0.7: dots scatter outward
        // Phase 0.7-1.0: dots fade out
        let dotAlpha = dot.alpha
        let dx = 0
        let dy = 0

        if (p < 0.3) {
          // Appear phase
          dotAlpha *= p / 0.3
        } else if (p < 0.7) {
          // Scatter phase
          const scatterT = (p - 0.3) / 0.4
          const eased = scatterT * scatterT
          const dirX = dot.homeX - cx
          const dirY = dot.homeY - cy
          const dist = Math.sqrt(dirX * dirX + dirY * dirY) || 1
          dx = (dirX / dist) * eased * 300
          dy = (dirY / dist) * eased * 300
        } else {
          // Fade out phase
          const fadeT = (p - 0.7) / 0.3
          const dirX = dot.homeX - cx
          const dirY = dot.homeY - cy
          const dist = Math.sqrt(dirX * dirX + dirY * dirY) || 1
          dx = (dirX / dist) * 300
          dy = (dirY / dist) * 300
          dotAlpha *= Math.max(0, 1 - fadeT)
        }

        if (dotAlpha < 0.01) continue

        ctx2d.beginPath()
        ctx2d.arc(dot.homeX + dx, dot.homeY + dy, dot.size, 0, Math.PI * 2)
        ctx2d.fillStyle = `rgba(220, 220, 220, ${dotAlpha})`
        ctx2d.fill()
      }
    }

    const gsapCtx = gsap.context(() => {
      gsap.to(progressProxy, {
        value: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=1200",
          pin: true,
          pinSpacing: true,
          scrub: 1,
          anticipatePin: 1,
          onUpdate: () => render(),
        },
      })
    }, section)

    render()

    return () => gsapCtx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
      style={{ zIndex: 62, position: "relative", background: "transparent" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ pointerEvents: "none" }}
      />
    </section>
  )
}
```

- [ ] **Step 2: Mount in HomeExperience**

In `HomeExperience.tsx`, add import:
```tsx
import { ParticleDissolve } from "@/components/home/ParticleDissolve"
```

Place between CinematicTransition and AboutSection:
```tsx
<CinematicTransition />
<ParticleDissolve />
<AboutSection />
```

- [ ] **Step 3: Build and verify**

Run: `cd app && npx next build --no-lint 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add app/src/components/home/ParticleDissolve.tsx app/src/components/home/HomeExperience.tsx
git commit -m "feat: add particle dissolve transition between cinematic and about"
```

**BROWSER CHECK**: Verify particles appear after cinematic text, scatter outward revealing About section behind.

---

### Task 7: CurvedLoop Marquee in About Section

**Files:**
- Modify: `app/src/components/home/AboutSection.tsx`
- Modify: `app/src/components/CurvedLoop.css`

- [ ] **Step 1: Override CurvedLoop CSS defaults**

The default CurvedLoop CSS has `min-height: 100vh` and `font-size: 6rem`. Override in `CurvedLoop.css`:

Replace the entire file content with:
```css
.curved-loop-jacket {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.curved-loop-svg {
  user-select: none;
  -moz-user-select: none;
  -webkit-user-select: none;
  width: 100%;
  aspect-ratio: 100 / 12;
  overflow: visible;
  display: block;
  font-size: 2rem;
  fill: #ffffff;
  font-weight: 300;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  line-height: 1;
}
```

Key changes: removed `min-height: 100vh`, reduced `font-size` to `2rem`, lighter `font-weight`, added `letter-spacing`.

- [ ] **Step 2: Replace SVG curves with CurvedLoop in AboutSection**

In `AboutSection.tsx`:

1. Add import at top:
```tsx
import CurvedLoop from "@/components/CurvedLoop"
```

2. Remove the ScrollReveal import if it causes issues (keep it for now — it's used on the statement).

3. Replace the SVG block (the `<div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.25]">` with the `<svg>` inside) with:

```tsx
{/* CurvedLoop marquee background */}
<div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.12]">
  <div className="absolute top-[30%] left-0 right-0">
    <CurvedLoop
      marqueeText="WORLDBUILDING · ENVIRONMENT DESIGN · VISUAL DEVELOPMENT · NARRATIVE · ATMOSPHERE · "
      speed={1.5}
      direction="left"
      interactive={false}
      curveAmount={200}
    />
  </div>
  <div className="absolute top-[60%] left-0 right-0">
    <CurvedLoop
      marqueeText="WORLDBUILDING · ENVIRONMENT DESIGN · VISUAL DEVELOPMENT · NARRATIVE · ATMOSPHERE · "
      speed={1}
      direction="right"
      interactive={false}
      curveAmount={150}
    />
  </div>
</div>
```

- [ ] **Step 3: Build and verify**

Run: `cd app && npx next build --no-lint 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add app/src/components/home/AboutSection.tsx app/src/components/CurvedLoop.css
git commit -m "feat: add CurvedLoop keyword marquee to About section background"
```

**BROWSER CHECK**: Verify curved text marquees are visible behind About content, low opacity, scrolling in opposite directions.

---

### Task 8: ScrollReveal on Key Text

**Files:**
- Modify: `app/src/components/home/AboutSection.tsx`
- Modify: `app/src/components/home/ResumeSection.tsx`
- Modify: `app/src/components/home/ContactSection.tsx`
- Modify: `app/src/components/ScrollReveal.css`

- [ ] **Step 1: Fix ScrollReveal CSS defaults**

The default `ScrollReveal.css` has `margin: 20px 0` and a fixed `font-size`. Override to be more flexible:

Replace content of `ScrollReveal.css`:
```css
.scroll-reveal {
  margin: 0;
}

.scroll-reveal-text {
  line-height: inherit;
  font-weight: inherit;
  font-size: inherit;
}

.word {
  display: inline-block;
}
```

This lets the parent's className control the typography.

- [ ] **Step 2: Add ScrollReveal to About body paragraphs**

In `AboutSection.tsx`, the body text section currently is:
```tsx
<div className="ab-reveal space-y-6 mb-14">
  <p className="text-[0.95rem] md:text-base leading-[1.85] text-fg-muted max-w-[640px]">
    Specializing in fantasy worldbuilding...
  </p>
  <p className="text-[0.95rem] md:text-base leading-[1.85] text-fg-muted max-w-[640px]">
    I draw from Eastern and Western mythology...
  </p>
</div>
```

Replace with:
```tsx
<div className="space-y-6 mb-14">
  <ScrollReveal
    scrollContainerRef={null}
    baseOpacity={0.15}
    baseRotation={1}
    blurStrength={2}
    enableBlur={true}
    containerClassName="ab-reveal-skip"
    textClassName="text-[0.95rem] md:text-base leading-[1.85] text-fg-muted max-w-[640px]"
  >
    Specializing in fantasy worldbuilding, environment design, and cinematic illustration. My work spans concept art, visual development, and narrative-driven imagery — each piece a fragment of a larger story.
  </ScrollReveal>
  <ScrollReveal
    scrollContainerRef={null}
    baseOpacity={0.15}
    baseRotation={1}
    blurStrength={2}
    enableBlur={true}
    containerClassName="ab-reveal-skip"
    textClassName="text-[0.95rem] md:text-base leading-[1.85] text-fg-muted max-w-[640px]"
  >
    I draw from Eastern and Western mythology, architectural history, and the natural world. The best concept art makes you feel like you've been to a place you can't quite remember.
  </ScrollReveal>
</div>
```

- [ ] **Step 3: Add ScrollReveal to ResumeSection heading**

In `ResumeSection.tsx`, add import:
```tsx
import ScrollReveal from "@/components/ScrollReveal"
```

Replace the heading `<h2>`:
```tsx
<h2 className="font-heading text-2xl md:text-3xl tracking-[0.06em] text-fg">
  Experience & Skills
</h2>
```

With:
```tsx
<ScrollReveal
  scrollContainerRef={null}
  baseOpacity={0.08}
  baseRotation={2}
  blurStrength={3}
  enableBlur={true}
  containerClassName=""
  textClassName="font-heading text-2xl md:text-3xl tracking-[0.06em] text-fg"
>
  Experience & Skills
</ScrollReveal>
```

Remove the `rs-reveal` class from the parent `<div className="rs-reveal mb-12">` wrapping both the label and the heading — change it to `<div className="mb-12">`. Keep the label's own `rs-reveal` class by adding it directly: change `<p className="mb-4 ...">` to include a separate GSAP reveal or just keep it as-is (it'll animate via the existing `.rs-reveal` observer).

Actually simpler: keep the `rs-reveal` on the parent div, since the label still needs it. The ScrollReveal on the heading will handle its own animation.

- [ ] **Step 4: Add ScrollReveal to ContactSection heading + description**

In `ContactSection.tsx`, add import:
```tsx
import ScrollReveal from "@/components/ScrollReveal"
```

Replace the heading:
```tsx
<h2 className="ct-reveal font-heading text-2xl md:text-4xl lg:text-5xl tracking-[0.06em] text-fg mb-6">
  Let&apos;s Connect
</h2>
```

With:
```tsx
<ScrollReveal
  scrollContainerRef={null}
  baseOpacity={0.08}
  baseRotation={2}
  blurStrength={3}
  enableBlur={true}
  containerClassName="mb-6"
  textClassName="font-heading text-2xl md:text-4xl lg:text-5xl tracking-[0.06em] text-fg"
>
  Let's Connect
</ScrollReveal>
```

Replace the description paragraph:
```tsx
<p className="ct-reveal text-sm md:text-base leading-[1.8] text-fg-muted max-w-lg mx-auto mb-14">
  Open to freelance projects, collaborations, and concept art commissions.
</p>
```

With:
```tsx
<ScrollReveal
  scrollContainerRef={null}
  baseOpacity={0.15}
  baseRotation={1}
  blurStrength={2}
  enableBlur={true}
  containerClassName="mb-14 mx-auto max-w-lg"
  textClassName="text-sm md:text-base leading-[1.8] text-fg-muted"
>
  Open to freelance projects, collaborations, and concept art commissions.
</ScrollReveal>
```

- [ ] **Step 5: Build and verify**

Run: `cd app && npx next build --no-lint 2>&1 | tail -5`

- [ ] **Step 6: Commit**

```bash
git add app/src/components/home/AboutSection.tsx app/src/components/home/ResumeSection.tsx app/src/components/home/ContactSection.tsx app/src/components/ScrollReveal.css
git commit -m "feat: apply ScrollReveal to key headings and paragraphs"
```

**BROWSER CHECK**: Verify word-by-word reveal on scroll for About text, Resume heading, Contact heading + description.

---

### Task 9: LogoSkillsTransition Pacing Rework

**Files:**
- Modify: `app/src/components/home/LogoSkillsTransition.tsx`
- Modify: `app/src/components/home/p5LogoSkillsSketch.ts`

- [ ] **Step 1: Update LogoSkillsTransition timeline**

In `LogoSkillsTransition.tsx`, update the ScrollTrigger config:

Change:
```tsx
end: "+=3400",
pin: true,
pinSpacing: true,
scrub: 2.0,
```

To:
```tsx
end: "+=5000",
pin: true,
pinSpacing: true,
scrub: 1.5,
```

Then rework ALL timeline positions. Replace the entire timeline content (from Phase 1 through Phase 6) with:

```tsx
// Phase 1 (0.00–0.12): Logo scales in
tl.fromTo(
  canvasWrapRef.current,
  { opacity: 0, scale: 0.6 },
  { opacity: 1, scale: 1, duration: 0.12, ease: "power3.out" },
  0
)

// Phase 2 (0.12–0.28): Typewriter "SKILLS" text reveal
tl.fromTo(
  titleWrapRef.current,
  { opacity: 0 },
  { opacity: 1, duration: 0.02 },
  0.12
)

letterRefs.current.forEach((letter, i) => {
  if (!letter) return
  tl.fromTo(
    letter,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.03, ease: "power2.out" },
    0.14 + i * 0.02
  )
})

tl.fromTo(
  subtitleRef.current,
  { opacity: 0, y: 18 },
  { opacity: 0.6, y: 0, duration: 0.04, ease: "power2.out" },
  0.24
)

tl.fromTo(
  cnRef.current,
  { opacity: 0, y: 12 },
  { opacity: 0.4, y: 0, duration: 0.04, ease: "power2.out" },
  0.27
)

// Phase 3 (0.28–0.45): Hold — logo + text visible, breathing

// Phase 4 (0.45–0.55): Fade out text
tl.to(
  [subtitleRef.current, cnRef.current],
  { opacity: 0, y: -20, duration: 0.05, ease: "power2.in" },
  0.45
)

letterRefs.current.forEach((letter) => {
  if (!letter) return
  tl.to(letter, { opacity: 0, duration: 0.04, ease: "power2.in" }, 0.48)
})

tl.to(titleWrapRef.current, { opacity: 0, duration: 0.03 }, 0.52)

// Phase 5 (0.55–0.82): Particle explosion — driven by scrollProgress in p5

// Phase 6 (0.82–0.94): Particles scatter and fade (handled in p5)

// Phase 7 (0.94–1.00): Dark overlay fades in
tl.fromTo(
  zoomOverlayRef.current,
  { opacity: 0 },
  { opacity: 1, duration: 0.06, ease: "power2.inOut" },
  0.94
)

// Aperture mask removed — simple overlay fade handles the transition
```

- [ ] **Step 2: Update explosion phase in p5LogoSkillsSketch.ts**

In `p5LogoSkillsSketch.ts`, find the explosion constants:
```ts
const EXPLODE_START = 0.64
const EXPLODE_END = 0.92
```

Change to:
```ts
const EXPLODE_START = 0.55
const EXPLODE_END = 0.90
```

Also increase the burst distance for more dramatic spread. Find:
```ts
const burstDist = easedT * 180
```

Change to:
```ts
const burstDist = easedT * 280
```

And increase the drift:
```ts
const driftY = explosionT * 60 * particle.stagger
```

Change to:
```ts
const driftY = explosionT * 100 * particle.stagger
```

- [ ] **Step 3: Build and verify**

Run: `cd app && npx next build --no-lint 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add app/src/components/home/LogoSkillsTransition.tsx app/src/components/home/p5LogoSkillsSketch.ts
git commit -m "feat: rework LogoSkillsTransition pacing — 5000px pin, slow-motion explosion"
```

**BROWSER CHECK**: This is the most critical check. Scroll slowly through the LogoSkills section. You should see: logo fade in → SKILLS text typewriter → long hold → text fades → slow-motion particle explosion → dark overlay. Each phase should feel deliberate and cinematic.

---

### Task 10: Cleanup — Delete Unused Components

**Files:**
- Delete: `app/src/components/BorderGlow.jsx`
- Delete: `app/src/components/BorderGlow.css`

- [ ] **Step 1: Verify BorderGlow is not imported anywhere**

Run: `grep -r "BorderGlow" app/src/ --include="*.tsx" --include="*.ts" --include="*.jsx"`
Expected: No results (we removed all imports in the earlier fix session)

- [ ] **Step 2: Delete the files**

```bash
rm app/src/components/BorderGlow.jsx app/src/components/BorderGlow.css
```

- [ ] **Step 3: Build and verify**

Run: `cd app && npx next build --no-lint 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add -u app/src/components/BorderGlow.jsx app/src/components/BorderGlow.css
git commit -m "chore: delete unused BorderGlow component"
```

---

### Task 11: Final Build + Full Scroll Test

- [ ] **Step 1: Full production build**

Run: `cd app && npx next build --no-lint`
Expected: Clean build, no errors

- [ ] **Step 2: Full scroll test checklist**

Ask user to scroll through the entire homepage and verify:

1. ✅ Hero → Works: spiral cards have mouse-tracking edge glow
2. ✅ Works → LogoSkills: z-index stacking correct, no bleed-through
3. ✅ LogoSkills: long cinematic hold, slow-motion explosion, deliberate pacing
4. ✅ LogoSkills → Cinematic: smooth dark overlay transition
5. ✅ Cinematic text: frosted glass panel visible behind text
6. ✅ Cinematic → About: particle dissolve transition, no black gap
7. ✅ About section: CurvedLoop marquee visible in background
8. ✅ About text: ScrollReveal word-by-word on scroll
9. ✅ Resume heading: ScrollReveal
10. ✅ Contact heading + description: ScrollReveal
11. ✅ Navigation: underline hover, glass bg on scroll
12. ✅ Scroll spy: dots on right side, active section highlighted
13. ✅ Works page (/works): card glow on grid
14. ✅ Work detail page: card glow on hero

- [ ] **Step 3: Final commit if any tweaks needed**
