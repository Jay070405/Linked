import {useRef} from 'react';
import {Ev} from '../CaseKit';
import {ProductFooter} from '../ProductIndex';
import {nextCase} from '../content';
import CaseHero from '../v2/CaseHero';
import NumberStrip from '../v2/NumberStrip';
import Scrolly from '../v2/Scrolly';
import Decisions from '../v2/Decisions';
import BeforeAfter, {RoundChanges} from '../v2/BeforeAfter';
import LivePrototype from '../v2/LivePrototype';
import NextProject from '../v2/NextProject';
import CursorLabel from '../v2/CursorLabel';
import {Browser, CNTL_KIT, CNTL_PAGE_KIT, ProtoScreen} from '../v2/Device';
import {ArrowDown} from '../v2/icons';
import {FINE, PHONE, useMedia, useReveals} from '../v2/motion';
import '../v2/v2.css';
import './cn.css';

// Sources: cases/d4-choose-not-to-lose/BRIEF.md and d4-choose-not-to-lose-prototype/README.md (round 2, after a
// model-assisted design review), Oct 19 2026. The plans are fictional and every dollar figure comes from the prototype's
// tested cost model. The study count is from Bhargava, Loewenstein & Sydnor (QJE 2017), as cited in the brief.
// Nothing here has been tested with people yet.

const A = '/assets/product/choose-not-to-lose/';

const NUMBERS = [
  {value: 23894, label: 'Employees in the “Choose to Lose” study', note: <><Ev label="Sourced"/> Bhargava, Loewenstein and Sydnor, Quarterly Journal of Economics, 2017</>},
  {value: 4, label: 'Fictional plans in the prototype', note: 'Same network and covered services; different prices and terms'},
  {value: 3, label: 'Bill examples, priced for every plan', note: '$300, $4,000 and $40,000 in covered bills a year'},
];

// Camera rects are in the prototype's own 1440-wide page pixels; CNTL_PAGE_KIT shows a 1440 x 900 window onto a
// 1440 x 2080 page, so y reaches down the page the way a scroll would.
const STEPS = [
  {id: 'baseline', screen: 'baseline', label: 'Benefits table', title: 'Start where most portals stop',
    camera: {x: 0, y: 150, w: 1440}, phoneCamera: {x: 0, y: 400, w: 900},
    alt: 'Medical plan selection: a table of four plans with monthly premium, deductible, coinsurance and out-of-pocket maximum, and a radio button per plan',
    body: <p>Four plans, four terms each, a radio button. Every number is true, and the year’s arithmetic is left to you. This is the baseline the redesign is tested against.</p>},
  {id: 'scenarios', screen: 'scenarios', label: 'Bill examples', title: 'Three bill amounts, no forecasts',
    camera: {x: 120, y: 180, w: 1200}, phoneCamera: {x: 200, y: 360, w: 1040},
    alt: 'Explore three bill amounts: $300, $4,000 or $40,000 in covered bills per year, with $4,000 selected',
    body: <p>$300, $4,000 or $40,000 in covered bills a year. Round 1 called them “Barely use it” and “A big surprise”; amounts don’t pretend to know anyone’s health, or how likely each year is.</p>},
  {id: 'chart', screen: 'math', label: 'Yearly cost', title: 'Every plan on one yearly axis',
    camera: {x: 20, y: 380, w: 1080}, phoneCamera: {x: 16, y: 470, w: 800},
    alt: 'Compare total yearly cost: each plan a row with three points for the three bill amounts, and the premium, deductible and coinsurance stacked under each row',
    body: <p>Each row is a plan; each point is its yearly total for one bill amount, premiums included. Show the breakdown and premium, deductible and coinsurance stack into the total, for all four plans at once.</p>},
  {id: 'proof', screen: 'math', label: 'The proof', title: 'Flag the plan that loses, and prove it',
    camera: {x: 16, y: 1180, w: 1100}, phoneCamera: {x: 16, y: 1265, w: 900},
    alt: 'An informational note: Plan B costs $600 more per year for the same coverage in this example, with the proof open: the same deductible, coinsurance and maximum, and $600 more at each bill amount',
    body: <p>Plan B has Plan A’s deductible, coinsurance and maximum, and a higher premium, so it costs exactly $600 more at every bill amount, not only the three shown. The note says so in blue, and the proof opens in place.</p>},
  {id: 'maximum', screen: 'worst-year', label: 'Maximum', title: 'Know the most a year can cost',
    camera: {x: 120, y: 256, w: 1200}, phoneCamera: {x: 230, y: 400, w: 980},
    alt: 'Maximum yearly cost: annual premiums plus the out-of-pocket maximum, $8,160 for Plan A, $8,760 for B, $8,820 for C and $7,100 for D',
    body: <p>Annual premiums plus the out-of-pocket maximum: $7,100 to $8,820 a year. Plan C has the lowest premium and the highest maximum. Uncovered and out-of-network bills can add more, and the page says so.</p>},
  {id: 'option', screen: 'review-b', label: 'Keep the option', title: 'Choosing Plan B still works',
    camera: {x: 0, y: 190, w: 1440}, phoneCamera: {x: 16, y: 280, w: 800},
    alt: 'Take one more look at Plan B: the note about the $600, a checkbox to confirm it, and Save Plan B disabled until it’s checked',
    body: <p>No plan is preselected, and Plan B stays on the list at full strength. Saving it asks you to confirm the $600 first. The arithmetic informs the choice; it doesn’t make it.</p>},
  {id: 'confirm', screen: 'confirmation', label: 'Confirmation', title: 'End on a sentence you can check',
    camera: {x: 0, y: 190, w: 1440}, phoneCamera: {x: 16, y: 280, w: 800},
    alt: 'A choice you can explain: maximum for covered, in-network care, including annual premiums, $8,160 per year on Plan A; in this $4,000 example, $4,160 per year',
    body: <p>“Maximum for covered, in-network care, including annual premiums: $8,160 per year on Plan&nbsp;A. In this $4,000 example: $4,160 per year.” The same numbers as the table, the chart and the maximum panel.</p>},
];

