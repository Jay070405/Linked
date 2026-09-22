# 3D office — third local revision

Preview: http://127.0.0.1:4318/#home

Local only. Do not push or deploy until Jay explicitly approves. GitHub and the production domain have not been modified. The first 3D attempt is recoverable at local tag `backup/office-3d-first-pass-20260922` (commit a06b08a). The original remote base is preserved at `backup/office-3d-base-20260922`.

The second revision, before these interaction changes, is preserved at `backup/office-before-interaction-fixes-20260922` (49e74ee).

## Editable source and assets

- `studio.blend`: Blender 5.2.2 LTS source, individual objects retained.
- `../../tools/build_office.py`: reproducible scene generator.
- `../../tools/build_office.ps1`: Blender export and Meshopt/WebP optimization.
- `../../app/public/assets/office3d/studio.glb`: 4.14 MB browser geometry/materials.
- `ASSET-CREDITS.md`: downloaded CC0 materials, scanned plant and HDR environments.
- `reference-render0001.png`: previous material revision's native Cycles inspection render. Use the live preview for the current window, lamp and speaker. Browser lighting and live lettering differ from the offline inspection render.

The monitor, folded aluminium stand, spun dome lamp, curved sketchbook pages, desk, keyboard and small props have been rebuilt/refined. Scanned wood and plant surfaces replace the first attempt's generic materials. Window scenery uses a city dusk environment. Portfolio artwork is not used as outside scenery. The alternate-world effect is disabled, including the static fallback switch.

Each of the 12 movable objects is an independent exported hierarchy. Material merging happens within each prop, never across rigid bodies. Camera anchors and ScreenSurface remain independent. Do not flatten, prune or join the exported hierarchies globally.

## Interaction

Hold a desktop object and move up to lift it. Dragging uses a vertical plane with constant world depth, so mouse-up means object-up, not movement towards the back of the table. Release to drop with gravity. Swept colliders keep a held object out of the desk, monitor, lamp, speaker and other props, including fast pointer movement. Loose objects are the keyboard, tablet, stylus, mouse, cup, sketchbook, pencil, plant and four reference books. Monitor, lamp and speaker remain fixed equipment; the monitor is the camera destination.

Hovering an object shows a fine silhouette and a name/action label. Picking respects solid foreground objects. The entire lamp is moved 0.55 m right, with matching lighting and collision geometry; it no longer overlaps the monitor. The left opening is wider and its return wall is outside the sightline. The back wall is extended for wide screens so the outdoor environment cannot leak through its right edge.

The new walnut speaker sits behind the drawing tablet. Click it (or the keyboard-accessible Speaker button) to open the React Bits Comet Dial. It changes the same background music used by the header toggle, saves volume locally, defaults to 14%, and supports keyboard arrows/Home/End. Adjusting the dial while music is off does not re-enable it. Escape, the close button and backdrop close the panel; focus returns to the speaker button.

Opening name, role, work link, navigation labels, language buttons, music status, menu label, chapter and office controls use the existing React Bits TextType integration. PORTFOLIO remains physical wall lettering. Typing runs once when visible, keeps native text dimensions/accessibility, does not restart on hover, and becomes immediate text under reduced motion. Video typography and timing are preserved; the chapter label is now React-owned rather than destructively replacing its animated children.

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
node --test src/office3d/camera.test.mjs src/office3d/physics.test.mjs src/office3d/drag.test.mjs
node src/components/MusicToggle.test.mjs
npm run build
```

## Third-revision validation — 2026-09-22

- Blender source and compressed model rebuilt. Production Vite build passed.
- 17 automated camera/physics/drag checks and 48 background-music assertions: pointer-up raises an object at unchanged depth at desktop/ultrawide/portrait ratios; solid obstacles block a held object; fast drags do not launch another prop; saved volume, mute, zero volume, background pause, resume and existing browser-policy handling pass.
- Edge real pointer input: cup lift increased y from 1.584 to 2.306 while z remained 0.080; release settled it back to y=1.584 without a restore button.
- Hover feedback reports the hovered prop and its drag action. Speaker geometry opens the official Comet Dial; actual pointer drag changed 14% to 60%, and Home/arrow keys restored 14%.
- Final swept-collision build: dragged the cup past the left edge, releasing at [-5.327, 2.638, 0.080]. Only that cup was lost (count 1); restoring it removed the button. Chinese/English switching retained the existing physical state and typed the changed labels.
- Physical lamp click and labeled button toggle both ways. Escape closes the volume dialog and returns focus to the Speaker button. The dial receives focus when the physical speaker is clicked.
- 390 × 844 viewport override (433 × 937 CSS at current browser zoom): no horizontal overflow; speaker control accessible; 280 × 413 panel fully inside viewport. This is a responsive browser check, not a physical touch-device test.
- Scroll reached the original courtyard video at office progress 0.1736 / video 0.372 s. Reverse scroll returned to the office. Handoff camera parameters and video time mapping were not changed.
- Reduced-motion toggle switches to the still fallback and immediately exposes complete name/role/work-link text with no active typing. Restoring motion reloads 3D. Temporary viewport override was reset and the preview left in Chinese at 14% music volume.
- Comet Dial was installed from the official React Bits registry using shadcn. Its upstream SVG viewBox was corrected to `0 0 200 200`; the site's reduced-motion preference is forwarded. License remains in `app/src/components/REACT-BITS-LICENSE.md`.

## Previous-revision validation — 2026-09-22

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
