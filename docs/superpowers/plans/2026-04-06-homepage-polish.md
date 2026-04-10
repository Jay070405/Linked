# Homepage Interaction Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the portfolio homepage interaction flow — fix particle timing, add cinematic handoff, integrate React Bits UI effects, and redesign works information areas.

**Architecture:** Incremental changes on the existing Next.js + GSAP + p5.js stack. Priority 1–2 are pure timing/animation fixes in existing files. Priority 3 tries React Bits via shadcn registry with manual fallback. Priority 4 extends the data model and rebuilds works page layouts.

**Tech Stack:** Next.js 15, React 19, GSAP 3.12, p5.js 2.2, Tailwind 3.4, shadcn (new)

---

## File Map

### Priority 1 — Particle Timing
- **Modify:** `app/src/components/home/LogoSkillsTransition.tsx` — ScrollTrigger config + timeline phases
- **Modify:** `app/src/components/home/p5LogoSkillsSketch.ts` — explosion physics constants + easing

### Priority 2 — Section Handoff
- **Modify:** `app/src/components/home/LogoSkillsTransition.tsx` — add aperture mask div + GSAP animation
- **Modify:** `app/src/components/home/CinematicTransition.tsx` — add subtle entrance animation

### Priority 3 — React Bits
- **Create:** `app/components.json` (shadcn init)
- **Create:** Generated React Bits components (paths TBD after install)
- **Modify:** `app/src/components/home/WorksShowcase.tsx` — BorderGlow on cards
- **Modify:** `app/src/app/works/page.tsx` — BorderGlow on grid images
- **Modify:** `app/src/app/works/[slug]/page.tsx` — BorderGlow on hero image
- **Modify:** `app/src/components/Navigation.tsx` — CardNav integration
- **Modify:** `app/src/components/home/CinematicTransition.tsx` — FluidGlass on headlines (DOM refactor)
- **Modify:** `app/src/components/home/AboutSection.tsx` — CurvedLoop background layer

### Priority 4 — Works Redesign
- **Modify:** `app/src/data/portfolio.ts` — extend WorkItem type + populate sample data
- **Modify:** `app/src/app/works/page.tsx` — filter bar upgrade + two-tier card hover
- **Modify:** `app/src/app/works/[slug]/page.tsx` — sticky meta panel + process/mood/notes sections + related works

---

## Task 1: Extend LogoSkillsTransition ScrollTrigger

**Files:**
- Modify: `app/src/components/home/LogoSkillsTransition.tsx:41-64`

- [ ] **Step 1: Update ScrollTrigger config**

In `LogoSkillsTransition.tsx`, change the ScrollTrigger inside `useEffect` (line 42–63):

```tsx
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: sectionRef.current,
    start: "top top",
    end: "+=4800",
    pin: true,
    pinSpacing: true,
    scrub: 2.4,
    anticipatePin: 1,
    refreshPriority: -1,
    onEnter: () => {
      if (sectionRef.current) sectionRef.current.style.visibility = "visible"
    },
    onLeave: () => {
      if (sectionRef.current) sectionRef.current.style.visibility = "hidden"
    },
    onLeaveBack: () => {
      if (sectionRef.current) sectionRef.current.style.visibility = "hidden"
    },
    onEnterBack: () => {
      if (sectionRef.current) sectionRef.current.style.visibility = "visible"
    },
  },
})
```

Changes: `end: "+=2600"` → `"+=4800"`, `scrub: 1.8` → `2.4`.

- [ ] **Step 2: Verify section still pins and unpins**

Run: `cd app && npm run dev`

Open browser at `http://localhost:3000`. Scroll to the LogoSkillsTransition section. Verify:
- Section pins at top of viewport
- Scrolling through the section takes noticeably longer than before
- Section unpins and next section appears

- [ ] **Step 3: Commit**

```bash
git add app/src/components/home/LogoSkillsTransition.tsx
git commit -m "fix: extend LogoSkillsTransition scroll distance to 4800px"
```

---

## Task 2: Restructure LogoSkillsTransition Timeline Phases

**Files:**
- Modify: `app/src/components/home/LogoSkillsTransition.tsx:78-140`

- [ ] **Step 1: Rewrite all timeline phases**

Replace the entire timeline animation block (after the `tl.to(progressProxy, ...)` call) with the new phase structure:

```tsx
// Drive scrollProgress 0→1 across the full timeline
tl.to(
  progressProxy,
  {
    value: 1,
    duration: 1,
    ease: "none",
    onUpdate: () => setScrollProgress(progressProxy.value),
  },
  0
)

// Phase 1 (0.00–0.15): Logo scales in
tl.fromTo(
  canvasWrapRef.current,
  { opacity: 0, scale: 0.6 },
  { opacity: 1, scale: 1, duration: 0.14, ease: "power3.out" },
  0
)

// Phase 2 (0.15–0.40): Typewriter "SKILLS" text reveal
tl.fromTo(
  titleWrapRef.current,
  { opacity: 0 },
  { opacity: 1, duration: 0.02 },
  0.15
)

letterRefs.current.forEach((letter, i) => {
  if (!letter) return
  tl.fromTo(
    letter,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.04, ease: "power2.out" },
    0.17 + i * 0.025
  )
})

tl.fromTo(
  subtitleRef.current,
  { opacity: 0, y: 18 },
  { opacity: 0.6, y: 0, duration: 0.06, ease: "power2.out" },
  0.34
)

tl.fromTo(
  cnRef.current,
  { opacity: 0, y: 12 },
  { opacity: 0.4, y: 0, duration: 0.05, ease: "power2.out" },
  0.38
)

// Phase 3 (0.40–0.58): Hold — text + logo visible, calm breathing

// Phase 4 (0.58–0.72): Fade out text
tl.to(
  [subtitleRef.current, cnRef.current],
  { opacity: 0, y: -20, duration: 0.06, ease: "power2.in" },
  0.58
)

letterRefs.current.forEach((letter) => {
  if (!letter) return
  tl.to(letter, { opacity: 0, duration: 0.04, ease: "power2.in" }, 0.62)
})

tl.to(titleWrapRef.current, { opacity: 0, duration: 0.04 }, 0.66)

// Phase 5 (0.64–0.92): Particle explosion — driven by scrollProgress in p5 sketch

// Phase 6 (0.88–1.00): Dark overlay fades in
tl.fromTo(
  zoomOverlayRef.current,
  { opacity: 0 },
  { opacity: 1, duration: 0.10, ease: "power2.inOut" },
  0.90
)
```

Key changes from old timeline:
- Subtitle/CN reveal pushed earlier (0.34/0.38 vs 0.38/0.42) to complete before hold
- Text exit starts at 0.58 (was 0.62)
- Letter fade at 0.62 (was 0.64)
- Overlay pushed from 0.78 to 0.90

- [ ] **Step 2: Browser verify timeline phases**

Run dev server. Scroll through LogoSkillsTransition slowly:
- 0–15%: Canvas fades in with particles
- 15–40%: "SKILLS" letters appear one by one, then subtitle/CN
- 40–58%: Everything holds visible — no motion
- 58–72%: Text fades out
- 90–100%: Dark overlay fades in

- [ ] **Step 3: Commit**

```bash
git add app/src/components/home/LogoSkillsTransition.tsx
git commit -m "fix: restructure LogoSkillsTransition timeline for longer hold and delayed overlay"
```

---

## Task 3: Rework p5 Explosion Physics

**Files:**
- Modify: `app/src/components/home/p5LogoSkillsSketch.ts:149-233`

- [ ] **Step 1: Replace explosion phase constants and logic**

Replace the explosion logic in the `p.draw` function (lines 149–233) with:

```ts
p.draw = () => {
  if (document.hidden) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = config.width
  const h = config.height
  const t = p.millis() * 0.001

  p.clear()

  // Parallax offset from mouse
  const parallaxX = ((mouseX - w / 2) / w) * PARALLAX_STRENGTH
  const parallaxY = ((mouseY - h / 2) / h) * PARALLAX_STRENGTH

  // Named explosion phase
  const EXPLODE_START = 0.64
  const EXPLODE_END = 0.92
  const rawExplosionT =
    scrollProgress <= EXPLODE_START
      ? 0
      : scrollProgress >= EXPLODE_END
        ? 1
        : (scrollProgress - EXPLODE_START) / (EXPLODE_END - EXPLODE_START)
  // Clamp just in case
  const explosionT = Math.max(0, Math.min(1, rawExplosionT))
  const isExploding = explosionT > 0

  for (const particle of particles) {
    // ─── Hover repulsion ───────────────────────────────────
    let repelForceX = 0
    let repelForceY = 0

    if (!isExploding) {
      const dmx = particle.x - mouseX
      const dmy = particle.y - mouseY
      const mouseDist = Math.sqrt(dmx * dmx + dmy * dmy)
      if (mouseDist < REPEL_RADIUS && mouseDist > 0.1) {
        const force =
          ((REPEL_RADIUS - mouseDist) / REPEL_RADIUS) * REPEL_STRENGTH
        repelForceX = (dmx / mouseDist) * force
        repelForceY = (dmy / mouseDist) * force
      }
    }

    // ─── Spring to logo position (when not exploding) ──────
    if (!isExploding) {
      const noiseX =
        (p.noise(particle.phase + t * 0.3, 0) - 0.5) * 2 * IDLE_AMPLITUDE
      const noiseY =
        (p.noise(0, particle.phase + t * 0.3) - 0.5) * 2 * IDLE_AMPLITUDE

      const goalX = particle.logoX + noiseX + parallaxX
      const goalY = particle.logoY + noiseY + parallaxY

      const forceX = (goalX - particle.x) * SPRING_STIFFNESS
      const forceY = (goalY - particle.y) * SPRING_STIFFNESS

      particle.vx += forceX + repelForceX
      particle.vy += forceY + repelForceY
      particle.vx *= DAMPING
      particle.vy *= DAMPING
      particle.x += particle.vx
      particle.y += particle.vy
    }

    // ─── Draw ──────────────────────────────────────────────
    let drawX = particle.x * dpr
    let drawY = particle.y * dpr
    let drawAlpha = particle.baseAlpha

    // ─── Scroll explosion (0.64 → 0.92) ───────────────────
    if (isExploding) {
      const dx = particle.x - centerX
      const dy = particle.y - centerY
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))

      // Cubic easing for slow ramp-up — tunable starting point
      const easedT = explosionT * explosionT * explosionT
      const burstDist = easedT * 180

      const offsetX = (dx / dist) * burstDist
      const offsetY = (dy / dist) * burstDist

      // Extended downward drift
      const driftY = explosionT * 60 * particle.stagger

      drawX = (particle.x + offsetX) * dpr
      drawY = (particle.y + offsetY + driftY) * dpr

      // Alpha fade: fast at edges, slow at center — stretched over wider range
      const fadeBias = 0.25 + particle.stagger * 0.75
      drawAlpha *= Math.max(0, 1 - explosionT * fadeBias)
    }

    // ─── Entrance fade (0 → 0.15) ─────────────────────────
    if (scrollProgress < 0.15) {
      drawAlpha *= scrollProgress / 0.15
    }

    // Render particle
    if (drawAlpha > 0.01) {
      const drawSize = particle.size * dpr
      p.fill(240, 240, 240, drawAlpha * 255)
      p.ellipse(drawX, drawY, drawSize * 2, drawSize * 2)
    }
  }
}
```