const img = (file, position) => <img src={A + file} alt="" loading="lazy" decoding="async" style={{objectPosition: position}}/>;
const DECISIONS = [
  {id: 'year', title: 'The year, not the month', verdict: 'A monthly premium is only part of the price.',
    tried: 'The portal’s columns: a monthly premium, then terms to add up yourself.',
    chose: 'One axis of yearly totals, premiums plus what you pay for covered care, for every plan at once.',
    visual: img('decision-year.webp', '30% 50%')},
  {id: 'bills', title: 'Bill amounts, not life stories', verdict: 'Don’t imply a medical forecast you can’t support.',
    tried: '“Barely use it,” “A few visits + a prescription,” “A big surprise.”',
    chose: '$300, $4,000 and $40,000 in covered bills, labeled as illustrations with no likelihood attached.',
    visual: img('decision-bills.webp', '4% 50%')},
  {id: 'inform', title: 'Inform, don’t scold', verdict: 'Explain the loss without treating the choice as an error.',
    tried: 'A red error callout: “Plan B costs more than Plan A. Every time.”',
    chose: 'A blue note with the exact $600 and a proof that opens in place. Red marks only money differences.',
    visual: img('decision-inform.webp', '50% 0%')},
  {id: 'option', title: 'Keep the bad option', verdict: 'Never hide a plan; make the cost of choosing it explicit.',
    tried: 'Plan A preselected, and maximum-cost rows that quietly changed the election.',
    chose: 'No default. Plan B stays selectable at full strength; saving it asks you to confirm the $600.',
    visual: img('decision-option.webp', '0% 60%')},
  {id: 'sentence', title: 'Say what the number covers', verdict: 'A confirmation should survive a careful reader.',
    tried: '“Your worst year on Plan A costs $8,160; a typical year about $4,160.”',
    chose: '“Maximum for covered, in-network care, including annual premiums: $8,160 per year on Plan A. In this $4,000 example: $4,160 per year.”',
    visual: img('decision-sentence.webp', '0% 30%')},
];

