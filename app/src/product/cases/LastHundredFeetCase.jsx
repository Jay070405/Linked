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
import CaseChrome from '../v2/CaseChrome';
import {L100_KIT, l100Shot, Phone, ProtoScreen} from '../v2/Device';
import {ArrowDown, Info} from '../v2/icons';
import {FINE, PHONE, useMedia, useReveals} from '../v2/motion';
import '../v2/v2.css';
import './lf.css';

// Sources: cases/d3-last-100-feet/BRIEF.md and d3-last-100-feet-prototype/README.md (round 2, after a model-assisted
// design review), Oct 19 2026. The photos in the prototype are AI-generated illustrative images of a fictional complex;
// the counts on its screens (38 seconds, 9 couriers, 14 couriers) are illustrative. Evidence from outside is soft and
// labeled: Amazon's June 2026 note on Flex building-entrance routing, and Beans' founder's claim (a company claim).
// Nothing here has been tested with couriers or residents yet.

const A = '/assets/product/last-100-feet/';
const AI = 'Photos are AI-generated illustrative images, not a real location.';

// The chapter rail and chip (v2/CaseChrome): every id is an element on this page.
const CHAPTERS = [
  {id: 'lf-problem-section', label: 'The problem'},
  {id: 'lf-flow', label: 'Two roles, one route'},
  {id: 'lf-decisions', label: 'Decisions'},
  {id: 'lf-compare', label: 'Round 1 → 2'},
  {id: 'try', label: 'Try it'},
  {id: 'lf-testing-section', label: 'Testing'},
  {id: 'lf-reflection-section', label: 'Reflection'},
];

const NUMBERS = [
  {value: 10, unit: 'to 15 min', label: 'Lost per delivery at complexes, by one company’s count', note: <><Ev label="Sourced"/> Beans’ founder. Beans maps complexes for drivers; this is a company claim, not a study.</>},
  {value: 40, label: 'States in the coded prototype', note: 'Resident and courier, each with its own deep link'},
  {value: 90, unit: 's', label: 'Target for a resident to map the way in', note: <><Ev label="Hypothesis"/> From the brief. The prototype’s “38 seconds” is illustrative until test day.</>},
];

const STEPS = [
  {id: 'way-in', screen: 'r-pin-gate', label: 'Resident: way in', title: 'Mark the way in on a blank plan',
    alt: 'Where do couriers walk in? A blank site plan from public map data, a pin on the wall, and entrance types: gate with call box, open walkway, lobby door',
    body: <p>The resident starts from public map data: buildings, no gates, no walkways. One tap on the wall where couriers walk in, the kind of entrance, and the unit from the address.</p>},
  {id: 'basics', screen: 'r-basics', label: 'Resident: saved', title: 'Useful before a single photo',
    alt: 'The basics are saved: the entrance and the code, stored privately; photos, a stop suggestion and privacy settings are optional',
    body: <p>The way in and the gate code are enough to help the next courier; the code is shown only to the courier on the order, at the gate. Photos of each turn are optional. The 38 seconds on screen is illustrative; test day will time it.</p>},
  {id: 'arrive', screen: 'c-arrive', label: 'Courier: arrival', title: 'Arrive knowing where to stop and where to walk',
    alt: 'Arrival card: stop on Elm St, walk in the front gate; the route drawn on the site plan from the stop to door 214, with curb rules',
    body: <p>The arrival card names a verified stop on Elm St, then the gate, Building&nbsp;4, the stairs and door&nbsp;214, drawn on the site plan with the curb rules spelled out. The order stays on every card.</p>},
  {id: 'card', screen: 'c-step-building', label: 'Courier: photo cards', title: 'Follow photos, not a pin',
    alt: 'Step 3 of 5, Building 4: a photo of the courtyard path, 125 ft walk, keep right where the path splits',
    body: <p>Half the screen is the photo, because the photo is the instruction. A landmark, a distance that says what it measures, one sentence, and one action in the thumb zone. Swipe or tap to the next.</p>},
  {id: 'gate', screen: 'c-gate-confirm', label: 'Courier: gate', title: 'Get through the gate when GPS is wrong',
    alt: 'Confirm you’re at the Elm St gate: the resident’s gate photo, GPS is weak here, a reason, and Show the code',
    body: <p>The order authorizes the code; being at the gate only reveals it. When GPS can’t place the courier, they compare the resident’s gate photo, pick a reason, and the code opens, logged for the resident.</p>},
  {id: 'door', screen: 'c-dropoff-match', label: 'Courier: drop-off', title: 'Check the door; don’t let the app decide',
    alt: 'Check the door: the courier’s photo next to the resident’s door photo, an auto-check hint, and checkboxes the courier ticks',
    body: <p>The courier’s photo sits beside the resident’s door photo. The auto-check is a labeled hint and the courier ticks what they see. No photo possible? They complete with where it was left and why.</p>},
  {id: 'off', screen: 'c-feedback', label: 'Courier: feedback', title: 'Directions were off? Fix it for the next courier',
    alt: 'What was off? The five steps as thumbnails with the gate selected, reasons as large chips, and the courier’s own photo attached',
    body: <p>Three taps: the step, what was wrong, an optional photo. The note is live for the next courier at once. The resident gets the courier’s photo as “Not this gate,” and two flags in a week ask the building manager.</p>},
];

