import {useEffect, useRef, useState} from 'react';
import {FINE, gsap} from './motion';

/** A small "View" label that trails the pointer over anything marked [data-cursor] inside `root`.
    Desktop pointers only; with reduced motion it sits beside the pointer without trailing. Purely visual:
    the link under it already says where it goes. */
export default function CursorLabel({root, reduced = false}) {
  const label = useRef(null);
  const [text, setText] = useState(null);
  useEffect(() => {
    const scope = root.current, el = label.current;
    if (!scope || !el || !matchMedia(FINE).matches) return undefined;
    const lag = reduced ? .001 : .42;
    const x = gsap.quickTo(el, 'x', {duration: lag, ease: 'power3'}), y = gsap.quickTo(el, 'y', {duration: lag, ease: 'power3'});
    let on = null;
    const move = e => {
      const target = e.target.closest?.('[data-cursor]');
      const next = target && scope.contains(target) ? target.getAttribute('data-cursor') : null;
      if (next !== on) {
        if (next && !on) { gsap.set(el, {x: e.clientX, y: e.clientY}); }
        on = next; setText(next);
      }
      x(e.clientX); y(e.clientY);
    };
    const leave = () => { on = null; setText(null); };
    scope.addEventListener('pointermove', move, {passive: true});
    scope.addEventListener('pointerleave', leave);
    addEventListener('scroll', leave, {passive: true, capture: true});
    return () => { scope.removeEventListener('pointermove', move); scope.removeEventListener('pointerleave', leave); removeEventListener('scroll', leave, {capture: true}); };
  }, [root, reduced]);
  return <div ref={label} className={`v2-cursor${text ? ' is-on' : ''}`} aria-hidden="true"><span>{text || 'View'}</span></div>;
}
