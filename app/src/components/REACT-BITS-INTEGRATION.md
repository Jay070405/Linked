# React Bits installation and integration

Installed 2026-09-10 from the official `https://reactbits.dev/r/{name}.json` registry using the user's eight JS-CSS identifiers and `npx shadcn@latest add ... --yes`.

## Components

| File | Main props used by the portfolio |
| --- | --- |
| `SplitFlapText.jsx` | `text` or `words`, `fontSize`, `tileColor`, `textColor`, `tileRadius`, `gap`, `padTo`, `loop`, `flipDuration`, `stagger`, `cycleDelay`, `flipsPerChar`, `charset`, `className`, `style` |
| `ParticleText.jsx` | `text`, `fontSize`, `fontFamily`, `fontWeight`, `color`, `highlightColor`, `particleSize`, `density`, `scatter`, `gatherDuration`, `stagger`, `pointerRepel`, `repelRadius`, `idleDrift`, `glow`, `trigger` (`mount`, `hover`, `click`), `style`, `className` |
| `CountUp.jsx` | `to` (required), `from`, `duration`, `delay`, `startWhen`, `separator`, `className`, `onStart`, `onEnd`; numeric values from `stats` in `portfolioData.js` |
| `FlowingMenu.jsx` | `items: [{link,text,image}]`, `speed`, `textColor`, `bgColor`, `marqueeBgColor`, `marqueeTextColor`, `borderColor` |
| `GlassSurface.jsx` | `children`, `width`, `height`, `borderRadius`, `borderWidth`, `brightness`, `opacity`, `blur`, `displace`, `backgroundOpacity`, `saturation`, `distortionScale`, `style`, `className` |
| `Lanyard.jsx` | `position`, `fov`, `gravity`, `transparent`, `frontImage`, `backImage`, `imageFit`, `lanyardImage`, `lanyardWidth` |
| `PillNav.jsx` | `logo`, `logoAlt`, `items: [{label,href,ariaLabel?}]`, `activeHref`, `baseColor`, `pillColor`, `pillTextColor`, `hoveredPillTextColor`, `initialLoadAnimation` |
| `StaggeredMenu.jsx` | `items: [{label,link,ariaLabel?}]`, `colors`, `accentColor`, `menuButtonColor`, `openMenuButtonColor`, `isFixed`, `socialItems`, `onMenuOpen`, `onMenuClose`; local integration adds `onItemClick`, `openLabel`, `closeLabel`, `socialLabel` |

## Portfolio wrappers

`SiteNavigation({lang,onLanguage,onNavigate,onAbout})` uses actual PillNav hover circles and StaggeredMenu layered entrance. `onNavigate` receives `home`, `systems`, `art`, `archive`, or `contact`; about dispatches `onAbout`. Hash link interception prevents full page reloads. Both navigation modes have Chinese and English labels. StaggeredMenu closed content is inert and its open state supports Escape and tab containment.

`AboutPanel({lang,onClose,reducedMotion})` opens a native modal dialog. It lazily loads the actual R3F/Rapier Lanyard, with custom vector front/back cards and a matching strap. The badge contains the author's name and disciplines; it does not claim to depict their face. The panel includes source-backed education and the current résumé. It restores scrolling and focus when unmounted. Either the explicit `reducedMotion` prop or the operating system preference displays a static version of the same badge; a renderer error uses the same fallback.

## Assets and dependencies

The official registry explicitly marks Lanyard dependencies as manual and excludes binary files. `card.glb` and `lanyard.png` were downloaded from `DavidHDev/react-bits/main/src/content/Components/Lanyard/`. The original component's model import is adjusted to `?url` for Vite. Custom SVG textures are in `assets/` beside this document.

Installed R3F, Drei, Rapier, and Meshline. React and React DOM use the 19.2 release series because the installed R3F version explicitly supports React >=19 and <19.3; no peer constraints were bypassed. Exact resolved versions are in the package lock.

License: `REACT-BITS-LICENSE.md` is copied from the upstream repository.

Validation: `node src/components/validate-components.mjs` compiles all wrappers and the remaining components with their dependencies in memory. This check does not substitute for browser interaction checks.
