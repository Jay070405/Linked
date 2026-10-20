import {useLayoutEffect, useMemo, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {gsap, PHONE, useMedia} from '../motion';
import {Ask, Takeaway, useInputMode} from '../Try';
import {RUNS} from '../data/benchmark-runs';
import {L, useCaseLang} from '../../i18n';
import './ablation.css';

/* D1, Result 2: the ablation as every build at once. Each dot is one scored build: how much of a four-token change,
   injected after the build, reached its code. Point at a dot (or tap it, or arrow through them) for the build's id,
   its render and which of the four colors followed; the chips pick out one level. Data: data/benchmark-runs.js. */

const LEVELS = [
  {id: 'L0', name: L('L0 Raw', 'L0 原始'), short: L('Raw', '原始'), bound: false},
  {id: 'L1', name: L('L1 Structured', 'L1 结构化'), short: L('Structured', '结构化'), bound: false},
  {id: 'L0V', name: L('L0V Raw + variables', 'L0V 原始 + variables'), short: L('+ variables', '+ variables'), bound: true},
  {id: 'L2', name: L('L2 Systematized', 'L2 系统化'), short: L('Systematized', '系统化'), bound: true},
];
const TOKEN_NAMES = [['primary', L('Primary', '主色')], ['text', L('Text', '文字')], ['background', L('Background', '背景')], ['border', L('Border', '描边')]];
const SCREEN_ZH = {'Sign-in': '登录', Pricing: '定价', Settings: '设置', 'Product grid': '商品列表', Dashboard: '仪表盘', Profile: '个人主页'};
// the drawing in viewBox units; phones get a narrower one so its text stays readable at 360 px
const WIDE = {W: 760, H: 372, TOP: 48, BOTTOM: 300, COL: 160, X0: 120, spread: 9.5, r: 5.5};
const NARROW = {W: 400, H: 386, TOP: 48, BOTTOM: 296, COL: 82, X0: 70, spread: 8, r: 4.6};
const yOf = (L, v) => L.BOTTOM - (L.BOTTOM - L.TOP) * v / 100;
const median = v => { const s = [...v].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
/** "Followed: primary, border. Missed: text, background." for the dot's label. */
const followedText = (d, t, zh) => {
  const pick = test => TOKEN_NAMES.filter(([k]) => d.tokens[k] != null && test(d.tokens[k])).map(([, l]) => (zh ? t(l) : t(l).toLowerCase())).join(zh ? '、' : ', ');
  const ok = pick(v => v >= .5), miss = pick(v => v < .5);
  return zh ? [ok && `已跟上：${ok}。`, miss && `没跟上：${miss}。`].filter(Boolean).join('')
    : [ok && `Followed: ${ok}.`, miss && `Missed: ${miss}.`].filter(Boolean).join(' ');
};
const pct = share => `${Math.round(share * 1000) / 10}%`.replace('.0%', '%');

export default function AblationChart({reduced = false}) {
  const {t, zh} = useCaseLang();
  const screen = d => (zh ? SCREEN_ZH[d.name] || d.name : d.name);
  const root = useRef(null);
  const [level, setLevel] = useState('all');
  const [at, setAt] = useState(null);           // index into dots, or null
  const [seen, setSeen] = useState(false);
  const [instantTip, setInstantTip] = useState(false);
  const mode = useInputMode();
  const compact = useMedia(PHONE);
  const L = compact ? NARROW : WIDE, {W, H, TOP, BOTTOM, COL, X0} = L;
  const y = v => yOf(L, v);
  const colX = gi => X0 + COL * .32 + gi * COL;

  // the dots in drawing order, positioned as the static chart was (values rounded to whole percent, ties side by side)
  const dots = useMemo(() => LEVELS.flatMap((g, gi) => {
    const runs = RUNS.filter(r => r.level === g.id), counts = {};
    return runs.map(r => {
      const v = Math.round(r.share * 100), k = (counts[v] = (counts[v] || 0) + 1) - 1;
      const spread = runs.filter(o => Math.round(o.share * 100) === v).length;
      return {...r, v, g, cx: L.X0 + L.COL * .32 + gi * L.COL + (k - (spread - 1) / 2) * L.spread, cy: yOf(L, v)};
    });
  }), [L]);
  const groups = LEVELS.map((g, gi) => ({...g, cx: colX(gi), m: median(dots.filter(d => d.level === g.id).map(d => d.v))}));
  const visible = d => level === 'all' || d.level === level;
  const shown = dots.map((d, i) => i).filter(i => visible(dots[i]));

  // the dots rise into place once, when the plot comes into view (the module mounts lazily, so this watches the plot
  // instead of precomputing scroll positions)
  useLayoutEffect(() => {
    const node = root.current, plot = node?.querySelector('.ab-plot svg');
    if (!plot || reduced) return undefined;
    const dotsEl = node.querySelectorAll('.ab-dot');
    gsap.set(dotsEl, {attr: {cy: L.BOTTOM}, opacity: 0});
    let tween = null;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      tween = gsap.to(dotsEl, {attr: {cy: (i, el) => el.dataset.cy}, opacity: 1, duration: .9, ease: 'v2out', stagger: {each: .02}, clearProps: 'opacity'});
    }, {threshold: .35});
    io.observe(plot);
    return () => { io.disconnect(); tween?.kill(); gsap.set(dotsEl, {attr: {cy: (i, el) => el.dataset.cy}, clearProps: 'opacity'}); };
  }, [reduced, L]);

  const show = (i, viaKeys) => {
    // the first tooltip eases in; moving between dots is instant, as is anything from the keyboard
    setInstantTip(at != null || viaKeys || reduced);
    setAt(i); setSeen(true);
  };
  const move = (e, i) => {
    const pos = shown.indexOf(i);
    const step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[e.key];
    let next = null;
    if (step) next = shown[(pos + step + shown.length) % shown.length];
    else if (e.key === 'Home') next = shown[0];
    else if (e.key === 'End') next = shown.at(-1);
    else if (e.key === 'Escape') { setAt(null); return; }
    if (next == null) return;
    e.preventDefault();
    root.current?.querySelector(`[data-dot="${next}"]`)?.focus();
  };
  const filter = id => {
    setLevel(id); setSeen(true);
    if (at != null && id !== 'all' && dots[at].level !== id) setAt(null);
  };
  const tip = at != null ? dots[at] : null;
  const focusable = tip && visible(tip) ? at : shown[0];

  return <figure ref={root} className="ab" data-reveal="" {...mode.bind} onPointerLeave={e => { if (e.pointerType === 'mouse') setAt(null); }}>
    <div className="ab-controls">
      <Ask>{t(L('Point at a dot, or tap it, to see that build.', '指向或点按一个点，查看那次构建。'))}</Ask>
      <div className="v2-seg ab-chips" role="group" aria-label={t(L('Show one level', '只看一个层级'))}>
        <button type="button" aria-pressed={level === 'all'} onClick={() => filter('all')}>{t(L('All', '全部'))}</button>
        {LEVELS.map(g => <button key={g.id} type="button" aria-pressed={level === g.id} onClick={() => filter(g.id)}>{g.id}</button>)}
      </div>
    </div>
    <div className="ab-plot" onPointerDown={e => {
      if (e.target.closest('[data-dot]')) return;
      // a finger is wider than a dot: on touch, the nearest visible dot within about 24 px counts
      if (e.pointerType !== 'mouse') {
        const svg = e.currentTarget.querySelector('svg'), p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
        const k = W / svg.getBoundingClientRect().width;
        const near = shown.map(i => [i, Math.hypot(dots[i].cx - p.x, dots[i].cy - p.y)]).sort((a, b) => a[1] - b[1])[0];
        if (near && near[1] < 24 * k) { show(near[0], false); return; }
      }
      setAt(null);
    }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-labelledby="ab-title" className={compact ? 'is-narrow' : ''}>
        <title id="ab-title">{t(L('Share of a four-token change that reached the code, per build. Without variables, L0 median 50% and L1 median 50%, no build above 67%. With variables bound, all 9 L0V builds and all 10 L2 builds at 100%.', '每次构建中，四个 token 的改动有多少传到了代码里。没有 variables 时，L0 和 L1 的中位数都是 50%，没有一次超过 67%。绑定 variables 后，9 次 L0V 构建和 10 次 L2 构建全部是 100%。'))}</title>
        {[0, 25, 50, 75, 100].map(v => <g key={v} className="ab-grid"><path d={`M${X0 - 20} ${y(v)} H${W - 6}`}/><text x={X0 - 26} y={y(v) + 4}>{v}%</text></g>)}
        <path className="ab-split" d={`M${colX(2) - COL * .5} ${TOP - 34} V${BOTTOM + 8}`}/>
        <text className="ab-tag" x={colX(2) - COL * .5 + 10} y={TOP - 22}>{t(L('Variables bound', '绑定了 variables'))}</text>
        {groups.map(g => <g key={g.id} className={`ab-group${g.bound ? ' is-bound' : ''}${level !== 'all' && level !== g.id ? ' is-dim' : ''}`}>
          <path className="ab-median" d={`M${g.cx - COL * .28} ${y(g.m)} H${g.cx + COL * .28}`}/>
          {compact ? <>
            <text className="ab-name" x={g.cx} y={BOTTOM + 28}>{g.id}</text>
            <text className="ab-med" x={g.cx} y={BOTTOM + 47}>{t(g.short)}</text>
            <text className="ab-med" x={g.cx} y={BOTTOM + 66}>{zh ? `中位数 ${g.m}%` : `median ${g.m}%`}</text>
          </> : <>
            <text className="ab-name" x={g.cx} y={BOTTOM + 30}>{t(g.name)}</text>
            <text className="ab-med" x={g.cx} y={BOTTOM + 50}>{zh ? `中位数 ${g.m}%` : `median ${g.m}%`}</text>
          </>}
        </g>)}
        {dots.map((d, i) => {
          const on = visible(d);
          return <g key={d.id} data-dot={i} className={`ab-hit${d.g.bound ? ' is-bound' : ''}${on ? '' : ' is-dim'}${at === i ? ' is-on' : ''}`}
            tabIndex={on ? (i === focusable ? 0 : -1) : undefined} role="img"
            aria-label={zh ? `${d.id}，${screen(d)}，${t(d.g.name)}：改动有 ${pct(d.share)} 传到了代码。${followedText(d, t, zh)}` : `${d.id}, ${d.name}, ${t(d.g.name)}: ${pct(d.share)} of the change reached the code. ${followedText(d, t, zh)}`}
            onPointerEnter={e => { if (on && e.pointerType === 'mouse') show(i, false); }}
            onClick={e => { if (on) show(i, e.detail === 0); }}
            onFocus={() => on && show(i, mode.keyed.current)} onKeyDown={e => move(e, i)}>
            <circle className="ab-target" cx={d.cx} cy={d.cy} r={compact ? 9 : 12}/>
            <circle className="ab-dot" cx={d.cx} cy={d.cy} data-cy={d.cy} r={L.r}/>
          </g>;
        })}
      </svg>
      {tip && !compact ? <Tip key={instantTip ? 'still' : tip.id} d={tip} instant={instantTip} W={W} H={H}/> : null}
    </div>
    {compact ? <div className="ab-detail" aria-hidden="true">{tip ? <Card d={tip}/> : <p className="ab-detail-empty">{t(L('Tap a dot: its build shows here.', '点一个点，那次构建会显示在这里。'))}</p>}</div> : null}
    <Takeaway show={seen} instant={reduced || mode.keyed.current}>{t(L('With variables, every build followed the whole change. Without them, none got past 67%.', '有 variables 时，每次构建都完整跟上了改动；没有时，没有一次超过 67%。'))}</Takeaway>
    <figcaption className="v2-caption"><Ev label="Measured"/><span>{t(L('Each dot is one build: how much of a four-token change, injected after the build, reached its code. An exploratory measure I added after round 1’s first results.', '每个点代表一次构建：构建完成后注入四个 token 的改动，看有多少传到了它的代码里。这是我在第 1 轮初步结果出来后加的探索性指标。'))}</span></figcaption>
  </figure>;
}

/** The build behind a dot, over the chart: placed above the dot (below near the top), held inside the chart, growing
    from the dot's side. */
function Tip({d, instant, W, H}) {
  const left = d.cx / W * 100, top = d.cy / H * 100, below = top < 38;
  const edge = left < 22 ? 'is-left' : left > 78 ? 'is-right' : '';
  return <div className={`ab-tip ${edge}${below ? ' is-below' : ''}${instant ? ' is-instant' : ''}`} style={{left: `${left}%`, top: `${top}%`}} aria-hidden="true">
    <Card d={d}/>
  </div>;
}
/** Id, render, how much of the change followed, and which colors. */
function Card({d}) {
  const {t, zh} = useCaseLang();
  return <div className="ab-tip-card">
    <img src={`/assets/product/ready-for-agents/runs/${d.id}.webp`} width={d.w} height={d.h} alt="" decoding="async"/>
    <div className="ab-tip-text">
      <p className="ab-tip-id">{d.id}</p>
      <p className="ab-tip-sub">{zh ? `${SCREEN_ZH[d.name] || d.name}，${t(d.g.name)}` : `${d.name}, ${t(d.g.name)}`}</p>
      <p className="ab-tip-share">{zh ? <>改动有 <b>{pct(d.share)}</b> 传到了代码</> : <><b>{pct(d.share)}</b> of the change reached the code</>}</p>
      <ul>{TOKEN_NAMES.map(([k, label]) => {
        const v = d.tokens[k];
        return <li key={k} className={v == null ? 'is-na' : v >= .5 ? 'is-ok' : 'is-miss'}>
          {v == null ? <span className="ab-na">–</span> : v >= .5 ? <Check/> : <Miss/>}{t(label)}
        </li>;
      })}</ul>
    </div>
  </div>;
}
const mark = {viewBox: '0 0 16 16', width: 13, height: 13, fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true};
const Check = () => <svg {...mark}><path d="m3.5 8.5 3 3 6-7"/></svg>;
const Miss = () => <svg {...mark}><path d="m4.5 4.5 7 7m0-7-7 7"/></svg>;
