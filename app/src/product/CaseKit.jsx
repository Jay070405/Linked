import {Children, useEffect, useRef} from 'react';
import {EVIDENCE, EVIDENCE_MEANING} from './content';

/* The case-study kit. The body text makes the argument; the right margin carries the evidence.
   Every component renders real text in reading order, so the page reads correctly without the layout script,
   on a phone and in a screen reader. Only <Annotated> measures anything. */

const known = label => EVIDENCE.find(e => e.toLowerCase() === String(label).trim().toLowerCase());

/** Small pill naming how a claim is known. Sentence case. */
export function Ev({label}) {
  const ev = known(label);
  if (!ev) {
    if (import.meta.env.DEV) throw new Error(`Unknown evidence label "${label}". Use one of: ${EVIDENCE.join(', ')}`);
    return <span className="pp-ev">{label}</span>;
  }
  return <span className={`pp-ev pp-ev--${ev.toLowerCase()}`}>{ev}</span>;
}

/** Key to the labels a case uses, with the meaning narrowed to that case where it helps. */
export function Legend({labels = EVIDENCE, meanings = {}}) {
  return <aside className="pp-legend" aria-labelledby="pp-legend-title">
    <p id="pp-legend-title" className="pp-legend-title">How claims are labeled</p>
    <dl>{labels.map(label => <div key={label}><dt><Ev label={label}/></dt><dd>{meanings[label] || EVIDENCE_MEANING[label]}</dd></div>)}</dl>
  </aside>;
}

/** Marks the sentence a note supports, so hovering the note highlights exactly that sentence. */
export const C = ({id, children}) => <span className="pp-claim" data-claim={id}>{children}</span>;

/** A margin note. Put it inside <Noted> after the block it supports. */
export function Note({label, source, claim, children}) {
  return <div className="pp-note" role="note" tabIndex={0} data-note="" data-claim-for={claim || undefined}>
    {label ? <Ev label={label}/> : null}
    <div className="pp-note-text">{children}</div>
    {source ? <p className="pp-note-source">Source: {source}</p> : null}
  </div>;
}

/** A paragraph (or list, or table) and the notes that support it. Desktop: the notes hang in the margin. */
export function Noted({children}) {
  const [anchor, ...notes] = Children.toArray(children);
  return <div className="pp-note-group" data-note-group="">
    {anchor}
    <div className="pp-note-stack" data-note-stack="">{notes}</div>
  </div>;
}

/** Visible marker for content Jay still has to write or supply. */
export const Todo = ({children, inline = false}) => inline
  ? <span className="pp-todo pp-todo--inline"><b>TODO</b> {children}</span>
  : <p className="pp-todo"><b>TODO</b> {children}</p>;

