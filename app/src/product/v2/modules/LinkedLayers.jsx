import {useRef, useState} from 'react';
import {kindsOf, L0, L2, LayerIcon, SHOWN} from '../../figures';
import {Ask, Takeaway, useInputMode} from '../Try';
import './layers.css';

/* D1, "Same picture, different structure": the sign-in screen's first 14 layers in the L2 and the L0 file, linked.
   Pointing at a layer in either panel (or arrowing through one) lights its counterpart in the other panel and outlines
   its box on the screen's Figma export. Boxes: absolute positions inside the 390 x 844 frame, from the Figma MCP
   server's get_metadata on S1-L2 (node 6:62) and S1-L0 (node 10:2195), 19 Oct 2026. */

const B = (x, y, w, h) => ({x, y, w, h});
const SHARED = [B(0, 0, 390, 844), B(24, 32, 342, 542), B(24, 32, 99, 32), B(24, 32, 32, 32), B(36, 38, 8, 20), B(64, 35, 59, 26),
  B(24, 96, 342, 84), B(24, 96, 342, 36), B(24, 140, 342, 40), B(24, 212, 342, 200)];
const BOXES = {
  L2: [...SHARED, B(24, 212, 342, 74), B(24, 302, 342, 74), B(24, 392, 342, 20), B(24, 392, 124, 20)],
  L0: [...SHARED, B(24, 212, 342, 74), B(24, 212, 37, 20), B(24, 240, 342, 46), B(24, 302, 342, 74)],
};
// Counterparts. The L2 fields are instances (not expanded); in L0 the same field is a frame with a label and a box.
// Form options and Remember me sit in L0's Frame 10 and Frame 11, below the 14 rows shown.
const PAIR = {
  L2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, {below: 'Frame 10'}, {below: 'Frame 11'}],
  L0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 11],
};
const PANELS = [
  {id: 'L2', tree: L2, page: 'L2 Systematized', label: 'The first 14 layers of the sign-in screen in the L2 file'},
  {id: 'L0', tree: L0, page: 'L0 Raw', label: 'The first 14 layers of the sign-in screen in the L0 file'},
];
const other = id => (id === 'L2' ? 'L0' : 'L2');
const TYPE = {FRAME: 'frame', TEXT: 'text layer', INSTANCE: 'component instance'};

