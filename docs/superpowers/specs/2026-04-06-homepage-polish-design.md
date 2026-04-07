# Homepage Interaction Polish — Design Spec

**Date**: 2026-04-06
**Branch**: `cleanup-pass`
**Status**: Approved, ready for implementation planning
**Based on**: `logo-particle-interaction-handoff.md`

---

## Overview

Polish the portfolio homepage interaction flow on the current Next.js implementation. Four priorities, executed in order. No rollbacks, no reintroduction of deleted systems.

**Aesthetic direction:** Black/white, cinematic, editorial, premium, restrained. No purple gradients, no warm tones, no generic AI landing page feel.

---

## Priority 1 — Fix Logo Particle Timing

### Problem

The particle explosion in `LogoSkillsTransition` completes in a single mouse-wheel tick. Users cannot see the logo break apart.

### Files

- `app/src/components/home/LogoSkillsTransition.tsx`
- `app/src/components/home/p5LogoSkillsSketch.ts`

### ScrollTrigger Changes (LogoSkillsTransition.tsx)

- Extend pinned scroll distance: `end: "+=2600"` → `end: "+=4800"`
- Increase scrub smoothing: `scrub: 1.8` → `scrub: 2.4`

### Timeline Restructure (normalized 0→1)

| Phase | Range | Action |
|-------|-------|--------|
| Form | 0.00–0.15 | Canvas fades in, particles settle into logo shape |
| Text reveal | 0.15–0.40 | "SKILLS" typewriter + subtitle + Chinese text |
| Hold | 0.40–0.58 | Everything visible, calm breathing. No exit. |
| Text exit | 0.58–0.72 | Text fades out, subtitles disappear |
| Explosion | 0.64–0.92 | Particles burst outward slowly (overlaps text exit) |
| Fade out | 0.88–1.00 | Overlay + aperture handoff to next section |

### p5LogoSkillsSketch.ts Explosion Rework

Replace hardcoded explosion phase:

```ts
// Before
const isExploding = scrollProgress > 0.6
const explosionT = isExploding ? (scrollProgress - 0.6) / 0.4 : 0

// After
const EXPLODE_START = 0.64
const EXPLODE_END = 0.92
const explosionT = clamp((scrollProgress - EXPLODE_START) / (EXPLODE_END - EXPLODE_START), 0, 1)
```

- `burstDist`: Start at `180` as tuning baseline (was `250`), use cubic easing (`explosionT³`) for slower ramp-up
- Extend drift range so particles travel further before fading
- Fade bias stretches over the wider range

### Acceptance

- Multiple wheel ticks needed to complete the explosion
- User clearly sees logo break apart before anything else appears
- Reduced-motion fallback still works

---

## Priority 2 — Section Handoff (Combined Aperture + Particles)

### Problem

The next section appears before the particle flow completes. The transition lacks a cinematic release.

### Files

- `app/src/components/home/LogoSkillsTransition.tsx`
- `app/src/components/home/CinematicTransition.tsx`

### End of LogoSkillsTransition (0.88–1.00)

- **Overlay** (`zoomOverlayRef`): Push start from `0.78` to `0.90`. Role: darkens and compresses the frame.
- **Aperture** (`centerPopRef`): New div. A CSS radial-gradient **mask** that starts fully closed (black) and opens outward from center over `0.90–0.98`. This is a reveal mask, not an additive layer.
  - Opening curve: gentle at first, accelerates slightly near the end (custom ease or `power2.in`)
  - Implementation: `mask-image: radial-gradient(circle, transparent <dynamic>%, black <dynamic>%)`
  - The mask radius animates from 0% to beyond viewport via GSAP
- **Overlay and aperture have distinct roles:** overlay compresses, aperture releases.

### Start of CinematicTransition

- Content begins at `scale: 0.96`, `blur: 4px`, `opacity: 0` and resolves to normal over the first 4% of its own timeline (0.00–0.04)
- Very subtle — reads as continuity, not a separate entrance animation

### Visual Sequence

1. Logo holds → text fades → particles start exploding slowly
2. Particles scatter outward, aperture mask begins opening from center
3. Through the aperture, CinematicTransition content emerges with slight scale/blur resolve
4. Full transition to cinematic text

### Constraints

- No bright flash or glow — dark and cinematic
- Aperture is CSS radial-gradient mask, no extra canvas
- Overlay and aperture layer together at tail end but serve distinct purposes

### Acceptance

- Viewer sees complete sequence: hold → explosion → aperture reveal → next section
- No content visible during mid-explosion
- Transition feels like a single cinematic beat

---

## Priority 3 — React Bits Integration

### Strategy

Registry-first, manual fallback. Install one component at a time via `npx shadcn@latest add`. If install fails, API is incompatible, or result looks generic — manually build equivalent with GSAP + CSS.

### 3a. shadcn Initialization

- Run `npx shadcn@latest init` in `app/` with minimal config
- Use existing Tailwind + Next setup
- If it wants to overwrite `globals.css` or `tailwind.config.ts`, decline and configure manually

