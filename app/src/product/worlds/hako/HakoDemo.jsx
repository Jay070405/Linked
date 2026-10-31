import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {L, useCaseLang} from '../../i18n';
import './hako-demo.css';

/* Hako's one gesture, playable (adapted from pages/demos/HakoDemo.jsx for the Product case). The team's sketch from
   the film, with Mia's, Theo's and Ren's notes beside it. Drag a box over any part of it, say what you want (the
   prompt is the film's), press Build: agents leave the box's corner, take a region each, show a dashed "thinking"
   frame, then scan it into Daybreak's real UI. When a note is covered, its author ticks it. Ship when it's ready.
   Same colour rules as the film and the brand board: persimmon is your own selection, ultraviolet the agents', the
   teammates' colours only on their notes, green only for what shipped; Daybreak keeps its own dark palette.
   Scripted: the agents reveal UI made in advance, on a timer. Hako and Daybreak are fictional; Daybreak's UI stays in
   English. Keyboard: "Select all" draws the box, Build is focused, Enter builds, Esc clears. Below 640 px the canvas
   lays the same dashboard out tall, so nothing on it drops under 13 px. */

const LAYOUTS = {
  wide: {W: 880, H: 520, regions: [
    {id: 'header', agent: 'Layout', x: 24, y: 22, w: 832, h: 56},
    {id: 'kpis', agent: 'Metrics', x: 24, y: 96, w: 832, h: 122},
    {id: 'chart', agent: 'Metrics', x: 24, y: 236, w: 540, h: 262},
    {id: 'devices', agent: 'Devices', x: 584, y: 236, w: 272, h: 262},
  ]},
  tall: {W: 360, H: 720, regions: [
    {id: 'header', agent: 'Layout', x: 14, y: 14, w: 332, h: 56},
    {id: 'kpis', agent: 'Metrics', x: 14, y: 84, w: 332, h: 190},
    {id: 'chart', agent: 'Metrics', x: 14, y: 288, w: 332, h: 236},
    {id: 'devices', agent: 'Devices', x: 14, y: 538, w: 332, h: 168},
  ]},
};
const AGENTS = ['Layout', 'Metrics', 'Devices'];
// the film's notes, and the region whose build covers each (dark mode arrives with the first region built)
const NOTES = [
  {who: 'Mia', color: '#E8467C', bg: '#FFD9E5', text: 'dark mode please!', covers: 'any'},
  {who: 'Theo', color: '#0FA3A3', bg: '#CFEFEF', text: 'chart = the hero', covers: 'chart'},
  {who: 'Ren', color: '#E8A21A', bg: '#FFE9B8', text: 'show € saved', covers: 'kpis'},
];
// Daybreak's week, as in the film (ui/Daybreak.tsx WEEK): Monday measured, today (Tuesday) so far, the rest forecast
const WEEK = [['Mon', 38.2, 'actual'], ['Tue', 12.2, 'today'], ['Wed', 34, 'forecast'], ['Thu', 41, 'forecast'], ['Fri', 28, 'forecast'], ['Sat', 45, 'forecast'], ['Sun', 40, 'forecast']];
const PROMPT = 'Make it real — dark, live data';

const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const toBox = (a, b) => ({x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y)});

