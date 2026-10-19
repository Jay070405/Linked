import {Suspense, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {gsap, scrollRootOf} from './motion';

/* Pieces every "try it" module shares (site-spec/INTERACTION-PASS.md): a one-line instruction, a one-line takeaway
   that appears once you've used the module, numbers that morph, and lazy mounting near the viewport. */

/** The one-line instruction above a module. */
export function Ask({children, className = ''}) {
  return <p className={`atw-ask ${className}`}>
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M5.5 2.8 15.6 9l-4.7 1.3 2.6 4.9-2 1.1-2.7-4.9L5.5 14.6Z"/></svg>
    <span>{children}</span>
  </p>;
}

/** The one-line takeaway. Its space is reserved from the start (a hidden copy sets the height), so nothing below it
    moves when it appears; screen readers hear it once, when it is inserted. `instant` skips the entrance (keyboard
    and reduced motion). */
export function Takeaway({show, instant = false, children, className = ''}) {
  return <div className={`atw-takeaway ${className}${instant ? ' is-instant' : ''}`}>
    <p className="atw-takeaway-ghost" aria-hidden="true">{children}</p>
    <p className="atw-takeaway-text" aria-live="polite">{show ? <span>{children}</span> : null}</p>
  </div>;
}

/** Remembers whether the last interaction inside a module came from the keyboard: keyboard-triggered changes don't
    animate. Spread `bind` on the module's root. */
export function useInputMode() {
  const keyed = useRef(false);
  return {
    keyed,
    bind: {onKeyDown: () => { keyed.current = true; }, onPointerDown: () => { keyed.current = false; }},
  };
}

/** A number that morphs to its new value (250 ms, the kit's ease-out) in tabular figures; instant when asked. */
export function Tween({value, format = v => Math.round(v).toLocaleString('en-US'), instant = false, className = ''}) {
  const el = useRef(null), box = useRef({v: value}), tween = useRef(null);
  useLayoutEffect(() => {
    const node = el.current; if (!node) return;
    tween.current?.kill();
    if (instant) { box.current.v = value; node.textContent = format(value); return; }
    tween.current = gsap.to(box.current, {v: value, duration: .25, ease: 'atwout', onUpdate: () => { node.textContent = format(box.current.v); }});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, instant]);
  useEffect(() => () => tween.current?.kill(), []);
  return <span className={`atw-num ${className}`}><span className="atw-sr">{format(value)}</span><span ref={el} aria-hidden="true">{format(box.current.v)}</span></span>;
}

/** True once `ref` comes within `margin` of the viewport (or immediately where IntersectionObserver is missing). */
export function useNear(ref, margin = '600px 0px') {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return undefined;
    if (typeof IntersectionObserver !== 'function') { setNear(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, {root: scrollRootOf(el), rootMargin: margin});
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, near]);
  return near;
}

/** Mounts a lazy module only when its place on the page comes near; until then (and while its code loads) a block of
    `minHeight` holds the space so the page doesn't jump. */
export function Deferred({children, minHeight = 480, id, className = '', label}) {
  const ref = useRef(null);
  const near = useNear(ref);
  return <div ref={ref} id={id} className={`atw-deferred ${className}`} style={near ? undefined : {minHeight}} aria-label={near ? undefined : label}>
    {near ? <Suspense fallback={<div className="atw-deferred-hold" style={{minHeight}}/>}>{children}</Suspense> : null}
  </div>;
}
