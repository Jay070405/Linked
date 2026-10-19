import {Ev} from '../../CaseKit';

// The case's words and figures, carried over unchanged from cases/ChooseNotToLoseCase.jsx (v4). Sources:
// cases/d4-choose-not-to-lose/BRIEF.md and d4-choose-not-to-lose-prototype/README.md (round 2, after a model-assisted
// design review), Oct 19 2026. The plans are fictional and every dollar figure comes from the prototype's tested cost
// model. The study count is from Bhargava, Loewenstein & Sydnor (QJE 2017), as cited in the brief. Nothing here has
// been tested with people yet.

export const A = '/assets/product/choose-not-to-lose/';

// The chapter index: every id is an element on the page.
export const CHAPTERS = [
  {id: 'cn-quiz', label: 'Pick a plan'},
  {id: 'cn-problem-section', label: 'The problem'},
  {id: 'cn-bills', label: 'Scrub the year'},
  {id: 'cn-roll', label: 'Roll your year'},
  {id: 'cn-flow', label: 'The redesign'},
  {id: 'cn-decisions', label: 'Decisions'},
  {id: 'cn-compare', label: 'Before and after'},
  {id: 'try', label: 'Try it'},
  {id: 'cn-testing-section', label: 'Testing'},
  {id: 'cn-reflection-section', label: 'Reflection'},
];

export const FIELDS = [
  ['Role', 'Solo: research, design and prototype'],
  ['When', 'October 2026'],
  ['Where', 'Desktop web, benefits enrollment'],
  ['Status', 'Not yet tested with people'],
];

export const NUMBERS = [
  {value: 23894, label: 'Employees in the “Choose to Lose” study', note: <><Ev label="Sourced"/> Bhargava, Loewenstein and Sydnor, Quarterly Journal of Economics, 2017</>},
  {value: 4, label: 'Fictional plans in the prototype', note: 'Same network and covered services; different prices and terms'},
  {value: 3, label: 'Bill examples, priced for every plan', note: '$300, $4,000 and $40,000 in covered bills a year'},
];

