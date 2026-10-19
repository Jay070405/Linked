import {lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {scrollerOf, useMedia} from '../../v2/motion';
import '../../v2/chrome.css';   // the shared figure viewer's styles (only its .v2-lb rules are used here)

const Lightbox = lazy(() => import('../../v2/Lightbox'));
const WIDE = '(min-width: 1200px)';

/* The receipt's page chrome (adapted from v2/CaseChrome.jsx): how much tape has been fed (a 2 px line under the nav
   bar), an index of the receipt's sections, and the shared figure viewer for any [data-zoom] on the page.
   Wide screens: the index sits in the left margin as a column of perforation ticks; its labels show on hover and
   focus. Narrower screens: one tab under the nav bar names the current section and opens the same list. */
export default function Chrome({root, chapters, still = false, plain = false}) {
  const wide = useMedia(WIDE);
  const bar = useRef(null);
  const [active, setActive] = useState(-1);
  const [shown, setShown] = useState(false);
  const [zoom, setZoom] = useState(null);

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
      chapters.forEach((c, i) => { const t = el(c.id); if (t && t.getBoundingClientRect().top <= vh * .42) current = i; });
      setActive(current);
      setShown(top > vh * .6);
    };
    const on = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    scroller.addEventListener('scroll', on, {passive: true});
    addEventListener('resize', on);
    const ro = new ResizeObserver(on); ro.observe(node);
    return () => { scroller.removeEventListener('scroll', on); removeEventListener('resize', on); ro.disconnect(); cancelAnimationFrame(frame); };
  }, [root, chapters, plain]);

  const jump = useCallback((id, e) => {
    const target = root.current?.querySelector(`#${CSS.escape(id)}`);
    if (!target) return;
    e?.preventDefault();
    target.scrollIntoView({behavior: still || e?.detail === 0 ? 'auto' : 'smooth', block: 'start'});
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({preventScroll: true});
  }, [root, still]);

  // figure viewer: any [data-zoom] inside the page; arrows step through the figures of the same section
  useEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const toItem = t => {
      const img = t.tagName === 'IMG' ? t : t.querySelector('img');
      return {src: t.getAttribute('data-zoom') || img?.currentSrc || img?.src, alt: t.getAttribute('data-zoom-alt') || img?.alt || '',
        w: Number(t.getAttribute('data-zoom-w')) || img?.naturalWidth || 0, h: Number(t.getAttribute('data-zoom-h')) || img?.naturalHeight || 0};
    };
    const open = (trigger, keyboard) => {
      const group = trigger.closest('[data-zoom-group]') || trigger.closest('section') || node;
      const list = [...group.querySelectorAll('[data-zoom]')].filter(t => t.getClientRects().length);
      setZoom({items: (list.length ? list : [trigger]).map(toItem), index: Math.max(0, list.indexOf(trigger)), keyboard, opener: trigger});
    };
    const click = e => {
      const t = e.target.closest?.('[data-zoom]');
      if (!t || !node.contains(t) || e.defaultPrevented) return;
      e.preventDefault(); open(t, e.detail === 0);
    };
    const key = e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const t = e.target.closest?.('[data-zoom]');
      if (!t || t !== e.target || t.tagName === 'BUTTON' || t.tagName === 'A') return;
      e.preventDefault(); open(t, true);
    };
    node.addEventListener('click', click);
    node.addEventListener('keydown', key);
    return () => { node.removeEventListener('click', click); node.removeEventListener('keydown', key); };
  }, [root]);

  return <>
    <div className="cnr-progress" aria-hidden="true"><i ref={bar}/></div>
    {wide ? <Index chapters={chapters} active={active} shown={shown} jump={jump}/> : <Tab chapters={chapters} active={active} shown={shown} jump={jump} still={still}/>}
    {zoom ? <Suspense fallback={null}><Lightbox {...zoom} reduced={still} onClose={() => setZoom(null)}/></Suspense> : null}
  </>;
}

function Index({chapters, active, shown, jump}) {
  return <nav className={`cnr-index${shown ? ' is-shown' : ''}`} aria-label="On this receipt">
    <ol>{chapters.map((c, i) => <li key={c.id}>
      <a href={`#${c.id}`} className={i === active ? 'is-active' : ''} aria-current={i === active ? 'location' : undefined} onClick={e => jump(c.id, e)}>
        <span className="cnr-index-tick" aria-hidden="true"/><span className="cnr-index-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><span className="cnr-index-label">{c.label}</span>
      </a>
    </li>)}</ol>
  </nav>;
}

function Tab({chapters, active, shown, jump, still}) {
  const [open, setOpen] = useState(false);
  const [keyed, setKeyed] = useState(false);
  const wrap = useRef(null), button = useRef(null), list = useRef(null);
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
  const current = chapters[active];
  return <div ref={wrap} className={`cnr-tab${shown ? ' is-shown' : ''}${open ? ' is-open' : ''}${keyed || still ? ' is-instant' : ''}`}>
    <button ref={button} type="button" className="cnr-tab-button" aria-expanded={open} aria-controls="cnr-tab-list"
      onClick={e => { setKeyed(e.detail === 0); setOpen(o => !o); }}>
      <span className="cnr-tab-n">{active >= 0 ? `${active + 1}/${chapters.length}` : 'Index'}</span>
      <span className="cnr-tab-label">{current ? current.label : 'On this receipt'}</span>
      <svg className="cnr-tab-caret" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 4.5 6 7.5l3-3"/></svg>
    </button>
    <div id="cnr-tab-list" className="cnr-tab-pop" hidden={!open}>
      <ol ref={list}>{chapters.map((c, i) => <li key={c.id}>
        <a href={`#${c.id}`} aria-current={i === active ? 'location' : undefined} onClick={e => { setOpen(false); jump(c.id, e); }}>
          <span className="cnr-index-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{c.label}</a>
      </li>)}</ol>
    </div>
  </div>;
}
