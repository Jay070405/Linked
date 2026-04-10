# Homepage Polish — Fix Handoff

**Date**: 2026-04-07
**Branch**: `cleanup-pass`
**Status**: Previous implementation round FAILED — needs complete rework
**Audience**: Next AI / engineer continuing this work

---

## What Happened

The previous session attempted to implement the spec in `2026-04-06-homepage-polish-design.md`. **None of the changes work correctly in the browser.** The implementation was done by subagents that committed code without visual verification. Every priority has problems.

---

## Current Broken State (with screenshots)

### Issue 1: BorderGlow breaks WorksShowcase cards

**Screenshot**: `Screenshot 2026-04-07 123901.png`

The React Bits `BorderGlow` component wraps each card image with a visible gray/transparent card container. Instead of a subtle edge glow, it adds ugly semi-transparent borders and background panels around the art. The cards now look like broken UI components instead of a clean gallery.

**Root cause**: `BorderGlow.jsx` has its own `.border-glow-card` CSS with a `--card-bg` background color, gradient fills, and an `.edge-light` pseudo-element. The component was designed for dark card UIs, not transparent image overlays. Wrapping existing images with it creates a visible card shell over the artwork.

**Files involved**:
- `app/src/components/home/WorksShowcase.tsx` — BorderGlow wrapping card images
- `app/src/app/works/page.tsx` — BorderGlow on grid
- `app/src/app/works/[slug]/page.tsx` — BorderGlow on hero

**Fix direction**: Remove `BorderGlow` wrapper from all three files. If edge glow is still wanted, build a much simpler CSS-only effect: a `::after` pseudo-element with `box-shadow` or a pointer-tracking `radial-gradient` at low opacity. Do NOT use the React Bits component — it is too opinionated for this use case.

---

### Issue 2: WorksShowcase cards bleed into LogoSkillsTransition

**Screenshot**: `Screenshot 2026-04-07 123937.png`

The JL particle logo is visible, but works cards from `WorksShowcase` are showing through behind/below it. The spiral cards are overlapping with the pinned LogoSkillsTransition section. Z-indexing between sections is broken.

**Root cause**: `WorksShowcase` uses `position: sticky` inside a 520vh container. `LogoSkillsTransition` uses `pin: true` from GSAP ScrollTrigger. When these two scroll behaviors interact, the sticky cards can remain visible behind the pinned section if z-indices don't properly stack. The LogoSkillsTransition section has `zIndex: 15` inline, but WorksShowcase cards may have higher computed z-index from their 3D transforms.

**Files involved**:
- `app/src/components/home/WorksShowcase.tsx` — sticky viewport + 3D transforms
- `app/src/components/home/LogoSkillsTransition.tsx` — pinned section at z-15

**Fix direction**: Ensure LogoSkillsTransition has higher z-index than WorksShowcase (try z-25 or z-30). Also check if WorksShowcase needs `overflow: hidden` on its container or if its sticky element needs to be clipped when scrolled past. The key rule: once the user scrolls into LogoSkillsTransition, nothing from WorksShowcase should be visible.

---

### Issue 3: Massive black screen after WorksShowcase

**Screenshot**: `Screenshot 2026-04-07 124042.png`

After the works carousel, there is a huge empty black screen with only a single white dot (one particle). This lasts for many scroll ticks before anything else appears.

**Root cause**: LogoSkillsTransition pin distance was extended to `+=4800` (from 2600). Combined with scrub 2.4, this creates an enormous pinned black region. The section starts with `visibility: hidden` and only becomes visible `onEnter`. The canvas fade-in occupies 0–15% of 4800px = 720px of scroll before anything is even visible. Plus the "hold" phase (40–58%) = 864px of scroll where nothing changes. The timeline phases are spread too thin over a huge scroll distance.