const R = `${A}rounds/`;
const PAIRS = [
  {id: 'portal', tab: 'Portal → yearly view', ratio: '1440 / 1119', size: [1440, 1119], caption: 'The same four fictional plans. Left: the benefits table most portals show. Right: the yearly view, premiums and covered care on one axis.',
    before: {src: `${R}portal.webp`, label: 'Benefits portal'}, after: {src: `${R}compare-portal.webp`, label: 'Yearly view'}},
  {id: 'rounds', tab: 'Round 1 → Round 2', caption: 'The comparison in both rounds: bill amounts instead of scenario names, a blue note instead of a red error, and no plan preselected.',
    before: {src: `${R}compare-r1.webp`, label: 'Round 1'}, after: {src: `${R}compare-r2.webp`, label: 'Round 2'}},
];
// From d4-choose-not-to-lose-prototype/README.md, "Round 2: design review".
const CHANGES = [
  {what: 'Scenario names became bill amounts: $300, $4,000 and $40,000 in covered bills.', why: '“A few visits + a prescription” implied a medical estimate the numbers don’t support.'},
  {what: '“Worst year” became “maximum for covered, in-network care, including annual premiums,” with the exclusions beside it.', why: 'Uncovered and out-of-network bills can go past it; the old name hid that.'},
  {what: 'The red “Every time” error became a blue note, “Plan B costs $600 more per year for the same coverage,” with the proof one click away.', why: 'Explain the consequence without scolding.'},
  {what: 'No default plan: native radios, visible “Selected” text, and review disabled until you choose.', why: 'Round 1 preselected Plan A, and the maximum-cost rows quietly changed the election.'},
  {what: 'One measured SVG places every tick, gridline, point and stack.', why: 'Header ticks drifted from the rows at some widths. In a money chart, that’s a trust problem.'},
  {what: 'Each point names its bill amount, and both keys stay visible with the math open.', why: 'Less decoding, and no suggestion that the line is a full spending range.'},
];

const TASKS = [
  {id: 'table', screen: 'baseline', title: 'Pick a plan from the familiar benefits table',
    hint: 'This is the baseline most portals show. Then choose Yearly cost view, top right, and compare.'},
  {id: 'lose', screen: 'compare', title: 'Find the plan that costs more in every example, and why',
    hint: 'Read the note under the chart, then Show proof.'},
  {id: 'high', screen: 'compare', title: 'See how the plans rank with $40,000 in covered bills',
    hint: 'Choose the $40,000 example: the rows re-rank and every total updates.'},
  {id: 'b', screen: 'compare', title: 'Choose Plan B anyway, and see what review asks of you',
    hint: 'Select Plan B, then review it. Saving asks you to confirm the $600 first.'},
];

/** The two plans as the portal's table shows them: everything you need, and nothing that says it. */
function SameCoverage() {
  const rows = [
    ['Premium per month', '$180', '$230', '+$50'],
    ['Deductible per year', '$1,500', '$1,500', null],
    ['Member coinsurance', '20%', '20%', null],
    ['Out-of-pocket maximum per year', '$6,000', '$6,000', null],
  ];
  return <figure className="cn-ab" data-reveal="">
    <div className="cn-ab-grid">
      <table className="cn-ab-table">
        <caption className="v2-sr">Plan A and Plan B in the benefits table</caption>
        <thead><tr><th scope="col">Benefit</th><th scope="col">Plan A</th><th scope="col">Plan B</th><th scope="col"><span className="v2-sr">Difference</span></th></tr></thead>
        <tbody>{rows.map(([name, a, b, d]) => <tr key={name} className={d ? 'is-diff' : ''}>
          <th scope="row">{name}</th><td>{a}</td><td>{b}</td>
          <td>{d ? <span className="cn-ab-diff">{d}</span> : <span className="cn-ab-same">Same</span>}</td>
        </tr>)}</tbody>
      </table>
      <p className="cn-ab-total"><span className="cn-ab-num">$600</span><span>more a year on Plan B, for the same coverage. Nothing in the table says so.</span></p>
    </div>
    <figcaption className="v2-caption">Two of the prototype’s four fictional plans, as the baseline table lists them. Same network and covered services.</figcaption>
  </figure>;
}

