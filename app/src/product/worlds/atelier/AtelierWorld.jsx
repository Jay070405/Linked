import {lazy, Suspense, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {Go} from '../../Go';
import {ProductFooter} from '../../ProductIndex';
import {nextCase, PRODUCT_HOME} from '../../content';
import {L, localize, UI, useCaseLang} from '../../i18n';
import CaseChrome, {zoomable} from './kit/CaseChrome';
import Scrolly from './kit/Scrolly';
import Decisions from './kit/Decisions';
import BeforeAfter, {RoundChanges} from './kit/BeforeAfter';
import LivePrototype from './kit/LivePrototype';
import {Deferred} from './kit/Try';
import {protoUrl, shotSrc} from './kit/Device';
import {ArrowDown, ArrowRight, ArrowUpRight} from './kit/icons';
import {PHONE, useMedia} from './kit/motion';
import {WalkthroughProvider, WatchButton, WatchCard} from '../../v2/Walkthrough';
import Gallery from './Gallery';
import ThemeToggle, {useCaseTheme} from './ThemeToggle';
import {CHANGES, DECISIONS, fullSrc, HERO, IN, PROBLEM, REFLECTION, REVIEW_NOTE, ROUNDS, STEPS, TASKS, TESTING, thumbSrc, wallSrc, workOf} from './data';
import {largestSharp} from './model';
import './atelier-world.css';

/* D2 Atelier as its own world: "The gallery and the press" (site-spec/WORLDS.md), in English and Chinese (it follows
   the site's EN/中文 switch live; product/i18n.jsx).
   A quiet gallery, in daylight or at night. The hero is one painting under a spotlight; the collection hangs along a
   wall you walk with the scroll; the press prints the chosen painting in four inks and runs the print check by hand;
   the print hangs on the prototype's wall beside its price card. The rest of the case (problem, flow, decisions,
   rounds, the live prototype, testing, reflection) sits in the same room. "Skip the experience" swaps everything for a
   plain reading version with the same content. Reusable pieces are copies of the v2 kit (./kit), restyled here. */

const Press = lazy(() => import('./Press'));
const WallPrice = lazy(() => import('./WallPrice'));
const Plain = lazy(() => import('./Plain'));

const CHAPTERS = [
  {id: 'at-gallery', label: L('The collection', '作品陈列')},
  {id: 'at-problem-section', label: L('The problem', '问题')},
  {id: 'at-flow', label: L('Five steps to a drop', '五步上新')},
  {id: 'at-press', label: L('The press', '印刷机')},
  {id: 'at-wall', label: L('Hung, then priced', '上墙，再定价')},
  {id: 'at-decisions', label: L('Decisions', '设计决策')},
  {id: 'at-compare', label: L('Round 1 → 2', '第一轮 → 第二轮')},
  {id: 'try', label: L('Try it', '试一试')},
  {id: 'at-testing-section', label: L('Testing', '测试')},
  {id: 'at-reflection-section', label: L('Reflection', '复盘')},
];

/** The rejected and chosen primary action, drawn rather than described. The blue one is recreated from Jay's notes.
    The buttons are the prototype's English UI. */
function InkVisual() {
  return <div className="atw-ink" lang="en">
    <span className="atw-ink-old">Publish drop</span>
    <span className="atw-ink-new">Publish your drop</span>
  </div>;
}

export default function AtelierWorld({item: base, reduced}) {
  const {lang, htmlLang} = useCaseLang();
  const item = localize(base, lang);
  const root = useRef(null);
  const [plain, setPlain] = useState(false);
  const [theme, setTheme] = useCaseTheme();
  const [artId, setArtId] = useState('blue-hour');
  const [sizeId, setSizeId] = useState(() => largestSharp(workOf('blue-hour')).id);
  const choose = id => { setArtId(id); setSizeId(largestSharp(workOf(id)).id); };
  const next = localize(nextCase(base.slug), lang);

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

  return <article ref={root} className={`pp-page atw-world${plain ? ' is-plain' : ''}`} lang={htmlLang} data-theme={theme} data-nav-tone={theme === 'dark' ? 'dark' : 'light'}>
    <WalkthroughProvider slug={base.slug} title={HERO.title} reduced={reduced}>
      <ThemeToggle theme={theme} onChange={setTheme} root={root} reduced={reduced}/>
      {plain
        ? <Suspense fallback={<div className="atw-hold"/>}><Plain item={item} next={next} onBack={() => swap(false)}/></Suspense>
        : <World item={item} reduced={reduced} root={root} artId={artId} setArtId={choose} sizeId={sizeId} setSizeId={setSizeId} next={next} onPlain={() => swap(true)}/>}
      <ProductFooter/>
    </WalkthroughProvider>
  </article>;
}

function World({item, reduced, root, artId, setArtId, sizeId, setSizeId, next, onPlain}) {
  const {t} = useCaseLang();
  const phone = useMedia(PHONE);
  const scrollToTry = e => {
    const target = root.current?.querySelector('#try');
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({behavior: reduced || e.detail === 0 ? 'auto' : 'smooth', block: 'start'});
    target.querySelector('button, a')?.focus({preventScroll: true});
  };
  const chapters = useMemo(() => CHAPTERS.map(c => ({...c, label: t(c.label)})), [t]);
  const steps = STEPS.map(s => ({...s, label: t(s.label), title: t(s.title), alt: t(s.alt), body: <p>{t(s.text)}</p>}));
  const decisions = DECISIONS.map(d => ({...d, title: t(d.title), verdict: t(d.verdict), tried: t(d.tried), chose: t(d.chose),
    visual: d.image ? <img src={d.image.src || shotSrc(d.image.screen)} alt="" loading="lazy" style={{objectPosition: d.image.position}}/> : <InkVisual/>}));
  const rounds = ROUNDS.map(r => ({...r, tab: t(r.tab), caption: t(r.caption), before: {...r.before, label: t(r.before.label)}, after: {...r.after, label: t(r.after.label)}}));
  const tasks = TASKS.map(k => ({...k, title: t(k.title), hint: t(k.hint)}));
  return <>
    <Hero item={item} reduced={reduced} phone={phone} onPlain={onPlain} onTry={scrollToTry}/>
    <CaseChrome root={root} chapters={chapters} reduced={reduced} hush={['at-gallery', 'at-press']}/>
    <Gallery reduced={reduced}/>
    <Problem/>
    <Scrolly id="at-flow" reduced={reduced} steps={steps} art="blue-hour" label={t(L('The drop flow', '上新流程'))} title={t(L('Atelier prototype, following the steps', 'Atelier 原型，跟着步骤走'))}
      heading={t(L('Five steps to a drop, then share it', '五步完成上新，再分享出去'))}
      lede={t(L('The artist side is where the product earns its keep. Scroll through a drop; the phone runs the real prototype.', '产品值不值，要看画师这一端。往下滚动，走完一次上新；手机里跑的是真实原型。'))}/>
    <Deferred minHeight={1800} label={t(L('The press, loading', '印刷机，加载中'))}>
      <Press reduced={reduced} artId={artId} setArtId={setArtId} sizeId={sizeId} setSizeId={setSizeId}/>
    </Deferred>
    <Deferred minHeight={900} label={t(L('The wall and the price card, loading', '墙面和价格卡，加载中'))}>
      <WallPrice artId={artId} sizeId={sizeId} setSizeId={setSizeId} reduced={reduced}/>
    </Deferred>
    <Decisions id="at-decisions" items={decisions}
      heading={t(L('What I chose, and what I tried first', '最后选了什么，之前试过什么'))}
      lede={t(L('Five choices from three rounds of critique. Each label shows the choice; open it to see what it replaced.', '五个选择，来自三轮评审。每张标签写着最后的选择，展开能看到它替换了什么。'))}/>
    <BeforeAfter id="at-compare" reduced={reduced} pairs={rounds} label={t(L('Compare round 1 with round 2', '对比第一轮和第二轮'))}
      heading={t(L('Round 1 → Round 2', '第一轮 → 第二轮'))}
      lede={t(L('Round 2 came out of a design review. Pick a screen and drag across the phone to compare the two rounds.', '第二轮的改动来自一次设计评审。选一个界面，在手机上左右拖动，对比两轮。'))}>
      <p className="atw-review-note"><span><b>{t(L('A model-assisted design review.', '借模型做了一次设计评审。'))}</b> {t(REVIEW_NOTE)}</span></p>
      <RoundChanges items={CHANGES.map(c => ({what: t(c.what), why: t(c.why)}))} title={t(L('What changed and why', '改了什么，为什么改'))}/>
    </BeforeAfter>
    <LivePrototype id="try" reduced={reduced} tasks={tasks} start={{screen: 'onboarding', art: 'blue-hour'}} name={t(L('Atelier prototype', 'Atelier 原型'))}
      heading={t(L('Try it yourself', '自己试试'))}
      lede={t(L('This is the same prototype, at full size. Pick a task; the phone opens on the right screen.', '还是这个原型，原尺寸。选一个任务，手机会直接打开对应的界面。'))}
      phoneLede={t(L('This is the same prototype. Each task opens it full screen, on the screen where the task starts.', '还是这个原型。每个任务都会全屏打开它，停在任务开始的界面。'))}
      note={t(L('It runs in your browser only: no account, no payment, no shipping. Drafts and test orders stay in this browser until you reset.', '它只在你的浏览器里运行：不用账号，不付款，不发货。草稿和测试订单会一直留在这个浏览器里，直到你点重置。'))}
      after={<WatchCard className="atw-watch-card"/>}/>
    <Testing/>
    <Reflection/>
    <Next item={next}/>
  </>;
}

/* ---------- the entrance: one painting under a light ---------- */
function Hero({item, reduced, phone, onPlain, onTry}) {
  const {t, zh, lang} = useCaseLang();
  const ref = useRef(null);
  const w = workOf('blue-hour'), top = largestSharp(w);
  // the one orchestrated moment: the lights come on, then the words
  useLayoutEffect(() => {
    const node = ref.current; if (!node) return undefined;
    if (reduced) { node.classList.add('is-on', 'is-instant'); return undefined; }
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => node.classList.add('is-on')));
    return () => cancelAnimationFrame(raf);
  }, [reduced]);
  const alt = zh ? `《${w.title}》（${w.zh}），我的一幅画：${t(w.about)}` : `${w.title}, one of my paintings: ${t(w.about).toLowerCase()}`;
  return <header ref={ref} className="atw-hero">
    <div className="atw-hero-top">
      <Go to={PRODUCT_HOME} className="atw-back"><span aria-hidden="true">←</span> {t(UI.allWork)}</Go>
      <button type="button" className="atw-skip" onClick={onPlain}>{t(L('Skip the experience: read it plainly', '跳过展厅，直接读简洁版'))}</button>
    </div>
    <div className="atw-hero-grid">
      <div className="atw-hero-copy">
        <p className="atw-kind" data-in="1">{item.kind}</p>
        <h1 id="atw-title" className="atw-title" tabIndex={-1} data-in="0" lang="en">{HERO.title}</h1>
        <p className="atw-outcome" data-in="2">{t(HERO.outcome)}</p>
        <ul className="atw-credits" aria-label={t(L('Project facts', '项目信息'))} data-in="3">{HERO.chips.map(c => <li key={c.en}>{t(c)}</li>)}</ul>
        <div className="atw-actions" data-in="4">
          {phone
            ? <a className="atw-cta" href={protoUrl('onboarding')} target="_blank" rel="noopener"><span>{t(L('Open the prototype', '打开原型'))}</span><ArrowUpRight/><span className="atw-sr">{t(UI.opensInNewTab)}</span></a>
            : <a className="atw-cta" href="#try" onClick={onTry}><span>{t(L('Try the prototype', '试用原型'))}</span><ArrowDown/></a>}
          <a className="atw-link" href="#at-gallery"><span className="atw-link-text">{t(L('Walk the gallery', '逛逛展厅'))}</span></a>
        </div>
      </div>
      <div className="atw-hero-work">
        <span className="atw-hero-cone" aria-hidden="true"/>
        <span className="atw-hero-pool" aria-hidden="true"/>
        <div className="atw-hero-hang">
          <div className="atw-mat is-hero" {...zoomable(alt, {src: fullSrc(w.id), w: w.originalWidth, h: w.originalHeight, lang})}>
            <img src={wallSrc(w.id)} width={1600} height={844} alt="" fetchPriority="high" decoding="async"/>
          </div>
          <div className="atw-hero-side">
            <div className="atw-label is-hero">
              <p className="atw-label-title"><span lang="en">{w.title}</span>{zh ? <span className="atw-label-zh">{w.zh}</span> : null}</p>
              <p className="atw-label-by">Jay Lin</p>
              <p className="atw-label-about">{zh ? `${top.w} × ${top.h} 英寸印品，这个文件能印清楚的最大尺寸` : `Print, ${top.w} × ${top.h} in, the largest this file prints sharp`}</p>
              <p className="atw-label-price">$38</p>
            </div>
            {/* beside the wall label, like a gallery's guide: in view on a phone too, where the actions are far below */}
            <WatchButton className="atw-button atw-watch" data-in="3"/>
          </div>
        </div>
      </div>
    </div>
  </header>;
}

