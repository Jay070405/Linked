# Hero Particle System & Cinematic Scroll Bridge — Design Spec

**Date**: 2026-04-04
**Status**: Approved

---

## Overview

Redesign the portfolio hero into a premium interactive identity system built on p5.js. The hero features a state-based particle system that toggles between a JL logo formation and an abstract galaxy/flow field, driven by click interaction. A scroll-driven cinematic bridge transitions the particle field into the Works section. The nav logo is rebuilt as a pure typographic morph animation.

This should feel like an art-directed interactive experience, not a template site.

---

## 1. Particle System (p5.js)

### Canvas Setup
- Single p5.js instance in **instance mode** (`new p5(sketch, container)`)
- Full-viewport canvas, `position: fixed`, behind hero content via z-index
- Canvas DPR capped at 2, resize debounced at 150ms

### Particle Count & Feel
- **800–1200 particles** (tuned for negative space and calm, premium feel)
- Each particle stores: `logoX, logoY, galaxyX, galaxyY, x, y, vx, vy, size, alpha, phase`

### Two States

| | Logo State | Galaxy State |
|---|---|---|
| Target positions | Sampled from `/image/logo.png` via existing `sampleImagePoints` | Procedural abstract flow field (NOT a literal spiral) |
| Particle behavior | Tight formation, minimal drift | Spread across viewport, slow organic drift |
| Mouse influence | Gentle parallax on whole field | Parallax + barely-noticeable local flow |

### Galaxy Layout
- Abstract flow field — soft, organic distribution across the viewport
- NOT a readable spiral or galaxy shape; should feel like a subtle atmospheric scatter
- Slight clustering variation for visual interest, but no obvious pattern
- Each particle gets a random offset so nothing looks mechanical

### State Toggle (Click)
- Click toggles `targetState` between `"logo"` and `"galaxy"`
- Page loads in `"logo"` state
- Transitions are spring-based, not linear lerp

### Spring Physics

```
force = (target - current) * stiffness
velocity += force
velocity *= damping
position += velocity
```

- **Logo → Galaxy stiffness**: `0.018`
- **Galaxy → Logo stiffness**: `0.022` (slightly tighter reassembly, but not noticeably snappy)
- **Damping**: `0.88`

Values are starting points — will be tuned visually.

### Transition Stagger
- Each particle's transition is delayed based on distance from center
- Logo → Galaxy: center particles move first (radial expansion wave)
- Galaxy → Logo: edge particles move first (radial contraction wave)
- Creates an organic radial wave, not a uniform morph

### Click Impulse
- Extremely subtle radial velocity nudge on the click frame
- Limited to particles near the click point (local, not global)
- Nearly imperceptible — just enough to make the transition feel physical
- No shockwave or dramatic effect

### Idle Motion (Both States)
- Perlin noise offset per particle via `p5.noise()`
- **Logo state amplitude**: ~1px (stable, clean, controlled)
- **Galaxy state amplitude**: ~2.5px (calm and atmospheric, not floaty)
- Slow phase drift for gentle breathing

### Mouse Interaction
- **Primary**: Gentle parallax across the entire particle field based on cursor position relative to viewport center
- **Secondary**: Barely-noticeable flow response near cursor (very minimal, almost imperceptible)
- Should feel like a depth shift, not an interactive/reactive system

---

## 2. Scroll-Driven Cinematic Bridge (Hero to Works)

### ScrollTrigger Setup
- Trigger: hero section
- Start: `"top top"`, End: `"bottom top"`
- Scrub: `1`
- Outputs `bridgeProgress` (0–1) into the p5 sketch

### Scroll does NOT toggle particle states
- `bridgeProgress` is independent of the click-driven `targetState`
- The bridge works identically whether the field is in logo or galaxy state

### Bridge Phases

| Progress | Effect |
|---|---|
| **0.0–0.3** | Hero text/CTAs fade out (opacity, blur, upward shift). Particle field begins **very subtle** dimming and slow drift — space already starts transitioning with the text. Not static. |
| **0.3–0.7** | Particle field stretches via a **soft directional flow/pull** (not purely vertical). Slight curvature or field-based motion so it feels natural and premium, not like particles falling. Outer particles begin alpha fade. |
| **0.7–1.0** | **Directional dissolve with spatial hierarchy** — particles fade based on depth/position (e.g., top-to-bottom or center-outward), not uniformly. Feels like the field is being absorbed into the Works section. Works content fades in underneath. |

