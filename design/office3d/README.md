# 3D office — local review version

## Preview and source

- Preview: http://127.0.0.1:4318/#home
- Base: `708de384c53c3a667860f961de384cab7d63d8f9` (latest GitHub main at start).
- Local branch: `codex/office-3d-local-20260922`.
- Editable model: `studio.blend`, made in Blender 5.2.2 LTS.
- Generator: `../../tools/build_office.py`; build wrapper: `../../tools/build_office.ps1`.
- Web asset: `../../app/public/assets/office3d/studio.glb`, 1,433,148 bytes.
- The previous checkout is untouched. Local pre-change backup branch: `backup/pre-office-3d-20260922`.
- **Local only. Do not push or deploy until Jay explicitly approves this version.**

The scene is original procedural geometry: desk, monitor, keyboard, tablet,
sketchbook, lamp, cup, books, folded plant leaves, window and garden branches.
The distant landscape uses the existing original `world-tree.png` portfolio
artwork. Brush textures are generated deterministically and packed into the
Blender file. No purchased or third-party mesh is required.

Native source preserves individual objects for editing. The web export merges
objects by material within the three environment groups, then uses Meshopt and
WebP compression. Do not enable pruning or flattening in the optimizer: the
camera anchors and independently switchable environment groups are required.
PORTFOLIO is a live font texture on a wall plane in the browser; it is not baked
into the Blender file. The real monitor naturally occludes it.

## Rebuild

From the repository root, after `npm ci` in `app`:

```powershell
./tools/build_office.ps1 -Blender 'E:/SteamLibrary/steamapps/common/Blender/blender.exe'
```

From `app`:

```powershell
npm run dev -- --port 4318 --strictPort
node --test src/office3d/camera.test.mjs
npm run build
```

Raw GLB, Blender autosave and generator logs are local build artifacts excluded
from Git. The .blend and generated PNG textures are retained as editable source.

## Rendering contract

- SharedDesk remains in both render passes; StudioInterior and FantasyGarden
  switch visibility with the same perspective camera.
- The existing fluid field blends the two render targets, with edge-only
  refraction and a 2.15-second wake. Garden rendering is skipped when invisible.
- The opening consumes the existing `progressRef`. It does not own a second
  scroll timeline or modify video timing.
- Camera moves from CameraStart toward ScreenTarget during progress 0–.141.
  Parallax settles by .11; the black screen covers the viewport before handoff.
- `.116–.178` retains the original blackout, `.158–.773` retains the original
  0–15.02-second video mapping, and ScrollTrigger retains `scrub: .65`.
- Reverse scrolling computes the camera directly from progress, without
  accumulating position. The same video element continues through its shrink.
- Original LiquidOffice is the fallback for reduced motion, load failure and
  unavailable/lost WebGL. Renderer resources are disposed on unmount.
- Rendering sleeps when idle, beyond the office, on another route, or in a
  hidden browser tab. Pointer handlers are passive and touch-action is pan-y.

## Verification — 2026-09-22

- Production build: passed. Existing large-chunk warning remains.
- Eight Node tests: passed, using anchors read from the final compressed GLB.
  Cover desktop, portrait and ultrawide screen coverage, no camera crossing,
  reverse-scroll determinism, settled handoff and required model structure.
- Edge desktop: 3D mode confirmed through DOM diagnostics and visual inspection;
  cursor changes camera position and reveals the painted garden locally.
- Scroll into monitor: screen becomes full-frame black, then original CREATIVE
  / portfolio video appears. At progress .1968, video time was .941986 s versus
  .947603 s calculated from rounded progress (within the existing seek tolerance).
- Reverse scroll from the video: office restored at progress 0 with camera
  approximately (0,4.1,8.6).
- Portrait viewport: title fully fits, monitor is centered, vertical layout
  remains accessible. This was a browser viewport test, not a physical phone.
- Reduced motion: mode=image, original static content present, zero ready 3D
  canvases; restoring motion initializes the model again.
- Archive route: `/works/archive` displays 25/25 works and all six categories.
- No observed Three.js shader, GLB decoding or asset-load error in these checks.
  Browser extension message-channel errors were present independently.
- A portrait cursor sample reported 38 draw calls and about 12.9 ms average CPU
  render submission. This is not a measured GPU frame rate or a guarantee for
  mobile hardware; physical-device FPS and Safari remain unverified.

The model/material treatment is the first local art-direction version for Jay
to review. Network failure and GPU context loss have explicit fallback paths;
they were not forcibly induced in the user's browser during this pass.
