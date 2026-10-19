import {lazy, useLayoutEffect, useRef, useState} from 'react';
import {Go} from '../Go';
import {Ev} from '../CaseKit';
import {ProductFooter} from '../ProductIndex';
import {nextCase} from '../content';
import {Pipeline, TestSet} from '../figures';
import CaseHero from '../v2/CaseHero';
import NumberStrip from '../v2/NumberStrip';
import Scrolly from '../v2/Scrolly';
import BeforeAfter, {RoundChanges} from '../v2/BeforeAfter';
import LivePrototype from '../v2/LivePrototype';
import NextProject from '../v2/NextProject';
import CursorLabel from '../v2/CursorLabel';
import CaseChrome, {zoomable} from '../v2/CaseChrome';
import {Deferred} from '../v2/Try';
import {Browser, ProtoScreen, RFA_KIT, rfaShot} from '../v2/Device';
import {AtelierTileArt} from '../v2/TileArt';
import {ArrowDown, ArrowRight} from '../v2/icons';
import {FINE, gsap, PHONE, ScrollTrigger, scrollerOf, useMedia, useReveals} from '../v2/motion';
import '../v2/v2.css';
import './rfa.css';

// Sources: cases/p2-design-to-code/draft.md and p2-benchmark/results/results.md (37 scored builds, Oct 19 2026);
// cases/pd-ready-for-agents/BRIEF.md and pd-prototype/README.md (round 2, after a model-assisted design review).
// Concept work, not affiliated with Figma. Nothing in the design chapter has been tested with designers yet; Jay runs
// the sessions next.

const A = '/assets/product/ready-for-agents/';
// Interactive modules load when their place on the page comes near (v2/Try Deferred).
const TryFinding = lazy(() => import('../v2/modules/TryFinding'));
const AblationChart = lazy(() => import('../v2/modules/AblationChart'));
const LinkedLayers = lazy(() => import('../v2/modules/LinkedLayers'));

// The chapter rail and chip (v2/CaseChrome): every id is an element on this page.
const CHAPTERS = [
  {id: 'research', label: 'Research', sections: [{id: 'rfa-finding', label: 'Try the finding'}, {id: 'rfa-method', label: 'How I tested it'}, {id: 'rfa-results', label: 'Results'}]},
  {id: 'design', label: 'Design', sections: [{id: 'rfa-principles', label: 'Principles'}, {id: 'rfa-directions', label: 'Directions'}, {id: 'rfa-flow', label: 'The flow'}, {id: 'rfa-compare', label: 'Round 1 → 2'}, {id: 'rfa-theme', label: 'Light and dark'}, {id: 'rfa-agent', label: 'The agent’s side'}]},
  {id: 'try', label: 'Try it'},
  {id: 'testing', label: 'Testing'},
  {id: 'rfa-reflection-section', label: 'Reflection'},
];

const NUMBERS = [
  {value: 37, label: 'Agent builds scored', note: '24 in round 1, including the ablation, and 13 round-2 repeats so far'},
  {value: 9, unit: 'of 9', label: 'Followed every token change', note: 'Builds from a raw file with only variables added'},
  {value: 50, unit: '%', label: 'Median that reached the code without variables', note: '18 builds; none followed the whole change'},
];

// Pre-registered measures, medians of all scored builds per level (n = 9, 9, 10).
const FLAT = [
  {name: 'Looks like the Figma export (SSIM)', values: ['0.983', '0.983', '0.984'], share: [.983, .983, .984]},
  {name: 'Passes the resize checks', values: ['100%', '100%', '100%'], share: [1, 1, 1]},
  {name: 'Absolutely positioned elements', values: ['2', '2', '2'], share: [.4, .4, .4]},
  {name: 'Colors routed through CSS variables', values: ['97%', '94%', '97%'], share: [.97, .94, .97]},
];