/** The comparison as the hero. A capture, not the live page: a scrolling page under the pointer would take the wheel
    from the case page in its first screen. The live prototype is in the try-it block. */
function CnHeroShot() {
  return <div className="cn-hero-shot" data-enter="tilt">
    <Browser label="The Choose Not to Lose prototype" address={CNTL_KIT.address}>
      <ProtoScreen kit={CNTL_KIT} screen="compare" load="never"
        alt="A benefits page comparing four fictional medical plans: three bill examples, a chart of yearly totals per plan, and a panel with each plan’s maximum yearly cost"/>
    </Browser>
    <p className="cn-hero-note" data-enter="note">The redesigned comparison, from the prototype. Try it live below.</p>
  </div>;
}

export default function ChooseNotToLoseCase({item, reduced}) {
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

  return <article ref={root} className="pp-page v2-page cn-page" lang="en" data-nav-tone="light">
    <CaseHero stacked reduced={reduced} title="Choose Not to Lose"
      kind={<><span>{item.kind}</span><span className="v2-flag"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.75"/><path d="M8 7v4.5M8 4.6v.1"/></svg>Fictional plans, not advice</span></>}
      outcome="A health-plan picker that prices the whole year for every plan, flags the one that costs more for the same coverage, and shows the arithmetic, without telling anyone what to pick."
      chips={['Solo: research, design and prototype', 'October 2026', 'Desktop web, benefits enrollment', 'Not yet tested with people']}
      actions={<>
        {phone ? null : <a className="v2-cta" href="#try" onClick={jumpTo('#try')}><span>Try the prototype</span><span className="v2-cta-icon"><ArrowDown/></span></a>}
        <a className="v2-link" href="#cn-problem-section" onClick={jumpTo('#cn-problem-section')}><span className="v2-link-text">Start with the problem</span><ArrowDown/></a>
      </>}>
      <CnHeroShot/>
    </CaseHero>

    <NumberStrip items={NUMBERS} reduced={reduced} label="The case in numbers"/>

    <section id="cn-problem-section" className="v2-problem" aria-labelledby="cn-problem">
      <div className="v2-problem-copy" data-reveal="">
        <h2 id="cn-problem" className="v2-h2" tabIndex={-1}>The table has the answer, and hides it</h2>
        <div className="v2-prose">
          <p>Enrollment pages list each plan’s monthly premium, deductible, coinsurance and out-of-pocket maximum, and leave the year’s arithmetic to you, often in the week before the deadline.</p>
          <p>That arithmetic is where people lose. In a study of 23,894 employees choosing from a menu that included dominated plans, a majority picked a plan that cost more for no added coverage, largely because they didn’t understand the plan terms.</p>
        </div>
        <p className="v2-hyp"><Ev label="Sourced"/><span>Bhargava, Loewenstein and Sydnor, “Choose to Lose,” Quarterly Journal of Economics, 2017.</span></p>
      </div>
      <aside className="v2-quote-slot" data-reveal="" aria-label="Session quotes, not collected yet">
        <p className="v2-slot-badge">Placeholder</p>
        <p>Quotes from five classmates go here after the test afternoon: how they chose between two fictional menus, and whether they could explain their pick back.</p>
      </aside>
      <SameCoverage/>
    </section>

    <Scrolly id="cn-flow" kit={CNTL_PAGE_KIT} frame="browser" steps={STEPS} reduced={reduced} label="The redesigned flow"
      title="Choose Not to Lose prototype, following the steps" note="The live prototype, moved by your scroll"
      heading="From the familiar table to a choice you can explain"
      lede="Scroll through the redesign; each step frames the real prototype on the part it’s about."/>

    <Decisions id="cn-decisions" items={DECISIONS}
      heading="What I chose, and what I tried first"
      lede="Five choices, most of them from round 2. Each card shows the choice; open it to see what it replaced."/>

    <BeforeAfter id="cn-compare" reduced={reduced} frame="panel" wide ratio="1440 / 1310" size={[1440, 1310]} pairs={PAIRS}
      label="Compare the two versions"
      heading="Before and after, twice"
      lede="Against the portal the redesign replaces, and against its own first round. Pick one and drag across it.">
      <p className="v2-review-note"><span><b>A model-assisted design review.</b> I asked a model to critique round 1 as an enterprise design lead would. It ranked eight fixes; round 2 builds them. It’s a critique, not the five-person test below.</span></p>
      <RoundChanges items={CHANGES}/>
    </BeforeAfter>

    <LivePrototype id="try" reduced={reduced} kit={CNTL_KIT} frame="browser" name="Choose Not to Lose prototype" tasks={TASKS}
      start={{screen: 'compare'}} resetState={() => {}}
      heading="Try it yourself"
      lede="The same prototype at full width. Pick a task; the page opens where it starts."
      phoneLede="Four things to try. Each opens the prototype in a new tab, where the task starts; it’s built for a desktop screen."
      note="Fictional plans and arithmetic only: no enrollment, no personal data, nothing saved. Reset starts over."/>

    <section className="v2-testing" aria-labelledby="cn-testing">
      <div className="v2-section-head" data-reveal="">
        <h2 id="cn-testing" className="v2-h2">Testing comes next</h2>
        <p className="v2-lede">Nothing here has been tested with people yet. This is the plan, and the space the results will fill.</p>
      </div>
      <div className="v2-testing-grid">
        <div className="v2-testing-plan" data-reveal="">
          <h3 className="v2-h3">Plan for one afternoon</h3>
          <ul className="v2-list">
            <li>Five classmates each choose from two fictional menus, one in the baseline table and one in the redesign, in counterbalanced order.</li>
            <li>Measures: dominated choices, time to decide, and whether each person can explain their pick back.</li>
            <li>Questions they haven’t seen, answered before the arithmetic is shown: A and B’s difference at $12,000 in covered bills; whether $0 in bills is the first point; what happens to premiums after the out-of-pocket maximum; whether uncovered bills can go past it.</li>
          </ul>
          <h3 className="v2-h3">Hypotheses to check</h3>
          <ul className="v2-hypotheses">
            <li><Ev label="Hypothesis"/><span>Pricing the whole year cuts dominated choices.</span></li>
            <li><Ev label="Hypothesis"/><span>People explain their choice back more accurately from the yearly view than from the table.</span></li>
            <li><Ev label="Hypothesis"/><span>An informational note changes choices without making anyone feel scolded.</span></li>
          </ul>
        </div>
        <div className="v2-results" data-reveal="" aria-label="Results, not collected yet">
          <p className="v2-slot-badge">Placeholder: results after the sessions</p>
          <dl>
            <div><dt>Chose a dominated plan, table</dt><dd>— of 5</dd></div>
            <div><dt>Chose a dominated plan, yearly view</dt><dd>— of 5</dd></div>
            <div><dt>Explained their pick back</dt><dd>— of 5</dd></div>
          </dl>
          <p className="v2-results-note">Each result will sit next to the change it caused.</p>
        </div>
      </div>
    </section>

    <section className="v2-reflection" aria-labelledby="cn-reflection">
      <h2 id="cn-reflection" className="v2-h2" data-reveal="">Reflection</h2>
      <div className="v2-reflection-grid">
        <div data-reveal=""><h3 className="v2-h3">What I’d keep</h3><p>Proving the loss instead of inferring it from three dots. Plan B is flagged only because its terms match Plan A’s and its premium is higher, so the claim holds at every bill amount, not just the ones on screen.</p></div>
        <div data-reveal=""><h3 className="v2-h3">What I don’t know yet</h3><p>Whether people read a range chart at all under deadline pressure, and how often real menus, where plans differ in network and drug coverage, leave a plan this cleanly dominated.</p></div>
        <div data-reveal=""><h3 className="v2-h3">What’s next</h3><p>The five-person comparison, with answers recorded before the arithmetic is revealed. Then plans that differ in more than price, where the proof gets harder and the design has to say less.</p></div>
      </div>
    </section>

    <NextProject item={next} image={next.thumb}/>
    <ProductFooter/>
    {fine ? <CursorLabel root={root} reduced={reduced}/> : null}
  </article>;
}
