import {useLayoutEffect, useRef, useState} from 'react';
import {Go} from '../Go';
import {Ev} from '../CaseKit';
import {ProductFooter} from '../ProductIndex';
import {nextCase} from '../content';
import {WiringGrid} from '../charts';
import {LayersCompare, Pipeline, TestSet} from '../figures';
import CaseHero from '../v2/CaseHero';
import NumberStrip from '../v2/NumberStrip';
import Scrolly from '../v2/Scrolly';
import BeforeAfter from '../v2/BeforeAfter';
import LivePrototype from '../v2/LivePrototype';
import NextProject from '../v2/NextProject';
import CursorLabel from '../v2/CursorLabel';
import {Browser, ProtoScreen, RFA_KIT, rfaShot} from '../v2/Device';
import {AtelierTileArt} from '../v2/TileArt';
import {ArrowDown, ArrowRight} from '../v2/icons';
import {FINE, gsap, PHONE, ScrollTrigger, scrollerOf, useMedia, useReveals} from '../v2/motion';
import '../v2/v2.css';
import './rfa.css';

// Sources: cases/p2-design-to-code/draft.md and p2-benchmark/results/results.md (37 scored builds, Oct 19 2026);
// cases/pd-ready-for-agents/BRIEF.md and pd-prototype/README.md. Concept work, not affiliated with Figma.
// Nothing in the design chapter has been tested with designers yet; Jay runs the sessions next.

const A = '/assets/product/ready-for-agents/';

const NUMBERS = [
  {value: 37, label: 'Agent builds scored', note: '24 in round 1, including the ablation, and 13 round-2 repeats so far'},
  {value: 9, unit: 'of 9', label: 'Followed every token change', note: 'Builds from a raw file with only variables added'},
  {value: 50, unit: '%', label: 'Median that reached the code without variables', note: '18 builds; none followed the whole change'},
];

