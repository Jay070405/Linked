import {lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Go} from '../../Go';
import {ProductFooter} from '../../ProductIndex';
import {PRODUCT_HOME, nextCase} from '../../content';
import {L, UI, localize, useCaseLang} from '../../i18n';
import {PHONE, scrollerOf, useMedia} from '../../v2/motion';
import {WalkthroughProvider, WatchButton} from '../../v2/Walkthrough';
import {ThemeToggle, useCaseTheme} from './theme';
import {Pic} from './Pic';
import {useVideos} from './video';
import {drawFit, filmFor, filmInfo, filmSrc, useFilm} from './film';
import {CHAPTERS, DAY, HERO, OPENING, TITLE} from './content';
import './arden.css';

/* D5, Arden: "Glasses first" (site-spec/WORLD-ARDEN.md). An Apple-style product page that also shows the design
   thinking behind it: big type with tight tracking, huge renders, white sections alternating with black ones (the
   hero, the display, the capture light), generous space. One accent, used sparingly: the warm white of the capture
   light and the in-lens text, on black. No green, no teal. Type is the system face with Inter behind it, as in the app.
   The hero renders with the page; chapters 2–14 load as their own chunk right after, so other product pages carry
   none of it. "Skip the experience" swaps everything for a plain reading version; reduced motion keeps every module,
   without movement. */

const Chapters = lazy(() => import('./Chapters'));
const Plain = lazy(() => import('./Plain'));
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export default function ArdenWorld({item, reduced}) {
  const root = useRef(null);
  const {lang, htmlLang} = useCaseLang();
  const [plain, setPlain] = useState(false);
  const {theme, toggle, fading} = useCaseTheme(reduced);
  const videos = useVideos('d5-arden');
  const next = localize(nextCase(item.slug), lang);

  const swap = useCallback(to => {
    setPlain(to);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const node = root.current; if (!node) return;
      const scroller = scrollerOf(node);
      if (scroller === window) scrollTo(0, 0); else scroller.scrollTop = 0;
      node.querySelector(to ? '#ar-plain-title' : '#ar-title')?.focus({preventScroll: true});
    }));
  }, []);

  return <article ref={root} className={`pp-page ar${plain ? ' is-plain' : ''}${reduced ? ' is-reduced' : ''}${fading ? ' is-theming' : ''}${lang === 'zh' ? ' is-zh' : ''}`}
    lang={htmlLang} data-theme={theme} data-nav-tone={theme === 'dark' ? 'dark' : 'light'}>
    <WalkthroughProvider slug={item.slug} title={TITLE} reduced={reduced}>
      <LocalNav root={root} reduced={reduced} theme={theme} onTheme={toggle} plain={plain}/>
      {plain
        ? <Suspense fallback={<div className="ar-hold"/>}><Plain videos={videos} onBack={() => swap(false)}/></Suspense>
        : <>
          <Hero reduced={reduced} videos={videos} root={root} onPlain={() => swap(true)}/>
          <Suspense fallback={<div className="ar-hold"/>}><Chapters reduced={reduced} videos={videos}/></Suspense>
        </>}
      <Next item={next}/>
      <ProductFooter/>
    </WalkthroughProvider>
  </article>;
}

/** Jump to a chapter: smooth unless reduced motion (or a keyboard "click"), then focus its heading. */
export function jumpTo(root, id, e, reduced) {
  const target = root.current?.querySelector(`#${id}`);
  if (!target) return;
  e?.preventDefault();
  target.scrollIntoView({behavior: reduced || e?.detail === 0 ? 'auto' : 'smooth', block: 'start'});
  const h = target.matches('h1, h2') ? target : target.querySelector('h1, h2') || target;
  if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
  h.focus({preventScroll: true});
}

