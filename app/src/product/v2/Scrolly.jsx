import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {gsap, PHONE, ScrollTrigger, scrollerOf, useMedia} from './motion';
import {Phone, ProtoScreen} from './Device';

/** Sticky scrollytelling. Desktop: the phone stays pinned beside the steps; as each step crosses the middle of the
    viewport the live prototype moves to that step's screen, and the rail shows where you are (its labels jump to a
    step). Phones: the same steps as a horizontal swipe gallery of screenshots with its own rail. */
export default function Scrolly({id, steps, heading, lede, art, reduced = false, label = 'Steps'}) {
  const phone = useMedia(PHONE);
  return <section className="v2-scrolly" aria-labelledby={`${id}-title`}>
    <div className="v2-section-head" data-reveal="">
      <h2 id={`${id}-title`} className="v2-h2">{heading}</h2>
      {lede ? <p className="v2-lede">{lede}</p> : null}
    </div>
    {phone ? <Swipe steps={steps} reduced={reduced} label={label}/> : <Pinned steps={steps} art={art} reduced={reduced} label={label}/>}
  </section>;
}

function StepText({step, i, n}) {
  return <>
    <p className="v2-step-n">Step {i + 1} of {n}</p>
    <h3 className="v2-step-title">{step.title}</h3>
    <div className="v2-step-body">{step.body}</div>
  </>;
}

function Pinned({steps, art, reduced, label}) {
  const root = useRef(null), list = useRef(null), fill = useRef(null);
  const [active, setActive] = useState(0);

  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const ctx = gsap.context(() => {
      const scroller = scrollerOf(node);
      node.querySelectorAll('[data-step]').forEach((el, i) => ScrollTrigger.create({
        trigger: el, scroller, start: 'top 58%', end: 'bottom 58%',
        onToggle: self => { if (self.isActive) setActive(i); },
      }));
      gsap.fromTo(fill.current, {scaleY: 0}, {
        scaleY: 1, ease: 'none',
        scrollTrigger: {trigger: list.current, scroller, start: 'top 58%', end: 'bottom 58%', scrub: reduced ? true : .35},
      });
    }, node);
    return () => ctx.revert();
  }, [reduced, steps]);

  const jump = i => root.current?.querySelector(`[data-step="${i}"]`)?.scrollIntoView({behavior: reduced ? 'auto' : 'smooth', block: 'center'});

  return <div ref={root} className="v2-pinned">
    <ol ref={list} className="v2-steps">
      {steps.map((step, i) => <li key={step.id} data-step={i} className={`v2-step${i === active ? ' is-active' : ''}`} aria-current={i === active ? 'step' : undefined}>
        <StepText step={step} i={i} n={steps.length}/>
      </li>)}
    </ol>
    <div className="v2-pin">
      <div className="v2-pin-inner">
        <nav className="v2-rail" aria-label={label}>
          <span className="v2-rail-track" aria-hidden="true"><i ref={fill}/></span>
          <ol>{steps.map((step, i) => <li key={step.id}>
            <button type="button" className={i === active ? 'is-active' : ''} aria-current={i === active ? 'step' : undefined} onClick={() => jump(i)}>
              <span className="v2-rail-dot" aria-hidden="true"/>{step.label}
            </button>
          </li>)}</ol>
        </nav>
        <div className="v2-pin-device">
          <Phone label={`Prototype showing step ${active + 1}: ${steps[active].label}`}>
            <ProtoScreen screen={steps[active].screen} art={art} load="near" reduced={reduced} title="Atelier prototype, following the steps"
              alt={steps[active].alt || `${steps[active].label} screen`}/>
          </Phone>
          <p className="v2-pin-note">The live prototype, moved by your scroll</p>
        </div>
      </div>
    </div>
  </div>;
}

function Swipe({steps, reduced, label}) {
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
  return <div className="v2-swipe">
    <ol ref={track} className="v2-swipe-track" aria-label={`${label}, swipe sideways`} tabIndex={0}>
      {steps.map((step, i) => <li key={step.id} data-step={i} className="v2-swipe-card">
        <Phone><ProtoScreen screen={step.screen} load="never" reduced={reduced} alt={step.alt || `${step.label} screen`}/></Phone>
        <div className="v2-swipe-text"><StepText step={step} i={i} n={steps.length}/></div>
      </li>)}
    </ol>
    <div className="v2-swipe-rail" role="group" aria-label={`${label}: go to a step`}>
      {steps.map((step, i) => <button key={step.id} type="button" className={i === active ? 'is-active' : ''} aria-current={i === active ? 'step' : undefined}
        aria-label={`Step ${i + 1}: ${step.label}`} onClick={() => go(i)}><i/></button>)}
    </div>
  </div>;
}