/* ---------- the problem: four tools and the seams between them ---------- */
function Problem() {
  const {t} = useCaseLang();
  const art = id => <img src={thumbSrc(id)} alt="" loading="lazy" decoding="async"/>;
  const sketches = [
    <span key="post" className="atw-tool-sketch is-post">{art('return')}<i/><i/></span>,
    <span key="shop" className="atw-tool-sketch is-shop">{art('spring')}{art('clouds')}{art('quiet-gate')}{art('between')}</span>,
    <span key="print" className="atw-tool-sketch is-print">{art('red-planet')}<i>18 × 24 {t(IN)}</i></span>,
    <span key="dm" className="atw-tool-sketch is-dm"><i/><i/><i/></span>,
  ];
  return <section id="at-problem-section" className="atw-problem" aria-labelledby="at-problem">
    <div className="atw-problem-copy">
      <h2 id="at-problem" className="atw-h2">{t(PROBLEM.heading)}</h2>
      <div className="atw-prose">{PROBLEM.paragraphs.map(p => <p key={p.en.slice(0, 20)}>{t(p)}</p>)}</div>
      <p className="atw-hyp"><Ev label="Hypothesis"/><span>{t(PROBLEM.hypothesis)}</span></p>
    </div>
    <aside className="atw-slot" aria-label={t(L('Interview quotes, not collected yet', '访谈原话（还没收集）'))}>
      <p className="atw-slot-badge">{t(L('Placeholder', '占位'))}</p>
      <p>{t(PROBLEM.quote)}</p>
    </aside>
    <figure className="atw-seams">
      <ol className="atw-seams-row">
        {PROBLEM.tools.map((tool, i) => [
          <li key={tool.role.en} className="atw-tool">{sketches[i]}<b>{t(tool.name)}</b><span>{t(tool.role)}</span></li>,
          PROBLEM.seams[i] ? <li key={PROBLEM.seams[i].en} className="atw-seam"><span>{t(PROBLEM.seams[i])}</span></li> : null,
        ])}
      </ol>
      <figcaption className="atw-caption"><Ev label="Hypothesis"/> <span>{t(PROBLEM.seamsNote)}</span></figcaption>
    </figure>
  </section>;
}

