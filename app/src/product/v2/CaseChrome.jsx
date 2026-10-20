import {lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {scrollerOf, useMedia} from './motion';
import {UI, useCaseLang} from '../i18n';
import './chrome.css';

export {zoomable} from './zoom';

const LightboxViewer = lazy(() => import('./Lightbox'));
const WIDE = '(min-width: 1200px)';

/* Page chrome every case page shares (site-spec/INTERACTION-PASS.md, "Global"):
   - a reading-progress bar under the site's nav bar;
   - a chapter rail with scrollspy in the left margin on wide screens (ticks; labels show on hover and focus), and a
     compact sticky chapter chip on anything narrower;
   - a lightbox for any figure marked [data-zoom] inside the page.
   chapters: [{id, label, sections?: [{id, label}]}], ids of elements inside `root`. */
export default function CaseChrome({root, chapters, reduced = false}) {
  const items = chapters.flatMap(c => [{id: c.id, label: c.label, level: 0}, ...(c.sections || []).map(s => ({...s, level: 1, chapter: c.label}))]);
  const wide = useMedia(WIDE);
  const bar = useRef(null);
  const [active, setActive] = useState(-1);
  const [shown, setShown] = useState(false);
  const [zoom, setZoom] = useState(null);    // {items, index, keyboard, opener}

  // one scroll handler: the progress bar's scale, which item is current, whether the hero is behind us
  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const scroller = scrollerOf(node);
    const el = id => node.querySelector(`#${CSS.escape(id)}`);
    let frame = 0;
    const measure = () => {
      frame = 0;
      const vh = scroller === window ? innerHeight : scroller.clientHeight;
      const top = scroller === window ? scrollY : scroller.scrollTop;
      const max = (scroller === window ? document.documentElement.scrollHeight : scroller.scrollHeight) - vh;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, top / max)) : 0})`;
      let current = -1;
      items.forEach((item, i) => { const t = el(item.id); if (t && t.getBoundingClientRect().top <= vh * .42) current = i; });
      setActive(current);
      setShown(top > vh * .6);
    };
    const on = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    scroller.addEventListener('scroll', on, {passive: true});
    addEventListener('resize', on);
    const ro = new ResizeObserver(on); ro.observe(node);
    return () => { scroller.removeEventListener('scroll', on); removeEventListener('resize', on); ro.disconnect(); cancelAnimationFrame(frame); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, chapters]);

  const jump = useCallback((id, e) => {
    const target = root.current?.querySelector(`#${CSS.escape(id)}`);
    if (!target) return;
    e?.preventDefault();
    // a pointer click glides; Enter on a focused link (event.detail 0) and reduced motion jump
    target.scrollIntoView({behavior: reduced || e?.detail === 0 ? 'auto' : 'smooth', block: 'start'});
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({preventScroll: true});
  }, [root, reduced]);

  // lightbox: any [data-zoom] inside the page opens it; arrows step through the figures of the same section
  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const open = (trigger, keyboard) => {
      const group = trigger.closest('[data-zoom-group]') || trigger.closest('section') || node;
      const all = [...group.querySelectorAll('[data-zoom]')].filter(t => t.getClientRects().length);
      const list = all.length ? all : [trigger];
      setZoom({items: list.map(toItem), index: Math.max(0, list.indexOf(trigger)), keyboard, opener: trigger});
    };
    const click = e => {
      const t = e.target.closest?.('[data-zoom]');
      if (!t || !node.contains(t) || e.defaultPrevented) return;
      e.preventDefault();
      open(t, e.detail === 0);
    };
    const key = e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const t = e.target.closest?.('[data-zoom]');
      if (!t || t !== e.target || t.tagName === 'BUTTON' || t.tagName === 'A') return;   // real buttons click on their own
      e.preventDefault();
      open(t, true);
    };
    node.addEventListener('click', click);
    node.addEventListener('keydown', key);
    return () => { node.removeEventListener('click', click); node.removeEventListener('keydown', key); };
  }, [root]);

  return <>
    <div className="v2-progress" aria-hidden="true"><i ref={bar}/></div>
    {wide ? <Rail items={items} active={active} shown={shown} jump={jump}/> : <Chip items={items} active={active} shown={shown} jump={jump} reduced={reduced}/>}
    {zoom ? <Suspense fallback={null}><LightboxViewer {...zoom} reduced={reduced} onClose={() => setZoom(null)}/></Suspense> : null}
  </>;
}