Key changes:
- `EXPLODE_START = 0.64`, `EXPLODE_END = 0.92` (was hardcoded 0.6/1.0)
- Cubic easing `explosionT³` (was quadratic `explosionT²`) for slower ramp-up
- `burstDist` multiplier: `180` (was `250`) — tune in browser
- Extended drift: `60 * stagger` (was `40 * stagger`)
- Wider fade bias: `0.25 + stagger * 0.75` (was `0.3 + stagger * 0.7`)

- [ ] **Step 2: Browser verify explosion behavior**

Scroll through LogoSkillsTransition:
- Particles should hold their logo shape until ~64% scroll progress
- Explosion should ramp up slowly (cubic ease)
- Multiple wheel ticks needed to see full explosion
- Particles drift downward and outward, fading from edges first
- By 92%, most particles have scattered and faded

- [ ] **Step 3: Commit**

```bash
git add app/src/components/home/p5LogoSkillsSketch.ts
git commit -m "fix: rework explosion physics — cubic easing, wider phase, slower ramp"
```

---

## Task 4: Add Aperture Mask to LogoSkillsTransition

**Files:**
- Modify: `app/src/components/home/LogoSkillsTransition.tsx`

- [ ] **Step 1: Add aperture ref and DOM element**

Add a new ref at line 19 (after `zoomOverlayRef`):

```tsx
const apertureRef = useRef<HTMLDivElement>(null)
```

Add the aperture div in the JSX, just before the existing `zoomOverlayRef` div (before line 209):

```tsx
{/* Aperture reveal mask — opens from center */}
<div
  ref={apertureRef}
  className="absolute inset-0 z-[28] pointer-events-none"
  style={{
    background: "hsl(240 10% 2%)",
    maskImage: "radial-gradient(circle, transparent 0%, black 0%)",
    WebkitMaskImage: "radial-gradient(circle, transparent 0%, black 0%)",
  }}
/>
```

- [ ] **Step 2: Add aperture GSAP animation in the timeline**

Inside the `useEffect` GSAP context, after the overlay animation (the `tl.fromTo(zoomOverlayRef.current, ...)` block), add:

```tsx
// Aperture mask — opens from center, gentle start accelerating end
const apertureEl = apertureRef.current
if (apertureEl) {
  tl.fromTo(
    { radius: 0 },
    {
      radius: 120,
      duration: 0.08,
      ease: "power2.in",
      onUpdate: function (this: gsap.core.Tween) {
        const r = this.targets()[0].radius as number
        const grad = `radial-gradient(circle, transparent ${r}%, black ${r + 8}%)`
        apertureEl.style.maskImage = grad
        apertureEl.style.webkitMaskImage = grad
      },
    },
    0.90
  )
}
```

This animates the mask radius from 0% to 120% (beyond viewport) over the 0.90–0.98 range, creating an iris-open reveal. The `power2.in` ease starts gentle and accelerates.

- [ ] **Step 3: Browser verify aperture**

Scroll to the end of LogoSkillsTransition:
- At ~90%, a circular reveal should start opening from center
- The opening accelerates slightly near the end
- Through the aperture, the next section (CinematicTransition) becomes visible
- The overlay darkens the frame while the aperture punches through it

- [ ] **Step 4: Commit**

```bash
git add app/src/components/home/LogoSkillsTransition.tsx
git commit -m "feat: add aperture reveal mask at end of LogoSkillsTransition"
```

---

## Task 5: Add Subtle Entrance to CinematicTransition

**Files:**
- Modify: `app/src/components/home/CinematicTransition.tsx:25-44`

- [ ] **Step 1: Add content wrapper ref**

Add a new ref after the existing refs (line 17):

```tsx
const contentWrapRef = useRef<HTMLDivElement>(null)
```

Wrap the typography div (the `<div className="relative z-10 flex h-full ...">`) with a new div:

```tsx
<div ref={contentWrapRef} className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
  style={{ opacity: 0, transform: "scale(0.96)", filter: "blur(4px)" }}
>
```

Remove the old `className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"` from the inner div — the wrapper now handles positioning.

- [ ] **Step 2: Add entrance animation at start of timeline**

Inside the GSAP context, add this as the first animation in the timeline (before the topLineRef animation):