/* ---------- the product bar: name, chapters, light switch; dark while a black section is under it ---------- */
function LocalNav({root, reduced, theme, onTheme, plain}) {
  const {t} = useCaseLang();
  const [current, setCurrent] = useState(CHAPTERS[0].id);
  const [onBlack, setOnBlack] = useState(!plain);
  const list = useRef(null), bar = useRef(null);
  useEffect(() => {
    const sc = scrollerOf(root.current);
    let raf = 0;
    const spy = () => {
      raf = 0;
      const vh = sc === window ? innerHeight : sc.clientHeight, line = vh * .35;
      let now = CHAPTERS[0].id;
      if (!plain) for (const c of CHAPTERS) { const el = root.current?.querySelector(`#${c.id}`); if (el && el.getBoundingClientRect().top < line) now = c.id; }
      setCurrent(now);
      // is a black section under the bar (and under the site nav above it)?
      const b = bar.current?.getBoundingClientRect(), mid = b ? b.top + b.height / 2 : 120;
      const black = !plain && [...(root.current?.querySelectorAll('.ar-black') || [])].some(el => { const r = el.getBoundingClientRect(); return r.top <= (b ? b.bottom + 4 : mid) && r.bottom > mid; });
      setOnBlack(black);
      document.body.classList.toggle('ar-under-black', black);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(spy); };
    sc.addEventListener('scroll', on, {passive: true});
    addEventListener('resize', on);
    spy();
    const late = setTimeout(spy, 800);    // the chapters chunk arrives a moment later
    return () => { sc.removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf); clearTimeout(late); document.body.classList.remove('ar-under-black'); };
  }, [root, plain]);
  useEffect(() => {
    const ul = list.current, a = ul?.querySelector('[aria-current="true"]');
    if (!ul || ul.scrollWidth <= ul.clientWidth) return;
    if (!a) { ul.scrollTo({left: 0, behavior: reduced ? 'auto' : 'smooth'}); return; }
    ul.scrollTo({left: a.offsetLeft - ul.clientWidth / 2 + a.offsetWidth / 2, behavior: reduced ? 'auto' : 'smooth'});
  }, [current, reduced]);
  return <nav ref={bar} className={`ar-local${onBlack ? ' is-black' : ''}`} aria-label={t(L('Arden, on this page', 'Arden 本页目录'))}>
    <div className="ar-local-in">
      <a className="ar-local-name" href="#ar-top" onClick={e => jumpTo(root, 'ar-top', e, reduced)} lang="en">{TITLE}</a>
      {plain ? <span className="ar-local-flex"/> : <ul ref={list} className="ar-local-links">
        {CHAPTERS.slice(1).map(c => <li key={c.id}>
          <a href={`#${c.id}`} aria-current={current === c.id ? 'true' : undefined} onClick={e => jumpTo(root, c.id, e, reduced)}>{t(c.label)}</a>
        </li>)}
      </ul>}
      <ThemeToggle theme={theme} onToggle={onTheme}/>
    </div>
  </nav>;
}

/* ---------- 1. the opening: a pinned film, scrubbed by scroll, with four beats ---------- */
/* About three screens of scroll: the film (renders/seq/hero, the phone crop on phones) starts on an extreme close-up of
   a highlight running along the titanium chamfer, pulls back and orbits to the front, and ends with the right lens
   glowing faintly and the capture light softly lit. Four lines fade in and out over it. Frame 1 is an ordinary image in
   the page; the next 30 load right away and the rest when the browser is idle. Reduced motion: the last frame, still,
   with the four lines as a stack. */
