import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {gsap, ScrollTrigger, scrollerOf, scrollRootOf} from '../../v2/motion';

/* The receipt's motion language (D4 world). Three things move, and only these:
   1. On load, the printer prints the receipt's header, line by line, and the tape feeds out under it.
   2. As you scroll, each receipt line [data-print] prints the moment it reaches the lower edge of the screen:
      a clip from the top down in six steps, the way a thermal head lays down dot rows (320 ms, once).
   3. Money rolls like a register: each digit is a wheel that turns to its new place (<Register>).
   Reduced motion and the plain reading mode skip all three: everything is printed already. */

const viewH = node => { const s = scrollerOf(node); return s === window ? innerHeight : s.clientHeight; };

/** Lines print as they reach the bottom of the screen. Lines already on screen (or above it) at setup stay printed,
    so a restored scroll position never leaves blank paper above you. */
export function usePrintOnScroll(root, still, deps = []) {
  useLayoutEffect(() => {
    const node = root.current;
    if (!node || still) return undefined;
    const ctx = gsap.context(() => {
      const fold = viewH(node) * .92;
      const lines = [...node.querySelectorAll('[data-print]')].filter(el => !el.closest('[data-print-head]') && el.getBoundingClientRect().top > fold);
      if (!lines.length) return;
      gsap.set(lines, {clipPath: 'inset(0% 0% 100% 0%)'});
      ScrollTrigger.batch(lines, {
        scroller: scrollerOf(node), start: 'top 94%', once: true, interval: .05,
        onEnter: batch => gsap.to(batch, {clipPath: 'inset(0% 0% 0% 0%)', duration: .32, ease: 'steps(6)', stagger: .05, overwrite: true, clearProps: 'clipPath'}),
      });
    }, node);
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh).catch(() => {});
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still, ...deps]);
}

/** The one orchestrated moment: the printer wakes, the tape feeds out, the header prints line by line. */
export function useHeaderPrint(root, still) {
  useLayoutEffect(() => {
    const node = root.current;
    if (!node || still) return undefined;
    const head = node.querySelector('[data-print-head]');
    if (!head) return undefined;
    const ctx = gsap.context(() => {
      const lines = head.querySelectorAll('[data-print]');
      const tl = gsap.timeline({defaults: {ease: 'none'}, onComplete: () => ScrollTrigger.refresh()});
      tl.fromTo(node.querySelector('.cnr-led'), {opacity: .25}, {opacity: 1, duration: .12, repeat: 1, yoyo: true}, 0)
        .fromTo(node.querySelector('.cnr-feed'), {y: -36}, {y: 0, duration: 1.15, ease: 'power1.out', clearProps: 'transform'}, .12)
        .fromTo(lines, {clipPath: 'inset(0% 0% 100% 0%)'}, {clipPath: 'inset(0% 0% 0% 0%)', duration: .24, ease: 'steps(5)', stagger: .075, clearProps: 'clipPath'}, .16)
        .fromTo(node.querySelectorAll('[data-desk-in]'), {opacity: 0, y: 28, rotation: -2.4}, {opacity: 1, y: 0, rotation: -.7, duration: 1, ease: 'v2out', stagger: .12}, .45)
        .to(node.querySelector('.cnr-led'), {opacity: .35, duration: .2}, '>-0.2');
    }, node);
    return () => ctx.revert();
  }, [root, still]);
}

/** True once `ref` has come on screen. */
export function useSeen(ref, skip = false) {
  const [seen, setSeen] = useState(skip);
  useEffect(() => {
    if (seen) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver !== 'function') { setSeen(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, {root: scrollRootOf(el), rootMargin: '0px 0px -6% 0px'});
    io.observe(el);
    return () => io.disconnect();
  }, [ref, seen]);
  return seen;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** A figure set like a cash register's display. Each digit is a wheel that turns to its new place (a CSS transform
    transition, so a value that changes mid-roll just retargets). The first time it comes on screen it rolls up from
    zeros. `instant`: no rolling (keyboard changes, reduced motion, plain mode). Screen readers get the plain text. */
export function Register({text, instant = false, className = ''}) {
  const ref = useRef(null);
  const seen = useSeen(ref, instant);
  const chars = [...String(text)];
  // units turn first, then tens, and so on leftward, the way a register's wheels carry
  let wheel = chars.filter(c => /\d/.test(c)).length;
  return <span ref={ref} className={`cnr-reg${instant ? ' is-instant' : ''}${className ? ` ${className}` : ''}`}>
    <span className="cnr-sr">{text}</span>
    <span className="cnr-reg-face" aria-hidden="true">
      {chars.map((ch, i) => {
        const key = chars.length - i;   // keyed from the right: units stay units as the number grows
        if (!/\d/.test(ch)) return <span key={`c${key}`} className="cnr-reg-ch">{ch}</span>;
        const d = seen ? Number(ch) : 0;
        const delay = (--wheel) * 22;
        // the hidden digit gives the wheel its width and the line's baseline; the strip turns over it, clipped
        return <span key={`d${key}`} className="cnr-wheel"><span className="cnr-wheel-ghost">{ch}</span>
          <span className="cnr-strip" style={{'--d': d, transitionDelay: instant ? '0ms' : `${delay}ms`}}>{DIGITS.map(n => <span key={n}>{n}</span>)}</span>
        </span>;
      })}
    </span>
  </span>;
}

/** Remembers whether the last input inside a module came from the keyboard: keyboard-made changes don't animate. */
export function useKeyed() {
  const keyed = useRef(false);
  return {keyed, bind: {onKeyDown: () => { keyed.current = true; }, onPointerDown: () => { keyed.current = false; }}};
}
