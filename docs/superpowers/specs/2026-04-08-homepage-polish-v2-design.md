# Homepage Polish v2 — Design Spec

**Date**: 2026-04-08
**Branch**: `cleanup-pass`
**Status**: Approved design, ready for implementation

---

## Summary

7 enhancements across the homepage scroll experience to eliminate dead zones, add visible interactivity, and bring a premium editorial feel. All effects monochrome (black/white only), visible but restrained.

**Key principle**: Use vanilla CSS/JS for effects where React component abstractions have failed previously. Only use React components (CurvedLoop, ScrollReveal) where they work cleanly. No Three.js/R3F dependencies for these enhancements.

---

## 1. Navigation Polish + Scroll Spy

### Nav Polish
- Add animated underline on hover to desktop nav links — a `::after` pseudo-element that scales from `scaleX(0)` to `scaleX(1)` on hover, white, 1px height
- On scroll (when `scrolled` state is true), add a subtle frosted glass look: increase `backdrop-blur` and add a faint `border-bottom` glow

### Scroll Spy
- New component: `ScrollSpy.tsx` — a fixed vertical dot indicator on the right side of the viewport
- Shows dots for each main section: Hero, Works, Skills, Cinematic, About, Resume, Contact
- Active section highlighted (larger dot, brighter)
- Clicking a dot smooth-scrolls to that section
- Uses `IntersectionObserver` to track which section is in view
- Positioned `right: 24px`, vertically centered, `z-index: 85`
- Dots: 6px circles, `border: 1px solid white/20`, active dot: 8px, `bg-white`, with a subtle glow `box-shadow`
- Hidden on mobile (below `md` breakpoint)

**Files**: `Navigation.tsx` (edit), new `ScrollSpy.tsx`

---

## 2. Mouse-Tracking Edge Glow on Works Cards

A CSS + vanilla JS effect. No React Bits BorderGlow.

### Implementation
- Create a reusable CSS class `.card-glow` and a small JS utility hook `useCardGlow`
- On `pointermove`, capture mouse position relative to the card
- Set CSS custom properties `--glow-x` and `--glow-y` on the card element
- A `::before` pseudo-element on the card renders a `radial-gradient` at `var(--glow-x) var(--glow-y)` — soft white glow, ~180px radius, opacity 0.15
- On `pointerleave`, fade the glow out (transition opacity to 0)
- The glow sits behind card content but above the card background

### Where to apply
- `WorksShowcase.tsx` — spiral cards on homepage
- `works/page.tsx` — grid cards on works page
- `works/[slug]/page.tsx` — hero image on detail page

**Files**: New `useCardGlow.ts` hook, edit 3 files above, CSS in `globals.css`

---

## 3. CSS Frosted Glass on Cinematic Text

Replace the plain black background behind "BETWEEN IMAGINATION AND REALITY, I BUILD WORLDS." with a frosted glass panel.

### Implementation
- Behind the text content, add a `div.glass-panel` — centered, ~80vw wide, ~40vh tall
- CSS: `background: rgba(255,255,255,0.03)`, `backdrop-filter: blur(24px) saturate(120%)`, `border: 1px solid rgba(255,255,255,0.06)`, `border-radius: 24px`
- Animated gradient border using a rotating `conic-gradient` mask on a `::before` pseudo-element — very subtle white shimmer that rotates slowly (20s loop)
- The glass panel fades in with the text (tied to the existing GSAP timeline at ~0.06) and dissolves out with the text
- Add a faint inner radial glow: `box-shadow: inset 0 0 120px rgba(255,255,255,0.04)`

### Aesthetic
- Must remain monochrome — white glass on near-black
- The effect should be visible but not dominate — the text is hero
- No colored gradients, no purple, no warm tones

**Files**: `CinematicTransition.tsx` (edit), CSS in `globals.css`

---

## 4. Particle Dissolve Transition (Cinematic → About)

Eliminates the dead black gap between CinematicTransition and AboutSection.

### Implementation
- New component: `ParticleDissolve.tsx` — placed between `<CinematicTransition />` and `<AboutSection />` in `HomeExperience.tsx`
- Uses a `<canvas>` element, full viewport, with vanilla JS (no Three.js)
- On scroll into view (ScrollTrigger), the black screen breaks apart into small white particles/noise dots that scatter outward and fade, revealing the AboutSection behind
- Canvas draws ~800 small white dots. As scroll progresses (0→1):
  - 0.0–0.3: dots appear, static noise pattern on black
  - 0.3–0.7: dots scatter outward from center, gaps form, About bg shows through
  - 0.7–1.0: remaining dots fade out, canvas becomes transparent
- `background: transparent` on the canvas so AboutSection shows through the gaps
- Pin distance: `+=1200` — short, punchy transition
- The component has `position: relative` with z-index between Cinematic and About