const shot = (id, position) => <img src={l100Shot(id)} alt="" loading="lazy" decoding="async" style={{objectPosition: position}}/>;
const DECISIONS = [
  {id: 'card', title: 'The photo is the instruction', verdict: 'Glance, don’t read: one hand is holding a hot bag.',
    tried: 'A map pin with a typed note, read while walking.',
    chose: 'Photo first, a landmark title, a distance that says what it measures, one sentence and one action in the thumb zone.',
    visual: shot('c-step-building', '50% 38%')},
  {id: 'code', title: 'The order authorizes; the gate reveals', verdict: 'A geofence shouldn’t strand a courier at the right gate.',
    tried: 'Round 1: the code only within 50 m, and with weak GPS, “ask the resident to buzz you in.”',
    chose: 'Hold to show inside 160 ft. “At the gate already?” opens a photo self-check and a reason, logged for the resident.',
    visual: shot('c-gate-revealed', '50% 72%')},
  {id: 'blank', title: 'Author the minimum, from zero', verdict: 'A route that helps tonight beats a perfect one never finished.',
    tried: 'Round 1: setup began with four of five photos done and the gates already known.',
    chose: 'A blank plan from public map data: tap the way in, set access, done. Photos and a stop suggestion are optional.',
    visual: shot('r-pin-gate', '50% 30%')},
  {id: 'stop', title: 'Where to stop isn’t how to get in', verdict: 'Never suggest a red curb.',
    tried: '“Park on Elm St” beside a photo with a red curb in it.',
    chose: 'A verified, unrestricted stop with the curb rules in words and color. Residents suggest stops; couriers verify them.',
    visual: shot('c-step-park', '50% 78%')},
  {id: 'stale', title: 'Recovery doesn’t wait for the resident', verdict: 'Buildings change; the route has to notice.',
    tried: 'A flag that sat until the resident fixed the step.',
    chose: 'A flag is live for the next courier at once. Two in a week gray the photo, show the detour couriers used, and ask the manager.',
    visual: shot('c-step-stale', '50% 70%')},
];

