import {useCallback, useEffect, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {Go} from '../../Go';
import {ProductFooter} from '../../ProductIndex';
import {PRODUCT_HOME, nextCase} from '../../content';
import {L, UI, localize, useCaseLang} from '../../i18n';
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
import {ThemeToggle, useCaseTheme} from './Theme';
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
   no desk, captures instead of live frames.
   English and Chinese (i18n.jsx): every string is L(en, zh) and goes through t(); the language switches live. The
   prototype itself, its captures and the evidence labels stay English. */

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
  const {t} = useCaseLang();
  return <div className="cnr-head">
    <h2 id={id} className="cnr-h2" tabIndex={tab ? -1 : undefined} data-print="">{t(title)}</h2>
    {lede ? <p className="cnr-lede" data-print="">{t(lede)}</p> : null}
  </div>;
}

const T = {
  prototype: L('The Choose Not to Lose prototype', 'Choose Not to Lose 原型'),
  heroAlt: L('A benefits page comparing four fictional medical plans: three bill examples, a chart of yearly totals per plan, and a panel with each plan’s maximum yearly cost',
    '一个员工福利页面，比较四个虚构的医疗方案：三个账单示例、每个方案的全年总费用图，以及列出各方案全年最高费用的面板'),
  heroNote: L('The redesigned comparison, from the prototype, set down beside the receipt. Try it live below.', '原型里重新设计的比较页，放在收据旁边。下面可以直接试用。'),
  heroNoteFlat: L('The redesigned comparison, from the prototype. Try it live below.', '原型里重新设计的比较页。下面可以直接试用。'),
  skip: L('Skip the experience: read it as a plain page', '跳过体验，换成普通页面阅读'),
  backToReceipt: L('Back to the receipt', '回到收据'),
  flag: L('Fictional plans, not advice', '虚构方案，不构成建议'),
  outcome: L('A health-plan picker that prices the whole year for every plan, flags the one that costs more for the same coverage, and shows the arithmetic, without telling anyone what to pick.',
    '一个医保方案选择器：为每个方案算出全年费用，标出保障相同却更贵的那一个，并给出算式，但不替任何人做选择。'),
  tryProto: L('Try the prototype', '试用原型'),
  startProblem: L('Start with the problem', '从问题看起'),
  numbers: L('The case in numbers', '案例数据'),
  baselineAlt: L('The same four plans in the prototype’s baseline portal: monthly premium, deductible, coinsurance and out-of-pocket maximum per plan, and a radio button each',
    '原型基线门户里的同样四个方案：每个方案的月保费、免赔额、共同保险和自付额上限，各配一个单选按钮'),
  baselineImg: L('The same four plans in the prototype’s baseline portal', '原型基线门户里的同样四个方案'),
  baselineNote: L('Where these numbers usually live: the baseline portal, in the prototype.', '这些数字平时出现的地方：原型里的基线门户。'),
  quizTitle: L('Which plan would you pick?', '你会选哪个方案？'),
  quizLede: L('Before the redesign, the table it replaces: the prototype’s four fictional plans as most benefits portals list them. Same network, same covered services.',
    '先别看重新设计，看看它要替换的表格：原型里的四个虚构方案，按大多数福利门户的方式列出。医疗网络相同，承保服务也相同。'),
  quotes: L('Session quotes, not collected yet', '测试原话，尚未收集'),
  placeholder: L('Placeholder', '占位'),
  quotesText: L('Quotes from five classmates go here after the test afternoon: how they chose between two fictional menus, and whether they could explain their pick back.',
    '测试的那个下午之后，这里会放五位同学的原话：他们怎样在两份虚构菜单之间做选择，以及能不能把自己的选择解释清楚。'),
  problemTitle: L('The table has the answer, and hides it', '表格里有答案，却把它藏了起来'),
  problem1: L('Enrollment pages list each plan’s monthly premium, deductible, coinsurance and out-of-pocket maximum, and leave the year’s arithmetic to you, often in the week before the deadline.',
    '选保页面会列出每个方案的月保费、免赔额、共同保险和自付额上限，全年的账却留给你自己算，而且往往是在截止日前的那一周。'),
  problem2: L('That arithmetic is where people lose. In a study of 23,894 employees choosing from a menu that included dominated plans, a majority picked a plan that cost more for no added coverage, largely because they didn’t understand the plan terms.',
    '人们就是在这笔账上吃亏的。一项研究考察了 23,894 名员工的选择，他们可选的方案里包括被占优的方案。结果多数人选了一个更贵、保障却没有更多的方案，主要原因是看不懂方案条款。'),
  problemCite: L('Bhargava, Loewenstein and Sydnor, “Choose to Lose,” Quarterly Journal of Economics, 2017.', 'Bhargava、Loewenstein 和 Sydnor，“Choose to Lose”，《经济学季刊》（Quarterly Journal of Economics），2017。'),
  billsTitle: L('The arithmetic the table leaves to you', '表格留给你算的那笔账'),
  billsLede: L('Each plan’s total for the year: premiums plus what you pay toward covered bills under its deductible, coinsurance and out-of-pocket maximum, from the prototype’s tested cost model.',
    '每个方案的全年总费用：保费，加上按它的免赔额、共同保险和自付额上限算出的承保医疗自付部分，用的是原型里经过测试的费用模型。'),
  rollTitle: L('Roll your year', '随机抽一年'),
  rollLede: L('Nobody knows next year’s bills. So roll one: the receipt draws a year of covered bills from a made-up mix and prices it for all four plans with the prototype’s cost model. Then run a hundred, and count which plan came out cheapest.',
    '没人知道明年的医疗账单会是多少。那就抽一年：收据从一组编出来的年份里随机抽出一年的承保医疗费用，用原型的费用模型给四个方案分别算价。然后抽一百年，数一数每年最便宜的是哪个方案。'),
  flowTitle: L('From the familiar table to a choice you can explain', '从熟悉的表格，到一个说得清的选择'),
  flowLede: L('Scroll through the redesign; each step frames the real prototype on the part it’s about.', '往下滚动看重新设计，每一步都会把真实原型定位到相关的部分。原型界面为英文。'),
  flowLedeFlat: L('The redesign in seven steps, each with the prototype at that point.', '重新设计的七个步骤，每一步都配有原型在那一步的画面。原型界面为英文。'),
  decisionsTitle: L('What I chose, and what I tried first', '我最后的选择，和我先试过的'),
  decisionsLede: L('Five choices, most of them from round 2. What each replaced is printed and voided above it.', '五个决定，大多来自第二轮。每条上面都打着它取代的做法，已作废。'),
  item: (i, n) => L(`Item ${i} of ${n}`, `第 ${i} 项，共 ${n} 项`),
  tried: L('Tried', '试过'),
  chose: L('Chose', '选择'),
  void: L('Void', '作废'),
  compareTitle: L('Before and after, twice', '两组前后对比'),
  compareLede: L('Against the portal the redesign replaces, and against its own first round. Pick one and drag across it.', '一组对比它要取代的门户，一组对比它自己的第一轮。选一组，左右拖动。'),
  reviewLead: L('A model-assisted design review.', '一次借助模型的设计评审。'),
  review: L(' I asked a model to critique round 1 as an enterprise design lead would. It ranked eight fixes; round 2 builds them. It’s a critique, not the five-person test below.',
    '我请一个模型以企业级产品设计负责人的眼光评审第一轮。它列出八项修改并排了先后，第二轮把它们都做了。这是一次评审，不是下面那个五人测试。'),
  changesTitle: L('What changed and why', '改了什么，为什么改'),
  tryTitle: L('Try it yourself', '自己试试'),
  tryLede: L('The same prototype at full width, set across the desk. Pick a task; the page opens where it starts.', '同一个原型，铺满桌面宽度。选一个任务，页面会打开在任务开始的地方。原型界面为英文。'),
  tryLedeFlat: L('Four things to try. Each opens the prototype in a new tab, where the task starts; it’s built for a desktop screen.', '四件可以试的事。每一项都会在新标签页打开原型，停在任务开始的地方。原型是为桌面屏幕做的，界面为英文。'),
  tryNote: L('Fictional plans and arithmetic only: no enrollment, no personal data, nothing saved. Reset starts over.', '只有虚构方案和算式：不会投保，不收集个人数据，什么都不保存。重置会从头开始。'),
  testTitle: L('Testing comes next', '接下来是测试'),
  testLede: L('Nothing here has been tested with people yet. This is the plan, and the space the results will fill.', '这里的一切都还没有经过用户测试。下面是测试计划，以及将来填结果的位置。'),
  plan: L('Plan for one afternoon', '一个下午的测试计划'),
  hyps: L('Hypotheses to check', '要验证的假设'),
  results: L('Results, not collected yet', '结果，尚未收集'),
  resultsBadge: L('Placeholder: results after the sessions', '占位：测试后填入结果'),
  ofFive: L('— of 5', '— / 5'),
  resultsNote: L('Each result will sit next to the change it caused.', '每个结果都会放在它促成的那项改动旁边。'),
  reflection: L('Reflection', '反思'),
  end: L('Fictional plans, not advice. No enrollment, no personal data, nothing saved.', '虚构方案，不构成建议。不会投保，不收集个人数据，什么都不保存。'),
};

