import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {L, useCaseLang} from '../../i18n';
import {plans} from '../../v2/data/cntl-model.js';
import {Ask, Takeaway, usd} from './bits';
import {Register} from './print';
import {DEFAULT_MIX, MIXES, bDominator, rollYear} from './year-mix.js';

/* "Roll your year", the receipt's signature (site-spec/WORLDS.md, D4). One key draws a year of covered bills from an
   ILLUSTRATIVE mix (year-mix.js: made up, and labeled so wherever it shows) and prints a line item per plan with that
   year's total, priced by the prototype's tested cost model. "Simulate 100 years" runs it a hundred times and stacks
   a tally of which plan was cheapest each year. The mix moves the winners between A, C and D; Plan B stays at zero
   under every mix, because Plan A has its terms for $600 less (dominates(), the model's own test).
   The state lives in useRollBook() so the log (on the receipt) and the tally (on the desk beside it) share it. */

const EMPTY = () => ({n: 0, tally: Object.fromEntries(plans.map(p => [p.id, 0])), recent: [], lost: 0});
const RECENT = 4, RUN = 100, TICK = 28;
const add = (book, y) => {
  const n = book.n + 1;
  const tally = {...book.tally};
  y.winners.forEach(id => { tally[id] += 1; });
  return {n, tally, recent: [{...y, k: n}, ...book.recent].slice(0, RECENT), lost: book.lost + (y.rows[1].total - y.rows[0].total)};
};
const mixOf = id => MIXES.find(m => m.id === id);
const tallyWords = book => L(plans.map(p => `${p.name} ${book.tally[p.id]}`).join(', '), plans.map(p => `${p.name} ${book.tally[p.id]} 次`).join('，'));

// Words on the receipt and what screen readers hear; the announcement is kept as a pair so it follows the language too.
const T = {
  settled: (n, mix, words) => L(`${n} illustrative years, ${mix.en.toLowerCase()}. Cheapest: ${words.en}.`, `${n} 个示意年份，${mix.zh}。最便宜的次数：${words.zh}。`),
  rolled: (bills, cheapest, b, more) => L(`${bills} in illustrative covered bills. Cheapest: ${cheapest.map(r => `${r.name} at ${usd(r.total)}`).join(' and ')}. Plan B: ${b}, ${more} more than Plan A.`,
    `示意承保医疗费用 ${bills}。最便宜：${cheapest.map(r => `${r.name}，${usd(r.total)}`).join('；')}。Plan B：${b}，比 Plan A 多 ${more}。`),
  cleared: L('Tally cleared for this mix.', '这组年份的计数已清空。'),
  year: k => L(`Year ${k}`, `第 ${k} 年`),
  stamp: L('Illustrative bills', '示意账单'),
  cheapest: L('Cheapest', '最便宜'),
  overA: d => L(`+${d} vs A`, `比 A 多 ${d}`),
  care: L('premiums + care', '保费 + 医疗'),
  empty: L('Nothing rolled yet. Each year prints here, newest first.', '还没有抽。每抽一年就打印在这里，最新的在最上面。'),
  tallyTitle: L('Cheapest plan, year by year', '每年最便宜的方案'),
  tallyGroup: L('Cheapest plan, year by year', '每年最便宜的方案'),
  rolledN: (mix, n) => L(`${mix.en}, illustrative: ${n} ${n === 1 ? 'year' : 'years'} rolled`, `${mix.zh}，示意：已抽 ${n} 年`),
  whyLead: L('Plan B can’t win a year.', 'Plan B 一年也赢不了。'),
  why: id => L(` Plan ${id} has its deductible, coinsurance and maximum for $600 less, so B is $600 behind A at any amount of bills.`,
    `Plan ${id} 的免赔额、共同保险和上限都和它一样，保费却少 $600，所以无论账单多少，B 都比 A 多花 $600。`),
  lost: n => L(`Plan B instead of Plan A, these ${n} ${n === 1 ? 'year' : 'years'}`, `这 ${n} 年都选 Plan B 而不选 Plan A`),
  all: (b, n) => L(`Every mix you’ve run: Plan B cheapest in ${b} of ${n} years.`, `你跑过的所有组合：${n} 年里 Plan B 最便宜的有 ${b} 年。`),
  ask: L('Roll a year. Then roll a hundred.', '先抽一年，再抽一百年。'),
  roll: L('Roll a year', '抽一年'),
  simulate: L('Simulate 100 years', '模拟 100 年'),
  finish: L('Finish the run', '直接看结果'),
  clear: L('Clear', '清空'),
  legend: L('Mix of years to draw from', '从哪组年份里抽'),
  stampMix: L('Illustrative', '示意'),
  madeUp: L('Made up to show the mechanics: no forecast, no claims data, nobody’s health.', '这些数字是为了演示机制编出来的：不是预测，不是理赔数据，也与任何人的健康无关。'),
  log: L('Rolled years, newest first', '已抽的年份，最新的在前'),
  takeaway: L('Which plan is cheapest depends on the year. Plan B never is.', '哪个方案最便宜，取决于那一年。Plan B 从来都不是。'),
  cap: L('The bills are drawn at random from the made-up mix above. Every total is the prototype’s tested cost model; Plan B’s zero follows from its terms, not from the mix.',
    '账单是从上面那组编出来的年份里随机抽的。每个总额都来自原型经过测试的费用模型；Plan B 的零次来自它的条款，与年份怎么组合无关。'),
};

