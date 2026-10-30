import {useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState} from 'react';
import './cg-demo.css';
import {annualPremium, cost, dominator, money, plans, rate, scenarios, worstYear} from '../../product/v2/data/cntl-model.js';

/* Common Ground ("Choose Not to Lose"), Try it. One slider of covered bills prices all four fictional plans for the
   whole year with the prototype's own tested model (cntl-model.js, integer cents). Each plan is a row on one yearly
   axis: premiums solid, out-of-pocket tinted, a tick at the most its year can cost. ★ Cheapest slides to whichever plan
   cost() says is lowest. Plan B, dominated by Plan A, carries the red +$600 at every amount and stays fully choosable:
   choosing it opens the review step (tick, then Save Plan B, or Switch to Plan A) instead of a plain save.
   Motion: bar lengths are scaleX, the badge is translate, totals are written in rAF by a critically damped follower
   (no overshoot, no stall while dragging). React renders only on input; the animated text and transforms never go
   through React, so nothing flickers. reduced = values snap. */

const COLORS = {a: '#8b7bff', b: '#3f9cff', c: '#22c3b5', d: '#3ecf6e'};
const MAX = Math.max(...scenarios.map(s => s.charges)) / 100;                // $40,000, the prototype's top example
const START = scenarios.find(s => s.id === 'typical').charges / 100;        // $4,000
const EXAMPLES = scenarios.map(s => ({dollars: s.charges / 100, label: s.short}));
const SL = 400;                                                              // slider positions, square-root scale
const STEP = 250000;                                                         // $2,500 axis gridlines, in cents
const AX = Math.ceil(Math.max(...plans.map(worstYear)) / STEP) * STEP;     // axis end: $10,000
const AXIS = Array.from({length: AX / STEP + 1}, (_, i) => i * STEP);
const SCALE = [0, 1000, 5000, 10000, 20000, 40000].filter(v => v <= MAX);
const OMEGA = 20;                                                            // ~350 ms for a typical move, ~480 ms for $300 -> $40,000
const SETTLE = 500, SETTLE_V = 10000;                                        // snap within $5 and $100/s (sub-pixel on the axis)

// Bills snap to whole tens so every plan's total lands on whole dollars (10/20/30% of a multiple of $10).
const toBills = pos => {
  const v = MAX * (pos / SL) ** 2;
  const unit = v < 1000 ? 10 : v < 5000 ? 20 : v < 20000 ? 50 : 100;
  return Math.min(MAX, Math.round(v / unit) * unit);
};
const toPos = bills => Math.round(SL * Math.sqrt(bills / MAX));
const usd = dollars => money(Math.round(dollars) * 100);
const short = v => (v === 0 ? '$0' : `$${v / 1000}k`);

const META = plans.map(p => {
  const dom = dominator(p);
  return {p, color: COLORS[p.id] || '#8b8b95', premium: annualPremium(p), worst: worstYear(p), domIdx: dom ? plans.indexOf(dom) : -1};
});
const FIRST_DOM = META.findIndex(m => m.domIdx >= 0);