```tsx
// Subtle entrance — continuity from aperture reveal
timeline.to(
  contentWrapRef.current,
  {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    duration: 0.04,
    ease: "power2.out",
  },
  0
)
```

- [ ] **Step 3: Browser verify entrance**

Scroll from LogoSkillsTransition into CinematicTransition:
- The transition should feel continuous — aperture opens, then cinematic text resolves from a slight blur/scale
- The entrance is very subtle, not a dramatic reveal
- It reads as continuity, not a separate entrance animation

- [ ] **Step 4: Commit**

```bash
git add app/src/components/home/CinematicTransition.tsx
git commit -m "feat: add subtle entrance animation to CinematicTransition for aperture continuity"
```

---

## Task 6: Initialize shadcn and Attempt React Bits Installs

**Files:**
- Create: `app/components.json`
- Create: Various component files (paths determined by install)

- [ ] **Step 1: Initialize shadcn in app directory**

```bash
cd app
npx shadcn@latest init -y
```

If it asks questions interactively, accept defaults. If it tries to overwrite `globals.css` or `tailwind.config.ts`, abort and configure `components.json` manually:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

- [ ] **Step 2: Attempt React Bits installs one at a time**

Run each install and record what happens. If any fail, note the error and move on:

```bash
cd app
npx shadcn@latest add @react-bits/BorderGlow-JS-CSS
npx shadcn@latest add @react-bits/CardNav-JS-CSS
npx shadcn@latest add @react-bits/CurvedLoop-JS-CSS
npx shadcn@latest add @react-bits/FluidGlass-JS-CSS
npx shadcn@latest add @react-bits/ScrollReveal-JS-CSS
```

After each successful install:
1. Note the generated file path
2. Read the generated file to understand the API (props, usage)
3. Record any peer dependencies needed

- [ ] **Step 3: Evaluate results**

For each component:
- If installed successfully: proceed to integration in later tasks
- If install failed or API is incompatible: mark for manual fallback implementation
- If the component looks generic or fights the aesthetic: mark for manual fallback

- [ ] **Step 4: Commit**

```bash
cd app
git add -A
git commit -m "chore: initialize shadcn and install React Bits components"
```

Note: If shadcn init created unexpected files, review them before committing. Do not commit changes to `globals.css` or `tailwind.config.ts` unless they are minimal and safe.

---

## Task 7: Integrate BorderGlow on Works Cards

**Files:**
- Modify: `app/src/components/home/WorksShowcase.tsx`
- Modify: `app/src/app/works/page.tsx`
- Modify: `app/src/app/works/[slug]/page.tsx`

This task uses the installed BorderGlow component if Task 6 succeeded, or implements a manual CSS fallback.

- [ ] **Step 1: Create BorderGlow wrapper (if manual fallback needed)**

If the React Bits install failed, create `app/src/components/ui/BorderGlow.tsx`:

```tsx
"use client"

import { useRef, useEffect } from "react"

interface BorderGlowProps {
  children: React.ReactNode
  glowColor?: string
  className?: string
  radius?: string
}

export function BorderGlow({
  children,
  glowColor = "rgba(255,255,255,0.15)",
  className = "",
  radius = "6px",
}: BorderGlowProps) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const handleMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      el.style.setProperty("--glow-x", `${x}px`)
      el.style.setProperty("--glow-y", `${y}px`)
    }

    el.addEventListener("pointermove", handleMove)
    return () => el.removeEventListener("pointermove", handleMove)
  }, [])

  return (
    <div
      ref={wrapRef}
      className={`relative group ${className}`}
      style={{ borderRadius: radius }}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          borderRadius: radius,
          background: `radial-gradient(300px circle at var(--glow-x, 50%) var(--glow-y, 50%), ${glowColor}, transparent 60%)`,
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "xor",
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Apply to WorksShowcase cards**

In `WorksShowcase.tsx`, import BorderGlow and wrap each card image. The spiral cards keep their current radius. Wrap the image inside each `<a>` card with BorderGlow, passing the work's `glow` color clamped toward white/gray:

```tsx
import { BorderGlow } from "@/components/ui/BorderGlow"

// Inside the card render, wrap the Image:
<BorderGlow glowColor={item.glow ?? "rgba(255,255,255,0.15)"} radius="18px">
  <Image ... />
</BorderGlow>
```

Note: If using the React Bits installed component, adjust import path and props to match its API.

- [ ] **Step 3: Apply to /works grid images**

In `app/src/app/works/page.tsx`, wrap each grid card image with BorderGlow using tighter radius:

```tsx
import { BorderGlow } from "@/components/ui/BorderGlow"

// Around the image container in each grid card:
<BorderGlow glowColor="rgba(255,255,255,0.12)" radius="6px">
  <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16 / 10" }}>
    <Image ... />
  </div>
</BorderGlow>
```

- [ ] **Step 4: Apply to /works/[slug] hero image**

In `app/src/app/works/[slug]/page.tsx`, wrap the hero image container (line 84–96):

```tsx
import { BorderGlow } from "@/components/ui/BorderGlow"

<BorderGlow glowColor="rgba(255,255,255,0.1)" radius="4px">
  <div className="relative w-full overflow-hidden rounded-sm" style={{ aspectRatio: "16 / 9" }}>
    <Image ... />
  </div>