/** What the lightbox needs from a trigger: the full-resolution source, a caption, the shape of the image. */
function toItem(t) {
  const img = t.tagName === 'IMG' ? t : t.querySelector('img');
  return {
    src: t.getAttribute('data-zoom') || img?.currentSrc || img?.src,
    alt: t.getAttribute('data-zoom-alt') || img?.alt || t.getAttribute('aria-label')?.replace(/^Enlarge:\s*/, '') || '',
    w: Number(t.getAttribute('data-zoom-w')) || img?.naturalWidth || img?.width || 0,
    h: Number(t.getAttribute('data-zoom-h')) || img?.naturalHeight || img?.height || 0,
  };
}

/** Wide screens: ticks in the left margin, one per chapter and section. Labels slide in on hover or focus. */
function Rail({items, active, shown, jump}) {
  const {t} = useCaseLang();
  return <nav className={`v2-toc${shown ? ' is-shown' : ''}`} aria-label={t(UI.onThisPage)}>
    <ol>
      {items.map((item, i) => <li key={item.id} className={item.level ? 'is-section' : 'is-chapter'}>
        <a href={`#${item.id}`} className={i === active ? 'is-active' : ''} aria-current={i === active ? 'location' : undefined}
          onClick={e => jump(item.id, e)}>
          <span className="v2-toc-tick" aria-hidden="true"/><span className="v2-toc-label">{item.label}</span>
        </a>
      </li>)}
    </ol>
  </nav>;
}

/** Narrower screens: one chip under the nav bar names where you are; it opens the same list. */
function Chip({items, active, shown, jump, reduced}) {
  const {t} = useCaseLang();
  const [open, setOpen] = useState(false);
  const [keyed, setKeyed] = useState(false);
  const wrap = useRef(null), button = useRef(null), list = useRef(null);
  const current = items[active];
  const chapter = current ? (current.level ? current.chapter : current.label) : null;
  useEffect(() => {
    if (!open) return undefined;
    const outside = e => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    const esc = e => { if (e.key === 'Escape') { setOpen(false); button.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', esc); };
  }, [open]);
  useLayoutEffect(() => {
    if (open && keyed) (list.current?.querySelector('[aria-current]') || list.current?.querySelector('a'))?.focus();
  }, [open, keyed]);
  return <div ref={wrap} className={`v2-chip${shown ? ' is-shown' : ''}${open ? ' is-open' : ''}${keyed || reduced ? ' is-instant' : ''}`}>
    <button ref={button} type="button" className="v2-chip-button" aria-expanded={open} aria-controls="v2-chip-list"
      onClick={e => { setKeyed(e.detail === 0); setOpen(o => !o); }}>
      <span className="v2-chip-n">{active >= 0 ? `${items.slice(0, active + 1).filter(i => !i.level).length}/${items.filter(i => !i.level).length}` : t(UI.contents)}</span>
      <span className="v2-chip-label">{chapter || t(UI.onThisPage)}{current?.level ? <span className="v2-chip-sub">{current.label}</span> : null}</span>
      <svg className="v2-chip-caret" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 4.5 6 7.5l3-3"/></svg>
    </button>
    <div id="v2-chip-list" className="v2-chip-pop" hidden={!open}>
      <ol ref={list}>
        {items.map((item, i) => <li key={item.id} className={item.level ? 'is-section' : 'is-chapter'}>
          <a href={`#${item.id}`} aria-current={i === active ? 'location' : undefined}
            onClick={e => { setOpen(false); jump(item.id, e); }}>{item.label}</a>
        </li>)}
      </ol>
    </div>
  </div>;
}