const EN = {
  tryIt: 'Try it',
  hint: 'Drag the covered bills and watch ★ Cheapest move. Then try choosing Plan B.',
  bills: 'Covered bills this year',
  examples: 'Bill examples',
  valuetext: (b, name, total) => `${b} in covered bills. Cheapest: ${name}, ${total} a year.`,
  chart: 'Yearly cost, premiums included',
  plan: 'Plan', year: 'The year',
  premiums: 'Premiums', oop: 'Out-of-pocket', most: 'Most a year can cost',
  prem: v => `${v} premiums`, oopPre: '', oopPost: ' out-of-pocket',
  proof: (gap, other) => `+${gap} a year vs ${other} · same coverage`,
  rows: 'Four plans, priced for the year',
  rowSr: r => `: ${r.total} a year at ${r.bills} of covered bills, ${r.prem} premiums and ${r.oop} out-of-pocket.`
    + (r.cheapest ? ' Cheapest at this amount.' : '') + (r.gap ? ` ${r.gap} a year more than ${r.other} for the same coverage.` : ''),
  idle: 'No plan is preselected. Choose one to save it.',
  saved1: (name, total, bills) => `${name} saved · ${total} a year, premiums included, at ${bills} of covered bills`,
  saved2: (name, worst) => `At most ${worst} a year on ${name} for covered, in-network care. Uncovered and out-of-network bills can add more.`,
  saved2dom: (gap, other, worst) => `You confirmed the ${gap} a year more than ${other}, for the same coverage. At most ${worst} a year for covered, in-network care.`,
  before: 'Before you save your choice',
  look: name => `Take one more look at ${name}.`,
  body: (name, other, gap) => `${name} costs ${gap} more a year than ${other}, whatever your bills: the same deductible, coinsurance and out-of-pocket maximum, with a higher premium. You can still choose it.`,
  terms: (a, b) => `${a} and ${b}, term by term`,
  tPrem: 'Premiums per year', tDed: 'Deductible per year', tCo: 'Your coinsurance', tMax: 'Out-of-pocket maximum per year',
  tAt: b => `At ${b} of covered bills`,
  understand: (name, gap, other) => `I understand ${name} costs ${gap} more a year than ${other}.`,
  nudge: name => `Tick the box above to save ${name}.`,
  fine: 'Four fictional plans. Not advice.',
};
const ZH = {
  tryIt: '试一试',
  hint: '拖动承保医疗费用，看 ★ Cheapest 落在哪个方案上；再试着选一下 Plan B。',
  bills: '今年的承保医疗费用',
  examples: '账单示例',
  valuetext: (b, name, total) => `承保医疗费用 ${b}。最便宜的是 ${name}，每年 ${total}。`,
  chart: '全年费用（含保费）',
  plan: '方案', year: '全年',
  premiums: '保费', oop: '自付', most: '一年最多花费',
  prem: v => `保费 ${v}`, oopPre: '自付 ', oopPost: '',
  proof: (gap, other) => `每年比 ${other} 多 ${gap} · 保障相同`,
  rows: '四个方案的全年费用',
  rowSr: r => `：承保医疗费用 ${r.bills} 时每年 ${r.total}，其中保费 ${r.prem}，自付 ${r.oop}。`
    + (r.cheapest ? '这个金额下最便宜。' : '') + (r.gap ? `保障相同，每年比 ${r.other} 多 ${r.gap}。` : ''),
  idle: '不预选任何方案。选一个，把它保存下来。',
  saved1: (name, total, bills) => `已保存 ${name} · 承保医疗费用 ${bills} 时，每年 ${total}（含保费）`,
  saved2: (name, worst) => `网络内的承保医疗，${name} 一年最多 ${worst}（含年保费）。不在承保范围内或网络外的账单，可能还会更多。`,
  saved2dom: (gap, other, worst) => `你已确认：保障相同，每年比 ${other} 多 ${gap}。网络内的承保医疗，一年最多 ${worst}（含年保费）。`,
  before: '保存之前',
  look: name => `再看一眼 ${name}。`,
  body: (name, other, gap) => `不管账单多少，${name} 每年都比 ${other} 多花 ${gap}：免赔额、共同保险和自付额上限都一样，只是保费更高。你仍然可以选它。`,
  terms: (a, b) => `${a} 和 ${b} 的条款对照`,
  tPrem: '年保费', tDed: '免赔额（每年）', tCo: '共同保险', tMax: '自付额上限（每年）',
  tAt: b => `承保医疗费用 ${b} 时`,
  understand: (name, gap, other) => `我明白 ${name} 每年比 ${other} 多花 ${gap}。`,
  nudge: name => `先勾选上面的确认，才能保存 ${name}。`,
  fine: '四个虚构方案，不构成建议。',
};