const R = `${A}rounds/`;
const ROUNDS = [
  {id: 'gps', tab: 'Weak GPS', caption: 'Weak GPS at the gate. Round 1 hid the code and offered “ask Dana to buzz you in”; round 2 lets the courier confirm by hand.',
    before: {src: `${R}gps-r1.webp`, label: 'Round 1'}, after: {src: `${R}gps-r2.webp`, label: 'Round 2'}},
  {id: 'stop', tab: 'Where to stop', caption: 'Step 1. Round 1 said “Park on Elm St” over a red curb; round 2 names a verified stop and spells out the curb rules.',
    before: {src: `${R}stop-r1.webp`, label: 'Round 1'}, after: {src: `${R}stop-r2.webp`, label: 'Round 2'}},
  {id: 'photos', tab: 'Photo steps', caption: 'Resident photos. Round 1 started at four of five done; round 2 starts at zero, and every photo is optional.',
    before: {src: `${R}photos-r1.webp`, label: 'Round 1'}, after: {src: `${R}photos-r2.webp`, label: 'Round 2'}},
  {id: 'dropoff', tab: 'Drop-off', caption: 'The drop-off camera. Round 1 laid the resident’s photo over the view; round 2 is a clear camera with the reference as a thumbnail.',
    before: {src: `${R}dropoff-r1.webp`, label: 'Round 1'}, after: {src: `${R}dropoff-r2.webp`, label: 'Round 2'}},
];
// From d3-last-100-feet-prototype/README.md, "Round 2: design review".
const CHANGES = [
  {what: 'The order authorizes the code and proximity only reveals it; “At the gate already?” opens a photo self-check and a reason.', why: 'A hard 50 m boundary can strand a courier at the right gate, and GPS is unreliable between buildings.'},
  {what: 'Call and Message work: a private-number call, one-tap messages, the reply in place.', why: 'Contact is the core recovery path, not decoration.'},
  {what: 'A verified, unrestricted stop with the curb rules on the card, the arrival card and the plan.', why: 'Implying a red curb is fine to stop at is a safety and ticket problem.'},
  {what: 'An order chip on every card, with the stacked orders and switching.', why: 'In a stacked delivery, “Door 214” alone invites a wrong handoff.'},
  {what: 'Setup starts from a blank plan, is useful after the way in and the code, and treats photos as optional.', why: 'Round 1 measured finishing a prepared route, not creating one.'},
  {what: 'A flag is live for the next courier at once; two mark a step unverified and ask the building manager.', why: 'A resident might never respond, and buildings change.'},
];

const TASKS = [
  {id: 'code', screen: 'c-gate-near', title: 'Show the gate code the way a courier would',
    hint: 'Hold the red button about a second. The code hides after 20 seconds; one tap brings it back.'},
  {id: 'walk', screen: 'c-step-park', title: 'Walk from the stop on Elm St to door 214',
    hint: 'Swipe the cards or press Next. The mini map lights the leg you’re on.'},
  {id: 'gps', screen: 'c-gps-weak', title: 'Get through the gate when GPS can’t place you',
    hint: 'Tap I’m at the gate, compare the photo, pick a reason, then show the code.'},
  {id: 'resident', screen: 'r-pin-gate', title: 'As the resident, mark the way in on a blank plan',
    hint: 'Tap the wall where couriers walk in; the pin snaps to it and Next unlocks.'},
];

/** The hero: the complex's site plan, the resident's phone on the plan, the courier's live phone at the gate. */
function Stage({phone, reduced}) {
  return <div className="lf-stage-wrap">
    <div className="lf-stage" data-enter="stage">
      <div className="lf-plan" data-enter="back"><div data-depth="8">
        <img src={`${A}plan.webp`} width={808} height={768} fetchPriority="high"
          alt="Site plan of a fictional garden-style complex: Elm St, the front gate, buildings 1 to 4, and the walk to door 214"/>
      </div></div>
      <div className="lf-phone is-resident" data-enter="front"><div data-depth="14">
        <p className="lf-role"><span className="lf-dot" data-role="resident"/>Resident, at home</p>
        <Phone label="Resident app">
          <ProtoScreen kit={L100_KIT} screen="r-pin-gate" load="never" alt="The resident’s blank plan: tap the wall where couriers walk in"/>
        </Phone>
      </div></div>
      <div className="lf-phone is-courier" data-enter="front"><div data-depth="22">
        <p className="lf-role"><span className="lf-dot" data-role="courier"/>Courier, at the gate</p>
        <Phone label="Courier app, live">
          <ProtoScreen kit={L100_KIT} screen="c-gate-near" load={phone ? 'never' : 'idle'} delay={1600} interactive={!phone} reduced={reduced}
            title="Last 100 Feet prototype: the courier at the Elm St gate"
            alt="The courier at the Elm St gate: the resident’s gate photo, 15 ft away, and Hold to show gate code"/>
        </Phone>
      </div></div>
    </div>
    <p className="lf-stage-note" data-enter="note">{phone ? AI : `Live prototype: hold the red button to show the gate code. ${AI}`}</p>
  </div>;
}