### Aesthetic
- White dots only, no color
- Particles should feel like dust/noise dissolving, not a fireworks show
- Restrained — 800 particles max, small size (1-3px)

**Files**: New `ParticleDissolve.tsx`, edit `HomeExperience.tsx`

---

## 5. CurvedLoop Marquee in About Section

Replace the static SVG curves with the React Bits `CurvedLoop` component (already installed at `components/CurvedLoop.jsx`).

### Implementation
- Remove the current `<svg>` animated curves from `AboutSection.tsx`
- Add two `CurvedLoop` instances stacked vertically, low opacity
- Top loop: `marqueeText="WORLDBUILDING · ENVIRONMENT DESIGN · VISUAL DEVELOPMENT · NARRATIVE · ATMOSPHERE · "`, `speed={1.5}`, `direction="left"`
- Bottom loop: same text, `speed={1}`, `direction="right"`, offset vertically
- Container: `opacity: 0.12`, `pointer-events: none` (disable drag interaction — it would conflict with page scroll)
- Font: inherit from site (Cormorant Garamond or the mono font), `fill: white`, small size via className

### Fallback
- If CurvedLoop causes layout issues (it uses a fixed `viewBox="0 0 1440 120"`), fall back to CSS `@keyframes` marquee with the same text on a curved SVG `textPath`

**Files**: `AboutSection.tsx` (edit), import `CurvedLoop`

---

## 6. ScrollReveal on Headings + Key Text

Use the React Bits `ScrollReveal` component (already installed at `components/ScrollReveal.jsx`) for word-by-word reveal.

### Where to apply
- **AboutSection**: Statement heading ("I craft worlds...") — already has ScrollReveal, keep it
- **AboutSection**: Both body paragraphs — wrap each in ScrollReveal with lighter settings (`baseOpacity={0.15}`, `baseRotation={1}`, `blurStrength={2}`)
- **ResumeSection**: Section heading ("Experience & Skills") — wrap in ScrollReveal
- **ContactSection**: Heading ("Let's Connect") + description paragraph — wrap in ScrollReveal

### Settings
- Headings: `baseOpacity={0.08}`, `baseRotation={2}`, `blurStrength={3}`, `enableBlur={true}`
- Body text: `baseOpacity={0.15}`, `baseRotation={1}`, `blurStrength={2}`, `enableBlur={true}`
- All use `scrollContainerRef={null}` (window scroll)

**Files**: `AboutSection.tsx`, `ResumeSection.tsx`, `ContactSection.tsx` (edit)

---

## 7. Overall Polish & Consistency

### Section transitions
- Every section should have a soft gradient edge at top: `linear-gradient(180deg, transparent, section-bg 80px)` — using the existing `.section-edge-top` class, ensure it's applied consistently to About, Resume, Contact

### Z-index stacking (already fixed)
- Hero → Works(50) → LogoSkills(55) → Cinematic(60) → ParticleDissolve(62) → About(65) → Resume(70) → Contact(75) → Nav(90)

### Remove dead code
- Delete `BorderGlow.jsx` and `BorderGlow.css` — no longer used anywhere
- Clean up any unused imports from the shadcn install that aren't used

---

## Technical Constraints

- **No Three.js/R3F** for any of these enhancements (FluidGlass stays unused)
- **Vanilla CSS/JS** preferred for visual effects (glow, glass, particles) — more reliable than React component wrappers
- **GSAP + ScrollTrigger** for scroll-linked animations (already in use)
- **React components** only where they work: CurvedLoop (clean SVG), ScrollReveal (GSAP wrapper)
- **Test in browser after each change** — do not batch visual changes without verification
- **Monochrome only** — black, white, gray. No warm tones, no purple, no colored gradients

## Files Changed (Summary)

| File | Action |
|------|--------|
| `Navigation.tsx` | Add hover underline animation, glass bg polish |
| `ScrollSpy.tsx` | **New** — vertical scroll spy dots |
| `useCardGlow.ts` | **New** — mouse-tracking glow hook |
| `globals.css` | Add `.card-glow`, `.glass-panel` styles |
| `WorksShowcase.tsx` | Apply card glow |
| `works/page.tsx` | Apply card glow |
| `works/[slug]/page.tsx` | Apply card glow |
| `CinematicTransition.tsx` | Add glass panel behind text |
| `ParticleDissolve.tsx` | **New** — canvas particle transition |
| `HomeExperience.tsx` | Add ParticleDissolve + ScrollSpy |
| `AboutSection.tsx` | CurvedLoop bg + ScrollReveal on body text |
| `ResumeSection.tsx` | ScrollReveal on heading |
| `ContactSection.tsx` | ScrollReveal on heading + description |
| `BorderGlow.jsx/css` | **Delete** — unused |
