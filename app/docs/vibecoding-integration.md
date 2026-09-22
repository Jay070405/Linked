# Vibe coding / FIELD 01 integration

Approved by the owner for GitHub upload and publication to the existing portfolio website.

## Changes

- Menu item 04 is now **Vibe coding**, opening `/vibecoding` in both languages.
- The original artwork archive remains at `/works/archive`, accessible from the art pages.
- The gallery contains twelve surfaces in an asymmetric grid. The first opens FIELD / 01; the remaining eleven are non-navigating Coming soon placeholders.
- All segmented surfaces and the ShapeGrid background share an inner-sphere projection. Native scroll moves the unrolled wall through that projection with inertia, so each surface bends according to its place on the wall. Scroll direction reverses the movement. This replaces the first version's individual paper-edge curl.
- React Bits ShapeGrid, ScrollReveal, PixelSwap and TextType were installed from the official shadcn registry. PixelSwap's original grid, delays and state drive a WebGL texture transition on the curved surfaces; its DOM version remains the fallback. Placeholder hover reveals Coming soon, and the camera hover reveals its exploded view.
- Cards enter with a 120 ms stagger and a damped upward spring. Text reveals word by word over 1.35 seconds; the page title types at 105 ms per character. Text splitting supports Chinese.
- Clicking the camera immediately starts a 1.05-second shared expansion while its live page loads in a persistent host. Native browser transform/opacity animations let the cover move independently of JavaScript work during model initialization. The live page and its grid scale uniformly inside the curved mask and blend in as soon as the model paints. The route commits after expansion and handoff, preserving the same iframe and model instance. Escape, Cancel or viewport resizing restores the gallery; reduced motion opens the detail directly.
- One WebGL canvas renders visible gallery surfaces. The loop pauses when the document is hidden; WebGL resources, scoped GSAP animations, observers and input listeners are disposed when leaving. Pointer targets and captions follow projected card bounds.
- Native wheel, touch, keyboard scrolling, focus, reduced motion and an HTML fallback are retained. Phone layouts use two columns with the camera spanning both.
- `/vibecoding/field01` embeds the completed camera experience, with a return link and a separate full-screen link. Leaving the page unmounts the iframe and releases the camera experience.
- Vercel routes cover both new pages and `/field01/`, with a trailing-slash redirect for the static camera directory. Missing camera assets are not rewritten to the portfolio HTML.

## Camera package

`public/field01/` starts from the approved `field01-final-20260921/deploy/` package: 29 files, approximately 81.54 MiB. Its 28 non-HTML files remain unchanged, including the final R09 model, camera application, source wireframe, gesture Worker, WASM and recognition model. The largest file is 20,957,988 bytes. Neither Blender source files nor development archives are included.

The HTML adds two website presentation files, `portfolio-theme.js` and `portfolio-theme.css`. They mount React Bits ShapeGrid behind the transparent model canvas and replace the original background with neutral gray colors. Desaturation does not apply to the camera, its material reflections, screens or glass overlays. The build regenerates them from `src/field01-theme.jsx` and `src/field01-theme.css`; it does not rebuild the approved camera application. The same presentation works in the standalone camera page.

The two optimized gallery previews live in `public/assets/vibecoding/`. The cover is a 1920 × 1440 WebP export of the user's exact `FIELD01-product-poster-4800.png` poster, preserving the full 4:3 composition. Hovering or focusing the camera prefetches its document, manifest and model unless Save-Data is enabled; the camera renderer mounts only after a click. The gallery renderer pauses during opening, resumes on cancellation and is disposed after navigation. The existing source camera remains the source of truth for future camera revisions.

## Local review

Run `npm ci`, then `npm run dev -- --port 4326` from `app/`. Run `npm run build` to regenerate the camera presentation files and produce the production bundle. Node 22 is the repository's configured version.

- Gallery: `http://127.0.0.1:4326/vibecoding`
- Camera: `http://127.0.0.1:4326/vibecoding/field01`
- Independent camera: `http://127.0.0.1:4326/field01/index.html`

Validation: production build, route verification, package checksums, and browser checks for desktop/mobile layout, pixel hover, native scrolling, shared transition, camera loading and full disassembly, Chinese text, return navigation and reduced motion. Browser tests do not establish real-phone GPU performance or real-person gesture recognition.

React Bits source and license: see `src/components/react-bits/README.md` and `LICENSE.md`.

## Frame pacing optimization

ShapeGrid now passes its grid offset and fading hover cells to a GPU background
material on the same sphere. This removes the full-screen 2D redraw and canvas
texture upload from each gallery frame. The component's 2D renderer remains for
reduced motion, fallback and standalone camera presentation. Grid
movement uses elapsed time, so its speed is consistent across refresh rates.

Caption elements and layout offsets are cached during measurement. Per-frame
layout reads and redundant style writes were removed, blank textures are shared
by aspect ratio, and the renderer requests the high-performance GPU preference.
Card geometry, artwork resolution, spring entrance and PixelSwap timings remain.

Local development sampling at 1280 × 720, 120 animation-frame intervals per
window, on the same preview surface:

| Measurement | Before | After |
| --- | ---: | ---: |
| Animation frame cadence | 73.5 FPS | 155 FPS |
| 95th percentile frame interval | 26 ms | 6.6 ms |
| Frames longer than 25 ms | 21 / 120 | 0 / 120 |
| Repeated full-screen texture upload | 258.5 MiB/s | 0 MiB/s |

These are local animation callback measurements, not a guarantee for other
devices or display refresh rates. The sampler is development-only; production
bundle inspection confirms it is removed. Continuous wheel scrolling, pixel
hover, shared transition and the production build were checked after the change.

The revised transition was inspected at its intermediate frames, including
uniform scaling and the curved mask. The development iframe instance identifier
was unchanged before and after the route commit. Cancel restored the gallery's
scroll position, opacity and focus, and removed the camera iframe.

## Immediate project opening

Normal-speed click testing found that the earlier version waited 1,169 ms for
the model before starting its 1,150 ms expansion. A 310 ms main-thread stall
occurred during camera initialization. The revised transition starts immediately
and runs its cover movement through Web Animations instead of a JavaScript
animation loop. It reuses a canvas snapshot without PNG encoding/decoding,
removes a redundant full-iframe saturation filter, and observes ready controls
instead of polling every 80 ms. Model prefetch now matches `?surface=4` exactly.

At the same local 1280 × 720 preview size, animation dispatch changed from
1,169 ms after click to 5–6 ms; complete handoff changed from 2,321 ms to
1,394–1,462 ms. These are local click timings, not compositor FPS measurements.
Model initialization still caused 329–335 ms JavaScript frame gaps; the cover's
native transform animation no longer depends on those callbacks. The actual
opening, immediate cancellation, reopening and rapid double-click paths were
checked, with one camera instance and no browser console errors.