/** What a courier gets today versus with a door route, both from the prototype. */
function PinVsRoute() {
  return <figure className="lf-vs" data-reveal="">
    <div className="lf-vs-row">
      <div className="lf-vs-col">
        <p className="lf-vs-label">A pin and a note</p>
        <Phone><img className="v2-shot" src={l100Shot('c-empty')} width={780} height={1688} loading="lazy" decoding="async"
          alt="No door route here yet: the map pin is on the garage gate on Cypress Ave, with the resident’s note, Call and Message"/></Phone>
      </div>
      <div className="lf-vs-col">
        <p className="lf-vs-label">The same stop with a door route</p>
        <Phone><img className="v2-shot" src={l100Shot('c-arrive')} width={780} height={1688} loading="lazy" decoding="async"
          alt="The arrival card: stop on Elm St, walk in the front gate, five steps to door 214"/></Phone>
      </div>
    </div>
    <figcaption className="v2-caption">Both from the prototype: a stop with no route, its pin on the garage gate, and the same stop after the resident mapped the way in. {AI}</figcaption>
  </figure>;
}

export default function LastHundredFeetCase({item, reduced}) {
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

  return <article ref={root} className="pp-page v2-page lf-page" lang="en" data-nav-tone="light">
    <CaseHero reduced={reduced} title="Last 100 Feet"
      kind={<><span>{item.kind}</span><span className="v2-flag"><Info/>Independent concept, not affiliated with any delivery company</span></>}
      outcome="The resident maps the way from the curb to their door once. Every courier after them follows it, photo by photo, without calling, and still gets in when the gate or the GPS doesn’t cooperate."
      chips={['Solo: research, design and prototype', 'October 2026', 'iOS concept, two roles', 'Not yet tested with couriers']}
      actions={phone
        ? <a className="v2-link" href="#lf-problem-section" onClick={jumpTo('#lf-problem-section')}><span className="v2-link-text">Start with the problem</span><ArrowDown/></a>
        : <a className="v2-cta" href="#try" onClick={jumpTo('#try')}><span>Try the prototype</span><span className="v2-cta-icon"><ArrowDown/></span></a>}>
      <Stage phone={phone} reduced={reduced}/>
    </CaseHero>
    <CaseChrome root={root} chapters={CHAPTERS} reduced={reduced}/>

    <NumberStrip items={NUMBERS} reduced={reduced} label="The case in numbers"/>

    <section id="lf-problem-section" className="v2-problem" aria-labelledby="lf-problem">
      <div className="v2-problem-copy" data-reveal="">
        <h2 id="lf-problem" className="v2-h2" tabIndex={-1}>The map ends at the curb</h2>
        <div className="v2-prose">
          <p>Delivery apps route to an address. In a garden-style complex, the pin can land on the leasing office or the garage, the walk-in gate is around the corner, and the building numbers face the courtyard. Couriers call, guess, or walk the whole complex with a hot bag in one hand.</p>
          <p>Others are working on the same gap. Amazon added building-entrance routing for Flex drivers in June 2026 and says apartment stops “can be challenging.” Beans, an app that only maps complexes, exists because of it.</p>
        </div>
        <p className="v2-hyp"><Ev label="Sourced"/><span>Amazon, June 2026. The Beans figure in the strip above is its founder’s claim.</span></p>
        <p className="v2-hyp"><Ev label="Hypothesis"/><span>No delivery company publishes this. Three courier conversations and a field test come next.</span></p>
      </div>
      <aside className="v2-quote-slot" data-reveal="" aria-label="Courier quotes, not collected yet">
        <p className="v2-slot-badge">Placeholder</p>
        <p>Quotes from three courier conversations go here: what they do when the pin lands on the leasing office.</p>
      </aside>
      <PinVsRoute/>
    </section>

    <Scrolly id="lf-flow" kit={L100_KIT} steps={STEPS} reduced={reduced} label="Resident, then courier" title="Last 100 Feet prototype, following the steps"
      heading="Two roles, one route"
      lede={`From the resident’s first tap to the courier’s last. The phone runs the real prototype. ${AI}`}/>

    <Decisions id="lf-decisions" items={DECISIONS}
      heading="What I chose, and what I tried first"
      lede="Five choices, most of them sharpened in round 2. Each card shows the choice; open it to see what it replaced."/>

    <BeforeAfter id="lf-compare" reduced={reduced} pairs={ROUNDS} label="Compare round 1 with round 2"
      heading="Round 1 → Round 2"
      lede="Round 2 came out of a design review. Pick a screen and drag across the phone to compare the two rounds.">
      <p className="v2-review-note"><span><b>A model-assisted design review.</b> I asked a model to critique round 1 as a delivery-app design lead would. It scored craft 8, interaction 6 and product thinking 5: convincing to look at, but it made hard logistics look solved with prepared content. Round 2 answers that. It’s a critique, not the field test below.</span></p>
      <RoundChanges items={CHANGES}/>
    </BeforeAfter>

    <LivePrototype id="try" reduced={reduced} kit={L100_KIT} name="Last 100 Feet prototype" tasks={TASKS}
      start={{screen: 'c-arrive'}} resetState={() => {}}
      heading="Try it yourself"
      lede="The same prototype, at full size. Pick a task; the phone opens on the screen where it starts."
      phoneLede="The same prototype. Each task opens it full screen, on the screen where it starts."
      note={`It runs in your browser only; nothing is sent anywhere. Reset starts over. ${AI}`}/>

    <section id="lf-testing-section" className="v2-testing" aria-labelledby="lf-testing">
      <div className="v2-section-head" data-reveal="">
        <h2 id="lf-testing" className="v2-h2">Testing comes next</h2>
        <p className="v2-lede">Nothing here has been tested with couriers or residents yet. This is the plan, and the space the results will fill.</p>
      </div>
      <div className="v2-testing-grid">
        <div className="v2-testing-plan" data-reveal="">
          <h3 className="v2-h3">Plan for one afternoon at a real complex</h3>
          <ul className="v2-list">
            <li>Four first-time visitors try to reach one unit: two with a pin and a text note, two with the door route.</li>
            <li>Measures: time from the car to the door, wrong turns, and calls needed.</li>
            <li>Two residents author a route from a blank plan, timed against the 90-second target.</li>
            <li>Real photos of the complex replace the AI-generated ones, and GPS error at the gate decides whether 160 ft is the right radius.</li>
            <li>Before that, three conversations with couriers about apartment drop-offs.</li>
          </ul>
          <h3 className="v2-h3">Hypotheses to check</h3>
          <ul className="v2-hypotheses">
            <li><Ev label="Hypothesis"/><span>A photo route cuts car-to-door time and calls for first-time visitors.</span></li>
            <li><Ev label="Hypothesis"/><span>A resident can map the way in from a blank plan in under 90 seconds.</span></li>
            <li><Ev label="Hypothesis"/><span>Couriers can follow the cards at a glance with one hand busy.</span></li>
          </ul>
        </div>
        <div className="v2-results" data-reveal="" aria-label="Results, not collected yet">
          <p className="v2-slot-badge">Placeholder: results after the field test</p>
          <dl>
            <div><dt>Car to door, pin and note</dt><dd>— min</dd></div>
            <div><dt>Car to door, door route</dt><dd>— min</dd></div>
            <div><dt>Calls needed</dt><dd>— of 4</dd></div>
            <div><dt>Time to map the way in</dt><dd>— s</dd></div>
          </dl>
          <p className="v2-results-note">Each result will sit next to the change it caused.</p>
        </div>
      </div>
    </section>

    <section id="lf-reflection-section" className="v2-reflection" aria-labelledby="lf-reflection">
      <h2 id="lf-reflection" className="v2-h2" data-reveal="">Reflection</h2>
      <div className="v2-reflection-grid">
        <div data-reveal=""><h3 className="v2-h3">What I’d keep</h3><p>Two separations: where to stop is not how to get in, and the order, not the courier’s position, is what grants the code. Both came from asking what happens when something goes wrong at the gate.</p></div>
        <div data-reveal=""><h3 className="v2-h3">What I don’t know yet</h3><p>Whether residents map a route at all without a nudge, and how far off GPS is between buildings at a real complex. The 160 ft radius and every count on the screens are placeholders until then.</p></div>
        <div data-reveal=""><h3 className="v2-h3">What’s next</h3><p>The field test with real photos. Then the two states round 2 only describes: the building manager’s confirmation, and what a courier sees when access ends.</p></div>
      </div>
    </section>

    <NextProject item={next} image={next.thumb}/>
    <ProductFooter/>
    {fine ? <CursorLabel root={root} reduced={reduced}/> : null}
  </article>;
}