function Hero({reduced, videos, root, onPlain}) {
  const {t} = useCaseLang();
  const sec = useRef(null), run = useRef(null), stage = useRef(null), canvas = useRef(null), beats = useRef([]), chrome = useRef(null);
  const name = useMemo(() => filmFor('hero'), []);
  const info = name ? filmInfo(name) : null;
  const phone = useMedia(PHONE);
  const fit = phone ? 'contain' : 'cover';
  const {store, loaded} = useFilm(name, sec, {when: 'now', ahead: 30, enabled: !reduced && !!info});
  const at = useRef(0);
  const [drawn, setDrawn] = useState(false);
  const paint = useCallback(() => {
    const img = store?.nearest(at.current);
    if (img && drawFit(canvas.current, img, fit) && !drawn) setDrawn(true);
  }, [store, fit, drawn]);

  useLayoutEffect(() => {
    const node = run.current, st = stage.current;
    if (!node || !st || reduced || !info) return undefined;
    const sc = scrollerOf(node);
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = node.getBoundingClientRect(), top = parseFloat(getComputedStyle(st).top) || 0;
      const p = clamp((top - r.top) / Math.max(1, r.height - st.offsetHeight));
      const f = p * (info.count - 1);
      at.current = Math.round(f);
      paint();
      // the beats, by frame (1-based, inclusive), fading over about four frames at each end
      OPENING.beats.forEach((b, i) => {
        const el = beats.current[i];
        if (!el) return;
        const n = f + 1, a = b.from === 1 ? 1 : clamp((n - (b.from - 3)) / 4), z = b.to === info.count ? 1 : clamp((b.to + 1 - n) / 4);
        const o = Math.min(a, z);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${((1 - o) * 10).toFixed(1)}px)`;
      });
      const c = 1 - clamp(p / .035);
      if (chrome.current) { chrome.current.style.opacity = String(c); chrome.current.dataset.gone = c < .02 ? 'true' : ''; }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    sc.addEventListener('scroll', on, {passive: true});
    addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); sc.removeEventListener('scroll', on); removeEventListener('resize', on); };
  }, [reduced, info, paint]);
  useEffect(() => { if (!reduced) paint(); }, [loaded, paint, reduced]);

  const last = info ? filmSrc(info, info.count - 1) : null;
  return <header ref={sec} id="ar-top" className={`ar-hero ar-black${reduced || !info ? ' is-still' : ''}`} aria-labelledby="ar-title">
    {/* the run is the scroll distance the film is pinned for */}
    <div ref={run} className="ar-film-run">
    <div ref={stage} className="ar-film">
      {info ? <>
        <img className="ar-film-poster" data-fit={fit} data-hide={(!reduced && drawn) || undefined} src={reduced ? last : filmSrc(info, 0)} alt="" fetchPriority="high" decoding="async"/>
        {reduced ? null : <canvas ref={canvas} className="ar-film-canvas" aria-hidden="true"/>}
        <p className="ar-sr">{t(OPENING.filmLabel)}</p>
      </> : <div className="ar-film-fallback"><Pic name="hero-black-dark" alt={t(HERO.alt)} eager/></div>}
      <div ref={chrome} className="ar-film-chrome">
        <div className="ar-toprow">
          <Go to={PRODUCT_HOME} className="ar-back"><span aria-hidden="true">←</span> {t(UI.allWork)}</Go>
          <button type="button" className="ar-skip" onClick={onPlain}>{t(HERO.skip)}</button>
        </div>
        <p className="ar-film-kind"><span>{t(HERO.kind)}</span> <span>{t(HERO.concept)}</span></p>
        {reduced ? null : <p className="ar-film-hint" aria-hidden="true">{t(OPENING.scroll)}<span/></p>}
      </div>
      <h1 id="ar-title" className="ar-sr" tabIndex={-1}>{t(HERO.title)}</h1>
      <div className="ar-beats" aria-hidden={reduced ? undefined : 'true'}>
        {OPENING.beats.map((b, i) => <p key={i} ref={el => { beats.current[i] = el; }} className={`ar-beat is-${b.size}`}>{t(b.text)}</p>)}
      </div>
    </div>
    </div>
    <div className="ar-hero-tail">
      <p className="ar-kicker">{t(HERO.kind)}</p>
      <p className="ar-hero-line">{t(HERO.line)}</p>
      <div className="ar-actions">
        {/* wired, and shown once public/video/d5-arden-page.mp4 exists */}
        {videos.page ? <WatchButton className="ar-btn is-light"/> : null}
        {/* the signature, a few screens down: put them on and spend a day in them */}
        <a className="ar-btn is-ghost-light" href="#ar-day" onClick={e => jumpTo(root, 'ar-day', e, reduced)}><GlassesIcon/>{t(DAY.heading)}</a>
        <a className="ar-btn is-ghost-light" href="#ar-inside" onClick={e => jumpTo(root, 'ar-inside', e, reduced)}>{t(HERO.look)}<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 3v10M3.5 8.5 8 13l4.5-4.5"/></svg></a>
      </div>
      <ul className="ar-facts" aria-label={t(L('Project facts', '项目信息'))}>{HERO.chips.map(c => <li key={c.en}>{t(c)}</li>)}</ul>
      <p className="ar-concept">{t(HERO.concept)}</p>
    </div>
  </header>;
}

const GlassesIcon = () => <svg viewBox="0 0 28 16" width="20" height="12" aria-hidden="true"><path d="M2 5.5h24M3 5.5c0 4.6 1.6 7 5.2 7s5-2.6 5-7M15 5.5c0 4.4 1.4 7 5 7s5-2.4 5-7"/></svg>;

function Next({item}) {
  const {t} = useCaseLang();
  return <nav className="ar-next" aria-label={t(UI.nextProject)}>
    <Go to={`${PRODUCT_HOME}/${item.slug}`} className="ar-next-link">
      <span className="ar-next-label">{t(UI.nextProject)}</span>
      <span className="ar-next-title" lang="en">{item.title}</span>
      <span className="ar-next-sub">{item.subtitle || item.summary}</span>
      <span className="ar-next-go" aria-hidden="true"><svg viewBox="0 0 20 20" width="20" height="20"><path d="M4 10h12M11 5l5 5-5 5"/></svg></span>
    </Go>
  </nav>;
}
