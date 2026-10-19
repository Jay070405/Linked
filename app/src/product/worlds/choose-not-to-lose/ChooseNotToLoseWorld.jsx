import {useCallback, useEffect, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {Go} from '../../Go';
import {ProductFooter} from '../../ProductIndex';
import {PRODUCT_HOME, nextCase} from '../../content';
import {CNTL_KIT, ProtoScreen} from '../../v2/Device';
import {PHONE, useMedia} from '../../v2/motion';
import {zoomable} from '../../v2/zoom';
import {Leader, Rule} from './bits';
import Chrome from './Chrome';
import Compare from './Compare';
import {FlowDevice, FlowPrinted, FlowSteps, useFlow} from './Flow';
import PlanLines from './PlanLines';
import {Register, useHeaderPrint, usePrintOnScroll} from './print';
import RollYear, {Tally, useRollBook} from './RollYear';
import {ScrubChart, ScrubLines, useScrub} from './ScrubYear';
import TearOff from './TearOff';
import {TryTasks, TryWindow, useTry} from './TryLive';
import {Window} from './Window';
import {CHANGES, CHAPTERS, DECISIONS, FIELDS, HYPOTHESES, NUMBERS, PAIRS, REFLECTION, RESULTS, STEPS, TASKS, TEST_PLAN} from './content';
import './receipt.css';

/* Choose Not to Lose, as its own world: "The receipt" (site-spec/WORLDS.md, D4).
   The case is one long thermal receipt on a clean desk. A printer at the top prints the header as the page opens;
   below it every line prints as it reaches the bottom of the screen, chapters are separated by perforations, and money
   rolls like a register. Exhibits (prototype captures, the live prototype, the tally) lie on the desk beside the tape.
   Type: IBM Plex Sans (self-hosted from the prototype's own copy) for reading, the site's monospace for the tape.
   Colors: Carbon grays, and one red, only for money lost.
   Signature: "Roll your year" (RollYear.jsx). Every dollar comes from the prototype's tested cost model
   (v2/data/cntl-model.js, imported, not copied); the only made-up numbers are the illustrative bill mixes, labeled
   as such wherever they show. "Skip the experience" switches to a plain reading mode: the same content, no motion,
   no desk, captures instead of live frames. */

const NARROW = '(max-width: 1023px)';
const readPlain = () => { try { return new URLSearchParams(location.search).get('read') === 'plain'; } catch { return false; } };

/** One band of the receipt: the tape on the left, the desk beside it. On narrow screens the desk content follows the
    tape's, on the paper. `stick`: the desk content stays in view while the band scrolls past. */
function Band({id, label, children, desk = null, stick = false, className = '', head = null}) {
  return <section id={id} className={`cnr-band${desk ? ' has-desk' : ''}${className ? ` ${className}` : ''}`} aria-labelledby={label}>
    <div className="cnr-paper">{head}{children}</div>
    {desk ? <div className="cnr-side">{stick ? <div className="cnr-stick">{desk}</div> : desk}</div> : null}
  </section>;
}

/** The perforation that starts a chapter, with the chapter's number like a ticket stub. */
const Perf = ({n}) => <div className="cnr-perf" aria-hidden="true"><span className="cnr-perf-n">No. {String(n).padStart(2, '0')}</span></div>;

function Head({id, title, lede, tab = false}) {
  return <div className="cnr-head">
    <h2 id={id} className="cnr-h2" tabIndex={tab ? -1 : undefined} data-print="">{title}</h2>
    {lede ? <p className="cnr-lede" data-print="">{lede}</p> : null}
  </div>;
}

function HeroShot({flat}) {
  return <figure className="cnr-hero-shot" data-desk-in="">
    <Window label="The Choose Not to Lose prototype">
      <ProtoScreen kit={CNTL_KIT} screen="compare" load="never"
        alt="A benefits page comparing four fictional medical plans: three bill examples, a chart of yearly totals per plan, and a panel with each plan’s maximum yearly cost"/>
    </Window>
    <figcaption className="cnr-desk-note">{flat ? 'The redesigned comparison, from the prototype. Try it live below.' : 'The redesigned comparison, from the prototype, set down beside the receipt. Try it live below.'}</figcaption>
  </figure>;
}

export default function ChooseNotToLoseWorld({item, reduced}) {
  const root = useRef(null);
  const phone = useMedia(PHONE), narrow = useMedia(NARROW);
  const [plain, setPlain] = useState(readPlain);
  const still = reduced || plain;
  const flat = narrow || plain;
  const next = nextCase(item.slug);

  usePrintOnScroll(root, still, [plain, narrow, phone]);
  useHeaderPrint(root, still);
  const flow = useFlow(STEPS, still);
  const scrub = useScrub(still);
  const roll = useRollBook(still);
  const tryIt = useTry();
  const [pick, setPick] = useState(null);

  // the plain reading mode is an address too (?read=plain), so it survives a reload and can be shared
  const choosePlain = useCallback((on, e) => {
    e?.preventDefault();
    setPlain(on);
    try {
      const url = new URL(location.href);
      if (on) url.searchParams.set('read', 'plain'); else url.searchParams.delete('read');
      history.replaceState(history.state, '', url);
    } catch { /* address stays */ }
    requestAnimationFrame(() => {
      const top = root.current?.querySelector(on ? '#cnr-title' : '#cnr-title');
      root.current?.scrollIntoView({block: 'start'});
      top?.focus({preventScroll: true});
    });
  }, []);
  useEffect(() => { document.body.classList.toggle('cnr-plain-body', plain); return () => document.body.classList.remove('cnr-plain-body'); }, [plain]);

  const jumpTo = sel => e => {
    const target = root.current?.querySelector(sel);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({behavior: still || e.detail === 0 ? 'auto' : 'smooth', block: 'start'});
    target.querySelector('h2')?.focus?.({preventScroll: true});
  };

  return <article ref={root} className={`pp-page cnr-page${plain ? ' is-plain' : ''}${flat ? ' is-flat' : ''}${still ? ' is-still' : ''}`} lang="en" data-nav-tone="light">
    <p className="cnr-skip">
      {plain
        ? <a href="?" onClick={e => choosePlain(false, e)}>Back to the receipt</a>
        : <a href="?read=plain" onClick={e => choosePlain(true, e)}>Skip the experience: read it as a plain page</a>}
    </p>
    <Chrome root={root} chapters={CHAPTERS} still={still} plain={plain}/>

    <div className="cnr-desk">
      {plain ? null : <div className="cnr-printer" aria-hidden="true"><span className="cnr-printer-body"><span className="cnr-led"/><span className="cnr-printer-name">Thermal 80</span></span><span className="cnr-printer-mouth"/></div>}
      <div className="cnr-tape cnr-feed">

        {/* ---------- the header: what the case is, printed like a receipt's top ---------- */}
        <section className={`cnr-band is-head${flat ? '' : ' has-desk'}`} aria-labelledby="cnr-title" data-print-head="">
          <div className="cnr-paper">
            <p className="cnr-back-line" data-print=""><Go to={PRODUCT_HOME} className="cnr-back"><span aria-hidden="true">←</span> All product work</Go></p>
            <p className="cnr-kind" data-print=""><span>{item.kind}</span><span className="cnr-flag"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.75"/><path d="M8 7v4.5M8 4.6v.1"/></svg>Fictional plans, not advice</span></p>
            <h1 id="cnr-title" className="cnr-title" tabIndex={-1} data-print="">Choose Not to&nbsp;Lose</h1>
            <p className="cnr-outcome" data-print="">A health-plan picker that prices the whole year for every plan, flags the one that costs more for the same coverage, and shows the arithmetic, without telling anyone what to pick.</p>
            <Rule/>
            <dl className="cnr-fields">{FIELDS.map(([k, v]) => <div key={k} data-print=""><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            <Rule/>
            <p className="cnr-actions" data-print="">
              {phone ? null : <a className="cnr-key is-primary" href="#try" onClick={jumpTo('#try')}>Try the prototype</a>}
              <a className="cnr-key" href="#cn-problem-section" onClick={jumpTo('#cn-problem-section')}>Start with the problem</a>
            </p>
          </div>
          <div className="cnr-side"><HeroShot flat={flat}/></div>
        </section>

        {/* ---------- the case in numbers: subtotals that roll in ---------- */}
        <section className="cnr-band" aria-label="The case in numbers">
          <div className="cnr-paper">
            <Rule double/>
            <dl className="cnr-numbers">{NUMBERS.map(n => <div key={n.label} className="cnr-number" data-print="">
              <dt className="cnr-number-label">{n.label}</dt>
              <dd className="cnr-number-value"><Register text={n.value.toLocaleString('en-US')} instant={still}/></dd>
              <dd className="cnr-number-note">{n.note}</dd>
            </div>)}</dl>
            <Rule double/>
          </div>
        </section>

        {/* ---------- 01 the quiz, as the opening line items ---------- */}
        <Band id="cn-quiz" label="cn-quiz-title" head={<Perf n={1}/>}
          desk={flat ? null : <figure className="cnr-exhibit is-tilt-r" {...zoomable('The same four plans in the prototype’s baseline portal: monthly premium, deductible, coinsurance and out-of-pocket maximum per plan, and a radio button each', {src: CNTL_KIT.shot('baseline'), w: CNTL_KIT.shotW, h: CNTL_KIT.shotH})}>
            <Window small><img src={CNTL_KIT.shot('baseline')} alt="The same four plans in the prototype’s baseline portal" width={CNTL_KIT.shotW} height={CNTL_KIT.shotH} loading="lazy" decoding="async"/></Window>
            <figcaption className="cnr-desk-note">Where these numbers usually live: the baseline portal, in the prototype.</figcaption>
          </figure>}>
          <Head id="cn-quiz-title" title="Which plan would you pick?" lede="Before the redesign, the table it replaces: the prototype’s four fictional plans as most benefits portals list them. Same network, same covered services."/>
          <PlanLines compact={phone} still={still} onPick={setPick}/>
        </Band>

        {/* ---------- 02 the problem ---------- */}
        <Band id="cn-problem-section" label="cn-problem" head={<Perf n={2}/>}
          desk={<aside className="cnr-card" aria-label="Session quotes, not collected yet">
            <p className="cnr-card-badge">Placeholder</p>
            <p>Quotes from five classmates go here after the test afternoon: how they chose between two fictional menus, and whether they could explain their pick back.</p>
          </aside>}>
          <Head id="cn-problem" tab title="The table has the answer, and hides it"/>
          <div className="cnr-prose">
            <p data-print="">Enrollment pages list each plan’s monthly premium, deductible, coinsurance and out-of-pocket maximum, and leave the year’s arithmetic to you, often in the week before the deadline.</p>
            <p data-print="">That arithmetic is where people lose. In a study of 23,894 employees choosing from a menu that included dominated plans, a majority picked a plan that cost more for no added coverage, largely because they didn’t understand the plan terms.</p>
          </div>
          <p className="cnr-cap" data-print=""><Ev label="Sourced"/><span>Bhargava, Loewenstein and Sydnor, “Choose to Lose,” Quarterly Journal of Economics, 2017.</span></p>
        </Band>

        {/* ---------- 03 scrub the year (the bills slider) ---------- */}
        <Band id="cn-bills" label="cn-bills-title" head={<Perf n={3}/>} stick
          desk={flat ? null : <div className="cnr-slip"><ScrubChart s={scrub} onDesk/></div>}>
          <Head id="cn-bills-title" title="The arithmetic the table leaves to you" lede="Each plan’s total for the year: premiums plus what you pay toward covered bills under its deductible, coinsurance and out-of-pocket maximum, from the prototype’s tested cost model."/>
          <ScrubLines s={scrub} compact={phone} chart={flat ? <ScrubChart s={scrub} compact={phone}/> : null}/>
        </Band>

        {/* ---------- 04 roll your year (the signature) ---------- */}
        <Band id="cn-roll" label="cn-roll-title" head={<Perf n={4}/>} stick
          desk={flat ? null : <div className="cnr-slip is-tally"><Tally r={roll}/></div>}>
          <Head id="cn-roll-title" title="Roll your year" lede="Nobody knows next year’s bills. So roll one: the receipt draws a year of covered bills from a made-up mix and prices it for all four plans with the prototype’s cost model. Then run a hundred, and count which plan came out cheapest."/>
          <RollYear r={roll} compact={phone} tallyHere={flat}/>
        </Band>

        {/* ---------- 05 the redesign, step by step ---------- */}
        <Band id="cn-flow" label="cn-flow-title" head={<Perf n={5}/>} stick className="is-flow"
          desk={flat ? null : <FlowDevice steps={STEPS} flow={flow} still={still}/>}>
          <Head id="cn-flow-title" title="From the familiar table to a choice you can explain" lede={flat ? 'The redesign in seven steps, each with the prototype at that point.' : 'Scroll through the redesign; each step frames the real prototype on the part it’s about.'}/>
          {flat ? <FlowPrinted steps={STEPS}/> : <FlowSteps steps={STEPS} flow={flow}/>}
        </Band>

        {/* ---------- 06 decisions: what I tried (voided) and what I chose ---------- */}
        <Band id="cn-decisions" label="cn-decisions-title" head={<Perf n={6}/>}>
          <Head id="cn-decisions-title" title="What I chose, and what I tried first" lede="Five choices, most of them from round 2. What each replaced is printed and voided above it."/>
        </Band>
        <div className="cnr-group" data-zoom-group="">{DECISIONS.map((d, i) => <Band key={d.id} label={`cnr-d-${d.id}`} className="is-decision"
          desk={<figure className={`cnr-exhibit${i % 2 ? ' is-tilt-r' : ' is-tilt-l'}`} {...zoomable(d.title, {src: d.img.src, w: d.img.w, h: d.img.h})}>
            <span className="cnr-photo"><img src={d.img.src} alt="" width={d.img.w} height={d.img.h} loading="lazy" decoding="async" style={{objectPosition: d.img.position}}/></span>
          </figure>}>
          <div className="cnr-d">
            <p className="cnr-d-n" data-print="">Item {i + 1} of {DECISIONS.length}</p>
            <h3 id={`cnr-d-${d.id}`} className="cnr-h3" data-print="">{d.title}</h3>
            <p className="cnr-d-verdict" data-print="">{d.verdict}</p>
            <dl className="cnr-d-lines">
              <div className="is-void" data-print=""><dt>Tried</dt><dd><s>{d.tried}</s><span className="cnr-void" aria-hidden="true">Void</span></dd></div>
              <div data-print=""><dt>Chose</dt><dd>{d.chose}</dd></div>
            </dl>
          </div>
        </Band>)}</div>

        {/* ---------- 07 before and after ---------- */}
        <Band id="cn-compare" label="cn-compare-title" head={<Perf n={7}/>} stick
          desk={flat ? null : <Compare pairs={PAIRS} still={still}/>}>
          <Head id="cn-compare-title" title="Before and after, twice" lede="Against the portal the redesign replaces, and against its own first round. Pick one and drag across it."/>
          {flat ? <Compare pairs={PAIRS} still={still}/> : null}
          <p className="cnr-review" data-print=""><b>A model-assisted design review.</b> I asked a model to critique round 1 as an enterprise design lead would. It ranked eight fixes; round 2 builds them. It’s a critique, not the five-person test below.</p>
          <p className="cnr-list-title" data-print="">What changed and why</p>
          <ol className="cnr-changes">{CHANGES.map((c, i) => <li key={c.what} data-print="">
            <span className="cnr-changes-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <p className="cnr-changes-what">{c.what}</p>
            <p className="cnr-changes-why">{c.why}</p>
          </li>)}</ol>
        </Band>

        {/* ---------- 08 try it: the live prototype, set down across the desk ---------- */}
        <Band id="try" label="try-title" head={<Perf n={8}/>}>
          <Head id="try-title" title="Try it yourself" lede={flat ? 'Four things to try. Each opens the prototype in a new tab, where the task starts; it’s built for a desktop screen.' : 'The same prototype at full width, set across the desk. Pick a task; the page opens where it starts.'}/>
          <TryTasks tasks={TASKS} t={tryIt} linkOut={flat}/>
          {flat ? <div className="cnr-try-shot"><TryWindow t={tryIt} still shot/></div> : null}
          <p className="cnr-cap" data-print="">Fictional plans and arithmetic only: no enrollment, no personal data, nothing saved. Reset starts over.</p>
        </Band>
        {flat ? null : <div className="cnr-over"><div className="cnr-over-paper" aria-hidden="true"/><div className="cnr-over-win"><TryWindow t={tryIt} still={still}/></div></div>}

        {/* ---------- 09 testing: the balance still due ---------- */}
        <Band id="cn-testing-section" label="cn-testing" head={<Perf n={9}/>}>
          <Head id="cn-testing" title="Testing comes next" lede="Nothing here has been tested with people yet. This is the plan, and the space the results will fill."/>
          <h3 className="cnr-h3" data-print="">Plan for one afternoon</h3>
          <ul className="cnr-bullets">{TEST_PLAN.map(t => <li key={t} data-print="">{t}</li>)}</ul>
          <h3 className="cnr-h3" data-print="">Hypotheses to check</h3>
          <ul className="cnr-hyps">{HYPOTHESES.map(h => <li key={h} data-print=""><Ev label="Hypothesis"/><span>{h}</span></li>)}</ul>
          <div className="cnr-due" aria-label="Results, not collected yet">
            <p className="cnr-due-badge" data-print="">Placeholder: results after the sessions</p>
            {RESULTS.map(r => <Leader key={r} label={r}>— of 5</Leader>)}
            <p className="cnr-due-note" data-print="">Each result will sit next to the change it caused.</p>
          </div>
        </Band>

        {/* ---------- 10 reflection, and the end of the tape ---------- */}
        <Band id="cn-reflection-section" label="cn-reflection" head={<Perf n={10}/>} className="is-last">
          <Head id="cn-reflection" title="Reflection"/>
          <div className="cnr-reflect">{REFLECTION.map(r => <div key={r.title} data-print="">
            <h3 className="cnr-h3">{r.title}</h3><p>{r.body}</p>
          </div>)}</div>
          <Rule double/>
          <p className="cnr-end" data-print="">Fictional plans, not advice. No enrollment, no personal data, nothing saved.</p>
        </Band>
        <div className="cnr-tear" aria-hidden="true"/>
      </div>
      <TearOff pick={pick} scrub={scrub} roll={roll}/>

      <nav className="cnr-next" aria-label="Next project">
        <Go to={`${PRODUCT_HOME}/${next.slug}`} className="cnr-next-link">
          <span className="cnr-next-text">
            <span className="cnr-next-label">Next project</span>
            <span className="cnr-next-title">{next.title}</span>
            <span className="cnr-next-sub">{next.subtitle || next.summary}</span>
          </span>
          {next.thumb ? <span className="cnr-next-media"><img src={next.thumb.src} width={next.thumb.width} height={next.thumb.height} alt="" loading="lazy" decoding="async"/></span> : null}
        </Go>
      </nav>
      <ProductFooter/>
    </div>
  </article>;
}