</BorderGlow>
```

- [ ] **Step 5: Browser verify all three locations**

Check:
- Homepage spiral cards: glow follows cursor on hover, sits on edges
- `/works` grid: glow on hover, tighter radius, readable and clickable
- `/works/[slug]`: hero image has subtle edge glow

- [ ] **Step 6: Commit**

```bash
git add app/src/components/ui/BorderGlow.tsx app/src/components/home/WorksShowcase.tsx app/src/app/works/page.tsx "app/src/app/works/[slug]/page.tsx"
git commit -m "feat: add BorderGlow effect to works cards across homepage, grid, and detail pages"
```

---

## Task 8: Integrate CardNav into Navigation

**Files:**
- Modify: `app/src/components/Navigation.tsx`

- [ ] **Step 1: Evaluate CardNav component API**

If installed from React Bits, read the generated component file and understand:
- Props it accepts
- How it handles navigation items
- Whether it supports fixed/sticky positioning
- Whether it has responsive behavior

If the component conflicts with the fixed header, z-index, or scroll-style transitions, skip it and use the manual fallback in Step 2.

- [ ] **Step 2: Apply CardNav or manual card-hover effect**

**If using React Bits CardNav:** Replace the desktop nav link `<ul>` with CardNav, mapping the existing nav items as CardNav items. Preserve NavBrandMorph, language toggle, and all anchors.

**If manual fallback:** Add a card-hover effect to the existing desktop nav links in `Navigation.tsx`. Replace the plain `<li>` nav links with a hover-card treatment:

```tsx
// For each desktop nav link, add hover card effect:
<li key={key}>
  <a
    href={href}
    className="relative px-4 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-300 group"
  >
    <span className="relative z-10">{label}</span>
    <span className="absolute inset-0 rounded-md bg-white/[0.04] opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300" />
  </a>
</li>
```

- [ ] **Step 3: Preserve mobile menu**

Verify the mobile overlay menu still works unchanged. CardNav is desktop-only.

- [ ] **Step 4: Browser verify**

- Desktop: hover over nav links, see card effect
- NavBrandMorph logo still works
- Language toggle still works
- All anchors (#works, #practice, /about, #contact) still navigate correctly
- Mobile: hamburger menu still opens/closes

- [ ] **Step 5: Commit**

```bash
git add app/src/components/Navigation.tsx
git commit -m "feat: add card-hover effect to desktop navigation links"
```

---

## Task 9: Add FluidGlass to CinematicTransition

**Files:**
- Modify: `app/src/components/home/CinematicTransition.tsx`

- [ ] **Step 1: Evaluate FluidGlass component**

If installed from React Bits, read the component and determine:
- Does it wrap text nodes or render behind them?
- Can it coexist with GSAP animations on the same elements?
- Does it add its own motion or is it a static visual effect?

**Decision tree:**
- If FluidGlass can sit as a background/overlay layer → place it behind the text, keep GSAP animating text nodes directly
- If FluidGlass needs to own the text → refactor GSAP to drive FluidGlass props instead of DOM transforms
- If FluidGlass is incompatible or too flashy → use manual fallback

- [ ] **Step 2: Implement FluidGlass or manual fallback**

**If manual fallback:** Add a glass/refraction treatment behind the headline text using CSS:

```tsx
{/* Glass refraction layer behind typography */}
<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
  <div
    className="w-[80vw] max-w-[900px] h-[30vh] rounded-full opacity-[0.03]"
    style={{
      background: "radial-gradient(ellipse at center, rgba(255,255,255,0.12) 0%, transparent 70%)",
      filter: "blur(40px)",
    }}
  />
</div>
```

Add a subtle `backdrop-filter` to the text container to create dimensional feel:

```tsx
<div ref={contentWrapRef} className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
  style={{
    opacity: 0,
    transform: "scale(0.96)",
    filter: "blur(4px)",
    backdropFilter: "blur(1px) brightness(1.02)",
  }}
>
```

Note: The `backdropFilter` is very subtle — just enough to create a slight glass separation without fighting the GSAP blur animation.

- [ ] **Step 3: Browser verify**

- Headlines should feel slightly dimensional/glass-like
- GSAP scroll animation still works correctly (entrance, hold, dissolve)
- No visible liquid blobs or colorful effects
- Effect is subtle and editorial

- [ ] **Step 4: Commit**

```bash
git add app/src/components/home/CinematicTransition.tsx
git commit -m "feat: add glass refraction treatment to CinematicTransition headlines"
```

---

## Task 10: Add CurvedLoop to AboutSection Background

**Files:**
- Modify: `app/src/components/home/AboutSection.tsx`

- [ ] **Step 1: Evaluate CurvedLoop component or build fallback**

If installed from React Bits, read the component. It should be placed as a background layer.

**If manual fallback:** Create an SVG animated curved path:

```tsx
{/* Atmospheric curved loop — background layer */}
<div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.08]">
  <svg
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%]"
    viewBox="0 0 1000 600"
    fill="none"
  >
    <path
      d="M-50,300 Q250,100 500,300 T1050,300"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="0.5"
      fill="none"
    >
      <animate
        attributeName="d"
        values="M-50,300 Q250,100 500,300 T1050,300;M-50,300 Q250,500 500,300 T1050,300;M-50,300 Q250,100 500,300 T1050,300"
        dur="20s"
        repeatCount="indefinite"
      />
    </path>
    <path
      d="M-50,320 Q300,150 550,320 T1050,320"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="0.5"
      fill="none"
    >
      <animate
        attributeName="d"
        values="M-50,320 Q300,150 550,320 T1050,320;M-50,320 Q300,480 550,320 T1050,320;M-50,320 Q300,150 550,320 T1050,320"
        dur="25s"
        repeatCount="indefinite"
      />
    </path>
  </svg>