**Fix direction**: Reduce pin distance back toward 3200–3600px (not the original 2600 either — find a middle ground). The timeline phases need to be denser. The hold phase is too long — 40% to 58% = 18% of 3600px = 648px of no-change scrolling, which still might be too much. Try:
- Pin: `+=3400`
- Scrub: `2.0`
- Compress hold to 0.42–0.52 (10% instead of 18%)
- The explosion should start earlier and run longer in absolute pixels

Also: the `visibility: hidden` on `sectionRef` at init (line 34) with `onEnter` toggling it visible is problematic. If the section is pinned and the user scrolls to it, there can be a frame where it's hidden. Consider using opacity instead of visibility, or remove the visibility toggle entirely and rely on the canvas opacity animation.

---

### Issue 4: Black screen after CinematicTransition

**Screenshot**: `Screenshot 2026-04-07 124118.png`

After the big text ("BETWEEN IMAGINATION AND REALITY, I BUILD WORLDS.") dissolves, there is another massive black screen before AboutSection appears.

**Root cause**: The aperture mask and the overlay are both creating a fully opaque black layer at the end of LogoSkillsTransition AND CinematicTransition. The `zoomOverlayRef` reaches `opacity: 1` at timeline position 0.90, and the aperture mask starts at 0.90 too. These are layered on top of each other creating double-black. After CinematicTransition dissolves its text, the section ends but the next section (AboutSection) doesn't start with any entrance animation, so there's a gap of pure black.

Additionally, CinematicTransition's `contentWrapRef` starts at `opacity: 0, scale: 0.96, blur: 4px` — meaning when you first scroll into it, it's invisible. The entrance animation occupies only 0.04 of the timeline (= 80px at 2000px pin), so there's a near-invisible entrance before the text appears.

**Fix direction**:
1. The aperture mask concept might be over-engineered for what's needed. Consider removing it and simplifying the LogoSkills→Cinematic handoff to just the existing overlay fade.
2. Between CinematicTransition and AboutSection, there's no scroll gap issue — it's just that both sections have dark backgrounds and no clear transition. AboutSection needs its own entrance to be more visible.
3. The `contentWrapRef` entrance at `duration: 0.04` is too fast/short. Either make it longer (0.10) or remove the blur/scale start entirely and just let the existing topLine + text animations handle the entrance.

---

### Issue 5: About / Resume / Contact sections unchanged

**Screenshots**: `Screenshot 2026-04-07 124218.png`, `Screenshot 2026-04-07 124230.png`

The lower sections (Philosophy & Practice, Experience & Skills, Contact) look exactly the same as before. The user expected:
- CurvedLoop background in Philosophy & Practice
- ScrollReveal on the statement heading
- Visible improvements to layout and interaction

**Root cause**: 
- The SVG curved loop was added at `opacity: 0.08` — so faint it's invisible on a dark background. Two SVG paths at 0.5px stroke width and 0.3/0.2 alpha, wrapped in 8% opacity = effectively invisible.
- ScrollReveal was applied to the statement heading, but the effect (word-by-word fade with 3deg rotation) is very subtle on scroll and may not be noticeable without slow, deliberate scrolling.
- No layout changes were made to these sections — the spec said to add ScrollReveal "where it improves flow" but the existing layouts were kept as-is.

**Fix direction**:
- CurvedLoop SVG: increase opacity to 0.20–0.30, increase stroke width to 1–2px, make the animation more visible. Or use a different approach — animated gradient meshes, subtle noise texture, or a moving radial gradient.
- ScrollReveal: evaluate if it actually adds value. The word-by-word effect on a short statement might just look jerky. If it doesn't improve things, remove it and keep the simpler GSAP reveal.
- The user said "完全没有按照我的要求" — the changes need to be VISIBLE, not theoretically correct but invisible.

---

## What Was Committed (16 commits)

