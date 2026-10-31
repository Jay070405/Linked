import {lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {Go} from '../../Go';
import {ProductFooter} from '../../ProductIndex';
import {PRODUCT_HOME, nextCase} from '../../content';
import {L, UI, localize, useCaseLang} from '../../i18n';
import NextProject from '../../v2/NextProject';
import {useMedia} from '../../v2/motion';
import {Build, BuildProvider} from './Build';
import {Mark, MotionTokens, Palette, TypeSpecimens, Wordmark} from './Brand';
import {FilmProvider, FilmSteps, PlayFrom} from './Film';
import HakoDemo from './HakoDemo';
import {MINIS} from './Minis';
import {LIMITS, PRINCIPLES, RESULTS, T, TESTS, still as stillSrc} from './content';
import './hako.css';

/* Hako, as its own world: the page is a Hako canvas. Paper #F2F0EB with a dot grid, ink #0E0E11, Hako's own type
   (Mona Sans wide and heavy for display, Inter for the UI, Geist Mono for readouts, Caveat for the sketches; all OFL,
   self-hosted from the film's own packages under /assets/product/hako/fonts/).
   Signature: the page builds itself the way Hako builds (Build.jsx): sections arrive as sketches of their own layout,
   a persimmon box is drawn around each as it comes into view, ultraviolet agents take its regions and a scan line
   turns the sketch into the section. The visitor can drag a box around any sketch to build it sooner. Reduced motion
   and the plain page (?read=plain) show everything built; the words are in the page from the start.
   Order of weight: how Hako is used (shown, playable, then the film's eight moments), why it's built that way (six
   choices, each a Hypothesis with a small working model), the brand, then the limits and the tests I'd run. How the
   film itself was made lives on Other Project (/other-project/hako), linked once at the end.
   English and Chinese: every string is L(en, zh) through t(); the product's own UI (Daybreak, the prompt, the code)
   stays English. */

const Lightbox = lazy(() => import('../../v2/Lightbox'));
const NARROW = '(max-width: 1023px)';
const readPlain = () => { try { return new URLSearchParams(location.search).get('read') === 'plain'; } catch { return false; } };

/** A persimmon selection box drawn around the wordmark when the page opens; its tag reads the box's real size. */
function HeroSelect({still, children}) {
  const ref = useRef(null);
  const [size, setSize] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const take = () => { const r = el.getBoundingClientRect(); setSize({w: Math.round(r.width), h: Math.round(r.height)}); };
    take();
    const ro = new ResizeObserver(take);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <span ref={ref} className={`hw-hsel${still ? ' is-still' : ''}`}>
    {children}
    <span className="hw-hsel-box" aria-hidden="true">
      <i className="hw-e is-t"/><i className="hw-e is-l"/><i className="hw-e is-b"/><i className="hw-e is-r"/>
      {['tl', 'tc', 'tr', 'ml', 'mr', 'bl', 'bc', 'br'].map(h => <i key={h} className={`hw-h is-${h}`}/>)}
      {size ? <span className="hw-fx-dim">{size.w} × {size.h}</span> : null}
    </span>
  </span>;
}

function Head({id, kicker, title, lede, label}) {
  const {t} = useCaseLang();
  return <Build className="hw-head" label={label}>
    <p className="hw-kicker">{t(kicker)}</p>
    <h2 id={id} className="hw-h2" tabIndex={-1}>{t(title)}</h2>
    {lede ? <p className="hw-lede">{t(lede)}</p> : null}
  </Build>;
}

export default function HakoWorld({item: rawItem, reduced}) {
  const {t, zh, lang, htmlLang} = useCaseLang();
  const item = localize(rawItem, lang);
  const next = localize(nextCase(rawItem.slug), lang);
  const root = useRef(null);
  const narrow = useMedia(NARROW);
  const [plain, setPlain] = useState(readPlain);
  const still = reduced || plain;
  const [zoom, setZoom] = useState(null);

  // the plain reading mode is an address too (?read=plain), so it survives a reload and can be shared
  const choosePlain = useCallback((on, e) => {
    e?.preventDefault();
    setPlain(on);
    try {
      const url = new URL(location.href);
      if (on) url.searchParams.set('read', 'plain'); else url.searchParams.delete('read');
      history.replaceState(history.state, '', url);
    } catch { /* the address stays */ }
    requestAnimationFrame(() => { root.current?.scrollIntoView({block: 'start'}); root.current?.querySelector('#hw-title')?.focus({preventScroll: true}); });
  }, []);

  const jumpTo = sel => e => {
    const target = root.current?.querySelector(sel);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({behavior: still || e.detail === 0 ? 'auto' : 'smooth', block: 'start'});
    target.querySelector('h2, h3')?.focus?.({preventScroll: true});
  };

  // the figure viewer for anything marked [data-zoom] (the brand board)
  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const open = (el, keyboard) => {
      const img = el.querySelector('img');
      setZoom({items: [{src: el.getAttribute('data-zoom') || img?.currentSrc, alt: el.getAttribute('data-zoom-alt') || img?.alt || '', w: Number(el.getAttribute('data-zoom-w')) || img?.naturalWidth || 0, h: Number(el.getAttribute('data-zoom-h')) || img?.naturalHeight || 0}], index: 0, keyboard, opener: el});
    };
    const click = e => { const el = e.target.closest?.('[data-zoom]'); if (el && node.contains(el)) { e.preventDefault(); open(el, e.detail === 0); } };
    const key = e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-zoom]')) { e.preventDefault(); open(e.target, true); } };
    node.addEventListener('click', click); node.addEventListener('keydown', key);
    return () => { node.removeEventListener('click', click); node.removeEventListener('keydown', key); };
  }, []);

  return <article ref={root} className={`hw${plain ? ' is-plain' : ''}${still ? ' is-still' : ''}${zh ? ' is-zh' : ''}`} lang={htmlLang} data-nav-tone="light">
    <FilmProvider reduced={reduced}>
    <BuildProvider still={still} root={root}>

      {/* ---------- the hero: the wordmark, selected ---------- */}
      <header className="hw-hero hw-wrap">
        <div className="hw-topline">
          <Go to={PRODUCT_HOME} className="hw-back"><span aria-hidden="true">←</span> {t(UI.allWork)}</Go>
          {plain ? <a className="hw-skip" href="?" onClick={e => choosePlain(false, e)}>{t(T.back)}</a>
            : <a className="hw-skip" href="?read=plain" onClick={e => choosePlain(true, e)}>{t(T.skip)}</a>}
        </div>
        <p className="hw-flag"><span aria-hidden="true" className="hw-flag-dot"/>{t(T.flag)}</p>
        <div className="hw-hero-grid">
          <div className="hw-hero-mark">
            <p className="hw-kind">{item.kind}</p>
            <h1 id="hw-title" className="hw-title" tabIndex={-1}><span className="hw-sr">Hako</span><HeroSelect still={still}><Mark size={0} className="hw-title-mark"/><Wordmark/></HeroSelect></h1>
            <p className="hw-tagline" lang="en">Draw a box. <span>Ship a product.</span></p>
            {zh ? <p className="hw-tagline-zh">{t(T.taglineZh)}</p> : null}
          </div>
          <div className="hw-hero-copy">
            <p className="hw-outcome">{t(T.outcome)}</p>
            <p className="hw-role">{t(T.role)}</p>
            <div className="hw-actions">
              <a className="hw-btn is-hot" href="#hw-try" onClick={jumpTo('#hw-try')}>{t(T.tryIt)}</a>
              <PlayFrom className="hw-btn"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>{t(T.watch)} <span className="hw-btn-meta">{t(T.watchLen)}</span></PlayFrom>
            </div>
            <ul className="hw-chips" aria-label={t(T.about)}>{T.chips.map(c => <li key={c.en}>{t(c)}</li>)}</ul>
          </div>
        </div>
        <figure className="hw-film-frame">
          <p className="hw-frame-label"><span>{t(T.filmLabel)}</span></p>
          <PlayFrom className="hw-poster">
            <img src={stillSrc('poster')} srcSet={`${stillSrc('poster', 960)} 960w, ${stillSrc('poster')} 1600w`} sizes="(min-width: 1320px) 1240px, 94vw" width="1600" height="900" alt={t(T.filmAlt)} fetchPriority="high" decoding="async"/>
            <span className="hw-poster-play"><svg viewBox="0 0 16 16" width="22" height="22" aria-hidden="true"><path d="M4.5 2.5v11l9-5.5z" fill="currentColor"/></svg><span>{t(T.playFilm)}</span></span>
          </PlayFrom>
          <figcaption>{t(T.filmNote)}</figcaption>
        </figure>
        {still ? null : <p className="hw-effect"><Mark size={18}/><span>{t(T.effect)}</span></p>}
      </header>

      {/* ---------- 01 how it's used: the demo, then the film's eight moments ---------- */}
      <section id="hw-use" className="hw-ch hw-wrap" aria-labelledby="hw-use-title">
        <Head id="hw-use-title" kicker={T.k1} title={T.h1} lede={T.l1} label={L('How it’s used', '怎么用')}/>
        <Build id="hw-try" className="hw-demo-block" label={L('Try it', '试一试')}>
          <h3 className="hw-h3" data-region="Copy">{t(T.demoTitle)}</h3>
          <p className="hw-sub">{t(T.demoLede)}</p>
          <div className="hw-demo-card" data-sk="media" data-region="Canvas"><HakoDemo reduced={still}/></div>
        </Build>
        <Build className="hw-head is-sub">
          <h3 className="hw-h3">{t(T.stepsTitle)}</h3>
          <p className="hw-sub">{t(T.stepsLede)}</p>
        </Build>
        <FilmSteps wide={!narrow && !plain}/>
      </section>

      {/* ---------- 02 why: six choices, each with a working model ---------- */}
      <section id="hw-why" className="hw-ch hw-wrap" aria-labelledby="hw-why-title">
        <Head id="hw-why-title" kicker={T.k2} title={T.h2} lede={T.l2} label={L('Why', '为什么')}/>
        <div className="hw-principles">{PRINCIPLES.map((p, i) => {
          const Mini = MINIS[p.mini];
          return <Build key={p.id} as="article" className={`hw-p is-${p.id}`} label={p.title} aria-labelledby={`hw-p-${p.id}`}>
            <p className="hw-p-n" aria-hidden="true"><span>02.{i + 1}</span>{t(p.title)}</p>
            <div className="hw-p-visual" data-region="Media"><Mini still={still}/></div>
            <div className="hw-p-text" data-region="Copy">
              <h3 id={`hw-p-${p.id}`} className="hw-h3">{t(p.title)}</h3>
              <p>{t(p.body)}</p>
              {p.id === 'code' ? <p className="hw-p-link"><Go to={`${PRODUCT_HOME}/ready-for-agents`}>{t(L('Ready for agents: what coding agents lose from a Figma file', 'Ready for agents：coding agent 从 Figma 文件里丢掉了什么'))} <span aria-hidden="true">→</span></Go></p> : null}
              <p className="hw-claim"><Ev label="Hypothesis"/><span>{t(p.claim)}</span></p>
            </div>
          </Build>;
        })}</div>
      </section>

      {/* ---------- 03 the brand ---------- */}
      <section id="hw-brand" className="hw-ch hw-wrap" aria-labelledby="hw-brand-title">
        <Head id="hw-brand-title" kicker={T.k3} title={T.h3} lede={T.l3} label={L('Brand', '品牌')}/>
        <Build className="hw-lockup" label={L('Mark', '标志')}>
          <div className="hw-lockup-mark" data-region="Media"><Mark size={0} className="hw-big-mark"/></div>
          <div className="hw-lockup-word" data-region="Copy">
            <p className="hw-lockup-type"><Wordmark/><span className="hw-sr">hako</span></p>
            <p className="hw-lockup-line" lang="en">Draw a box. <span>Ship a product.</span></p>
            <p className="hw-cap">{t(L('In the wordmark, “hak” is set in Mona Sans and the “o” is a drawn shape, a rounded-square ring as tall as the x-height. Its corners have the same ratio as the handles on the mark.', '字标里的 “hak” 用 Mona Sans 排，“o” 是单独画的圆角方环，高度等于 x 字高，圆角比例和标志上的控制点相同。'))}</p>
          </div>
        </Build>
        <Build className="hw-brand-block" label={L('Palette', '配色')}>
          <h3 className="hw-h3">{t(T.paletteTitle)}</h3>
          <p className="hw-sub">{t(T.paletteRule)}</p>
          <Palette/>
        </Build>
        <Build className="hw-brand-block" label={L('Type', '字体')}>
          <h3 className="hw-h3">{t(T.typeTitle)}</h3>
          <TypeSpecimens/>
        </Build>
        <Build className="hw-brand-block" label={L('Motion', '动效')}>
          <h3 className="hw-h3">{t(T.motionTitle)}</h3>
          <p className="hw-sub">{t(T.motionLede)}</p>
          <MotionTokens still={still}/>
        </Build>
        <Build className="hw-brand-block" label={L('Board', '品牌板')}>
          <h3 className="hw-h3">{t(T.boardTitle)}</h3>
          <figure className="hw-board" data-zoom="/assets/product/hako/brand-board.webp" data-zoom-alt={t(T.boardAlt)} data-zoom-w="1920" data-zoom-h="1080" role="button" tabIndex={0} aria-label={`${t(UI.enlarge)}: ${t(T.boardAlt)}`}>
            <img src="/assets/product/hako/brand-board.webp" width="1920" height="1080" alt={t(T.boardAlt)} loading="lazy" decoding="async"/>
          </figure>
        </Build>
      </section>

      {/* ---------- 04 limits, and the tests I'd run ---------- */}
      <section id="hw-limits" className="hw-ch hw-wrap" aria-labelledby="hw-limits-title">
        <Head id="hw-limits-title" kicker={T.k4} title={T.h4} lede={T.l4} label={L('Limits', '局限')}/>
        <Build className="hw-limits-block"><ol className="hw-limits">{LIMITS.map((l, i) => <li key={l.en}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><p>{t(l)}</p></li>)}</ol></Build>
        <Build className="hw-tests" label={L('Tests', '测试')}>
          <h3 className="hw-h3">{t(T.testsTitle)}</h3>
          <ol>{TESTS.map(x => <li key={x.claim.en}><p className="hw-test-claim"><Ev label="Hypothesis"/><b>{t(x.claim)}</b></p><p>{t(x.how)}</p></li>)}</ol>
        </Build>
        <Build className="hw-results" label={L('Results', '结果')}>
          <h3 className="hw-h3">{t(T.resultsTitle)}</h3>
          <p className="hw-badge">{t(T.resultsBadge)}</p>
          <dl>{RESULTS.map(([k, v]) => <div key={k.en}><dt>{t(k)}</dt><dd>{t(v)}</dd></div>)}</dl>
        </Build>
        <p className="hw-filmlink"><Go to="/other-project/hako" className="hw-btn is-ghost">{t(T.filmMade)} <span aria-hidden="true">→</span></Go><span>{t(T.filmMadeNote)}</span></p>
      </section>

      <div className="hw-wrap hw-end">
        <NextProject item={next} image={next.thumb}/>
        <ProductFooter/>
      </div>
    </BuildProvider>
    </FilmProvider>
    {zoom ? <Suspense fallback={null}><Lightbox {...zoom} reduced={still} onClose={() => setZoom(null)}/></Suspense> : null}
  </article>;
}