function Testing() {
  const {t} = useCaseLang();
  return <section id="at-testing-section" className="atw-testing" aria-labelledby="at-testing">
    <div className="atw-room-head">
      <h2 id="at-testing" className="atw-h2">{t(L('Testing comes next', '接下来是测试'))}</h2>
      <p className="atw-lede">{t(L('Nothing here has been tested with artists yet. This is the plan, and the space the results will fill.', '这里的内容都还没找画师测过。下面是测试计划，结果的位置也留好了。'))}</p>
    </div>
    <div className="atw-testing-grid">
      <div className="atw-testing-plan">
        <h3 className="atw-h3">{t(L('Plan for test day', '测试日计划'))}</h3>
        <ul className="atw-list">{TESTING.plan.map(p => <li key={p.en}>{t(p)}</li>)}</ul>
        <h3 className="atw-h3">{t(L('Hypotheses to check', '待验证的假设'))}</h3>
        <ul className="atw-hypotheses">{TESTING.hypotheses.map(h => <li key={h.en}><Ev label="Hypothesis"/><span>{t(h)}</span></li>)}</ul>
      </div>
      <div className="atw-results" aria-label={t(L('Results, not collected yet', '结果（还没收集）'))}>
        <p className="atw-slot-badge">{t(L('Placeholder: results after test day', '占位：测试日之后再填'))}</p>
        <dl>{TESTING.results.map(([k, v]) => <div key={k.en}><dt>{t(k)}</dt><dd>{t(v)}</dd></div>)}</dl>
        <p className="atw-results-note">{t(L('Each result will sit next to the change it caused.', '每条结果都会放在它带来的改动旁边。'))}</p>
      </div>
    </div>
  </section>;
}

