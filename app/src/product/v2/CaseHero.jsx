import {useLayoutEffect, useRef} from 'react';
import {Go} from '../Go';
import {PRODUCT_HOME} from '../content';
import {FINE, gsap, SplitText, TITLE_FROM, TITLE_TO} from './motion';
import {UI, useCaseLang} from '../i18n';

/** Case hero: title in large display type, a one-line outcome, role and time chips, and a visual that moves.
    The entrance plays once on load: the title's characters rise the way the homepage's titles do, the copy
    follows, then the visual assembles in depth order ([data-enter="stage" | "back" | "front"]). On desktop the
    visual leans a little toward the pointer. Reduced motion gets one short fade and no movement. */
export default function CaseHero({title, kind, outcome, chips = [], actions, children, reduced = false, stacked = false}) {
  const root = useRef(null), heading = useRef(null);
  const {t} = useCaseLang();

  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    let split = null;
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(node);
      if (reduced) {
        // reduced motion: one quiet fade, nothing moves
        gsap.fromTo(q('[data-hero-item], .v2-hero-title, [data-enter]'), {opacity: 0}, {opacity: 1, duration: .3, ease: 'none'});
        return;
      }
      const tl = gsap.timeline({defaults: {ease: 'v2out'}});
      // only the layers this hero has (a phone stage, or a desktop product shot)
      const add = (sel, from, to, at) => { const els = q(sel); if (els.length) tl.fromTo(els, from, to, at); };
      try {
        split = new SplitText(heading.current, {type: 'words,chars', tag: 'span', wordsClass: 'v2-word', charsClass: 'v2-char', aria: 'none'});
        tl.fromTo(split.chars, TITLE_FROM, {...TITLE_TO, force3D: true}, 0);
      } catch { /* the title simply appears */ }
      add('[data-hero-item]', {opacity: 0, y: 12}, {opacity: 1, y: 0, duration: .45, stagger: .05}, .18);
      add('[data-enter="stage"]', {clipPath: 'inset(100% 0% 0% 0% round 28px)'}, {clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1, ease: 'v2inout'}, .1);
      add('[data-enter="back"]', {opacity: 0, y: -18}, {opacity: 1, y: 0, duration: .9}, .55);
      add('[data-enter="front"]', {opacity: 0, y: 64}, {opacity: 1, y: 0, duration: 1.05}, .68);
      add('[data-enter="note"]', {opacity: 0, y: 8}, {opacity: 1, y: 0, duration: .45}, 1.25);
      // a desktop product shot rises and settles out of a slight tilt, like a screen set down on a table
      add('[data-enter="tilt"]', {opacity: 0, y: 90, rotationX: 16, transformPerspective: 1800, transformOrigin: '50% 0%'},
        {opacity: 1, y: 0, rotationX: 0, duration: 1.3, ease: 'v2out', clearProps: 'transform'}, .35);
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

  const head = <>
    <Go to={PRODUCT_HOME} className="v2-back" data-hero-item=""><span aria-hidden="true">←</span> {t(UI.allWork)}</Go>
    <p className="v2-hero-kind" data-hero-item="">{kind}</p>
    <h1 className="v2-hero-title" aria-label={title}><span ref={heading} aria-hidden="true">{title}</span></h1>
  </>;
  const rest = <>
    <p className="v2-hero-outcome" data-hero-item="">{outcome}</p>
    {chips.length ? <ul className="v2-chips" aria-label="Project facts" data-hero-item="">{chips.map(c => <li key={c}>{c}</li>)}</ul> : null}
    {actions ? <div className="v2-hero-actions" data-hero-item="">{actions}</div> : null}
  </>;
  return <header ref={root} className={`v2-hero${stacked ? ' is-stacked' : ''}`}>
    {stacked
      ? <div className="v2-hero-copy"><div className="v2-hero-head">{head}</div><div className="v2-hero-rest">{rest}</div></div>
      : <div className="v2-hero-copy">{head}{rest}</div>}
    <div className="v2-hero-visual">{children}</div>
  </header>;
}