### 3b. BorderGlow → Works Cards

- **Apply to:** `WorksShowcase.tsx` cards, `/works` grid images, `/works/[slug]` hero image
- Glow color: use work's `glow` value, clamp toward white/gray if too saturated
- Glow sits on card edges, never covers artwork
- Card radius stays at current values
- **Fallback:** CSS `box-shadow` animation + pseudo-element edge glow

### 3c. CardNav → Navigation

- Replace desktop nav link row with CardNav
- **Preserve:** NavBrandMorph logo, language toggle, all anchors (`#works`, `#practice`, `/about`, `#contact`)
- Mobile keeps current overlay menu
- **Fallback:** Manually add hover card effects to existing nav links

### 3d. FluidGlass → CinematicTransition

- Apply to headline text: "BETWEEN IMAGINATION AND REALITY," and "I BUILD WORLDS."
- Makes typography feel dimensional/glass-like, not liquid blobs
- Keeps existing GSAP pinned timing
- **Fallback:** CSS `backdrop-filter`, subtle refraction distortion, layered transparency

### 3e. CurvedLoop → AboutSection Background

- Absolute-positioned behind Philosophy & Practice content
- Low opacity (0.08–0.15) — atmospheric, not distracting
- Must not reduce text readability
- **Fallback:** CSS/SVG animated curved path at low opacity

### 3f. ScrollReveal → Information Blocks

- Apply to: Works page filter/grid intro, work detail metadata, About/Resume/Contact blocks
- Replace existing manual GSAP reveals only where simpler — no double animations
- Slow, subtle motion
- **Fallback:** Keep existing GSAP reveals

---

## Priority 4 — Works Information Redesign

### 4a. Data Model Extension (portfolio.ts)

Add optional fields to `WorkItem`:

```ts
role?: string          // "Concept Artist", "Environment Designer"
tools?: string[]       // ["Photoshop", "Blender", "ZBrush"]
process?: string[]     // ["Thumbnail sketches", "Color keys", "Final render"]
mood?: string[]        // ["Atmospheric", "Cinematic", "Melancholic"]
notes?: string         // Art direction or worldbuilding notes
```

All optional. Existing items without fields work unchanged. Populate a few showcase items to demonstrate the pattern.

### 4b. Works List Page (`/works`)

- **Filter bar:** Animated count transitions, active category gets subtle highlight
- **Card hover:** Metadata panel slides from bottom showing role + tools + mood as compact pills
- **Grid entrance:** ScrollReveal stagger on cards (or existing GSAP if ScrollReveal doesn't integrate)

### 4c. Work Detail Page (`/works/[slug]`)

**Desktop layout — two columns:**

- **Left: Sticky side meta panel** — date, category, role, tools list. Stays visible on scroll.
- **Right: Main content column:**
  - Hero image (full-width, BorderGlow)
  - Title + description
  - Process section: horizontal stepped timeline (if `process` data exists)
  - Mood & Notes: expandable "Art Direction Notes" block, mood tags as pills
  - Tags as pills
  - Related works strip: 3–4 thumbnails from same category, BorderGlow, horizontally scrollable on mobile
  - Prev/Next navigation

**Mobile:** Sticky panel collapses to horizontal meta row above content.

### Constraints

- Black/white editorial aesthetic throughout
- No fake biography or production claims — neutral portfolio language for missing data
- Sections without data simply don't render

### Acceptance

- `/works` feels like an interactive gallery, not a static grid
- `/works/[slug]` gives viewer more context and interaction
- All current links still work
- Image loading stays reasonable

---

## Implementation Order

1. Fix `LogoSkillsTransition` timing (Priority 1)
2. Tune `p5LogoSkillsSketch` explosion phase
3. Add aperture handoff + CinematicTransition entrance (Priority 2)
4. Initialize shadcn, install React Bits one at a time (Priority 3)
5. Integrate BorderGlow into Works images
6. Integrate CardNav into Navigation
7. Add FluidGlass to CinematicTransition
8. Add CurvedLoop to AboutSection
9. Extend data model + redesign `/works` and `/works/[slug]` (Priority 4)
10. Add ScrollReveal where it improves flow
11. Verification pass

## Verification

```bash
cd app
npm run lint
npx tsc --noEmit
npm run build
```

Browser checks:
- Homepage loads at `/`
- Nav anchors work
- Hero particles receive pointer/click
- LogoSkills explosion visible across multiple wheel ticks
- Next section doesn't appear during mid-explosion
- Aperture reveals CinematicTransition cinematically
- Works cards have edge glow, remain readable and clickable
- `/works` filter works
- `/works/[slug]` pages resolve for all slugs
- `prefers-reduced-motion` doesn't break pinned sections

## Non-Goals

- No rollbacks or restoring deleted files
- No replacing Next.js app with old prototypes
- No removing NavBrandMorph unless CardNav absolutely requires it
- No decorative effects that fight the artwork
- No generic AI landing page aesthetics