function Reflection() {
  const {t} = useCaseLang();
  return <section id="at-reflection-section" className="atw-reflection" aria-labelledby="at-reflection">
    <h2 id="at-reflection" className="atw-h2">{t(L('Reflection', '复盘'))}</h2>
    <div className="atw-reflection-grid">
      {REFLECTION.map(r => <div key={r.title.en}><h3 className="atw-h3">{t(r.title)}</h3><p>{t(r.text)}</p></div>)}
    </div>
  </section>;
}

function Next({item}) {
  const {t} = useCaseLang();
  return <nav className="atw-next" aria-label={t(UI.nextProject)}>
    <Go to={`${PRODUCT_HOME}/${item.slug}`} className="atw-next-link">
      <span className="atw-next-text">
        <span className="atw-next-label">{t(UI.nextProject)}</span>
        <span className="atw-next-title" lang="en">{item.title}</span>
        <span className="atw-next-sub">{item.subtitle || item.summary}</span>
        <span className="atw-next-go" aria-hidden="true"><ArrowRight width={20} height={20}/></span>
      </span>
      {item.thumb?.src ? <span className="atw-next-media"><img src={item.thumb.src} width={item.thumb.width} height={item.thumb.height} alt="" loading="lazy" decoding="async"/></span> : null}
    </Go>
  </nav>;
}