</div>
```

- [ ] **Step 2: Add to AboutSection**

Place the CurvedLoop/fallback as the first child inside the section element, before any content:

```tsx
<section ref={sectionRef} id="practice" className="relative ...">
  {/* CurvedLoop background layer */}
  {/* ... curved loop component or SVG here ... */}

  {/* Existing content below */}
  ...
</section>
```

- [ ] **Step 3: Browser verify**

- Subtle curved lines visible in background of Philosophy & Practice section
- Very low opacity — atmospheric, not distracting
- Text content remains fully readable
- Animation is slow and meditative (20–25s cycle)

- [ ] **Step 4: Commit**

```bash
git add app/src/components/home/AboutSection.tsx
git commit -m "feat: add atmospheric curved loop background to Philosophy & Practice section"
```

---

## Task 11: Extend WorkItem Data Model

**Files:**
- Modify: `app/src/data/portfolio.ts:1-10`

- [ ] **Step 1: Add optional fields to WorkItem interface**

```ts
export interface WorkItem {
  slug: string
  src: string
  title: string
  category: string
  tags: string[]
  date?: string
  type: "personal" | "school"
  description?: string
  role?: string
  tools?: string[]
  process?: string[]
  mood?: string[]
  notes?: string
}
```

- [ ] **Step 2: Populate 3–4 showcase items with sample data**

Add extended fields to a few items in `HOME_SHOWCASE_WORKS` and `ALL_WORKS`. Use real, plausible portfolio data. Example for one item:

```ts
{
  slug: "existing-slug",
  // ... existing fields ...
  role: "Environment Designer",
  tools: ["Photoshop", "Blender"],
  process: ["Reference gathering", "Thumbnail sketches", "Color keys", "Final render"],
  mood: ["Atmospheric", "Cinematic"],
  notes: "Focused on volumetric lighting and depth through layered fog planes.",
}
```

Leave items without extended data as-is — they continue to work with optional fields.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd app && npx tsc --noEmit
```

Expected: No errors. All existing code continues to work since new fields are optional.

- [ ] **Step 4: Commit**

```bash
git add app/src/data/portfolio.ts
git commit -m "feat: extend WorkItem with optional role, tools, process, mood, notes fields"
```

---

## Task 12: Redesign Works List Page

**Files:**
- Modify: `app/src/app/works/page.tsx`

- [ ] **Step 1: Upgrade filter bar with animated counts and active highlight**

Replace the category buttons with an upgraded treatment:

```tsx
{categories.map((cat) => {
  const count = getCategoryCount(cat.key)
  const isActive = activeFilter === cat.key
  return (
    <button
      key={cat.key}
      onClick={() => setActiveFilter(cat.key)}
      className={cn(
        "relative px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] font-mono transition-all duration-300",
        isActive
          ? "text-fg bg-white/[0.06] rounded-sm"
          : "text-fg-muted/50 hover:text-fg-muted"
      )}
    >
      {cat.label}
      <span className={cn(
        "ml-1.5 text-[9px] transition-opacity duration-300",
        isActive ? "text-fg-muted" : "text-fg-subtle/30"
      )}>
        [{count}]
      </span>
    </button>
  )
})}
```

- [ ] **Step 2: Add two-tier card hover behavior**

For each work card, add a conditional hover overlay:

```tsx
{/* Hover overlay — two tiers */}
<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
  {(w.role || w.tools?.length || w.mood?.length) ? (
    <>
      {w.role && (
        <p className="text-[10px] tracking-[0.15em] text-white/70 mb-1.5">{w.role}</p>
      )}
      <div className="flex flex-wrap gap-1">
        {w.tools?.map((tool) => (
          <span key={tool} className="text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 border border-white/10 rounded-sm text-white/50 font-mono">{tool}</span>
        ))}
        {w.mood?.map((m) => (
          <span key={m} className="text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5 bg-white/[0.06] rounded-sm text-white/40 font-mono">{m}</span>
        ))}
      </div>
    </>
  ) : (
    <>
      <p className="text-sm tracking-[0.02em] text-white/90 font-heading">{w.title}</p>
      <p className="text-[10px] tracking-[0.15em] text-white/50 mt-1">{w.category}</p>
    </>
  )}
</div>
```

- [ ] **Step 3: Browser verify**

- Filter buttons show count, active state has background highlight
- Hover on cards with metadata: shows role + tools + mood pills
- Hover on cards without metadata: shows title + category overlay
- No empty metadata panels
- All cards still clickable

- [ ] **Step 4: Commit**

```bash
git add app/src/app/works/page.tsx
git commit -m "feat: upgrade works page with active filter highlight and two-tier card hover"
```