/** Project summary. Outcome in the reading column; facts line up with the margin notes. */
export function TLDR({outcome, facts = [], table}) {
  // Role reads with the outcome (what I did, what came of it); the shorter facts sit in the margin column.
  const role = facts.find(([k]) => k === 'Role')?.[1];
  const rest = facts.filter(([k, v]) => k !== 'Role' && v);
  return <section className={`pp-tldr${table ? ' pp-tldr--table' : ''}`} aria-label="Project summary" data-wide="">
    <div className="pp-tldr-outcome"><p className="pp-tldr-label">Outcome</p><div className="pp-tldr-outcome-text">{outcome}</div>
      {role ? <dl className="pp-tldr-role"><dt className="pp-tldr-label">Role</dt><dd>{role}</dd></dl> : null}</div>
    {table
      ? <div className="pp-tldr-table" role="region" aria-label="The three settings compared" tabIndex={0}><table>
          <thead><tr><td/>{table.cols.map(col => <th key={col} scope="col">{col}</th>)}</tr></thead>
          <tbody>{table.rows.map(([key, ...cells]) => <tr key={key}><th scope="row">{key}</th>{cells.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody>
        </table></div>
      : <dl className="pp-tldr-facts">{rest.map(([k, v]) => <div key={k}><dt className="pp-tldr-label">{k}</dt><dd>{v}</dd></div>)}</dl>}
  </section>;
}

function Caption({label, children}) {
  if (!label && !children) return null;
  return <figcaption>{label ? <Ev label={label}/> : null}{children ? <span>{children}</span> : null}</figcaption>;
}

/** An image figure. Width and height are required so the page never jumps as images load. */
export function Figure({src, alt, width, height, caption, label, wide = false, priority = false}) {
  return <figure className="pp-figure" data-wide={wide ? '' : undefined}>
    <div className="pp-figure-media"><img src={src} alt={alt} width={width} height={height} loading={priority ? 'eager' : 'lazy'} decoding="async"/></div>
    <Caption label={label}>{caption}</Caption>
  </figure>;
}

/** A figure that is still to come. The dashed frame says what belongs there. */
export function FigureSlot({ratio = '16 / 9', what, caption, label, wide = false}) {
  return <figure className="pp-figure pp-figure--slot" data-wide={wide ? '' : undefined}>
    <div className="pp-slot" style={{aspectRatio: ratio}}><p><b>TODO</b> {what}</p></div>
    <Caption label={label}>{caption}</Caption>
  </figure>;
}

/** An inline SVG drawing (a chart, a diagram, an imported .svg?raw string). Uses the page's colors. */
export function Chart({title, svg, children, caption, label, wide = false}) {
  return <figure className="pp-figure pp-figure--chart" data-wide={wide ? '' : undefined}>
    {svg
      ? <div className="pp-figure-media pp-svg" role="img" aria-label={title} dangerouslySetInnerHTML={{__html: svg}}/>
      : <div className="pp-figure-media pp-svg" role="img" aria-label={title}>{children}</div>}
    <Caption label={label}>{caption}</Caption>
  </figure>;
}

/** An HTML diagram (real text, so no role="img"). */
export const Diagram = ({children, caption, label, wide = false}) => <figure className="pp-figure pp-figure--diagram" data-wide={wide ? '' : undefined}>
  {children}
  <Caption label={label}>{caption}</Caption>
</figure>;

/** Small stat. Use sparingly; consecutive Metrics sit side by side. */
export const Metric = ({value, label, evidence}) => <div className="pp-metric">
  <span className="pp-metric-value">{value}</span>
  <span className="pp-metric-label">{label}</span>
  {evidence ? <Ev label={evidence}/> : null}
</div>;
export const Metrics = ({children}) => <div className="pp-metrics">{children}</div>;

/** A table of numbers or options. `chosen` is the 1-based option column that was picked. */
export function Table({head, rows, caption, label, chosen, numeric = false, wide = false, name}) {
  return <figure className={`pp-table${numeric ? ' is-numeric' : ''}`} data-chosen={chosen || undefined} data-wide={wide ? '' : undefined}>
    <div className="pp-table-scroll" tabIndex={0} role="region" aria-label={name || 'Table'}>
      <table style={{minWidth: head.length > 3 ? 600 : undefined}}>
        <thead><tr>{head.map((cell, i) => <th key={i} scope="col">{cell}{chosen && i === chosen ? <span className="pp-chosen">Chosen</span> : null}</th>)}</tr></thead>
        <tbody>{rows.map((row, r) => <tr key={r}>{row.map((cell, i) => i === 0 ? <th key={i} scope="row">{cell}</th> : <td key={i}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
    <Caption label={label}>{caption}</Caption>
  </figure>;
}

/** Rare: a boxed aside every reader must see (status, scope, caveats). */
export const Callout = ({title, children}) => <aside className="pp-callout">
  {title ? <p className="pp-callout-title">{title}</p> : null}
  <div className="pp-callout-body">{children}</div>
</aside>;

/* ---------- Margin-note layout ---------- */

const DESKTOP = '(min-width: 960px)';
const STACK_GAP = 20;
const CORNER = 6;

/** The client rect of the last visible character inside an element. */
function lastTextEnd(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let last = null;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.data.trim() && !n.parentElement.closest('[data-note-stack]')) last = n;
  if (!last) return null;
  let end = last.data.length;
  while (end > 0 && /\s/.test(last.data[end - 1])) end--;
  const range = document.createRange();
  range.setStart(last, end - 1); range.setEnd(last, end);
  const rects = range.getClientRects();
  return rects.length ? rects[rects.length - 1] : null;
}

/** Viewport y the leader should reach: the label pill's middle, else the note's first line. */
function markY(note) {
  const pill = note.querySelector('.pp-ev');
  if (pill) { const r = pill.getBoundingClientRect(); return (r.top + r.bottom) / 2; }
  return note.getBoundingClientRect().top + 10;
}

function leaderPath(sx, sy, gx, nx, ny) {
  if (Math.abs(ny - sy) < 2) return `M${sx} ${sy} H${nx}`;
  const dir = ny > sy ? 1 : -1, r = Math.min(CORNER, Math.abs(ny - sy) / 2);
  return `M${sx} ${sy} H${gx - r} Q${gx} ${sy} ${gx} ${sy + dir * r} V${ny - dir * r} Q${gx} ${ny} ${gx + r} ${ny} H${nx}`;
}

/**
 * The reading column. On wide screens it lines each note stack up with the end of the block it supports,
 * keeps stacks from overlapping (and out of the way of wide figures), and draws a redline leader from the
 * end of the claim to each note, once, as the note scrolls into view. Hovering or focusing a note marks its claim.
 * Below 960px it undoes all of that and notes are ordinary blocks under their paragraph.
 */
export function Annotated({children, reduced = false, sans = false}) {
  const rootRef = useRef(null), svgRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current, svg = svgRef.current;
    if (!root || !svg) return undefined;
    const notes = [...root.querySelectorAll('[data-note-stack] [data-note]')];
    if (!notes.length) return undefined;
    const desktop = matchMedia(DESKTOP);
    const still = reduced || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const drawn = new Set();
    const anchorOf = new Map();
    notes.forEach((note, i) => {
      note.dataset.noteId = String(i);
      const anchor = note.closest('[data-note-group]')?.firstElementChild;
      if (anchor && !anchor.hasAttribute('data-note-stack')) anchorOf.set(note, anchor);
      if (still) drawn.add(String(i));
    });

    const layout = () => {
      const stacks = [...root.querySelectorAll('[data-note-stack]')];
      const wides = [...root.querySelectorAll('[data-wide]')];
      if (!desktop.matches) {
        stacks.forEach(s => { s.style.transform = ''; delete s.dataset.shift; });
        wides.forEach(w => { w.style.removeProperty('--pp-extra'); delete w.dataset.extra; });
        root.style.removeProperty('--pp-extra-bottom'); delete root.dataset.extraBottom;
        svg.replaceChildren();
        return;
      }
      const origin = root.getBoundingClientRect();
      const items = [...root.querySelectorAll('[data-note-stack], [data-wide]')];
      const leaders = [];
      let cursor = -Infinity;
      for (const el of items) {
        if (el.hasAttribute('data-wide')) {
          // A wide block crosses the margin: give the notes above it room.
          const extra = Number(el.dataset.extra || 0);
          const naturalTop = el.getBoundingClientRect().top - origin.top - extra;
          const need = Math.max(0, Math.ceil(cursor + STACK_GAP * 2 - naturalTop));
          if (need !== extra) { el.style.setProperty('--pp-extra', `${need}px`); el.dataset.extra = String(need); }
          cursor = Math.max(cursor, el.getBoundingClientRect().bottom - origin.top);
          continue;
        }
        const stack = el, stackNotes = [...stack.querySelectorAll('[data-note]')];
        if (!stackNotes.length) continue;
        const shift = Number(stack.dataset.shift || 0);
        const rect = stack.getBoundingClientRect();
        const naturalTop = rect.top - origin.top - shift;
        const marks = stackNotes.map(n => markY(n) - rect.top);
        const anchor = anchorOf.get(stackNotes[0]);
        const end = anchor ? lastTextEnd(anchor) : null;
        const endY = end ? (end.top + end.bottom) / 2 - origin.top : null;
        let top = endY === null ? naturalTop : endY - marks[0];
        top = Math.max(top, cursor + STACK_GAP);
        const nextShift = Math.round(top - naturalTop);
        if (nextShift !== shift) { stack.style.transform = nextShift ? `translateY(${nextShift}px)` : ''; stack.dataset.shift = String(nextShift); }
        const placedTop = naturalTop + nextShift;
        cursor = placedTop + rect.height;
        if (!end || endY === null) continue;
        const noteLeft = rect.left - origin.left;
        const gx = Math.round((origin.width + noteLeft) / 2);
        const nx = noteLeft - 8;
        const sx = Math.min(end.right - origin.left + 6, gx - CORNER - 4);
        stackNotes.forEach((note, i) => {
          const id = note.dataset.noteId, ny = marks[i] + placedTop, sy = Math.abs(ny - endY) < 2 ? ny : endY;
          leaders.push(`<g class="pp-leader${drawn.has(id) ? ' is-drawn' : ''}" data-for="${id}"><path class="pp-leader-line" pathLength="1" d="${leaderPath(sx, sy, gx, nx, ny)}"/><circle class="pp-leader-dot" cx="${sx}" cy="${sy}" r="2.5"/></g>`);
        });
      }
      // Room at the bottom if the last notes hang below the text.
      const extraBottom = Number(root.dataset.extraBottom || 0);
      const height = root.getBoundingClientRect().height - extraBottom;
      const needBottom = Math.max(0, Math.ceil(cursor + STACK_GAP - height));
      if (needBottom !== extraBottom) { root.style.setProperty('--pp-extra-bottom', `${needBottom}px`); root.dataset.extraBottom = String(needBottom); }
      svg.innerHTML = leaders.join('');
    };

    let frame = 0;
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(layout); };

    // Each leader draws once, when its note is in view.
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        const enough = e.intersectionRatio > .99 || e.intersectionRect.height > (e.rootBounds?.height ?? innerHeight) * .5;
        if (!e.isIntersecting || !enough) continue;
        e.target.querySelectorAll('[data-note]').forEach(n => {
          drawn.add(n.dataset.noteId);
          svg.querySelector(`[data-for="${n.dataset.noteId}"]`)?.classList.add('is-drawn');
        });
        io.unobserve(e.target);
      }
    }, {rootMargin: '0px 0px -12% 0px', threshold: [.25, .5, 1]});
    if (!still) root.querySelectorAll('[data-note-stack]').forEach(s => io.observe(s));

    // Hover or focus a note: mark its claim (the <C> it names, else the whole block) and thicken its leader.
    const setActive = (note, on) => {
      svg.querySelector(`[data-for="${note.dataset.noteId}"]`)?.classList.toggle('is-active', on);
      const anchor = anchorOf.get(note);
      if (!anchor) return;
      const claim = note.dataset.claimFor ? anchor.querySelector(`[data-claim="${note.dataset.claimFor}"]`) : null;
      (claim || anchor).classList.toggle('is-noted', on);
    };
    const offs = notes.map(note => {
      const on = () => setActive(note, true);
      const off = () => { if (document.activeElement !== note) setActive(note, false); };
      const blur = () => setActive(note, false);
      note.addEventListener('pointerenter', on); note.addEventListener('pointerleave', off);
      note.addEventListener('focus', on); note.addEventListener('blur', blur);
      return () => { note.removeEventListener('pointerenter', on); note.removeEventListener('pointerleave', off); note.removeEventListener('focus', on); note.removeEventListener('blur', blur); };
    });

    const ro = new ResizeObserver(schedule);
    ro.observe(root);
    desktop.addEventListener('change', schedule);
    document.fonts?.ready.then(schedule);
    root.querySelectorAll('img').forEach(img => { if (!img.complete) img.addEventListener('load', schedule, {once: true}); });
    layout();
    return () => {
      cancelAnimationFrame(frame); ro.disconnect(); io.disconnect();
      desktop.removeEventListener('change', schedule);
      offs.forEach(off => off());
    };
  }, [reduced]);

  return <div ref={rootRef} className={`pp-prose${sans ? ' pp-prose--sans' : ''}`} data-annotated="">
    {children}
    <svg ref={svgRef} className="pp-leaders" aria-hidden="true" focusable="false"/>
  </div>;
}