export default function LinkedLayers({reduced = false}) {
  const [hot, setHot] = useState(null);     // {panel, i}
  const [seen, setSeen] = useState(false);
  const mode = useInputMode();
  const root = useRef(null);
  const set = v => { setHot(v); if (v) setSeen(true); };
  const pair = hot ? PAIR[hot.panel][hot.i] : null;
  const twin = hot && typeof pair === 'number' ? {panel: other(hot.panel), i: pair} : null;
  const box = hot ? BOXES[hot.panel][hot.i] : null;
  const row = (panel, i) => PANELS.find(p => p.id === panel).tree[i];
  const name = (panel, i) => row(panel, i)[1];

  const key = (e, panel, i) => {
    const step = {ArrowDown: 1, ArrowUp: -1}[e.key];
    let next = null;
    if (step) next = Math.min(SHOWN - 1, Math.max(0, i + step));
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = SHOWN - 1;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      // jump to the counterpart in the other panel
      const p = PAIR[panel][i];
      if (typeof p === 'number') { e.preventDefault(); root.current?.querySelector(`[data-row="${other(panel)}-${p}"]`)?.focus(); }
      return;
    } else if (e.key === 'Escape') { set(null); return; }
    if (next == null) return;
    e.preventDefault();
    root.current?.querySelector(`[data-row="${panel}-${next}"]`)?.focus();
  };

  // one sentence for what's lit: the pair, and what each file says about it
  const describe = () => {
    if (!hot) return 'Point at a layer to compare it with its twin.';
    const [, n, type, , fields] = row(hot.panel, hot.i);
    const mine = `${hot.panel} “${n}”, a ${TYPE[type] || type.toLowerCase()}${fields.length ? `, ${kindsOf(fields).join(' and ')} bound` : ', nothing bound'}`;
    if (!twin) return `${mine}. Its L0 twin, ${pair.below}, sits below these 14 rows.`;
    const [, tn, ttype, , tf] = row(twin.panel, twin.i);
    const theirs = `${twin.panel} “${tn}”, a ${TYPE[ttype] || ttype.toLowerCase()}${tf.length ? `, ${kindsOf(tf).join(' and ')} bound` : ', nothing bound'}`;
    return `${mine}. ${theirs}.`;
  };

  return <figure ref={root} className="ll" {...mode.bind} onPointerLeave={e => { if (e.pointerType === 'mouse') set(null); }}>
    <Ask>Pick a layer in either panel.</Ask>
    <div className="ll-stage pp-stage">
      {PANELS.map(p => <section key={p.id} className={`pp-layers-panel ll-panel is-${p.id}`} aria-label={p.label}>
        <header><span>Layers</span><span className="pp-layers-page">{p.page}</span></header>
        <ol>
          {p.tree.slice(0, SHOWN).map(([depth, n, type, layout, fields], i) => {
            const open = (p.tree[i + 1]?.[0] ?? -1) > depth;
            const isHot = hot?.panel === p.id && hot.i === i, isTwin = twin?.panel === p.id && twin.i === i;
            const focusIndex = hot?.panel === p.id ? hot.i : 0;
            return <li key={i} data-row={`${p.id}-${i}`} style={{'--depth': depth}}
              className={`${type === 'INSTANCE' ? 'is-instance' : ''}${isHot ? ' is-hot' : ''}${isTwin ? ' is-twin' : ''}`}
              tabIndex={i === focusIndex ? 0 : -1} aria-label={`${n}, ${TYPE[type] || type}${fields.length ? `, ${kindsOf(fields).join(' and ')} bound to variables` : ''}`}
              onPointerEnter={e => { if (e.pointerType === 'mouse') set({panel: p.id, i}); }}
              onClick={() => set({panel: p.id, i})} onFocus={() => set({panel: p.id, i})} onKeyDown={e => key(e, p.id, i)}>
              <span className="pp-layer-caret" aria-hidden="true">{open ? <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 2.5 4 5.2l2.5-2.7"/></svg> : null}</span>
              <LayerIcon type={type} layout={layout}/>
              <span className="pp-layer-name">{n}</span>
              <span className="pp-layer-vars">{kindsOf(fields).map(k => <span key={k} className="pp-var-chip"><svg width="9" height="10" viewBox="0 0 9 10" aria-hidden="true"><path d="M4.5.8 8.2 2.9v4.2L4.5 9.2.8 7.1V2.9Z"/></svg>{k}</span>)}</span>
            </li>;
          })}
        </ol>
      </section>)}
      <div className="ll-shot">
        <div className="ll-screen">
          <img src="/assets/product/ready-for-agents/s1-reference.webp" width="390" height="844" alt="The sign-in screen as Figma exports it, identical for L2 and L0" decoding="async"/>
          <svg viewBox="0 0 390 844" aria-hidden="true">
            {box ? <g key={reduced || mode.keyed.current ? 'still' : `${hot.panel}-${hot.i}`} className="ll-box" data-still={reduced || mode.keyed.current ? '' : undefined}>
              <rect x={box.x} y={box.y} width={box.w} height={box.h}/>
            </g> : null}
          </svg>
          {box ? <span className={`ll-tag${box.y < 30 ? ' is-inside' : ''}`} style={{left: `${box.x / 390 * 100}%`, top: `${box.y / 844 * 100}%`}} aria-hidden="true">{name(hot.panel, hot.i)}{twin ? <span className="ll-tag-twin"> = {name(twin.panel, twin.i)}</span> : null}</span> : null}
        </div>
        <p className="ll-status" aria-live="polite">{describe()}</p>
      </div>
    </div>
    <Takeaway show={seen} instant={reduced || mode.keyed.current}>Same pixels, same box. Only one file says what the box is.</Takeaway>
    <figcaption className="v2-caption"><span>Read from the benchmark file with Figma’s MCP server: names, types, variable bindings and positions; instances aren’t expanded. From the keyboard, ↑ and ↓ move through a panel and ← or → jumps to the twin.</span></figcaption>
  </figure>;
}
