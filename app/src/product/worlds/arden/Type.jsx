import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {useCaseLang} from '../../i18n';
import {scrollerOf, scrollRootOf} from '../../v2/motion';

/* The living type (site-spec/WORLD-ARDEN-V4.md §1). Copy can carry two marks: *words* get the titanium gradient
   (one or two per chapter), and [57] or [4.6] is a number that counts up when it comes into view. strip() gives the
   plain text for labels, the plain page and screen readers.
   - Statement: a chapter's opening line, pinned for about 60vh while its words go from 18% to full in reading order.
   - Words: a secondary heading whose words rise 10px and unblur, 35ms apart, once, as it comes in.
   - Rich: a line with the marks, nothing else moving.
   Reduced motion: everything static and fully visible. */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const strip = s => String(s ?? '').replace(/\*([^*]+)\*/g, '$1').replace(/\[([\d.,]+)\]/g, '$1');

/** The marks in a string, as runs: {text, em?, num?}. */
function runs(s) {
  const out = [], re = /\*([^*]+)\*|\[([\d.,]+)\]/g;
  let i = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > i) out.push({text: s.slice(i, m.index)});
    // an emphasis can hold a number: *[57] grams*
    if (m[1] != null) out.push(...runs(m[1]).map(r => ({...r, em: true})));
    else out.push({text: m[2], num: true});
    i = re.lastIndex;
  }
  if (i < s.length) out.push({text: s.slice(i)});
  return out;
}

const CJK_STOP = /^[，。、；：！？）」』”’·]$/;
/** Words, each a list of parts (so "titanium," keeps its comma); in Chinese every character is a word and
    punctuation stays with the one before it. */
export function tokens(s, zh) {
  const words = [];
  let cur = null, gap = false;
  // each word remembers whether a space came before it, so "AI 眼镜" keeps its space in Chinese too
  const push = () => { if (cur?.length) { cur.sp = gap; words.push(cur); gap = false; } cur = null; };
  for (const r of runs(String(s ?? ''))) {
    const pieces = r.num ? [r.text] : zh ? (r.text.match(/[A-Za-z0-9.,%°×□+\-–]+|\s+|\S/gu) || []) : r.text.split(/(\s+)/).filter(Boolean);
    for (const p of pieces) {
      if (/^\s+$/.test(p)) { push(); gap = true; continue; }
      if (zh && !r.num && cur && !CJK_STOP.test(p) && !/^[A-Za-z0-9]/.test(p)) push();
      (cur ||= []).push({text: p, em: !!r.em, num: !!r.num});
    }
  }
  push();
  return words;
}

function Parts({parts, reduced}) {
  return parts.map((p, j) => (p.num ? <Count key={j} value={p.text} reduced={reduced}/>
    : p.em ? <span key={j} className="ar-em">{p.text}</span> : <span key={j}>{p.text}</span>));
}

/** A number that counts up from zero, with tabular figures, the first time it comes into view. */
export function Count({value, reduced}) {
  const ref = useRef(null);
  const target = parseFloat(String(value).replace(/,/g, ''));
  const decimals = (String(value).split('.')[1] || '').length;
  const fmt = v => (String(value).includes(',') ? v.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals}) : v.toFixed(decimals));
  const [shown, setShown] = useState(String(value));
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced || el.closest('.is-reduced') || !Number.isFinite(target) || typeof IntersectionObserver !== 'function') return undefined;
    // only numbers not yet seen count; one already on screen stays as it is
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * .9) return undefined;
    setShown(fmt(0));
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 600;      // done before anyone could read a value on the way
      const step = now => {
        const u = clamp((now - t0) / dur), k = 1 - (1 - u) ** 3;
        setShown(fmt(target * k));
        if (u < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, {root: scrollRootOf(el), rootMargin: '0px'});   // as soon as any of it shows: it never sits on screen at zero
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced]);
  return <span ref={ref} className="ar-count"><span className="ar-sr">{String(value)}</span><span aria-hidden="true">{shown}</span></span>;
}

/** A line with the marks (gradient words and counting numbers), otherwise still. */
export function Rich({text, reduced}) {
  const {t, zh} = useCaseLang();
  const words = tokens(t(text), zh);
  return words.map((parts, i) => <span key={i}>{i && parts.sp ? ' ' : ''}<Parts parts={parts} reduced={reduced}/></span>);
}

