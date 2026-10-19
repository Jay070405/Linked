import {lazy, useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {flushSync} from 'react-dom';
import {Ev} from '../../CaseKit';
import {Go} from '../../Go';
import {ProductFooter} from '../../ProductIndex';
import {PRODUCT_HOME, nextCase} from '../../content';
import {scrollerOf} from '../../v2/motion';
import {ArrowDown, ArrowRight, Info} from '../../v2/icons';
import {LEGS} from '../../v2/data/l100-route';
import Stage from './Stage';
import Hud from './Hud';
import GateLock from './GateLock';
import {Beat, Decision, Deferred, PhoneShot, PhotoCard, PhotoViewer, Step} from './parts';
import {AI, BEATS, CHANGES, DECISIONS, LEG_CARDS, NUMBERS, ROUNDS, STOPS, TASKS} from './content';
import {TOTAL_FEET, bag, useBag, warmthWord} from './walk';
import './world.css';

/* D3, Last 100 Feet: "The delivery run" (site-spec/WORLDS.md, D3). The page is the complex at dusk, seen from above,
   and scrolling walks a courier along the resident's route: the Elm St curb, the gate, Building 4, the stairs, door
   214. Each waypoint is a chapter: the resident's photo for that turn, and the part of the case that happens there.
   The gate locks the walk until you show the code (Skip is always there); a hot-bag HUD cools while you hesitate or
   send the courier to the garage. "Skip the walk" switches to a plain reading mode with the same content, and
   reduced motion gets the same page without the glide. */

const DoorRun = lazy(() => import('./DoorRun'));
const GateCode = lazy(() => import('./GateCode'));
const Compare = lazy(() => import('./Compare'));
const LiveTry = lazy(() => import('./LiveTry'));

const OUTCOME = 'The resident maps the way from the curb to their door once. Every courier after them follows it, photo by photo, without calling, and still gets in when the gate or the GPS doesn’t cooperate.';
const CHIPS = ['Solo: research, design and prototype', 'October 2026', 'iOS concept, two roles', 'Not yet tested with couriers'];

function useViewport(root) {
  const [size, setSize] = useState(() => ({w: typeof document === 'undefined' ? 1440 : document.documentElement.clientWidth, h: typeof innerHeight === 'number' ? innerHeight : 900}));
  useLayoutEffect(() => {
    const sc = scrollerOf(root.current);
    const measure = () => setSize(s => {
      const w = sc === window ? document.documentElement.clientWidth : sc.clientWidth, h = sc === window ? innerHeight : sc.clientHeight;
      return s.w === w && s.h === h ? s : {w, h};
    });
    measure();
    addEventListener('resize', measure);
    return () => removeEventListener('resize', measure);
  }, [root]);
  return size;
}

/** The walk between two stops: the card a courier reads on the way, and the feet left, counting down as you scroll. */
function Leg({i}) {
  return <div className="w3-leg" data-leg={i}>
    <div className="w3-leg-card">
      <p className="w3-leg-count"><span data-count={i}>{LEGS[i].feet}</span><span className="w3-leg-unit"> ft</span></p>
      <p className="w3-leg-to">to {LEG_CARDS[i].to}</p>
      <p className="w3-leg-say">{LEG_CARDS[i].say}</p>
    </div>
  </div>;
}

function Delivered() {
  const b = useBag();
  return <p className="w3-delivered" aria-live="polite">
    <span className="w3-delivered-dot" data-on={b.delivered || undefined} aria-hidden="true"/>
    {b.delivered
      ? <>Delivered {warmthWord(b.warmth).toLowerCase()}, {TOTAL_FEET} ft from the stop.{b.gateSeconds ? ` You were through the gate in ${b.gateSeconds} s.` : ''}{b.note ? ` The bag cooled on the way: ${b.note.toLowerCase()}.` : ''}</>
      : <>{TOTAL_FEET} ft from the stop to this door, five turns.</>}
  </p>;
}

export default function LastHundredFeetWorld({item, reduced}) {
  const root = useRef(null);
  const size = useViewport(root);
  const [plain, setPlain] = useState(false);
  const [gate, setGate] = useState('closed');     // closed | open | skipped
  const [reached, setReached] = useState(0);
  const next = nextCase(item.slug);
  useEffect(() => { bag.reset(); }, []);

  const onOpen = useCallback(() => setGate('open'), []);
  const onSkip = useCallback(() => setGate(g => (g === 'closed' ? 'skipped' : g)), []);
  const scrollToId = (id, e) => {
    const target = root.current?.querySelector(`#${id}`);
    if (!target) return;
    e?.preventDefault();
    target.scrollIntoView({behavior: reduced || e?.detail === 0 ? 'auto' : 'smooth', block: 'start'});
    const h = target.querySelector('h2, h3') || target;
    if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
    h.focus({preventScroll: true});
  };
  // jumping past the gate opens it on the way: a link is a skip, not a walk
  const jump = (id, e, pastGate) => {
    if (pastGate) flushSync(() => setGate(g => (g === 'closed' ? 'skipped' : g)));
    scrollToId(id, e);
  };
  const onRail = (i, e) => jump(STOPS[i].id, e, i >= 1);
  const togglePlain = e => {
    e.preventDefault();
    const to = !plain;
    flushSync(() => setPlain(to));
    scrollToId(to ? 'w3-curb' : 'w3-top', {preventDefault() {}, detail: 0});
  };

  return <article ref={root} id="w3-top" className={`w3${plain ? ' is-plain' : ''}${reduced ? ' is-reduced' : ''}`} lang="en" data-nav-tone="dark" tabIndex={-1}>
    <a className="w3-skipwalk" href="#w3-curb" onClick={togglePlain}>{plain ? 'Take the walk instead' : 'Skip the walk: read the case plainly'}</a>
    <PhotoViewer>
      <div className="w3-run">
        {plain ? null : <>
          <Stage root={root} size={size} reduced={reduced} gateOpen={gate !== 'closed'} onReach={setReached}/>
          <div className="w3-hudbar"><Hud reached={reached} onJump={onRail}/></div>
        </>}

        <header className="w3-hero" data-w3-hero="">
          <div className="w3-hero-copy">
            <p className="w3-flag"><Info/>Independent concept, not affiliated with any delivery company</p>
            <p className="w3-kind">{item.kind}</p>
            <h1 className="w3-title">Last 100 Feet</h1>
            <p className="w3-outcome">{OUTCOME}</p>
            <div className="w3-hero-actions">
              <a className="w3-cta" href="#w3-curb" onClick={e => scrollToId('w3-curb', e)}><span>{plain ? 'Start reading' : 'Start the walk'}</span><ArrowDown width={18} height={18}/></a>
              <a className="w3-textlink" href="#w3-try" onClick={e => jump('w3-try', e, true)}>Try the prototype</a>
            </div>
            <ul className="w3-chips" aria-label="About this project">{CHIPS.map(c => <li key={c}>{c}</li>)}</ul>
          </div>
          {plain ? null : <p className="w3-hero-hint" aria-hidden="true">Scroll to walk the route: {TOTAL_FEET} ft from the stop to door 214.</p>}
        </header>

        {/* ---------- 1. Elm St curb: the problem ---------- */}
        <section id="w3-curb" className="w3-stop" data-stop="0" aria-labelledby="w3-curb-title">
          <div className="w3-stop-main">
            <div className="w3-col">
              <Step i={0} name="Elm St curb"/>
              <h2 id="w3-curb-title" className="w3-h2">The map ends at the curb</h2>
              <div className="w3-prose">
                <p>Delivery apps route to an address. In a garden-style complex, the pin can land on the leasing office or the garage, the walk-in gate is around the corner, and the building numbers face the courtyard. Couriers call, guess, or walk the whole complex with a hot bag in one hand.</p>
                <p>Others are working on the same gap. Amazon added building-entrance routing for Flex drivers in June 2026 and says apartment stops “can be challenging.” Beans, an app that only maps complexes, exists because of it.</p>
              </div>
              <p className="w3-ev"><Ev label="Sourced"/><span>Amazon, June 2026. The Beans figure below is its founder’s claim.</span></p>
              <p className="w3-ev"><Ev label="Hypothesis"/><span>No delivery company publishes this. Three courier conversations and a field test come next.</span></p>
              <ul className="w3-numbers" aria-label="The case in numbers">
                {NUMBERS.map(n => <li key={n.label}>
                  <p className="w3-num"><b>{n.value}</b>{n.unit ? <span> {n.unit}</span> : null}</p>
                  <p className="w3-num-label">{n.label}</p>
                  <p className="w3-num-note">{n.note}</p>
                </li>)}
              </ul>
              <aside className="w3-slot" aria-label="Courier quotes, not collected yet">
                <p className="w3-slot-badge">Placeholder</p>
                <p>Quotes from three courier conversations go here: what they do when the pin lands on the leasing office.</p>
              </aside>
            </div>
            <div className="w3-aside"><PhotoCard stop={STOPS[0]} i={0}/></div>
          </div>

          <div id="w3-find" className="w3-sheet">
            <div className="w3-sheet-head">
              <h3 className="w3-h2 is-sheet">Find the door</h3>
              <p className="w3-lede">You’re delivering to unit 214. The app gives you what most apps give a courier: the address, and its pin.</p>
            </div>
            <Deferred minHeight={760} label="A site plan to try"><DoorRun reduced={reduced}/></Deferred>
          </div>

          <div className="w3-stop-main">
            <div className="w3-col">
              <Beat beat={BEATS.arrive}/>
              <Decision d={DECISIONS.stop}/>
            </div>
            <div className="w3-aside"/>
          </div>
        </section>

        <Leg i={0}/>

        {/* ---------- 2. Elm St gate: the lock, then the code ---------- */}
        <GateLock reduced={reduced} plain={plain} state={gate} onOpen={onOpen} onSkip={onSkip}/>
        <section className="w3-stop" data-stop="1" data-zoom=".9" aria-labelledby="w3-code-title">
          <div className="w3-stop-main">
            <div className="w3-col">
              <h2 id="w3-code-title" className="w3-h2">{DECISIONS.code.title}</h2>
              <p className="w3-lede">{DECISIONS.code.verdict}</p>
              <dl className="w3-tc">
                <div><dt>Tried first</dt><dd>{DECISIONS.code.tried}</dd></div>
                <div><dt>Chose</dt><dd>{DECISIONS.code.chose}</dd></div>
              </dl>
              <Beat beat={BEATS.gate}/>
            </div>
            <div className="w3-aside"><PhotoCard stop={STOPS[1]} i={1}/></div>
          </div>
          <div className="w3-sheet">
            <div className="w3-sheet-head">
              <h3 className="w3-h2 is-sheet">The gate code, in your hands</h3>
              <p className="w3-lede">The courier’s gate step from the prototype, on its own. The code belongs to the order; walking up to the gate only reveals it, and it hides again on its own.</p>
            </div>
            <Deferred minHeight={560} label="The gate step, to try"><GateCode reduced={reduced}/></Deferred>
          </div>
        </section>

        <Leg i={1}/>

        {/* ---------- 3. Building 4: photo cards ---------- */}
        <section id="w3-courtyard" className="w3-stop" data-stop="2" aria-labelledby="w3-courtyard-title">
          <div className="w3-stop-main">
            <div className="w3-col">
              <Step i={2} name="Building 4"/>
              <h2 id="w3-courtyard-title" className="w3-h2">{BEATS.card.title}</h2>
              <div className="w3-prose"><p>{BEATS.card.body}</p></div>
              <div className="w3-pair">
                <PhoneShot screen={BEATS.card.screen} alt={BEATS.card.alt}/>
                <Decision d={DECISIONS.card}/>
              </div>
            </div>
            <div className="w3-aside"><PhotoCard stop={STOPS[2]} i={2}/></div>
          </div>
        </section>

        <Leg i={2}/>

        {/* ---------- 4. The stairs: when the building changes; round 1 to round 2 ---------- */}
        <section id="w3-stairs" className="w3-stop" data-stop="3" aria-labelledby="w3-stairs-title">
          <div className="w3-stop-main">
            <div className="w3-col">
              <Step i={3} name="Stairs"/>
              <h2 id="w3-stairs-title" className="w3-h2">{DECISIONS.stale.verdict}</h2>
              <div className="w3-pair">
                <PhoneShot screen={DECISIONS.stale.screen} alt="Stairs flagged twice: the photo grayed, the detour recent couriers used on the mini map, the building manager asked to confirm"/>
                <Decision d={{...DECISIONS.stale, verdict: null}}/>
              </div>
              <Beat beat={BEATS.off}/>
            </div>
            <div className="w3-aside"><PhotoCard stop={STOPS[3]} i={3}/></div>
          </div>
          <div id="w3-rounds" className="w3-sheet">
            <div className="w3-sheet-head">
              <h3 className="w3-h2 is-sheet">Round 1 → Round 2</h3>
              <p className="w3-lede">Round 2 came out of a design review. Pick a screen and drag across the phone to compare the two rounds.</p>
            </div>
            <div className="w3-rounds">
              <Deferred minHeight={640} label="Compare round 1 with round 2"><Compare pairs={ROUNDS} reduced={reduced}/></Deferred>
              <div className="w3-rounds-text">
                <p className="w3-review"><b>A model-assisted design review.</b> I asked a model to critique round 1 as a delivery-app design lead would. It scored craft 8, interaction 6 and product thinking 5: convincing to look at, but it made hard logistics look solved with prepared content. Round 2 answers that. It’s a critique, not the field test below.</p>
                <h4 className="w3-h3">What changed and why</h4>
                <ul className="w3-changes">{CHANGES.map(c => <li key={c.what}><p>{c.what}</p><p className="w3-why">{c.why}</p></li>)}</ul>
              </div>
            </div>
          </div>
        </section>

        <Leg i={3}/>

        {/* ---------- 5. Door 214: the drop-off, the resident behind the door, then try it ---------- */}
        <section id="w3-door" className="w3-stop" data-stop="4" data-zoom="1.12" aria-labelledby="w3-door-title">
          <div className="w3-stop-main">
            <div className="w3-col">
              <Step i={4} name="Door 214"/>
              <h2 id="w3-door-title" className="w3-h2">{BEATS.door.title}</h2>
              <Delivered/>
              <div className="w3-pair">
                <PhoneShot screen={BEATS.door.screen} alt={BEATS.door.alt}/>
                <div className="w3-prose"><p>{BEATS.door.body}</p></div>
              </div>
              <h3 className="w3-h2 is-sub">Behind the door, the resident who drew the route</h3>
              <div className="w3-prose"><p>Dana set this route up once, from a blank plan, so that this walk could happen without a call.</p></div>
              <Beat beat={BEATS.wayIn}/>
              <Beat beat={BEATS.basics}/>
              <Decision d={DECISIONS.blank}/>
            </div>
            <div className="w3-aside"><PhotoCard stop={STOPS[4]} i={4}/></div>
          </div>

          <div id="w3-try" className="w3-sheet is-try">
            <div className="w3-sheet-head">
              <h3 className="w3-h2 is-sheet">Try it yourself</h3>
              <p className="w3-lede">The same prototype, at full size. Pick a task; the phone opens on the screen where it starts.</p>
            </div>
            <Deferred minHeight={760} label="The live prototype"><LiveTry tasks={TASKS} reduced={reduced}
              note={`It runs in your browser only; nothing is sent anywhere. Reset starts over. ${AI}`}/></Deferred>
          </div>

          <div className="w3-stop-main is-epilogue">
            <div className="w3-col">
              <h2 id="w3-testing" className="w3-h2">Testing comes next</h2>
              <p className="w3-lede">Nothing here has been tested with couriers or residents yet. This is the plan, and the space the results will fill.</p>
              <h3 className="w3-h3">Plan for one afternoon at a real complex</h3>
              <ul className="w3-list">
                <li>Four first-time visitors try to reach one unit: two with a pin and a text note, two with the door route.</li>
                <li>Measures: time from the car to the door, wrong turns, and calls needed.</li>
                <li>Two residents author a route from a blank plan, timed against the 90-second target.</li>
                <li>Real photos of the complex replace the AI-generated ones, and GPS error at the gate decides whether 160 ft is the right radius.</li>
                <li>Before that, three conversations with couriers about apartment drop-offs.</li>
              </ul>
              <h3 className="w3-h3">Hypotheses to check</h3>
              <ul className="w3-hyps">
                <li><Ev label="Hypothesis"/><span>A photo route cuts car-to-door time and calls for first-time visitors.</span></li>
                <li><Ev label="Hypothesis"/><span>A resident can map the way in from a blank plan in under 90 seconds.</span></li>
                <li><Ev label="Hypothesis"/><span>Couriers can follow the cards at a glance with one hand busy.</span></li>
              </ul>
              <div className="w3-slot is-results" aria-label="Results, not collected yet">
                <p className="w3-slot-badge">Placeholder: results after the field test</p>
                <dl>
                  <div><dt>Car to door, pin and note</dt><dd>— min</dd></div>
                  <div><dt>Car to door, door route</dt><dd>— min</dd></div>
                  <div><dt>Calls needed</dt><dd>— of 4</dd></div>
                  <div><dt>Time to map the way in</dt><dd>— s</dd></div>
                </dl>
                <p>Each result will sit next to the change it caused.</p>
              </div>

              <h2 id="w3-reflection" className="w3-h2 is-gap">Reflection</h2>
              <div className="w3-reflect">
                <div><h3 className="w3-h3">What I’d keep</h3><p>Two separations: where to stop is not how to get in, and the order, not the courier’s position, is what grants the code. Both came from asking what happens when something goes wrong at the gate.</p></div>
                <div><h3 className="w3-h3">What I don’t know yet</h3><p>Whether residents map a route at all without a nudge, and how far off GPS is between buildings at a real complex. The 160 ft radius and every count on the screens are placeholders until then.</p></div>
                <div><h3 className="w3-h3">What’s next</h3><p>The field test with real photos. Then the two states round 2 only describes: the building manager’s confirmation, and what a courier sees when access ends.</p></div>
              </div>
            </div>
            <div className="w3-aside"/>
          </div>
        </section>
      </div>
    </PhotoViewer>

    <nav className="w3-next" aria-label="Next project">
      <Go to={`${PRODUCT_HOME}/${next.slug}`} className="w3-next-link">
        <span className="w3-next-text">
          <span className="w3-next-label">Next project</span>
          <span className="w3-next-title">{next.title}</span>
          <span className="w3-next-sub">{next.subtitle || next.summary}</span>
          <span className="w3-next-go" aria-hidden="true"><ArrowRight width={20} height={20}/></span>
        </span>
        {next.thumb ? <span className="w3-next-media"><img src={next.thumb.src} width={next.thumb.width} height={next.thumb.height} alt="" loading="lazy" decoding="async"/></span> : null}
      </Go>
    </nav>
    <div className="w3-foot"><ProductFooter/></div>
  </article>;
}
