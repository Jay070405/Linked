# Archive, system index and About refresh

Local review routes: `/works/archive`, `/#systems`, and `/#about`.

## Visual and interaction changes

- Restored the original home system list and pointer-following hover previews after user review. Available rows open their cases directly. Genshin remains marked as in preparation.
- The archive uses a charcoal background, white text and smoke-grey glass for this review. Added an artwork print stack to the archive opening, glass category controls with a moving selection, pointer tilt and highlights on image frames, and gallery/overview layouts. Existing filters, all 25 works, detail routes and navigation history remain intact. Filter and density are preserved when returning from a detail page.
- Reworked About as a silver badge stage and a separate readable profile. Education remains fully visible; three project previews reveal the original experience descriptions and expandable contribution notes. The toolbar includes language and close controls. The badge uses its original camera distance, dimensions and 3D physics, with the existing easter egg. The extra click-mode control has been removed. The original static fallback remains for reduced motion or unavailable WebGL.
- The badge front uses the existing site JL logo from `public/assets/logo.png`, embedded into the original 630 × 950 SVG template with the same silhouette mask used by the navigation. The résumé photo is no longer embedded.
- About slides in from the right in 620 ms and exits to the left in 500 ms. The originating page, filters and scroll position stay mounted underneath; closing does not navigate home. Its native dialog retains the scroll lock until completion, and the transparent shell reveals the original page. Repeat close and Escape are guarded; closing during entry continues from the current position. Reduced motion skips both transitions.
- S3 and S5 full flow diagrams in the Roco case remain directly in the body with reserved image dimensions; the full-size control opens a page-local viewer.

The new surfaces reuse `GlassSurface`, Motion and `ExpressiveTitle`. Pointer tilt uses motion values rather than per-frame React state. No new packages or backend services were added. Site motion and language settings are respected. Case-study content and calculation logic are unchanged by this refresh.

## Verification

- Production Vite build.
- Existing LoL model tests, Roco's 327 assertions and bilingual server rendering, 39 background-music assertions, and six lanyard physics tests.
- The original badge template/camera has been restored; the JL logo is visible in the WebGL badge and the name no longer ends with a period.
- Independent review identified and resolved a keyboard issue: merely tabbing past preview choices must not replace a previously selected project before reaching its entry or contribution control. Selection now commits with Enter/Space or click; pointer hover remains available.
- Browser checks cover desktop/tablet/mobile layouts, image presence, archive filtering and layout changes, return-state restoration, study navigation, About language changes, contribution disclosure, badge dragging, return to the originating page, and reduced motion.

This is a local working-copy update, not a public deployment.