function HeroShot({flat}) {
  const {t} = useCaseLang();
  return <figure className="cnr-hero-shot" data-desk-in="">
    <Window label={t(T.prototype)}>
      <ProtoScreen kit={CNTL_KIT} screen="compare" load="never" alt={t(T.heroAlt)}/>
    </Window>
    <figcaption className="cnr-desk-note">{t(flat ? T.heroNoteFlat : T.heroNote)}</figcaption>
  </figure>;
}

export default function ChooseNotToLoseWorld({item: rawItem, reduced}) {
  const {t, zh, lang, htmlLang} = useCaseLang();
  const item = localize(rawItem, lang);
  const root = useRef(null);
  const phone = useMedia(PHONE), narrow = useMedia(NARROW);
  const [plain, setPlain] = useState(readPlain);
  const still = reduced || plain;
  const flat = narrow || plain;
  const next = localize(nextCase(rawItem.slug), lang);

  usePrintOnScroll(root, still, [plain, narrow, phone]);
  useHeaderPrint(root, still);
  const flow = useFlow(STEPS, still);
  const scrub = useScrub(still);
  const roll = useRollBook(still);
  const tryIt = useTry();
  const [pick, setPick] = useState(null);
  const [theme, setTheme, fading] = useCaseTheme(reduced);

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
      const top = root.current?.querySelector('#cnr-title');
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

  return <article ref={root} className={`pp-page cnr-page${plain ? ' is-plain' : ''}${flat ? ' is-flat' : ''}${still ? ' is-still' : ''}${fading ? ' is-fading' : ''}${zh ? ' is-zh' : ''}`} data-theme={theme} lang={htmlLang} data-nav-tone="light">
    <div className="cnr-top">
      <p className="cnr-skip">
        {plain
          ? <a href="?" onClick={e => choosePlain(false, e)}>{t(T.backToReceipt)}</a>
          : <a href="?read=plain" onClick={e => choosePlain(true, e)}>{t(T.skip)}</a>}
      </p>
      <ThemeToggle theme={theme} setTheme={setTheme}/>
    </div>
    <Chrome root={root} chapters={CHAPTERS} still={still} plain={plain}/>

    <div className="cnr-desk">
      {plain ? null : <div className="cnr-printer" aria-hidden="true"><span className="cnr-printer-body"><span className="cnr-led"/><span className="cnr-printer-name" lang="en">Thermal 80</span></span><span className="cnr-printer-mouth"/></div>}
      <div className="cnr-tape cnr-feed">

        {/* ---------- the header: what the case is, printed like a receipt's top ---------- */}
        <section className={`cnr-band is-head${flat ? '' : ' has-desk'}`} aria-labelledby="cnr-title" data-print-head="">
          <div className="cnr-paper">
            <p className="cnr-back-line" data-print=""><Go to={PRODUCT_HOME} className="cnr-back"><span aria-hidden="true">←</span> {t(UI.allWork)}</Go></p>
            <p className="cnr-kind" data-print=""><span>{item.kind}</span><span className="cnr-flag"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.75"/><path d="M8 7v4.5M8 4.6v.1"/></svg>{t(T.flag)}</span></p>
            <h1 id="cnr-title" className="cnr-title" tabIndex={-1} data-print="" lang="en">Choose Not to&nbsp;Lose</h1>
            <p className="cnr-outcome" data-print="">{t(T.outcome)}</p>
            <Rule/>
            <dl className="cnr-fields">{FIELDS.map(([k, v]) => <div key={k.en} data-print=""><dt>{t(k)}</dt><dd>{t(v)}</dd></div>)}</dl>
            <Rule/>
            <p className="cnr-actions" data-print="">
              {phone ? null : <a className="cnr-key is-primary" href="#try" onClick={jumpTo('#try')}>{t(T.tryProto)}</a>}
              <a className="cnr-key" href="#cn-problem-section" onClick={jumpTo('#cn-problem-section')}>{t(T.startProblem)}</a>
            </p>
          </div>
          <div className="cnr-side"><HeroShot flat={flat}/></div>
        </section>

        {/* ---------- the case in numbers: subtotals that roll in ---------- */}
        <section className="cnr-band" aria-label={t(T.numbers)}>
          <div className="cnr-paper">
            <Rule double/>
            <dl className="cnr-numbers">{NUMBERS.map(n => <div key={n.label.en} className="cnr-number" data-print="">
              <dt className="cnr-number-label">{t(n.label)}</dt>
              <dd className="cnr-number-value"><Register text={n.value.toLocaleString('en-US')} instant={still}/></dd>
              <dd className="cnr-number-note">{n.ev ? <Ev label={n.ev}/> : null} {t(n.note)}</dd>
            </div>)}</dl>
            <Rule double/>
          </div>
        </section>

        {/* ---------- 01 the quiz, as the opening line items ---------- */}
        <Band id="cn-quiz" label="cn-quiz-title" head={<Perf n={1}/>}
          desk={flat ? null : <figure className="cnr-exhibit is-tilt-r" {...zoomable(t(T.baselineAlt), {src: CNTL_KIT.shot('baseline'), w: CNTL_KIT.shotW, h: CNTL_KIT.shotH, lang})}>
            <Window small><img src={CNTL_KIT.shot('baseline')} alt={t(T.baselineImg)} width={CNTL_KIT.shotW} height={CNTL_KIT.shotH} loading="lazy" decoding="async"/></Window>
            <figcaption className="cnr-desk-note">{t(T.baselineNote)}</figcaption>
          </figure>}>
          <Head id="cn-quiz-title" title={T.quizTitle} lede={T.quizLede}/>
          <PlanLines compact={phone} still={still} onPick={setPick}/>
        </Band>

        {/* ---------- 02 the problem ---------- */}
        <Band id="cn-problem-section" label="cn-problem" head={<Perf n={2}/>}
          desk={<aside className="cnr-card" aria-label={t(T.quotes)}>
            <p className="cnr-card-badge">{t(T.placeholder)}</p>
            <p>{t(T.quotesText)}</p>
          </aside>}>
          <Head id="cn-problem" tab title={T.problemTitle}/>
          <div className="cnr-prose">
            <p data-print="">{t(T.problem1)}</p>
            <p data-print="">{t(T.problem2)}</p>
          </div>
          <p className="cnr-cap" data-print=""><Ev label="Sourced"/><span>{t(T.problemCite)}</span></p>
        </Band>

        {/* ---------- 03 scrub the year (the bills slider) ---------- */}
        <Band id="cn-bills" label="cn-bills-title" head={<Perf n={3}/>} stick
          desk={flat ? null : <div className="cnr-slip"><ScrubChart s={scrub} onDesk/></div>}>
          <Head id="cn-bills-title" title={T.billsTitle} lede={T.billsLede}/>
          <ScrubLines s={scrub} compact={phone} chart={flat ? <ScrubChart s={scrub} compact={phone}/> : null}/>
        </Band>

        {/* ---------- 04 roll your year (the signature) ---------- */}
        <Band id="cn-roll" label="cn-roll-title" head={<Perf n={4}/>} stick
          desk={flat ? null : <div className="cnr-slip is-tally"><Tally r={roll}/></div>}>
          <Head id="cn-roll-title" title={T.rollTitle} lede={T.rollLede}/>
          <RollYear r={roll} compact={phone} tallyHere={flat}/>
        </Band>

        {/* ---------- 05 the redesign, step by step ---------- */}
        <Band id="cn-flow" label="cn-flow-title" head={<Perf n={5}/>} stick className="is-flow"
          desk={flat ? null : <FlowDevice steps={STEPS} flow={flow} still={still}/>}>
          <Head id="cn-flow-title" title={T.flowTitle} lede={flat ? T.flowLedeFlat : T.flowLede}/>
          {flat ? <FlowPrinted steps={STEPS}/> : <FlowSteps steps={STEPS} flow={flow}/>}
        </Band>

        {/* ---------- 06 decisions: what I tried (voided) and what I chose ---------- */}
        <Band id="cn-decisions" label="cn-decisions-title" head={<Perf n={6}/>}>
          <Head id="cn-decisions-title" title={T.decisionsTitle} lede={T.decisionsLede}/>
        </Band>
        <div className="cnr-group" data-zoom-group="">{DECISIONS.map((d, i) => <Band key={d.id} label={`cnr-d-${d.id}`} className="is-decision"
          desk={<figure className={`cnr-exhibit${i % 2 ? ' is-tilt-r' : ' is-tilt-l'}`} {...zoomable(t(d.title), {src: d.img.src, w: d.img.w, h: d.img.h, lang})}>
            <span className="cnr-photo"><img src={d.img.src} alt="" width={d.img.w} height={d.img.h} loading="lazy" decoding="async" style={{objectPosition: d.img.position}}/></span>
          </figure>}>
          <div className="cnr-d">
            <p className="cnr-d-n" data-print="">{t(T.item(i + 1, DECISIONS.length))}</p>
            <h3 id={`cnr-d-${d.id}`} className="cnr-h3" data-print="">{t(d.title)}</h3>
            <p className="cnr-d-verdict" data-print="">{t(d.verdict)}</p>
            <dl className="cnr-d-lines">
              <div className="is-void" data-print=""><dt>{t(T.tried)}</dt><dd><s>{t(d.tried)}</s><span className="cnr-void" aria-hidden="true">{t(T.void)}</span></dd></div>
              <div data-print=""><dt>{t(T.chose)}</dt><dd>{t(d.chose)}</dd></div>
            </dl>
          </div>
        </Band>)}</div>

        {/* ---------- 07 before and after ---------- */}
        <Band id="cn-compare" label="cn-compare-title" head={<Perf n={7}/>} stick
          desk={flat ? null : <Compare pairs={PAIRS} still={still}/>}>
          <Head id="cn-compare-title" title={T.compareTitle} lede={T.compareLede}/>
          {flat ? <Compare pairs={PAIRS} still={still}/> : null}
          <p className="cnr-review" data-print=""><b>{t(T.reviewLead)}</b>{t(T.review)}</p>
          <p className="cnr-list-title" data-print="">{t(T.changesTitle)}</p>
          <ol className="cnr-changes">{CHANGES.map((c, i) => <li key={c.what.en} data-print="">
            <span className="cnr-changes-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <p className="cnr-changes-what">{t(c.what)}</p>
            <p className="cnr-changes-why">{t(c.why)}</p>
          </li>)}</ol>
        </Band>

        {/* ---------- 08 try it: the live prototype, set down across the desk ---------- */}
        <Band id="try" label="try-title" head={<Perf n={8}/>}>
          <Head id="try-title" title={T.tryTitle} lede={flat ? T.tryLedeFlat : T.tryLede}/>
          <TryTasks tasks={TASKS} t={tryIt} linkOut={flat}/>
          {flat ? <div className="cnr-try-shot"><TryWindow t={tryIt} still shot/></div> : null}
          <p className="cnr-cap" data-print="">{t(T.tryNote)}</p>
        </Band>
        {flat ? null : <div className="cnr-over"><div className="cnr-over-paper" aria-hidden="true"/><div className="cnr-over-win"><TryWindow t={tryIt} still={still}/></div></div>}

        {/* ---------- 09 testing: the balance still due ---------- */}
        <Band id="cn-testing-section" label="cn-testing" head={<Perf n={9}/>}>
          <Head id="cn-testing" title={T.testTitle} lede={T.testLede}/>
          <h3 className="cnr-h3" data-print="">{t(T.plan)}</h3>
          <ul className="cnr-bullets">{TEST_PLAN.map(p => <li key={p.en} data-print="">{t(p)}</li>)}</ul>
          <h3 className="cnr-h3" data-print="">{t(T.hyps)}</h3>
          <ul className="cnr-hyps">{HYPOTHESES.map(h => <li key={h.en} data-print=""><Ev label="Hypothesis"/><span>{t(h)}</span></li>)}</ul>
          <div className="cnr-due" aria-label={t(T.results)}>
            <p className="cnr-due-badge" data-print="">{t(T.resultsBadge)}</p>
            {RESULTS.map(r => <Leader key={r.en} label={t(r)}>{t(T.ofFive)}</Leader>)}
            <p className="cnr-due-note" data-print="">{t(T.resultsNote)}</p>
          </div>
        </Band>

        {/* ---------- 10 reflection, and the end of the tape ---------- */}
        <Band id="cn-reflection-section" label="cn-reflection" head={<Perf n={10}/>} className="is-last">
          <Head id="cn-reflection" title={T.reflection}/>
          <div className="cnr-reflect">{REFLECTION.map(r => <div key={r.title.en} data-print="">
            <h3 className="cnr-h3">{t(r.title)}</h3><p>{t(r.body)}</p>
          </div>)}</div>
          <Rule double/>
          <p className="cnr-end" data-print="">{t(T.end)}</p>
        </Band>
        <div className="cnr-tear" aria-hidden="true"/>
      </div>
      <TearOff pick={pick} scrub={scrub} roll={roll}/>

      <nav className="cnr-next" aria-label={t(UI.nextProject)}>
        <Go to={`${PRODUCT_HOME}/${next.slug}`} className="cnr-next-link">
          <span className="cnr-next-text">
            <span className="cnr-next-label">{t(UI.nextProject)}</span>
            <span className="cnr-next-title" lang="en">{next.title}</span>
            <span className="cnr-next-sub">{next.subtitle || next.summary}</span>
          </span>
          {next.thumb ? <span className="cnr-next-media"><img src={next.thumb.src} width={next.thumb.width} height={next.thumb.height} alt="" loading="lazy" decoding="async"/></span> : null}
        </Go>
      </nav>
      <ProductFooter/>
    </div>
  </article>;
}
