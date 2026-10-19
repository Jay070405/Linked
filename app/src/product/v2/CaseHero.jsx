import {useLayoutEffect, useRef} from 'react';
import {Go} from '../Go';
import {PRODUCT_HOME} from '../content';
import {FINE, gsap, SplitText, TITLE_FROM, TITLE_TO} from './motion';

/** Case hero: title in large display type, a one-line outcome, role and time chips, and a visual that moves.
    The entrance plays once on load: the title's characters rise the way the homepage's titles do, the copy
    follows, then the visual assembles in depth order ([data-enter="stage" | "back" | "front"]). On desktop the
    visual leans a little toward the pointer. Reduced motion shows everything in place. */
export default function CaseHero({title, kind, outcome, chips = [], actions, children, reduced = false}) {
  const root = useRef(null), heading = useRef(null);

  useLayoutEffect(() => {
    const node = root.current;
    if (!node || reduced) return undefined;
    let split = null;
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(node);
      const tl = gsap.timeline({defaults: {ease: 'v2out'}});
      try {
        split = new SplitText(heading.current, {type: 'chars', tag: 'span', charsClass: 'v2-char', aria: 'none'});
        tl.fromTo(split.chars, TITLE_FROM, {...TITLE_TO, force3D: true}, 0);
      } catch { /* the title simply appears */ }
      tl.fromTo(q('[data-hero-item]'), {opacity: 0, y: 12}, {opacity: 1, y: 0, duration: .45, stagger: .05}, .18);
      tl.fromTo(q('[data-enter="stage"]'), {clipPath: 'inset(100% 0% 0% 0% round 28px)'}, {clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1, ease: 'v2inout'}, .1);
      tl.fromTo(q('[data-enter="back"]'), {opacity: 0, y: -18}, {opacity: 1, y: 0, duration: .9}, .55);
      tl.fromTo(q('[data-enter="front"]'), {opacity: 0, y: 64}, {opacity: 1, y: 0, duration: 1.05}, .68);
      tl.fromTo(q('[data-enter="note"]'), {opacity: 0, y: 8}, {opacity: 1, y: 0, duration: .45}, 1.25);
    }, node);
    return () => { ctx.revert(); split?.revert(); };
  }, [reduced]);

  // parallax: layers lean toward the pointer, each by its depth ([data-depth] in px)
  useLayoutEffect(() => {
    const node = root.current, stage = node?.querySelector('[data-enter="stage"]');
    if (!stage || reduced || !matchMedia(FINE).matches) return undefined;
    const layers = [...stage.querySelectorAll('[data-depth]')].map(el => ({
      d: Number(el.dataset.depth) || 0,
      x: gsap.quickTo(el, 'x', {duration: .9, ease: 'power3'}), y: gsap.quickTo(el, 'y', {duration: .9, ease: 'power3'}),
    }));
    const move = e => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      layers.forEach(l => { l.x(px * l.d); l.y(py * l.d); });
    };
    const rest = () => layers.forEach(l => { l.x(0); l.y(0); });
    stage.addEventListener('pointermove', move, {passive: true});
    stage.addEventListener('pointerleave', rest);
    return () => { stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerleave', rest); };
  }, [reduced]);

  return <header ref={root} className="v2-hero">
    <div className="v2-hero-copy">
      <Go to={PRODUCT_HOME} className="v2-back" data-hero-item=""><span aria-hidden="true">←</span> All product work</Go>
      <p className="v2-hero-kind" data-hero-item="">{kind}</p>
      <h1 className="v2-hero-title" aria-label={title}><span ref={heading} aria-hidden="true">{title}</span></h1>
      <p className="v2-hero-outcome" data-hero-item="">{outcome}</p>
      {chips.length ? <ul className="v2-chips" aria-label="Project facts" data-hero-item="">{chips.map(c => <li key={c}>{c}</li>)}</ul> : null}
      {actions ? <div className="v2-hero-actions" data-hero-item="">{actions}</div> : null}
    </div>
    <div className="v2-hero-visual">{children}</div>
  </header>;
}
