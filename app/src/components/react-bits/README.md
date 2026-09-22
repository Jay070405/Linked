# React Bits components

ShapeGrid, ScrollReveal, PixelSwap and TextType were added from the official
registry at https://reactbits.dev/r/{name}.json with `shadcn add`, using the
JavaScript/CSS variants requested for this portfolio.

Upstream: https://github.com/DavidHDev/react-bits

The upstream copyright and license are retained in `LICENSE.md`.

Local adaptations:

- ShapeGrid supports a shared pointer source, scroll offset, reduced motion,
  ResizeObserver and a transparent vignette for the light page background.
  Its optional external renderer supplies the same grid and hover state to the
  sphere GPU material without copying a full-screen canvas every frame. Animation
  speed is time-based, and transparent vignettes skip the extra fill pass.
- ScrollReveal scopes GSAP cleanup, supports the nested portfolio scroller,
  semantic elements and Chinese word segmentation.
- PixelSwap can send its frozen grid and animation timings to the sphere shader,
  avoiding a second invisible DOM pixel animation. The original DOM mode remains.
- TextType cleans up its cursor tween on unmount.