```
10fedb0 fix: resolve TypeScript errors in AboutSection and LogoSkillsTransition
5673c39 feat: apply ScrollReveal to About statement + fix cleanup bug
72ffd9e feat: apply ScrollReveal to statement text in About section
07bada6 feat: upgrade works page with active filter highlight and two-tier card hover
fd2f1c6 feat: redesign work detail page with sticky meta panel, process timeline, and related works
60aec14 feat: extend WorkItem with optional role, tools, process, mood, notes fields
12c56a0 feat: add atmospheric curved loop background to Philosophy & Practice section
c2f7632 feat: add glass refraction treatment to CinematicTransition headlines
d820968 feat: add card-hover effect to desktop navigation links
65576b5 feat: add BorderGlow effect to works cards across homepage, grid, and detail pages
65a87cb chore: initialize shadcn and install React Bits components
68f12b9 feat: add subtle entrance animation to CinematicTransition for aperture continuity
193076a feat: add aperture reveal mask at end of LogoSkillsTransition
95bea72 fix: rework explosion physics — cubic easing, wider phase, slower ramp
ed894eb fix: restructure LogoSkillsTransition timeline for longer hold and delayed overlay
0cc0533 fix: extend LogoSkillsTransition scroll distance to 4800px
```

Before these commits: `6c93aca`

## What Should Be Salvaged

Some changes are fine and should NOT be reverted:
- `60aec14` — WorkItem data model extension (role, tools, process, mood, notes). Harmless, adds optional fields.
- `fd2f1c6` — Work detail page redesign (sticky meta panel, process timeline, related works). Structural improvement.
- `07bada6` — Works page filter bar upgrade + two-tier hover. Structural improvement.
- `d820968` — Card-hover effect on desktop nav. Subtle but fine.

## What Should Be Reverted or Heavily Reworked

- **BorderGlow** (`65576b5`): Revert entirely. Remove the wrapper from all three files. Build a simpler CSS glow if still wanted.
- **Aperture mask** (`193076a`): Remove or simplify. It adds complexity without clear visual benefit.
- **CinematicTransition entrance** (`68f12b9`): Simplify. The opacity-0 + blur start makes the section invisible on entry.
- **LogoSkillsTransition timing** (`0cc0533`, `ed894eb`, `95bea72`): Rework — 4800px is way too long. Try ~3400px with denser phases.
- **Glass refraction** (`c2f7632`): Invisible at 3% opacity. Either make visible or remove.
- **CurvedLoop SVG** (`12c56a0`): Invisible at 8% opacity. Make visible or replace.
- **ScrollReveal** (`5673c39`, `72ffd9e`): May be causing issues with other ScrollTriggers. Evaluate.
- **shadcn + React Bits** (`65a87cb`): The installed components added heavy dependencies (Three.js, react-icons, @react-three/fiber, maath, etc.) but most weren't used. Clean up unused components and dependencies.

## Suggested Fix Order

1. **Remove BorderGlow from all files** — this is the most visually broken thing.
2. **Fix z-index overlap** between WorksShowcase and LogoSkillsTransition.
3. **Reduce LogoSkillsTransition pin distance** to ~3400px, compress timeline phases.
4. **Simplify or remove aperture mask** — the handoff should be a simple overlay fade.
5. **Fix CinematicTransition entrance** — don't start invisible.
6. **Make CurvedLoop actually visible** or replace with a visible background effect.
7. **Remove unused React Bits components and dependencies** to reduce bloat.
8. **Test in browser after EACH change** — do not batch commits without visual verification.

## Critical Process Note for Next Session

The previous session's subagent-driven approach failed because:
1. Subagents committed code without being able to see the browser
2. No visual verification was done between tasks
3. CSS effects at very low opacity (3%, 8%) are effectively invisible but pass code review
4. Complex scroll interactions (sticky + pin + z-index) need browser testing, not just code inspection
5. The BorderGlow component API was not visually evaluated before wrapping all cards

**For the next session**: Make one change at a time. After each change, ask the user to verify in browser before proceeding. Do not batch multiple visual changes without browser feedback.

---

## Aesthetic Reminders

- Black / white, cinematic, editorial, premium, restrained
- No warm tones, no purple gradients
- Effects should be VISIBLE but not overwhelming
- Do not make the site feel like a tech demo
- The artwork is the hero — effects should frame it, not fight it