---

## Task 13: Redesign Work Detail Page

**Files:**
- Modify: `app/src/app/works/[slug]/page.tsx`

- [ ] **Step 1: Add sticky side meta panel (desktop) + horizontal meta row (mobile)**

Restructure the content area (currently `<div ref={contentRef} className="mx-auto max-w-[860px]">`) into a two-column layout:

```tsx
<div ref={contentRef} className="mx-auto max-w-[1200px] px-6 lg:px-10">
  <div className="flex flex-col md:flex-row gap-10 md:gap-16">
    {/* Sticky side meta — desktop */}
    <aside className="hidden md:block md:w-48 lg:w-56 shrink-0">
      <div className="sticky top-28 space-y-6">
        {work.date && (
          <div>
            <p className="text-[9px] tracking-[0.25em] uppercase text-fg-subtle mb-1">Year</p>
            <p className="text-sm text-fg-muted font-mono">{work.date}</p>
          </div>
        )}
        <div>
          <p className="text-[9px] tracking-[0.25em] uppercase text-fg-subtle mb-1">Category</p>
          <p className="text-sm text-fg-muted">{work.category}</p>
        </div>
        {work.role && (
          <div>
            <p className="text-[9px] tracking-[0.25em] uppercase text-fg-subtle mb-1">Role</p>
            <p className="text-sm text-fg-muted">{work.role}</p>
          </div>
        )}
        {work.tools?.length && (
          <div>
            <p className="text-[9px] tracking-[0.25em] uppercase text-fg-subtle mb-1">Tools</p>
            <div className="flex flex-wrap gap-1.5">
              {work.tools.map((tool) => (
                <span key={tool} className="text-[9px] tracking-[0.1em] text-fg-muted/60 border border-white/[0.06] px-2 py-1 rounded-sm font-mono">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>

    {/* Mobile meta row */}
    <div className="md:hidden flex flex-wrap items-center gap-3 mb-4">
      {work.date && <span className="text-[10px] tracking-[0.2em] text-fg-subtle font-mono">{work.date}</span>}
      <span className="text-[10px] tracking-[0.25em] uppercase text-accent/70">{work.category}</span>
      {work.role && <span className="text-[10px] tracking-[0.15em] text-fg-muted">{work.role}</span>}
    </div>

    {/* Main content */}
    <div className="flex-1 min-w-0">
      {/* Title */}
      <h1 className="detail-line font-heading text-4xl md:text-5xl lg:text-6xl tracking-[0.04em] text-fg leading-[1.1] mb-6">
        {work.title}
      </h1>

      {/* Description */}
      {work.description && (
        <p className="detail-line text-base md:text-lg leading-[1.7] text-fg-muted max-w-[640px] mb-8">
          {work.description}
        </p>
      )}

      {/* Process timeline */}
      {work.process?.length && (
        <div className="detail-line mb-10">
          <p className="text-[9px] tracking-[0.25em] uppercase text-fg-subtle mb-4">Process</p>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {work.process.map((step, i) => (
              <div key={step} className="flex items-center shrink-0">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-white/20 border border-white/10" />
                  <p className="text-[9px] tracking-[0.1em] text-fg-muted/50 mt-2 font-mono whitespace-nowrap">{step}</p>
                </div>
                {i < (work.process?.length ?? 0) - 1 && (
                  <div className="w-12 h-px bg-white/[0.06] mx-2 mt-[-14px]" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mood & Notes */}
      {(work.mood?.length || work.notes) && (
        <div className="detail-line mb-10">
          {work.mood?.length && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {work.mood.map((m) => (
                <span key={m} className="text-[8px] tracking-[0.15em] uppercase px-2 py-1 bg-white/[0.04] rounded-sm text-fg-muted/50 font-mono">{m}</span>
              ))}
            </div>
          )}
          {work.notes && (
            <details className="group">
              <summary className="text-[10px] tracking-[0.2em] uppercase text-fg-subtle cursor-pointer hover:text-fg-muted transition-colors duration-300 select-none">
                Art Direction Notes
                <span className="ml-1 text-[8px] group-open:rotate-90 inline-block transition-transform duration-200">▶</span>
              </summary>
              <p className="mt-3 text-sm leading-[1.8] text-fg-muted/70 max-w-[560px]">{work.notes}</p>
            </details>
          )}
        </div>
      )}

      {/* Tags */}
      <div className="detail-line flex flex-wrap gap-2 mb-16">
        {work.tags.map((tag) => (
          <span key={tag} className="text-[9px] uppercase tracking-[0.2em] text-fg-muted/50 border border-white/[0.06] px-3 py-1.5 rounded-sm font-mono">
            {tag}
          </span>
        ))}
      </div>

      {/* Divider */}
      <div className="detail-line h-px bg-white/[0.06] mb-10" />

      {/* Related works */}
      {(() => {
        const related = ALL_WORKS.filter((w) => w.category === work.category && w.slug !== work.slug).slice(0, 4)
        if (!related.length) return null
        return (
          <div className="detail-line mb-12">
            <p className="text-[9px] tracking-[0.25em] uppercase text-fg-subtle mb-4">Related Works</p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {related.map((r) => (
                <Link key={r.slug} href={`/works/${r.slug}`} className="shrink-0 w-40 group">
                  <div className="relative w-full overflow-hidden rounded-sm" style={{ aspectRatio: "16/10" }}>
                    <Image src={r.src} alt={r.title} fill sizes="160px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <p className="mt-2 text-[10px] tracking-[0.02em] text-fg-muted/60 group-hover:text-fg-muted transition-colors duration-300 truncate">{r.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Prev / Next */}
      <nav className="detail-line flex items-center justify-between gap-6">
        {prevWork ? (
          <Link href={`/works/${prevWork.slug}`} className="group flex flex-col gap-1 max-w-[45%]">
            <span className="text-[9px] uppercase tracking-[0.25em] text-fg-subtle">Previous</span>
            <span className="text-sm tracking-[0.02em] text-fg-muted transition-colors duration-300 group-hover:text-fg truncate">{prevWork.title}</span>
          </Link>
        ) : <div />}
        {nextWork ? (
          <Link href={`/works/${nextWork.slug}`} className="group flex flex-col gap-1 items-end max-w-[45%]">
            <span className="text-[9px] uppercase tracking-[0.25em] text-fg-subtle">Next</span>
            <span className="text-sm tracking-[0.02em] text-fg-muted transition-colors duration-300 group-hover:text-fg truncate">{nextWork.title}</span>
          </Link>
        ) : <div />}
      </nav>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Remove old inline meta line**

Delete the old meta line (was inside the single-column `<div ref={contentRef}>`). The new layout handles date/category in the sticky panel and mobile meta row.

- [ ] **Step 3: Add imports**

Add `Image` and `ALL_WORKS` imports if not already present (they should be — verify).

- [ ] **Step 4: Browser verify**

Desktop:
- Sticky side panel visible on left with date, category, role, tools
- Main content on right with title, description, process timeline, mood/notes, tags
- Related works strip with thumbnails at bottom
- Side panel stays visible on scroll

Mobile:
- Horizontal meta row above title
- Process timeline scrolls horizontally
- Related works scroll horizontally
- Everything readable and functional

- [ ] **Step 5: Verify all slugs resolve**

```bash
cd app && npm run build
```

Confirm no build errors. All dynamic routes should still work.

- [ ] **Step 6: Commit**

```bash
git add "app/src/app/works/[slug]/page.tsx"
git commit -m "feat: redesign work detail page with sticky meta panel, process timeline, and related works"
```

---

## Task 14: Add ScrollReveal Where It Improves Flow

**Files:**
- Modify: Various files (works page, about section, resume, contact)

- [ ] **Step 1: Evaluate ScrollReveal component**

If installed from React Bits, check its API. If it uses IntersectionObserver internally, it should coexist with GSAP ScrollTrigger. If it conflicts, skip this task.

**If manual fallback or skip:** The existing GSAP `.ab-reveal` and `.detail-line` patterns already provide scroll-triggered reveals. Only apply ScrollReveal where it's simpler than the existing code.

- [ ] **Step 2: Apply to works page grid entrance (if not already using GSAP)**

If ScrollReveal is cleaner than the current GSAP `fromTo` on `.work-item` cards in `/works/page.tsx`, replace it. Otherwise keep existing code.

- [ ] **Step 3: Ensure no double animations**

Search each modified file for existing GSAP ScrollTrigger reveals. If both ScrollReveal and GSAP target the same elements, remove the GSAP version.

- [ ] **Step 4: Browser verify**

- Scroll through all pages
- Elements reveal smoothly on scroll
- No janky double-fire animations
- Motion is slow and subtle

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: apply ScrollReveal to information blocks where it simplifies existing reveals"
```