export function useRollBook(still = false) {
  const [mix, setMix] = useState(DEFAULT_MIX);
  const [books, setBooks] = useState(() => Object.fromEntries(MIXES.map(m => [m.id, EMPTY()])));
  const [running, setRunning] = useState(false);
  const [said, setSaid] = useState('');
  const [keyed, setKeyed] = useState(false);
  const timer = useRef(0), left = useRef(0), mixRef = useRef(mix), announce = useRef(false);
  mixRef.current = mix;
  useEffect(() => () => clearInterval(timer.current), []);
  const book = books[mix];
  const all = Object.values(books).reduce((s, b) => ({n: s.n + b.n, b: s.b + b.tally.b}), {n: 0, b: 0});

  // a finished run is announced once, with the tally it ended on
  useEffect(() => {
    if (!announce.current || running) return;
    announce.current = false;
    setSaid(T.settled(book.n, mixOf(mix).label, tallyWords(book)));
  }, [books, running, book, mix]);

  const settle = useCallback(() => {
    clearInterval(timer.current);
    const m = mixRef.current, rest = [];
    for (; left.current > 0; left.current--) rest.push(rollYear(m));
    announce.current = true;
    setBooks(b => { let cur = b[m]; rest.forEach(y => { cur = add(cur, y); }); return {...b, [m]: cur}; });
    setRunning(false);
  }, []);

  const roll = e => {
    setKeyed(e?.detail === 0);
    if (running) return;
    const y = rollYear(mix);
    setBooks(b => ({...b, [mix]: add(b[mix], y)}));
    const cheapest = y.rows.filter(r => y.winners.includes(r.id));
    setSaid(T.rolled(usd(y.bills), cheapest, usd(y.rows[1].total), usd(y.rows[1].total - y.rows[0].total)));
  };
  const simulate = e => {
    setKeyed(e?.detail === 0);
    if (running) { settle(); return; }
    left.current = RUN;
    if (still) { settle(); return; }
    setRunning(true);
    timer.current = setInterval(() => {
      if (left.current <= 0) { settle(); return; }
      left.current -= 1;
      const m = mixRef.current, y = rollYear(m);
      setBooks(b => ({...b, [m]: add(b[m], y)}));
    }, TICK);
  };
  const clear = () => { clearInterval(timer.current); left.current = 0; setRunning(false); setBooks(b => ({...b, [mix]: EMPTY()})); setSaid(T.cleared); };
  return {mix, setMix, book, books, all, running, said, keyed, roll, simulate, clear, instant: still || keyed};
}

function Year({y, fresh, instant, compact}) {
  const {t} = useCaseLang();
  return <li className={`cnr-y${fresh ? ' is-fresh' : ''}`}>
    <p className="cnr-y-head"><span className="cnr-y-n">{t(T.year(y.k))}</span><span className="cnr-y-stamp">{t(T.stamp)}</span><span className="cnr-y-bills">{fresh ? <Register text={usd(y.bills)} instant={instant}/> : usd(y.bills)}</span></p>
    <ul className="cnr-y-rows">
      {y.rows.map(r => {
        const win = y.winners.includes(r.id);
        return <li key={r.id} className={`${win ? 'is-low' : ''}${r.id === 'b' ? ' is-b' : ''}`}>
          <span className="cnr-y-name">{r.name}</span>
          {compact ? null : <span className="cnr-y-parts">{usd(r.premium)} + {usd(r.outOfPocket)}</span>}
          <span className="cnr-y-total">{fresh ? <Register text={usd(r.total)} instant={instant}/> : usd(r.total)}</span>
          <span className="cnr-y-tag">{win ? t(T.cheapest) : r.id === 'b' ? t(T.overA(usd(r.total - y.rows[0].total))) : ''}</span>
        </li>;
      })}
    </ul>
  </li>;
}

/** Before the first roll: the blank form a year will print into. */
function Blank({compact}) {
  const {t} = useCaseLang();
  return <div className="cnr-y is-blank">
    <p className="cnr-y-head"><span className="cnr-y-n">{t(T.year(1))}</span><span className="cnr-y-stamp">{t(T.stamp)}</span><span className="cnr-y-bills" aria-hidden="true">$ —</span></p>
    <ul className="cnr-y-rows" aria-hidden="true">{plans.map(p => <li key={p.id}>
      <span className="cnr-y-name">{p.name}</span>{compact ? null : <span className="cnr-y-parts">{t(T.care)}</span>}<span className="cnr-y-total">$ —</span><span className="cnr-y-tag"/>
    </li>)}</ul>
    <p className="cnr-r-empty">{t(T.empty)}</p>
  </div>;
}

