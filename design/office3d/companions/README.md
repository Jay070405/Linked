# Homepage companions

The user supplied both original GLBs in `E:/工作/建模/homepage model/`. They are left unchanged.

`kitten-rig.blend` is the editable Blender source. The cat has 19 deform bones: root, body, chest, neck, head, two tail bones, and three bones for each leg. The source's asymmetrical standing paws are bound individually, then posed into a supported rest. The compressed underside fur is an authored contact correction. This resting pose becomes the bind pose, with normalized skin weights retained for editing and runtime head/neck animation. Textures are packed into the file; the supplied doll is also included as a hidden object.

Rebuild with `tools/build_companions.ps1` from the repository root after `npm ci` in `app`. The Blender script imports the supplied files, creates and poses the rig, renders three inspection views, saves the native file, and exports separate web assets. The PowerShell wrapper optimizes textures and geometry while preserving the skeleton hierarchy and weights.

Runtime placement and gaze live in `app/src/office3d/companions.js`. The doll starts on the desktop left of the fixed speaker. It uses the same pickup, throw, collision and lost-object restore behavior as the other desk props; a centered parent keeps its foot-origin mesh aligned with the rigid body. The cat rests on the window sill; the existing book stack moves left along that sill to leave it space. Pointer tracking rotates only Head and Neck, with limited pitch/yaw, damping and a return to neutral. It uses the office's demand-driven frame loop, stops offscreen/background, and does not respond to touch. The original reduced-motion still fallback remains in use.

Both GLBs together are approximately 1.6 MB. The base studio model, camera path, original source files and other projects are unchanged.

Verification: `node --test src/office3d/companions.test.mjs src/office3d/camera.test.mjs src/office3d/physics.test.mjs src/office3d/drag.test.mjs` from `app`, then `npm run build` and real pointer checks in the browser.