/** What the team put on the board, drawn to fit each region in either layout. */
function Sketch({r, tall}) {
  const {x, y, w, h} = r;
  if (r.id === 'header') return <g><rect x={x + 6} y={y + h / 2 - 11} width={tall ? 96 : 120} height="22" rx="4"/><line x1={x + (tall ? 120 : 160)} y1={y + h / 2} x2={x + (tall ? 230 : 340)} y2={y + h / 2}/><circle cx={x + w - 22} cy={y + h / 2} r="13"/></g>;
  if (r.id === 'kpis') {
    const gap = 14, n = 3;
    return <g>{[0, 1, 2].map(i => {
      const cw = tall ? w : (w - gap * (n - 1)) / n, ch = tall ? (h - gap * (n - 1)) / n : h;
      const cx = tall ? x : x + i * (cw + gap), cy = tall ? y + i * (ch + gap) : y;
      return <g key={i}><rect x={cx} y={cy} width={cw} height={ch} rx="10"/><line x1={cx + 18} y1={cy + (tall ? ch / 2 : 32)} x2={cx + (tall ? 120 : 110)} y2={cy + (tall ? ch / 2 : 32)}/><line x1={tall ? cx + cw - 90 : cx + 18} y1={tall ? cy + ch / 2 : cy + 76} x2={tall ? cx + cw - 22 : cx + 84} y2={tall ? cy + ch / 2 : cy + 76} strokeWidth="6"/></g>;
    })}</g>;
  }
  if (r.id === 'chart') return <g><rect x={x} y={y} width={w} height={h} rx="10"/><path d={`M${x + 24} ${y + h - 30} C ${x + w * 0.26} ${y + h - 40}, ${x + w * 0.37} ${y + 50}, ${x + w * 0.5} ${y + 60} S ${x + w * 0.78} ${y + h - 40}, ${x + w - 24} ${y + h - 36}`}/></g>;
  return <g><rect x={x} y={y} width={w} height={h} rx="10"/>{[0, 1, 2, 3].map(i => <g key={i}><line x1={x + 20} y1={y + 34 + i * ((h - 40) / 4)} x2={x + 130} y2={y + 34 + i * ((h - 40) / 4)}/><rect x={x + w - 60} y={y + 24 + i * ((h - 40) / 4)} width="38" height="20" rx="10"/></g>)}</g>;
}

/** What the agents leave behind, in Daybreak's own palette (the film's numbers). */
function Built({r}) {
  if (r.id === 'header') return <div className="hd-ui hd-ui-header"><b><i/>daybreak</b><span>Good morning, Ana</span><em>Live</em></div>;
  if (r.id === 'kpis') return <div className="hd-ui hd-ui-kpis">{[['Producing now', '4.8', 'kW'], ['Battery', '86', '%'], ['Saved this month', '€142.60', '']].map(([k, v, u]) => <div key={k}><span>{k}</span><strong>{v}<small>{u}</small></strong></div>)}</div>;
  if (r.id === 'chart') return <div className="hd-ui hd-ui-chart"><span>Solar this week</span><div className="hd-bars">{WEEK.map(([d, v, kind]) => <p key={d} className={`is-${kind}`}><i style={{'--h': (kind === 'today' ? 42 : v) / 48}}>{kind === 'today' ? <u style={{'--p': v / 42}}/> : null}</i><em>{kind === 'today' ? 'Today' : d}</em></p>)}</div></div>;
  return <div className="hd-ui hd-ui-devices"><span>Devices</span>{[['Heat pump', 1], ['EV charger', 1], ['Washer', 1], ['Pool pump', 0]].map(([n, on]) => <p key={n}>{n}<i className={on ? 'is-on' : undefined}/></p>)}</div>;
}

