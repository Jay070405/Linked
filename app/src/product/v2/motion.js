import {useEffect, useLayoutEffect, useState} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';
import {CustomEase} from 'gsap/CustomEase';

/* One motion language for the v2 case pages, shared with the homepage: GSAP + ScrollTrigger, the homepage's
   character rise for display titles, and one ease-out curve used by both CSS (--v2-out) and GSAP ("v2out").
   gsap.context() + revert() stands in for @gsap/react's useGSAP, as in the rest of the site. */
gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('v2out', '.23,1,.32,1');
CustomEase.create('v2inout', '.77,0,.175,1');

export {gsap, ScrollTrigger, SplitText};

/** Product pages scroll the window in the standalone entry and .portfolio-page-viewport inside the full site. */
export const scrollerOf = node => node?.closest?.('.portfolio-page-viewport') || window;
export const scrollRootOf = node => node?.closest?.('.portfolio-page-viewport') || null;

/** The homepage's title entrance (components/SplitText.jsx): characters rise and turn into place. */
export const TITLE_FROM = {opacity: 0, yPercent: 78, rotationX: -18};
export const TITLE_TO = {opacity: 1, yPercent: 0, rotationX: 0, duration: .78, ease: 'power3.out', stagger: .024};

export function useMedia(query) {
  const [match, setMatch] = useState(() => typeof matchMedia === 'function' && matchMedia(query).matches);
  useEffect(() => {
    const media = matchMedia(query), sync = () => setMatch(media.matches);
    sync(); media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [query]);
  return match;
}
/** Phones get screenshots and swipe galleries instead of iframes and pinned scenes. */
export const PHONE = '(max-width: 760px)';
/** Hover effects only where a hovering pointer exists. */
export const FINE = '(hover: hover) and (pointer: fine)';

/** Section reveals: opacity + 12px, 450ms, 50ms stagger, once. Marks: [data-reveal] inside root.
    Reduced motion keeps the fade and drops the movement. */
export function useReveals(root, reduced, deps = []) {
  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray(node.querySelectorAll('[data-reveal]'));
      if (!items.length) return;
      gsap.set(items, reduced ? {opacity: 0} : {opacity: 0, y: 12});
      ScrollTrigger.batch(items, {
        scroller: scrollerOf(node), start: 'top 90%', once: true, interval: .08,
        onEnter: batch => gsap.to(batch, reduced
          ? {opacity: 1, duration: .3, ease: 'none', overwrite: true}
          : {opacity: 1, y: 0, duration: .45, ease: 'v2out', stagger: .05, overwrite: true}),
      });
    }, node);
    // fonts and late images move things; keep trigger positions honest
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh).catch(() => {});
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ...deps]);
}
