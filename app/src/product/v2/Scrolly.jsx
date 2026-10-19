import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {gsap, PHONE, ScrollTrigger, scrollerOf, useMedia} from './motion';
import {ATELIER_KIT, Browser, Phone, ProtoScreen} from './Device';
import {zoomable} from './zoom';

/** Sticky scrollytelling. Desktop: the device stays pinned beside the steps; as each step crosses the middle of the
    viewport the live prototype moves to that step's state, and the rail shows where you are (its labels jump to a
    step). With a camera per step, a desktop prototype is also framed on the part that matters, and the frame glides
    there. Phones: the same steps as a horizontal swipe gallery of screenshots with its own rail.
    frame: 'phone' (Atelier) or 'browser' (a desktop editor). */
export function Scrolly({id, steps, heading, lede, art, kit = ATELIER_KIT, frame = 'phone', title = 'Prototype, following the steps', note = 'The live prototype, moved by your scroll', reduced = false, label = 'Steps'}) {
  const phone = useMedia(PHONE);
  const props = {steps, art, kit, frame, title, note, reduced, label};
  return <section id={id} className="v2-scrolly" aria-labelledby={`${id}-title`}>
    <div className="v2-section-head" data-reveal="">
      <h2 id={`${id}-title`} className="v2-h2">{heading}</h2>
      {lede ? <p className="v2-lede">{lede}</p> : null}
    </div>
    {phone ? <Swipe {...props}/> : <Pinned {...props}/>}
  </section>;
}
export default Scrolly;

function StepText({step, i, n}) {
  return <>
    <p className="v2-step-n">Step {i + 1} of {n}</p>
    <h3 className="v2-step-title">{step.title}</h3>
    <div className="v2-step-body">{step.body}</div>
  </>;
}

function Device({frame, label, address, children}) {
  return frame === 'browser' ? <Browser label={label} address={address}>{children}</Browser> : <Phone label={label}>{children}</Phone>;
}

function Pinned({steps, art, kit, frame, title, note, reduced, label}) {
  const root = useRef(null), list = useRef(null), fill = useRef(null);
  const [active, setActive] = useState(0);
  const wide = frame === 'browser';

  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const ctx = gsap.context(() => {
      const scroller = scrollerOf(node);
      node.querySelectorAll('[data-step]').forEach((el, i) => ScrollTrigger.create({
        trigger: el, scroller, start: 'top 58%', end: 'bottom 58%',
        onToggle: self => { if (self.isActive) setActive(i); },
      }));
      gsap.fromTo(fill.current, wide ? {scaleX: 0} : {scaleY: 0}, {
        ...(wide ? {scaleX: 1} : {scaleY: 1}), ease: 'none',
        scrollTrigger: {trigger: list.current, scroller, start: 'top 58%', end: 'bottom 58%', scrub: reduced ? true : .35},
      });
    }, node);
    return () => ctx.revert();
  }, [reduced, steps, wide]);

  // a pointer click glides there; Enter or Space (event.detail 0) jumps, like any keyboard action
  const jump = (i, e) => root.current?.querySelector(`[data-step="${i}"]`)?.scrollIntoView({behavior: reduced || e?.detail === 0 ? 'auto' : 'smooth', block: 'center'});
  const step = steps[active];

  return <div ref={root} className={`v2-pinned${wide ? ' is-wide' : ''}`}>
    <ol ref={list} className="v2-steps">
      {steps.map((s, i) => <li key={s.id} data-step={i} className={`v2-step${i === active ? ' is-active' : ''}`} aria-current={i === active ? 'step' : undefined}>
        <StepText step={s} i={i} n={steps.length}/>
      </li>)}
    </ol>
    <div className="v2-pin">
      <div className="v2-pin-inner">
        <nav className={`v2-rail${wide ? ' is-horizontal' : ''}`} aria-label={label}>
          <span className="v2-rail-track" aria-hidden="true"><i ref={fill}/></span>
          <ol>{steps.map((s, i) => <li key={s.id}>
            <button type="button" className={i === active ? 'is-active' : ''} aria-current={i === active ? 'step' : undefined} onClick={e => jump(i, e)}>
              <span className="v2-rail-dot" aria-hidden="true"/>{s.label}
            </button>
          </li>)}</ol>
        </nav>
        <div className="v2-pin-device">
          <Device frame={frame} address={kit.address} label={`Prototype showing step ${active + 1}: ${step.label}`}>
            <ProtoScreen kit={kit} screen={step.screen} camera={step.camera} art={art} load="near" reduced={reduced} title={title}
              alt={step.alt || `${step.label} screen`}/>
          </Device>
          {note ? <p className="v2-pin-note">{note}</p> : null}
        </div>
      </div>
    </div>
  </div>;
}

function Swipe({steps, art, kit, frame, reduced, label}) {
  const track = useRef(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const el = track.current; if (!el) return undefined;
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) setActive(Number(e.target.dataset.step)); }), {root: el, threshold: .6});
    el.querySelectorAll('[data-step]').forEach(li => io.observe(li));
    return () => io.disconnect();
  }, [steps]);
  const go = i => {
    const li = track.current?.querySelector(`[data-step="${i}"]`);
    if (li) track.current.scrollTo({left: li.offsetLeft - track.current.offsetLeft, behavior: reduced ? 'auto' : 'smooth'});
  };
  return <div className={`v2-swipe${frame === 'browser' ? ' is-wide' : ''}`}>
    <ol ref={track} className="v2-swipe-track" aria-label={`${label}, swipe sideways`} tabIndex={0}>
      {steps.map((step, i) => <li key={step.id} data-step={i} className="v2-swipe-card">
        <div className="v2-swipe-zoom" {...zoomable(step.alt || step.label, {src: kit.shot(step.screen), w: kit.shotW, h: kit.shotH})}>
          <Device frame={frame} address={kit.address}><ProtoScreen kit={kit} screen={step.screen} camera={step.phoneCamera || step.camera} art={art} load="never" reduced={reduced} alt={step.alt || `${step.label} screen`}/></Device>
        </div>
        <div className="v2-swipe-text"><StepText step={step} i={i} n={steps.length}/></div>
      </li>)}
    </ol>
    <div className="v2-swipe-rail" role="group" aria-label={`${label}: go to a step`}>
      {steps.map((step, i) => <button key={step.id} type="button" className={i === active ? 'is-active' : ''} aria-current={i === active ? 'step' : undefined}
        aria-label={`Step ${i + 1}: ${step.label}`} onClick={() => go(i)}><i/></button>)}
    </div>
  </div>;
}