---

## Task 15: Final Verification Pass

**Files:** None (verification only)

- [ ] **Step 1: Lint**

```bash
cd app && npm run lint
```

Expected: No errors. Fix any lint issues.

- [ ] **Step 2: Type check**

```bash
cd app && npx tsc --noEmit
```

Expected: No errors. Fix any type issues.

- [ ] **Step 3: Build**

```bash
cd app && npm run build
```

Expected: Successful build. If `spawn EPERM` occurs in sandbox, verify outside sandbox.

- [ ] **Step 4: Browser checklist**

- [ ] Homepage loads at `/`
- [ ] Top nav anchors work (#works, #practice, /about, #contact)
- [ ] Hero particle field receives pointer movement and click
- [ ] LogoSkills particle explosion takes multiple wheel ticks
- [ ] Hold phase clearly visible before explosion starts
- [ ] Next section does NOT appear during mid-explosion
- [ ] Aperture reveals CinematicTransition from center
- [ ] CinematicTransition headlines have glass treatment
- [ ] Works cards have visible edge glow on hover
- [ ] `/works` filter interactions work
- [ ] `/works` card hover shows metadata or title/category
- [ ] `/works/[slug]` pages resolve for all slugs
- [ ] `/works/[slug]` has sticky meta panel on desktop
- [ ] `/works/[slug]` has related works strip
- [ ] Philosophy & Practice has atmospheric background
- [ ] `prefers-reduced-motion` doesn't break pinned sections
- [ ] No purple gradients or warm tones anywhere

- [ ] **Step 5: Final commit if any fixes were made**

```bash
git add -A
git commit -m "fix: address issues found during final verification"
```
