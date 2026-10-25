# React Bits installation and integration

Installed 2026-09-10 from the official `https://reactbits.dev/r/{name}.json` registry using the user's eight JS-CSS identifiers and `npx shadcn@latest add ... --yes`.

## Components

| File | Main props used by the portfolio |
| --- | --- |
| `GlassSurface.jsx` | `children`, `width`, `height`, `borderRadius`, `borderWidth`, `brightness`, `opacity`, `blur`, `displace`, `backgroundOpacity`, `saturation`, `distortionScale`, `style`, `className` |
| `Lanyard.jsx` | `position`, `fov`, `gravity`, `transparent`, `frontImage`, `backImage`, `imageFit`, `lanyardImage`, `lanyardWidth` |
| `StaggeredMenu.jsx` | `items: [{label,link,ariaLabel?}]`, `colors`, `accentColor`, `menuButtonColor`, `openMenuButtonColor`, `isFixed`, `socialItems`, `onMenuOpen`, `onMenuClose`; local integration adds `onItemClick`, `openLabel`, `closeLabel`, `socialLabel` |

## Portfolio wrappers

`SiteNavigation({lang,onLanguage,onNavigate,onAbout})` uses the StaggeredMenu layered entrance. `onNavigate` receives `home`, `systems`, `art`, `archive`, or `contact`; about dispatches `onAbout`. Hash link interception prevents full page reloads. Both navigation modes have Chinese and English labels. StaggeredMenu closed content is inert and its open state supports Escape and tab containment.

`/about` (`product/AboutPage.jsx`, `AboutBadge.jsx`) lazily loads the actual R3F/Rapier Lanyard in its `variant="about"` mode, with the product and game-systems faces in `assets/`. Reduced motion or a renderer error shows a static version of the same badge.

The unused SplitFlapText, ParticleText, FlowingMenu and PillNav installs were removed on 2026-10-25.

## Assets and dependencies

The official registry explicitly marks Lanyard dependencies as manual and excludes binary files. `card.glb` and `lanyard.png` were downloaded from `DavidHDev/react-bits/main/src/content/Components/Lanyard/`. The original component's model import is adjusted to `?url` for Vite. The GLB's 2.3 MB PNG atlas was re-encoded as a 210 KB JPEG (same 1678 px, opaque; the faces are composited over it at runtime). Custom SVG textures are in `assets/` beside this document.

Installed R3F, Drei, Rapier, and Meshline. React and React DOM use the 19.2 release series because the installed R3F version explicitly supports React >=19 and <19.3; no peer constraints were bypassed. Exact resolved versions are in the package lock.

License: `REACT-BITS-LICENSE.md` is copied from the upstream repository.

Validation: `node src/components/validate-components.mjs` compiles all wrappers and the remaining components with their dependencies in memory. This check does not substitute for browser interaction checks.
