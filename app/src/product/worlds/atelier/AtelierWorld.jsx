import {lazy, Suspense, useLayoutEffect, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {Go} from '../../Go';
import {ProductFooter} from '../../ProductIndex';
import {nextCase, PRODUCT_HOME} from '../../content';
import CaseChrome, {zoomable} from './kit/CaseChrome';
import Scrolly from './kit/Scrolly';
import Decisions from './kit/Decisions';
import BeforeAfter, {RoundChanges} from './kit/BeforeAfter';
import LivePrototype from './kit/LivePrototype';
import {Deferred} from './kit/Try';
import {protoUrl, shotSrc} from './kit/Device';
import {ArrowDown, ArrowRight, ArrowUpRight} from './kit/icons';
import {PHONE, useMedia} from './kit/motion';
import Gallery from './Gallery';
import {CHANGES, DECISIONS, fullSrc, HERO, PROBLEM, REFLECTION, REVIEW_NOTE, ROUNDS, STEPS, TASKS, TESTING, thumbSrc, wallSrc, workOf} from './data';
import {largestSharp} from './model';
import './atelier-world.css';

/* D2 Atelier as its own world: "The gallery and the press" (site-spec/WORLDS.md).
   A quiet gallery at night. The hero is one painting under a spotlight; the collection hangs along a wall you walk with
   the scroll; the press prints the chosen painting in four inks and runs the print check by hand; the print hangs on
   the prototype's wall beside its price card. The rest of the case (problem, flow, decisions, rounds, the live
   prototype, testing, reflection) sits in the same room. "Skip the experience" swaps everything for a plain reading
   version with the same content. Reusable pieces are copies of the v2 kit (./kit), restyled here. */

const Press = lazy(() => import('./Press'));
const WallPrice = lazy(() => import('./WallPrice'));
const Plain = lazy(() => import('./Plain'));

const CHAPTERS = [
  {id: 'at-gallery', label: 'The collection'},
  {id: 'at-problem-section', label: 'The problem'},
  {id: 'at-flow', label: 'Five steps to a drop'},
  {id: 'at-press', label: 'The press'},
  {id: 'at-wall', label: 'Hung, then priced'},
  {id: 'at-decisions', label: 'Decisions'},
  {id: 'at-compare', label: 'Round 1 → 2'},
  {id: 'try', label: 'Try it'},
  {id: 'at-testing-section', label: 'Testing'},
  {id: 'at-reflection-section', label: 'Reflection'},
];

const DECISION_ITEMS = DECISIONS.map(d => ({...d,
  visual: d.image ? <img src={d.image.src || shotSrc(d.image.screen)} alt="" loading="lazy" style={{objectPosition: d.image.position}}/> : <InkVisual/>}));

/** The rejected and chosen primary action, drawn rather than described. The blue one is recreated from Jay's notes. */
function InkVisual() {
  return <div className="atw-ink">
    <span className="atw-ink-old">Publish drop</span>
    <span className="atw-ink-new">Publish your drop</span>
  </div>;
}

export default function AtelierWorld({item, reduced}) {
  const root = useRef(null);
  const [plain, setPlain] = useState(false);
  const [artId, setArtId] = useState('blue-hour');
  const [sizeId, setSizeId] = useState(() => largestSharp(workOf('blue-hour')).id);
  const choose = id => { setArtId(id); setSizeId(largestSharp(workOf(id)).id); };
  const next = nextCase(item.slug);

  // switching modes starts the page over, with focus on the first heading of the new mode
  const swap = to => {
    setPlain(to);
    requestAnimationFrame(() => {
      const node = root.current; if (!node) return;
      const scroller = node.closest('.portfolio-page-viewport');
      if (scroller) scroller.scrollTop = 0; else scrollTo(0, 0);
      node.querySelector(to ? '#atw-plain-title' : '#atw-title')?.focus({preventScroll: true});
    });
  };

  return <article ref={root} className={`pp-page atw-world${plain ? ' is-plain' : ''}`} lang="en" data-nav-tone={plain ? 'light' : 'dark'}>
    {plain
      ? <Suspense fallback={<div className="atw-hold"/>}><Plain item={item} next={next} onBack={() => swap(false)}/></Suspense>
      : <World item={item} reduced={reduced} root={root} artId={artId} setArtId={choose} sizeId={sizeId} setSizeId={setSizeId} next={next} onPlain={() => swap(true)}/>}
    <ProductFooter/>
  </article>;
}

function World({item, reduced, root, artId, setArtId, sizeId, setSizeId, next, onPlain}) {
  const phone = useMedia(PHONE);
  const scrollToTry = e => {
    const target = root.current?.querySelector('#try');
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({behavior: reduced || e.detail === 0 ? 'auto' : 'smooth', block: 'start'});
    target.querySelector('button, a')?.focus({preventScroll: true});
  };
  return <>
    <Hero item={item} reduced={reduced} phone={phone} onPlain={onPlain} onTry={scrollToTry}/>
    <CaseChrome root={root} chapters={CHAPTERS} reduced={reduced}/>
    <Gallery reduced={reduced}/>
    <Problem/>
    <Scrolly id="at-flow" reduced={reduced} steps={STEPS.map(s => ({...s, body: <p>{s.text}</p>}))} art="blue-hour" label="The drop flow" title="Atelier prototype, following the steps"
      heading="Five steps to a drop, then share it"
      lede="The artist side is where the product earns its keep. Scroll through a drop; the phone runs the real prototype."/>
    <Deferred minHeight={1800} label="The press, loading">
      <Press reduced={reduced} artId={artId} setArtId={setArtId} sizeId={sizeId} setSizeId={setSizeId}/>
    </Deferred>
    <Deferred minHeight={900} label="The wall and the price card, loading">
      <WallPrice artId={artId} sizeId={sizeId} setSizeId={setSizeId} reduced={reduced}/>
    </Deferred>
    <Decisions id="at-decisions" items={DECISION_ITEMS}
      heading="What I chose, and what I tried first"
      lede="Five choices from three rounds of critique. Each label shows the choice; open it to see what it replaced."/>
    <BeforeAfter id="at-compare" reduced={reduced} pairs={ROUNDS} label="Compare round 1 with round 2"
      heading="Round 1 → Round 2"
      lede="Round 2 came out of a design review. Pick a screen and drag across the phone to compare the two rounds.">
      <p className="atw-review-note"><span><b>A model-assisted design review.</b> {REVIEW_NOTE}</span></p>
      <RoundChanges items={CHANGES}/>
    </BeforeAfter>
    <LivePrototype id="try" reduced={reduced} tasks={TASKS} start={{screen: 'onboarding', art: 'blue-hour'}}
      heading="Try it yourself"
      lede="This is the same prototype, at full size. Pick a task; the phone opens on the right screen."
      phoneLede="This is the same prototype. Each task opens it full screen, on the screen where the task starts."
      note="It runs in your browser only: no account, no payment, no shipping. Drafts and test orders stay in this browser until you reset."/>
    <Testing/>
    <Reflection/>
    <Next item={next}/>
  </>;
}

/* ---------- the entrance: one painting under a light ---------- */
function Hero({item, reduced, phone, onPlain, onTry}) {
  const ref = useRef(null);
  const w = workOf('blue-hour'), top = largestSharp(w);
  // the one orchestrated moment: the lights come on, then the words
  useLayoutEffect(() => {
    const node = ref.current; if (!node) return undefined;
    if (reduced) { node.classList.add('is-on', 'is-instant'); return undefined; }
    const t = requestAnimationFrame(() => requestAnimationFrame(() => node.classList.add('is-on')));
    return () => cancelAnimationFrame(t);
  }, [reduced]);
  return <header ref={ref} className="atw-hero">
    <div className="atw-hero-top">
      <Go to={PRODUCT_HOME} className="atw-back"><span aria-hidden="true">←</span> All product work</Go>
      <button type="button" className="atw-skip" onClick={onPlain}>Skip the experience: read it plainly</button>
    </div>
    <div className="atw-hero-grid">
      <div className="atw-hero-copy">
        <p className="atw-kind" data-in="1">{item.kind}</p>
        <h1 id="atw-title" className="atw-title" tabIndex={-1} data-in="0">{HERO.title}</h1>
        <p className="atw-outcome" data-in="2">{HERO.outcome}</p>
        <ul className="atw-credits" aria-label="Project facts" data-in="3">{HERO.chips.map(c => <li key={c}>{c}</li>)}</ul>
        <div className="atw-actions" data-in="4">
          {phone
            ? <a className="atw-cta" href={protoUrl('onboarding')} target="_blank" rel="noopener"><span>Open the prototype</span><ArrowUpRight/><span className="atw-sr"> (opens in a new tab)</span></a>
            : <a className="atw-cta" href="#try" onClick={onTry}><span>Try the prototype</span><ArrowDown/></a>}
          <a className="atw-link" href="#at-gallery"><span className="atw-link-text">Walk the gallery</span></a>
        </div>
      </div>
      <div className="atw-hero-work">
        <span className="atw-hero-cone" aria-hidden="true"/>
        <span className="atw-hero-pool" aria-hidden="true"/>
        <div className="atw-hero-hang">
          <div className="atw-mat is-hero" {...zoomable(`${w.title}, one of my paintings: ${w.about.toLowerCase()}`, {src: fullSrc(w.id), w: w.originalWidth, h: w.originalHeight})}>
            <img src={wallSrc(w.id)} width={1600} height={844} alt="" fetchPriority="high" decoding="async"/>
          </div>
          <div className="atw-label is-hero">
            <p className="atw-label-title">{w.title}</p>
            <p className="atw-label-by">Jay Lin</p>
            <p className="atw-label-about">Print, {top.w} × {top.h} in, the largest this file prints sharp</p>
            <p className="atw-label-price">$38</p>
          </div>
        </div>
      </div>
    </div>
  </header>;
}

/* ---------- the problem: four tools and the seams between them ---------- */
function Problem() {
  const art = id => <img src={thumbSrc(id)} alt="" loading="lazy" decoding="async"/>;
  const sketches = [
    <span key="post" className="atw-tool-sketch is-post">{art('return')}<i/><i/></span>,
    <span key="shop" className="atw-tool-sketch is-shop">{art('spring')}{art('clouds')}{art('quiet-gate')}{art('between')}</span>,
    <span key="print" className="atw-tool-sketch is-print">{art('red-planet')}<i>18 × 24 in</i></span>,
    <span key="dm" className="atw-tool-sketch is-dm"><i/><i/><i/></span>,
  ];
  return <section id="at-problem-section" className="atw-problem" aria-labelledby="at-problem">
    <div className="atw-problem-copy">
      <h2 id="at-problem" className="atw-h2">{PROBLEM.heading}</h2>
      <div className="atw-prose">{PROBLEM.paragraphs.map(p => <p key={p.slice(0, 20)}>{p}</p>)}</div>
      <p className="atw-hyp"><Ev label="Hypothesis"/><span>{PROBLEM.hypothesis}</span></p>
    </div>
    <aside className="atw-slot" aria-label="Interview quotes, not collected yet">
      <p className="atw-slot-badge">Placeholder</p>
      <p>{PROBLEM.quote}</p>
    </aside>
    <figure className="atw-seams">
      <ol className="atw-seams-row">
        {PROBLEM.tools.map((t, i) => [
          <li key={t.name} className="atw-tool">{sketches[i]}<b>{t.name}</b><span>{t.role}</span></li>,
          PROBLEM.seams[i] ? <li key={PROBLEM.seams[i]} className="atw-seam"><span>{PROBLEM.seams[i]}</span></li> : null,
        ])}
      </ol>
      <figcaption className="atw-caption"><Ev label="Hypothesis"/> <span>{PROBLEM.seamsNote}</span></figcaption>
    </figure>
  </section>;
}

function Testing() {
  return <section id="at-testing-section" className="atw-testing" aria-labelledby="at-testing">
    <div className="atw-room-head">
      <h2 id="at-testing" className="atw-h2">Testing comes next</h2>
      <p className="atw-lede">Nothing here has been tested with artists yet. This is the plan, and the space the results will fill.</p>
    </div>
    <div className="atw-testing-grid">
      <div className="atw-testing-plan">
        <h3 className="atw-h3">Plan for test day</h3>
        <ul className="atw-list">{TESTING.plan.map(p => <li key={p}>{p}</li>)}</ul>
        <h3 className="atw-h3">Hypotheses to check</h3>
        <ul className="atw-hypotheses">{TESTING.hypotheses.map(h => <li key={h}><Ev label="Hypothesis"/><span>{h}</span></li>)}</ul>
      </div>
      <div className="atw-results" aria-label="Results, not collected yet">
        <p className="atw-slot-badge">Placeholder: results after test day</p>
        <dl>{TESTING.results.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        <p className="atw-results-note">Each result will sit next to the change it caused.</p>
      </div>
    </div>
  </section>;
}

function Reflection() {
  return <section id="at-reflection-section" className="atw-reflection" aria-labelledby="at-reflection">
    <h2 id="at-reflection" className="atw-h2">Reflection</h2>
    <div className="atw-reflection-grid">
      {REFLECTION.map(r => <div key={r.title}><h3 className="atw-h3">{r.title}</h3><p>{r.text}</p></div>)}
    </div>
  </section>;
}

function Next({item}) {
  return <nav className="atw-next" aria-label="Next project">
    <Go to={`${PRODUCT_HOME}/${item.slug}`} className="atw-next-link">
      <span className="atw-next-text">
        <span className="atw-next-label">Next project</span>
        <span className="atw-next-title">{item.title}</span>
        <span className="atw-next-sub">{item.subtitle || item.summary}</span>
        <span className="atw-next-go" aria-hidden="true"><ArrowRight width={20} height={20}/></span>
      </span>
      {item.thumb?.src ? <span className="atw-next-media"><img src={item.thumb.src} width={item.thumb.width} height={item.thumb.height} alt="" loading="lazy" decoding="async"/></span> : null}
    </Go>
  </nav>;
}