// Camera rects are in the prototype's own 1440-wide page pixels; CNTL_PAGE_KIT shows a 1440 x 900 window onto a
// 1440 x 2080 page, so y reaches down the page the way a scroll would.
export const STEPS = [
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

export const DECISIONS = [
  {id: 'year', title: 'The year, not the month', verdict: 'A monthly premium is only part of the price.',
    tried: 'The portal’s columns: a monthly premium, then terms to add up yourself.',
    chose: 'One axis of yearly totals, premiums plus what you pay for covered care, for every plan at once.',
    img: {src: `${A}decision-year.webp`, w: 2112, h: 1408, position: '30% 50%'}},
  {id: 'bills', title: 'Bill amounts, not life stories', verdict: 'Don’t imply a medical forecast you can’t support.',
    tried: '“Barely use it,” “A few visits + a prescription,” “A big surprise.”',
    chose: '$300, $4,000 and $40,000 in covered bills, labeled as illustrations with no likelihood attached.',
    img: {src: `${A}decision-bills.webp`, w: 2048, h: 1200, position: '4% 50%'}},
  {id: 'inform', title: 'Inform, don’t scold', verdict: 'Explain the loss without treating the choice as an error.',
    tried: 'A red error callout: “Plan B costs more than Plan A. Every time.”',
    chose: 'A blue note with the exact $600 and a proof that opens in place. Red marks only money differences.',
    img: {src: `${A}decision-inform.webp`, w: 2144, h: 1580, position: '50% 0%'}},
  {id: 'option', title: 'Keep the bad option', verdict: 'Never hide a plan; make the cost of choosing it explicit.',
    tried: 'Plan A preselected, and maximum-cost rows that quietly changed the election.',
    chose: 'No default. Plan B stays selectable at full strength; saving it asks you to confirm the $600.',
    img: {src: `${A}decision-option.webp`, w: 1660, h: 1120, position: '0% 60%'}},
  {id: 'sentence', title: 'Say what the number covers', verdict: 'A confirmation should survive a careful reader.',
    tried: '“Your worst year on Plan A costs $8,160; a typical year about $4,160.”',
    chose: '“Maximum for covered, in-network care, including annual premiums: $8,160 per year on Plan A. In this $4,000 example: $4,160 per year.”',
    img: {src: `${A}decision-sentence.webp`, w: 1660, h: 1120, position: '0% 30%'}},
];

const R = `${A}rounds/`;
export const PAIRS = [
  {id: 'portal', tab: 'Portal → yearly view', ratio: '1440 / 1119', size: [1440, 1119], caption: 'The same four fictional plans. Left: the benefits table most portals show. Right: the yearly view, premiums and covered care on one axis.',
    before: {src: `${R}portal.webp`, label: 'Benefits portal'}, after: {src: `${R}compare-portal.webp`, label: 'Yearly view'}},
  {id: 'rounds', tab: 'Round 1 → Round 2', ratio: '1440 / 1310', size: [1440, 1310], caption: 'The comparison in both rounds: bill amounts instead of scenario names, a blue note instead of a red error, and no plan preselected.',
    before: {src: `${R}compare-r1.webp`, label: 'Round 1'}, after: {src: `${R}compare-r2.webp`, label: 'Round 2'}},
];

// From d4-choose-not-to-lose-prototype/README.md, "Round 2: design review".
export const CHANGES = [
  {what: 'Scenario names became bill amounts: $300, $4,000 and $40,000 in covered bills.', why: '“A few visits + a prescription” implied a medical estimate the numbers don’t support.'},
  {what: '“Worst year” became “maximum for covered, in-network care, including annual premiums,” with the exclusions beside it.', why: 'Uncovered and out-of-network bills can go past it; the old name hid that.'},
  {what: 'The red “Every time” error became a blue note, “Plan B costs $600 more per year for the same coverage,” with the proof one click away.', why: 'Explain the consequence without scolding.'},
  {what: 'No default plan: native radios, visible “Selected” text, and review disabled until you choose.', why: 'Round 1 preselected Plan A, and the maximum-cost rows quietly changed the election.'},
  {what: 'One measured SVG places every tick, gridline, point and stack.', why: 'Header ticks drifted from the rows at some widths. In a money chart, that’s a trust problem.'},
  {what: 'Each point names its bill amount, and both keys stay visible with the math open.', why: 'Less decoding, and no suggestion that the line is a full spending range.'},
];

export const TASKS = [
  {id: 'table', screen: 'baseline', title: 'Pick a plan from the familiar benefits table',
    hint: 'This is the baseline most portals show. Then choose Yearly cost view, top right, and compare.'},
  {id: 'lose', screen: 'compare', title: 'Find the plan that costs more in every example, and why',
    hint: 'Read the note under the chart, then Show proof.'},
  {id: 'high', screen: 'compare', title: 'See how the plans rank with $40,000 in covered bills',
    hint: 'Choose the $40,000 example: the rows re-rank and every total updates.'},
  {id: 'b', screen: 'compare', title: 'Choose Plan B anyway, and see what review asks of you',
    hint: 'Select Plan B, then review it. Saving asks you to confirm the $600 first.'},
];

export const TEST_PLAN = [
  'Five classmates each choose from two fictional menus, one in the baseline table and one in the redesign, in counterbalanced order.',
  'Measures: dominated choices, time to decide, and whether each person can explain their pick back.',
  'Questions they haven’t seen, answered before the arithmetic is shown: A and B’s difference at $12,000 in covered bills; whether $0 in bills is the first point; what happens to premiums after the out-of-pocket maximum; whether uncovered bills can go past it.',
];
export const HYPOTHESES = [
  'Pricing the whole year cuts dominated choices.',
  'People explain their choice back more accurately from the yearly view than from the table.',
  'An informational note changes choices without making anyone feel scolded.',
];
export const RESULTS = ['Chose a dominated plan, table', 'Chose a dominated plan, yearly view', 'Explained their pick back'];

export const REFLECTION = [
  {title: 'What I’d keep', body: 'Proving the loss instead of inferring it from three dots. Plan B is flagged only because its terms match Plan A’s and its premium is higher, so the claim holds at every bill amount, not just the ones on screen.'},
  {title: 'What I don’t know yet', body: 'Whether people read a range chart at all under deadline pressure, and how often real menus, where plans differ in network and drug coverage, leave a plan this cleanly dominated.'},
  {title: 'What’s next', body: 'The five-person comparison, with answers recorded before the arithmetic is revealed. Then plans that differ in more than price, where the proof gets harder and the design has to say less.'},
];