export default function HakoDemo({reduced = false}) {
  const {t} = useCaseLang();
  const wrap = useRef(null), stage = useRef(null), start = useRef(null), timers = useRef([]), buildBtn = useRef(null);
  const [tall, setTall] = useState(false);
  const {W, H, regions: REGIONS} = LAYOUTS[tall ? 'tall' : 'wide'];
  const [drag, setDrag] = useState(null), [box, setBox] = useState(null), [asked, setAsked] = useState(false);
  const [state, setState] = useState({}), [agents, setAgents] = useState({});
  const [ship, setShip] = useState(null);      // null | 'build' | 'checks' | 'edge' | 'live'
  const [said, setSaid] = useState('');
  const later = (ms, fn) => timers.current.push(setTimeout(fn, reduced ? 0 : ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // the layout follows the space the canvas has, not the window
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const fit = () => setTall(el.clientWidth < 640);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // switching layout clears the canvas (the regions move)
  useEffect(() => { timers.current.forEach(clearTimeout); timers.current = []; setBox(null); setDrag(null); setAsked(false); setState({}); setAgents({}); setShip(null); }, [tall]);

  const point = e => { const r = stage.current.getBoundingClientRect(); return {x: Math.max(0, Math.min(W, (e.clientX - r.left) / r.width * W)), y: Math.max(0, Math.min(H, (e.clientY - r.top) / r.height * H))}; };
  const todo = sel => REGIONS.filter(r => overlaps(sel, r) && !state[r.id]);

  const build = useCallback(sel => {
    const targets = REGIONS.filter(r => overlaps(sel, r) && !state[r.id]);
    setAsked(false);
    if (!targets.length) return;
    setSaid(t(L(`Agents are building ${targets.length} ${targets.length === 1 ? 'region' : 'regions'}.`, `agent 正在构建 ${targets.length} 块区域。`)));
    // agents leave from the box's corner, take a region each, think, then scan it into real UI
    setAgents(a => { const next = {...a}; targets.forEach(r => { next[r.agent] = {x: sel.x + sel.w, y: sel.y + sel.h, on: true}; }); return next; });
    targets.forEach((r, i) => {
      later(120 + i * 140, () => { setAgents(a => ({...a, [r.agent]: {x: r.x + r.w * 0.62, y: r.y + Math.min(r.h * 0.55, r.h - 30), on: true}})); setState(s => ({...s, [r.id]: 'thinking'})); });
      later(1000 + i * 260, () => setState(s => ({...s, [r.id]: 'building'})));
      later(1900 + i * 260, () => setState(s => ({...s, [r.id]: 'done'})));
    });
    later(2400 + targets.length * 260, () => {
      setAgents(a => { const next = {...a}; targets.forEach(r => { if (next[r.agent]) next[r.agent] = {...next[r.agent], on: false}; }); return next; });
      setSaid(t(L('Built. You can ship it or draw another box.', '做好了。可以发布，也可以再画一个框。')));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, reduced, REGIONS, t]);

  const down = e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest('.hd-ask')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = point(e); setBox(null); setAsked(false);
    setDrag({x: start.current.x, y: start.current.y, w: 0, h: 0});
  };
  const move = e => { if (start.current) setDrag(toBox(start.current, point(e))); };
  // a drag draws a box; a click or a tap selects the part of the sketch under it, the way a design tool selects
  const up = e => {
    if (!start.current) return;
    const from = start.current, to = e?.clientX != null ? point(e) : from, d = toBox(from, to);
    start.current = null; setDrag(null);
    if (e?.type === 'pointercancel') return;
    if (d.w > 24 && d.h > 24) { setBox(d); setAsked(todo(d).length > 0); return; }
    if (d.w < 8 && d.h < 8) {
      const r = REGIONS.find(q => from.x >= q.x && from.x <= q.x + q.w && from.y >= q.y && from.y <= q.y + q.h);
      if (r) { const b = {x: r.x - 6, y: r.y - 6, w: r.w + 12, h: r.h + 12}; setBox(b); setAsked(todo(b).length > 0); }
    }
  };
  const all = () => {
    const b = {x: 8, y: 8, w: W - 16, h: H - 16};
    setBox(b);
    const open = todo(b).length > 0;
    setAsked(open);
    if (open) requestAnimationFrame(() => buildBtn.current?.focus({preventScroll: true}));
  };
  const reset = () => { timers.current.forEach(clearTimeout); timers.current = []; setBox(null); setAsked(false); setState({}); setAgents({}); setShip(null); setSaid(''); };
  const shipIt = () => {
    setShip('build'); setBox(null); setAsked(false);
    later(520, () => setShip('checks'));
    later(1040, () => setShip('edge'));
    later(1560, () => { setShip('live'); setSaid(t(L('Shipped to production.', '已发布到生产环境。'))); });
  };
  const key = e => { if (e.key === 'Escape' && (box || asked)) { setBox(null); setAsked(false); } };

  const doneCount = REGIONS.filter(r => state[r.id] === 'done').length, sel = drag || box;
  const covered = n => (n.covers === 'any' ? doneCount > 0 : state[n.covers] === 'done');
  const shipLabel = ship === 'live' ? t(L('Shipped', '已上线')) : ship ? t(L('Shipping', '发布中')) : t(L('Ship', '上线'));

  return <div ref={wrap} className={`hd${reduced ? ' hd-still' : ''}${ship === 'live' ? ' is-shipped' : ''}${tall ? ' is-tall' : ''}`} onKeyDown={key}>
    <div className="hd-top">
      <p className="hd-hint">{t(L('Drag a box over part of the sketch, or click one part, then press Build.', '在草图上拖一个框，或者直接点一块，然后按 Build。'))}</p>
      <div className="hd-actions">
        <button type="button" onClick={all}>{t(L('Select all', '全选'))}</button>
        <button type="button" onClick={reset}>{t(L('Reset', '重来'))}</button>
        <button type="button" className="hd-ship" disabled={!doneCount || !!ship} onClick={shipIt}>{shipLabel} <span aria-hidden="true">↗</span></button>
      </div>
    </div>
    <div className="hd-board">
      <div ref={stage} className="hd-stage" style={{aspectRatio: `${W} / ${H}`, '--u': `calc(100cqw / ${W})`}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        role="group" aria-label={t(L('The team’s sketch of Daybreak, a home-energy dashboard. Drag to draw a selection box, or use Select all.', '团队画的 Daybreak（家庭能源仪表盘）草图。拖动画出选框，或者用“全选”。'))}>
        <span className="hd-frame-label" aria-hidden="true">Daybreak — home overview · sketch v0</span>
        <svg className="hd-sketch" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">{REGIONS.map(r => <g key={r.id} className={`hd-sk is-${state[r.id] || 'idle'}`}><Sketch r={r} tall={tall}/></g>)}</svg>
        {REGIONS.map(r => { const s = state[r.id]; return <div key={r.id} className={`hd-region is-${s || 'idle'}`} style={{left: `${r.x / W * 100}%`, top: `${r.y / H * 100}%`, width: `${r.w / W * 100}%`, height: `${r.h / H * 100}%`}} aria-hidden={s === 'done' ? undefined : 'true'}>
          {s ? <span className="hd-chip" aria-hidden="true">✦ {r.agent} · {s === 'done' ? 'done' : s === 'thinking' ? 'thinking' : 'building'}</span> : null}
          <div className="hd-built"><Built r={r}/></div>
          <i className="hd-scan" aria-hidden="true"/>
        </div>; })}
        {sel ? <div className={`hd-sel${drag ? ' is-drawing' : ''}`} style={{left: `${sel.x / W * 100}%`, top: `${sel.y / H * 100}%`, width: `${sel.w / W * 100}%`, height: `${sel.h / H * 100}%`}} aria-hidden="true">
          <i/><i/><i/><i/><span>{Math.round(sel.w)} × {Math.round(sel.h)}</span>
        </div> : null}
        {AGENTS.map(name => { const a = agents[name]; return <div key={name} className={`hd-agent${a?.on ? ' is-on' : ''}`} style={{transform: `translate3d(${(a?.x ?? W / 2) / W * 100}cqw, ${(a?.y ?? H / 2) / H * 100}cqh, 0)`}} aria-hidden="true">
          <svg viewBox="0 0 14 18"><path d="M1 1 L13 9.5 L7.6 10.6 L5 16.5 Z"/></svg><span>Hako · {name}</span>
        </div>; })}
        {asked ? <div className="hd-ask">
          <p><span aria-hidden="true">✦</span> <span lang="en">{PROMPT}</span></p>
          <button ref={buildBtn} type="button" onClick={() => build(box)}>Build <kbd aria-hidden="true">⏎</kbd></button>
        </div> : null}
        <div className="hd-toast" aria-hidden={ship ? undefined : 'true'}>{ship === 'live'
          ? <><b aria-hidden="true">✓</b><span lang="en">Shipped to production · just now</span></>
          : ship ? <><i className="hd-spin" aria-hidden="true"/><span lang="en">{ship === 'build' ? 'Build · 11.8 s' : ship === 'checks' ? 'Checks · 214 passed' : 'Edge · 38 regions'}</span></> : null}</div>
      </div>
      <ul className="hd-notes" aria-label={t(L('The team’s notes', '团队的便签'))}>
        {NOTES.map(n => { const done = covered(n); return <li key={n.who} className={done ? 'is-ticked' : undefined} style={{'--bg': n.bg, '--who': n.color}}>
          <p className="hd-note-text" lang="en">{n.text}</p>
          <p className="hd-note-who"><i aria-hidden="true"/>{n.who}{done ? <span className="hd-note-tick">{t(L(' ticked it', ' 已勾掉'))}</span> : null}</p>
          <span className="hd-note-check" aria-hidden="true">✓</span>
        </li>; })}
      </ul>
    </div>
    <p className="hd-sr" role="status" aria-live="polite">{said}</p>
    <p className="hd-fine">{t(L('This demo is scripted. The agents reveal UI made in advance, on a timer, and no model runs. Hako and Daybreak are fictional, and Daybreak’s screens are in English.', '这个演示是预先写好的。agent 按计时揭开提前做好的界面，没有调用任何模型。Hako 和 Daybreak 都是虚构的，Daybreak 的界面是英文的。'))}</p>
  </div>;
}