// Theme propagation per build (share of a 4-token change that reached the code), from results.md.
const PROPAGATION = [
  {id: 'L0', name: 'L0 Raw', values: [67, 67, 50, 25, 47, 50, 25, 50, 67], bound: false},
  {id: 'L1', name: 'L1 Structured', values: [67, 67, 50, 25, 50, 25, 25, 25, 67], bound: false},
  {id: 'L0V', name: 'L0V Raw + variables', values: Array(9).fill(100), bound: true},
  {id: 'L2', name: 'L2 Systematized', values: Array(10).fill(100), bound: true},
];
const median = v => { const s = [...v].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// Pre-registered measures, medians of all scored builds per level (n = 9, 9, 10).
const FLAT = [
  {name: 'Looks like the Figma export (SSIM)', values: ['0.983', '0.983', '0.984'], share: [.983, .983, .984]},
  {name: 'Passes the resize checks', values: ['100%', '100%', '100%'], share: [1, 1, 1]},
  {name: 'Absolutely positioned elements', values: ['2', '2', '2'], share: [.4, .4, .4]},
  {name: 'Colors routed through CSS variables', values: ['97%', '94%', '97%'], share: [.97, .94, .97]},
];

// Camera rects are in the editor's own 1440 x 900 pixels.
const STEPS = [
  {id: 'row', screen: 'row', label: 'Panel row', title: 'Selecting a frame says what an agent would miss',
    camera: {x: 420, y: 40, w: 1020}, phoneCamera: {x: 1010, y: 110, w: 430},
    alt: 'The properties panel with an Agent handoff row: 12 raw values, 10 match variables, and a Review button',
    body: <p>Agent handoff sits under the frame header, above Position, so it’s there the moment you select a frame. It counts distinct raw values: 12 raw values, 10 match variables. No score.</p>},
  {id: 'review', screen: 'review', label: 'Review', title: 'Review opens next to the row',
    camera: {x: 300, y: 118, w: 1140}, phoneCamera: {x: 870, y: 140, w: 430},
    alt: 'The review popover listing raw colors with the variable each one matches',
    body: <p>A popover anchored to the row groups colors, spacing and radius. The two values that need a decision sit on top, and rows don’t move once they resolve.</p>},
  {id: 'hover', screen: 'hover-c-white', label: 'Hover outline', title: 'Hover a value to see where it lives',
    camera: {x: 380, y: 40, w: 1060}, phoneCamera: {x: 410, y: 60, w: 470},
    alt: 'Hovering the FFFFFF row outlines three print cards on the canvas, with a 3 layers badge',
    body: <p>Each row outlines its layers on the canvas, with a count badge in one fixed spot. That’s direction B, folded into A.</p>},
  {id: 'choice', screen: 'choice', label: 'Needs a choice', title: 'Ask when two variables match',
    camera: {x: 760, y: 128, w: 680}, phoneCamera: {x: 876, y: 260, w: 330},
    alt: 'FFFFFF matches color/surface and color/on-accent; color/surface is chosen and remembered for this file',
    body: <p>#FFFFFF is both color/surface and color/on-accent. The hint states facts from the file, nothing is preselected, and the answer is remembered for that value.</p>},
  {id: 'bound', screen: 'bound', label: 'Bind and undo', title: 'Bind in one step, undo in one step',
    camera: {x: 560, y: 350, w: 880}, phoneCamera: {x: 640, y: 600, w: 560},
    alt: 'A toast reads 10 values bound with an Undo button; the bound rows show a check',
    body: <p>Bind applies every exact match as one history entry. The toast’s Undo and ⌘Z both take it back.</p>},
  {id: 'ready', screen: 'ready', label: 'Ready', title: 'Quiet when it’s fine',
    camera: {x: 760, y: 0, w: 680}, phoneCamera: {x: 1180, y: 60, w: 260},
    alt: 'The Agent handoff section collapsed to one line: Ready for agents, with a check',
    body: <p>Once #FFFFFF has a variable and the gold is left raw on purpose, the section folds into one calm line: Ready for agents.</p>},
  {id: 'agent', screen: 'agent', label: 'Agents tab', title: 'The agent hears the same counts',
    camera: {x: 0, y: 0, w: 960}, phoneCamera: {x: 64, y: 140, w: 400},
    alt: 'The Agents tab: the readiness note names the 2 raw colors and asks which variable the print cards should use',
    body: <p>In the Agents tab, the note uses the designer’s words: 2 raw colors, which ones, and a question instead of an invented token name.</p>},
];

// Each principle shows the piece of the prototype that passes its test, at the editor's own size (dw x dh CSS px).
const PRINCIPLES = [
  {title: 'Say what the agent will miss, not a score', test: '“12 raw values, 10 match variables.” No grades, and no percentage without a count.', img: 'principle-row.webp', dw: 239, dh: 82},
  {title: 'Fix it where it lives, in one undo', test: 'No new window or mode. Binding is one action and one ⌘Z.', img: 'principle-toast.webp', dw: 200, dh: 58},
  {title: 'Never guess between equal options', test: 'A value that matches two variables gets asked about once, and the answer is remembered.', img: 'principle-choice.webp', dw: 314, dh: 118},
  {title: 'Quiet when it’s fine', test: 'A ready frame shows one calm line, nothing alarming.', img: 'principle-ready.webp', dw: 239, dh: 100},
  {title: 'Same words on both sides', test: 'The panel and the agent’s note use the same counts and names.', img: 'principle-words.webp', dw: 236, dh: 98},
];

const DIRECTIONS = [
  {id: 'a', name: 'Properties panel section', idea: 'A compact Agent handoff row for the selected frame; Review opens a popover anchored to it.',
    plus: ['Visible every time a frame is selected, with no new surface to learn', 'Fix values where they live, in one undo'],
    minus: ['One row in a dense panel is easy to scroll past'], role: 'The home', chosen: true},
  {id: 'b', name: 'Canvas overlay', idea: 'A toggle outlines every raw-value layer and labels it on the canvas.',
    plus: ['Spatial: you see exactly where each raw value sits'],
    minus: ['Noisy fast: 9 labels already crowd one phone screen', 'Competes with selection, hover and annotations'], role: 'Folded into A as the hover outline'},
  {id: 'c', name: 'Ready-for-dev checklist', idea: 'Marking a section ready for dev runs the same check as one step of a checklist.',
    plus: ['Fits a ritual teams already have at handoff'],
    minus: ['Late: people have stopped editing by then', 'Only reaches teams that use dev status'], role: 'Reuses A’s row in the dev status flow'},
];

const TASKS = [
  {id: 'miss', screen: 'row', title: 'Find what an agent would miss on the Home frame', hint: 'Read the Agent handoff row in the right panel, then open Review.'},
  {id: 'bind', screen: 'review', title: 'Bind every exact match, then undo it', hint: 'Bind 10 values, then press Undo in the toast or ⌘Z.'},
  {id: 'white', screen: 'review', title: 'Decide what #FFFFFF should be', hint: 'It matches two variables; the line under the choice says where each one is used.'},
  {id: 'agent', screen: 'after', title: 'Check what the agent will be told', hint: 'Open Agents in the left navigation bar.'},
];

/** Result 1: the pre-registered layout checks came out the same at every level. Bars grow once, together. */
function FlatResult({reduced}) {
  const root = useRef(null);
  useLayoutEffect(() => {
    const node = root.current;
    if (!node || reduced) return undefined;
    const ctx = gsap.context(() => {
      gsap.from(node.querySelectorAll('.rfa-flat-bar i'), {scaleX: 0, duration: .9, ease: 'v2out', stagger: .03,
        scrollTrigger: {trigger: node, scroller: scrollerOf(node), start: 'top 80%', once: true}});
    }, node);
    return () => ctx.revert();
  }, [reduced]);
  return <figure ref={root} className="rfa-flat" data-reveal="">
    <div className="rfa-flat-grid" role="table" aria-label="Pre-registered measures, median per level">
      <div role="row" className="rfa-flat-head"><span role="columnheader">Median per level</span>{['L0 Raw', 'L1 Structured', 'L2 Systematized'].map(l => <span key={l} role="columnheader">{l}</span>)}</div>
      {FLAT.map(row => <div role="row" key={row.name} className="rfa-flat-row">
        <span role="rowheader">{row.name}</span>
        {row.values.map((v, i) => <span role="cell" key={i} className="rfa-flat-bar"><i style={{'--w': row.share[i]}} aria-hidden="true"/><b>{v}</b></span>)}
      </div>)}
    </div>
    <figcaption className="v2-caption"><Ev label="Measured"/><span>Medians of 9, 9 and 10 builds. These checks hit a ceiling, so the honest reading is “no detectable difference”, not “identical”.</span></figcaption>
  </figure>;
}

/** The ablation as every build at once: how much of an injected token change reached each build's code. */
function PropagationDots({reduced}) {
  const root = useRef(null);
  const W = 760, H = 372, top = 48, bottom = 300, col = 160, x0 = 120;
  const y = v => bottom - (bottom - top) * v / 100;
  useLayoutEffect(() => {
    const node = root.current;
    if (!node || reduced) return undefined;
    const ctx = gsap.context(() => {
      const dots = node.querySelectorAll('.rfa-dot');
      gsap.from(dots, {attr: {cy: bottom}, opacity: 0, duration: .9, ease: 'v2out', stagger: {each: .02, from: 'start'},
        scrollTrigger: {trigger: node, scroller: scrollerOf(node), start: 'top 75%', once: true}});
    }, node);
    return () => ctx.revert();
  }, [reduced]);
  return <figure ref={root} className="rfa-dots" data-reveal="">
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="rfa-dots-title">
      <title id="rfa-dots-title">Share of a four-token change that reached the code, per build. Without variables, L0 median 50% and L1 median 50%, no build above 67%. With variables bound, all 9 L0V builds and all 10 L2 builds at 100%.</title>
      {[0, 25, 50, 75, 100].map(v => <g key={v} className="rfa-dots-grid"><path d={`M${x0 - 20} ${y(v)} H${W - 10}`}/><text x={x0 - 30} y={y(v) + 4}>{v}%</text></g>)}
      <path className="rfa-dots-split" d={`M${x0 + col * 2 - 10} ${top - 34} V${bottom + 8}`}/>
      <text className="rfa-dots-tag" x={x0 + col * 2 + 4} y={top - 22}>Variables bound</text>
      {PROPAGATION.map((g, gi) => {
        const cx = x0 + 50 + gi * col, m = median(g.values);
        const counts = {};
        return <g key={g.id} className={`rfa-dots-group${g.bound ? ' is-bound' : ''}`}>
          <path className="rfa-dots-median" d={`M${cx - 44} ${y(m)} H${cx + 44}`}/>
          {g.values.map((v, i) => {
            const k = (counts[v] = (counts[v] || 0) + 1) - 1, spread = g.values.filter(o => o === v).length;
            const dx = (k - (spread - 1) / 2) * 9.5;
            return <circle key={i} className="rfa-dot" cx={cx + dx} cy={y(v)} r="5.5"/>;
          })}
          <text className="rfa-dots-name" x={cx} y={bottom + 30}>{g.name}</text>
          <text className="rfa-dots-med" x={cx} y={bottom + 50}>median {m}%</text>
        </g>;
      })}
    </svg>
    <figcaption className="v2-caption"><Ev label="Measured"/><span>Each dot is one build: how much of a four-token change, injected after the build, reached its code. An exploratory measure I added after round 1’s first results.</span></figcaption>
  </figure>;
}

function Principles() {
  return <ul className="rfa-principles">
    {PRINCIPLES.map(p => <li key={p.title} className="rfa-principle" data-reveal="">
      <div className="rfa-principle-img" aria-hidden="true"><img src={A + p.img} width={Math.round(p.dw * 1.25)} height={Math.round(p.dh * 1.25)} style={{width: p.dw}} alt="" loading="lazy" decoding="async"/></div>
      <h3 className="rfa-principle-title">{p.title}</h3>
      <p className="rfa-principle-test">{p.test}</p>
    </li>)}
  </ul>;
}

function Directions() {
  return <div className="rfa-directions">
    <ul className="rfa-direction-list">
      {DIRECTIONS.map(d => <li key={d.id} className={`rfa-direction${d.chosen ? ' is-chosen' : ''}`} data-reveal="">
        <div className="rfa-direction-img"><img src={`${A}explore-${d.id}.webp`} width="960" height="998" alt={`Direction ${d.id.toUpperCase()}, ${d.name}, on the same Home frame`} loading="lazy" decoding="async"/></div>
        <p className="rfa-direction-tag"><b>{d.id.toUpperCase()}</b>{d.name}</p>
        <p className="rfa-direction-idea">{d.idea}</p>
        <ul className="rfa-direction-pm">
          {d.plus.map(t => <li key={t} className="is-plus"><span className="v2-sr">Strength: </span>{t}</li>)}
          {d.minus.map(t => <li key={t} className="is-minus"><span className="v2-sr">Weakness: </span>{t}</li>)}
        </ul>
        <p className="rfa-direction-role">{d.role}</p>
      </li>)}
    </ul>
    <p className="rfa-decision" data-reveal=""><Ev label="Hypothesis"/><span><b>The call so far:</b> A is the home. B moves inside A, so hovering a row outlines its layers on the canvas. C reuses A’s row when a section is marked ready for dev. The five sessions decide whether it holds.</span></p>
  </div>;
}

/** The same review state in both themes. It flips to dark once as it comes into view, then the switch is yours. */
function ThemeMoment({reduced}) {
  const root = useRef(null);
  const [dark, setDark] = useState(false);
  const touched = useRef(false);
  useLayoutEffect(() => {
    const node = root.current;
    if (!node || reduced) return undefined;
    const st = ScrollTrigger.create({trigger: node, scroller: scrollerOf(node), start: 'top 55%', once: true,
      onEnter: () => setTimeout(() => { if (!touched.current) setDark(true); }, 500)});
    return () => st.kill();
  }, [reduced]);
  const pick = v => { touched.current = true; setDark(v); };
  return <section ref={root} className="rfa-theme" aria-labelledby="rfa-theme-title">
    <div className="rfa-theme-copy" data-reveal="">
      <h3 id="rfa-theme-title" className="rfa-h3">Light and dark from the same tokens</h3>
      <p>Every surface uses Figma’s published theme tokens, so the dark theme needed no second design. One deliberate change: blue fills that carry text use #0A78D1, for 4.6:1 contrast instead of 3.0:1.</p>
      <div className="rfa-switch" role="group" aria-label="Theme">
        <button type="button" aria-pressed={!dark} onClick={() => pick(false)}>Light</button>
        <button type="button" aria-pressed={dark} onClick={() => pick(true)}>Dark</button>
      </div>
    </div>
    <div className="rfa-theme-shot" data-reveal="">
      <Browser>
        <div className="rfa-theme-stack">
          <img src={rfaShot('review')} width="1800" height="1125" alt="The review popover in the light theme" className={dark ? '' : 'is-on'} loading="lazy" decoding="async"/>
          <img src={rfaShot('review-dark')} width="1800" height="1125" alt="The review popover in the dark theme" className={dark ? 'is-on' : ''} loading="lazy" decoding="async"/>
        </div>
      </Browser>
    </div>
  </section>;
}

function AgentSide() {
  return <section className="rfa-agent" aria-labelledby="rfa-agent-title">
    <div className="v2-section-head" data-reveal="">
      <h3 id="rfa-agent-title" className="rfa-h3">The other side of the handoff</h3>
      <p className="v2-lede">The designer reads “2 raw colors”. The agent, reading the frame through Figma’s MCP server, gets the same two colors and the same names.</p>
    </div>
    <div className="rfa-agent-grid">
      <figure data-reveal=""><div className="rfa-agent-img"><img src={`${A}agent-designer.webp`} width="775" height="700" loading="lazy" decoding="async"
        alt="Figma's Agents tab: the note says the frame has 2 raw colors and asks which variable the print cards should use"/></div>
        <figcaption className="v2-caption"><span>Designer: the Agents tab, inside the editor.</span></figcaption></figure>
      <figure data-reveal=""><div className="rfa-agent-img is-dark"><img src={`${A}agent-terminal.webp`} width="1400" height="945" loading="lazy" decoding="async"
        alt="A Claude Code session: get_design_context returns a readiness note listing the 2 raw colors, then the agent asks which variable to use for FFFFFF"/></div>
        <figcaption className="v2-caption"><span>Agent: a Claude Code session calling get_design_context (my mock of the response).</span></figcaption></figure>
    </div>
    <blockquote className="rfa-quote" data-reveal="">
      <p>“This frame has 2 raw colors that don’t match a single variable. I’ll use your tokens for everything else and ask before choosing or inventing names.”</p>
      <footer>The agent’s note, generated from the same summary as the designer’s row</footer>
    </blockquote>
  </section>;
}

function RfaHeroShot({phone, reduced}) {
  return <div className="rfa-hero-shot" data-enter="tilt">
    <Browser label="The Ready for agents prototype">
      <ProtoScreen kit={RFA_KIT} screen="review" load={phone ? 'never' : 'idle'} delay={1500} interactive={!phone} reduced={reduced}
        title="Ready for agents prototype: the review popover in a Figma-style editor"
        alt="A Figma-style editor: the Home frame of a print shop app, an Agent handoff row in the properties panel, and a review popover listing 12 raw values"/>
    </Browser>
    <p className="rfa-hero-note" data-enter="note">{phone ? 'The editor needs a screen at least 1024 px wide to try.' : 'Live prototype. Click around; Review, Bind and Undo all work.'}</p>
  </div>;
}

export default function ReadyForAgentsCase({item, reduced}) {
  const root = useRef(null);
  const phone = useMedia(PHONE), fine = useMedia(FINE);
  useReveals(root, reduced, [phone]);
  const next = nextCase(item.slug);
  const jumpTo = sel => e => {
    const target = root.current?.querySelector(sel);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({behavior: reduced || e.detail === 0 ? 'auto' : 'smooth', block: 'start'});
    target.querySelector('button, a, h2')?.focus?.({preventScroll: true});
  };

  return <article ref={root} className="pp-page v2-page rfa-page" lang="en" data-nav-tone="light">
    <CaseHero stacked reduced={reduced} title="Ready for agents" kind="Research, then product design"
      outcome="Coding agents rebuild a Figma frame’s layout from the picture but invent their own names for its design tokens. I measured that across 37 builds, then designed a check in the properties panel that fixes it in one undo and tells the agent the rest."
      chips={['Solo: study, analysis, design and prototype', 'October 2026', 'Desktop, Figma UI3', 'Concept, not affiliated with Figma']}
      actions={<>
        {phone ? null : <a className="v2-cta" href="#try" onClick={jumpTo('#try')}><span>Try the prototype</span><span className="v2-cta-icon"><ArrowDown/></span></a>}
        <a className="v2-link" href="#research" onClick={jumpTo('#research')}><span className="v2-link-text">Start with the research</span><ArrowDown/></a>
      </>}>
      <RfaHeroShot phone={phone} reduced={reduced}/>
    </CaseHero>

    <NumberStrip items={NUMBERS} reduced={reduced} label="The study in numbers"/>

    {/* ---------- Chapter 1: research ---------- */}
    <section className="rfa-section" aria-labelledby="research-title">
      <header className="rfa-chapter" id="research" tabIndex={-1} data-reveal="">
        <p className="rfa-chapter-n">Chapter 1, research</p>
        <h2 id="research-title" className="rfa-chapter-title">Which file habits change what an agent builds?</h2>
        <p className="v2-lede">Designers now hand Figma files straight to coding agents. The advice is to clean up the file first: components, variables, layer names, auto layout. Nothing says which of those reaches the code.</p>
        <p className="v2-caption"><Ev label="Sourced"/><span>The list of habits is from Figma’s developer docs.</span></p>
      </header>

      <div className="rfa-block" data-reveal="">
        <div className="rfa-block-copy">
          <h3 className="rfa-h3">Six screens, four versions each</h3>
          <p>Each screen exists fully systematized (L2), structured without variables (L1), raw (L0), and raw plus the same variable bindings as L2 (L0V). All four export to byte-identical images, so the agent always sees the same picture.</p>
        </div>
        <div className="rfa-block-figure"><TestSet/></div>
      </div>

      <div className="rfa-block is-flip" data-reveal="">
        <div className="rfa-block-copy">
          <h3 className="rfa-h3">Same picture, different structure</h3>
          <p>In L2 the sign-in screen’s layers have names, auto layout, instances and variable bindings. In L0 they’re generic frames and text with nothing bound. Both export the same PNG.</p>
        </div>
        <div className="rfa-block-figure"><LayersCompare/></div>
      </div>

      <div className="rfa-wide" data-reveal="">
        <h3 className="rfa-h3">One build, start to finish</h3>
        <p className="rfa-wide-lede">A fresh Claude agent got each frame through Figma’s MCP tools with the same prompt; my harness rendered every result in headless Chrome and scored it. I wrote down five hypotheses before the first run.</p>
        <Pipeline/>
      </div>

      <div className="rfa-result" data-reveal="">
        <div className="rfa-result-copy">
          <p className="rfa-result-n">Result 1, pre-registered</p>
          <h3 className="rfa-h3">The layout survived the mess</h3>
          <p>My main hypothesis was that raw files without auto layout would break when resized. They didn’t: agents rebuilt the layout with flex and grid from the picture.</p>
        </div>
        <FlatResult reduced={reduced}/>
      </div>

      <figure className="rfa-evidence" data-reveal="">
        <p className="rfa-result-n">Result 2, the evidence</p>
        <h3 className="rfa-h3">Same build, different wiring</h3>
        <WiringGrid/>
        <figcaption className="v2-caption"><Ev label="Measured"/><span>The pricing screen built from the raw file (L0) and from the raw file with variables bound (L0V). The files look identical in Figma, and so did the builds. Then I injected the same token change into each page: primary to magenta, text to green, background to yellow, border to cyan. The L0 build picked up only the primary and border colors; the L0V build followed all four.</span></figcaption>
      </figure>

      <div className="rfa-result is-flip" data-reveal="">
        <div className="rfa-result-copy">
          <p className="rfa-result-n">Result 3, the ablation</p>
          <h3 className="rfa-h3">Only variables carried the system’s names</h3>
          <p>L0V is the raw file with variable bindings added and nothing else: no auto layout, no components, meaningless layer names. Every one of those builds followed the whole change. Without variables, agents invented their own names, and a change reached only the ones they happened to guess.</p>
        </div>
        <PropagationDots reduced={reduced}/>
      </div>

      <div className="rfa-insight" data-reveal="">
        <p>Agents recovered the layout from the picture. They never recovered the design system’s names unless the file carried them as variables.</p>
        <Go to="/product/design-to-code" className="v2-link"><span className="v2-link-text">Full research write-up</span><ArrowRight/></Go>
      </div>
    </section>

    {/* ---------- Chapter 2: design ---------- */}
    <section className="rfa-section" aria-labelledby="design-title">
      <header className="rfa-chapter" id="design" data-reveal="">
        <p className="rfa-chapter-n">Chapter 2, design</p>
        <h2 id="design-title" className="rfa-chapter-title">Say what the agent will miss, and fix it where it lives</h2>
        <p className="v2-lede">Figma already has the parts: variables, a replace-with-variable fix in Check designs, Dev Mode, an MCP server. But that check sits in a panel you have to remember to open, only on Organization and Enterprise plans, and the agent never hears that values are raw.</p>
        <p className="v2-caption"><Ev label="Sourced"/><span>Plan availability of Check designs: Figma help center.</span></p>
      </header>

      <h3 className="rfa-h3 rfa-sub" data-reveal="">Five principles, each one a test the design has to pass</h3>
      <Principles/>

      <div className="rfa-explore">
        <div className="v2-section-head" data-reveal="">
          <h3 className="rfa-h3">Where should the check live?</h3>
          <p className="v2-lede">Three directions on the same Home frame and the same 12 raw values.</p>
        </div>
        <Directions/>
      </div>
    </section>

    <Scrolly id="rfa-flow" kit={RFA_KIT} frame="browser" steps={STEPS} reduced={reduced} label="The handoff flow"
      title="Ready for agents prototype, following the steps" note="The live prototype, moved by your scroll"
      heading="From raw values to ready, in seven states"
      lede="Scroll through the flow; the editor on the right is the real prototype, framed on the part each step is about."/>

    <BeforeAfter id="rfa-compare" reduced={reduced} frame="panel" ratio="1280 / 1520" size={[1280, 1520]}
      label="Compare the plugin version 0.3 review with the new review popover"
      heading="From plugin to panel"
      lede="Drag across to compare the plugin I built during the research with the review popover."
      before={{src: `${A}compare-plugin-v03.webp`, label: 'Plugin v0.3', caption: 'Left: my plugin, v0.3.'}}
      after={{src: `${A}compare-popover.webp`, label: 'Review popover', caption: 'Right: the popover in the prototype.'}}>
      <p>The plugin was its own window: a long list grouped by match type, all-caps section labels, a benchmark footnote, and binding behind a second screen.</p>
      <p>The popover opens from the row it explains, groups values by property, puts the two decisions on top, and binds with one undoable button. Both read the same matching logic; the popover drops everything that doesn’t reach the code.</p>
    </BeforeAfter>

    <ThemeMoment reduced={reduced}/>
    <AgentSide/>

    <LivePrototype id="try" reduced={reduced} kit={RFA_KIT} frame="browser" name="Ready for agents prototype" tasks={TASKS}
      start={{screen: 'row'}} resetState={() => {}} phoneLink={false}
      heading="Try it yourself"
      lede="The same prototype at full width. Pick a task; the editor opens where it starts."
      phoneLede="Four things to try in the prototype. On a desktop, each one opens the editor where it starts."
      phoneNote="The prototype is a desktop editor. Open this page on a screen at least 1024 px wide to try it."
      note="Everything runs in your browser. Reset puts the editor back at the start."/>

    {/* ---------- Chapter 3: testing ---------- */}
    <section className="rfa-section v2-testing" aria-labelledby="testing-title">
      <header className="rfa-chapter" id="testing" data-reveal="">
        <p className="rfa-chapter-n">Chapter 3, testing</p>
        <h2 id="testing-title" className="rfa-chapter-title">Five sessions decide what stays</h2>
        <p className="v2-lede">Nothing in the design chapter has been tested with designers yet. This is the plan, and the space the results will fill.</p>
      </header>
      <div className="v2-testing-grid">
        <div className="v2-testing-plan" data-reveal="">
          <h3 className="v2-h3">Plan</h3>
          <ul className="v2-list">
            <li>Five designers or design students who use Figma weekly, ideally two who have handed a file to an agent.</li>
            <li>Twenty minutes each, thinking aloud, on this prototype.</li>
            <li>Tasks: is this frame ready, and what would the agent miss; fix what you can; make the call on #FFFFFF; what happens to values that match nothing; what do you expect the agent to do now.</li>
            <li>Measures: task success, time on task, a 1–7 ease rating per task, quotes, and where people hesitate.</li>
            <li>Anything that blocks two of five people gets redesigned before this case is final, and the page will show the before and after.</li>
          </ul>
          <h3 className="v2-h3">Hypotheses to check</h3>
          <ul className="v2-hypotheses">
            <li><Ev label="Hypothesis"/><span>A row in the properties panel gets noticed at selection time (direction A’s weak spot).</span></li>
            <li><Ev label="Hypothesis"/><span>Designers act on counts faster than on a score.</span></li>
            <li><Ev label="Hypothesis"/><span>Designers expect the agent to ask about the colors left raw.</span></li>
          </ul>
        </div>
        <div className="v2-results" data-reveal="" aria-label="Results, not collected yet">
          <p className="v2-slot-badge">Placeholder: results after the sessions</p>
          <dl>
            <div><dt>Said what the agent would miss</dt><dd>— of 5</dd></div>
            <div><dt>Bound the exact matches unaided</dt><dd>— of 5</dd></div>
            <div><dt>Made the #FFFFFF call with confidence</dt><dd>— of 5</dd></div>
            <div><dt>Expected the agent to ask</dt><dd>— of 5</dd></div>
          </dl>
          <p className="v2-results-note">Each result will sit next to the change it caused.</p>
        </div>
      </div>
    </section>

    <section className="v2-reflection" aria-labelledby="rfa-reflection">
      <h2 id="rfa-reflection" className="v2-h2" data-reveal="">Reflection</h2>
      <div className="v2-reflection-grid">
        <div data-reveal=""><h3 className="v2-h3">What I’d keep</h3><p>Counting what the agent will miss instead of grading the file. The study supports one strong finding, about variables, and the design says exactly that and nothing more.</p></div>
        <div data-reveal=""><h3 className="v2-h3">What I don’t know yet</h3><p>Whether a row in a dense panel gets noticed, and whether the finding holds beyond 37 builds from one model family and one small design system.</p></div>
        <div data-reveal=""><h3 className="v2-h3">What’s next</h3><p>The five sessions, then a second model family and a Code Connect condition on the research side. I expected auto layout to matter most; pre-registering kept me honest when it didn’t.</p></div>
      </div>
    </section>

    <NextProject item={next} visual={next.slug === 'atelier' ? <AtelierTileArt/> : null} image={next.thumb}/>
    <ProductFooter/>
    {fine ? <CursorLabel root={root} reduced={reduced}/> : null}
  </article>;
}