### Stretch Behavior
- Not a CSS transform — each particle's position gets an additive offset based on `bridgeProgress` and its position in the field
- Lower particles stretch more, creating a gravitational pull feel
- Slight horizontal curvature added so the flow feels organic, not mechanical

---

## 3. Nav Logo — Typographic Morph (NavBrandMorph)

### Replaces BrandMorphMark (particle-based) with pure DOM/GSAP

### Structure
- Container with individually wrapped `<span>` characters: `J`, `a`, `y`, ` `, `L`, `i`, `n`
- Each character independently animatable
- JL monogram as inline SVG, positioned to align precisely with the J and L character positions

### Morph Sequence (driven by `brandMorphProgress` 0–1)

**Timing curve**: Slow build at start, quicker collapse in middle, gentle settle at end.

| Progress | Visual |
|---|---|
| **0.0** | "Jay Lin" — full wordmark, Cormorant Garamond, clean |
| **0.0–0.35** | Letters `a`, `y`, `i`, `n` begin fading (opacity + subtle blur). Letter-spacing tightens. Slow, barely perceptible at first. No scale changes. |
| **0.35–0.6** | Secondary letters nearly invisible. `J` and `L` remain at full opacity. Space between them closes as surrounding letters collapse out. Quicker pace. |
| **0.6–0.85** | `J` and `L` reposition to match the JL monogram layout. The letterforms seamlessly resolve into the final mark — NOT a crossfade swap. The SVG monogram fades in at exact alignment while text J/L fade out simultaneously, creating the illusion of a single continuous transformation. |
| **0.85–1.0** | Subtle finishing motion — gentle tracking ease and soft opacity settle (0.95 → 1.0). "Locked in" feeling. |

### Key Constraints
- No particles, no canvas — pure DOM + CSS transforms + GSAP
- No scale-down on secondary letters (opacity + blur + spacing only)
- The J/L to monogram transition must feel seamless, not like a swap
- Editorial / luxury brand motion — not a UI transition

---

## 4. File Architecture

### New Files

| File | Role |
|---|---|
| `components/home/P5ParticleHero.tsx` | React wrapper mounting p5 sketch. Receives `bridgeProgress`, `targetState`, mouse position. Manages lifecycle. |
| `components/home/p5HeroSketch.ts` | Pure p5 sketch function (no React). All particle logic, spring physics, state machine, rendering. Factory function accepting config/callbacks. |
| `components/home/galaxyLayout.ts` | Generates abstract flow-field positions for galaxy state. Separated for independent tuning. |
| `components/home/NavBrandMorph.tsx` | Replaces BrandMorphMark. Pure DOM/GSAP typographic morph. |

### Modified Files

| File | Changes |
|---|---|
| `HeroScene.tsx` | Swap InteractiveParticleLogo for P5ParticleHero. Add click toggle state. Keep ScrollTrigger but output to new component. |
| `HomeExperience.tsx` | Wire click toggle state and pass to hero. |
| `Navigation.tsx` | Swap BrandMorphMark for NavBrandMorph. |

### Removed Files
- `InteractiveParticleLogo.tsx` — replaced by P5ParticleHero
- `BrandMorphMark.tsx` — replaced by NavBrandMorph
- `GlassJLLogo3D.tsx` — unused R3F component (confirm before removing)

### Dependencies
- **Add**: `p5`, `@types/p5`
- Three.js / R3F remain if used elsewhere; hero no longer depends on them

---

## 5. p5 Mounting Strategy

- **Instance mode**: `new p5(sketch, containerElement)`
- Scoped to container, compatible with React strict mode and hot reload
- Sketch function receives a config object on creation
- Exposes methods via a returned API object: `setState()`, `setBridgeProgress()`, `setMouse()`
- React wrapper calls these via ref — no re-renders trigger sketch rebuilds
- Tab visibility: particle updates skip when `document.hidden` is true

---

## 6. Performance Budget

- 800–1200 particles on Canvas 2D (p5 default renderer)
- Target: 60fps on modern hardware, graceful degradation on low-end
- `prefers-reduced-motion`: skip all animation, show static JL text fallback
- p5 library cost: ~100KB minified (~35KB gzipped)
- No WebGL, no shaders — Canvas 2D is sufficient for this particle count

---

## 7. Art Direction Summary

- **Monochrome**: black background, white/near-white particles (`rgba(240,240,240,...)`)
- **Restrained**: more negative space than density, calm not active
- **Premium**: every motion should feel intentional, not decorative
- **No sci-fi or tech-demo aesthetics**: abstract, atmospheric, editorial
- **Consistent with existing design language**: Cormorant Garamond headings, black/white palette, no warm tones