/** Once in view (a little past the fold), true; reduced motion: true at once. */
function useSeen(ref, reduced, margin = '0px 0px -10% 0px') {
  const [seen, setSeen] = useState(!!reduced);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return undefined;
    if (reduced || el.closest('.is-reduced') || typeof IntersectionObserver !== 'function') { setSeen(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, {root: scrollRootOf(el), rootMargin: margin});
    io.observe(el);
    return () => io.disconnect();
  }, [ref, reduced, seen, margin]);
  return seen;
}

/** A secondary heading whose words rise and unblur into place, once. */
export function Words({as: Tag = 'h3', text, className = '', id, reduced, ...rest}) {
  const {t, zh} = useCaseLang();
  const ref = useRef(null);
  const seen = useSeen(ref, reduced);
  const words = tokens(t(text), zh);
  return <Tag ref={ref} id={id} className={`${className} ar-rw${seen ? ' is-in' : ''}`} tabIndex={id ? -1 : undefined} {...rest}>
    <span className="ar-sr">{strip(t(text))}</span>
    <span aria-hidden="true">{words.map((parts, i) => <span key={i}>{i && parts.sp ? ' ' : ''}<span className="ar-rw-w" style={{'--i': i}}><Parts parts={parts} reduced={reduced}/></span></span>)}</span>
  </Tag>;
}

/** A chapter's opening statement: pinned for about 60vh while its words fill in, in reading order, with the scroll.
    `label` sits above it in small caps; `lede`, one plain sentence, fades in under it as the last words land. */
export function Statement({id, label, text, lede, reduced, center = false}) {
  const {t, zh} = useCaseLang();
  const run = useRef(null), pin = useRef(null), line = useRef(null);
  const words = tokens(t(text), zh);
  useLayoutEffect(() => {
    const node = run.current, st = pin.current, h = line.current;
    if (!node || !st || !h) return undefined;
    if (reduced) { st.style.setProperty('--p', '1'); return undefined; }
    const sc = scrollerOf(node);
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = sc === window ? innerHeight : sc.clientHeight;
      const top = parseFloat(getComputedStyle(st).top) || 0, r = node.getBoundingClientRect();
      // starts while the line is still rising into place, done as the pin lets go
      const p = clamp((top + vh * .45 - r.top) / Math.max(1, r.height - st.offsetHeight + vh * .45));
      st.style.setProperty('--p', p.toFixed(4));
      h.toggleAttribute('data-done', p > .985);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    sc.addEventListener('scroll', on, {passive: true});
    addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); sc.removeEventListener('scroll', on); removeEventListener('resize', on); };
  }, [reduced, words.length]);
  return <div className={`ar-say${reduced ? ' is-still' : ''}${center ? ' is-center' : ''}`}>
    <div ref={run} className="ar-say-run">
      <div ref={pin} className="ar-say-pin">
        {label ? <p className="ar-label">{t(label)}</p> : null}
        <h2 ref={line} id={id} className="ar-say-h" tabIndex={-1} style={{'--n': words.length}}>
          <span className="ar-sr">{strip(t(text))}</span>
          <span aria-hidden="true">{words.map((parts, i) => <span key={i}>{i && parts.sp ? ' ' : ''}<span className="ar-say-w" style={{'--i': i}}><Parts parts={parts} reduced={reduced}/></span></span>)}</span>
        </h2>
        {lede ? <p className="ar-lede ar-say-lede">{typeof lede === 'object' && 'en' in lede ? <Rich text={lede} reduced={reduced}/> : lede}</p> : null}
      </div>
      <div className="ar-say-space" aria-hidden="true"/>
    </div>
  </div>;
}

/** The words of a line that fills with a parent's --p (see Statement), for lines that live inside another pinned
    stage, like the day's "Put them on." `offset` continues the reading order from an earlier line. */
export function Fill({text, offset = 0, reduced}) {
  const {t, zh} = useCaseLang();
  const words = tokens(t(text), zh);
  return <>
    <span className="ar-sr">{strip(t(text))}</span>
    <span aria-hidden="true">{words.map((parts, i) => <span key={i}>{i && parts.sp ? ' ' : ''}<span className="ar-say-w" style={{'--i': offset + i}}><Parts parts={parts} reduced={reduced}/></span></span>)}</span>
  </>;
}
