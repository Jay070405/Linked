# 3D office — second local revision

Preview: http://127.0.0.1:4318/#home

Local only. Do not push or deploy until Jay explicitly approves. GitHub and the production domain have not been modified. The first 3D attempt is recoverable at local tag `backup/office-3d-first-pass-20260922` (commit a06b08a). The original remote base is preserved at `backup/office-3d-base-20260922`.

## Editable source and assets

- `studio.blend`: Blender 5.2.2 LTS source, individual objects retained.
- `../../tools/build_office.py`: reproducible scene generator.
- `../../tools/build_office.ps1`: Blender export and Meshopt/WebP optimization.
- `../../app/public/assets/office3d/studio.glb`: 4.09 MB browser geometry/materials.
- `ASSET-CREDITS.md`: downloaded CC0 materials, scanned plant and HDR environments.
- `reference-render0001.png`: native Cycles inspection render; browser has its own HDR window background, lighting and live wall lettering.

The monitor, folded aluminium stand, spun dome lamp, curved sketchbook pages, desk, keyboard and small props have been rebuilt/refined. Scanned wood and plant surfaces replace the first attempt's generic materials. Window scenery uses a city dusk environment. Portfolio artwork is not used as outside scenery. The alternate-world effect is disabled, including the static fallback switch.

Each of the 12 movable objects is an independent exported hierarchy. Material merging happens within each prop, never across rigid bodies. Camera anchors and ScreenSurface remain independent. Do not flatten, prune or join the exported hierarchies globally.

## Interaction

Hold a desktop object to lift it about 38 cm; drag to move it across the desk plane; release to drop with gravity and collisions. Loose objects are the keyboard, tablet, stylus, mouse, cup, sketchbook, pencil, plant and four reference books. Monitor and lamp remain fixed equipment; the monitor is the camera destination.

An object that falls below the desk is hidden and removed from physics simulation. Only then does the restore button appear. Restoration returns only fallen objects to their original placements, preserving all other arrangements. The button disappears when nothing is lost.

Click the physical lamp shade/base or the labeled button to toggle its spot light, warm bounce light and bulb emission. The button supports keyboard operation and aria-pressed. Interactions stop as the camera enters the monitor. The original blackout and video seek timeline remain intact. Offscreen/background rendering and physics pause. Reduced motion shows the original still composition without fluid switching or physics.

## Rebuild and checks

From repository root:

```powershell
./tools/build_office.ps1
```

From `app`:

```powershell
npm run dev -- --port 4318 --strictPort
node --test src/office3d/camera.test.mjs src/office3d/physics.test.mjs
npm run build
```

## Actual validation — 2026-09-22

- Blender source/export rebuilt successfully; production Vite build passed.
- 11 automated checks passed: all 12 authored props stay on the desk at initialization; release settles on the desk; off-edge objects disappear; restore preserves other objects; monitor covers four viewport ratios before blackout; forward/reverse camera path remains deterministic.
- Edge desktop, 1600 × 1000 CSS viewport: dragged cup from its original location to the keyboard area. It settled on the keyboard, no restore button.
- Dragged mouse beyond the front edge. It fell to y=0.113, became invisible and the restore button appeared with count 1.
- Clicked restore: mouse returned to [2.12,1.481,0.74]; moved cup remained [1.494,1.696,0.694]. Button disappeared.
- Clicked the actual lamp shade: warm desk illumination, monitor highlight and bulb switched off; the labeled control changed to off. Button switched it back on.
- Scrolled into original film: at office progress ~0.1736 the original courtyard video was at 0.363 s and CREATIVE / portfolio text was present; controls hidden. Reverse scroll reached the full-size blackout, then returned to the office.
- Narrow portrait viewport (390 × 844 override, browser zoom yields 433 × 938 CSS): no horizontal overflow; monitor and title remain visible; lamp control remains in viewport.
- Reduced motion: image mode, zero active office 3D canvases, no alternate-world switch. Restoring motion reloads the 3D scene.
- No office shader/runtime error observed. Rapier emits an upstream initialization deprecation warning. Existing browser extensions also emit unrelated message-channel errors.

Limits: this is an editable real-time reconstruction, not a pixel-identical photographic match. Complex moving objects use simplified box colliders. Touch hardware, Safari and low-end GPU performance have not been physically tested. CPU render submission measurements are not GPU frame-rate measurements.