// Camera rects are in the editor's own 1440 x 900 pixels (round 2 of the prototype).
const STEPS = [
  {id: 'row', screen: 'row', label: 'Panel row', title: 'Selecting a frame says what isn’t bound',
    camera: {x: 640, y: 50, w: 800}, phoneCamera: {x: 1120, y: 90, w: 320},
    alt: 'The properties panel with a Variables row under the frame header: 12 unbound values, and a Check button',
    body: <p>One 40&nbsp;px row sits under the frame header: 12 unbound values, Check, and a menu. It counts values the agent will read as plain hex and px. No score.</p>},
  {id: 'review', screen: 'review', label: 'Check designs', title: 'Check opens a lens on Check designs',
    camera: {x: 440, y: 130, w: 1000}, phoneCamera: {x: 840, y: 140, w: 360},
    alt: 'Check designs with the Variables for agents lens: one row per value and role, each with a checkbox, and Apply 9',
    body: <p>Figma’s Check designs already suggests variables for hard-coded values. The concept adds a Variables for agents lens: one row per value and role, a checkbox on each, and Apply&nbsp;9 for what’s checked.</p>},
  {id: 'hover', screen: 'hover', label: 'Hover outline', title: 'Hover a row to see where it lives',
    camera: {x: 380, y: 40, w: 1060}, phoneCamera: {x: 410, y: 60, w: 470},
    alt: 'Hovering the FFFFFF frame fill row outlines three print cards on the canvas, dashed, with a 3 layers badge',
    body: <p>Hovering FFFFFF as a frame fill outlines its three print cards, dashed so it never reads as the selection, with a count badge in one fixed spot. That’s direction&nbsp;B, folded into&nbsp;A.</p>},
  {id: 'picker', screen: 'picker', label: 'Picker', title: 'Pick a variable, don’t flip a toggle',
    camera: {x: 540, y: 250, w: 760}, phoneCamera: {x: 556, y: 286, w: 300},
    alt: 'The variable picker for FFFFFF as frame fill: two variables allowed here, one hidden from pickers, others below, with Light and Dark swatches',
    body: <p>#FFFFFF matches two variables. The picker searches every variable, separates the ones allowed in this role from the ones that aren’t (and says why), and shows each one’s Light and Dark values. The Dark value settles it: surface goes dark, on-accent stays white.</p>},
  {id: 'bound', screen: 'bound', label: 'Apply and undo', title: 'Apply in one step, undo in one step',
    camera: {x: 560, y: 300, w: 880}, phoneCamera: {x: 600, y: 640, w: 420},
    alt: 'A toast reads Bound 9 values on 29 layers, with Undo; three rows are left to review',
    body: <p>Apply binds what’s checked as one history entry: 9 values on 29 layers. The toast’s Undo and ⌘Z both take it back. Applied rows fold away; the three that need a decision stay.</p>},
  {id: 'ready', screen: 'ready-review', label: 'Applied', title: 'Applied, exempt, and quiet when it’s done',
    camera: {x: 480, y: 150, w: 960}, phoneCamera: {x: 1100, y: 120, w: 340},
    alt: 'Check designs with an Applied list, each FFFFFF choice remembered per role with Forget, and the gold kept as a raw value; the panel row reads All values use variables',
    body: <p>To review, applied and exempt stay apart. A choice is remembered per value and role, only after Apply, and can be forgotten. When nothing is left, the row reads All values use variables, in secondary text.</p>},
  {id: 'agent', screen: 'agent', label: 'Agents tab', title: 'The agent hears the same counts',
    camera: {x: 0, y: 0, w: 960}, phoneCamera: {x: 64, y: 140, w: 400},
    alt: 'The Agents tab: the note names the 3 unbound values and asks which variable FFFFFF should use as a frame fill',
    body: <p>In the Agents tab, the note uses the same words: Home has 3 unbound values, which ones, and a question about FFFFFF instead of an invented token name.</p>},
];

// Each principle shows the piece of the prototype that passes its test, at the editor's own size (dw x dh CSS px).
const PRINCIPLES = [
  {title: 'Say what the agent will miss, not a score', test: '“12 unbound values,” and a Check button. No grade, and no percentage without a count.', img: 'principle-row.webp', dw: 239, dh: 53},
  {title: 'Fix it where it lives, in one undo', test: 'No new window or mode. Apply is one history entry, and one Undo reverts it.', img: 'principle-toast.webp', dw: 254, dh: 52},
  {title: 'Never guess between equal options', test: 'A value that matches two variables is asked about per role, and the answer is remembered only after Apply.', img: 'principle-choice.webp', dw: 344, dh: 76},
  {title: 'Quiet when it’s fine', test: 'A frame with nothing left reads “All values use variables,” in secondary text.', img: 'principle-ready.webp', dw: 239, dh: 53},
  {title: 'Same words on both sides', test: 'The row, Check designs and the agent’s note all say “unbound values,” with the same counts.', img: 'principle-words.webp', dw: 227, dh: 112},
];

const DIRECTIONS = [
  {id: 'a', name: 'Properties panel section', idea: 'A one-line Variables row for the selected frame; Check opens Check designs with a Variables for agents lens.',
    plus: ['Visible at selection in one 40 px row; details open on demand', 'Reuses Check designs: pick scoped variables, apply in one undo'],
    minus: ['One row in a dense panel is easy to scroll past'], role: 'The home, as a lens on Check designs', chosen: true},
  {id: 'b', name: 'Canvas overlay', idea: 'A toggle outlines every raw-value layer and labels it on the canvas.',
    plus: ['Spatial: you see exactly where each raw value sits'],
    minus: ['Noisy fast: 9 labels already crowd one phone screen', 'Competes with selection, hover and annotations'], role: 'Folded into A as the hover outline'},
  {id: 'c', name: 'Ready-for-dev checklist', idea: 'Marking a section ready for dev runs the same check as one step of a checklist.',
    plus: ['Fits a ritual teams already have at handoff'],
    minus: ['Late: people have stopped editing by then', 'Only reaches teams that use dev status'], role: 'Reuses A’s row in the dev status flow'},
];

const TASKS = [
  {id: 'miss', screen: 'row', title: 'Find what an agent would miss on the Home frame', hint: 'Read the Variables row in the right panel, then press Check.'},
  {id: 'bind', screen: 'review', title: 'Apply the suggested variables, then undo', hint: 'Press Apply 9, then Undo in the toast or ⌘Z.'},
  {id: 'white', screen: 'review', title: 'Decide what #FFFFFF should be in each role', hint: 'It’s a frame fill and a text color. Open each row’s picker; the Dark swatch is the tell.'},
  {id: 'agent', screen: 'after', title: 'Check what the agent will be told', hint: 'Open Agents in the left navigation bar.'},
];

// Round 1 → round 2 of the same states, cropped to Check designs and the properties panel (scripts/build-round-pairs.mjs).
const R = `${A}rounds/`;
const ROUNDS = [
  {id: 'row', tab: 'Panel row', size: [800, 946], caption: 'Home selected. Round 1 added an 88 px Agent handoff section above Position; round 2 is one 40 px row.',
    before: {src: `${R}row-r1.webp`, label: 'Round 1'}, after: {src: `${R}row-r2.webp`, label: 'Round 2'}},
  {id: 'review', tab: 'Review', caption: 'The review. Round 1 was its own popover; round 2 is Check designs with a Variables for agents lens.',
    before: {src: `${R}review-r1.webp`, label: 'Round 1'}, after: {src: `${R}review-r2.webp`, label: 'Round 2'}},
  {id: 'choice', tab: '#FFFFFF', caption: 'Deciding #FFFFFF. Round 1 asked once, with a two-way toggle; round 2 asks per role, from a picker.',
    before: {src: `${R}choice-r1.webp`, label: 'Round 1'}, after: {src: `${R}choice-r2.webp`, label: 'Round 2'}},
];
// From pd-prototype/README.md, "Round 2: design review".
const CHANGES = [
  {what: 'Rows are a value plus its role, and only variables scoped to that role are proposed.', why: 'One hex value can mean different things. An unscoped exact match can be confidently wrong.'},
  {what: 'A lens on Check designs instead of a separate checker.', why: 'It extends what Figma already ships instead of duplicating it.'},
  {what: 'A checkbox on every row and layer, and a button that counts: Apply 9.', why: 'The designer decides exactly what changes; round 1 bound every match at once.'},
  {what: 'One 40 px row replaces the 88 px section above Position.', why: 'An occasional check shouldn’t outrank everyday editing.'},
  {what: 'A searchable picker replaces the two-option toggle.', why: 'Real libraries have more than two candidates, and the Dark value settles surface vs on-accent.'},
  {what: '“Unbound values” replaces “raw values,” “agents invent names” and “Ready for agents.”', why: 'Name the issue and the action without overclaiming readiness.'},
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
        <div className="rfa-direction-img"><img src={`${A}explore-${d.id}.webp`} width="965" height="1008" alt={`Direction ${d.id.toUpperCase()}, ${d.name}, on the same Home frame`} loading="lazy" decoding="async"/></div>
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
  return <section ref={root} id="rfa-theme" className="rfa-theme" aria-labelledby="rfa-theme-title">
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
  return <section id="rfa-agent" className="rfa-agent" aria-labelledby="rfa-agent-title">
    <div className="v2-section-head" data-reveal="">
      <h3 id="rfa-agent-title" className="rfa-h3">The other side of the handoff</h3>
      <p className="v2-lede">The designer reads “3 unbound values.” The agent, reading the frame through Figma’s MCP server, gets the same three values, in the same roles, with the same names.</p>
    </div>
    <div className="rfa-agent-grid">
      <figure data-reveal=""><div className="rfa-agent-img"><img src={`${A}agent-designer.webp`} width="775" height="825" loading="lazy" decoding="async"
        alt="Figma's Agents tab: the note says Home has 3 unbound values and asks which variable FFFFFF should use as a frame fill"
        {...zoomable("Figma's Agents tab: the note says Home has 3 unbound values and asks which variable FFFFFF should use as a frame fill")}/></div>
        <figcaption className="v2-caption"><span>Designer: the Agents tab, inside the editor.</span></figcaption></figure>
      <figure data-reveal=""><div className="rfa-agent-img is-dark"><img src={`${A}agent-terminal.webp`} width="1400" height="965" loading="lazy" decoding="async"
        alt="A Claude Code session: get_design_context returns a readiness note listing 3 unbound values, then the agent asks which variable FFFFFF should use as a frame fill"
        {...zoomable("A Claude Code session: get_design_context returns a readiness note listing 3 unbound values, then the agent asks which variable FFFFFF should use as a frame fill")}/></div>
        <figcaption className="v2-caption"><span>Agent: a Claude Code session calling get_design_context (my mock of the response).</span></figcaption></figure>
    </div>
    <blockquote className="rfa-quote" data-reveal="">
      <p>“Home has 3 unbound values: FFFFFF as frame fill and FFFFFF as text each match more than one; C9A66B matches none. I’ll use variables where they’re bound and ask about the rest instead of inventing names.”</p>
      <footer>The agent’s note, generated from the same summary as the designer’s row</footer>
    </blockquote>
  </section>;
}

function RfaHeroShot({phone, reduced}) {
  return <div className="rfa-hero-shot" data-enter="tilt">
    <Browser label="The Ready for agents prototype">
      <ProtoScreen kit={RFA_KIT} screen="review" load={phone ? 'never' : 'idle'} delay={1500} interactive={!phone} reduced={reduced}
        title="Ready for agents prototype: Check designs with the Variables for agents lens, in a Figma-style editor"
        alt="A Figma-style editor: the Home frame of a print shop app, a Variables row in the properties panel, and Check designs listing 12 unbound values"/>
    </Browser>
    <p className="rfa-hero-note" data-enter="note">{phone ? 'The editor needs a screen at least 1024 px wide to try.' : 'Live prototype. Click around; Check, Apply and Undo all work.'}</p>
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
      outcome="Coding agents rebuild a Figma frame’s layout from the picture but invent their own names for its design tokens. I measured that across 37 builds, then designed a lens on Figma’s Check designs that binds what you choose in one undo and tells the agent the rest."
      chips={['Solo: study, analysis, design and prototype', 'October 2026', 'Desktop, Figma UI3', 'Concept, not affiliated with Figma']}
      actions={<>
        {phone ? null : <a className="v2-cta" href="#try" onClick={jumpTo('#try')}><span>Try the prototype</span><span className="v2-cta-icon"><ArrowDown/></span></a>}
        <a className="v2-link" href="#research" onClick={jumpTo('#research')}><span className="v2-link-text">Start with the research</span><ArrowDown/></a>
      </>}>
      <RfaHeroShot phone={phone} reduced={reduced}/>
    </CaseHero>
    <CaseChrome root={root} chapters={CHAPTERS} reduced={reduced}/>

    <NumberStrip items={NUMBERS} reduced={reduced} label="The study in numbers"/>

    {/* ---------- Chapter 1: research ---------- */}
    <section className="rfa-section" aria-labelledby="research-title">
      <header className="rfa-chapter" id="research" tabIndex={-1} data-reveal="">
        <p className="rfa-chapter-n">Chapter 1, research</p>
        <h2 id="research-title" className="rfa-chapter-title">Which file habits change what an agent builds?</h2>
        <p className="v2-lede">Designers now hand Figma files straight to coding agents. The advice is to clean up the file first: components, variables, layer names, auto layout. Nothing says which of those reaches the code.</p>
        <p className="v2-caption"><Ev label="Sourced"/><span>The list of habits is from Figma’s developer docs.</span></p>
      </header>

      <div id="rfa-finding" className="rfa-finding">
        <div className="v2-section-head" data-reveal="">
          <h3 className="rfa-h3">Try the finding first</h3>
          <p className="v2-lede">A fresh agent built this pricing screen twice from the same picture: from the raw Figma file, and from the same file with its colors bound to variables. These are the pages it wrote.</p>
        </div>
        <Deferred minHeight={720} label="Live demo of the two pages"><TryFinding reduced={reduced}/></Deferred>
      </div>

      <div id="rfa-method" className="rfa-block" data-reveal="">
        <div className="rfa-block-copy">
          <h3 className="rfa-h3">Six screens, four versions each</h3>
          <p>Each screen exists fully systematized (L2), structured without variables (L1), raw (L0), and raw plus the same variable bindings as L2 (L0V). All four export to byte-identical images, so the agent always sees the same picture.</p>
        </div>
        <div className="rfa-block-figure"><TestSet zoom/></div>
      </div>

      <div className="rfa-block is-flip" data-reveal="">
        <div className="rfa-block-copy">
          <h3 className="rfa-h3">Same picture, different structure</h3>
          <p>In L2 the sign-in screen’s layers have names, auto layout, instances and variable bindings. In L0 they’re generic frames and text with nothing bound. Both export the same PNG.</p>
        </div>
        <div className="rfa-block-figure"><Deferred minHeight={560} label="The sign-in screen’s layers in both files"><LinkedLayers reduced={reduced}/></Deferred></div>
      </div>

      <div className="rfa-wide" data-reveal="">
        <h3 className="rfa-h3">One build, start to finish</h3>
        <p className="rfa-wide-lede">A fresh Claude agent got each frame through Figma’s MCP tools with the same prompt; my harness rendered every result in headless Chrome and scored it. I wrote down five hypotheses before the first run.</p>
        <Pipeline/>
      </div>

      <div id="rfa-results" className="rfa-result" data-reveal="">
        <div className="rfa-result-copy">
          <p className="rfa-result-n">Result 1, pre-registered</p>
          <h3 className="rfa-h3">The layout survived the mess</h3>
          <p>My main hypothesis was that raw files without auto layout would break when resized. They didn’t: agents rebuilt the layout with flex and grid from the picture.</p>
        </div>
        <FlatResult reduced={reduced}/>
      </div>

      <div className="rfa-result is-flip" data-reveal="">
        <div className="rfa-result-copy">
          <p className="rfa-result-n">Result 2, the ablation</p>
          <h3 className="rfa-h3">Only variables carried the system’s names</h3>
          <p>L0V is the raw file with variable bindings added and nothing else: no auto layout, no components, meaningless layer names. Every one of those builds followed the whole change. Without variables, agents invented their own names, and a change reached only the ones they happened to guess.</p>
        </div>
        <Deferred minHeight={460} label="Chart of every build"><AblationChart reduced={reduced}/></Deferred>
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

      <h3 id="rfa-principles" className="rfa-h3 rfa-sub" data-reveal="">Five principles, each one a test the design has to pass</h3>
      <Principles/>

      <div id="rfa-directions" className="rfa-explore">
        <div className="v2-section-head" data-reveal="">
          <h3 className="rfa-h3">Where should the check live?</h3>
          <p className="v2-lede">Three directions on the same Home frame and the same 12 unbound values.</p>
        </div>
        <Directions/>
      </div>
    </section>

    <Scrolly id="rfa-flow" kit={RFA_KIT} frame="browser" steps={STEPS} reduced={reduced} label="The handoff flow"
      title="Ready for agents prototype, following the steps" note="The live prototype, moved by your scroll"
      heading="From unbound to applied, in seven states"
      lede="Scroll through the flow; each step frames the real prototype on the part it’s about."/>

    <BeforeAfter id="rfa-compare" reduced={reduced} frame="panel" ratio="1200 / 1420" size={[1200, 1420]} pairs={ROUNDS}
      label="Compare round 1 with round 2"
      heading="Round 1 → Round 2"
      lede="Round 2 came out of a design review. Pick a state and drag across it to compare the two rounds.">
      <p className="v2-review-note"><span><b>A model-assisted design review.</b> I asked a model to critique round 1 as a Figma design lead would. It scored craft 7, interaction 5 and product thinking 6, and ranked eight fixes; round 2 builds them. It’s a critique, not a test with designers.</span></p>
      <RoundChanges items={CHANGES}/>
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

    <section id="rfa-reflection-section" className="v2-reflection" aria-labelledby="rfa-reflection">
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