/** The tally: one notch per year a plan came out cheapest. */
export function Tally({r}) {
  const {t} = useCaseLang();
  const {book, mix, all} = r;
  const most = Math.max(1, ...Object.values(book.tally));
  const by = bDominator();
  return <div className="cnr-tally" role="group" aria-label={t(T.tallyGroup)}>
    <p className="cnr-tally-title">{t(T.tallyTitle)}</p>
    <p className="cnr-tally-sub">{t(T.rolledN(mixOf(mix).label, book.n))}</p>
    <ul className="cnr-tally-rows">
      {plans.map(p => {
        const c = book.tally[p.id];
        return <li key={p.id} className={`is-${p.id}${p.id === 'b' && c === 0 && book.n ? ' is-zero' : ''}`}>
          <span className="cnr-tally-name">{p.name}</span>
          <span className="cnr-tally-track" aria-hidden="true"><i style={{width: `${c / most * 100}%`, backgroundSize: `${100 / Math.max(1, c)}% 100%`}}/></span>
          <span className="cnr-tally-n">{c}</span>
        </li>;
      })}
    </ul>
    <p className="cnr-tally-why"><b>{t(T.whyLead)}</b>{t(T.why(by?.id.toUpperCase()))}</p>
    {book.n ? <p className="cnr-tally-lost"><span>{t(T.lost(book.n))}</span><b>−{usd(book.lost)}</b></p> : null}
    {all.n > book.n ? <p className="cnr-tally-all">{t(T.all(all.b, all.n))}</p> : null}
  </div>;
}

export default function RollYear({r, compact = false, tallyHere = false}) {
  const {t} = useCaseLang();
  const {mix, setMix, book, running, said, roll, simulate, clear, instant} = r;
  const list = useRef(null), topKey = useRef(0);

  // a printed year feeds out under the printer: the log slides down by the new year's height (FLIP, transform only)
  useLayoutEffect(() => {
    const el = list.current, first = el?.firstElementChild;
    const k = book.recent[0]?.k || 0;
    if (!el || !first || k === topKey.current) { topKey.current = k; return; }
    topKey.current = k;
    if (instant || running || book.recent.length < 2) return;
    const h = first.getBoundingClientRect().height;
    el.style.transition = 'none';
    el.style.transform = `translateY(${-h}px)`;
    el.getBoundingClientRect();
    el.style.transition = 'transform 340ms cubic-bezier(.2,0,.38,.9)';
    el.style.transform = '';
  });

  return <div className={`cnr-r${running ? ' is-running' : ''}${instant ? ' is-instant' : ''}`}>
    <Ask>{t(T.ask)}</Ask>
    <div className="cnr-r-keys" data-print="">
      <button type="button" className="cnr-key is-primary" onClick={roll} disabled={running}>{t(T.roll)}</button>
      <button type="button" className="cnr-key" onClick={simulate} aria-pressed={running}>{t(running ? T.finish : T.simulate)}</button>
      {book.n && !running ? <button type="button" className="cnr-key is-quiet" onClick={clear}>{t(T.clear)}</button> : null}
    </div>
    <fieldset className="cnr-r-mix" data-print="" disabled={running}>
      <legend>{t(T.legend)}</legend>
      <div className="cnr-r-mix-opts">{MIXES.map(m => <label key={m.id} className={mix === m.id ? 'is-on' : ''}>
        <input type="radio" name="cnr-mix" value={m.id} checked={mix === m.id} onChange={() => setMix(m.id)}/><span>{t(m.label)}</span>
      </label>)}</div>
      <p className="cnr-r-mix-words"><span className="cnr-stamp">{t(T.stampMix)}</span> {t(mixOf(mix).words)} {t(T.madeUp)}</p>
    </fieldset>
    <p className="cnr-sr" aria-live="polite">{t(said)}</p>

    {tallyHere ? <Tally r={r}/> : null}
    <div className="cnr-r-printer" data-print="">
      <div className="cnr-r-slot" aria-hidden="true"><i/></div>
      <div className={`cnr-r-window${book.recent.length ? '' : ' is-blank'}`}>
        {book.recent.length
          ? <ol ref={list} className="cnr-r-log" aria-label={t(T.log)}>{book.recent.map((y, i) => <Year key={y.k} y={y} fresh={i === 0} instant={instant || running} compact={compact}/>)}</ol>
          : <Blank compact={compact}/>}
      </div>
    </div>
    <Takeaway show={book.n >= 10} instant={instant}>{t(T.takeaway)}</Takeaway>
    <p className="cnr-cap" data-print=""><Ev label="Simulated"/><span>{t(T.cap)}</span></p>
  </div>;
}