/** Writes the animated values straight to the DOM: bar scales, the red gap, the totals and out-of-pocket figures. */
function paintFrame(a, els) {
  for (let i = 0; i < META.length; i++) {
    const m = META[i], v = a.shown[i];
    const bar = els.bar[i];
    if (bar) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, v / AX)).toFixed(5)})`;
    const dollars = Math.round(v / 100);
    if (a.text[i] !== dollars && els.total[i]) { a.text[i] = dollars; els.total[i].textContent = usd(dollars); }
    const oop = Math.max(0, Math.round((v - m.premium) / 100));
    if (a.oop[i] !== oop && els.oop[i]) { a.oop[i] = oop; els.oop[i].textContent = usd(oop); }
    const gap = els.gap[i];
    if (gap && m.domIdx >= 0) {
      const from = a.shown[m.domIdx];
      gap.style.transform = `translateX(${(from / AX * 100).toFixed(4)}%) scaleX(${(Math.max(0, v - from) / AX).toFixed(5)})`;
    }
  }
}

export default function CommonGroundDemo({lang = 'en', reduced = false}) {
  const c = lang === 'zh' ? ZH : EN;
  const uid = useId();
  const rangeId = `${uid}-bills`, examplesId = `${uid}-ex`, reviewId = `${uid}-review`;

  const [bills, setBills] = useState(START);
  const [pos, setPos] = useState(() => toPos(START));
  const [saved, setSaved] = useState(null);       // index of the saved plan
  const [review, setReview] = useState(null);     // index of the plan in review
  const [ticked, setTicked] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [announce, setAnnounce] = useState('');

  const now = useMemo(() => META.map(m => cost(m.p, bills * 100)), [bills]);
  const cheap = useMemo(() => now.reduce((best, n, i) => (n.total < now[best].total ? i : best), 0), [now]);

  const listRef = useRef(null), badgeRef = useRef(null), headRef = useRef(null), checkRef = useRef(null);
  const rowEls = useRef([]), slotEls = useRef([]), pickEls = useRef([]);
  const els = useRef({bar: [], total: [], oop: [], gap: []}).current;
  const anim = useRef({shown: null, vel: META.map(() => 0), target: null, raf: 0, last: 0, text: [], oop: []});
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const cheapRef = useRef(cheap);
  cheapRef.current = cheap;
  const placed = useRef(false);
  const focusNext = useRef(null);

  // Critically damped follower, solved exactly per frame (stable at any frame time), clamped so it never overshoots.
  const tick = useCallback(function step(t) {
    const a = anim.current;
    const dt = a.last ? Math.min(0.064, Math.max(0, (t - a.last) / 1000)) : 1 / 60;
    a.last = t;
    const k = Math.exp(-OMEGA * dt);
    let moving = false;
    for (let i = 0; i < a.shown.length; i++) {
      const e = a.shown[i] - a.target[i], v = a.vel[i];
      if (e === 0 && v === 0) continue;
      const q = v + OMEGA * e;
      let ne = (e + q * dt) * k, nv = (v - OMEGA * q * dt) * k;
      if ((e > 0 && ne < 0) || (e < 0 && ne > 0) || (Math.abs(ne) < SETTLE && Math.abs(nv) < SETTLE_V)) { ne = 0; nv = 0; }
      a.shown[i] = a.target[i] + ne;
      a.vel[i] = nv;
      if (ne !== 0) moving = true;
    }
    paintFrame(a, els);
    a.raf = moving ? requestAnimationFrame(step) : 0;
  }, [els]);

  useLayoutEffect(() => {
    const a = anim.current;
    a.target = now.map(n => n.total);
    if (!a.shown || reduced) {
      if (a.raf) cancelAnimationFrame(a.raf);
      a.raf = 0;
      a.shown = a.target.slice();
      a.vel = a.target.map(() => 0);
      paintFrame(a, els);
      return;
    }
    if (!a.raf) { a.last = 0; a.raf = requestAnimationFrame(tick); }
  }, [now, reduced, tick, els]);

  // A language switch can remount the figure spans; repaint them.
  useLayoutEffect(() => {
    const a = anim.current;
    if (!a.shown) return;
    a.text = []; a.oop = [];
    paintFrame(a, els);
  }, [lang, els]);

  useEffect(() => () => { const a = anim.current; if (a.raf) cancelAnimationFrame(a.raf); a.raf = 0; }, []);

  // ★ Cheapest: one badge, translated to the cheapest row's slot. Measured on layout changes only, never per frame.
  const placeBadge = useCallback(snap => {
    const b = badgeRef.current, i = cheapRef.current, r = rowEls.current[i], s = slotEls.current[i];
    if (!b || !r || !s) return;
    const x = r.offsetLeft + s.offsetLeft;
    const y = r.offsetTop + s.offsetTop + Math.round((s.offsetHeight - b.offsetHeight) / 2);
    const instant = snap || !placed.current || reducedRef.current;
    if (instant) b.style.transition = 'none';
    b.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if (instant) { void b.offsetWidth; b.style.transition = ''; }
    if (!placed.current) { placed.current = true; b.setAttribute('data-ready', ''); }
  }, []);

  useLayoutEffect(() => { placeBadge(false); }, [cheap, placeBadge]);
  useLayoutEffect(() => { placeBadge(true); }, [lang, placeBadge]);
  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => placeBadge(true));
    if (listRef.current) ro.observe(listRef.current);
    rowEls.current.forEach(r => r && ro.observe(r));
    return () => ro.disconnect();
  }, [placeBadge]);

  useEffect(() => {
    const get = focusNext.current;
    if (!get) return;
    focusNext.current = null;
    get()?.focus({preventScroll: true});
  });

  const slide = p => { setPos(p); setBills(toBills(p)); };
  const jump = dollars => { setBills(dollars); setPos(toPos(dollars)); };

  const savedSentence = i => c.saved1(META[i].p.name, money(now[i].total), usd(bills));
  const save = (i, focusRow) => {
    setSaved(i);
    setReview(null);
    setAnnounce(`${savedSentence(i)}.`);
    if (focusRow) focusNext.current = () => pickEls.current[i];
  };
  const choose = i => {
    if (saved === i) return;
    if (META[i].domIdx >= 0) {
      setReview(i); setTicked(false); setNudge(false);
      focusNext.current = () => headRef.current;
      return;
    }
    save(i, false);
  };
  const closeReview = () => {
    const i = review;
    setReview(null);
    if (i != null) focusNext.current = () => pickEls.current[i];
  };
  const keepReviewed = () => {
    if (!ticked) { setNudge(true); checkRef.current?.focus(); return; }
    save(review, true);
  };
  const switchTo = () => save(META[review].domIdx, true);

  const open = review != null;
  const rv = open ? review : FIRST_DOM;           // the review layer always renders, so the stage never changes height
  const rm = rv >= 0 ? META[rv] : null, rd = rm ? META[rm.domIdx] : null;
  const promise = rm ? money(rm.premium - rd.premium) : '';    // "whatever your bills": identical terms, premium only
  const cheapM = META[cheap];

  const savedBlock = i => {
    const m = META[i];
    const second = m.domIdx >= 0
      ? c.saved2dom(money(now[i].total - now[m.domIdx].total), META[m.domIdx].p.name, money(m.worst))
      : c.saved2(m.p.name, money(m.worst));
    return <>
      <p className="cg-saved-1"><span className="cg-saved-check" aria-hidden="true">✓</span>{savedSentence(i)}</p>
      <p className="cg-saved-2">{second}</p>
    </>;
  };

  return <div className={`cg${reduced ? ' is-reduced' : ''}`} lang={lang === 'zh' ? 'zh-CN' : 'en'}>
    <div className="cg-panel">
      <p className="cg-hint"><span className="cg-label">{c.tryIt}</span><span className="cg-hint-text">{c.hint}</span></p>

      <div className="cg-control">
        <div className="cg-amount">
          <label className="cg-label" htmlFor={rangeId}>{c.bills}</label>
          <output className="cg-amount-n" htmlFor={rangeId} aria-live="off">{usd(bills)}</output>
        </div>
        <div className="cg-quick" role="group" aria-labelledby={examplesId}>
          <span className="cg-label" id={examplesId}>{c.examples}</span>
          <div className="cg-quick-row">
            {EXAMPLES.map(s => <button key={s.dollars} type="button" className="cg-chip" aria-pressed={bills === s.dollars}
              onClick={() => jump(s.dollars)}>{s.label}</button>)}
          </div>
        </div>
        <div className="cg-range-wrap">
          <input id={rangeId} className="cg-range" type="range" min="0" max={SL} step="1" value={pos}
            style={{'--p': pos / SL}} aria-valuetext={c.valuetext(usd(bills), cheapM.p.name, money(now[cheap].total))}
            onChange={e => slide(Number(e.target.value))}/>
          <div className="cg-scale" aria-hidden="true">
            {SCALE.map(v => <span key={v} style={{'--p': Math.sqrt(v / MAX)}}>{short(v)}</span>)}
          </div>
        </div>
      </div>

      <div className="cg-stage">
        <div className={`cg-chart${open ? ' is-away' : ''}`} inert={open}>
          <div className="cg-chart-head">
            <p className="cg-label">{c.chart}</p>
            <ul className="cg-legend" aria-hidden="true">
              <li><span className="cg-sw"/>{c.premiums}</li>
              <li><span className="cg-sw is-oop"/>{c.oop}</li>
              <li><span className="cg-sw is-tick"/>{c.most}</li>
            </ul>
          </div>
          <div className="cg-axis" aria-hidden="true">
            <span className="cg-label cg-axis-plan">{c.plan}</span>
            <span className="cg-axis-n">{AXIS.map(v => <span key={v} style={{left: `${v / AX * 100}%`}}>{money(v)}</span>)}</span>
            <span className="cg-label cg-axis-year">{c.year}</span>
          </div>
          <div className="cg-list" ref={listRef}>
            <ul className="cg-rows" aria-label={c.rows}>
              {META.map((m, i) => {
                const n = now[i], isSaved = saved === i, dom = m.domIdx >= 0 ? META[m.domIdx] : null;
                const gap = dom ? money(n.total - now[m.domIdx].total) : '';
                return <li key={m.p.id} className={`cg-row${isSaved ? ' is-saved' : ''}`} style={{'--c': m.color}}
                  ref={el => { rowEls.current[i] = el; }}>
                  <span className="cg-row-sel" aria-hidden="true"/>
                  <button type="button" className="cg-pick" aria-pressed={isSaved} onClick={() => choose(i)}
                    ref={el => { pickEls.current[i] = el; }}>
                    <span className="cg-ring" aria-hidden="true"/>
                    <span className="cg-name">{m.p.name}</span>
                    <span className="cg-sr">{c.rowSr({total: money(n.total), bills: usd(bills), prem: money(n.premium), oop: money(n.outOfPocket),
                      cheapest: cheap === i, gap, other: dom?.p.name})}</span>
                  </button>
                  <span className="cg-slot" aria-hidden="true" ref={el => { slotEls.current[i] = el; }}/>
                  <span className="cg-track" aria-hidden="true">
                    <span className="cg-grid">{AXIS.slice(1, -1).map(v => <span key={v} style={{left: `${v / AX * 100}%`}}/>)}</span>
                    <span className="cg-fill">
                      <span className="cg-bar is-oop" ref={el => { els.bar[i] = el; }}/>
                      <span className="cg-bar" style={{transform: `scaleX(${m.premium / AX})`}}/>
                      {dom ? <span className="cg-gap" ref={el => { els.gap[i] = el; }}/> : null}
                    </span>
                    <span className="cg-tick" style={{left: `${m.worst / AX * 100}%`}}/>
                  </span>
                  <span className="cg-total" aria-hidden="true"><span ref={el => { els.total[i] = el; }}/></span>
                  <span className="cg-act" aria-hidden="true">{isSaved ? '✓ Selected' : 'Choose'}</span>
                  <span className="cg-sub" aria-hidden="true">
                    <span>{c.prem(money(m.premium))}</span>
                    <span className="cg-sep">·</span>
                    <span>{c.oopPre}<span ref={el => { els.oop[i] = el; }}/>{c.oopPost}</span>
                    {dom ? <span className="cg-proof">{c.proof(gap, dom.p.name)}</span> : null}
                  </span>
                </li>;
              })}
            </ul>
            <span className="cg-badge" ref={badgeRef} aria-hidden="true">★ Cheapest</span>
          </div>
        </div>

        {rm ? <section className={`cg-review${open ? ' is-open' : ''}`} inert={!open} aria-labelledby={reviewId}
          onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); closeReview(); } }}>
          <div className="cg-review-top">
            <p className="cg-label">{c.before}</p>
            <button type="button" className="cg-back" onClick={closeReview}><span aria-hidden="true">← </span>Keep comparing</button>
          </div>
          <h3 className="cg-review-h" id={reviewId} tabIndex={-1} ref={headRef}>{c.look(rm.p.name)}</h3>
          <p className="cg-review-body">{c.body(rm.p.name, rd.p.name, promise)}</p>
          <table className="cg-terms">
            <caption className="cg-sr">{c.terms(rd.p.name, rm.p.name)}</caption>
            <thead><tr>
              <td/>
              <th scope="col"><span className="cg-dot" style={{'--c': rd.color}} aria-hidden="true"/>{rd.p.name}</th>
              <th scope="col"><span className="cg-dot" style={{'--c': rm.color}} aria-hidden="true"/>{rm.p.name}</th>
            </tr></thead>
            <tbody>
              <tr><th scope="row">{c.tPrem}</th><td>{money(rd.premium)}</td>
                <td>{money(rm.premium)}{rm.premium > rd.premium ? <span className="cg-plus">+{promise}</span> : null}</td></tr>
              <tr><th scope="row">{c.tDed}</th><td>{money(rd.p.deductible)}</td><td>{money(rm.p.deductible)}</td></tr>
              <tr><th scope="row">{c.tCo}</th><td>{rate(rd.p.coinsuranceBps)}</td><td>{rate(rm.p.coinsuranceBps)}</td></tr>
              <tr><th scope="row">{c.tMax}</th><td>{money(rd.p.oopMax)}</td><td>{money(rm.p.oopMax)}</td></tr>
              <tr className="is-at"><th scope="row">{c.tAt(usd(bills))}</th><td>{money(now[rm.domIdx].total)}</td>
                <td>{money(now[rv].total)}<span className="cg-plus">+{money(now[rv].total - now[rm.domIdx].total)}</span></td></tr>
            </tbody>
          </table>
          <label className="cg-check">
            <input ref={checkRef} type="checkbox" checked={ticked}
              onChange={e => { setTicked(e.target.checked); if (e.target.checked) setNudge(false); }}/>
            <span>{c.understand(rm.p.name, promise, rd.p.name)}</span>
          </label>
          <p className="cg-nudge" aria-live="polite">{nudge && !ticked ? c.nudge(rm.p.name) : ''}</p>
          <div className="cg-actions">
            <button type="button" className="cg-btn is-primary" aria-disabled={!ticked} onClick={keepReviewed}>Save {rm.p.name}</button>
            <button type="button" className="cg-btn" onClick={switchTo}>Switch to {rd.p.name}</button>
          </div>
        </section> : null}
      </div>

      <div className="cg-result">
        <p className={`cg-idle${saved != null ? ' is-gone' : ''}`} aria-hidden={saved != null}>{c.idle}</p>
        <div className="cg-ghost" aria-hidden="true">{savedBlock(FIRST_DOM >= 0 ? FIRST_DOM : 0)}</div>
        {saved != null ? <div className="cg-saved" key={saved}>{savedBlock(saved)}</div> : null}
      </div>
      <p className="cg-sr" aria-live="polite">{announce}</p>
      <p className="cg-fine">{c.fine}</p>
    </div>
  </div>;
}
